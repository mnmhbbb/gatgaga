import "server-only";

import { randomUUID } from "node:crypto";

import type { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../db/prisma";
import { requireCurrentUser } from "../auth";

import {
  createInvitationToken,
  hashInvitationToken,
  invitationTokenMatchesHash,
  isCanonicalInvitationToken,
} from "./invitation-crypto";
import { InvitationError } from "./invitation-error";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(value: string) {
  if (!UUID_PATTERN.test(value)) {
    throw new InvitationError("NOT_FOUND");
  }
}

async function lockSpace(transaction: Prisma.TransactionClient, spaceId: string) {
  const rows = await transaction.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "space"
    WHERE "id" = ${spaceId}::uuid
    FOR UPDATE
  `;

  if (rows.length === 0) {
    throw new InvitationError("NOT_FOUND");
  }
}

async function assertOwner(
  transaction: Prisma.TransactionClient,
  spaceId: string,
  userId: string,
) {
  const membership = await transaction.spaceMembership.findUnique({
    where: {
      spaceId_userId: { spaceId, userId },
    },
    select: {
      role: true,
      revokedAt: true,
    },
  });

  if (!membership || membership.revokedAt || membership.role !== "OWNER") {
    throw new InvitationError("FORBIDDEN");
  }
}

function toInvitePath(token: string) {
  return `/invite#${token}`;
}

async function createInvitationRecord(
  transaction: Prisma.TransactionClient,
  spaceId: string,
  userId: string,
) {
  const invitationId = randomUUID();
  const token = createInvitationToken(invitationId, spaceId);

  await transaction.spaceInvitation.create({
    data: {
      id: invitationId,
      spaceId,
      createdByUserId: userId,
      tokenHash: hashInvitationToken(token),
    },
  });

  return {
    invitationId,
    invitePath: toInvitePath(token),
  };
}

function toOwnerInvitation(invitation: {
  id: string;
  spaceId: string;
  tokenHash: Uint8Array;
}) {
  const token = createInvitationToken(invitation.id, invitation.spaceId);

  return {
    invitationId: invitation.id,
    invitePath: invitationTokenMatchesHash(token, invitation.tokenHash)
      ? toInvitePath(token)
      : null,
  };
}

export async function findActiveInvitationIdByToken(token: unknown) {
  if (!isCanonicalInvitationToken(token)) {
    return null;
  }

  const invitation = await prisma.spaceInvitation.findFirst({
    where: {
      tokenHash: hashInvitationToken(token),
      revokedAt: null,
    },
    select: { id: true },
  });

  return invitation?.id ?? null;
}

export async function getInvitationPreview(invitationId: string) {
  if (!UUID_PATTERN.test(invitationId)) {
    return null;
  }

  const invitation = await prisma.spaceInvitation.findFirst({
    where: {
      id: invitationId,
      revokedAt: null,
    },
    select: {
      id: true,
      space: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!invitation) {
    return null;
  }

  return {
    invitationId: invitation.id,
    spaceId: invitation.space.id,
    spaceName: invitation.space.name,
  };
}

export async function getOwnerInvitation(spaceId: string) {
  assertUuid(spaceId);
  const currentUser = await requireCurrentUser();
  const membership = await prisma.spaceMembership.findUnique({
    where: {
      spaceId_userId: { spaceId, userId: currentUser.id },
    },
    select: {
      role: true,
      revokedAt: true,
    },
  });

  if (!membership || membership.revokedAt || membership.role !== "OWNER") {
    throw new InvitationError("FORBIDDEN");
  }

  const invitation = await prisma.spaceInvitation.findFirst({
    where: { spaceId, revokedAt: null },
    select: { id: true, spaceId: true, tokenHash: true },
  });

  return invitation ? toOwnerInvitation(invitation) : null;
}

export async function getOrCreateInvitationLink(spaceId: string) {
  assertUuid(spaceId);
  const currentUser = await requireCurrentUser();

  return prisma.$transaction(async (transaction) => {
    await lockSpace(transaction, spaceId);
    await assertOwner(transaction, spaceId, currentUser.id);

    const activeInvitation = await transaction.spaceInvitation.findFirst({
      where: { spaceId, revokedAt: null },
      select: { id: true, spaceId: true, tokenHash: true },
    });

    if (activeInvitation) {
      return toOwnerInvitation(activeInvitation);
    }

    return createInvitationRecord(transaction, spaceId, currentUser.id);
  });
}

export async function revokeInvitation(
  spaceId: string,
  expectedInvitationId: string,
) {
  assertUuid(spaceId);
  assertUuid(expectedInvitationId);
  const currentUser = await requireCurrentUser();

  return prisma.$transaction(async (transaction) => {
    await lockSpace(transaction, spaceId);
    await assertOwner(transaction, spaceId, currentUser.id);

    const activeInvitation = await transaction.spaceInvitation.findFirst({
      where: { spaceId, revokedAt: null },
      select: { id: true },
    });

    if (!activeInvitation) {
      const expectedInvitation = await transaction.spaceInvitation.findUnique({
        where: { id: expectedInvitationId },
        select: { spaceId: true, revokedAt: true },
      });

      if (expectedInvitation?.spaceId === spaceId && expectedInvitation.revokedAt) {
        return;
      }

      throw new InvitationError("CONFLICT");
    }

    if (activeInvitation.id !== expectedInvitationId) {
      throw new InvitationError("CONFLICT");
    }

    await transaction.spaceInvitation.update({
      where: { id: expectedInvitationId },
      data: {
        revokedAt: new Date(),
        revokedByUserId: currentUser.id,
      },
    });
  });
}

export async function rotateInvitation(
  spaceId: string,
  expectedInvitationId: string,
) {
  assertUuid(spaceId);
  assertUuid(expectedInvitationId);
  const currentUser = await requireCurrentUser();

  return prisma.$transaction(async (transaction) => {
    await lockSpace(transaction, spaceId);
    await assertOwner(transaction, spaceId, currentUser.id);

    const activeInvitation = await transaction.spaceInvitation.findFirst({
      where: { spaceId, revokedAt: null },
      select: { id: true },
    });

    if (!activeInvitation || activeInvitation.id !== expectedInvitationId) {
      throw new InvitationError("CONFLICT");
    }

    await transaction.spaceInvitation.update({
      where: { id: expectedInvitationId },
      data: {
        revokedAt: new Date(),
        revokedByUserId: currentUser.id,
      },
    });

    return createInvitationRecord(transaction, spaceId, currentUser.id);
  });
}

export async function acceptInvitation(invitationId: string) {
  assertUuid(invitationId);
  const currentUser = await requireCurrentUser();
  const invitation = await prisma.spaceInvitation.findUnique({
    where: { id: invitationId },
    select: { spaceId: true },
  });

  if (!invitation) {
    throw new InvitationError("INVALID_INVITATION");
  }

  return prisma.$transaction(async (transaction) => {
    await lockSpace(transaction, invitation.spaceId);

    const [activeInvitation, user, membership] = await Promise.all([
      transaction.spaceInvitation.findFirst({
        where: { id: invitationId, revokedAt: null },
        select: { spaceId: true },
      }),
      transaction.user.findUnique({
        where: { id: currentUser.id },
        select: { disabledAt: true },
      }),
      transaction.spaceMembership.findUnique({
        where: {
          spaceId_userId: {
            spaceId: invitation.spaceId,
            userId: currentUser.id,
          },
        },
        select: { role: true, revokedAt: true },
      }),
    ]);

    if (!activeInvitation) {
      throw new InvitationError("INVALID_INVITATION");
    }

    if (!user || user.disabledAt) {
      throw new InvitationError("FORBIDDEN");
    }

    if (!membership) {
      await transaction.spaceMembership.create({
        data: {
          spaceId: invitation.spaceId,
          userId: currentUser.id,
          role: "MEMBER",
        },
      });
    } else if (membership.revokedAt) {
      await transaction.spaceMembership.update({
        where: {
          spaceId_userId: {
            spaceId: invitation.spaceId,
            userId: currentUser.id,
          },
        },
        data: {
          role: "MEMBER",
          revokedAt: null,
        },
      });
    }

    return { spaceId: invitation.spaceId };
  });
}

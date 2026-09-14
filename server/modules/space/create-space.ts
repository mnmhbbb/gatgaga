import "server-only";

import { prisma } from "../../db/prisma";
import { requireCurrentUser } from "../auth";

import { validateSpaceName } from "./space-name";

export class SpaceValidationError extends Error {
  constructor(readonly userMessage: string) {
    super(userMessage);
    this.name = "SpaceValidationError";
  }
}

export async function createSpace(nameInput: unknown) {
  const currentUser = await requireCurrentUser();
  const nameResult = validateSpaceName(nameInput);

  if (!nameResult.success) {
    throw new SpaceValidationError(nameResult.message);
  }

  return prisma.$transaction(async (transaction) => {
    const space = await transaction.space.create({
      data: {
        name: nameResult.name,
        visibility: "PRIVATE",
        createdByUserId: currentUser.id,
      },
      select: {
        id: true,
        name: true,
      },
    });

    await transaction.spaceMembership.create({
      data: {
        spaceId: space.id,
        userId: currentUser.id,
        role: "OWNER",
      },
    });

    return space;
  });
}

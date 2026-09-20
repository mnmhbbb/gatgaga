import "server-only";

import { cookies } from "next/headers";

import {
  createInvitationIntent,
  invitationIntentMaxAge,
  verifyInvitationIntent,
} from "./invitation-crypto";

export const invitationIntentCookieName = "gatgaga_invitation_intent";

const invitationIntentCookieOptions = {
  httpOnly: true,
  maxAge: invitationIntentMaxAge,
  path: "/invite",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function setInvitationIntentCookie(invitationId: string) {
  const cookieStore = await cookies();
  cookieStore.set(
    invitationIntentCookieName,
    createInvitationIntent(invitationId),
    invitationIntentCookieOptions,
  );
}

export async function getInvitationIntentId() {
  const cookieStore = await cookies();
  const value = cookieStore.get(invitationIntentCookieName)?.value;

  if (!value) {
    return null;
  }

  return verifyInvitationIntent(value)?.invitationId ?? null;
}

export async function clearInvitationIntentCookie() {
  const cookieStore = await cookies();
  cookieStore.set(invitationIntentCookieName, "", {
    ...invitationIntentCookieOptions,
    maxAge: 0,
  });
}

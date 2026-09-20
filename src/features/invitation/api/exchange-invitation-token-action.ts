"use server";

import {
  clearInvitationIntentCookie,
  findActiveInvitationIdByToken,
  setInvitationIntentCookie,
} from "@server/modules/invitation";

export async function exchangeInvitationTokenAction(token: string) {
  const invitationId = await findActiveInvitationIdByToken(token);

  if (!invitationId) {
    await clearInvitationIntentCookie();
    return { status: "invalid" } as const;
  }

  await setInvitationIntentCookie(invitationId);
  return { status: "success" } as const;
}

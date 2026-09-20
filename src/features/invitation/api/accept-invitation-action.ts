"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { CurrentUserError } from "@server/modules/auth";
import {
  acceptInvitation,
  clearInvitationIntentCookie,
  getInvitationIntentId,
  InvitationError,
} from "@server/modules/invitation";

import type { InvitationActionState } from "../model/invitation-action-state";

export async function acceptInvitationAction(
  _previousState: InvitationActionState,
  _formData: FormData,
): Promise<InvitationActionState> {
  void _previousState;
  void _formData;

  const invitationId = await getInvitationIntentId();

  if (!invitationId) {
    redirect("/invite/continue?invalid=1");
  }

  let destination: string | null = null;

  try {
    const { spaceId } = await acceptInvitation(invitationId);
    await clearInvitationIntentCookie();
    revalidatePath("/");
    destination = `/spaces/${spaceId}?joined=1`;
  } catch (error) {
    if (error instanceof InvitationError && error.code === "INVALID_INVITATION") {
      await clearInvitationIntentCookie();
      destination = "/invite/continue?invalid=1";
    } else if (error instanceof CurrentUserError && error.code === "UNAUTHENTICATED") {
      destination = "/invite/continue";
    } else if (
      (error instanceof CurrentUserError && error.code === "FORBIDDEN") ||
      (error instanceof InvitationError && error.code === "FORBIDDEN")
    ) {
      return {
        status: "error",
        message: "이 계정으로는 공간에 참여할 수 없어요.",
      };
    } else {
      console.error("초대 수락 중 예상하지 못한 오류가 발생했습니다.", error);
      return {
        status: "error",
        message: "공간에 참여하지 못했어요. 잠시 후 다시 시도해 주세요.",
      };
    }
  }

  redirect(destination);
}

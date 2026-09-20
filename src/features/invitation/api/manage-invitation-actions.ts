"use server";

import { CurrentUserError } from "@server/modules/auth";
import {
  getOrCreateInvitationLink,
  InvitationError,
  revokeInvitation,
  rotateInvitation,
} from "@server/modules/invitation";

interface InvitationLink {
  invitationId: string;
  invitePath: string | null;
}

type InvitationActionFailure = { status: "error"; message: string };

type InvitationLinkResult =
  | { status: "success"; invitation: InvitationLink }
  | InvitationActionFailure;

type RevokeInvitationResult =
  | { status: "success" }
  | InvitationActionFailure;

function invitationActionError(error: unknown): InvitationActionFailure {
  if (error instanceof CurrentUserError || error instanceof InvitationError) {
    if (error instanceof InvitationError && error.code === "CONFLICT") {
      return {
        status: "error",
        message: "다른 화면에서 초대 링크가 변경됐어요. 페이지를 새로고침해 주세요.",
      };
    }

    return {
      status: "error",
      message: "초대 링크를 관리할 권한이 없어요.",
    };
  }

  console.error("초대 링크 관리 중 예상하지 못한 오류가 발생했습니다.", error);
  return {
    status: "error",
    message: "초대 링크를 변경하지 못했어요. 잠시 후 다시 시도해 주세요.",
  };
}

export async function getOrCreateInvitationLinkAction(
  spaceId: string,
): Promise<InvitationLinkResult> {
  try {
    const invitation = await getOrCreateInvitationLink(spaceId);
    return { status: "success", invitation };
  } catch (error) {
    return invitationActionError(error);
  }
}

export async function revokeInvitationAction(
  spaceId: string,
  expectedInvitationId: string,
): Promise<RevokeInvitationResult> {
  try {
    await revokeInvitation(spaceId, expectedInvitationId);
    return { status: "success" };
  } catch (error) {
    return invitationActionError(error);
  }
}

export async function rotateInvitationAction(
  spaceId: string,
  expectedInvitationId: string,
): Promise<InvitationLinkResult> {
  try {
    const invitation = await rotateInvitation(spaceId, expectedInvitationId);
    return { status: "success", invitation };
  } catch (error) {
    return invitationActionError(error);
  }
}

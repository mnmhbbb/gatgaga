"use client";

import { useState, useTransition } from "react";

import {
  getOrCreateInvitationLinkAction,
  revokeInvitationAction,
  rotateInvitationAction,
} from "../api/manage-invitation-actions";

interface InvitationState {
  invitationId: string;
  invitePath: string | null;
}

interface InvitationManagerProps {
  initialError?: string;
  initialInvitation: InvitationState | null;
  spaceId: string;
}

export function InvitationManager({
  initialError,
  initialInvitation,
  spaceId,
}: InvitationManagerProps) {
  const [invitation, setInvitation] = useState(initialInvitation);
  const [message, setMessage] = useState<string | null>(initialError ?? null);
  const [isPending, startTransition] = useTransition();
  const canCopy = !invitation || invitation.invitePath !== null;

  const copyInvitePath = async (invitePath: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${invitePath}`);
      return true;
    } catch {
      return false;
    }
  };

  const copyInvitationLink = () => {
    if (invitation?.invitePath) {
      void copyInvitePath(invitation.invitePath).then((copied) => {
        setMessage(
          copied
            ? "초대 링크를 복사했어요."
            : "링크를 복사하지 못했어요. 브라우저 권한을 확인해 주세요.",
        );
      });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await getOrCreateInvitationLinkAction(spaceId);

      if (result.status === "success") {
        setInvitation(result.invitation);

        if (!result.invitation.invitePath) {
          setMessage(
            "기존 링크는 계속 사용할 수 있지만 다시 복사할 수 없어요. 필요하면 새 링크를 발급해 주세요.",
          );
          return;
        }

        const copied = await copyInvitePath(result.invitation.invitePath);
        setMessage(
          copied
            ? "초대 링크를 만들고 복사했어요."
            : "링크는 만들었지만 복사하지 못했어요. 다시 복사해 주세요.",
        );
      } else {
        setMessage(result.message);
      }
    });
  };

  const revoke = () => {
    if (
      !invitation ||
      !window.confirm("이 링크를 폐기하면 이미 공유한 링크도 사용할 수 없어요. 폐기할까요?")
    ) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await revokeInvitationAction(spaceId, invitation.invitationId);

      if (result.status === "success") {
        setInvitation(null);
        setMessage("초대 링크를 폐기했어요.");
      } else {
        setMessage(result.message);
      }
    });
  };

  const rotate = () => {
    if (
      !invitation ||
      !window.confirm("새 링크를 발급하면 기존 링크는 즉시 사용할 수 없어요. 계속할까요?")
    ) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await rotateInvitationAction(spaceId, invitation.invitationId);

      if (result.status === "success") {
        setInvitation(result.invitation);
        setMessage("새 초대 링크를 발급했어요.");
      } else {
        setMessage(result.message);
      }
    });
  };

  return (
    <section className="mt-6 rounded-3xl border border-line bg-canvas px-5 py-6">
      <p className="text-sm font-bold text-brand">친구 초대</p>
      <h2 className="mt-2 text-lg font-black text-ink">이 공간을 함께 채워보세요</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        초대 링크를 받은 사람은 공간 이름을 확인한 뒤 참여할 수 있어요.
      </p>

      <div className="mt-5 grid gap-3">
        {canCopy ? (
          <button
            type="button"
            disabled={isPending}
            onClick={copyInvitationLink}
            className="min-h-12 rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {isPending ? "링크 준비 중..." : "초대 링크 복사"}
          </button>
        ) : null}

        {invitation ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={revoke}
              className="min-h-11 rounded-2xl border border-line px-3 py-2 text-sm font-bold text-muted disabled:opacity-60"
            >
              링크 폐기
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={rotate}
              className="min-h-11 rounded-2xl border border-brand-border px-3 py-2 text-sm font-bold text-brand-strong disabled:opacity-60"
            >
              새 링크 발급
            </button>
          </div>
        ) : null}
      </div>

      {message ? (
        <p className="mt-3 text-sm leading-6 text-muted" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </section>
  );
}

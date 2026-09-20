"use client";

import { useActionState } from "react";

import { acceptInvitationAction } from "../api/accept-invitation-action";
import { initialInvitationActionState } from "../model/invitation-action-state";

export function AcceptInvitationForm() {
  const [state, formAction, isPending] = useActionState(
    acceptInvitationAction,
    initialInvitationActionState,
  );

  return (
    <form action={formAction} className="mt-8">
      <button
        type="submit"
        disabled={isPending}
        className="min-h-12 w-full rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "참여하는 중..." : "공간에 참여하기"}
      </button>
      {state.status === "error" ? (
        <p className="mt-3 text-sm leading-6 text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

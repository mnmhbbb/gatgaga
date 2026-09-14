"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createSpaceAction } from "../api/create-space-action";
import { INITIAL_CREATE_SPACE_FORM_STATE } from "../model/create-space-form-state";

export function CreateSpaceForm() {
  const router = useRouter();
  const submittedRef = useRef(false);
  const [name, setName] = useState("");
  const [state, formAction, isPending] = useActionState(
    createSpaceAction,
    INITIAL_CREATE_SPACE_FORM_STATE,
  );

  useEffect(() => {
    if (state.status === "success" && state.spaceId) {
      router.replace(`/spaces/${state.spaceId}?created=1`);
      return;
    }

    submittedRef.current = false;
  }, [router, state]);

  return (
    <form
      action={formAction}
      className="mt-10"
      onSubmit={(event) => {
        if (submittedRef.current) {
          event.preventDefault();
          return;
        }

        submittedRef.current = true;
      }}
    >
      <label htmlFor="space-name" className="text-sm font-bold text-ink">
        공간 이름
      </label>
      <input
        id="space-name"
        name="name"
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        autoComplete="off"
        autoFocus
        required
        aria-describedby={
          state.status === "error" ? "space-name-help space-name-error" : "space-name-help"
        }
        className="mt-3 min-h-12 w-full rounded-2xl border border-line bg-surface px-4 text-base text-ink outline-none transition focus:border-brand focus:ring-4 focus:ring-brand-soft"
        placeholder="예: 성수동 맛집"
      />
      <p id="space-name-help" className="mt-2 text-sm leading-6 text-muted">
        1~40자로 입력해 주세요.
      </p>

      {state.status === "error" ? (
        <p id="space-name-error" className="mt-3 text-sm leading-6 text-red-700" role="alert">
          {state.message}
        </p>
      ) : null}

      <div className="mt-8 rounded-2xl border border-brand-border bg-brand-soft p-4">
        <p className="text-sm font-bold text-brand-strong">Private 공간</p>
        <p className="mt-1 text-sm leading-6 text-brand-strong">
          초대 링크를 받은 사람만 참여할 수 있어요.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-8 min-h-12 w-full rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "공간 만드는 중..." : "공간 만들기"}
      </button>
    </form>
  );
}

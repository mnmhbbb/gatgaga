"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "../api/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignOut = async () => {
    setIsPending(true);
    setErrorMessage(null);

    try {
      const { error } = await authClient.signOut();

      if (error) {
        setErrorMessage("로그아웃하지 못했어요. 잠시 후 다시 시도해 주세요.");
        setIsPending(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setErrorMessage("로그아웃하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.");
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        className="min-h-11 rounded-xl px-3 text-sm font-bold text-muted transition-colors hover:bg-brand-soft hover:text-brand-strong disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onClick={handleSignOut}
      >
        {isPending ? "로그아웃 중..." : "로그아웃"}
      </button>
      {errorMessage ? (
        <p className="max-w-48 text-right text-xs leading-5 text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

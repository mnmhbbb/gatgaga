"use client";

import { useState } from "react";

import { authClient } from "../api/auth-client";

interface KakaoLoginButtonProps {
  initialErrorMessage?: string;
}

export function KakaoLoginButton({ initialErrorMessage }: KakaoLoginButtonProps) {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialErrorMessage ?? null,
  );

  const handleSignIn = async () => {
    setIsPending(true);
    setErrorMessage(null);

    try {
      const { error } = await authClient.signIn.social({
        provider: "kakao",
        callbackURL: "/",
        errorCallbackURL: "/?authError=kakao",
      });

      if (!error) {
        return;
      }

      setErrorMessage("카카오 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setIsPending(false);
    } catch {
      setErrorMessage("카카오에 연결하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.");
      setIsPending(false);
    }
  };

  return (
    <div className="mt-8">
      <button
        type="button"
        className="bg-kakao text-kakao-ink w-full rounded-2xl px-4 py-4 text-sm font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onClick={handleSignIn}
      >
        {isPending ? "카카오로 이동 중..." : "카카오로 시작하기"}
      </button>
      {errorMessage ? (
        <p className="mt-3 text-sm leading-6 text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

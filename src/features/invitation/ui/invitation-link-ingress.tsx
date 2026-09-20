"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useRef, useState } from "react";

import { exchangeInvitationTokenAction } from "../api/exchange-invitation-token-action";

export function InvitationLinkIngress() {
  const router = useRouter();
  const hasStarted = useRef(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;
    const token = window.location.hash.slice(1);
    window.history.replaceState(null, "", "/invite");

    startTransition(async () => {
      try {
        const result = await exchangeInvitationTokenAction(token);

        if (result.status === "success") {
          router.replace("/invite/continue");
          return;
        }
      } catch {
        // Network and server failures share the same non-disclosing recovery UI.
      }

      setHasError(true);
    });
  }, [router]);

  if (hasError) {
    return (
      <>
        <h1 className="mt-6 text-2xl font-black tracking-[-0.04em] text-ink">
          이 초대 링크를 사용할 수 없어요
        </h1>
        <p className="mt-3 text-base leading-7 text-muted">
          링크가 바뀌었거나 올바르지 않아요. 초대한 사람에게 새 링크를 받아 주세요.
        </p>
        <Link
          href="/"
          className="mt-8 flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white"
        >
          처음으로
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="mt-6 text-2xl font-black tracking-[-0.04em] text-ink">
        초대 링크를 확인하고 있어요
      </h1>
      <p className="mt-3 text-base leading-7 text-muted">잠시만 기다려 주세요.</p>
    </>
  );
}

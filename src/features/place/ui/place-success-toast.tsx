"use client";

import { useEffect, useState } from "react";

export function PlaceSuccessToast({ message, closeLabel }: { message: string; closeLabel: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 3_000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return <div className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-[398px] items-center gap-3 rounded-2xl bg-ink px-4 py-2 text-sm font-bold text-white shadow-lg">
    <p role="status" className="min-w-0 flex-1">{message}</p>
    <button type="button" aria-label={closeLabel} onClick={() => setVisible(false)} className="min-h-11 shrink-0 px-2">닫기</button>
  </div>;
}

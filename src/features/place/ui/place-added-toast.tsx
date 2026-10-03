"use client";

import { useEffect, useState } from "react";

export function PlaceAddedToast({ name }: { name: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 3_000);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;
  return <div className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 mx-auto flex max-w-[398px] items-center gap-3 rounded-2xl bg-ink px-4 py-2 text-sm font-bold text-white shadow-lg">
    <p role="status" className="min-w-0 flex-1">이 공간에 추가했어요: {name}</p>
    <button type="button" aria-label="추가 완료 알림 닫기" onClick={() => setVisible(false)} className="min-h-11 shrink-0 px-2">닫기</button>
  </div>;
}

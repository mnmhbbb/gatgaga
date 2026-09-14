"use client";

import { useEffect, useState } from "react";

export function SpaceCreatedToast({ visible }: { visible: boolean }) {
  const [isVisible, setIsVisible] = useState(visible);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timeoutId = window.setTimeout(() => setIsVisible(false), 3_000);

    return () => window.clearTimeout(timeoutId);
  }, [visible]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 mx-auto max-w-[398px] rounded-2xl bg-ink px-4 py-3 text-center text-sm font-bold text-white shadow-lg"
      role="status"
    >
      공간을 만들었어요.
    </div>
  );
}

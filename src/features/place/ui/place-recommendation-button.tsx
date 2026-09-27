"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { recommendPlaceAction } from "../api/recommend-place-action";

type Props = {
  spaceId: string;
  spacePlaceId: string;
  recommendedByCurrentUser: boolean;
};

export function PlaceRecommendationButton({ spaceId, spacePlaceId, recommendedByCurrentUser }: Props) {
  const router = useRouter();
  const [locallyRecommended, setLocallyRecommended] = useState(false);
  const recommended = recommendedByCurrentUser || locallyRecommended;
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function recommend() {
    if (recommended || isPending) return;
    setError("");

    startTransition(async () => {
      const result = await recommendPlaceAction(spaceId, spacePlaceId);

      if (result.status === "CREATED" || result.status === "ALREADY_RECOMMENDED") {
        setLocallyRecommended(true);
      } else if (result.status === "UNAUTHENTICATED") {
        router.push("/");
      } else if (result.status === "NOT_FOUND" || result.status === "FORBIDDEN") {
        setError("이 장소를 추천할 권한이 없어요. 화면을 새로고침해 주세요.");
      } else {
        setError("추천을 저장하지 못했어요. 다시 시도해 주세요.");
      }
    });
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={recommend}
        disabled={recommended || isPending}
        className="min-h-11 rounded-xl border border-brand px-4 py-2 text-sm font-bold text-brand disabled:cursor-default disabled:border-line disabled:text-muted"
      >
        {isPending ? "추천하는 중..." : recommended ? "추천했어요" : "추천하기"}
      </button>
      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

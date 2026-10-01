"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addPlaceAction } from "../api/add-place-action";
import { loadKakaoMaps, type KakaoPlaceResult } from "../lib/kakao-maps";
import { PlaceMap } from "./place-map";
import { ManualPlaceForm } from "./manual-place-form";

type Candidate = {
  providerPlaceId: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  externalUrl?: string;
};

function toCandidate(place: KakaoPlaceResult): Candidate {
  return {
    providerPlaceId: place.id,
    name: place.place_name,
    category: place.category_group_name || place.category_name.split(" > ").at(-1) || "",
    address: place.road_address_name || place.address_name,
    latitude: Number(place.y),
    longitude: Number(place.x),
    externalUrl: place.place_url || undefined,
  };
}

export function PlaceSearch({ spaceId }: { spaceId: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [manual, setManual] = useState(false);
  const [results, setResults] = useState<Candidate[]>([]);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");
  const [restoreRequired, setRestoreRequired] = useState(false);
  const [isSaving, startSaving] = useTransition();

  async function search() {
    const term = query.trim();
    if (!term || searchStatus === "loading") return;
    setSearchStatus("loading");
    setError("");

    try {
      const kakao = await loadKakaoMaps();
      const places = new kakao.maps.services.Places();
      const items = await new Promise<Candidate[]>((resolve, reject) => {
        places.keywordSearch(term, (found, status) => {
          if (status === kakao.maps.services.Status.OK) resolve(found.map(toCandidate));
          else if (status === kakao.maps.services.Status.ZERO_RESULT) resolve([]);
          else reject(new Error("장소 검색에 실패했어요. 다시 시도해 주세요."));
        });
      });
      setResults(items);
      setSearchedQuery(term);
      setSearchStatus("done");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "장소 검색에 실패했어요.");
      setSearchStatus("idle");
    }
  }

  function save() {
    if (!selected || isSaving) return;
    setError("");
    setRestoreRequired(false);
    startSaving(async () => {
      const result = await addPlaceAction(spaceId, selected);
      if (result.status === "CREATED" || result.status === "EXISTING") {
        router.push(`/spaces/${spaceId}/places/${result.spacePlaceId}?added=${result.status === "CREATED" ? "1" : "0"}`);
      } else if (result.status === "RESTORE_REQUIRED") {
        setRestoreRequired(true);
      } else if (result.status === "UNAUTHENTICATED") {
        router.push("/");
      } else if (result.status === "NOT_FOUND" || result.status === "FORBIDDEN") {
        setError("이 공간에 장소를 추가할 권한이 없어요.");
      } else {
        setError(result.status === "VALIDATION_ERROR" ? result.message : "장소를 추가하지 못했어요. 다시 시도해 주세요.");
      }
    });
  }

  if (manual) return <ManualPlaceForm spaceId={spaceId} initialName={searchedQuery} onBack={() => setManual(false)} />;

  return (
    <div className="mx-auto min-h-svh w-full max-w-[430px] bg-surface px-6 py-8">
      <header className="flex items-center gap-3">
        {selected ? (
          <button type="button" onClick={() => { setSelected(null); setError(""); setRestoreRequired(false); }} className="min-h-11 text-sm font-bold text-brand">검색 결과</button>
        ) : (
          <Link href={`/spaces/${spaceId}`} className="flex min-h-11 items-center text-sm font-bold text-brand">공간으로</Link>
        )}
        <h1 className="text-xl font-black text-ink">{selected ? "장소 확인" : "장소 추가"}</h1>
      </header>

      {selected ? (
        <section className="mt-8">
          <PlaceMap name={selected.name} latitude={selected.latitude} longitude={selected.longitude} />
          <p className="mt-5 text-xs font-bold text-brand">Kakao Maps 장소</p>
          <h2 className="mt-1 text-xl font-black text-ink">{selected.name}</h2>
          <p className="mt-2 text-sm text-muted">{selected.category}</p>
          <p className="mt-2 text-sm text-muted">{selected.address}</p>
          {selected.externalUrl ? <a href={selected.externalUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-brand">카카오맵에서 보기</a> : null}
          {restoreRequired ? <p role="alert" className="mt-5 rounded-2xl bg-brand-soft p-4 text-sm text-brand-strong">이 공간에서 제거된 장소예요. 자동으로 다시 추가할 수 없어요. 공간 Owner에게 복구를 요청해 주세요.</p> : null}
          {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
          <button type="button" onClick={save} disabled={isSaving || restoreRequired} className="mt-8 min-h-12 w-full rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
            {isSaving ? "추가하는 중..." : "이 장소 추가"}
          </button>
        </section>
      ) : (
        <section className="mt-8">
          <form onSubmit={(event) => { event.preventDefault(); void search(); }} className="flex gap-2">
            <label className="sr-only" htmlFor="place-query">장소명 또는 지역과 장소명</label>
            <input id="place-query" autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setError(""); }} placeholder="장소명 또는 지역 + 장소명" className="min-h-12 min-w-0 flex-1 rounded-2xl border border-line px-4 text-base outline-none focus:border-brand" />
            <button type="submit" disabled={!query.trim() || searchStatus === "loading"} className="min-h-12 rounded-2xl bg-brand px-4 text-sm font-bold text-white disabled:opacity-60">검색</button>
          </form>
          {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
          {searchStatus === "loading" ? <p role="status" className="mt-8 text-sm text-muted">장소를 검색하는 중...</p> : null}
          {searchStatus === "done" ? (
            <div className="mt-7">
              <h2 className="text-sm font-bold text-ink">검색 결과 {results.length}</h2>
              {results.length === 0 ? <div className="mt-5">
                <p className="text-sm text-muted">검색 결과가 없어요. 다른 지역이나 장소명을 검색하거나 직접 등록해 주세요.</p>
                <button type="button" onClick={() => setManual(true)} className="mt-4 min-h-12 w-full rounded-2xl border border-brand px-4 text-sm font-bold text-brand">직접 등록하기</button>
              </div> : (
                <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
                  {results.map((place) => <li key={place.providerPlaceId}>
                    <button type="button" onClick={() => { setSelected(place); setError(""); }} className="w-full px-4 py-4 text-left">
                      <strong className="block text-base text-ink">{place.name}</strong>
                      <span className="mt-1 block text-xs text-brand">{place.category}</span>
                      <span className="mt-1 block text-xs text-muted">{place.address}</span>
                    </button>
                  </li>)}
                </ul>
              )}
            </div>
          ) : null}
          {searchStatus === "idle" && !error ? <p className="mt-12 text-center text-sm text-muted">지역과 장소명을 함께 검색해 보세요.</p> : null}
        </section>
      )}
    </div>
  );
}

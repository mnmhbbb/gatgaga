"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";

import { addManualPlaceAction } from "../api/add-manual-place-action";
import { searchLocation, type LocationCandidate } from "../lib/search-location";
import { PlaceMap } from "./place-map";

export function ManualPlaceForm({ spaceId, initialName, onBack }: {
  spaceId: string; initialName: string; onBack: () => void;
}) {
  const router = useRouter();
  const placeId = useRef<string | null>(null);
  const [name, setName] = useState(initialName);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationCandidate[]>([]);
  const [selected, setSelected] = useState<LocationCandidate | null>(null);
  const [searchStatus, setSearchStatus] = useState<"idle" | "loading" | "done">("idle");
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState("");
  const [restoreRequired, setRestoreRequired] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const handleMapReady = useCallback(() => setMapReady(true), []);

  async function search() {
    if (!query.trim() || searchStatus === "loading" || isSaving) return;
    setSearchStatus("loading");
    setSelected(null);
    setMapReady(false);
    setError("");
    try {
      setResults(await searchLocation(query.trim()));
      setSearchStatus("done");
    } catch (cause) {
      setSearchStatus("idle");
      setError(cause instanceof Error ? cause.message : "위치를 검색하지 못했어요.");
    }
  }

  function save() {
    if (!name.trim() || name.trim().length > 200 || !selected || !mapReady || isSaving || restoreRequired) return;
    // 저장 응답이 유실돼도 재시도에는 같은 ID를 보낸다.
    placeId.current ??= crypto.randomUUID();
    const candidate = { placeId: placeId.current, name, ...selected };
    setError("");
    startSaving(async () => {
      try {
        const result = await addManualPlaceAction(spaceId, candidate);
        if (result.status === "CREATED" || result.status === "EXISTING") {
          router.push(`/spaces/${spaceId}/places/${result.spacePlaceId}?added=${result.status === "CREATED" ? "1" : "0"}`);
        } else if (result.status === "UNAUTHENTICATED") {
          router.push("/");
        } else if (result.status === "RESTORE_REQUIRED") {
          setRestoreRequired(true);
          setError("이 공간에서 제거된 장소예요. 공간 Owner에게 복구를 요청해 주세요.");
        } else if (result.status === "NOT_FOUND" || result.status === "FORBIDDEN") {
          setError("이 공간에 장소를 추가할 수 없어요. 공간과 참여 상태를 확인해 주세요.");
        } else {
          setError(result.status === "VALIDATION_ERROR" ? result.message : "장소를 추가하지 못했어요. 다시 시도해 주세요.");
        }
      } catch {
        setError("저장 결과를 확인하지 못했어요. 연결을 확인하고 다시 시도해 주세요.");
      }
    });
  }

  return <div className="mx-auto min-h-svh w-full max-w-[430px] bg-surface px-6 py-8">
    <header className="flex items-center gap-3">
      <button type="button" disabled={isSaving} onClick={onBack} className="min-h-11 text-sm font-bold text-brand disabled:opacity-60">검색 결과</button>
      <h1 className="text-xl font-black text-ink">직접 등록</h1>
    </header>
    <section className="mt-8">
      <p className="text-xs font-bold text-brand">직접 등록한 장소</p>
      <label htmlFor="manual-place-name" className="mt-5 block text-sm font-bold text-ink">장소명</label>
      <input id="manual-place-name" autoFocus maxLength={200} disabled={isSaving} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-line px-4 text-base outline-none focus:border-brand" />
      <form onSubmit={(event) => { event.preventDefault(); void search(); }} className="mt-6">
        <label htmlFor="manual-location-query" className="block text-sm font-bold text-ink">주소 또는 지역·근처 장소</label>
        <div className="mt-2 flex gap-2">
          <input id="manual-location-query" value={query} disabled={isSaving || searchStatus === "loading"} onChange={(event) => {
            setQuery(event.target.value); setSelected(null); setMapReady(false); setSearchStatus("idle"); setError("");
          }} placeholder="예: 성수동 연무장길 10" className="min-h-12 min-w-0 flex-1 rounded-2xl border border-line px-4 text-base outline-none focus:border-brand" />
          <button type="submit" disabled={!query.trim() || isSaving || searchStatus === "loading"} className="min-h-12 rounded-2xl bg-brand px-4 text-sm font-bold text-white disabled:opacity-60">위치 검색</button>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">주소를 검색하거나 근처 장소로 위치를 찾아보세요. 선택한 핀이 등록할 장소의 위치인지 확인해 주세요.</p>
      </form>
      {searchStatus === "loading" ? <p role="status" className="mt-5 text-sm text-muted">위치를 검색하는 중...</p> : null}
      {searchStatus === "done" && !selected ? <div className="mt-5">
        {results.length ? <ul className="divide-y divide-line rounded-2xl border border-line">
          {results.map((location, index) => <li key={`${location.latitude}:${location.longitude}:${index}`}>
            <button type="button" disabled={isSaving} onClick={() => { setSelected(location); setMapReady(false); setError(""); }} className="w-full px-4 py-4 text-left">
              <strong className="block text-sm text-ink">{location.label}</strong>
              {location.label !== location.address ? <span className="mt-1 block text-xs text-muted">{location.address}</span> : null}
            </button>
          </li>)}
        </ul> : <p role="status" className="text-sm text-muted">위치 검색 결과가 없어요. 상세 주소나 근처 장소명을 입력해 주세요.</p>}
      </div> : null}
      {selected ? <div className="mt-6">
        <PlaceMap name={name || "선택한 위치"} latitude={selected.latitude} longitude={selected.longitude} onReady={handleMapReady} />
        <p className="mt-3 text-sm text-ink">{selected.address}</p>
        <button type="button" disabled={isSaving} onClick={() => { setSelected(null); setMapReady(false); }} className="min-h-11 text-sm font-bold text-brand">다른 위치 선택</button>
      </div> : null}
      {error ? <p role="alert" className="mt-4 text-sm text-red-700">{error}</p> : null}
      <button type="button" onClick={save} disabled={!name.trim() || name.trim().length > 200 || !selected || !mapReady || isSaving || restoreRequired} className="mt-8 min-h-12 w-full rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white disabled:opacity-60">
        {isSaving ? "추가하는 중..." : "장소 추가"}
      </button>
    </section>
  </div>;
}

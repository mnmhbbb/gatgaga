"use client";

import { useEffect, useRef, useState } from "react";

import { loadKakaoMaps } from "../lib/kakao-maps";

export function PlaceMap({ name, latitude, longitude, onReady }: { name: string; latitude: number; longitude: number; onReady?: () => void }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!mapRef.current) return;
    const element = mapRef.current;
    let active = true;
    loadKakaoMaps().then((kakao) => {
      if (!active) return;
      const position = new kakao.maps.LatLng(latitude, longitude);
      const map = new kakao.maps.Map(element, { center: position, level: 3 });
      new kakao.maps.Marker({ map, position });
      onReady?.();
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [latitude, longitude, onReady, attempt]);

  return <div>
    <div ref={mapRef} role="img" aria-label={`${name} 위치 지도`} className="h-52 rounded-2xl bg-brand-soft" />
    {failed ? <div className="mt-2 text-sm text-muted">
      <p role="alert">지도를 표시하지 못했어요. 다시 불러와 주세요.</p>
      <button type="button" className="min-h-11 font-bold text-brand" onClick={() => { setFailed(false); setAttempt((value) => value + 1); }}>지도 다시 불러오기</button>
    </div> : null}
  </div>;
}

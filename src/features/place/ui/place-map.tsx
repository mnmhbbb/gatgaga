"use client";

import { useEffect, useRef, useState } from "react";

import { loadKakaoMaps } from "../lib/kakao-maps";

export function PlaceMap({ name, latitude, longitude }: { name: string; latitude: number; longitude: number }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;
    const element = mapRef.current;
    let active = true;
    loadKakaoMaps().then((kakao) => {
      if (!active) return;
      const position = new kakao.maps.LatLng(latitude, longitude);
      const map = new kakao.maps.Map(element, { center: position, level: 3 });
      new kakao.maps.Marker({ map, position });
    }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [latitude, longitude]);

  return <div>
    <div ref={mapRef} role="img" aria-label={`${name} 위치 지도`} className="h-52 rounded-2xl bg-brand-soft" />
    {failed ? <p role="status" className="mt-2 text-sm text-muted">지도를 표시하지 못했어요. 아래 주소를 확인해 주세요.</p> : null}
  </div>;
}

export type KakaoPlaceResult = {
  id: string;
  place_name: string;
  category_name: string;
  category_group_name: string;
  address_name: string;
  road_address_name: string;
  place_url: string;
  x: string;
  y: string;
};

type KakaoMaps = {
  maps: {
    load: (callback: () => void) => void;
    LatLng: new (latitude: number, longitude: number) => unknown;
    Map: new (element: HTMLElement, options: { center: unknown; level: number }) => unknown;
    Marker: new (options: { map: unknown; position: unknown }) => unknown;
    services: {
      Places: new () => {
        keywordSearch: (query: string, callback: (results: KakaoPlaceResult[], status: string) => void) => void;
      };
      Status: { OK: string; ZERO_RESULT: string };
    };
  };
};

declare global {
  interface Window {
    kakao?: KakaoMaps;
  }
}

let loading: Promise<KakaoMaps> | undefined;

export function loadKakaoMaps(): Promise<KakaoMaps> {
  const key = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY?.trim();
  if (!key) return Promise.reject(new Error("Kakao 지도 키가 설정되지 않았어요."));
  if (loading) return loading;

  loading = new Promise<KakaoMaps>((resolve, reject) => {
    const onLoad = () => {
      if (!window.kakao) return reject(new Error("Kakao 지도를 불러오지 못했어요."));
      window.kakao.maps.load(() => resolve(window.kakao!));
    };

    if (window.kakao) return onLoad();

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(key)}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = onLoad;
    script.onerror = () => reject(new Error("Kakao 지도를 불러오지 못했어요."));
    document.head.append(script);
  }).catch((error) => {
    loading = undefined;
    throw error;
  });

  return loading;
}

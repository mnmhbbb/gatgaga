import { loadKakaoMaps } from "./kakao-maps";

export type LocationCandidate = {
  label: string;
  address: string;
  latitude: number;
  longitude: number;
};

export async function searchLocation(query: string): Promise<LocationCandidate[]> {
  const kakao = await loadKakaoMaps();
  const { Status } = kakao.maps.services;
  const addresses = await new Promise<LocationCandidate[]>((resolve, reject) => {
    new kakao.maps.services.Geocoder().addressSearch(query, (results, status) => {
      if (status === Status.OK) resolve(results.map((item) => ({
        label: item.road_address?.address_name || item.address_name,
        address: item.road_address?.address_name || item.address_name,
        latitude: Number(item.y), longitude: Number(item.x),
      })));
      else if (status === Status.ZERO_RESULT) resolve([]);
      else reject(new Error("주소 검색에 실패했어요. 다시 시도해 주세요."));
    });
  });
  if (addresses.length) return addresses;

  return new Promise((resolve, reject) => {
    new kakao.maps.services.Places().keywordSearch(query, (results, status) => {
      if (status === Status.OK) resolve(results.map((item) => ({
        label: item.place_name,
        address: item.road_address_name || item.address_name,
        latitude: Number(item.y), longitude: Number(item.x),
      })));
      else if (status === Status.ZERO_RESULT) resolve([]);
      else reject(new Error("위치 검색에 실패했어요. 다시 시도해 주세요."));
    });
  });
}

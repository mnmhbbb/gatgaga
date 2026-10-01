export type KakaoPlaceCandidate = {
  providerPlaceId: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  externalUrl?: string;
};

export class PlaceInputError extends Error {
  constructor(message = "장소 정보를 확인할 수 없어요. 다시 검색해 주세요.") {
    super(message);
    this.name = "PlaceInputError";
  }
}

export type ManualPlaceCandidate = {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export function validateManualPlaceCandidate(input: unknown): ManualPlaceCandidate {
  const fail = () => new PlaceInputError("장소명과 선택한 위치를 확인해 주세요.");
  if (!input || typeof input !== "object") throw fail();
  const value = input as Record<string, unknown>;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const address = typeof value.address === "string" ? value.address.trim() : "";
  const { placeId, latitude, longitude } = value;
  if (
    typeof placeId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(placeId) ||
    !name || name.length > 200 || !address || address.length > 500 ||
    typeof latitude !== "number" || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
    typeof longitude !== "number" || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
  ) throw fail();
  return { placeId, name, address, latitude, longitude };
}

export function validateKakaoPlaceCandidate(input: unknown): KakaoPlaceCandidate {
  if (!input || typeof input !== "object") throw new PlaceInputError();

  const value = input as Record<string, unknown>;
  const providerPlaceId = value.providerPlaceId;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  const category = typeof value.category === "string" ? value.category.trim() : "";
  const address = typeof value.address === "string" ? value.address.trim() : "";
  const latitude = value.latitude;
  const longitude = value.longitude;
  const externalUrl = value.externalUrl;

  if (
    typeof providerPlaceId !== "string" ||
    !/^\d{1,100}$/.test(providerPlaceId) ||
    !name || name.length > 200 ||
    category.length > 200 ||
    !address || address.length > 500 ||
    typeof latitude !== "number" || !Number.isFinite(latitude) ||
    latitude < -90 || latitude > 90 ||
    typeof longitude !== "number" || !Number.isFinite(longitude) ||
    longitude < -180 || longitude > 180 ||
    (externalUrl !== undefined &&
      (typeof externalUrl !== "string" || externalUrl.length > 2048 ||
        !/^https?:\/\/place\.map\.kakao\.com\/\d+\/?$/.test(externalUrl)))
  ) {
    throw new PlaceInputError();
  }

  return { providerPlaceId, name, category, address, latitude, longitude, externalUrl: externalUrl as string | undefined };
}

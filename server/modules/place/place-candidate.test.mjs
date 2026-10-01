import assert from "node:assert/strict";
import test from "node:test";

import { PlaceInputError, validateKakaoPlaceCandidate, validateManualPlaceCandidate } from "./place-candidate.ts";

const candidate = {
  providerPlaceId: "123456",
  name: " 식당 ",
  category: "음식점",
  address: "서울",
  latitude: 37.5,
  longitude: 127,
  externalUrl: "https://place.map.kakao.com/123456",
};

test("Kakao 장소 후보의 저장 필드만 정규화한다", () => {
  assert.deepEqual(validateKakaoPlaceCandidate({ ...candidate, ignored: "extra" }), {
    ...candidate,
    name: "식당",
  });
});

test("변조된 장소 ID, 좌표와 외부 URL을 거부한다", () => {
  for (const invalid of [
    { ...candidate, providerPlaceId: "manual-1" },
    { ...candidate, latitude: Number.NaN },
    { ...candidate, longitude: 181 },
    { ...candidate, externalUrl: "javascript:alert(1)" },
  ]) {
    assert.throws(() => validateKakaoPlaceCandidate(invalid), PlaceInputError);
  }
});

const manual = {
  placeId: "ac1da49e-c29e-4c45-a9e3-d0e4d4521686",
  name: " 나의 장소 ", address: " 서울 ", latitude: 37.5, longitude: 127,
};

test("직접 등록은 필수 위치를 정규화하고 출처·등록자·Kakao ID 입력을 버린다", () => {
  assert.deepEqual(validateManualPlaceCandidate({
    ...manual, sourceType: "KAKAO", createdByUserId: "other", providerPlaceId: "123", externalUrl: "https://example.com",
  }), { ...manual, name: "나의 장소", address: "서울" });
});

test("직접 등록의 잘못된 ID·빈 이름·미선택 위치·범위 밖 좌표를 거부한다", () => {
  for (const value of [
    null, {}, { ...manual, placeId: "not-a-uuid" },
    { ...manual, name: " " }, { ...manual, name: "가".repeat(201) },
    { ...manual, address: "" }, { ...manual, address: "가".repeat(501) },
    { ...manual, latitude: undefined }, { ...manual, latitude: "37.5" },
    { ...manual, latitude: NaN }, { ...manual, longitude: Infinity },
    { ...manual, latitude: 91 }, { ...manual, latitude: -91 },
    { ...manual, longitude: 181 }, { ...manual, longitude: -181 },
  ]) assert.throws(() => validateManualPlaceCandidate(value), PlaceInputError);
});

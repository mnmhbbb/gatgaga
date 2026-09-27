import assert from "node:assert/strict";
import test from "node:test";

import { PlaceInputError, validateKakaoPlaceCandidate } from "./place-candidate.ts";

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

import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "./kakao-maps") return nextResolve("./kakao-maps.ts", context);
    return nextResolve(specifier, context);
  },
});
const { searchLocation } = await import("./search-location.ts");
hooks.deregister();

test("직접 등록 위치 검색의 주소·근처 장소·0건·오류 분기", async (t) => {
  const previousWindow = globalThis.window;
  const previousKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
  let addressResults = [];
  let addressStatus = "ZERO_RESULT";
  let placeResults = [];
  let placeStatus = "ZERO_RESULT";
  let placeSearches = 0;
  process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY = "test-key";
  globalThis.window = { kakao: { maps: {
    load: (callback) => callback(),
    services: {
      Status: { OK: "OK", ZERO_RESULT: "ZERO_RESULT" },
      Geocoder: class { addressSearch(query, callback) { callback(addressResults, addressStatus); } },
      Places: class { keywordSearch(query, callback) { placeSearches++; callback(placeResults, placeStatus); } },
    },
  } } };
  try {
    await t.test("주소 결과의 도로명 주소와 좌표를 사용한다", async () => {
      addressStatus = "OK";
      addressResults = [{ address_name: "지번 주소", road_address: { address_name: "도로명 주소" }, x: "127", y: "37.5" }];
      assert.deepEqual(await searchLocation("주소"), [{ label: "도로명 주소", address: "도로명 주소", latitude: 37.5, longitude: 127 }]);
      assert.equal(placeSearches, 0);
    });
    await t.test("주소가 없으면 근처 장소를 위치 후보로만 사용한다", async () => {
      addressStatus = "ZERO_RESULT";
      placeStatus = "OK";
      placeResults = [{ id: "123", place_name: "근처 카페", address_name: "지번 주소", road_address_name: "", x: "127", y: "37.5" }];
      assert.deepEqual(await searchLocation("근처 카페"), [{ label: "근처 카페", address: "지번 주소", latitude: 37.5, longitude: 127 }]);
    });
    await t.test("두 검색이 모두 0건이면 빈 후보를 반환한다", async () => {
      placeStatus = "ZERO_RESULT";
      assert.deepEqual(await searchLocation("없는 주소"), []);
    });
    await t.test("검색 장애는 0건으로 숨기지 않는다", async () => {
      addressStatus = "ERROR";
      await assert.rejects(searchLocation("주소"), /주소 검색에 실패/);
      addressStatus = "ZERO_RESULT";
      placeStatus = "ERROR";
      await assert.rejects(searchLocation("근처 장소"), /위치 검색에 실패/);
    });
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousKey === undefined) delete process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY;
    else process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY = previousKey;
  }
});

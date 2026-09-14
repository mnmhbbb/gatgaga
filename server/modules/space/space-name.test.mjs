import assert from "node:assert/strict";
import test from "node:test";

import { validateSpaceName } from "./space-name.ts";

test("공간 이름의 앞뒤 공백을 제거한다", () => {
  assert.deepEqual(validateSpaceName("  성수동 맛집  "), {
    success: true,
    name: "성수동 맛집",
  });
});

test("빈 이름을 거부한다", () => {
  assert.deepEqual(validateSpaceName("   "), {
    success: false,
    message: "공간 이름을 입력해 주세요.",
  });
});

test("40자를 넘는 이름을 거부한다", () => {
  assert.deepEqual(validateSpaceName("가".repeat(41)), {
    success: false,
    message: "공간 이름은 40자 이하로 입력해 주세요.",
  });
});

test("이모지를 유니코드 코드 포인트 단위로 센다", () => {
  assert.deepEqual(validateSpaceName("🙂".repeat(40)), {
    success: true,
    name: "🙂".repeat(40),
  });
});

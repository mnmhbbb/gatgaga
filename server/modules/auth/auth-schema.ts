import { betterAuth } from "better-auth";

import { authModelOptions } from "./auth-model-options";

/**
 * Better Auth CLI가 코어 Prisma 모델을 생성할 때 읽는 스키마 전용 설정이다.
 * Kakao Provider와 실제 DB adapter는 인증 세로 기능에서 별도 runtime 설정으로 연결한다.
 */
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  ...authModelOptions,
});

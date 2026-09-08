import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";

import { prisma } from "../../db/prisma";
import { authModelOptions } from "./auth-model-options";

const REQUIRED_AUTH_ENV_NAMES = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "KAKAO_CLIENT_ID",
  "KAKAO_CLIENT_SECRET",
] as const;

type AuthEnvName = (typeof REQUIRED_AUTH_ENV_NAMES)[number];

function readRequiredAuthEnv(): Record<AuthEnvName, string> {
  const entries = REQUIRED_AUTH_ENV_NAMES.map((name) => {
    const value = process.env[name]?.trim();

    if (!value) {
      throw new Error(`${name} 환경 변수가 필요합니다.`);
    }

    return [name, value] as const;
  });

  return Object.fromEntries(entries) as Record<AuthEnvName, string>;
}

function createAuth() {
  const env = readRequiredAuthEnv();

  return betterAuth({
    appName: "같가가",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: prismaAdapter(prisma, {
      provider: "postgresql",
      transaction: true,
    }),
    socialProviders: {
      kakao: {
        clientId: env.KAKAO_CLIENT_ID,
        clientSecret: env.KAKAO_CLIENT_SECRET,
        // Kakao Developers의 필수/선택 동의 설정을 그대로 사용한다.
        // Better Auth 기본 scope를 보내면 거절한 선택 항목을 재로그인마다 다시 요청한다.
        disableDefaultScope: true,
      },
    },
    ...authModelOptions,
  });
}

let authInstance: ReturnType<typeof createAuth> | undefined;

/**
 * 인증 요청이 처음 들어올 때 환경 변수를 검증하고 Runtime을 한 번만 만든다.
 * 빌드 환경에는 OAuth 비밀값이 없어도 되지만 실제 인증 요청에는 반드시 필요하다.
 */
export function getAuth() {
  authInstance ??= createAuth();

  return authInstance;
}

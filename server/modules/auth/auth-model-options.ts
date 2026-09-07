import type { BetterAuthOptions } from "better-auth";

/**
 * Better Auth CLI용 schema 설정과 실제 Runtime이 함께 사용하는 인증 Model 기준이다.
 * 필드를 바꿀 때는 CLI diff와 Prisma migration을 함께 검토한다.
 */
export const authModelOptions = {
  user: {
    additionalFields: {
      disabledAt: {
        type: "date",
        required: false,
        input: false,
        returned: false,
      },
    },
  },
  account: {
    accountLinking: {
      enabled: false,
      disableImplicitLinking: true,
      allowDifferentEmails: false,
      allowUnlinkingAll: false,
    },
    encryptOAuthTokens: true,
  },
  advanced: {
    database: {
      generateId: "uuid",
      joins: true,
    },
  },
} satisfies BetterAuthOptions;

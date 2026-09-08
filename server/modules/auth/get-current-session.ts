import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { getAuth } from "./auth";

/**
 * 현재 요청의 Better Auth 세션을 읽는다.
 * 같은 서버 렌더 안에서 중복 조회하지 않도록 요청 단위로 메모이제이션한다.
 */
export const getCurrentSession = cache(async () => {
  return getAuth().api.getSession({
    headers: await headers(),
  });
});

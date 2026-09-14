import "server-only";

import { prisma } from "../../db/prisma";

import { CurrentUserError } from "./current-user-error";
import { getCurrentSession } from "./get-current-session";

/**
 * 현재 요청의 세션을 내부 User와 다시 대조한다.
 * 쓰기 작업은 클라이언트가 보낸 사용자 식별자 대신 이 결과만 사용한다.
 */
export async function requireCurrentUser() {
  const session = await getCurrentSession();

  if (!session) {
    throw new CurrentUserError("UNAUTHENTICATED");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      disabledAt: true,
    },
  });

  if (!user || user.disabledAt) {
    throw new CurrentUserError("FORBIDDEN");
  }

  return {
    id: user.id,
    name: user.name,
  };
}

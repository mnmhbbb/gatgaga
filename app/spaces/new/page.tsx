import Link from "next/link";
import { redirect } from "next/navigation";

import { CreateSpaceForm } from "@/features/space";
import { CurrentUserError, requireCurrentUser } from "@server/modules/auth";

export default async function NewSpacePage() {
  try {
    await requireCurrentUser();
  } catch (error) {
    if (error instanceof CurrentUserError) {
      redirect("/");
    }

    throw error;
  }

  return (
    <main className="mx-auto min-h-svh w-full max-w-[430px] bg-surface px-6 py-8">
      <header className="flex items-center gap-3">
        <Link
          href="/"
          aria-label="내 공간으로 돌아가기"
          className="flex size-11 shrink-0 items-center justify-center rounded-xl text-ink transition-colors hover:bg-brand-soft"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none">
            <path
              d="m15 18-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <h1 className="text-xl font-black tracking-[-0.03em] text-ink">공간 만들기</h1>
      </header>

      <section className="mt-10">
        <p className="text-sm font-bold text-brand">새로운 공간</p>
        <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-ink">
          어디를 함께 모아볼까요?
        </h2>
        <p className="mt-3 text-base leading-7 text-muted">
          나중에 알아보기 쉬운 이름 하나면 충분해요.
        </p>
      </section>

      <CreateSpaceForm />
    </main>
  );
}

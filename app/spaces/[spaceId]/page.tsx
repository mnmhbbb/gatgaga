import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { SpaceCreatedToast } from "@/features/space";
import { CurrentUserError } from "@server/modules/auth";
import { getCurrentUserSpace } from "@server/modules/space";

export default async function SpacePage({ params, searchParams }: PageProps<"/spaces/[spaceId]">) {
  const [{ spaceId }, query] = await Promise.all([params, searchParams]);
  let space;

  try {
    space = await getCurrentUserSpace(spaceId);
  } catch (error) {
    if (error instanceof CurrentUserError) {
      redirect("/");
    }

    throw error;
  }

  if (!space) {
    notFound();
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
        <div className="min-w-0">
          <p className="text-xs font-bold text-brand">같가가</p>
          <h1 className="truncate text-xl font-black tracking-[-0.03em] text-ink">
            {space.name}
          </h1>
        </div>
      </header>

      <div className="mt-10 grid grid-cols-2 rounded-2xl bg-brand-soft p-1 text-sm font-bold">
        <span className="rounded-xl bg-surface px-4 py-3 text-center text-brand-strong shadow-sm">
          목록
        </span>
        <span className="px-4 py-3 text-center text-muted">지도</span>
      </div>

      <section className="mt-8 rounded-3xl border border-line bg-canvas px-6 py-12 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-xl font-black text-brand-strong">
          +
        </span>
        <h2 className="mt-5 text-lg font-black text-ink">첫 장소를 함께 모아볼까요?</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          가고 싶은 장소를 추가하면 이곳에서 함께 볼 수 있어요.
        </p>
        <button
          type="button"
          disabled
          className="mt-7 min-h-12 w-full rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white opacity-60"
        >
          첫 장소 추가
        </button>
        <button
          type="button"
          disabled
          className="mt-3 min-h-11 w-full rounded-2xl border border-brand-border px-4 py-3 text-sm font-bold text-brand-strong opacity-60"
        >
          친구 초대
        </button>
      </section>

      <SpaceCreatedToast visible={query.created === "1"} />
    </main>
  );
}

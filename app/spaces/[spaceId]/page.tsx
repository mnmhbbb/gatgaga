import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { InvitationManager } from "@/features/invitation";
import { SpaceSuccessToast } from "@/features/space";
import { CurrentUserError } from "@server/modules/auth";
import { getOwnerInvitation } from "@server/modules/invitation";
import { getSpacePlaces } from "@server/modules/place";
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

  const places = await getSpacePlaces(spaceId);

  let ownerInvitation = null;
  let invitationError: string | undefined;

  if (space.role === "OWNER") {
    ownerInvitation = await getOwnerInvitation(space.id);

    if (ownerInvitation?.invitePath === null) {
      invitationError =
        "기존 링크는 계속 사용할 수 있지만 다시 복사할 수 없어요. 필요하면 새 링크를 발급해 주세요.";
    }
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

      {places?.length ? (
        <section className="mt-8">
          <h2 className="text-sm font-bold text-ink">장소 {places.length}곳 · 최근 추가순</h2>
          <ul className="mt-3 divide-y divide-line rounded-2xl border border-line">
            {places.map((item) => (
              <li key={item.id}>
                <Link href={`/spaces/${spaceId}/places/${item.id}`} className="block px-4 py-4">
                  <strong className="block text-base text-ink">{item.place.name}</strong>
                  <span className="mt-1 block text-xs text-muted">{item.place.category} · {item.place.address}</span>
                  <span className="mt-1 block text-xs text-brand">추천 {item._count.recommendations}명</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <section className="mt-8 rounded-3xl border border-line bg-canvas px-6 py-12 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-xl font-black text-brand-strong">+</span>
          <h2 className="mt-5 text-lg font-black text-ink">첫 장소를 함께 모아볼까요?</h2>
          <p className="mt-2 text-sm leading-6 text-muted">가고 싶은 장소를 추가하면 이곳에서 함께 볼 수 있어요.</p>
          <Link href={`/spaces/${spaceId}/places/new`} className="mt-7 flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white">첫 장소 추가</Link>
        </section>
      )}

      {places?.length ? <Link href={`/spaces/${spaceId}/places/new`} className="mt-8 flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white">장소 추가</Link> : null}

      {space.role === "OWNER" ? (
        <InvitationManager
          initialError={invitationError}
          initialInvitation={ownerInvitation}
          spaceId={space.id}
        />
      ) : null}

      <SpaceSuccessToast
        message={query.joined === "1" ? "공간에 참여했어요." : "공간을 만들었어요."}
        visible={query.created === "1" || query.joined === "1"}
      />
    </main>
  );
}

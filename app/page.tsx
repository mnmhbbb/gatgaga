import Link from "next/link";

import { KakaoLoginButton, SignOutButton } from "@/features/auth";
import { CurrentUserError, getCurrentSession } from "@server/modules/auth";
import { getCurrentUserSpaces } from "@server/modules/space";

const LOGIN_ERROR_MESSAGE =
  "카카오 로그인을 완료하지 않았어요. 동의 화면을 닫았다면 다시 시도해 주세요.";

function LoginView({ hasAuthError }: { hasAuthError: boolean }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col justify-center px-6 py-16">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-lg font-black text-white shadow-sm">
        같
      </span>
      <p className="mt-6 text-sm font-bold text-brand">같이 가요, 가요</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-ink">
        함께 가고 싶은 곳을 모아요
      </h1>
      <p className="mt-4 text-base leading-7 text-muted">
        함께 가고 싶은 장소를 모으고, 추천한 이유와 이야기를 이어가세요.
      </p>
      <KakaoLoginButton initialErrorMessage={hasAuthError ? LOGIN_ERROR_MESSAGE : undefined} />
    </main>
  );
}

interface MySpacesViewProps {
  userName: string;
  spaces: Awaited<ReturnType<typeof getCurrentUserSpaces>>;
}

function MySpacesView({ userName, spaces }: MySpacesViewProps) {
  return (
    <main className="mx-auto min-h-svh w-full max-w-[430px] bg-surface px-6 py-10">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-base font-black text-white shadow-sm">
            같
          </span>
          <div>
            <p className="text-sm font-bold text-brand">같이 가요, 가요</p>
            <p className="mt-0.5 text-xs text-muted">{userName}님</p>
          </div>
        </div>
        <SignOutButton />
      </header>

      <section className="mt-12">
        <h1 className="text-3xl font-black tracking-[-0.04em] text-ink">내 공간</h1>
        <p className="mt-3 text-base leading-7 text-muted">
          함께 모은 장소를 공간별로 확인할 수 있어요.
        </p>
      </section>

      {spaces.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-line bg-canvas px-6 py-12 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-xl font-black text-brand-strong">
            +
          </span>
          <h2 className="mt-5 text-lg font-black text-ink">아직 참여한 공간이 없어요</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            첫 공간을 만들고 함께 가고 싶은 장소를 모아보세요.
          </p>
          <Link
            href="/spaces/new"
            className="mt-7 flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white"
          >
            공간 만들기
          </Link>
        </section>
      ) : (
        <section className="mt-8">
          <ul className="space-y-3">
            {spaces.map((space) => (
              <li key={space.id}>
                <Link
                  href={`/spaces/${space.id}`}
                  className="flex min-h-20 items-center justify-between rounded-2xl border border-line bg-canvas px-5 py-4 transition-colors hover:border-brand-border hover:bg-brand-soft"
                >
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-black text-ink">{space.name}</h2>
                    <p className="mt-1 text-xs text-muted">
                      {space.role === "OWNER" ? "내가 만든 공간" : "참여 중인 공간"}
                    </p>
                  </div>
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="ml-4 size-5 shrink-0 text-muted" fill="none">
                    <path
                      d="m9 18 6-6-6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/spaces/new"
            className="mt-6 flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white"
          >
            공간 만들기
          </Link>
        </section>
      )}
    </main>
  );
}

function DisabledAccountView({ userName }: { userName: string }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col justify-center px-6 py-16">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-lg font-black text-white shadow-sm">
        같
      </span>
      <h1 className="mt-6 text-2xl font-black tracking-[-0.04em] text-ink">
        이 계정으로는 이용할 수 없어요
      </h1>
      <p className="mt-3 text-base leading-7 text-muted">
        {userName}님의 계정 상태를 확인해 주세요.
      </p>
      <div className="mt-6 self-start">
        <SignOutButton />
      </div>
    </main>
  );
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const [session, query] = await Promise.all([getCurrentSession(), searchParams]);

  if (!session) {
    return <LoginView hasAuthError={query.authError === "kakao"} />;
  }

  let spaces: Awaited<ReturnType<typeof getCurrentUserSpaces>> | null = null;

  try {
    spaces = await getCurrentUserSpaces();
  } catch (error) {
    if (error instanceof CurrentUserError && error.code === "FORBIDDEN") {
      spaces = null;
    } else {
      throw error;
    }
  }

  return spaces ? (
    <MySpacesView userName={session.user.name} spaces={spaces} />
  ) : (
    <DisabledAccountView userName={session.user.name} />
  );
}

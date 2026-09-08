import { KakaoLoginButton, SignOutButton } from "@/features/auth";
import { getCurrentSession } from "@server/modules/auth";

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
        같가가 개발을 시작합니다
      </h1>
      <p className="mt-4 text-base leading-7 text-muted">
        제품·UX 기준선이 확정되었습니다. 이제 실제 데이터와 권한을 세로 기능 단위로 연결합니다.
      </p>
      <div className="mt-8 rounded-2xl border border-brand-border bg-brand-soft p-4 text-sm leading-6 text-brand-strong">
        현재 단계: Better Auth와 Kakao OAuth 연결
      </div>
      <KakaoLoginButton initialErrorMessage={hasAuthError ? LOGIN_ERROR_MESSAGE : undefined} />
    </main>
  );
}

function MySpacesView({ userName }: { userName: string }) {
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

      <section className="mt-8 rounded-3xl border border-line bg-canvas px-6 py-12 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-brand-soft text-xl font-black text-brand-strong">
          +
        </span>
        <h2 className="mt-5 text-lg font-black text-ink">아직 참여한 공간이 없어요</h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          첫 공간을 만들고 함께 가고 싶은 장소를 모아보세요.
        </p>
        <button
          type="button"
          className="mt-7 w-full rounded-2xl bg-brand px-4 py-4 text-sm font-bold text-white opacity-60"
          disabled
        >
          공간 만들기 · 다음 단계
        </button>
      </section>
    </main>
  );
}

export default async function Home({ searchParams }: PageProps<"/">) {
  const [session, query] = await Promise.all([getCurrentSession(), searchParams]);

  if (!session) {
    return <LoginView hasAuthError={query.authError === "kakao"} />;
  }

  return <MySpacesView userName={session.user.name} />;
}

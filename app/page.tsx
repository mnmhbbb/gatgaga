import { KakaoLoginButton } from "@/features/auth";

export default function Home() {
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
      <KakaoLoginButton />
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";

import { KakaoLoginButton, SignOutButton } from "@/features/auth";
import { AcceptInvitationForm } from "@/features/invitation";
import {
  CurrentUserError,
  getCurrentSession,
  requireCurrentUser,
} from "@server/modules/auth";
import {
  getInvitationIntentId,
  getInvitationPreview,
} from "@server/modules/invitation";
import { getCurrentUserSpace } from "@server/modules/space";

const LOGIN_ERROR_MESSAGE =
  "카카오 로그인을 완료하지 않았어요. 동의 화면을 닫았다면 다시 시도해 주세요.";

function InvitationUnavailable() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col justify-center px-6 py-16">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-lg font-black text-white shadow-sm">
        같
      </span>
      <h1 className="mt-6 text-2xl font-black tracking-[-0.04em] text-ink">
        이 초대 링크를 사용할 수 없어요
      </h1>
      <p className="mt-3 text-base leading-7 text-muted">
        링크가 바뀌었거나 올바르지 않아요. 초대한 사람에게 새 링크를 받아 주세요.
      </p>
      <Link
        href="/"
        className="mt-8 flex min-h-12 w-full items-center justify-center rounded-2xl bg-brand px-4 py-3 text-sm font-bold text-white"
      >
        처음으로
      </Link>
    </main>
  );
}

function DisabledAccount() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col justify-center px-6 py-16">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-lg font-black text-white shadow-sm">
        같
      </span>
      <h1 className="mt-6 text-2xl font-black tracking-[-0.04em] text-ink">
        이 계정으로는 참여할 수 없어요
      </h1>
      <p className="mt-3 text-base leading-7 text-muted">
        현재 계정 상태를 확인하거나 다른 계정으로 다시 로그인해 주세요.
      </p>
      <div className="mt-6 self-start">
        <SignOutButton redirectTo="/invite/continue" />
      </div>
    </main>
  );
}

export default async function InvitationContinuePage({
  searchParams,
}: {
  searchParams: Promise<{
    authError?: string | string[];
    invalid?: string | string[];
  }>;
}) {
  const [invitationId, session, query] = await Promise.all([
    getInvitationIntentId(),
    getCurrentSession(),
    searchParams,
  ]);

  if (!invitationId || query.invalid === "1") {
    return <InvitationUnavailable />;
  }

  const preview = await getInvitationPreview(invitationId);

  if (!preview) {
    return <InvitationUnavailable />;
  }

  if (!session) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col justify-center px-6 py-16">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-lg font-black text-white shadow-sm">
          같
        </span>
        <p className="mt-6 text-sm font-bold text-brand">공간 초대</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-ink">
          {preview.spaceName}
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          카카오로 로그인하면 이 화면으로 돌아와 참여 여부를 확인할 수 있어요.
        </p>
        <KakaoLoginButton
          callbackURL="/invite/continue"
          errorCallbackURL="/invite/continue?authError=kakao"
          initialErrorMessage={query.authError === "kakao" ? LOGIN_ERROR_MESSAGE : undefined}
          label="카카오로 계속하기"
        />
      </main>
    );
  }

  let currentUser;

  try {
    currentUser = await requireCurrentUser();
  } catch (error) {
    if (error instanceof CurrentUserError) {
      return <DisabledAccount />;
    }

    throw error;
  }

  const membership = await getCurrentUserSpace(preview.spaceId);

  if (membership) {
    redirect(`/spaces/${preview.spaceId}`);
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col justify-center px-6 py-16">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-lg font-black text-white shadow-sm">
        같
      </span>
      <p className="mt-6 text-sm font-bold text-brand">공간 초대</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-ink">
        {preview.spaceName}
      </h1>
      <p className="mt-4 text-base leading-7 text-muted">
        {currentUser.name}님 계정으로 이 공간에 참여할까요?
      </p>
      <AcceptInvitationForm />
      <div className="mt-4 self-center">
        <SignOutButton redirectTo="/invite/continue" />
      </div>
    </main>
  );
}

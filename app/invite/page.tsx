import { InvitationLinkIngress } from "@/features/invitation";

export default function InvitePage() {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-[430px] flex-col justify-center px-6 py-16">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-lg font-black text-white shadow-sm">
        같
      </span>
      <InvitationLinkIngress />
    </main>
  );
}

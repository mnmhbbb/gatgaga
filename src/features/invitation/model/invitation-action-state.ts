export type InvitationActionState =
  | { status: "idle" }
  | { status: "error"; message: string };

export const initialInvitationActionState: InvitationActionState = {
  status: "idle",
};

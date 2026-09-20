export type InvitationErrorCode =
  | "FORBIDDEN"
  | "INVALID_INVITATION"
  | "NOT_FOUND"
  | "CONFLICT";

export class InvitationError extends Error {
  constructor(readonly code: InvitationErrorCode) {
    super(code);
    this.name = "InvitationError";
  }
}

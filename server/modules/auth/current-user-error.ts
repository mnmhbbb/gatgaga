export type CurrentUserErrorCode = "UNAUTHENTICATED" | "FORBIDDEN";

export class CurrentUserError extends Error {
  constructor(readonly code: CurrentUserErrorCode) {
    super(code);
    this.name = "CurrentUserError";
  }
}

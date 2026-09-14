export interface CreateSpaceFormState {
  status: "idle" | "error" | "success";
  message?: string;
  spaceId?: string;
}

export const INITIAL_CREATE_SPACE_FORM_STATE: CreateSpaceFormState = {
  status: "idle",
};

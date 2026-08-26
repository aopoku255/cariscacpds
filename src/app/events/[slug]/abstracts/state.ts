/** Kept out of actions.ts: a "use server" file may only export async functions. */
export interface AbstractState {
  ok: boolean;
  message?: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

export const emptyAbstractState: AbstractState = { ok: false };

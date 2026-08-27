/** Kept out of actions.ts: a "use server" file may only export async functions. */
export interface SurveyState {
  ok: boolean;
  message?: string;
  code?: string;
  fieldErrors?: Record<string, string>;
}

export const emptySurveyState: SurveyState = { ok: false };

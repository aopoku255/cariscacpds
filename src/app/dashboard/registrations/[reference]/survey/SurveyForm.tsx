'use client';

import { useActionState } from 'react';
import type { SurveyQuestion } from '@/lib/api/types';
import { Callout } from '@/components/ui';
import { QuestionField } from '@/components/forms/QuestionField';
import { SubmitButton } from '@/components/forms/SubmitButton';
import { submitSurveyAction } from './actions';
import { emptySurveyState } from './state';
import formStyles from '@/components/ui/ui.module.css';

export function SurveyForm({
  reference, questions, answers,
}: {
  reference: string;
  questions: SurveyQuestion[];
  answers: Record<string, string>;
}) {
  const [state, formAction] = useActionState(submitSurveyAction, emptySurveyState);
  const err = (key: string) => state.fieldErrors?.[key];

  return (
    <form action={formAction} className={formStyles.form} noValidate>
      <input type="hidden" name="reference" value={reference} />

      {state.message && !state.ok && (
        <Callout tone="danger" title="Could not submit the survey">{state.message}</Callout>
      )}

      <div className="stack stack-4">
        {questions.map((q) => (
          <QuestionField
            key={q.id}
            question={q}
            error={err(`q-${q.id}`)}
            defaultValue={answers[q.id]}
          />
        ))}
      </div>

      <SubmitButton pendingLabel="Submitting…" fullWidth>Submit</SubmitButton>
    </form>
  );
}

'use client';

import type { RegistrationQuestion, SurveyQuestion } from '@/lib/api/types';
import {
  Field, inputClass, selectClass, textareaClass, checkRowClass,
} from '@/components/ui';

/**
 * Renders one configured question — a registration question or a survey
 * question. The question set is data, so this has to handle every type the
 * admin can choose without knowing anything about a particular event. Field
 * names are `answers[<id>]` so the server can match them back to the
 * question rows it will validate against — the client's own validation is a
 * courtesy, not the check that counts.
 */
export function QuestionField({
  question, error, defaultValue,
}: {
  question: RegistrationQuestion | SurveyQuestion;
  error?: string;
  defaultValue?: string | string[];
}) {
  const id = `q-${question.id}`;
  const name = `answers[${question.id}]`;
  const options = question.options ?? [];
  const helpText = 'helpText' in question ? question.helpText : null;

  const common = {
    id,
    name,
    required: question.required,
    'aria-invalid': error ? true : undefined,
  };

  return (
    <Field
      label={question.label}
      htmlFor={id}
      hint={helpText}
      error={error}
      required={question.required}
    >
      {(() => {
        switch (question.type) {
          case 'RATING':
          case 'NPS': {
            const scale = question.type === 'RATING'
              ? [1, 2, 3, 4, 5]
              : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            return (
              <div className="stack stack-2" role="radiogroup" aria-labelledby={id}>
                <div className={checkRowClass} style={{ gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  {scale.map((n) => (
                    <label key={n} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <input
                        type="radio"
                        name={name}
                        value={String(n)}
                        required={question.required}
                        defaultChecked={defaultValue === String(n)}
                      />
                      <span>{n}</span>
                    </label>
                  ))}
                </div>
                {question.type === 'NPS' && (
                  <p className="subtle">0 = not at all likely, 10 = extremely likely</p>
                )}
              </div>
            );
          }
          case 'LONGTEXT':
            return (
              <textarea
                {...common}
                className={textareaClass}
                defaultValue={defaultValue as string}
                maxLength={5000}
              />
            );

          case 'SELECT':
            return (
              <select {...common} className={selectClass} defaultValue={(defaultValue as string) ?? ''}>
                <option value="">Please choose…</option>
                {options.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            );

          case 'MULTISELECT':
            // Checkboxes rather than a multi-select list: multi-select is
            // notoriously hard to operate on a phone, and most registrations
            // happen on one.
            return (
              <div className="stack stack-2" role="group" aria-labelledby={id}>
                {options.map((o) => (
                  <label key={o.value} className={checkRowClass}>
                    <input
                      type="checkbox"
                      name={name}
                      value={o.value}
                      defaultChecked={Array.isArray(defaultValue) && defaultValue.includes(o.value)}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            );

          case 'RADIO':
            return (
              <div className="stack stack-2" role="radiogroup" aria-labelledby={id}>
                {options.map((o) => (
                  <label key={o.value} className={checkRowClass}>
                    <input
                      type="radio"
                      name={name}
                      value={o.value}
                      required={question.required}
                      defaultChecked={defaultValue === o.value}
                    />
                    <span>{o.label}</span>
                  </label>
                ))}
              </div>
            );

          case 'CHECKBOX':
            return (
              <label className={checkRowClass}>
                <input
                  type="checkbox"
                  name={name}
                  value="yes"
                  required={question.required}
                  defaultChecked={defaultValue === 'yes'}
                />
                <span>{helpText ?? 'Yes'}</span>
              </label>
            );

          case 'NUMBER':
            return <input {...common} type="number" step="any" className={inputClass} defaultValue={defaultValue as string} />;

          case 'EMAIL':
            return <input {...common} type="email" className={inputClass} defaultValue={defaultValue as string} />;

          case 'PHONE':
            return <input {...common} type="tel" className={inputClass} defaultValue={defaultValue as string} />;

          case 'DATE':
            return <input {...common} type="date" className={inputClass} defaultValue={defaultValue as string} />;

          case 'FILE':
            return <input {...common} type="file" className={inputClass} />;

          case 'TEXT':
          default:
            return <input {...common} type="text" className={inputClass} maxLength={1000} defaultValue={defaultValue as string} />;
        }
      })()}
    </Field>
  );
}

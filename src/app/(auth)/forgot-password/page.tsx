import type { Metadata } from 'next';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import styles from '../auth.module.css';

export const metadata: Metadata = { title: 'Reset your password', robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <div className="shell shell--narrow">
      <div className={styles.page}>
        <header className={styles.head}>
          <h1 className={styles.title}>Reset your password</h1>
          <p className={styles.lede}>
            Enter the email address you registered with and we will send you a link
            to choose a new password.
          </p>
        </header>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

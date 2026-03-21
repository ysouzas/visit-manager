import React from 'react';
import { useTranslation } from 'react-i18next';

interface AdminLoginProps {
  password: string;
  onPasswordChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  password,
  onPasswordChange,
  onSubmit,
  onCancel
}) => {
  const { t } = useTranslation();

  return (
    <div className="card fade-in login-card">
      <button className="back-btn" onClick={onCancel}>← {t('common.back_to_slots')}</button>
      <h2>🔒 {t('login.title')}</h2>
      <form onSubmit={onSubmit}>
        <div className="input-group">
          <label>{t('login.password')}</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="••••••••"
            autoFocus
          />
        </div>
        <button type="submit" className="w-full btn-primary">{t('login.sign_in')}</button>
      </form>
    </div>
  );
};

import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ParentConfig } from '../../types';

interface HeaderProps {
  config: ParentConfig;
  onAdminClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ config, onAdminClick }) => {
  const { t } = useTranslation();

  return (
    <header className="hero">
      <div className="top-actions">
        <button className="nav-btn" onClick={onAdminClick} title={t('nav.admin')}>⚙️</button>
      </div>
      <h1>✈️ {t('hero.welcome', { name: config.babyname })} ✈️</h1>
      <p className="parent-intro">{t('hero.from', { names: config.parentnames })}</p>
      <p className="subtitle">⭐ {t('hero.subtitle')} ⭐</p>
    </header>
  );
};

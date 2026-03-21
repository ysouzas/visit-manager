import React from 'react';
import { useTranslation } from 'react-i18next';

interface AdminDashboardProps {
  activeTab: 'schedule' | 'settings';
  onTabChange: (tab: 'schedule' | 'settings') => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  activeTab,
  onTabChange,
  onLogout,
  children
}) => {
  const { t } = useTranslation();

  return (
    <div className="fade-in admin-dashboard">
      <nav className="admin-nav">
        <button 
          className={`nav-tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => onTabChange('schedule')}
        >
          📅 {t('nav.schedule')}
        </button>
        <button 
          className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onTabChange('settings')}
        >
          ⚙️ {t('nav.settings')}
        </button>
        <button className="nav-tab logout" onClick={onLogout}>
          🚪 {t('nav.logout')}
        </button>
      </nav>
      {children}
    </div>
  );
};

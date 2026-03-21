import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Visit } from '../../types';

interface ScheduleProps {
  visits: Visit[];
  onCancelVisit: (visit: Visit) => void;
}

export const Schedule: React.FC<ScheduleProps> = ({ visits, onCancelVisit }) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="card schedule-card">
      <h2>☁️ {t('schedule.title')} ☁️</h2>
      {visits.length === 0 ? (
        <p className="no-visits">{t('schedule.empty')}</p>
      ) : (
        <div className="visits-list">
          {visits.sort((a, b) => (a.date + a.starttime).localeCompare(b.date + b.starttime)).map(visit => (
            <div key={visit.id} className="visit-item">
              <div className="visit-time-info">
                <span className="visit-date">📅 {new Date(visit.date + 'T12:00:00').toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}</span>
                <span className="visit-time">🕒 {visit.starttime} - {visit.endtime}</span>
              </div>
              <div className="visit-visitor-info">
                <span className="visit-name">{visit.visitorname}</span>
                <span className="visit-count">{visit.visitorcount} {visit.visitorcount === 1 ? t('common.person') : t('common.people')}</span>
              </div>
              <button 
                className="delete-btn" 
                onClick={() => onCancelVisit(visit)}
                title={t('booking.cancel_btn')}
              >
                {t('common.remove')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import type { TimeSlot, ParentConfig } from '../../types';

interface SuccessViewProps {
  visitorName: string;
  config: ParentConfig;
  selectedSlot: TimeSlot | null;
  onBack: () => void;
  onDownloadCalendar: (type: 'apple' | 'google') => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  visitorName,
  config,
  selectedSlot,
  onBack,
  onDownloadCalendar
}) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="fade-in success-view">
      <div className="card">
        <div className="success-icon">🎈✈️⭐</div>
        <h2>{t('success.title', { name: visitorName })}</h2>
        <p><Trans i18nKey="success.message" values={{ babyName: config.babyname }}>You're all set to visit <strong>{config.babyname}</strong> ☁️.</Trans></p>
        <div className="visit-details">
          <p><strong>📍 {t('success.where')}:</strong> {config.hospitalname}, {t('success.room')} {config.roomnumber}</p>
          <p><strong>📅 {t('success.when')}:</strong> {selectedSlot && new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}, {selectedSlot?.starttime} - {selectedSlot?.endtime}</p>
        </div>
        <div className="calendar-actions">
          <a href={config.mapslink} target="_blank" rel="noreferrer" className="calendar-btn maps">📍 {t('success.open_maps')}</a>
          <button className="calendar-btn google" onClick={() => onDownloadCalendar('google')}>📅 {t('success.add_google')}</button>
          <button className="calendar-btn apple" onClick={() => onDownloadCalendar('apple')}>🍎 {t('success.add_apple')}</button>
          <button className="outline-btn w-full" onClick={onBack}>{t('common.back_to_slots')}</button>
        </div>
      </div>
    </div>
  );
};

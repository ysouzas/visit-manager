import React from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const rescueCode = location.state?.rescueCode;

  const handleCopyInfo = () => {
    const date = selectedSlot ? new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' }) : '';
    const time = `${selectedSlot?.starttime} - ${selectedSlot?.endtime}`;
    const url = window.location.origin;

    const text = t('success.copy_template', {
      babyName: config.babyname,
      date,
      time,
      where: config.hospitalname,
      room: config.roomnumber,
      code: rescueCode || 'N/A',
      url
    });

    navigator.clipboard.writeText(text).then(() => {
      alert(t('success.copy_success'));
    });
  };

  return (
    <div className="fade-in success-view">
      <div className="card">
        <div className="success-icon">🎈✈️⭐</div>
        <h2>{t('success.title', { name: visitorName })}</h2>
        <p><Trans i18nKey="success.message" values={{ babyName: config.babyname }}>You're all set to visit <strong>{config.babyname}</strong> ☁️.</Trans></p>
        
        <button className="copy-btn" onClick={handleCopyInfo}>
          📋 {t('success.copy_info')}
        </button>
        
        {rescueCode && (
          <div className="rescue-code-info">
            <p>{t('success.rescue_hint')}</p>
            <div className="rescue-badge">{rescueCode}</div>
          </div>
        )}

        <div className="visit-details">
          <p><strong>📍 {t('success.where')}:</strong> {config.hospitalname}, {t('success.room')} {config.roomnumber}</p>
          <p><strong>📅 {t('success.when')}:</strong> {selectedSlot && new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}, {selectedSlot?.starttime} - {selectedSlot?.endtime}</p>
        </div>
        <div className="calendar-actions">
          <a href={config.mapslink} target="_blank" rel="noreferrer" className="calendar-btn maps">📍 {t('success.open_maps')}</a>
          <button className="calendar-btn google" onClick={() => onDownloadCalendar('google')}>📅 {t('success.google_cal')}</button>
          <button className="calendar-btn apple" onClick={() => onDownloadCalendar('apple')}>🍎 {t('success.add_to_apple')}</button>
          <button className="outline-btn w-full" onClick={onBack}>{t('common.back_to_slots')}</button>
        </div>
      </div>
    </div>
  );
};

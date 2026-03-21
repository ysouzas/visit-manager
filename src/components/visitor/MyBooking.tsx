import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Visit } from '../../types';

interface MyBookingProps {
  myVisit: Visit;
  onCancel: () => void;
}

export const MyBooking: React.FC<MyBookingProps> = ({ myVisit, onCancel }) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="card fade-in" style={{ border: '2px solid var(--color-sky-blue)', background: 'var(--color-bg-cloud)' }}>
      <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>☁️ {t('booking.my_visit')} ☁️</h2>
      <div style={{ marginBottom: '1.5rem' }}>
        <p><strong>📅 {new Date(myVisit.date + 'T12:00:00').toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}</strong></p>
        <p>🕒 {myVisit.starttime} - {myVisit.endtime}</p>
      </div>
      <button className="w-full" style={{ background: 'var(--color-accent-red)', color: 'white' }} onClick={onCancel}>
        {t('booking.cancel_btn')}
      </button>
    </div>
  );
};

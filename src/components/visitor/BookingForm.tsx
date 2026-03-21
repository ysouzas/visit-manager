import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TimeSlot } from '../../types';

interface BookingFormProps {
  selectedSlot: TimeSlot;
  visitorName: string;
  visitorCount: number;
  onNameChange: (name: string) => void;
  onCountChange: (count: number) => void;
  onConfirm: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  selectedSlot,
  visitorName,
  visitorCount,
  onNameChange,
  onCountChange,
  onConfirm,
  onCancel
}) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="card fade-in booking-form-card">
      <button className="back-btn" onClick={onCancel}>← {t('common.back_to_slots')}</button>
      <h2>☁️ {t('booking.title')} ☁️</h2>
      <p className="booking-summary">
        📅 {new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}<br/>
        🕒 {selectedSlot.starttime.slice(0, 5)} - {selectedSlot.endtime.slice(0, 5)}
      </p>

      <form onSubmit={onConfirm}>
        <div className="input-group">
          <label>{t('booking.visitor_name')}</label>
          <input
            type="text"
            required
            value={visitorName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t('booking.visitor_name_placeholder')}
          />
        </div>
        <div className="input-group">
          <label>{t('booking.visitor_count')}</label>
          <input
            type="number"
            min="1"
            max={selectedSlot.maxvisitors - selectedSlot.currentvisitors}
            value={visitorCount}
            onChange={(e) => onCountChange(parseInt(e.target.value))}
          />
        </div>
        <button type="submit" className="w-full btn-primary">{t('booking.confirm_btn')}</button>
      </form>
    </div>
  );
};

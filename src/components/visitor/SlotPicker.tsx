import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TimeSlot } from '../../types';

interface SlotPickerProps {
  slots: TimeSlot[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onSlotSelect: (slot: TimeSlot) => void;
  formatDateShort: (dateStr: string) => string;
}

export const SlotPicker: React.FC<SlotPickerProps> = ({ 
  slots, 
  selectedDate, 
  onDateSelect, 
  onSlotSelect, 
  formatDateShort 
}) => {
  const { t } = useTranslation();
  
  const dates = [...new Set(slots.map(s => s.date))].sort();
  const slotsForDate = slots.filter(s => s.date === selectedDate);

  return (
    <div className="card slot-picker-card">
      <div className="date-selector">
        {dates.map(date => (
          <button
            key={date}
            className={`date-tab ${selectedDate === date ? 'active' : ''}`}
            onClick={() => onDateSelect(date)}
          >
            ☁️ {formatDateShort(date)}
          </button>
        ))}
      </div>

      <div className="hour-grid">
        {slotsForDate.map(slot => {
          const isFull = slot.currentvisitors >= 10;
          return (
              <button
                key={slot.id}
                className={`hour-btn ${isFull ? 'full' : ''}`}
                disabled={isFull}
                onClick={() => onSlotSelect(slot)}
              >
                <span className="time-range">{slot.starttime.slice(0, 5)} - {slot.endtime.slice(0, 5)}</span>
                <span className="spots">
                  {isFull ? t('common.full') : t('common.spots_left', { count: slot.maxvisitors - slot.currentvisitors })}
                </span>
              </button>
          );
        })}
      </div>
    </div>
  );
};

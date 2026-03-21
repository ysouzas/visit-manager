import React from 'react';
import type { TimeSlot } from '../../types';

interface ManageSlotsProps {
  slots: TimeSlot[];
  newSlotDate: string;
  newSlotStart: string;
  newSlotEnd: string;
  maxVisitors: number;
  onDateChange: (val: string) => void;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
  onMaxVisitorsChange: (val: number) => void;
  onAddSlot: () => void;
  onDeleteSlot: (id: string) => void;
}

export const ManageSlots: React.FC<ManageSlotsProps> = ({
  slots,
  newSlotDate,
  newSlotStart,
  newSlotEnd,
  maxVisitors,
  onDateChange,
  onStartChange,
  onEndChange,
  onMaxVisitorsChange,
  onAddSlot,
  onDeleteSlot
}) => {
  return (
    <div className="card settings-card">
      <h2>☁️ Manage Time Slots ☁️</h2>
      <p className="hint" style={{ marginTop: 0, marginBottom: '1rem' }}>Tip: Enter a range (e.g. 10:00 to 19:00) to auto-generate hourly slots.</p>
      
      <div className="add-slot-form">
        <div className="input-group">
          <label>Date</label>
          <input type="date" value={newSlotDate} onChange={(e) => onDateChange(e.target.value)} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="input-group">
            <label>Start Time</label>
            <input type="time" value={newSlotStart} onChange={(e) => onStartChange(e.target.value)} />
          </div>
          <div className="input-group">
            <label>End Time</label>
            <input type="time" value={newSlotEnd} onChange={(e) => onEndChange(e.target.value)} />
          </div>
        </div>
        <div className="input-group">
          <label>Max Visitors per Slot</label>
          <input type="number" min="1" value={maxVisitors} onChange={(e) => onMaxVisitorsChange(parseInt(e.target.value))} />
        </div>
        <button className="w-full btn-primary" onClick={onAddSlot}>Add New Slot</button>
      </div>

      <div className="manage-slots-list">
        {slots.map(slot => (
          <div key={slot.id} className="manage-slot-item">
            <span>📅 {slot.date}  |  🕒 {slot.starttime} - {slot.endtime}</span>
            <button className="delete-btn" onClick={() => slot.id && onDeleteSlot(slot.id)}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};

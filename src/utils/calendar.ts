import type { TimeSlot, ParentConfig } from '../types';

export const generateGoogleCalendarLink = (slot: TimeSlot, config: ParentConfig) => {
  const base = 'https://www.google.com/calendar/render?action=TEMPLATE';
  const text = encodeURIComponent(`Visit ${config.babyname}`);
  const details = encodeURIComponent(`Visiting ${config.babyname} at ${config.hospitalname}, Room ${config.roomnumber}`);
  const location = encodeURIComponent(`${config.hospitalname}, Room ${config.roomnumber}`);
  
  const dateStr = slot.date.replace(/-/g, '');
  const start = `${dateStr}T${slot.starttime.replace(':', '')}00Z`;
  const end = `${dateStr}T${slot.endtime.replace(':', '')}00Z`;
  
  return `${base}&text=${text}&details=${details}&location=${location}&dates=${start}/${end}`;
};

export const generateICSFile = (slot: TimeSlot, config: ParentConfig) => {
  const dateStr = slot.date.replace(/-/g, '');
  const start = `${dateStr}T${slot.starttime.replace(':', '')}00Z`;
  const end = `${dateStr}T${slot.endtime.replace(':', '')}00Z`;

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:Visit ${config.babyname}`,
    `DESCRIPTION:Visiting ${config.babyname} at ${config.hospitalname}, Room ${config.roomnumber}`,
    `LOCATION:${config.hospitalname}, Room ${config.roomnumber}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
};

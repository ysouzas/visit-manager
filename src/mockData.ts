import type { TimeSlot, ParentConfig } from './types';

const getOffsetDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

export const INITIAL_SLOTS: TimeSlot[] = [
  { date: getOffsetDate(0), starttime: '10:00', endtime: '11:00', maxvisitors: 2, currentvisitors: 0 },
  { date: getOffsetDate(0), starttime: '14:00', endtime: '15:00', maxvisitors: 3, currentvisitors: 0 },
  { date: getOffsetDate(1), starttime: '10:00', endtime: '11:00', maxvisitors: 2, currentvisitors: 0 },
  { date: getOffsetDate(1), starttime: '14:00', endtime: '15:00', maxvisitors: 3, currentvisitors: 0 },
];

export const INITIAL_CONFIG: ParentConfig = {
  babyname: 'Baby Liam',
  parentnames: 'Sarah & Mark',
  hospitalname: 'St. Mary’s Maternity Ward',
  roomnumber: '402',
  mapslink: 'https://maps.app.goo.gl/YduTVuUDAxRi8mEW8',
};

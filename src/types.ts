export interface TimeSlot {
  id?: string;
  date: string; // ISO format "YYYY-MM-DD"
  starttime: string; // "HH:mm"
  endtime: string; // "HH:mm"
  maxvisitors: number;
  currentvisitors: number;
}

export interface Visit {
  id: string;
  slotid: string;
  date: string;
  starttime: string;
  endtime: string;
  visitorname: string;
  visitorcount: number;
  rescuecode: string;
  createdat: string;
}

export interface ParentConfig {
  babyname: string;
  parentnames: string;
  hospitalname: string;
  roomnumber: string;
  mapslink: string;
}

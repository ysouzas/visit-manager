import { supabase } from '../supabaseClient';
import type { TimeSlot, Visit, ParentConfig } from '../types';

export const api = {
  // Settings
  async getSettings(): Promise<ParentConfig | null> {
    const { data, error } = await supabase.from('settings').select('*').single();
    if (error) return null;
    return data as ParentConfig;
  },

  async updateSettings(babyname: string, field: keyof ParentConfig, value: string) {
    return supabase.from('settings').update({ [field]: value }).eq('babyname', babyname);
  },

  // Slots
  async getSlots(): Promise<TimeSlot[]> {
    const { data, error } = await supabase
      .from('slots')
      .select('*')
      .order('date', { ascending: true })
      .order('starttime', { ascending: true });
    if (error) return [];
    return data as TimeSlot[];
  },

  async createSlots(slots: Omit<TimeSlot, 'id'>[]) {
    return supabase.from('slots').insert(slots);
  },

  async deleteSlot(id: string) {
    return supabase.from('slots').delete().eq('id', id);
  },

  async updateSlotVisitors(slotId: string, newCount: number) {
    return supabase.from('slots').update({ currentvisitors: newCount }).eq('id', slotId);
  },

  // Visits
  async getVisits(): Promise<Visit[]> {
    const { data, error } = await supabase.from('visits').select('*');
    if (error) return [];
    return data as Visit[];
  },

  async createVisit(visit: Omit<Visit, 'id'>) {
    return supabase.from('visits').insert([visit]).select().single();
  },

  async getVisitByCode(code: string): Promise<Visit | null> {
    const { data, error } = await supabase.from('visits').select('*').eq('rescuecode', code).single();
    if (error) return null;
    return data as Visit;
  },

  async getVisitById(id: string): Promise<Visit | null> {
    const { data, error } = await supabase.from('visits').select('*').eq('id', id).single();
    if (error) return null;
    return data as Visit;
  },

  async deleteVisit(id: string) {
    return supabase.from('visits').delete().eq('id', id);
  }
};

import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { TimeSlot, Visit, ParentConfig } from '../types';

export function useAppData() {
  const [config, setConfig] = useState<ParentConfig>({
    babyname: '',
    parentnames: '',
    hospitalname: '',
    roomnumber: '',
    mapslink: ''
  });
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [myVisit, setMyVisit] = useState<Visit | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    
    // 1. Settings
    const settings = await api.getSettings();
    if (settings) setConfig(settings);

    // 2. Slots
    const slotsData = await api.getSlots();
    setSlots(slotsData);

    // 3. My Visit (Persistence)
    const myVisitId = localStorage.getItem('my_visit_id');
    if (myVisitId) {
      const vData = await api.getVisitById(myVisitId);
      if (vData) {
        setMyVisit(vData);
      } else {
        localStorage.removeItem('my_visit_id');
      }
    }

    // 4. All Visits (Admin)
    const visitsData = await api.getVisits();
    setVisits(visitsData);

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelVisit = async (visitToCancel: Visit) => {
    const isMyVisit = myVisit?.id === visitToCancel.id;
    
    // 1. Update Slot
    await api.updateSlotVisitors(visitToCancel.slotid, 0); // Need to get current first
    // Refined logic: better to get current visitors and decrement
    const currentSlots = await api.getSlots();
    const slot = currentSlots.find(s => s.id === visitToCancel.slotid);
    if (slot) {
      const newCount = Math.max(0, slot.currentvisitors - visitToCancel.visitorcount);
      await api.updateSlotVisitors(slot.id!, newCount);
    }
    
    // 2. Delete Visit
    await api.deleteVisit(visitToCancel.id!);
    
    // 3. Clear Local State if it was my visit
    if (isMyVisit) {
      localStorage.removeItem('my_visit_id');
      setMyVisit(null);
    }
    
    // 4. Refresh everything
    fetchData();
  };

  return {
    config,
    setConfig,
    slots,
    setSlots,
    visits,
    setVisits,
    myVisit,
    setMyVisit,
    isLoading,
    fetchData,
    handleCancelVisit
  };
}

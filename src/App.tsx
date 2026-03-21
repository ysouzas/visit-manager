import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useAppData } from './hooks/useAppData';
import { api } from './services/api';
import type { TimeSlot } from './types';
import { generateGoogleCalendarLink } from './utils/calendar';

// Components
import { Header } from './components/layout/Header';
import { MyBooking } from './components/visitor/MyBooking';
import { SlotPicker } from './components/visitor/SlotPicker';
import { BookingForm } from './components/visitor/BookingForm';
import { SuccessView } from './components/visitor/SuccessView';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ManageSlots } from './components/admin/ManageSlots';
import { Schedule } from './components/admin/Schedule';

import './App.css';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'mateus';

function App() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    config,
    slots,
    visits,
    myVisit,
    isLoading,
    fetchData,
    handleCancelVisit
  } = useAppData();

  // Admin State
  const [adminTab, setAdminTab] = useState<'schedule' | 'settings'>('schedule');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Selection State
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorCount, setVisitorCount] = useState(1);
  const [adminPassword, setAdminPassword] = useState('');
  
  const [newSlotDate, setNewSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSlotStart, setNewSlotStart] = useState('10:00');
  const [newSlotEnd, setNewSlotEnd] = useState('19:00');
  const [newMaxVisitors, setNewMaxVisitors] = useState(10);

  // Admin Actions
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAdminPassword('');
    } else {
      alert(t('login.error'));
    }
  };

  const handleAddSlot = async () => {
    const startHour = parseInt(newSlotStart.split(':')[0]);
    const endHour = parseInt(newSlotEnd.split(':')[0]);
    const slotsToCreate: Omit<TimeSlot, 'id'>[] = [];

    if (endHour > startHour) {
      for (let h = startHour; h < endHour; h++) {
        slotsToCreate.push({
          date: newSlotDate,
          starttime: `${h.toString().padStart(2, '0')}:00`,
          endtime: `${(h + 1).toString().padStart(2, '0')}:00`,
          currentvisitors: 0,
          maxvisitors: newMaxVisitors
        });
      }
    } else {
      slotsToCreate.push({ date: newSlotDate, starttime: newSlotStart, endtime: newSlotEnd, currentvisitors: 0, maxvisitors: newMaxVisitors });
    }

    const { error } = await api.createSlots(slotsToCreate);
    if (!error) fetchData();
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Are you sure?')) return;
    const { error } = await api.deleteSlot(id);
    if (!error) fetchData();
  };

  // Visitor Actions
  const handleBooking = async (e: React.FormEvent, slot: TimeSlot) => {
    e.preventDefault();
    const visitData = {
      slotid: slot.id!,
      date: slot.date,
      starttime: slot.starttime,
      endtime: slot.endtime,
      visitorname: visitorName,
      visitorcount: visitorCount,
      createdat: new Date().toISOString()
    };

    const { data: savedVisit, error } = await api.createVisit(visitData);
    if (!error && savedVisit) {
      await api.updateSlotVisitors(slot.id!, slot.currentvisitors + visitorCount);
      localStorage.setItem('my_visit_id', savedVisit.id);
      fetchData();
      navigate('/success');
    }
  };

  const onDownloadCalendar = (slot: TimeSlot) => {
    if (!slot) return;
    window.open(generateGoogleCalendarLink(slot, config), '_blank');
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString(i18n.language, { 
      weekday: 'short', day: 'numeric', month: 'short' 
    });
  };

  // Rendering
  if (isLoading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="app-container">
      <Header config={config} onAdminClick={() => navigate('/admin')} />

      <main className="main-content">
        <Routes>
          <Route path="/" element={
            <div className="fade-in">
              {myVisit && <MyBooking myVisit={myVisit} onCancel={() => handleCancelVisit(myVisit)} />}
              <SlotPicker 
                slots={slots}
                selectedDate={slots.length > 0 ? slots[0].date : ''} 
                onDateSelect={() => {}} 
                onSlotSelect={(slot) => { setSelectedSlot(slot); navigate(`/booking/${slot.id}`); }}
                formatDateShort={formatDateShort}
              />
            </div>
          } />
          
          <Route path="/booking/:slotId" element={
            selectedSlot ? (
              <BookingForm 
                selectedSlot={selectedSlot}
                visitorName={visitorName}
                visitorCount={visitorCount}
                onNameChange={setVisitorName}
                onCountChange={setVisitorCount}
                onConfirm={(e) => handleBooking(e, selectedSlot)}
                onCancel={() => navigate('/')}
              />
            ) : <Navigate to="/" />
          } />

          <Route path="/success" element={
            selectedSlot ? (
              <SuccessView 
                visitorName={visitorName}
                config={config}
                selectedSlot={selectedSlot}
                onBack={() => navigate('/')}
                onDownloadCalendar={() => onDownloadCalendar(selectedSlot)}
              />
            ) : <Navigate to="/" />
          } />

          <Route path="/admin" element={
            !isAuthenticated ? (
              <AdminLogin 
                password={adminPassword} 
                onPasswordChange={setAdminPassword} 
                onSubmit={handleAdminLogin}
                onCancel={() => navigate('/')}
              />
            ) : (
              <AdminDashboard 
                activeTab={adminTab} 
                onTabChange={setAdminTab} 
                onLogout={() => setIsAuthenticated(false)}
              >
                {adminTab === 'settings' ? (
                  <ManageSlots 
                    slots={slots}
                    newSlotDate={newSlotDate} 
                    newSlotStart={newSlotStart}
                    newSlotEnd={newSlotEnd}
                    maxVisitors={newMaxVisitors}
                    onDateChange={setNewSlotDate}
                    onStartChange={setNewSlotStart}
                    onEndChange={setNewSlotEnd}
                    onMaxVisitorsChange={setNewMaxVisitors}
                    onAddSlot={handleAddSlot}
                    onDeleteSlot={handleDeleteSlot}
                  />
                ) : (
                  <Schedule visits={visits} onCancelVisit={handleCancelVisit} />
                )}
              </AdminDashboard>
            )
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;

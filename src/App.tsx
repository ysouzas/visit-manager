import { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { supabase } from './supabaseClient';
import type { TimeSlot, ParentConfig, Visit } from './types';
import { generateGoogleCalendarLink, generateICSFile } from './utils/calendar';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [config, setConfig] = useState<ParentConfig>({
    babyname: '',
    parentnames: '',
    hospitalname: '',
    roomnumber: '',
    mapslink: 'https://maps.app.goo.gl/YduTVuUDAxRi8mEW8'
  });
  const [visits, setVisits] = useState<Visit[]>([]);
  const [view, setView] = useState<'list' | 'booking' | 'success' | 'settings' | 'schedule' | 'login'>('list');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visitorname, setVisitorname] = useState('');
  const [visitorcount, setVisitorcount] = useState(1);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingView, setPendingView] = useState<'settings' | 'schedule' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Slot Management State (Settings)
  const [newSlotDate, setNewSlotDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSlotStart, setNewSlotStart] = useState('10:00');
  const [newSlotEnd, setNewSlotEnd] = useState('11:00');

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  async function fetchData() {
    setIsLoading(true);
    
    // 1. Fetch Config
    const { data: configData, error: configError } = await supabase
      .from('settings')
      .select('*')
      .single();
    
    if (!configError && configData) {
      setConfig(configData);
    }

    // 2. Fetch Slots
    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .order('date', { ascending: true })
      .order('starttime', { ascending: true });

    if (!slotsError && slotsData && slotsData.length > 0) {
      setSlots(slotsData);
      setSelectedDate(slotsData[0].date);
    }

    // 3. Fetch Visits
    const { data: visitsData, error: visitsError } = await supabase
      .from('visits')
      .select('*');
    
    if (!visitsError && visitsData) {
      setVisits(visitsData);
    }

    setIsLoading(false);
  }

  const handleSelectSlot = (slot: TimeSlot) => {
    if (slot.currentvisitors >= slot.maxvisitors) return;
    setSelectedSlot(slot);
    setView('booking');
  };
  
  const handleAdminClick = () => {
    if (isAuthenticated) {
      setView('settings');
    } else {
      setPendingView('settings');
      setView('login');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'newborn2026';
    if (password === adminPassword) {
      setIsAuthenticated(true);
      if (pendingView) {
        setView(pendingView);
        setPendingView(null);
      } else {
        setView('list');
      }
      setPassword('');
    } else {
      alert(t('login.error'));
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    const newVisit = {
      slotid: selectedSlot.id,
      date: selectedSlot.date,
      starttime: selectedSlot.starttime,
      endtime: selectedSlot.endtime,
      visitorname,
      visitorcount,
      createdat: new Date().toISOString(),
    };

    const { data: savedVisit, error: visitError } = await supabase
      .from('visits')
      .insert([newVisit])
      .select()
      .single();

    if (visitError) {
      alert('Error saving visit: ' + visitError.message);
      return;
    }

    const newCount = selectedSlot.currentvisitors + visitorcount;
    await supabase.from('slots').update({ currentvisitors: newCount }).eq('id', selectedSlot.id);

    setVisits(prev => [...prev, savedVisit as Visit]);
    setSlots(prev => prev.map(s => s.id === selectedSlot.id ? { ...s, currentvisitors: newCount } : s));
    setView('success');
  };

  const updateConfigField = async (field: keyof ParentConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    await supabase.from('settings').update({ [field]: value }).eq('babyname', config.babyname);
  };

  const handleAddSlot = async () => {
    const startHour = parseInt(newSlotStart.split(':')[0]);
    const endHour = parseInt(newSlotEnd.split(':')[0]);
    const slotsToCreate: TimeSlot[] = [];
    
    if (startHour < endHour) {
      for (let h = startHour; h < endHour; h++) {
        slotsToCreate.push({
          date: newSlotDate,
          starttime: `${h.toString().padStart(2, '0')}:00`,
          endtime: `${(h + 1).toString().padStart(2, '0')}:00`,
          maxvisitors: 2,
          currentvisitors: 0
        });
      }
    } else {
      slotsToCreate.push({
        date: newSlotDate, starttime: newSlotStart, endtime: newSlotEnd, maxvisitors: 2, currentvisitors: 0
      });
    }

    const { data, error } = await supabase.from('slots').insert(slotsToCreate).select();
    if (!error && data) {
      const updatedSlots = [...slots, ...data].sort((a, b) => (a.date + a.starttime).localeCompare(b.date + b.starttime));
      setSlots(updatedSlots);
      if (!selectedDate) setSelectedDate(data[0].date);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to remove this time slot?')) return;
    const { error } = await supabase.from('slots').delete().eq('id', id);
    if (!error) {
      setSlots(prev => prev.filter(s => s.id !== id));
    }
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString(i18n.language, { 
      weekday: 'short', day: 'numeric', month: 'short' 
    });
  };

  const renderSlotList = () => {
    const dates = Array.from(new Set(slots.map(s => s.date))).sort();
    const filteredSlots = slots.filter(s => s.date === selectedDate);

    return (
      <div className="fade-in">
        <header className="hero">
          <div className="top-actions">
            <button className="nav-btn" onClick={handleAdminClick}>🔒 {t('nav.admin')}</button>
          </div>
          <h1>{t('hero.welcome', { name: config.babyname })}</h1>
          <p className="parent-intro">{t('hero.from', { names: config.parentnames })}</p>
          <p className="subtitle">{t('hero.subtitle')}</p>
        </header>

        {isLoading ? (
          <div className="loading-spinner">Loading...</div>
        ) : (
          <div className="visitor-booking-container">
            {/* 1. Date Selector */}
            <div className="date-selector">
              {dates.map(date => (
                <button 
                  key={date} 
                  className={`date-tab ${selectedDate === date ? 'active' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  {formatDateShort(date)}
                </button>
              ))}
            </div>

            {/* 2. Hour Grid */}
            <div className="hour-grid-container">
              <h3>{selectedDate && new Date(selectedDate + 'T12:00:00').toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
              <div className="hour-grid">
                {filteredSlots.length === 0 ? (
                  <p className="no-slots">No times available for this day.</p>
                ) : (
                  filteredSlots.map(slot => {
                    const isFull = slot.currentvisitors >= slot.maxvisitors;
                    return (
                      <button 
                        key={slot.id} 
                        className={`hour-btn ${isFull ? 'full' : ''}`}
                        onClick={() => !isFull && handleSelectSlot(slot)}
                        disabled={isFull}
                      >
                        <span className="time-range">{slot.starttime}</span>
                        <span className="spots">
                          {isFull ? t('common.full') : t('common.spots_left', { count: slot.maxvisitors - slot.currentvisitors })}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderBookingForm = () => (
    <div className="fade-in">
      <button className="back-btn" onClick={() => setView('list')}>← {t('common.back')}</button>
      <div className="card booking-card">
        <h2>{t('booking.title')}</h2>
        <p className="booking-summary">
          <strong>{t('booking.date')}:</strong> {selectedSlot && new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}<br/>
          <strong>{t('booking.time')}:</strong> {selectedSlot?.starttime} - {selectedSlot?.endtime}
        </p>
        <form onSubmit={handleBooking}>
          <div className="input-group">
            <label>{t('booking.visitor_name')}</label>
            <input required type="text" value={visitorname} onChange={e => setVisitorname(e.target.value)} placeholder={t('booking.visitor_name_placeholder')} />
          </div>
          <div className="input-group">
            <label>{t('booking.visitor_count')}</label>
            <input type="number" min="1" max={selectedSlot ? selectedSlot.maxvisitors - selectedSlot.currentvisitors : 1} value={visitorcount} onChange={e => setVisitorcount(parseInt(e.target.value))} />
          </div>
          <button type="submit" className="w-full">{t('booking.confirm_btn')}</button>
        </form>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="fade-in success-view">
      <div className="card">
        <div className="success-icon">🎉</div>
        <h2>{t('success.title', { name: visitorname })}</h2>
        <p><Trans i18nKey="success.message" values={{ babyName: config.babyname }}>You're all set to visit <strong>{config.babyname}</strong>.</Trans></p>
        <div className="visit-details">
          <p><strong>{t('success.where')}:</strong> {config.hospitalname}, {t('success.room')} {config.roomnumber}</p>
          <p><strong>{t('success.when')}:</strong> {selectedSlot && new Date(selectedSlot.date + 'T12:00:00').toLocaleDateString(i18n.language, { weekday: 'long', month: 'long', day: 'numeric' })}, {selectedSlot?.starttime} - {selectedSlot?.endtime}</p>
        </div>
        <div className="calendar-actions">
          <a href={config.mapslink} target="_blank" rel="noreferrer" className="calendar-btn maps">📍 {t('success.open_maps')}</a>
<br/>
          <a href={selectedSlot ? generateGoogleCalendarLink(selectedSlot, config) : '#'} target="_blank" rel="noreferrer" className="calendar-btn google">{t('success.google_cal')}</a>
          <a href={selectedSlot ? generateICSFile(selectedSlot, config) : '#'} download="baby-visit.ics" className="calendar-btn apple">{t('success.add_to_apple')}</a>
        </div>
        <button className="outline-btn" onClick={() => { setView('list'); setVisitorname(''); setVisitorcount(1); }}>{t('common.back_to_slots')}</button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="fade-in">
      {isAuthenticated ? (
        <div className="admin-nav">
          <button className={`nav-tab ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>⚙️ {t('nav.settings')}</button>
          <button className={`nav-tab ${view === 'schedule' ? 'active' : ''}`} onClick={() => setView('schedule')}>📅 {t('nav.schedule')}</button>
          <button className="nav-tab logout" onClick={() => setView('list')}>🚪 {t('common.back_to_visitor_view')}</button>
        </div>
      ) : (
        <button className="back-btn" onClick={() => setView('list')}>← {t('common.back_to_visitor_view')}</button>
      )}
      <div className="card settings-card">
        <h2>{t('settings.title')}</h2>
        <div className="input-group">
          <label>{t('settings.baby_name')}</label>
          <input type="text" value={config.babyname} onChange={e => updateConfigField('babyname', e.target.value)} />
        </div>
        <div className="input-group">
          <label>{t('settings.parent_names')}</label>
          <input type="text" value={config.parentnames} onChange={e => updateConfigField('parentnames', e.target.value)} />
        </div>
        <div className="input-group">
          <label>{t('settings.hospital_name')}</label>
          <input type="text" value={config.hospitalname} onChange={e => updateConfigField('hospitalname', e.target.value)} />
        </div>
        <div className="input-group">
          <label>{t('settings.maps_link')}</label>
          <input type="text" value={config.mapslink} onChange={e => updateConfigField('mapslink', e.target.value)} />
        </div>
      </div>
      <div className="card settings-card">
        <h2>Manage Time Slots</h2>
        <p className="hint" style={{ marginTop: 0, marginBottom: '1rem' }}>Tip: Enter a range (e.g. 10:00 to 19:00) to auto-generate hourly slots.</p>
        <div className="add-slot-form">
          <div className="input-group">
            <label>Date</label>
            <input type="date" value={newSlotDate} onChange={e => setNewSlotDate(e.target.value)} />
          </div>
          <div className="input-row">
            <div className="input-group">
              <label>Start</label>
              <input type="time" value={newSlotStart} onChange={e => setNewSlotStart(e.target.value)} />
            </div>
            <div className="input-group">
              <label>End</label>
              <input type="time" value={newSlotEnd} onChange={e => setNewSlotEnd(e.target.value)} />
            </div>
          </div>
          <button className="w-full" onClick={handleAddSlot}>Add New Slot</button>
        </div>
        <div className="manage-slots-list">
          {slots.map(slot => (
            <div key={slot.id} className="manage-slot-item">
              <span>{slot.date} | {slot.starttime}-{slot.endtime}</span>
              <button className="delete-btn" onClick={() => slot.id && handleDeleteSlot(slot.id)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="fade-in">
      {isAuthenticated ? (
        <div className="admin-nav">
          <button className={`nav-tab ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>⚙️ {t('nav.settings')}</button>
          <button className={`nav-tab ${view === 'schedule' ? 'active' : ''}`} onClick={() => setView('schedule')}>📅 {t('nav.schedule')}</button>
          <button className="nav-tab logout" onClick={() => setView('list')}>🚪 {t('common.back_to_visitor_view')}</button>
        </div>
      ) : (
        <button className="back-btn" onClick={() => setView('list')}>← {t('common.back_to_slots')}</button>
      )}
      <div className="card schedule-card">
        <h2>{t('schedule.title')}</h2>
        {visits.length === 0 ? (
          <p className="no-visits">{t('schedule.empty')}</p>
        ) : (
          <div className="visits-list">
            {visits.sort((a, b) => (a.date + a.starttime).localeCompare(b.date + b.starttime)).map(visit => (
              <div key={visit.id} className="visit-item">
                <div className="visit-time-info">
                  <span className="visit-date">{new Date(visit.date + 'T12:00:00').toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}</span>
                  <span className="visit-time">{visit.starttime} - {visit.endtime}</span>
                </div>
                <div className="visit-visitor-info">
                  <span className="visit-name">{visit.visitorname}</span>
                  <span className="visit-count">{visit.visitorcount} {visit.visitorcount === 1 ? t('schedule.person') : t('schedule.people')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderLogin = () => (
    <div className="fade-in">
      {window.location.pathname !== '/parents' && (
        <button className="back-btn" onClick={() => setView('list')}>← {t('common.back')}</button>
      )}
      <div className="card login-card">
        <h2>{t('login.title')}</h2>
        <p className="subtitle">{t('login.subtitle', { view: pendingView })}</p>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>{t('login.password')}</label>
            <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('login.password_placeholder')} autoFocus />
          </div>
          <button type="submit" className="w-full">{t('login.sign_in')}</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="app-container">
      {view === 'list' && renderSlotList()}
      {view === 'booking' && renderBookingForm()}
      {view === 'success' && renderSuccess()}
      {view === 'settings' && isAuthenticated && renderSettings()}
      {view === 'schedule' && isAuthenticated && renderSchedule()}
      {view === 'login' && renderLogin()}
      {(view === 'settings' || view === 'schedule') && !isAuthenticated && renderLogin()}
    </div>
  );
}

export default App;

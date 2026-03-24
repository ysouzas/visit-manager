import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { useAppData } from "./hooks/useAppData";
import { api } from "./services/api";
import type { TimeSlot } from "./types";
import { generateGoogleCalendarLink, generateICSFile } from "./utils/calendar";

// Components
import { Header } from "./components/layout/Header";
import { MyBooking } from "./components/visitor/MyBooking";
import { SlotPicker } from "./components/visitor/SlotPicker";
import { BookingForm } from "./components/visitor/BookingForm";
import { SuccessView } from "./components/visitor/SuccessView";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { ManageSlots } from "./components/admin/ManageSlots";
import { Schedule } from "./components/admin/Schedule";
import { ConfigForm } from "./components/admin/ConfigForm";

import "./App.css";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "mateus";

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
    handleCancelVisit,
    handleUpdateConfig,
  } = useAppData();

  // Track if we've done initial redirect to prevent loop
  const redirectDoneRef = React.useRef(false);

  // Admin State
  const [adminTab, setAdminTab] = useState<"schedule" | "settings">("schedule");
  const [settingsTab, setSettingsTab] = useState<"parent" | "slots">("parent");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Selection State
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorCount, setVisitorCount] = useState(1);
  const [adminPassword, setAdminPassword] = useState("");

  const [newSlotDate, setNewSlotDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [newSlotStart, setNewSlotStart] = useState("10:00");
  const [newSlotEnd, setNewSlotEnd] = useState("19:00");
  const [newMaxVisitors, setNewMaxVisitors] = useState(10);

  // Update document title and meta tags based on language
  useEffect(() => {
    document.title = t("page.title");

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", t("page.description"));
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute("content", t("page.title"));
    }

    const ogDescription = document.querySelector(
      'meta[property="og:description"]',
    );
    if (ogDescription) {
      ogDescription.setAttribute("content", t("page.description"));
    }

    const twitterTitle = document.querySelector(
      'meta[property="twitter:title"]',
    );
    if (twitterTitle) {
      twitterTitle.setAttribute("content", t("page.title"));
    }

    const twitterDescription = document.querySelector(
      'meta[property="twitter:description"]',
    );
    if (twitterDescription) {
      twitterDescription.setAttribute("content", t("page.description"));
    }
  }, [t]);

  // Reset redirect flag when visit is cancelled
  useEffect(() => {
    if (!myVisit) {
      redirectDoneRef.current = false;
    }
  }, [myVisit]);

  // Redirect to success page if user has a stored visit (only on initial load)
  useEffect(() => {
    if (
      !isLoading &&
      myVisit &&
      !redirectDoneRef.current &&
      window.location.pathname === "/"
    ) {
      redirectDoneRef.current = true;
      navigate("/success", { state: { rescueCode: myVisit.rescuecode } });
    }
  }, [isLoading, navigate, myVisit]);

  // Admin Actions
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAdminPassword("");
    } else {
      alert(t("login.error"));
    }
  };

  const handleAddSlot = async () => {
    const startHour = parseInt(newSlotStart.split(":")[0]);
    const endHour = parseInt(newSlotEnd.split(":")[0]);
    const slotsToCreate: Omit<TimeSlot, "id">[] = [];

    if (endHour > startHour) {
      for (let h = startHour; h < endHour; h++) {
        slotsToCreate.push({
          date: newSlotDate,
          starttime: `${h.toString().padStart(2, "0")}:00`,
          endtime: `${(h + 1).toString().padStart(2, "0")}:00`,
          currentvisitors: 0,
          maxvisitors: newMaxVisitors,
        });
      }
    } else {
      slotsToCreate.push({
        date: newSlotDate,
        starttime: newSlotStart,
        endtime: newSlotEnd,
        currentvisitors: 0,
        maxvisitors: newMaxVisitors,
      });
    }

    const { error } = await api.createSlots(slotsToCreate);
    if (!error) fetchData();
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await api.deleteSlot(id);
    if (!error) fetchData();
  };

  // Helper
  const generateRescueCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Visitor Actions
  const handleBooking = async (e: React.FormEvent, slot: TimeSlot) => {
    e.preventDefault();
    const rescueCode = generateRescueCode();
    const visitData = {
      slotid: slot.id!,
      date: slot.date,
      starttime: slot.starttime,
      endtime: slot.endtime,
      visitorname: visitorName,
      visitorcount: visitorCount,
      rescuecode: rescueCode,
      createdat: new Date().toISOString(),
    };

    const { data: savedVisit, error } = await api.createVisit(visitData);
    if (!error && savedVisit) {
      await api.updateSlotVisitors(
        slot.id!,
        slot.currentvisitors + visitorCount,
      );
      localStorage.setItem("my_visit_id", savedVisit.id);
      fetchData();
      navigate("/success", { state: { rescueCode } });
    }
  };

  const handleRescueBooking = async (code: string) => {
    if (!code) return;
    const visit = await api.getVisitByCode(code.trim().toUpperCase());
    if (visit) {
      localStorage.setItem("my_visit_id", visit.id);
      fetchData();
      navigate("/success", {
        state: { rescueCode: code.trim().toUpperCase() },
      });
    } else {
      alert(t("booking.rescue_error"));
    }
  };

  const onDownloadCalendar = (type: "apple" | "google") => {
    const slot =
      selectedSlot ||
      (myVisit
        ? ({
            date: myVisit.date,
            starttime: myVisit.starttime,
            endtime: myVisit.endtime,
          } as TimeSlot)
        : null);
    if (!slot) return;
    if (type === "google") {
      window.open(generateGoogleCalendarLink(slot, config), "_blank");
    } else {
      const url = generateICSFile(slot, config);
      const a = document.createElement("a");
      a.href = url;
      a.download = "visit.ics";
      a.click();
    }
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr + "T12:00:00").toLocaleDateString(i18n.language, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Rendering
  if (isLoading) return <div className="loading-spinner">Loading...</div>;

  return (
    <div className="app-container">
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <div className="fade-in">
                <Header
                  config={config}
                  onAdminClick={() => navigate("/admin")}
                />
                {myVisit && (
                  <MyBooking
                    myVisit={myVisit}
                    onCancel={() => handleCancelVisit(myVisit)}
                  />
                )}
                {!myVisit && (
                  <div className="rescue-section">
                    <button
                      className="text-btn"
                      onClick={() => {
                        const code = prompt(t("booking.rescue_prompt"));
                        if (code) handleRescueBooking(code);
                      }}
                    >
                      ✨ {t("booking.rescue_btn")}
                    </button>
                  </div>
                )}
                <SlotPicker
                  slots={slots}
                  selectedDate={slots.length > 0 ? slots[0].date : ""}
                  onDateSelect={() => {}}
                  onSlotSelect={(slot) => {
                    setSelectedSlot(slot);
                    navigate(`/booking/${slot.id}`);
                  }}
                  formatDateShort={formatDateShort}
                />
              </div>
            }
          />

          <Route
            path="/booking/:slotId"
            element={
              selectedSlot ? (
                <BookingForm
                  selectedSlot={selectedSlot}
                  visitorName={visitorName}
                  visitorCount={visitorCount}
                  onNameChange={setVisitorName}
                  onCountChange={setVisitorCount}
                  onConfirm={(e) => handleBooking(e, selectedSlot)}
                  onCancel={() => navigate("/")}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/success"
            element={
              myVisit || selectedSlot ? (
                <SuccessView
                  visitorName={visitorName}
                  config={config}
                  selectedSlot={selectedSlot}
                  myVisit={myVisit}
                  onBack={() => navigate("/")}
                  onDownloadCalendar={onDownloadCalendar}
                />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          <Route
            path="/admin"
            element={
              !isAuthenticated ? (
                <AdminLogin
                  password={adminPassword}
                  onPasswordChange={setAdminPassword}
                  onSubmit={handleAdminLogin}
                  onCancel={() => navigate("/")}
                />
              ) : (
                <AdminDashboard
                  activeTab={adminTab}
                  onTabChange={setAdminTab}
                  onLogout={() => setIsAuthenticated(false)}
                >
                  {adminTab === "settings" ? (
                    <div>
                      <div className="sub-nav">
                        <button
                          className={`nav-tab ${settingsTab === "parent" ? "active" : ""}`}
                          onClick={() => setSettingsTab("parent")}
                        >
                          {t("settings.parent_config")}
                        </button>
                        <button
                          className={`nav-tab ${settingsTab === "slots" ? "active" : ""}`}
                          onClick={() => setSettingsTab("slots")}
                        >
                          {t("settings.manage_slots")}
                        </button>
                      </div>

                      {settingsTab === "parent" ? (
                        <ConfigForm
                          config={config}
                          onSave={handleUpdateConfig}
                        />
                      ) : (
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
                      )}
                    </div>
                  ) : (
                    <Schedule
                      visits={visits}
                      onCancelVisit={handleCancelVisit}
                    />
                  )}
                </AdminDashboard>
              )
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;

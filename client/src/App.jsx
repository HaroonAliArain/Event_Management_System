import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Toast from './components/common/Toast';
import DashboardPage from './pages/DashboardPage';
import EventsPage from './pages/EventsPage';
import CustomersPage from './pages/CustomersPage';
import BookingsPage from './pages/BookingsPage';
import { ChevronUp } from 'lucide-react';

// Main application component coordinating navigation and alerts
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [preselectedEventForBooking, setPreselectedEventForBooking] = useState(null);

  // Trigger floating alert toast notification
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Cross-page navigation helper
  const handleNavigate = (tab) => {
    setActiveTab(tab);
  };

  // Handle direct event booking from event card
  const handleBookEvent = (eventDoc) => {
    setPreselectedEventForBooking(eventDoc);
    setActiveTab('bookings');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      {/* Global floating toast feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Top navigation header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Primary page container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === 'dashboard' && (
          <DashboardPage onNavigate={handleNavigate} showToast={showToast} />
        )}
        {activeTab === 'events' && (
          <EventsPage
            onBookEvent={handleBookEvent}
            showToast={showToast}
          />
        )}
        {activeTab === 'customers' && (
          <CustomersPage showToast={showToast} />
        )}
        {activeTab === 'bookings' && (
          <BookingsPage
            preselectedEvent={preselectedEventForBooking}
            showToast={showToast}
          />
        )}
      </main>

      {/* Production footer with quick navigation and operational shortcuts */}
      <footer className="bg-white border-t border-zinc-200/80 mt-14 text-sm text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-zinc-100">
            {/* Brand identity column */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-amber-500 font-mono text-xs font-bold">
                  EV
                </div>
                <span className="font-bold text-base text-zinc-900 tracking-tight">Eventify</span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed max-w-sm">
                Streamlined event scheduling, real-time ticket reservations, and digital admission pass management platform.
              </p>
            </div>

            {/* Quick page navigation links */}
            <div>
              <h4 className="font-semibold text-zinc-900 mb-3 text-xs uppercase tracking-wider">
                Pages
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleNavigate('dashboard')}
                    className={`transition-colors ${activeTab === 'dashboard' ? 'font-semibold text-zinc-900' : 'text-zinc-600 hover:text-amber-600'}`}
                  >
                    Overview Dashboard
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('events')}
                    className={`transition-colors ${activeTab === 'events' ? 'font-semibold text-zinc-900' : 'text-zinc-600 hover:text-amber-600'}`}
                  >
                    Event Schedules
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('customers')}
                    className={`transition-colors ${activeTab === 'customers' ? 'font-semibold text-zinc-900' : 'text-zinc-600 hover:text-amber-600'}`}
                  >
                    Attendee Registry
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('bookings')}
                    className={`transition-colors ${activeTab === 'bookings' ? 'font-semibold text-zinc-900' : 'text-zinc-600 hover:text-amber-600'}`}
                  >
                    Ticket Reservations
                  </button>
                </li>
              </ul>
            </div>

            {/* Operational shortcuts */}
            <div>
              <h4 className="font-semibold text-zinc-900 mb-3 text-xs uppercase tracking-wider">
                Shortcuts
              </h4>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => handleNavigate('events')}
                    className="text-zinc-600 hover:text-amber-600 transition-colors"
                  >
                    Schedule New Event
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('bookings')}
                    className="text-zinc-600 hover:text-amber-600 transition-colors"
                  >
                    Issue Admission Pass
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleNavigate('customers')}
                    className="text-zinc-600 hover:text-amber-600 transition-colors"
                  >
                    Register Attendee
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom copyright and back to top icon button */}
          <div className="pt-6 flex items-center justify-between gap-4">
            <span className="text-xs text-zinc-400">© 2026 Eventify. All rights reserved.</span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-amber-50 text-zinc-600 hover:text-amber-600 border border-zinc-200/80 hover:border-amber-300 flex items-center justify-center transition-colors"
              aria-label="Back to top"
              title="Back to top"
            >
              <ChevronUp className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

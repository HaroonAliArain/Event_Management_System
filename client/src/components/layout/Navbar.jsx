import React, { useState } from 'react';
import { Calendar, Users, Ticket, LayoutDashboard, Menu, X } from 'lucide-react';

// Main navigation header with desktop tabs and mobile drawer
export default function Navbar({ activeTab, setActiveTab }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'customers', label: 'Attendees', icon: Users },
    { id: 'bookings', label: 'Reservations', icon: Ticket },
  ];

  const handleTabClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-white border-b border-zinc-200/80 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand mark and title */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => handleTabClick('dashboard')}
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-500">
              <span className="font-mono font-bold text-sm tracking-tighter">EV</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-zinc-900">Eventify</span>
          </div>

          {/* Desktop navigation tabs */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                    isActive
                      ? 'bg-zinc-900 text-white'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
                  }`}
                >
                  <Icon className="w-4 h-4" strokeWidth={1.8} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Mobile hamburger menu toggle */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-white'
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.8} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}

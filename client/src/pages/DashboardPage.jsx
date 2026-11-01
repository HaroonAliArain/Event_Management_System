import React, { useEffect, useState } from 'react';
import { statsApi } from '../services/api';
import { DollarSign, Calendar, Users, Ticket, Clock, MapPin } from 'lucide-react';

// Overview dashboard displaying operational metrics and recent activity
export default function DashboardPage({ onNavigate, showToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch summary metrics on mount
  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await statsApi.getStats();
      setStats(res.data);
    } catch (err) {
      showToast('error', `Failed to load dashboard metrics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
          <span className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin"></span>
          Loading overview data...
        </div>
      </div>
    );
  }

  const overview = stats?.overview || {};
  const recentBookings = stats?.recentBookings || [];
  const upcomingEvents = stats?.upcomingEvents || [];
  const categories = stats?.categoryBreakdown || {};

  return (
    <div className="space-y-8">
      {/* Front Hero Banner with High Visibility Real Photography */}
      <section className="relative rounded-2xl overflow-hidden shadow-xs bg-zinc-950 text-white min-h-[440px] sm:min-h-[500px] flex items-center">
        {/* Real Event Check-in Photography Background with full clarity */}
        <img
          src="/banner.png"
          alt="Event Admission and Registration Check-in"
          className="absolute inset-0 w-full h-full object-cover object-right sm:object-center opacity-100"
        />

        {/* Directional gradient overlay preserving natural lighting while protecting text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/50 to-transparent"></div>

        {/* Text directly on picture without separate background card */}
        <div className="relative z-10 p-6 sm:p-12 lg:p-14 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Event Operations & Check-in
          </h1>
          <p className="mt-3 text-sm sm:text-base text-zinc-200 leading-relaxed max-w-lg drop-shadow-sm">
            Monitor real-time event capacity, issue digital admission passes, and coordinate attendee registrations.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('events')}
              className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              Schedule Event
            </button>
            <button
              onClick={() => onNavigate('bookings')}
              className="px-5 py-2.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-900 text-white border border-zinc-700/80 font-semibold text-sm transition-colors shadow-sm"
            >
              Issue Ticket
            </button>
          </div>
        </div>
      </section>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-600">Total Revenue</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200/60">
              <DollarSign className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">
              Rs. {(overview.totalRevenue || 0).toLocaleString()}
            </h3>
            <span className="text-sm text-zinc-500 font-medium">Confirmed admissions revenue</span>
          </div>
        </div>

        {/* Tickets Sold */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-600">Tickets Issued</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200/60">
              <Ticket className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">
              {overview.totalTicketsSold || 0}
            </h3>
            <span className="text-sm text-zinc-500 font-medium">Across {overview.totalBookings || 0} completed orders</span>
          </div>
        </div>

        {/* Scheduled Events */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-600">Active Events</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200/60">
              <Calendar className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">
              {overview.activeEvents || 0}
            </h3>
            <span className="text-sm text-zinc-500 font-medium">{overview.totalEvents || 0} total listings managed</span>
          </div>
        </div>

        {/* Attendee Directory */}
        <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-600">Registered Attendees</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center border border-amber-200/60">
              <Users className="w-4 h-4" strokeWidth={1.75} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">
              {overview.totalCustomers || 0}
            </h3>
            <span className="text-sm text-zinc-500 font-medium">{overview.overallOccupancyRate || 0}% overall seat capacity utilized</span>
          </div>
        </div>
      </div>

      {/* Main Content Split: Upcoming Events and Recent Reservations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Upcoming Events Column */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200/80 p-6 shadow-xs h-fit">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div>
              <h2 className="text-base font-bold text-zinc-900">Upcoming Event Schedules</h2>
            </div>
            <button
              onClick={() => onNavigate('events')}
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 transition-colors"
            >
              All Events ({overview.totalEvents})
            </button>
          </div>

          <div className="divide-y divide-zinc-100 mt-3">
            {upcomingEvents.map((evt) => {
              const booked = evt.bookedSeats || 0;
              const cap = evt.totalCapacity || 1;
              const pct = Math.round((booked / cap) * 100);

              return (
                <div
                  key={evt._id}
                  className="py-4 first:pt-2 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={evt.bannerUrl}
                      alt={evt.title}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-zinc-100 border border-zinc-200"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-800">
                          {evt.category}
                        </span>
                        <span className="text-xs text-zinc-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          {new Date(evt.eventDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-zinc-900 mt-1 line-clamp-1">{evt.title}</h4>
                      <p className="text-sm text-zinc-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        {evt.venue}
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:w-40 flex flex-col items-end gap-1.5 flex-shrink-0 text-right">
                    <span className="text-sm font-bold text-zinc-900">
                      Rs. {(evt.ticketPrice || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-zinc-500">
                      {evt.availableSeats} of {evt.totalCapacity} seats left
                    </span>
                    <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-600 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Recent Reservations and Structured Category Breakdown */}
        <div className="space-y-6 h-fit">
          {/* Recent Reservations Card */}
          <div className="bg-white rounded-xl border border-zinc-200/80 p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-900">Recent Bookings</h2>
              <button
                onClick={() => onNavigate('bookings')}
                className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 transition-colors"
              >
                View Registry
              </button>
            </div>

            <div className="divide-y divide-zinc-100 mt-2">
              {recentBookings.map((b) => (
                <div key={b._id} className="py-3.5 first:pt-2 last:pb-0 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h5 className="text-sm font-semibold text-zinc-900 truncate">
                      {b.customer?.fullName || 'Attendee'}
                    </h5>
                    <p className="text-xs text-zinc-500 truncate mt-0.5">
                      {b.event?.title || 'Event'}
                    </p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <span
                      className={`inline-flex items-center justify-center min-w-[80px] px-2.5 py-1 rounded-md text-xs font-semibold ${
                        b.bookingStatus === 'Confirmed'
                          ? 'bg-amber-50 text-amber-900 border border-amber-200/80'
                          : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                      }`}
                    >
                      {b.bookingStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Structured Category Breakdown */}
          <div className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100">
              <h2 className="text-base font-bold text-zinc-900">Category Breakdown</h2>
              <span className="text-xs text-zinc-500">{Object.keys(categories).length} active</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-3.5">
              {Object.entries(categories).map(([cat, count]) => (
                <div
                  key={cat}
                  className="p-3 rounded-lg border border-zinc-200/80 bg-zinc-50/70 hover:bg-zinc-50 hover:border-amber-300 transition-colors flex flex-col justify-between"
                >
                  <span className="text-xs font-semibold text-zinc-800 truncate" title={cat}>
                    {cat}
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-base font-bold text-zinc-900">{count}</span>
                    <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/70">
                      {count === 1 ? 'event' : 'events'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

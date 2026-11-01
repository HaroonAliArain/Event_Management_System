import React, { useEffect, useState } from 'react';
import { bookingsApi, eventsApi, customersApi } from '../services/api';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import {
  Ticket,
  Search,
  Trash2,
  Printer,
  QrCode,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

// Multipliers for ticket tiers
const TIER_MULTIPLIERS = {
  Standard: 1.0,
  VIP: 1.5,
  Student: 0.8,
};

// Initial state for booking creation form
const initialBookingForm = {
  customer: '',
  event: '',
  ticketQuantity: 1,
  ticketType: 'Standard',
  paymentStatus: 'Pending',
  specialRequests: '',
};

// Bookings management page with full CRUD and digital ticket generation
export default function BookingsPage({ preselectedEvent, showToast }) {
  const [bookings, setBookings] = useState([]);
  const [eventsList, setEventsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal and creation form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    ...initialBookingForm,
    event: preselectedEvent?._id || '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Digital Ticket modal state
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [selectedBookingTicket, setSelectedBookingTicket] = useState(null);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch all bookings from API
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingsApi.getAll({
        status: statusFilter !== 'All' ? statusFilter : undefined,
        search: search.trim() !== '' ? search.trim() : undefined,
      });
      setBookings(res.data || []);
    } catch (err) {
      showToast('error', `Failed to load reservations: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch active events and customers for dropdown options
  const fetchDropdownData = async () => {
    try {
      const [eventsRes, custRes] = await Promise.all([
        eventsApi.getAll({ status: 'Upcoming' }),
        customersApi.getAll(),
      ]);
      setEventsList(eventsRes.data || []);
      setCustomersList(custRes.data || []);
    } catch (err) {
      console.error('Error fetching dropdown options:', err.message);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, search]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // Update selected event if passed from Event Card click
  useEffect(() => {
    if (preselectedEvent) {
      setFormData((prev) => ({ ...prev, event: preselectedEvent._id }));
      setIsModalOpen(true);
    }
  }, [preselectedEvent]);

  // Handle open create modal
  const handleOpenCreate = () => {
    setFormData(initialBookingForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Calculate live price based on selected event, tier, and quantity
  const selectedEventDoc = eventsList.find((e) => e._id === formData.event);
  const currentBasePrice = selectedEventDoc?.ticketPrice || 0;
  const currentMultiplier = TIER_MULTIPLIERS[formData.ticketType] || 1.0;
  const calculatedTotal = (
    Number(formData.ticketQuantity) *
    currentBasePrice *
    currentMultiplier
  ).toFixed(0);

  // Validate booking form inputs
  const validateForm = () => {
    const errors = {};
    if (!formData.customer) {
      errors.customer = 'Please select an attendee.';
    }
    if (!formData.event) {
      errors.event = 'Please select an event.';
    }
    const qty = parseInt(formData.ticketQuantity, 10);
    if (isNaN(qty) || qty < 1 || qty > 10) {
      errors.ticketQuantity = 'Quantity must be between 1 and 10.';
    } else if (selectedEventDoc && selectedEventDoc.availableSeats < qty) {
      errors.ticketQuantity = `Only ${selectedEventDoc.availableSeats} seat(s) available for this event!`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit new booking
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const res = await bookingsApi.create(formData);
      showToast('success', 'Reservation confirmed and seat reserved');
      setIsModalOpen(false);
      fetchBookings();
      fetchDropdownData();
      setSelectedBookingTicket(res.data);
      setTicketModalOpen(true);
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle booking status between Confirmed and Cancelled
  const handleToggleStatus = async (booking) => {
    const nextStatus = booking.bookingStatus === 'Confirmed' ? 'Cancelled' : 'Confirmed';
    try {
      await bookingsApi.update(booking._id, { bookingStatus: nextStatus });
      showToast('success', `Reservation updated to ${nextStatus}`);
      fetchBookings();
      fetchDropdownData();
    } catch (err) {
      showToast('error', err.message);
    }
  };

  // Open digital ticket pass view
  const handleOpenTicket = (booking) => {
    setSelectedBookingTicket(booking);
    setTicketModalOpen(true);
  };

  // Prompt delete dialog
  const handlePromptDelete = (booking) => {
    setBookingToDelete(booking);
    setDeleteDialogOpen(true);
  };

  // Execute booking deletion with seat restoration
  const handleConfirmDelete = async () => {
    if (!bookingToDelete) return;
    try {
      setDeleteLoading(true);
      const res = await bookingsApi.delete(bookingToDelete._id);
      showToast('success', res.message || 'Reservation cancelled and seats restored');
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
      fetchBookings();
      fetchDropdownData();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Ticket Reservations</h1>
          <p className="text-base text-zinc-600 mt-1">
            Issue tickets, inspect admission passes, and manage seat capacity synchronization
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm transition-colors"
        >
          Issue Ticket
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by reference, attendee, event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 w-full md:w-auto">
          {['All', 'Confirmed', 'Cancelled'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <span className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin"></span>
            Loading reservations...
          </div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-10 text-center">
          <Ticket className="w-8 h-8 text-zinc-400 mx-auto mb-2" strokeWidth={1.5} />
          <h3 className="text-sm font-bold text-zinc-800">No reservations found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            No active reservations match your current query.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-3 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
          >
            Issue New Pass
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50 text-zinc-500 uppercase font-semibold border-b border-zinc-100">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Attendee</th>
                  <th className="px-5 py-3">Event Session</th>
                  <th className="px-5 py-3">Seats</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-zinc-50/50 transition-colors">
                    {/* Booking Reference */}
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs font-semibold text-zinc-900">
                        {b.bookingReference}
                      </span>
                    </td>

                    {/* Attendee Details */}
                    <td className="px-5 py-3">
                      <div>
                        <span className="font-semibold text-zinc-900 block">{b.customer?.fullName || 'N/A'}</span>
                        <span className="text-zinc-500 text-[11px]">{b.customer?.email}</span>
                      </div>
                    </td>

                    {/* Event Title and Schedule */}
                    <td className="px-5 py-3">
                      <div className="max-w-xs">
                        <span className="font-semibold text-zinc-900 block truncate">{b.event?.title || 'Unknown Event'}</span>
                        <span className="text-zinc-400 text-[11px]">
                          {b.event?.eventDate ? new Date(b.event.eventDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Quantity and Tier */}
                    <td className="px-5 py-3">
                      <span className="font-semibold text-zinc-900">{b.ticketQuantity}x</span>
                      <span className="ml-1 text-[11px] text-zinc-500">({b.ticketType})</span>
                    </td>

                    {/* Total Price */}
                    <td className="px-5 py-3 font-semibold text-zinc-900">Rs. {b.totalAmount}</td>

                    {/* Payment Status Pill */}
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-800">
                        {b.paymentStatus}
                      </span>
                    </td>

                    {/* Booking Status */}
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          b.bookingStatus === 'Confirmed'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200/80'
                            : 'bg-zinc-100 text-zinc-500'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenTicket(b)}
                          className="p-1 text-zinc-400 hover:text-zinc-800 rounded hover:bg-zinc-100"
                          title="View Digital Pass"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(b)}
                          className="p-1 text-zinc-400 hover:text-zinc-800 rounded hover:bg-zinc-100"
                          title="Toggle Status"
                        >
                          {b.bookingStatus === 'Confirmed' ? (
                            <ToggleRight className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <ToggleLeft className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handlePromptDelete(b)}
                          className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-rose-50"
                          title="Cancel Reservation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Reservation Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Issue Ticket Reservation"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Select Event Session *
            </label>
            <select
              value={formData.event}
              onChange={(e) => setFormData({ ...formData, event: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 bg-white ${
                formErrors.event ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-200'
              }`}
            >
              <option value="">-- Select an Event Schedule --</option>
              {eventsList.map((e) => (
                <option key={e._id} value={e._id} disabled={e.availableSeats <= 0}>
                  {e.title} (Rs. {e.ticketPrice}) — {e.availableSeats} of {e.totalCapacity} seats {e.availableSeats <= 0 ? '(Filled)' : ''}
                </option>
              ))}
            </select>
            {formErrors.event && <p className="text-[11px] text-rose-600 mt-1">{formErrors.event}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Select Registered Attendee *
            </label>
            <select
              value={formData.customer}
              onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 bg-white ${
                formErrors.customer ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-200'
              }`}
            >
              <option value="">-- Select Attendee Profile --</option>
              {customersList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.fullName} ({c.email})
                </option>
              ))}
            </select>
            {formErrors.customer && <p className="text-[11px] text-rose-600 mt-1">{formErrors.customer}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Seat Quantity *
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.ticketQuantity}
                onChange={(e) => setFormData({ ...formData, ticketQuantity: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors ${
                  formErrors.ticketQuantity ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-200'
                }`}
              />
              {formErrors.ticketQuantity && (
                <p className="text-[11px] text-rose-600 mt-1">{formErrors.ticketQuantity}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Admission Tier *
              </label>
              <select
                value={formData.ticketType}
                onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 bg-white"
              >
                <option value="Standard">Standard Admission (1.0x)</option>
                <option value="VIP">VIP Admission (1.5x)</option>
                <option value="Student">Student Pass (0.8x)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Payment Status
            </label>
            <select
              value={formData.paymentStatus}
              onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 bg-white"
            >
              <option value="Paid">Paid</option>
              <option value="Pending">Pending Payment</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Special Notes
            </label>
            <input
              type="text"
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
              placeholder="e.g. Accessible seating, special requests"
            />
          </div>

          {/* Pricing calculation summary box */}
          <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200">
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
              <span>Rate: Rs. {currentBasePrice} × {currentMultiplier}</span>
              <span>Remaining: {selectedEventDoc ? selectedEventDoc.availableSeats : 0} seats</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-zinc-200">
              <span className="text-xs font-bold text-zinc-800">Total Calculated:</span>
              <span className="text-base font-bold text-zinc-900">Rs. {calculatedTotal}</span>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              {submitting && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              )}
              Confirm Reservation
            </button>
          </div>
        </form>
      </Modal>

      {/* Digital Boarding Pass Ticket Modal */}
      <Modal
        isOpen={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        title="Admission Ticket Pass"
        maxWidth="max-w-md"
      >
        {selectedBookingTicket && (
          <div className="space-y-4">
            {/* Clean Ticket Container */}
            <div
              id="printable-ticket"
              className="bg-zinc-900 text-zinc-100 rounded-xl p-5 border border-zinc-800 space-y-4"
            >
              <div className="flex items-start justify-between border-b border-zinc-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-500 font-semibold">
                    ADMISSION PASS
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {selectedBookingTicket.event?.title || 'Event'}
                  </h3>
                </div>
                <div className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-amber-500/20">
                  {selectedBookingTicket.bookingReference}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-zinc-400 block">Attendee</span>
                  <span className="font-semibold text-white">
                    {selectedBookingTicket.customer?.fullName || 'Guest'}
                  </span>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    {selectedBookingTicket.customer?.email}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-zinc-400 block">Schedule</span>
                  <span className="font-semibold text-white">
                    {selectedBookingTicket.event?.eventDate
                      ? new Date(selectedBookingTicket.event.eventDate).toLocaleDateString()
                      : 'N/A'}
                  </span>
                  <span className="text-[10px] text-zinc-400 block truncate mt-0.5">
                    {selectedBookingTicket.event?.venue}
                  </span>
                </div>
              </div>

              {/* Ticket Details & QR */}
              <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-zinc-300">
                    {selectedBookingTicket.ticketQuantity}x {selectedBookingTicket.ticketType} Pass
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    Rs. {selectedBookingTicket.totalAmount} ({selectedBookingTicket.paymentStatus})
                  </div>
                </div>

                <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center text-zinc-900">
                  <QrCode className="w-10 h-10" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setTicketModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Pass
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete / Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteDialogOpen}
        title="Cancel Ticket Reservation"
        message={`Are you sure you want to cancel booking '${bookingToDelete?.bookingReference}'? Cancelling will automatically restore the ${bookingToDelete?.ticketQuantity || 1} seat(s) back to the event capacity.`}
        confirmText="Confirm Cancellation"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        isLoading={deleteLoading}
      />
    </div>
  );
}

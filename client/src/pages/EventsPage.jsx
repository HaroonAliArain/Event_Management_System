import React, { useEffect, useState } from 'react';
import { eventsApi } from '../services/api';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import {
  Calendar,
  Search,
  Edit2,
  Trash2,
  MapPin,
  Clock,
  Ticket,
  Grid,
  List,
} from 'lucide-react';

// Pre-defined event categories
const CATEGORIES = [
  'All',
  'Technology',
  'Business',
  'Music & Arts',
  'Workshop',
  'Conference',
  'Sports',
  'Other',
];

// Initial form state
const initialFormState = {
  title: '',
  description: '',
  category: 'Technology',
  venue: '',
  eventDate: '',
  ticketPrice: 0,
  totalCapacity: 50,
  bannerUrl: '',
  status: 'Upcoming',
};

// Event management page with complete CRUD operations
export default function EventsPage({ onBookEvent, showToast }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal and dialog states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch events from backend API
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await eventsApi.getAll({
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
        search: search.trim() !== '' ? search.trim() : undefined,
      });
      setEvents(res.data || []);
    } catch (err) {
      showToast('error', `Failed to load events: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, search]);

  // Handle opening create modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentEventId(null);
    setFormData(initialFormState);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle opening edit modal
  const handleOpenEdit = (evt) => {
    setIsEditing(true);
    setCurrentEventId(evt._id);
    setFormData({
      title: evt.title || '',
      description: evt.description || '',
      category: evt.category || 'Technology',
      venue: evt.venue || '',
      eventDate: evt.eventDate ? new Date(evt.eventDate).toISOString().slice(0, 16) : '',
      ticketPrice: evt.ticketPrice ?? 0,
      totalCapacity: evt.totalCapacity ?? 50,
      bannerUrl: evt.bannerUrl || '',
      status: evt.status || 'Upcoming',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate form fields on submit
  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim() || formData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters.';
    }
    if (!formData.description.trim() || formData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters.';
    }
    if (!formData.venue.trim()) {
      errors.venue = 'Venue location is required.';
    }
    if (!formData.eventDate) {
      errors.eventDate = 'Event date and time is required.';
    }
    if (formData.ticketPrice < 0) {
      errors.ticketPrice = 'Price cannot be negative.';
    }
    if (!formData.totalCapacity || parseInt(formData.totalCapacity, 10) < 1) {
      errors.totalCapacity = 'Capacity must be at least 1.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission for Create or Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setFormSubmitting(true);
      const payload = {
        ...formData,
        ticketPrice: Number(formData.ticketPrice),
        totalCapacity: Number(formData.totalCapacity),
      };

      if (isEditing) {
        await eventsApi.update(currentEventId, payload);
        showToast('success', 'Event schedule updated successfully');
      } else {
        await eventsApi.create(payload);
        showToast('success', 'Event schedule published successfully');
      }

      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle prompt for delete confirmation
  const handlePromptDelete = (evt) => {
    setEventToDelete(evt);
    setDeleteDialogOpen(true);
  };

  // Confirm and execute event deletion
  const handleConfirmDelete = async () => {
    if (!eventToDelete) return;
    try {
      setDeleteLoading(true);
      await eventsApi.delete(eventToDelete._id);
      showToast('success', `Event '${eventToDelete.title}' removed successfully`);
      setDeleteDialogOpen(false);
      setEventToDelete(null);
      fetchEvents();
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Event Management</h1>
          <p className="text-base text-zinc-600 mt-1">
            Configure event dates, venue capacity limits, and ticket availability
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm transition-colors"
        >
          Add Event
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search events, venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-colors"
          />
        </div>

        {/* Category Pills & View Switcher */}
        <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1 flex-nowrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center border border-zinc-200 rounded-lg p-0.5 bg-zinc-50 flex-shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
              }`}
              aria-label="Grid view"
            >
              <Grid className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white shadow-xs text-zinc-900' : 'text-zinc-400 hover:text-zinc-700'
              }`}
              aria-label="Table view"
            >
              <List className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </div>

      {/* Events Content Area */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <span className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin"></span>
            Loading events...
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-10 text-center">
          <Calendar className="w-8 h-8 text-zinc-400 mx-auto mb-2" strokeWidth={1.5} />
          <h3 className="text-sm font-bold text-zinc-800">No events found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            No events match your current search or category filter.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-3 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
          >
            Create Event
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((evt) => {
            const booked = evt.bookedSeats || 0;
            const cap = evt.totalCapacity || 1;
            const pct = Math.round((booked / cap) * 100);
            const isSoldOut = evt.availableSeats <= 0;

            return (
              <div
                key={evt._id}
                className="bg-white rounded-xl border border-zinc-200/80 shadow-xs flex flex-col overflow-hidden"
              >
                {/* Banner Thumbnail */}
                <div className="relative h-40 w-full bg-zinc-100 overflow-hidden border-b border-zinc-200">
                  <img
                    src={evt.bannerUrl}
                    alt={evt.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-zinc-900 text-white">
                      {evt.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-white text-zinc-800 border border-zinc-200">
                      {evt.status}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 right-2.5 px-2.5 py-0.5 rounded bg-white text-zinc-900 font-bold text-xs border border-zinc-200">
                    Rs. {evt.ticketPrice}
                  </div>
                </div>

                {/* Event Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-zinc-900 text-base line-clamp-1">{evt.title}</h3>
                    <p className="text-sm text-zinc-600 line-clamp-2 mt-1.5 leading-relaxed">
                      {evt.description}
                    </p>

                    <div className="mt-3.5 space-y-1.5 text-xs text-zinc-600">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{new Date(evt.eventDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="truncate">{evt.venue}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seat Progress Bar */}
                  <div className="mt-4 pt-3 border-t border-zinc-100">
                    <div className="flex items-center justify-between text-xs mb-1 text-zinc-500">
                      <span>{isSoldOut ? 'Capacity Reached' : `${evt.availableSeats} of ${evt.totalCapacity} seats`}</span>
                      <span>{pct}% filled</span>
                    </div>
                    <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-600 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-3.5 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onBookEvent(evt)}
                        disabled={isSoldOut}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                          isSoldOut
                            ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                            : 'bg-zinc-900 text-white hover:bg-zinc-800'
                        }`}
                      >
                        <Ticket className="w-3 h-3" />
                        Issue Pass
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(evt)}
                          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                          title="Edit Event"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePromptDelete(evt)}
                          className="p-1.5 rounded-md text-zinc-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Tabular View */
        <div className="bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50 text-zinc-500 uppercase font-semibold border-b border-zinc-100">
                <tr>
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Venue</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Capacity</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {events.map((evt) => (
                  <tr key={evt._id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-zinc-900">{evt.title}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700">
                        {evt.category}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-500">{new Date(evt.eventDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-zinc-500">{evt.venue}</td>
                    <td className="px-5 py-3 font-semibold text-zinc-900">Rs. {evt.ticketPrice}</td>
                    <td className="px-5 py-3 text-zinc-600">
                      {evt.availableSeats} / {evt.totalCapacity}
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-800">
                        {evt.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(evt)}
                          className="p-1 text-zinc-400 hover:text-zinc-800 rounded hover:bg-zinc-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handlePromptDelete(evt)}
                          className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-rose-50"
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

      {/* Create / Edit Event Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Event Schedule' : 'Schedule New Event'}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors ${
                formErrors.title ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-200'
              }`}
              placeholder="e.g. Annual Software Engineering Symposium"
            />
            {formErrors.title && <p className="text-[11px] text-rose-600 mt-1">{formErrors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 bg-white"
              >
                {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 bg-white"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Venue Location *
            </label>
            <input
              type="text"
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors ${
                formErrors.venue ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-200'
              }`}
              placeholder="e.g. Auditorium A, MUET SZAB Campus"
            />
            {formErrors.venue && <p className="text-[11px] text-rose-600 mt-1">{formErrors.venue}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors ${
                  formErrors.eventDate ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-200'
                }`}
              />
              {formErrors.eventDate && <p className="text-[11px] text-rose-600 mt-1">{formErrors.eventDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Ticket Price (PKR) *
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.ticketPrice}
                onChange={(e) => setFormData({ ...formData, ticketPrice: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors ${
                  formErrors.ticketPrice ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-200'
                }`}
              />
              {formErrors.ticketPrice && <p className="text-[11px] text-rose-600 mt-1">{formErrors.ticketPrice}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Total Capacity *
              </label>
              <input
                type="number"
                min="1"
                value={formData.totalCapacity}
                onChange={(e) => setFormData({ ...formData, totalCapacity: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors ${
                  formErrors.totalCapacity ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-200'
                }`}
              />
              {formErrors.totalCapacity && <p className="text-[11px] text-rose-600 mt-1">{formErrors.totalCapacity}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Banner Image URL
            </label>
            <input
              type="url"
              value={formData.bannerUrl}
              onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Description *
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors ${
                formErrors.description ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-200'
              }`}
              placeholder="Detailed description of topics, speaker lineup, or schedule..."
            ></textarea>
            {formErrors.description && <p className="text-[11px] text-rose-600 mt-1">{formErrors.description}</p>}
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
              disabled={formSubmitting}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              {formSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              )}
              {isEditing ? 'Save Changes' : 'Publish Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteDialogOpen}
        title="Remove Event Schedule"
        message={`Are you sure you want to delete '${eventToDelete?.title}'? If there are active reservations on file, the system will prevent removal.`}
        confirmText="Confirm Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        isLoading={deleteLoading}
      />
    </div>
  );
}

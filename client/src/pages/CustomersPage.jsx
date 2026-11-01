import React, { useEffect, useState } from 'react';
import { customersApi } from '../services/api';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import { Users, Search, Edit2, Trash2, Mail, Phone, MapPin, Building, Eye, Ticket } from 'lucide-react';

// Initial customer registration form state
const initialCustomerForm = {
  fullName: '',
  email: '',
  phone: '',
  city: '',
  organization: '',
};

// Customer management page with full CRUD and booking history inspection
export default function CustomersPage({ showToast }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal and editing states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState(null);
  const [formData, setFormData] = useState(initialCustomerForm);
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Profile details modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch all customers from API
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await customersApi.getAll({ search: search.trim() !== '' ? search.trim() : undefined });
      setCustomers(res.data || []);
    } catch (err) {
      showToast('error', `Failed to load attendee records: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  // Handle open create modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setCurrentCustomerId(null);
    setFormData(initialCustomerForm);
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (customer) => {
    setIsEditing(true);
    setCurrentCustomerId(customer._id);
    setFormData({
      fullName: customer.fullName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      city: customer.city || '',
      organization: customer.organization || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Inspect customer profile and reservation history
  const handleViewProfile = async (customer) => {
    try {
      setProfileLoading(true);
      setProfileModalOpen(true);
      const res = await customersApi.getById(customer._id);
      setSelectedProfile(res.data);
    } catch (err) {
      showToast('error', `Failed to load attendee details: ${err.message}`);
      setProfileModalOpen(false);
    } finally {
      setProfileLoading(false);
    }
  };

  // Validate registration form inputs
  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim() || formData.fullName.trim().length < 3) {
      errors.fullName = 'Full name must be at least 3 characters.';
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 7) {
      errors.phone = 'Phone number is required (min 7 digits).';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit customer form for create or update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setFormSubmitting(true);
      if (isEditing) {
        await customersApi.update(currentCustomerId, formData);
        showToast('success', 'Attendee profile updated successfully');
      } else {
        await customersApi.create(formData);
        showToast('success', 'Attendee registered successfully');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Prompt delete dialog
  const handlePromptDelete = (customer) => {
    setCustomerToDelete(customer);
    setDeleteDialogOpen(true);
  };

  // Execute customer deletion
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    try {
      setDeleteLoading(true);
      await customersApi.delete(customerToDelete._id);
      showToast('success', `Attendee '${customerToDelete.fullName}' removed`);
      setDeleteDialogOpen(false);
      setCustomerToDelete(null);
      fetchCustomers();
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Attendee Directory</h1>
          <p className="text-base text-zinc-600 mt-1">
            Registered attendee records, contact information, and event reservation history
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm transition-colors"
        >
          Register Attendee
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-zinc-200/80 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, email, organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white transition-colors"
          />
        </div>
        <div className="text-xs font-medium text-zinc-500 hidden sm:block">
          Total Attendees: <span className="font-bold text-zinc-900">{customers.length}</span>
        </div>
      </div>

      {/* Customers Data Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-2 text-zinc-500 text-xs">
            <span className="w-3.5 h-3.5 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin"></span>
            Loading directory...
          </div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-10 text-center">
          <Users className="w-8 h-8 text-zinc-400 mx-auto mb-2" strokeWidth={1.5} />
          <h3 className="text-sm font-bold text-zinc-800">No attendees found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            No attendee matches your query. Add a new attendee to start reservations.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-3 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
          >
            Add Attendee
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-zinc-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-600">
              <thead className="bg-zinc-50 text-zinc-500 uppercase font-semibold border-b border-zinc-100">
                <tr>
                  <th className="px-5 py-3">Attendee</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">Affiliation & City</th>
                  <th className="px-5 py-3">Bookings</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {customers.map((c) => {
                  const initials = c.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <tr key={c._id} className="hover:bg-zinc-50/50 transition-colors">
                      {/* Name and avatar initials */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-900 border border-amber-200/80 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-semibold text-zinc-900 block">{c.fullName}</span>
                          </div>
                        </div>
                      </td>

                      {/* Contact details */}
                      <td className="px-5 py-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="flex items-center gap-1.5 text-zinc-700">
                            <Mail className="w-3 h-3 text-zinc-400" />
                            {c.email}
                          </span>
                          <span className="flex items-center gap-1.5 text-zinc-500 text-[11px]">
                            <Phone className="w-3 h-3 text-zinc-400" />
                            {c.phone}
                          </span>
                        </div>
                      </td>

                      {/* City and Organization */}
                      <td className="px-5 py-3 text-xs">
                        <div className="space-y-0.5">
                          {c.organization && (
                            <span className="flex items-center gap-1 text-zinc-800 font-medium">
                              <Building className="w-3 h-3 text-zinc-400" />
                              {c.organization}
                            </span>
                          )}
                          {c.city && (
                            <span className="flex items-center gap-1 text-zinc-500 text-[11px]">
                              <MapPin className="w-3 h-3 text-zinc-400" />
                              {c.city}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Bookings count badge */}
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50/70 text-amber-900 border border-amber-200/60">
                          {c.totalBookings || 0} Bookings
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewProfile(c)}
                            className="p-1 text-zinc-400 hover:text-zinc-800 rounded hover:bg-zinc-100"
                            title="View Attendee Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1 text-zinc-400 hover:text-zinc-800 rounded hover:bg-zinc-100"
                            title="Edit Attendee"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePromptDelete(c)}
                            className="p-1 text-zinc-400 hover:text-rose-600 rounded hover:bg-rose-50"
                            title="Delete Attendee"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customer Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Attendee Information' : 'Register New Attendee'}
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors ${
                formErrors.fullName ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-200'
              }`}
              placeholder="e.g. Ali Raza Solangi"
            />
            {formErrors.fullName && <p className="text-[11px] text-rose-600 mt-1">{formErrors.fullName}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors ${
                  formErrors.email ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-200'
                }`}
                placeholder="name@domain.com"
              />
              {formErrors.email && <p className="text-[11px] text-rose-600 mt-1">{formErrors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors ${
                  formErrors.phone ? 'border-rose-400 bg-rose-50/20' : 'border-zinc-200'
                }`}
                placeholder="+92 300 1234567"
              />
              {formErrors.phone && <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                City / Region
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                placeholder="Khairpur Mir's"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Organization / Affiliation
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-xs focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                placeholder="MUET SZAB"
              />
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
              disabled={formSubmitting}
              className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              {formSubmitting && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              )}
              {isEditing ? 'Save Changes' : 'Register Attendee'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Profile & Reservation History Modal */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Attendee Record & History"
        maxWidth="max-w-2xl"
      >
        {profileLoading ? (
          <div className="py-10 flex justify-center text-xs text-zinc-500">
            Loading profile...
          </div>
        ) : selectedProfile ? (
          <div className="space-y-5">
            {/* Customer Details Card */}
            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">{selectedProfile.fullName}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{selectedProfile.email} | {selectedProfile.phone}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{selectedProfile.organization || 'Independent'} | {selectedProfile.city || 'No Location'}</p>
              </div>
              <div className="px-2.5 py-1 rounded-md bg-white border border-zinc-200 text-xs font-semibold text-zinc-700">
                {selectedProfile.totalBookingsCount || 0} Total Orders
              </div>
            </div>

            {/* Bookings History List */}
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2.5">
                Ticket Reservation Records
              </h4>

              {!selectedProfile.bookings || selectedProfile.bookings.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500 bg-zinc-50 rounded-lg">
                  No reservations registered under this profile yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProfile.bookings.map((b) => (
                    <div
                      key={b._id}
                      className="p-3 rounded-lg border border-zinc-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 hover:bg-zinc-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-md bg-zinc-100 text-zinc-700 flex items-center justify-center flex-shrink-0">
                          <Ticket className="w-4 h-4" />
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-zinc-900">{b.event?.title || 'Event'}</h5>
                          <span className="text-[11px] text-zinc-500">
                            {b.ticketQuantity}x {b.ticketType} — Rs. {b.totalAmount}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            b.bookingStatus === 'Confirmed'
                              ? 'bg-zinc-100 text-zinc-800'
                              : 'bg-zinc-50 text-zinc-500'
                          }`}
                        >
                          {b.bookingStatus}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-400">{b.bookingReference}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteDialogOpen}
        title="Remove Attendee Record"
        message={`Are you sure you want to delete '${customerToDelete?.fullName}'? If active event bookings are linked, the system will prevent removal.`}
        confirmText="Confirm Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        isLoading={deleteLoading}
      />
    </div>
  );
}

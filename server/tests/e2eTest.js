// Automated End-to-End integration test suite for SW417 Web Engineering PBL
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001/api';

// Simple assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

// HTTP request helper wrapping fetch
async function api(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

// Main test execution runner
async function runTests() {
  console.log('Starting Eventify End-to-End Verification Test Suite');
  console.log(`Target API: ${BASE_URL}\n`);

  let passed = 0;
  let failed = 0;

  // Execute test case wrapper
  async function test(name, fn) {
    try {
      await fn();
      console.log(`  PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  FAIL: ${name}`);
      console.error(`        Error: ${err.message}`);
      failed++;
    }
  }

  let createdEventId = null;
  let createdCustomerId = null;
  let createdBookingId = null;

  // 1. System Health Check
  await test('1. Health Check endpoint returns operational status (GET /api/health)', async () => {
    const res = await api('/health');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.success === true, 'Response success must be true');
  });

  // 2. Events Module: Create (POST /api/events)
  await test('2. Event CRUD - Create Event with seat capacity (POST /api/events)', async () => {
    const payload = {
      title: 'Automated E2E Test Conference 2026',
      description: 'Temporary event for end-to-end integration and capacity verification.',
      category: 'Technology',
      venue: 'Main Lab 1, Mehran UET SZAB Campus',
      eventDate: new Date(Date.now() + 86400000 * 10).toISOString(),
      ticketPrice: 1500,
      totalCapacity: 30,
      bannerUrl: '/events/software-summit.jpg',
      status: 'Upcoming',
    };
    const res = await api('/events', 'POST', payload);
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.data.data.title === payload.title, 'Title must match payload');
    assert(res.data.data.availableSeats === 30, 'Initial available seats must equal total capacity');
    createdEventId = res.data.data._id;
  });

  // 3. Events Module: Read All (GET /api/events)
  await test('3. Event CRUD - Read All Events (GET /api/events)', async () => {
    const res = await api('/events');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data), 'Data must be an array');
    const found = res.data.data.some((e) => e._id === createdEventId);
    assert(found, 'Created event must be present in events listing');
  });

  // 4. Events Module: Read Single (GET /api/events/:id)
  await test('4. Event CRUD - Read Single Event by ID (GET /api/events/:id)', async () => {
    const res = await api(`/events/${createdEventId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data._id === createdEventId, 'Returned event ID must match');
  });

  // 5. Events Module: Update (PUT /api/events/:id)
  await test('5. Event CRUD - Update Event Details (PUT /api/events/:id)', async () => {
    const payload = {
      title: 'Automated E2E Test Conference 2026 (Updated)',
      venue: 'Executive Auditorium, MUET Khairpur',
    };
    const res = await api(`/events/${createdEventId}`, 'PUT', payload);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.title === payload.title, 'Updated title must match');
  });

  // 6. Customers Module: Create (POST /api/customers)
  await test('6. Customer CRUD - Register New Attendee (POST /api/customers)', async () => {
    const uniqueEmail = `qa.student.${Date.now()}@muetkhp.edu.pk`;
    const payload = {
      fullName: 'Tariq Hussain Shaikh',
      email: uniqueEmail,
      phone: '+92 300 1234567',
      city: "Khairpur Mir's",
      organization: 'Software Engineering Department',
    };
    const res = await api('/customers', 'POST', payload);
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.data.data.fullName === payload.fullName, 'Full name must match');
    createdCustomerId = res.data.data._id;
  });

  // 7. Customers Module: Prevent Duplicate Email
  await test('7. Business Logic - Prevent Duplicate Customer Email (POST /api/customers -> 409)', async () => {
    const custRes = await api(`/customers/${createdCustomerId}`);
    const existingEmail = custRes.data.data.email;
    const res = await api('/customers', 'POST', {
      fullName: 'Duplicate User Test',
      email: existingEmail,
      phone: '+92 300 9999999',
    });
    assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
  });

  // 8. Customers Module: Read All (GET /api/customers)
  await test('8. Customer CRUD - Read All Customers (GET /api/customers)', async () => {
    const res = await api('/customers');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data), 'Data must be an array');
  });

  // 9. Customers Module: Update (PUT /api/customers/:id)
  await test('9. Customer CRUD - Update Customer Profile (PUT /api/customers/:id)', async () => {
    const payload = { phone: '+92 300 7654321', city: 'Sukkur' };
    const res = await api(`/customers/${createdCustomerId}`, 'PUT', payload);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.phone === payload.phone, 'Phone must be updated');
  });

  // 10. Bookings Module: Create with Seat Decrement (POST /api/bookings)
  await test('10. Booking CRUD - Issue Reservation & Decrement Available Seats', async () => {
    const initialEventRes = await api(`/events/${createdEventId}`);
    const seatsBefore = initialEventRes.data.data.availableSeats;

    const payload = {
      customer: createdCustomerId,
      event: createdEventId,
      ticketQuantity: 3,
      ticketType: 'Standard',
      paymentStatus: 'Paid',
      specialRequests: 'Automated test reservation',
    };
    const res = await api('/bookings', 'POST', payload);
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.data.data.ticketQuantity === 3, 'Quantity must be 3');
    createdBookingId = res.data.data._id;

    // Verify seat capacity decremented by 3
    const updatedEventRes = await api(`/events/${createdEventId}`);
    const seatsAfter = updatedEventRes.data.data.availableSeats;
    assert(seatsAfter === seatsBefore - 3, `Seats must decrease by 3. Before: ${seatsBefore}, After: ${seatsAfter}`);
  });

  // 11. Bookings Module: Overbooking Prevention
  await test('11. Business Logic - Prevent Overbooking Beyond Available Seats (POST /api/bookings -> 400)', async () => {
    const payload = {
      customer: createdCustomerId,
      event: createdEventId,
      ticketQuantity: 999,
      ticketType: 'Standard',
    };
    const res = await api('/bookings', 'POST', payload);
    assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
  });

  // 12. Bookings Module: Read All (GET /api/bookings)
  await test('12. Booking CRUD - Read All Bookings (GET /api/bookings)', async () => {
    const res = await api('/bookings');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(Array.isArray(res.data.data), 'Bookings list must be an array');
  });

  // 13. Bookings Module: Read Single (GET /api/bookings/:id)
  await test('13. Booking CRUD - Read Single Booking with Populated Refs (GET /api/bookings/:id)', async () => {
    const res = await api(`/bookings/${createdBookingId}`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.customer != null, 'Customer reference must be populated');
    assert(res.data.data.event != null, 'Event reference must be populated');
  });

  // 14. Bookings Module: Cancel Status & Seat Restoration
  await test('14. Business Logic - Booking Cancellation Restores Available Seats', async () => {
    const eventBeforeRes = await api(`/events/${createdEventId}`);
    const seatsBefore = eventBeforeRes.data.data.availableSeats;

    // Update status to Cancelled
    const updateRes = await api(`/bookings/${createdBookingId}`, 'PUT', { bookingStatus: 'Cancelled' });
    assert(updateRes.status === 200, `Expected 200, got ${updateRes.status}`);
    assert(updateRes.data.data.bookingStatus === 'Cancelled', 'Status must be Cancelled');

    // Verify seats restored (+3)
    const eventAfterRes = await api(`/events/${createdEventId}`);
    const seatsAfter = eventAfterRes.data.data.availableSeats;
    assert(seatsAfter === seatsBefore + 3, `Available seats must be restored. Before: ${seatsBefore}, After: ${seatsAfter}`);
  });

  // 15. Safeguard: Prevent Deleting Event with Active Confirmed Bookings
  await test('15. Business Logic - Protect Event Deletion when Active Bookings Exist', async () => {
    // Re-confirm booking
    await api(`/bookings/${createdBookingId}`, 'PUT', { bookingStatus: 'Confirmed' });

    // Attempt deleting event should fail with 400
    const deleteRes = await api(`/events/${createdEventId}`, 'DELETE');
    assert(deleteRes.status === 400, `Expected 400 Bad Request, got ${deleteRes.status}`);
  });

  // 16. Bookings Module: Delete (DELETE /api/bookings/:id)
  await test('16. Booking CRUD - Delete Booking and Restore Inventory (DELETE /api/bookings/:id)', async () => {
    const deleteRes = await api(`/bookings/${createdBookingId}`, 'DELETE');
    assert(deleteRes.status === 200, `Expected 200, got ${deleteRes.status}`);

    // Verify booking is gone
    const verifyRes = await api(`/bookings/${createdBookingId}`);
    assert(verifyRes.status === 404, `Expected 404, got ${verifyRes.status}`);
  });

  // 17. Events Module: Delete (DELETE /api/events/:id)
  await test('17. Event CRUD - Delete Event after Bookings Cleared (DELETE /api/events/:id)', async () => {
    const res = await api(`/events/${createdEventId}`, 'DELETE');
    assert(res.status === 200, `Expected 200, got ${res.status}`);

    const verifyRes = await api(`/events/${createdEventId}`);
    assert(verifyRes.status === 404, `Expected 404, got ${verifyRes.status}`);
  });

  // 18. Customers Module: Delete (DELETE /api/customers/:id)
  await test('18. Customer CRUD - Delete Customer (DELETE /api/customers/:id)', async () => {
    const res = await api(`/customers/${createdCustomerId}`, 'DELETE');
    assert(res.status === 200, `Expected 200, got ${res.status}`);

    const verifyRes = await api(`/customers/${createdCustomerId}`);
    assert(verifyRes.status === 404, `Expected 404, got ${verifyRes.status}`);
  });

  // 19. Dashboard Summary Metrics
  await test('19. Dashboard Analytics - Retrieve Real-time Financial & Operational Metrics (GET /api/stats)', async () => {
    const res = await api('/stats');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.data.data.overview != null, 'Overview KPIs must be returned');
    assert(typeof res.data.data.overview.totalRevenue === 'number', 'Revenue must be a number');
  });

  // Summary Report
  console.log('\n------------------------------------------------------------');
  console.log(`End-to-End Test Suite Complete: ${passed} Passed, ${failed} Failed`);
  console.log('------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Execute test suite
runTests().catch((err) => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});

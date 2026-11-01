const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const Customer = require('./models/Customer');
const Booking = require('./models/Booking');

dotenv.config();

const sampleEvents = [
  {
    title: 'National Software Engineering Summit 2026',
    description: 'An industry-leading conference bringing together top software engineers, AI researchers, and students to discuss modern cloud, microservices, and agentic workflows.',
    category: 'Technology',
    venue: 'Main Auditorium, MUET SZAB Campus, Khairpur Mir\'s',
    eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    ticketPrice: 2500,
    totalCapacity: 120,
    bannerUrl: '/events/software-summit.jpg',
    status: 'Upcoming',
  },
  {
    title: 'Full-Stack JavaScript & React Intensive Bootcamp',
    description: 'Hands-on practical workshop covering modern React hooks, Tailwind CSS layout techniques, and high-performance Node.js APIs.',
    category: 'Workshop',
    venue: 'Lab 3, IT Center, Khairpur',
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    ticketPrice: 1500,
    totalCapacity: 45,
    bannerUrl: '/events/react-bootcamp.jpg',
    status: 'Upcoming',
  },
  {
    title: 'Sufi & Classical Music Night 2026',
    description: 'An enchanting cultural evening celebrating traditional heritage, live qawwali, and acoustic performances in the historic city of Khairpur.',
    category: 'Music & Arts',
    venue: 'Faiz Mahal Open Grounds, Khairpur',
    eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    ticketPrice: 1200,
    totalCapacity: 250,
    bannerUrl: '/events/sufi-music.jpg',
    status: 'Upcoming',
  },
  {
    title: 'Youth Startup Pitch & Entrepreneurship Forum',
    description: 'Connect with venture capitalists, startup mentors, and successful tech founders. Watch 10 shortlisted student teams pitch their MVP products.',
    category: 'Business',
    venue: 'Executive Seminar Hall, Sukkur IBA',
    eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    ticketPrice: 2000,
    totalCapacity: 80,
    bannerUrl: '/events/startup-pitch.jpg',
    status: 'Upcoming',
  },
  {
    title: 'Inter-University Cyber Security & Ethical Hacking CTF',
    description: 'Compete in a 24-hour Capture The Flag tournament focusing on web penetration testing, network forensics, and cryptography.',
    category: 'Technology',
    venue: 'Cyber Security Lab, Mehran UET',
    eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    ticketPrice: 1000,
    totalCapacity: 60,
    bannerUrl: '/events/cyber-security.jpg',
    status: 'Upcoming',
  },
  {
    title: 'Green Tech & Sustainable Engineering Symposium',
    description: 'Exploration of renewable solar energy solutions, waste reduction technologies, and sustainable urban engineering.',
    category: 'Conference',
    venue: 'Conference Hall B, MUET SZAB',
    eventDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    ticketPrice: 1200,
    totalCapacity: 100,
    bannerUrl: '/events/green-tech.jpg',
    status: 'Upcoming',
  },
];

const sampleCustomers = [
  {
    fullName: 'Ali Raza Solangi',
    email: 'ali.raza@muetkhp.edu.pk',
    phone: '+92 301 2345678',
    city: 'Khairpur Mir\'s',
    organization: 'MUET SZAB Campus',
  },
  {
    fullName: 'Zainab Fatima',
    email: 'zainab.fatima@techvalley.pk',
    phone: '+92 333 9876543',
    city: 'Sukkur',
    organization: 'Tech Valley Hub',
  },
  {
    fullName: 'Bilal Ahmed Memon',
    email: 'bilal.memon@coderz.io',
    phone: '+92 312 4567890',
    city: 'Hyderabad',
    organization: 'Freelance Community',
  },
  {
    fullName: 'Ayesha Siddiqua',
    email: 'ayesha.s@innovate.org',
    phone: '+92 345 6789012',
    city: 'Karachi',
    organization: 'Women in Tech Pakistan',
  },
  {
    fullName: 'Hamza Khan Burdi',
    email: 'hamza.burdi@devs.net',
    phone: '+92 300 8765432',
    city: 'Khairpur',
    organization: 'MUET Computer Society',
  },
  {
    fullName: 'Sanaullah Shaikh',
    email: 'sana.shaikh@cloudsol.com',
    phone: '+92 315 1122334',
    city: 'Larkana',
    organization: 'CloudSol Systems',
  },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seeder] Connected to MongoDB for seeding...');

    // Clear existing records
    await Booking.deleteMany();
    await Customer.deleteMany();
    await Event.deleteMany();
    console.log('[Seeder] Cleared previous database records.');

    // Seed Events
    const createdEvents = await Event.create(sampleEvents);
    console.log(`[Seeder] Seeded ${createdEvents.length} events.`);

    // Seed Customers
    const createdCustomers = await Customer.create(sampleCustomers);
    console.log(`[Seeder] Seeded ${createdCustomers.length} customers.`);

    // Seed Sample Bookings and sync availableSeats
    const bookingsToCreate = [
      {
        customer: createdCustomers[0]._id,
        event: createdEvents[0]._id, // Summit
        ticketQuantity: 2,
        ticketType: 'VIP',
        unitPrice: createdEvents[0].ticketPrice * 1.5,
        tierMultiplier: 1.5,
        totalAmount: 2 * (createdEvents[0].ticketPrice * 1.5),
        paymentStatus: 'Paid',
        bookingStatus: 'Confirmed',
        specialRequests: 'Front-row VIP seat reservation requested',
      },
      {
        customer: createdCustomers[1]._id,
        event: createdEvents[1]._id, // Workshop
        ticketQuantity: 1,
        ticketType: 'Standard',
        unitPrice: createdEvents[1].ticketPrice,
        tierMultiplier: 1.0,
        totalAmount: createdEvents[1].ticketPrice,
        paymentStatus: 'Paid',
        bookingStatus: 'Confirmed',
        specialRequests: 'Needs workshop power outlet',
      },
      {
        customer: createdCustomers[2]._id,
        event: createdEvents[2]._id, // Music Night
        ticketQuantity: 4,
        ticketType: 'Standard',
        unitPrice: createdEvents[2].ticketPrice,
        tierMultiplier: 1.0,
        totalAmount: 4 * createdEvents[2].ticketPrice,
        paymentStatus: 'Paid',
        bookingStatus: 'Confirmed',
        specialRequests: 'Family seating group',
      },
      {
        customer: createdCustomers[3]._id,
        event: createdEvents[0]._id, // Summit
        ticketQuantity: 3,
        ticketType: 'Student',
        unitPrice: createdEvents[0].ticketPrice * 0.8,
        tierMultiplier: 0.8,
        totalAmount: 3 * (createdEvents[0].ticketPrice * 0.8),
        paymentStatus: 'Pending',
        bookingStatus: 'Confirmed',
        specialRequests: 'Student ID cards will be verified on-site',
      },
      {
        customer: createdCustomers[4]._id,
        event: createdEvents[4]._id, // CTF
        ticketQuantity: 2,
        ticketType: 'Standard',
        unitPrice: createdEvents[4].ticketPrice,
        tierMultiplier: 1.0,
        totalAmount: 2 * createdEvents[4].ticketPrice,
        paymentStatus: 'Paid',
        bookingStatus: 'Confirmed',
        specialRequests: 'Team name: RedSec',
      },
    ];

    const createdBookings = await Booking.create(bookingsToCreate);
    console.log(`[Seeder] Seeded ${createdBookings.length} bookings.`);

    // Synchronize availableSeats on events for confirmed bookings
    for (const booking of createdBookings) {
      if (booking.bookingStatus === 'Confirmed') {
        await Event.findByIdAndUpdate(booking.event, {
          $inc: { availableSeats: -booking.ticketQuantity },
        });
      }
    }
    console.log('[Seeder] Synchronized seat capacities on all events.');

    console.log('\n==========================================');
    console.log(' DATABASE SEEDING COMPLETED SUCCESSFULLY! ');
    console.log('==========================================\n');

    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error]: ${error.message}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await Booking.deleteMany();
    await Customer.deleteMany();
    await Event.deleteMany();
    console.log('[Seeder] All database records deleted.');
    process.exit(0);
  } catch (error) {
    console.error(`[Seeder Error]: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d' || process.argv[2] === '--destroy') {
  destroyData();
} else {
  seedData();
}

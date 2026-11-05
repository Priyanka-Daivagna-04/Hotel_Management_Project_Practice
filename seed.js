const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const connectDB = require('./config/database');
const User = require('./models/User');
const RoomCategory = require('./models/RoomCategory');
const Room = require('./models/Room');
const Guest = require('./models/Guest');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');
const Staff = require('./models/Staff');
const Housekeeping = require('./models/Housekeeping');
const ActivityLog = require('./models/ActivityLog');

const seedData = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database. Clearing existing collections...');

    // Clear existing data
    await User.deleteMany({});
    await RoomCategory.deleteMany({});
    await Room.deleteMany({});
    await Guest.deleteMany({});
    await Booking.deleteMany({});
    await Payment.deleteMany({});
    await Staff.deleteMany({});
    await Housekeeping.deleteMany({});
    await ActivityLog.deleteMany({});

    console.log('[Seed] Database cleared. Seeding initial accounts...');

    // 1. Create Default Users
    // Password will be automatically hashed by User pre-save hook
    const adminUser = await User.create({
      name: 'Victoria Stirling',
      email: 'admin@grandroyale.com',
      password: 'AdminPassword123!',
      role: 'Admin',
      phone: '+91 98201 12345',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'
    });

    const receptionistUser = await User.create({
      name: 'Julian Henderson',
      email: 'reception@grandroyale.com',
      password: 'ReceptionPassword123!',
      role: 'Receptionist',
      phone: '+91 98302 23456',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    });

    const housekeepingUser = await User.create({
      name: 'Elena Morales',
      email: 'housekeeping@grandroyale.com',
      password: 'CleanPassword123!',
      role: 'Housekeeping Staff',
      phone: '+91 98403 34567',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150'
    });

    console.log('[Seed] Users created: Admin, Receptionist, Housekeeping Staff.');

    // 2. Create Staff Profiles
    await Staff.create([
      {
        user: adminUser._id,
        employeeId: 'EMP-ADM-001',
        department: 'Management',
        designation: 'General Manager',
        shift: 'General',
        salary: 1200000,
        emergencyContact: { name: 'David Stirling', relation: 'Spouse', phone: '+91 98201 99999' }
      },
      {
        user: receptionistUser._id,
        employeeId: 'EMP-REC-102',
        department: 'Front Desk',
        designation: 'Lead Receptionist',
        shift: 'Morning',
        salary: 450000,
        emergencyContact: { name: 'Sarah Henderson', relation: 'Sister', phone: '+91 98302 88888' }
      },
      {
        user: housekeepingUser._id,
        employeeId: 'EMP-HSK-205',
        department: 'Housekeeping',
        designation: 'Senior Housekeeper',
        shift: 'Morning',
        salary: 320000,
        emergencyContact: { name: 'Marco Morales', relation: 'Brother', phone: '+91 98403 77777' }
      }
    ]);

    // 3. Create Room Categories
    console.log('[Seed] Seeding room categories...');
    const catPresidential = await RoomCategory.create({
      name: 'Presidential Suite',
      code: 'PRS',
      basePrice: 45000,
      maxOccupancy: 4,
      bedType: 'King',
      sizeSqFt: 1200,
      description: 'The pinnacle of luxury. Panoramic skyline views, private jacuzzi, marble bathroom, and dedicated butler service.',
      amenities: ['Panoramic View', 'Private Jacuzzi', 'Butler Service', 'High-speed WiFi', 'Espresso Machine', 'Mini Bar', 'Smart TV']
    });

    const catDeluxeOcean = await RoomCategory.create({
      name: 'Deluxe Ocean View',
      code: 'DLX',
      basePrice: 14500,
      maxOccupancy: 3,
      bedType: 'King',
      sizeSqFt: 550,
      description: 'Elegant suite with sweeping ocean horizon vistas, private sun terrace, and luxurious rain shower.',
      amenities: ['Ocean View', 'Balcony', 'King Bed', 'Rain Shower', 'High-speed WiFi', 'Espresso Machine', 'Smart TV']
    });

    const catExecutiveKing = await RoomCategory.create({
      name: 'Executive King Suite',
      code: 'EXE',
      basePrice: 8500,
      maxOccupancy: 2,
      bedType: 'King',
      sizeSqFt: 420,
      description: 'Spacious retreat tailored for business executives and couples with ergonomic work station and premium plush bedding.',
      amenities: ['Work Desk', 'King Bed', 'Complimentary Breakfast', 'High-speed WiFi', 'Mini Bar', 'Smart TV']
    });

    const catSuperiorDouble = await RoomCategory.create({
      name: 'Superior Double Room',
      code: 'SUP',
      basePrice: 5200,
      maxOccupancy: 4,
      bedType: 'Double',
      sizeSqFt: 380,
      description: 'Versatile, comfortable room featuring two queen-size beds, ideal for families and traveling companions.',
      amenities: ['Two Double Beds', 'City View', 'High-speed WiFi', 'Mini Fridge', 'Smart TV']
    });

    const catStandardSingle = await RoomCategory.create({
      name: 'Standard Single',
      code: 'STD',
      basePrice: 2800,
      maxOccupancy: 1,
      bedType: 'Single',
      sizeSqFt: 250,
      description: 'Cozy and quiet private room crafted for solo travelers seeking effortless comfort and modern amenities.',
      amenities: ['Single Bed', 'Desk', 'High-speed WiFi', 'Air Conditioning']
    });

    // 4. Create Rooms
    console.log('[Seed] Seeding rooms...');
    const rooms = await Room.create([
      {
        roomNumber: '101',
        category: catStandardSingle._id,
        floor: 1,
        capacity: 1,
        pricePerNight: 2800,
        amenities: ['WiFi', 'Air Conditioning', 'Work Desk'],
        description: 'First floor quiet single room near the courtyard garden.',
        images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600'],
        status: 'Available'
      },
      {
        roomNumber: '102',
        category: catSuperiorDouble._id,
        floor: 1,
        capacity: 4,
        pricePerNight: 5200,
        amenities: ['Two Double Beds', 'Garden View', 'WiFi', 'Mini Fridge'],
        description: 'Ground level family room with easy garden access.',
        images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600'],
        status: 'Available'
      },
      {
        roomNumber: '201',
        category: catExecutiveKing._id,
        floor: 2,
        capacity: 2,
        pricePerNight: 8500,
        amenities: ['King Bed', 'Executive Desk', 'WiFi', 'Nespresso'],
        description: 'Second floor corner suite with dual-aspect city skyline views.',
        images: ['https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600'],
        status: 'Occupied'
      },
      {
        roomNumber: '202',
        category: catExecutiveKing._id,
        floor: 2,
        capacity: 2,
        pricePerNight: 8500,
        amenities: ['King Bed', 'Executive Desk', 'WiFi', 'Nespresso'],
        description: 'Second floor executive room with soundproof glass and marble bathroom.',
        images: ['https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600'],
        status: 'Available'
      },
      {
        roomNumber: '301',
        category: catDeluxeOcean._id,
        floor: 3,
        capacity: 3,
        pricePerNight: 14500,
        amenities: ['Ocean View', 'Balcony', 'King Bed', 'Rain Shower'],
        description: 'Third floor oceanfront suite with private glass balcony.',
        images: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600'],
        status: 'Reserved'
      },
      {
        roomNumber: '302',
        category: catDeluxeOcean._id,
        floor: 3,
        capacity: 3,
        pricePerNight: 14500,
        amenities: ['Ocean View', 'Balcony', 'King Bed', 'Rain Shower'],
        description: 'Third floor sunset-facing deluxe ocean suite.',
        images: ['https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600'],
        status: 'Maintenance'
      },
      {
        roomNumber: '401',
        category: catPresidential._id,
        floor: 4,
        capacity: 4,
        pricePerNight: 45000,
        amenities: ['Penthouse Level', 'Panoramic Views', 'Jacuzzi', 'Butler', 'Espresso'],
        description: 'The Royal Penthouse Suite spanning the entire western wing of the 4th floor.',
        images: ['https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600'],
        status: 'Occupied'
      }
    ]);

    // 5. Create Sample Guests
    console.log('[Seed] Seeding guests...');
    const guest1 = await Guest.create({
      firstName: 'Aarav',
      lastName: 'Sharma',
      email: 'aarav.sharma@example.in',
      phone: '+91 98210 54321',
      idType: 'Aadhaar Card',
      idNumber: '4589 1234 5678',
      address: {
        street: '14 Marine Drive, Nariman Point',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        zipCode: '400021'
      },
      nationality: 'Indian',
      specialRequests: 'Prefers high floor and extra goose-feather pillows.'
    });

    const guest2 = await Guest.create({
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya.patel@example.in',
      phone: '+91 98765 43210',
      idType: 'PAN Card',
      idNumber: 'ABCDE1234F',
      address: {
        street: '22 Indiranagar 100ft Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        country: 'India',
        zipCode: '560038'
      },
      nationality: 'Indian',
      specialRequests: 'Late check-in anticipated around 9:00 PM.'
    });

    const guest3 = await Guest.create({
      firstName: 'Rajesh',
      lastName: 'Iyer',
      email: 'rajesh.iyer@example.in',
      phone: '+91 98111 22334',
      idType: 'Passport',
      idNumber: 'Z1234567',
      address: {
        street: '8 Barakhamba Road, Connaught Place',
        city: 'New Delhi',
        state: 'Delhi',
        country: 'India',
        zipCode: '110001'
      },
      nationality: 'Indian',
      specialRequests: 'Quiet room away from elevators.'
    });

    // 6. Create Bookings
    console.log('[Seed] Seeding bookings & payments...');
    const now = new Date();
    const inToday = new Date(now);
    const outIn3Days = new Date(now);
    outIn3Days.setDate(outIn3Days.getDate() + 3);

    const pastCheckIn = new Date(now);
    pastCheckIn.setDate(pastCheckIn.getDate() - 2);

    // Active Checked In Booking (Room 201)
    const booking1 = await Booking.create({
      bookingNumber: 'BK-20261101-1001',
      guest: guest1._id,
      room: rooms[2]._id, // 201
      checkInDate: pastCheckIn,
      checkOutDate: outIn3Days,
      actualCheckIn: pastCheckIn,
      adults: 2,
      children: 0,
      nights: 5,
      pricePerNight: 8500,
      totalPrice: 42500,
      paidAmount: 42500,
      status: 'Checked In',
      paymentStatus: 'Paid',
      specialRequests: 'Welcome bouquet on arrival.',
      bookedBy: receptionistUser._id
    });

    // Payment for booking 1
    await Payment.create({
      invoiceNumber: 'INV-20261101-001',
      booking: booking1._id,
      guest: guest1._id,
      amount: 42500,
      paymentMethod: 'UPI / Google Pay / PhonePe',
      transactionId: 'TXN-UPI-98231048',
      status: 'Paid',
      notes: 'Full payment settled upon check-in via UPI.',
      recordedBy: receptionistUser._id
    });

    // Penthouse Checked In Booking (Room 401)
    const booking2 = await Booking.create({
      bookingNumber: 'BK-20261102-1002',
      guest: guest2._id,
      room: rooms[6]._id, // 401
      checkInDate: inToday,
      checkOutDate: outIn3Days,
      actualCheckIn: inToday,
      adults: 2,
      children: 1,
      nights: 3,
      pricePerNight: 45000,
      totalPrice: 135000,
      paidAmount: 75000,
      status: 'Checked In',
      paymentStatus: 'Partially Paid',
      specialRequests: 'VIP Airport transfer requested.',
      bookedBy: adminUser._id
    });

    await Payment.create({
      invoiceNumber: 'INV-20261102-002',
      booking: booking2._id,
      guest: guest2._id,
      amount: 75000,
      paymentMethod: 'Net Banking',
      transactionId: 'TXN-HDFC-883921',
      status: 'Paid',
      notes: 'Advance deposit received through Net Banking.',
      recordedBy: adminUser._id
    });

    // Reserved Booking (Room 301)
    const futureIn = new Date(now);
    futureIn.setDate(futureIn.getDate() + 2);
    const futureOut = new Date(now);
    futureOut.setDate(futureOut.getDate() + 6);

    const booking3 = await Booking.create({
      bookingNumber: 'BK-20261103-1003',
      guest: guest3._id,
      room: rooms[4]._id, // 301
      checkInDate: futureIn,
      checkOutDate: futureOut,
      adults: 1,
      children: 0,
      nights: 4,
      pricePerNight: 14500,
      totalPrice: 58000,
      paidAmount: 0,
      status: 'Confirmed',
      paymentStatus: 'Pending',
      specialRequests: 'Vegetarian breakfast options.',
      bookedBy: receptionistUser._id
    });

    // 7. Create Housekeeping Tasks
    console.log('[Seed] Seeding housekeeping tasks...');
    await Housekeeping.create([
      {
        room: rooms[5]._id, // 302
        assignedTo: housekeepingUser._id,
        taskType: 'Deep Clean',
        priority: 'High',
        status: 'In Progress',
        remarks: 'Deep carpet steam cleaning and AC filter replacement in progress.'
      },
      {
        room: rooms[0]._id, // 101
        assignedTo: housekeepingUser._id,
        taskType: 'Daily Cleaning',
        priority: 'Low',
        status: 'Pending',
        remarks: 'Routine dusting, linen inspection and minibar restocking.'
      },
      {
        room: rooms[1]._id, // 102
        assignedTo: housekeepingUser._id,
        taskType: 'Inspection',
        priority: 'Medium',
        status: 'Completed',
        completedAt: new Date(),
        remarks: 'Pre-arrival inspection passed. Ready for guests.'
      }
    ]);

    // 8. Create Activity Logs
    console.log('[Seed] Seeding activity logs...');
    await ActivityLog.create([
      {
        userName: 'Victoria Stirling',
        action: 'SYSTEM_INITIALIZATION',
        module: 'System',
        details: 'Grand Royale Hotel Management System initialized with luxury profile in Indian Rupees (INR).'
      },
      {
        userName: 'Julian Henderson',
        action: 'BOOKING_CREATED',
        module: 'Bookings',
        details: 'Confirmed reservation BK-20261101-1001 for Aarav Sharma in Room 201.'
      },
      {
        userName: 'Julian Henderson',
        action: 'PAYMENT_RECORDED',
        module: 'Payments',
        details: 'Recorded payment of ₹42,500.00 via UPI (INV-20261101-001).'
      },
      {
        userName: 'Victoria Stirling',
        action: 'CHECK_IN',
        module: 'Bookings',
        details: 'Checked in Priya Patel into Penthouse Suite 401.'
      }
    ]);

    console.log('====================================================');
    console.log('  SEEDING COMPLETED SUCCESSFULLY!                  ');
    console.log('  Admin:        admin@grandroyale.com / AdminPassword123!   ');
    console.log('  Receptionist: reception@grandroyale.com / ReceptionPassword123!');
    console.log('  Housekeeping: housekeeping@grandroyale.com / CleanPassword123!');
    console.log('====================================================');

    process.exit(0);
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
    process.exit(1);
  }
};

seedData();

const User = require('../models/User');
const Room = require('../models/Room');
const Guest = require('../models/Guest');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

describe('Mongoose Models & Schema Validations', () => {
  test('User model should correctly hash password on pre-save hook and comparePassword should verify', async () => {
    const user = new User({
      name: 'Test Administrator',
      email: 'test.admin@grandroyale.com',
      password: 'PlainSecretPassword123!',
      role: 'Admin'
    });

    await user.validate();
    // Simulate pre-save hook
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    const isMatch = await user.comparePassword('PlainSecretPassword123!');
    const isWrong = await user.comparePassword('WrongPassword');

    expect(isMatch).toBe(true);
    expect(isWrong).toBe(false);
  });

  test('Guest model virtual fullName should combine firstName and lastName', () => {
    const guest = new Guest({
      firstName: 'Alexander',
      lastName: 'Hamilton',
      email: 'alexander@example.com',
      phone: '+1 555-0199'
    });
    expect(guest.fullName).toBe('Alexander Hamilton');
  });

  test('Room model primaryImage virtual should return default image if no images provided', () => {
    const room = new Room({
      roomNumber: '999',
      category: '507f191e810c19729de860ea',
      pricePerNight: 200,
      images: []
    });
    expect(room.primaryImage).toBe('/images/default-room.jpg');
  });

  test('Room model primaryImage virtual should return first image if images array has items', () => {
    const room = new Room({
      roomNumber: '998',
      category: '507f191e810c19729de860ea',
      pricePerNight: 250,
      images: ['https://example.com/room.jpg', 'https://example.com/room2.jpg']
    });
    expect(room.primaryImage).toBe('https://example.com/room.jpg');
  });

  test('Booking model virtual balanceAmount should return accurate remaining balance', () => {
    const booking = new Booking({
      bookingNumber: 'BK-TEST-1001',
      guest: '507f191e810c19729de860ea',
      room: '507f191e810c19729de860eb',
      checkInDate: new Date('2026-12-01'),
      checkOutDate: new Date('2026-12-05'),
      nights: 4,
      pricePerNight: 200,
      totalPrice: 800,
      paidAmount: 300
    });
    expect(booking.balanceAmount).toBe(500);
  });

  test('Booking model virtual balanceAmount should not be negative if overpaid', () => {
    const booking = new Booking({
      bookingNumber: 'BK-TEST-1002',
      guest: '507f191e810c19729de860ea',
      room: '507f191e810c19729de860eb',
      checkInDate: new Date('2026-12-01'),
      checkOutDate: new Date('2026-12-05'),
      nights: 4,
      pricePerNight: 200,
      totalPrice: 800,
      paidAmount: 900
    });
    expect(booking.balanceAmount).toBe(0);
  });
});


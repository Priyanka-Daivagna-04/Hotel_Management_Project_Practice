const { calculateNights, generateBookingNumber } = require('../services/bookingService');

describe('Booking Service Business Logic', () => {
  test('calculateNights should accurately calculate stay nights between dates', () => {
    const inDate = new Date('2026-12-01');
    const outDate = new Date('2026-12-05');
    const nights = calculateNights(inDate, outDate);
    expect(nights).toBe(4);
  });

  test('calculateNights should return at least 1 night if same-day dates given', () => {
    const inDate = new Date('2026-12-01');
    const outDate = new Date('2026-12-01');
    const nights = calculateNights(inDate, outDate);
    expect(nights).toBe(1);
  });

  test('generateBookingNumber should generate correctly formatted unique reference', () => {
    const bNum1 = generateBookingNumber();
    const bNum2 = generateBookingNumber();
    expect(bNum1).toMatch(/^BK-\d{8}-\d{4}$/);
    expect(bNum2).toMatch(/^BK-\d{8}-\d{4}$/);
  });
});


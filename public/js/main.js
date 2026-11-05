document.addEventListener('DOMContentLoaded', () => {
  // 1. Sidebar Toggle
  const sidebar = document.getElementById('appSidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('show');
      if (sidebarOverlay) {
        sidebarOverlay.classList.toggle('show');
      }
    });
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sidebar.classList.remove('show');
      sidebarOverlay.classList.remove('show');
    });
  }

  // 2. Realtime Header Clock
  const liveClock = document.getElementById('liveClock');
  if (liveClock) {
    const updateTime = () => {
      const now = new Date();
      liveClock.textContent = now.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }) + ' • ' + now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  // 3. Auto dismiss alert messages after 6 seconds
  const autoAlerts = document.querySelectorAll('.alert-dismissible');
  autoAlerts.forEach((alert) => {
    setTimeout(() => {
      if (typeof bootstrap !== 'undefined' && bootstrap.Alert) {
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    }, 6000);
  });

  // 4. Booking Price Calculation Helper (on create/edit booking forms)
  const checkInInput = document.getElementById('checkInDate');
  const checkOutInput = document.getElementById('checkOutDate');
  const roomSelect = document.getElementById('roomId');
  const nightsDisplay = document.getElementById('calcNights');
  const totalDisplay = document.getElementById('calcTotalPrice');

  const updateBookingEstimate = () => {
    if (!checkInInput || !checkOutInput || !nightsDisplay) return;

    const inDate = new Date(checkInInput.value);
    const outDate = new Date(checkOutInput.value);

    if (!isNaN(inDate.getTime()) && !isNaN(outDate.getTime()) && outDate > inDate) {
      const diffTime = outDate.getTime() - inDate.getTime();
      const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      nightsDisplay.textContent = nights;

      if (roomSelect && totalDisplay) {
        const selectedOption = roomSelect.options[roomSelect.selectedIndex];
        const pricePerNight = selectedOption ? parseFloat(selectedOption.getAttribute('data-price')) || 0 : 0;
        const total = (nights * pricePerNight);
        totalDisplay.textContent = '₹' + total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
    }
  };

  if (checkInInput && checkOutInput) {
    checkInInput.addEventListener('change', updateBookingEstimate);
    checkOutInput.addEventListener('change', updateBookingEstimate);
  }
  if (roomSelect) {
    roomSelect.addEventListener('change', updateBookingEstimate);
  }
});

// Confirmation helper for delete buttons
function confirmDeletion(formId, entityName) {
  if (confirm(`Are you sure you want to remove this ${entityName}? This action cannot be easily undone.`)) {
    document.getElementById(formId).submit();
  }
}

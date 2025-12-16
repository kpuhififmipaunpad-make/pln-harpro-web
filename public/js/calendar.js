// ==================== TOAST NOTIFICATION SYSTEM ====================
function showToast(message, type = 'info', duration = 3000) {
  // Buat container toast jika belum ada
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  // Buat elemen toast
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  // Icon berdasarkan tipe
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;
  
  toastContainer.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => toast.classList.add('toast-show'), 10);
  
  // Auto remove
  setTimeout(() => {
    toast.classList.remove('toast-show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Ambil data activities dari window object
var activitiesData = window.activitiesData || [];
console.log('Initial activities loaded:', activitiesData.length);

// Calendar functionality
let currentDate = new Date();
let selectedDate = null;

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Helper: YYYY-MM-DD (lokal)
function getLocalDateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Load activities untuk bulan aktif - OPTIMIZED
async function loadActivities() {
  try {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;

    console.log('🔄 Loading activities for:', startOfMonth);
    
    // Tambahkan loading indicator
    const grid = document.getElementById('calendarGrid');
    if (grid) grid.style.opacity = '0.6';
    
    const res = await fetch(`/api/activities/month/${startOfMonth}`);
    
    if (!res.ok) {
      console.error('❌ Load activities failed with status:', res.status);
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();

    console.log('🔄 API month data:', data);
    activitiesData = data || [];
    console.log('📊 activitiesData length:', activitiesData.length);
    
    // Hilangkan loading indicator
    if (grid) grid.style.opacity = '1';
  } catch (err) {
    console.error('❌ Error loading activities:', err);
    activitiesData = [];
    const grid = document.getElementById('calendarGrid');
    if (grid) grid.style.opacity = '1';
    showToast('Gagal memuat data kegiatan', 'error');
  }
}

// OPTIMIZED: Create day cell function
function createDayCell(year, month, day, today) {
  const dayCell = document.createElement('div');
  dayCell.className = 'calendar-day';
  dayCell.textContent = day;

  const cellDate = new Date(year, month, day);
  const dateStr = getLocalDateString(cellDate);

  if (cellDate.toDateString() === today.toDateString()) {
    dayCell.classList.add('today');
  }

  // Marker strip & deskripsi
  const markerStrip = document.createElement('div');
  markerStrip.className = 'marker-strip';

  const segRutin = document.createElement('div');
  segRutin.className = 'marker-seg marker-rutin';
  const segNon = document.createElement('div');
  segNon.className = 'marker-seg marker-non';
  const segPihak = document.createElement('div');
  segPihak.className = 'marker-seg marker-pihak';
  const segLibur = document.createElement('div');
  segLibur.className = 'marker-seg marker-libur';

  // Gunakan append untuk performa lebih baik
  markerStrip.append(segRutin, segNon, segPihak, segLibur);

  const descList = document.createElement('div');
  descList.className = 'day-desc-list';

  dayCell.append(markerStrip, descList);

  // Ambil semua kegiatan di tanggal ini
  const activitiesForDay = activitiesData.filter(activity => {
    const activityDate = getLocalDateString(activity.date);
    return activityDate === dateStr;
  });

  if (activitiesForDay.length > 0) {
    dayCell.classList.add('has-activity', 'has-marker');

    const allTypes = new Set(activitiesForDay.flatMap(a => a.workTypes || []));

    // Set opacity lebih efisien
    segRutin.style.opacity = allTypes.has('Rutin') ? '1' : '0';
    segNon.style.opacity = allTypes.has('Non Rutin') ? '1' : '0';
    segPihak.style.opacity = allTypes.has('Pihak Lain') ? '1' : '0';
    segLibur.style.opacity = allTypes.has('Libur Nasional') ? '1' : '0';

    // deskripsi: ambil maksimal 2 activity
    const fragment = document.createDocumentFragment();
    activitiesForDay.slice(0, 2).forEach(activity => {
      const rawDesc = (activity.description || '').trim();
      if (!rawDesc) return;

      const words = rawDesc.split(/\s+/).slice(0, 6);
      const shortDesc = words.join(' ');

      const descItem = document.createElement('div');
      descItem.classList.add('day-desc-item');

      // tentukan warna berdasarkan jenis pekerjaan
      const types = activity.workTypes || [];
      if (types.includes('Rutin')) descItem.classList.add('day-desc-rutin');
      else if (types.includes('Non Rutin')) descItem.classList.add('day-desc-non');
      else if (types.includes('Pihak Lain')) descItem.classList.add('day-desc-pihak');
      else if (types.includes('Libur Nasional')) descItem.classList.add('day-desc-libur');

      descItem.textContent = shortDesc;
      fragment.appendChild(descItem);
    });
    descList.appendChild(fragment);
  }

  // Event listener
  dayCell.addEventListener('click', () => selectDate(cellDate, dayCell), { passive: true });
  
  return dayCell;
}

// OPTIMIZED: Render calendar with DocumentFragment
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  document.getElementById('currentMonth').textContent =
    `${monthNames[month]} ${year}`;

  const grid = document.getElementById('calendarGrid');
  
  // Gunakan DocumentFragment untuk performa optimal
  const fragment = document.createDocumentFragment();

  // Header hari
  dayNames.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day header';
    dayHeader.textContent = day;
    fragment.appendChild(dayHeader);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Tanggal bulan sebelumnya
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day other-month';
    dayCell.textContent = daysInPrevMonth - i;
    fragment.appendChild(dayCell);
  }

  // Tanggal bulan aktif - gunakan fungsi createDayCell
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = createDayCell(year, month, day, today);
    fragment.appendChild(dayCell);
  }

  // Tanggal bulan berikutnya
  const totalCells = fragment.children.length - 7;
  const remainingCells = 35 - totalCells;
  for (let day = 1; day <= remainingCells; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day other-month';
    dayCell.textContent = day;
    fragment.appendChild(dayCell);
  }

  // Clear dan append sekali saja - JAUH LEBIH CEPAT
  grid.innerHTML = '';
  grid.appendChild(fragment);
}

function selectDate(date, element) {
  // Batch DOM updates
  requestAnimationFrame(() => {
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
      day.classList.remove('selected');
    });

    element.classList.add('selected');
    selectedDate = date;

    const dateStr = getLocalDateString(date);
    document.getElementById('selectedDate').value = dateStr;
    document.getElementById('selectedDateDisplay').textContent =
      `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;

    showActivitiesForDate(date);
  });
}

function showActivitiesForDate(date) {
  const dateStr = getLocalDateString(date);

  console.log('🔍 Looking for activities on:', dateStr);
  console.log('📊 Total activities loaded:', activitiesData.length);

  const activities = activitiesData.filter(activity => {
    const activityDate = getLocalDateString(activity.date);
    return activityDate === dateStr;
  });

  console.log('✅ Found', activities.length, 'activities');

  const activityList = document.getElementById('activityList');
  const noActivity = document.querySelector('.no-activity');

  if (activities.length === 0) {
    noActivity.style.display = 'block';
    activityList.innerHTML = '';
  } else {
    noActivity.style.display = 'none';
    activityList.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <span class="activity-gi">${activity.gi}</span>
        <div class="activity-worktypes">
          ${activity.workTypes.map(type => {
            let cls = '';
            if (type === 'Rutin') cls = 'rutin';
            else if (type === 'Non Rutin') cls = 'nonrutin';
            else if (type === 'Pihak Lain') cls = 'pihaklain';
            else if (type === 'Libur Nasional') cls = 'libur';
            return `<span class="activity-worktype ${cls}">${type}</span>`;
          }).join('')}
        </div>
        <div class="activity-personnel">
          ${activity.personnel.map(person =>
            `<span class="personnel-tag">${person}</span>`
          ).join('')}
        </div>
        ${activity.description ? `<div class="activity-description">${activity.description}</div>` : ''}
        ${activity.notes ? `<div class="activity-notes">Catatan: ${activity.notes}</div>` : ''}
        <button class="btn-delete" onclick="deleteActivity('${activity._id}')">Hapus</button>
      </div>
    `).join('');
  }
}

// Form submission - WITH TOAST NOTIFICATIONS
document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);

  const workTypes = Array.from(document.querySelectorAll('input[name="workTypes"]:checked'))
    .map(cb => cb.value);
  const personnel = Array.from(document.querySelectorAll('input[name="personnel"]:checked'))
    .map(cb => cb.value);

  // Validasi frontend
  if (!formData.get('date')) {
    showToast('Pilih tanggal terlebih dahulu!', 'warning');
    return;
  }

  if (!formData.get('gi')) {
    showToast('Pilih lokasi GI!', 'warning');
    return;
  }

  if (workTypes.length === 0) {
    showToast('Pilih minimal 1 jenis pekerjaan!', 'warning');
    return;
  }

  if (personnel.length === 0) {
    showToast('Pilih minimal 1 personel!', 'warning');
    return;
  }

  // Batasi deskripsi 10 kata
  let desc = formData.get('description') || '';
  desc = desc.trim();
  const words = desc.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 10) {
    desc = words.slice(0, 10).join(' ');
  }

  // Bersihkan notes
  let notes = formData.get('notes') || '';
  notes = notes.trim();

  const data = {
    date: formData.get('date'),
    gi: formData.get('gi'),
    workTypes: workTypes,
    personnel: personnel,
    description: desc,
    notes: notes
  };

  console.log('📤 Sending data to /activities:', JSON.stringify(data, null, 2));

  try {
    const response = await fetch('/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });

    console.log('📥 Response status:', response.status);

    if (response.ok) {
      let result;
      try {
        result = await response.json();
        console.log('✅ Success response:', result);
      } catch (e) {
        console.log('✅ Success but no JSON response');
      }
      
      showToast('Agenda berhasil disimpan!', 'success');

      await loadActivities();
      renderCalendar();

      e.target.reset();
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
        const label = cb.closest('.checkbox-label');
        if (label) label.classList.remove('is-checked');
      });

      if (selectedDate) {
        showActivitiesForDate(selectedDate);
      }
    } else {
      let errorMessage = 'Gagal menyimpan agenda';
      
      try {
        const contentType = response.headers.get('content-type');
        
        if (contentType && contentType.includes('application/json')) {
          const errorDetails = await response.json();
          console.error('❌ Server error response (JSON):', errorDetails);
          
          errorMessage = errorDetails.message || 
                        errorDetails.error || 
                        errorDetails.msg || 
                        errorDetails.detail ||
                        'Gagal menyimpan agenda';
        } else {
          const errorText = await response.text();
          console.error('❌ Server error (text):', errorText);
          errorMessage = errorText || errorMessage;
        }
      } catch (parseError) {
        console.error('❌ Parse error:', parseError);
      }
      
      showToast(errorMessage, 'error', 4000);
    }
  } catch (err) {
    console.error('❌ Network or fetch error:', err);
    showToast(`Terjadi kesalahan koneksi: ${err.message}`, 'error', 4000);
  }
});

// Delete activity - WITH TOAST
async function deleteActivity(id) {
  if (!confirm('Yakin ingin menghapus agenda ini?')) return;

  console.log('🗑️ Deleting activity:', id);

  try {
    const response = await fetch(`/activities/${id}`, {
      method: 'DELETE'
    });

    console.log('📥 Delete response status:', response.status);

    if (response.ok) {
      showToast('Agenda berhasil dihapus!', 'success');

      await loadActivities();
      renderCalendar();

      if (selectedDate) {
        showActivitiesForDate(selectedDate);
      }
    } else {
      let errorMessage = 'Gagal menghapus agenda';
      try {
        const errorData = await response.json();
        console.error('❌ Delete error:', errorData);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        const errorText = await response.text();
        console.error('❌ Delete error (text):', errorText);
        errorMessage = errorText || errorMessage;
      }
      showToast(errorMessage, 'error');
    }
  } catch (err) {
    console.error('❌ Delete network error:', err);
    showToast(`Terjadi kesalahan: ${err.message}`, 'error');
  }
}

// Event listeners
document.getElementById('prevMonth').addEventListener('click', async () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  await loadActivities();
  renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', async () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  await loadActivities();
  renderCalendar();
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Calendar initializing...');
  console.log('🚀 Current date:', currentDate);
  
  await loadActivities();
  renderCalendar();

  // Sync checkbox state dengan class .is-checked
  document.querySelectorAll('.checkbox-label input[type="checkbox"]').forEach(input => {
    const label = input.closest('.checkbox-label');

    if (input.checked) {
      label.classList.add('is-checked');
    }

    input.addEventListener('change', () => {
      if (input.checked) {
        label.classList.add('is-checked');
      } else {
        label.classList.remove('is-checked');
      }
    });
  });
  
  console.log('✅ Calendar initialized successfully');
});

// Export to PDF - HIDE SELECTED STATE
document.getElementById('exportPDF')?.addEventListener('click', async () => {
  try {
    const exportArea = document.querySelector('.calendar-export-area');
    const exportButtons = document.querySelector('.export-buttons');
    
    if (!exportArea || !exportButtons) {
      console.error('❌ Element tidak ditemukan');
      showToast('Elemen export tidak ditemukan!', 'error');
      return;
    }
    
    console.log('📄 Starting PDF export...');
    showToast('Mengekspor ke PDF...', 'info', 2000);
    
    // Sembunyikan buttons dan selected state
    exportButtons.style.display = 'none';
    exportArea.classList.add('exporting');
    
    // Simpan dan hapus class selected sementara
    const selectedCell = document.querySelector('.calendar-day.selected');
    const wasSelected = !!selectedCell;
    if (selectedCell) {
      selectedCell.classList.remove('selected');
    }
    
    const canvas = await html2canvas(exportArea, {
      scale: 1.5,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });
    
    // Kembalikan selected state
    exportButtons.style.display = 'flex';
    exportArea.classList.remove('exporting');
    if (wasSelected && selectedCell) {
      selectedCell.classList.add('selected');
    }
    
    const monthTitle = document.getElementById('currentMonth').textContent;
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 10;
    const availableWidth = pdfWidth - (margin * 2);
    const availableHeight = pdfHeight - (margin * 2);
    
    const imgWidth = availableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    let finalHeight = imgHeight;
    let finalWidth = imgWidth;
    
    if (imgHeight > availableHeight) {
      finalHeight = availableHeight;
      finalWidth = (canvas.width * finalHeight) / canvas.height;
    }
    
    const xOffset = (pdfWidth - finalWidth) / 2;
    const yOffset = margin;
    
    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, finalWidth, finalHeight);
    pdf.save(`Kalender-${monthTitle.replace(/\s+/g, '-')}.pdf`);
    
    console.log('✅ PDF exported successfully');
    showToast('PDF berhasil diunduh!', 'success');
  } catch (error) {
    console.error('❌ Error saat export PDF:', error);
    showToast(`Gagal export PDF: ${error.message}`, 'error');
    
    // Pastikan kembalikan UI ke normal jika error
    const exportButtons = document.querySelector('.export-buttons');
    const exportArea = document.querySelector('.calendar-export-area');
    const selectedCell = document.querySelector('.calendar-day');
    if (exportButtons) exportButtons.style.display = 'flex';
    if (exportArea) exportArea.classList.remove('exporting');
  }
});

// Export to PNG - HIDE SELECTED STATE
document.getElementById('exportPNG')?.addEventListener('click', async () => {
  try {
    const exportArea = document.querySelector('.calendar-export-area');
    const exportButtons = document.querySelector('.export-buttons');
    
    if (!exportArea || !exportButtons) {
      console.error('❌ Element tidak ditemukan');
      showToast('Elemen export tidak ditemukan!', 'error');
      return;
    }
    
    console.log('🖼️ Starting PNG export...');
    showToast('Mengekspor ke PNG...', 'info', 2000);
    
    // Sembunyikan buttons dan selected state
    exportButtons.style.display = 'none';
    exportArea.classList.add('exporting');
    
    // Simpan dan hapus class selected sementara
    const selectedCell = document.querySelector('.calendar-day.selected');
    const wasSelected = !!selectedCell;
    if (selectedCell) {
      selectedCell.classList.remove('selected');
    }
    
    const canvas = await html2canvas(exportArea, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });
    
    // Kembalikan selected state
    exportButtons.style.display = 'flex';
    exportArea.classList.remove('exporting');
    if (wasSelected && selectedCell) {
      selectedCell.classList.add('selected');
    }
    
    const monthTitle = document.getElementById('currentMonth').textContent;
    const link = document.createElement('a');
    link.download = `Kalender-${monthTitle.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    console.log('✅ PNG exported successfully');
    showToast('PNG berhasil diunduh!', 'success');
  } catch (error) {
    console.error('❌ Error saat export PNG:', error);
    showToast(`Gagal export PNG: ${error.message}`, 'error');
    
    // Pastikan kembalikan UI ke normal jika error
    const exportButtons = document.querySelector('.export-buttons');
    const exportArea = document.querySelector('.calendar-export-area');
    if (exportButtons) exportButtons.style.display = 'flex';
    if (exportArea) exportArea.classList.remove('exporting');
  }
});

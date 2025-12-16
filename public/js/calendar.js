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

// Load activities untuk bulan aktif
async function loadActivities() {
  try {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;

    console.log('🔄 Loading activities for:', startOfMonth);
    const res = await fetch(`/api/activities/month/${startOfMonth}`);
    
    if (!res.ok) {
      console.error('❌ Load activities failed with status:', res.status);
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();

    console.log('🔄 API month data:', data);
    activitiesData = data || [];
    console.log('📊 activitiesData length:', activitiesData.length);
  } catch (err) {
    console.error('❌ Error loading activities:', err);
    activitiesData = [];
  }
}

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  document.getElementById('currentMonth').textContent =
    `${monthNames[month]} ${year}`;

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  // Header hari
  dayNames.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day header';
    dayHeader.textContent = day;
    grid.appendChild(dayHeader);
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Tanggal bulan sebelumnya
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day other-month';
    dayCell.textContent = daysInPrevMonth - i;
    grid.appendChild(dayCell);
  }

  // Tanggal bulan aktif
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
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

    markerStrip.appendChild(segRutin);
    markerStrip.appendChild(segNon);
    markerStrip.appendChild(segPihak);
    markerStrip.appendChild(segLibur);

    const descList = document.createElement('div');
    descList.className = 'day-desc-list';

    dayCell.appendChild(markerStrip);
    dayCell.appendChild(descList);

    // Ambil semua kegiatan di tanggal ini
    const activitiesForDay = activitiesData.filter(activity => {
      const activityDate = getLocalDateString(activity.date);
      return activityDate === dateStr;
    });

    if (activitiesForDay.length > 0) {
      dayCell.classList.add('has-activity', 'has-marker');

      const allTypes = new Set(activitiesForDay.flatMap(a => a.workTypes || []));

      // reset segmen
      segRutin.style.opacity = '0';
      segNon.style.opacity   = '0';
      segPihak.style.opacity = '0';
      segLibur.style.opacity = '0';

      if (allTypes.has('Rutin'))          segRutin.style.opacity = '1';
      if (allTypes.has('Non Rutin'))      segNon.style.opacity   = '1';
      if (allTypes.has('Pihak Lain'))     segPihak.style.opacity = '1';
      if (allTypes.has('Libur Nasional')) segLibur.style.opacity = '1';

      // deskripsi: ambil maksimal 2 activity
      descList.innerHTML = '';
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
        descList.appendChild(descItem);
      });
    }

    dayCell.addEventListener('click', () => selectDate(cellDate, dayCell));
    grid.appendChild(dayCell);
  }

  // Tanggal bulan berikutnya
  const totalCells = grid.children.length - 7;
  const remainingCells = 35 - totalCells;
  for (let day = 1; day <= remainingCells; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day other-month';
    dayCell.textContent = day;
    grid.appendChild(dayCell);
  }
}

function selectDate(date, element) {
  document.querySelectorAll('.calendar-day').forEach(day => {
    day.classList.remove('selected');
  });

  element.classList.add('selected');
  selectedDate = date;

  const dateStr = getLocalDateString(date);
  document.getElementById('selectedDate').value = dateStr;
  document.getElementById('selectedDateDisplay').textContent =
    `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;

  showActivitiesForDate(date);
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

// Form submission - ENHANCED ERROR HANDLING
document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);

  const workTypes = Array.from(document.querySelectorAll('input[name="workTypes"]:checked'))
    .map(cb => cb.value);
  const personnel = Array.from(document.querySelectorAll('input[name="personnel"]:checked'))
    .map(cb => cb.value);

  // Validasi frontend
  if (!formData.get('date')) {
    alert('❌ Pilih tanggal terlebih dahulu!');
    return;
  }

  if (!formData.get('gi')) {
    alert('❌ Pilih lokasi GI!');
    return;
  }

  if (workTypes.length === 0) {
    alert('❌ Pilih minimal 1 jenis pekerjaan!');
    return;
  }

  if (personnel.length === 0) {
    alert('❌ Pilih minimal 1 personel!');
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

  console.log('📤 Sending data to /activities:');
  console.log(JSON.stringify(data, null, 2));
  console.log('📤 Data types:', {
    date: typeof data.date,
    gi: typeof data.gi,
    workTypes: Array.isArray(data.workTypes) ? 'array' : typeof data.workTypes,
    personnel: Array.isArray(data.personnel) ? 'array' : typeof data.personnel,
    description: typeof data.description,
    notes: typeof data.notes
  });

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
    console.log('📥 Response statusText:', response.statusText);
    console.log('📥 Response headers:', [...response.headers.entries()]);

    if (response.ok) {
      let result;
      try {
        result = await response.json();
        console.log('✅ Success response:', result);
      } catch (e) {
        console.log('✅ Success but no JSON response');
      }
      
      alert('✅ Agenda berhasil disimpan!');

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
      // ENHANCED ERROR LOGGING
      let errorMessage = 'Gagal menyimpan agenda';
      let errorDetails = {};
      
      try {
        const contentType = response.headers.get('content-type');
        console.log('📥 Error content-type:', contentType);
        
        if (contentType && contentType.includes('application/json')) {
          errorDetails = await response.json();
          console.error('❌ Server error response (JSON):', errorDetails);
          console.error('❌ Error object keys:', Object.keys(errorDetails));
          console.error('❌ Error object values:', Object.values(errorDetails));
          console.error('❌ Error stringified:', JSON.stringify(errorDetails, null, 2));
          
          // Cari pesan error di berbagai kemungkinan property
          errorMessage = errorDetails.message || 
                        errorDetails.error || 
                        errorDetails.msg || 
                        errorDetails.detail ||
                        errorDetails.errors ||
                        JSON.stringify(errorDetails);
        } else {
          const errorText = await response.text();
          console.error('❌ Server error (text):', errorText);
          errorMessage = errorText || errorMessage;
        }
      } catch (parseError) {
        console.error('❌ Parse error:', parseError);
        try {
          const errorText = await response.text();
          console.error('❌ Raw error text:', errorText);
          errorMessage = errorText || errorMessage;
        } catch (e) {
          console.error('❌ Could not read response body');
        }
      }
      
      // Tampilkan error lebih detail
      const errorDisplay = typeof errorMessage === 'object' 
        ? JSON.stringify(errorMessage, null, 2) 
        : errorMessage;
      
      alert(`❌ Error ${response.status}: ${errorDisplay}`);
      console.error('❌ FULL ERROR DETAILS:', {
        status: response.status,
        statusText: response.statusText,
        errorMessage: errorMessage,
        sentData: data
      });
    }
  } catch (err) {
    console.error('❌ Network or fetch error:', err);
    console.error('❌ Error name:', err.name);
    console.error('❌ Error message:', err.message);
    console.error('❌ Error stack:', err.stack);
    alert(`❌ Terjadi kesalahan koneksi: ${err.message}`);
  }
});

// Delete activity - IMPROVED ERROR HANDLING
async function deleteActivity(id) {
  if (!confirm('Yakin ingin menghapus agenda ini?')) return;

  console.log('🗑️ Deleting activity:', id);

  try {
    const response = await fetch(`/activities/${id}`, {
      method: 'DELETE'
    });

    console.log('📥 Delete response status:', response.status);

    if (response.ok) {
      alert('✅ Agenda berhasil dihapus!');

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
      alert(`❌ ${errorMessage}`);
    }
  } catch (err) {
    console.error('❌ Delete network error:', err);
    alert(`❌ Terjadi kesalahan: ${err.message}`);
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

// Export to PDF
document.getElementById('exportPDF')?.addEventListener('click', async () => {
  try {
    const exportArea = document.querySelector('.calendar-export-area');
    const exportButtons = document.querySelector('.export-buttons');
    
    if (!exportArea || !exportButtons) {
      console.error('❌ Element tidak ditemukan');
      alert('❌ Elemen export tidak ditemukan!');
      return;
    }
    
    console.log('📄 Starting PDF export...');
    exportButtons.style.display = 'none';
    exportArea.classList.add('exporting');
    
    const canvas = await html2canvas(exportArea, {
      scale: 1.5,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });
    
    exportButtons.style.display = 'flex';
    exportArea.classList.remove('exporting');
    
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
  } catch (error) {
    console.error('❌ Error saat export PDF:', error);
    alert(`❌ Gagal export PDF: ${error.message}`);
  }
});

// Export to PNG
document.getElementById('exportPNG')?.addEventListener('click', async () => {
  try {
    const exportArea = document.querySelector('.calendar-export-area');
    const exportButtons = document.querySelector('.export-buttons');
    
    if (!exportArea || !exportButtons) {
      console.error('❌ Element tidak ditemukan');
      alert('❌ Elemen export tidak ditemukan!');
      return;
    }
    
    console.log('🖼️ Starting PNG export...');
    exportButtons.style.display = 'none';
    exportArea.classList.add('exporting');
    
    const canvas = await html2canvas(exportArea, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });
    
    exportButtons.style.display = 'flex';
    exportArea.classList.remove('exporting');
    
    const monthTitle = document.getElementById('currentMonth').textContent;
    const link = document.createElement('a');
    link.download = `Kalender-${monthTitle.replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    console.log('✅ PNG exported successfully');
  } catch (error) {
    console.error('❌ Error saat export PNG:', error);
    alert(`❌ Gagal export PNG: ${error.message}`);
  }
});

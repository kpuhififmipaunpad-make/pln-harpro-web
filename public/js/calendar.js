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

    const res = await fetch(`/api/activities/month/${startOfMonth}`);
    const data = await res.json();

    console.log('🔄 API month data:', data);
    activitiesData = data || [];
    console.log('📊 activitiesData length:', activitiesData.length);
  } catch (err) {
    console.error('Error loading activities:', err);
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

    const desc = document.createElement('div');
    desc.className = 'day-desc';

    dayCell.appendChild(markerStrip);
    dayCell.appendChild(desc);

    // Ambil semua kegiatan di tanggal ini
    const activitiesForDay = activitiesData.filter(activity => {
      const activityDate = getLocalDateString(activity.date);
      return activityDate === dateStr;
    });

    if (activitiesForDay.length > 0) {
      dayCell.classList.add('has-activity', 'has-marker');

      const allTypes = new Set(activitiesForDay.flatMap(a => a.workTypes || []));

      // RESET dulu
      segRutin.style.opacity = '0';
      segNon.style.opacity   = '0';
      segPihak.style.opacity = '0';
      segLibur.style.opacity = '0';

      if (allTypes.has('Rutin')) segRutin.style.opacity = '1';
      if (allTypes.has('Non Rutin')) segNon.style.opacity = '1';
      if (allTypes.has('Pihak Lain')) segPihak.style.opacity = '1';
      if (allTypes.has('Libur Nasional')) segLibur.style.opacity = '1';

      const firstDesc = (activitiesForDay[0].description || '').trim();
      if (firstDesc) {
        const words = firstDesc.split(/\s+/).slice(0, 10);
        desc.textContent = words.join(' ');
      }
    }

    dayCell.addEventListener('click', () => selectDate(cellDate, dayCell));
    grid.appendChild(dayCell);
  }

  // Tanggal bulan berikutnya (isi sampai 5 baris)
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

// Form submission
document.getElementById('scheduleForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);

  const workTypes = Array.from(document.querySelectorAll('input[name="workTypes"]:checked'))
    .map(cb => cb.value);
  const personnel = Array.from(document.querySelectorAll('input[name="personnel"]:checked'))
    .map(cb => cb.value);

  if (!formData.get('date')) {
    alert('Pilih tanggal terlebih dahulu!');
    return;
  }

  if (!formData.get('gi')) {
    alert('Pilih lokasi GI!');
    return;
  }

  if (workTypes.length === 0) {
    alert('Pilih minimal 1 jenis pekerjaan!');
    return;
  }

  if (personnel.length === 0) {
    alert('Pilih minimal 1 personel!');
    return;
  }

  let desc = formData.get('description') || '';
  const words = desc.trim().split(/\s+/);
  if (words.length > 10) {
    desc = words.slice(0, 10).join(' ');
  }

  const data = {
    date: formData.get('date'),
    gi: formData.get('gi'),
    workTypes: workTypes,
    personnel: personnel,
    description: desc,
    notes: formData.get('notes')
  };

  try {
    const response = await fetch('/activities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      alert('✅ Agenda berhasil disimpan!');

      await loadActivities();
      renderCalendar();

      e.target.reset();
      document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

      if (selectedDate) {
        showActivitiesForDate(selectedDate);
      }
    } else {
      alert('❌ Gagal menyimpan agenda!');
    }
  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan!');
  }
});

// Delete activity
async function deleteActivity(id) {
  if (!confirm('Yakin ingin menghapus agenda ini?')) return;

  try {
    const response = await fetch(`/activities/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      alert('✅ Agenda berhasil dihapus!');

      await loadActivities();
      renderCalendar();

      if (selectedDate) {
        showActivitiesForDate(selectedDate);
      }
    } else {
      alert('❌ Gagal menghapus agenda!');
    }
  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan!');
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
  await loadActivities();
  renderCalendar();
});

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

console.log('📊 Initial activities loaded:', activitiesData.length);

// ✅ HELPER: Convert UTC date to local date string (YYYY-MM-DD)
function getLocalDateString(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ✅ LOAD ACTIVITIES dari server (AJAX)
async function loadActivities() {
  try {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const startOfMonth = `${year}-${String(month + 1).padStart(2,'0')}-01`;

    const res = await fetch(`/api/activities/month/${startOfMonth}`);
    const data = await res.json();

    console.log('🔄 API month data:', data);   // debug
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
  
  // Add day headers
  dayNames.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day header';
    dayHeader.textContent = day;
    grid.appendChild(dayHeader);
  });
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day other-month';
    dayCell.textContent = daysInPrevMonth - i;
    grid.appendChild(dayCell);
  }
  
  // Current month days
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
    
    // ✅ Check if has activity (timezone-safe)
    const hasActivity = activitiesData.some(activity => {
      const activityDate = getLocalDateString(activity.date);
      return activityDate === dateStr;
    });
    
    if (hasActivity) {
      dayCell.classList.add('has-activity');
    }
    
    dayCell.addEventListener('click', () => selectDate(cellDate, dayCell));
    grid.appendChild(dayCell);
  }
  
  // Next month days
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
  
  // Update form
  const dateStr = getLocalDateString(date);
  document.getElementById('selectedDate').value = dateStr;
  document.getElementById('selectedDateDisplay').textContent = 
    `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  
  // Show activities for selected date
  showActivitiesForDate(date);
}

function showActivitiesForDate(date) {
  const dateStr = getLocalDateString(date);
  
  console.log('🔍 Looking for activities on:', dateStr);
  console.log('📊 Total activities loaded:', activitiesData.length);
  
  // ✅ Filter activities (timezone-safe)
  const activities = activitiesData.filter(activity => {
    const activityDate = getLocalDateString(activity.date);
    console.log('  Comparing:', activityDate, '===', dateStr);
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
          ${activity.workTypes.map(type => 
            `<span class="activity-worktype">${type}</span>`
          ).join('')}
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
  
  const data = {
    date: formData.get('date'),
    gi: formData.get('gi'),
    workTypes: workTypes,
    personnel: personnel,
    description: formData.get('description'),
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
      
      // Reset form
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

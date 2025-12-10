// Calendar functionality
let currentDate = new Date();
let selectedDate = null;

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mai', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // Update header
  document.getElementById('currentMonth').textContent = 
    `${monthNames[month]} ${year}`;
  
  // Clear grid
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';
  
  // Add day headers
  dayNames.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'calendar-day header';
    dayHeader.textContent = day;
    grid.appendChild(dayHeader);
  });
  
  // Get first day of month and days in month
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  // Add previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day other-month';
    dayCell.textContent = daysInPrevMonth - i;
    grid.appendChild(dayCell);
  }
  
  // Add current month days
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day';
    dayCell.textContent = day;
    
    const cellDate = new Date(year, month, day);
    const dateStr = cellDate.toISOString().split('T')[0];
    
    // Check if today
    if (cellDate.toDateString() === today.toDateString()) {
      dayCell.classList.add('today');
    }
    
    // Check if has activity
    const hasActivity = activitiesData.some(activity => {
      const activityDate = new Date(activity.date).toISOString().split('T')[0];
      return activityDate === dateStr;
    });
    
    if (hasActivity) {
      dayCell.classList.add('has-activity');
    }
    
    // Add click event
    dayCell.addEventListener('click', () => selectDate(cellDate, dayCell));
    
    grid.appendChild(dayCell);
  }
  
  // Add next month days
  const totalCells = grid.children.length - 7; // Exclude headers
  const remainingCells = 35 - totalCells;
  for (let day = 1; day <= remainingCells; day++) {
    const dayCell = document.createElement('div');
    dayCell.className = 'calendar-day other-month';
    dayCell.textContent = day;
    grid.appendChild(dayCell);
  }
}

function selectDate(date, element) {
  // Remove previous selection
  document.querySelectorAll('.calendar-day').forEach(day => {
    day.classList.remove('selected');
  });
  
  // Add selection
  element.classList.add('selected');
  selectedDate = date;
  
  // Show activities for selected date
  showActivitiesForDate(date);
}

function showActivitiesForDate(date) {
  const dateStr = date.toISOString().split('T')[0];
  const activities = activitiesData.filter(activity => {
    const activityDate = new Date(activity.date).toISOString().split('T')[0];
    return activityDate === dateStr;
  });
  
  const activityList = document.getElementById('activityList');
  const noActivity = document.querySelector('.no-activity');
  
  if (activities.length === 0) {
    noActivity.style.display = 'block';
    activityList.innerHTML = '';
  } else {
    noActivity.style.display = 'none';
    activityList.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <div class="activity-title">${activity.title}</div>
        <span class="activity-category">${activity.category}</span>
        <div class="activity-description">${activity.description}</div>
        <span class="activity-status ${activity.status.toLowerCase().replace(' ', '-')}">${activity.status}</span>
      </div>
    `).join('');
  }
}

// Event listeners
document.getElementById('prevMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderCalendar();
});

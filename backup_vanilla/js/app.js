// js/app.js

let occupancyChartInstance = null;
let currentActiveTab = 'dashboard';
let currentUser = null;
let activeRoomHostelFilterId = null;
let activeReportTab = 'occupancy';

// Helper: relative time string
function getRelativeTime(date) {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

// ==========================================
// API CLIENT LAYER
// ==========================================
const api = {
  async get(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  },
  async post(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Server error');
    }
    return res.json();
  },
  async put(url, data) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Server error');
    }
    return res.json();
  },
  async delete(url) {
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.json();
  }
};

// // ==========================================
// 1. INITIALIZATION (No Auth — Direct Dashboard)
// ==========================================

// Default manager user — no login required
currentUser = {
  name: 'Hostel Manager',
  email: 'manager@aegis.com',
  role: 'ADMIN'
};

document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initTabRouting();
  initGlobalSearch();
  initQuickAction();
  initDatabaseReset();
  initExportCSV();
  initAuthListeners(); // just wires logout button

  // Print report button
  const btnPrint = document.getElementById('btnPrintReport');
  if (btnPrint) btnPrint.addEventListener('click', () => window.print());

  // Set default date for attendance
  const datePicker = document.getElementById('attendanceDatePicker');
  if (datePicker) datePicker.value = new Date().toISOString().split('T')[0];

  // Show manager name in sidebar
  const nameEl = document.getElementById('sidebarUserName');
  const roleEl = document.getElementById('sidebarUserRole');
  const avatarEl = document.getElementById('sidebarAvatar');
  if (nameEl) nameEl.textContent = currentUser.name;
  if (roleEl) roleEl.textContent = 'Hostel Manager';
  if (avatarEl) avatarEl.textContent = 'HM';

  // Load dashboard immediately
  renderView('dashboard');

  // Form handlers
  try { setupFormHandlers(); } catch (err) { console.error('Form handlers error:', err); }
});


function initClock() {
  const clockEl = document.getElementById('clock');
  const calEl = document.getElementById('calendarDate');
  
  function updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    clockEl.textContent = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    calEl.textContent = now.toLocaleDateString('en-US', options);
  }
  
  updateTime();
  setInterval(updateTime, 1000);
}

function initAuthListeners() {
  // Login submit is handled by the inline script in index.html
  // Only handle logout here
  var btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      sessionStorage.removeItem('aegis_session');
      currentUser = null;
      applyAuthLayout(false);
      showToast('Logged out successfully', 'success');
    });
  }
}


function checkAuthSession() {
  const session = sessionStorage.getItem('aegis_session');
  if (session) {
    currentUser = JSON.parse(session);
    applyAuthLayout(true);
  } else {
    applyAuthLayout(false);
  }
}

function applyAuthLayout(isAuthenticated) {
  const authContainer = document.getElementById('authContainer');
  const mainContainer = document.getElementById('appMainContainer');
  
  if (isAuthenticated && currentUser) {
    // Hide auth, show app
    if (authContainer) { authContainer.classList.remove('active'); authContainer.style.display = 'none'; }
    if (mainContainer) mainContainer.style.filter = 'none';
    
    // Set Manager profile in Sidebar
    const nameEl = document.getElementById('sidebarUserName');
    const roleEl = document.getElementById('sidebarUserRole');
    const avatarEl = document.getElementById('sidebarAvatar');
    if (nameEl) nameEl.textContent = currentUser.name || 'Hostel Manager';
    if (roleEl) roleEl.textContent = 'Hostel Manager';
    if (avatarEl) avatarEl.textContent = getInitials(currentUser.name || 'HM');
    
    // Show all modules — manager has full access
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
      item.style.display = 'flex';
    });
    const btnReset = document.getElementById('btnResetDb');
    const btnQuick = document.getElementById('quickActionBtn');
    if (btnReset) btnReset.style.display = 'flex';
    if (btnQuick) btnQuick.style.display = 'flex';
    
    // Render starting view
    renderView('dashboard');
  } else {
    if (authContainer) { authContainer.classList.add('active'); authContainer.style.display = ''; }
    if (mainContainer) mainContainer.style.filter = 'blur(15px)';
  }
}

function applyRolePermissions() {
  // Single manager — no restrictions, all modules visible
  document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
    item.style.display = 'flex';
  });
}

window.fillDemoAuth = function(email) {
  document.getElementById('loginEmail').value = email;
  // Set matching password based on account
  const passwords = {
    'manager@aegis.com': 'manager123',
    'admin@aegis.com': 'password123'
  };
  document.getElementById('loginPassword').value = passwords[email] || 'password123';
};

// ==========================================
// 2. SYSTEM UTILITIES (CSV Export, Database Reset, Notifications)
// ==========================================

function initExportCSV() {
  const btnExport = document.getElementById('btnExportCSV');
  if (!btnExport) return;
  btnExport.addEventListener('click', () => {
    const table = document.querySelector('#reportContentArea table');
    if (!table) {
      showToast('No active report available to export.', 'warning');
      return;
    }
    
    let csv = [];
    const rows = table.querySelectorAll('tr');
    for (let i = 0; i < rows.length; i++) {
      const row = [], cols = rows[i].querySelectorAll('td, th');
      for (let j = 0; j < cols.length; j++) {
        row.push('"' + cols[j].innerText.replace(/"/g, '""').trim() + '"');
      }
      csv.push(row.join(','));
    }
    const csvContent = 'data:text/csv;charset=utf-8,' + csv.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Aegis_Report_${activeReportTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report exported successfully to CSV spreadsheet!', 'success');
  });
}

function initDatabaseReset() {
  const btnReset = document.getElementById('btnResetDb');
  if (!btnReset) return;
  btnReset.addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset the database to default values? All your edits will be wiped.')) {
      try {
        const res = await api.post('/api/system/reset');
        if (res.success) {
          showToast('Database reset successfully!', 'success');
          renderView(currentActiveTab);
        }
      } catch (err) {
        showToast(err.message, 'danger');
      }
    }
  });
}

// Simulated Email Notification log toast
function triggerSimulatedEmail(toEmail, subject, bodySnippet) {
  const container = document.getElementById('toastContainer');
  const alertToast = document.createElement('div');
  alertToast.className = 'toast warning';
  alertToast.style.borderLeftColor = 'var(--secondary)';
  alertToast.style.maxWidth = '360px';
  
  const icon = '<svg width="22" height="22" fill="none" stroke="var(--secondary)" stroke-width="2" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>';
  
  alertToast.innerHTML = `
    ${icon}
    <div style="display:flex; flex-direction:column; gap:4px">
      <span style="font-weight:700; font-size:0.8rem; color:var(--text-primary)">EMAIL DISPATCHED</span>
      <span style="font-size:0.75rem; color:var(--text-muted)">To: <strong>${toEmail}</strong></span>
      <span style="font-size:0.75rem; color:var(--text-muted)">Sub: ${subject}</span>
    </div>
  `;
  container.appendChild(alertToast);
  
  setTimeout(() => {
    alertToast.style.animation = 'fadeOut 0.4s ease-out forwards';
    setTimeout(() => alertToast.remove(), 400);
  }, 4500);
}

function initQuickAction() {
  document.getElementById('quickActionBtn').addEventListener('click', () => {
    if (currentActiveTab === 'students') openStudentModal();
    else if (currentActiveTab === 'hostels') openHostelModal();
    else if (currentActiveTab === 'rooms') openRoomModal();
    else if (currentActiveTab === 'complaints') openComplaintModal();
    else if (currentActiveTab === 'visitors') openVisitorModal();
    else if (currentActiveTab === 'staff') openStaffModal();
    else if (currentActiveTab === 'noticeboard') openNoticeModal();
    else openStudentModal();
  });
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  let icon = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>';
  if (type === 'warning') {
    icon = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>';
  } else if (type === 'danger') {
    icon = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
  }
  toast.innerHTML = `${icon}<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.4s ease-out forwards';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  const form = document.querySelector(`#${modalId} form`);
  if (form) form.reset();
}
window.closeModal = closeModal;

// ==========================================
// 3. TAB ROUTING & DISPATCHER
// ==========================================
function initTabRouting() {
  const menuItems = document.querySelectorAll('.sidebar-menu .menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      const sidebar = document.getElementById('sidebar');
      if (sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
      }
      
      const tab = item.getAttribute('data-tab');
      currentActiveTab = tab;
      
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`tab-${tab}`).classList.add('active');
      document.getElementById('globalSearch').value = '';
      
      renderView(tab);
    });
  });
}

async function renderView(tabName) {
  try {
    switch (tabName) {
      case 'dashboard':
        await renderDashboard();
        break;
      case 'students':
        await renderStudents();
        break;
      case 'hostels':
        await renderHostels();
        break;
      case 'rooms':
        await renderRooms();
        break;
      case 'allocation':
        await renderAllocation();
        break;
      case 'fees':
        await renderFees();
        break;
      case 'complaints':
        await renderComplaints();
        break;
      case 'visitors':
        await renderVisitors();
        break;
      case 'staff':
        await renderStaff();
        break;
      case 'attendance':
        await renderAttendance();
        break;
      case 'noticeboard':
        await renderNoticeBoard();
        break;
      case 'reports':
        await renderReports();
        break;
    }
  } catch (err) {
    showToast(`Error rendering view: ${err.message}`, 'danger');
  }
}

// ==========================================
// 4. MODULES IMPLEMENTATION (CONNECT TO API)
// ==========================================

// --- MODULE 1: DASHBOARD ---
async function renderDashboard() {
  const [students, rooms, complaints, fees, visitors, activities] = await Promise.all([
    api.get('/api/students'),
    api.get('/api/rooms'),
    api.get('/api/complaints'),
    api.get('/api/fees'),
    api.get('/api/visitors'),
    api.get('/api/activities')
  ]);
  
  // Manager Dashboard — full view always
  document.querySelector('#stat-total-students').parentElement.querySelector('.stat-label').textContent = 'Total Students';
  document.querySelector('#stat-occupancy-rate').parentElement.querySelector('.stat-label').textContent = 'Occupancy Rate';
  document.querySelector('#stat-paid-fees-ratio').parentElement.querySelector('.stat-label').textContent = 'Fee Collection';
  document.querySelector('#stat-pending-complaints').parentElement.querySelector('.stat-label').textContent = 'Open Tickets';
  document.querySelector('#stat-active-visitors').parentElement.querySelector('.stat-label').textContent = 'Active Visitors';
  
  document.getElementById('stat-total-students').textContent = students.filter(s => s.status === 'Active').length;
  const totalBeds = rooms.reduce((sum, r) => sum + (r.status !== 'Maintenance' ? r.beds : 0), 0);
  const occupiedBeds = students.filter(s => s.roomId !== null && s.status === 'Active').length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
  document.getElementById('stat-occupancy-rate').textContent = `${occupancyRate}%`;
  document.getElementById('stat-pending-complaints').textContent = complaints.filter(c => c.status !== 'Resolved').length;
  
  const paidFeesCount = fees.filter(f => f.status === 'Paid').length;
  const paidRatio = fees.length > 0 ? Math.round((paidFeesCount / fees.length) * 100) : 0;
  document.getElementById('stat-paid-fees-ratio').textContent = `${paidRatio}%`;
  document.getElementById('stat-active-visitors').textContent = visitors.filter(v => v.checkOut === null).length;
  
  renderChartsData(students, rooms);

  
  // Activities logs list
  const activityListEl = document.getElementById('activityList');
  if (activityListEl) {
    activityListEl.innerHTML = '';
    if (activities.length === 0) {
      activityListEl.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem">No recent activity logs.</p>';
    } else {
      activities.forEach(act => {
        let markerColor = 'primary';
        if (act.action.toLowerCase().includes('delete') || act.action.toLowerCase().includes('remove') || act.action.toLowerCase().includes('suspended')) markerColor = 'danger';
        else if (act.action.toLowerCase().includes('add') || act.action.toLowerCase().includes('allocate') || act.action.toLowerCase().includes('resolved')) markerColor = 'success';
        else if (act.action.toLowerCase().includes('update') || act.action.toLowerCase().includes('payment')) markerColor = 'warning';
        
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
          <span class="activity-marker ${markerColor}"></span>
          <div class="activity-details">
            <span class="activity-desc"><strong>${act.module}</strong>: ${act.detail}</span>
            <span class="activity-time">${getRelativeTime(new Date(act.timestamp))}</span>
          </div>
        `;
        activityListEl.appendChild(item);
      });
    }
  }
}

async function renderChartsData(students, rooms) {
  const canvas = document.getElementById('occupancyChart');
  if (!canvas) return;
  if (occupancyChartInstance) occupancyChartInstance.destroy();
  
  const hostels = await api.get('/api/hostels');
  const labels = hostels.map(h => h.name);
  const capacities = hostels.map(h => {
    return rooms.filter(r => r.hostelId === h.id && r.status !== 'Maintenance').reduce((sum, r) => sum + r.beds, 0);
  });
  const occupancies = hostels.map(h => {
    return students.filter(s => s.hostelId === h.id && s.status === 'Active').length;
  });
  
  const ctx = canvas.getContext('2d');
  occupancyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total Bed Capacity',
          data: capacities,
          backgroundColor: 'rgba(6, 182, 212, 0.45)',
          borderColor: 'rgba(6, 182, 212, 1)',
          borderWidth: 1.5,
          borderRadius: 8
        },
        {
          label: 'Occupied Beds',
          data: occupancies,
          backgroundColor: 'rgba(139, 92, 246, 0.55)',
          borderColor: 'rgba(139, 92, 246, 1)',
          borderWidth: 1.5,
          borderRadius: 8
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#a29ebb', font: { family: 'Outfit', size: 12 } } }
      },
      scales: {
        x: { ticks: { color: '#a29ebb', font: { family: 'Outfit' } }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#a29ebb', font: { family: 'Outfit' }, stepSize: 5 }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

// --- MODULE 2: STUDENTS ---
async function renderStudents(searchQuery = '') {
  const [students, hostels, rooms] = await Promise.all([
    api.get('/api/students'),
    api.get('/api/hostels'),
    api.get('/api/rooms')
  ]);
  
  const hostelSelect = document.getElementById('filterStudentHostel');
  const statusSelect = document.getElementById('filterStudentStatus');
  const feeSelect = document.getElementById('filterStudentFees');
  
  const selectedHostel = hostelSelect.value;
  const selectedStatus = statusSelect.value;
  const selectedFee = feeSelect.value;
  
  // Update wings select options
  const prevVal = hostelSelect.value;
  hostelSelect.innerHTML = '<option value="all">All Hostels</option>';
  hostels.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h.id;
    opt.textContent = h.name;
    hostelSelect.appendChild(opt);
  });
  hostelSelect.value = prevVal || 'all';
  
  const filtered = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery) || 
                          s.email.toLowerCase().includes(searchQuery) ||
                          s.collegeId.toLowerCase().includes(searchQuery) ||
                          s.phone.includes(searchQuery);
    const matchesHostel = selectedHostel === 'all' || s.hostelId === selectedHostel;
    const matchesStatus = selectedStatus === 'all' || s.status === selectedStatus;
    const matchesFee = selectedFee === 'all' || s.feeStatus === selectedFee;
    return matchesSearch && matchesHostel && matchesStatus && matchesFee;
  });
  
  const tbody = document.querySelector('#studentsTable tbody');
  tbody.innerHTML = '';
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted)">No resident records matching filters.</td></tr>`;
    return;
  }
  
  filtered.forEach(s => {
    const hostel = hostels.find(h => h.id === s.hostelId);
    const room = rooms.find(r => r.id === s.roomId);
    
    const hostelRoomStr = hostel && room 
      ? `<span style="font-weight:600">${room.roomNumber}</span> <span style="font-size:0.75rem;color:var(--text-muted)">(${hostel.name}) - Bed ${s.bedNo}</span>` 
      : '<span class="badge badge-muted">Unallocated</span>';
      
    const feeBadgeClass = s.feeStatus === 'Paid' ? 'badge-success' : (s.feeStatus === 'Pending' ? 'badge-warning' : 'badge-danger');
    const statusBadgeClass = s.status === 'Active' ? 'badge-success' : (s.status === 'Suspended' ? 'badge-danger' : 'badge-muted');
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div style="display:flex; align-items:center; gap:10px">
          <div class="profile-avatar" style="width:32px; height:32px; font-size:0.8rem">${getInitials(s.name)}</div>
          <div>
            <div style="font-weight:600">${s.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted)">${s.email}</div>
          </div>
        </div>
      </td>
      <td><code>${s.collegeId}</code></td>
      <td>${s.phone}</td>
      <td>${hostelRoomStr}</td>
      <td><span class="badge ${feeBadgeClass}">${s.feeStatus}</span></td>
      <td><span class="badge ${statusBadgeClass}">${s.status}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-icon-only" onclick="viewStudentDetails('${s.id}')" title="View Details">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
          </button>
          <button class="btn btn-icon-only" onclick="editStudent('${s.id}')" title="Edit Profile">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
          </button>
          <button class="btn btn-icon-only btn-danger" onclick="deleteStudent('${s.id}')" title="Delete">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  if (!hostelSelect.dataset.listener) {
    hostelSelect.addEventListener('change', () => renderStudents());
    statusSelect.addEventListener('change', () => renderStudents());
    feeSelect.addEventListener('change', () => renderStudents());
    hostelSelect.dataset.listener = 'true';
  }
}

async function openStudentModal(studentId = null) {
  const form = document.getElementById('studentForm');
  form.reset();
  
  if (studentId) {
    document.getElementById('studentModalTitle').textContent = 'Edit Resident Profile';
    const students = await api.get('/api/students');
    const s = students.find(x => x.id === studentId);
    if (!s) return;
    
    document.getElementById('studentEditId').value = s.id;
    document.getElementById('studentName').value = s.name;
    document.getElementById('studentEmail').value = s.email;
    document.getElementById('studentPhone').value = s.phone;
    document.getElementById('studentCollegeId').value = s.collegeId;
    document.getElementById('studentGender').value = s.gender;
    document.getElementById('studentParent').value = s.parentName;
    document.getElementById('studentParentPhone').value = s.parentPhone;
    document.getElementById('studentStatus').value = s.status;
    document.getElementById('studentFeeStatus').value = s.feeStatus;
  } else {
    document.getElementById('studentModalTitle').textContent = 'Add New Student';
    document.getElementById('studentEditId').value = '';
  }
  openModal('modalStudent');
}
window.editStudent = openStudentModal;

async function viewStudentDetails(studentId) {
  const [students, hostels, rooms] = await Promise.all([
    api.get('/api/students'),
    api.get('/api/hostels'),
    api.get('/api/rooms')
  ]);
  
  const s = students.find(x => x.id === studentId);
  if (!s) return;
  
  const hostelName = hostels.find(h => h.id === s.hostelId)?.name || 'Not Allocated';
  const roomNo = rooms.find(r => r.id === s.roomId)?.roomNumber || 'Not Allocated';
  const bedNo = s.bedNo ? `Bed ${s.bedNo}` : 'Not Allocated';
  
  const container = document.getElementById('studentDetailViewContainer');
  container.innerHTML = `
    <div class="detail-item">
      <span class="detail-label">Full Name</span>
      <span class="detail-value" style="font-weight:600; color:var(--primary)">${s.name}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">College ID</span>
      <span class="detail-value"><code>${s.collegeId}</code></span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Email Address</span>
      <span class="detail-value">${s.email}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Phone Number</span>
      <span class="detail-value">${s.phone}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Gender</span>
      <span class="detail-value">${s.gender}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Status</span>
      <span class="detail-value">${s.status}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Hostel Wing</span>
      <span class="detail-value">${hostelName}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Room / Bed Allocation</span>
      <span class="detail-value">Room ${roomNo} - ${bedNo}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Parent / Guardian Name</span>
      <span class="detail-value">${s.parentName}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Parent Phone</span>
      <span class="detail-value">${s.parentPhone}</span>
    </div>
    <div class="detail-item">
      <span class="detail-label">Fee Billing Status</span>
      <span class="detail-value">${s.feeStatus}</span>
    </div>
  `;
  
  openModal('modalStudentView');
}
window.viewStudentDetails = viewStudentDetails;

async function deleteStudent(studentId) {
  if (confirm('Are you sure you want to delete this student profile? This will release their bed allocation.')) {
    try {
      await api.delete(`/api/students/${studentId}`);
      showToast('Student deleted successfully', 'success');
      
      // Dispatch simulated parent notifications
      triggerSimulatedEmail('parent@example.com', 'Accommodation Contract Terminated', 'Student profile archived from Aegis.');
      
      renderStudents();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}
window.deleteStudent = deleteStudent;

// --- MODULE 3: HOSTELS ---
async function renderHostels(searchQuery = '') {
  const [hostels, rooms, students] = await Promise.all([
    api.get('/api/hostels'),
    api.get('/api/rooms'),
    api.get('/api/students')
  ]);
  
  const tbody = document.querySelector('#hostelsTable tbody');
  tbody.innerHTML = '';
  const filtered = hostels.filter(h => h.name.toLowerCase().includes(searchQuery) || h.warden.toLowerCase().includes(searchQuery));
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted)">No hostel records found.</td></tr>`;
    return;
  }
  
  filtered.forEach(h => {
    const wingRooms = rooms.filter(r => r.hostelId === h.id);
    const capacity = wingRooms.filter(r => r.status !== 'Maintenance').reduce((sum, r) => sum + r.beds, 0);
    const occupied = students.filter(s => s.hostelId === h.id && s.status === 'Active').length;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${h.name}</strong></td>
      <td><span class="badge ${h.type === 'Boys' ? 'badge-info' : (h.type === 'Girls' ? 'badge-success' : 'badge-muted')}">${h.type}</span></td>
      <td>Floor 1 - Floor ${h.floors}</td>
      <td>
        <div style="font-weight:600">${occupied} / ${capacity} <span style="font-size:0.75rem; color:var(--text-muted)">Beds Occupied</span></div>
        <div style="background:rgba(255,255,255,0.05); width:100%; height:4px; border-radius:10px; overflow:hidden; margin-top:4px">
          <div style="background:var(--primary); width:${Math.min(100, Math.round((occupied/capacity)*100)) || 0}%; height:100%"></div>
        </div>
      </td>
      <td>${h.warden}</td>
      <td>${h.contact}</td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-icon-only" onclick="editHostel('${h.id}')" title="Edit Hostel">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
          </button>
          <button class="btn btn-icon-only btn-danger" onclick="deleteHostel('${h.id}')" title="Delete">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function openHostelModal(hostelId = null) {
  const form = document.getElementById('hostelForm');
  form.reset();
  
  if (hostelId) {
    document.getElementById('hostelModalTitle').textContent = 'Edit Hostel Wing';
    const hostels = await api.get('/api/hostels');
    const h = hostels.find(x => x.id === hostelId);
    if (!h) return;
    document.getElementById('hostelEditId').value = h.id;
    document.getElementById('hostelName').value = h.name;
    document.getElementById('hostelType').value = h.type;
    document.getElementById('hostelFloors').value = h.floors;
    document.getElementById('hostelWarden').value = h.warden;
    document.getElementById('hostelContact').value = h.contact;
  } else {
    document.getElementById('hostelModalTitle').textContent = 'Add Hostel Wing';
    document.getElementById('hostelEditId').value = '';
  }
  openModal('modalHostel');
}
window.editHostel = openHostelModal;

async function deleteHostel(hostelId) {
  if (confirm('Are you sure you want to delete this hostel wing? This will delete all rooms associated with it.')) {
    try {
      await api.delete(`/api/hostels/${hostelId}`);
      showToast('Hostel wing and room cascading released successfully', 'success');
      renderHostels();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}
window.deleteHostel = deleteHostel;

// --- MODULE 4: ROOMS ---
async function renderRooms() {
  const [hostels, rooms, students] = await Promise.all([
    api.get('/api/hostels'),
    api.get('/api/rooms'),
    api.get('/api/students')
  ]);
  
  if (hostels.length === 0) {
    document.getElementById('roomHostelTabs').innerHTML = '<p style="color:var(--text-muted)">Please create a hostel wing first.</p>';
    document.getElementById('roomsDisplayArea').innerHTML = '';
    return;
  }
  
  if (!activeRoomHostelFilterId || !hostels.find(h => h.id === activeRoomHostelFilterId)) {
    activeRoomHostelFilterId = hostels[0].id;
  }
  
  const tabsContainer = document.getElementById('roomHostelTabs');
  tabsContainer.innerHTML = '';
  hostels.forEach(h => {
    const btn = document.createElement('button');
    btn.className = `hostel-tab-btn ${activeRoomHostelFilterId === h.id ? 'active' : ''}`;
    btn.textContent = h.name;
    btn.addEventListener('click', () => {
      activeRoomHostelFilterId = h.id;
      renderRooms();
    });
    tabsContainer.appendChild(btn);
  });
  
  const hostelRooms = rooms.filter(r => r.hostelId === activeRoomHostelFilterId);
  const activeWing = hostels.find(h => h.id === activeRoomHostelFilterId);
  
  const displayArea = document.getElementById('roomsDisplayArea');
  displayArea.innerHTML = '';
  
  if (hostelRooms.length === 0) {
    displayArea.innerHTML = `<div class="glass-panel" style="text-align:center; padding:40px; color:var(--text-muted)">No rooms configured for this wing.</div>`;
    return;
  }
  
  const maxFloor = activeWing.floors;
  for (let f = 1; f <= maxFloor; f++) {
    const floorRooms = hostelRooms.filter(r => r.floor === f);
    
    const floorContainer = document.createElement('div');
    floorContainer.className = 'floor-container';
    
    const title = document.createElement('div');
    title.className = 'floor-title';
    title.textContent = `Floor ${f}`;
    floorContainer.appendChild(title);
    
    const grid = document.createElement('div');
    grid.className = 'rooms-grid';
    
    if (floorRooms.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.style.color = 'var(--text-muted)';
      emptyMsg.style.fontSize = '0.85rem';
      emptyMsg.style.paddingLeft = '14px';
      emptyMsg.textContent = 'No rooms listed on this floor.';
      floorContainer.appendChild(emptyMsg);
    } else {
      floorRooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'room-card';
        
        const occupants = students.filter(s => s.roomId === room.id && s.status === 'Active');
        let dotsHTML = '';
        for (let b = 1; b <= room.beds; b++) {
          const occStudent = occupants.find(s => s.bedNo === b);
          if (room.status === 'Maintenance') {
            dotsHTML += `<span class="bed-dot-indicator" style="background:var(--danger-glow); color:var(--danger); border-color:var(--danger);" title="Maintenance">🛠️</span>`;
          } else if (occStudent) {
            dotsHTML += `<span class="bed-dot-indicator occupied" title="Bed ${b}: ${occStudent.name}">${b}</span>`;
          } else {
            dotsHTML += `<span class="bed-dot-indicator vacant" title="Bed ${b}: Vacant">${b}</span>`;
          }
        }
        
        const roomOccupancyRate = room.beds > 0 ? (occupants.length / room.beds) : 0;
        let roomStatusBadge = '<span class="badge badge-success">Available</span>';
        if (room.status === 'Maintenance') {
          roomStatusBadge = '<span class="badge badge-danger">Maintenance</span>';
        } else if (roomOccupancyRate === 1) {
          roomStatusBadge = '<span class="badge badge-muted">Full</span>';
        }
        
        card.innerHTML = `
          <div class="room-card-header">
            <span class="room-card-number">Room ${room.roomNumber}</span>
            ${roomStatusBadge}
          </div>
          <div style="font-size:0.8rem; color:var(--text-muted)">Type: ${room.type} Sharing</div>
          <div class="beds-visual-layout">
            ${dotsHTML}
          </div>
          <div class="room-card-details">
            <span>Rent: ₹${room.rent}/mo</span>
            <span>${occupants.length}/${room.beds} Beds</span>
          </div>
        `;
        
        card.addEventListener('click', () => openRoomConfig(room.id));
        grid.appendChild(card);
      });
      floorContainer.appendChild(grid);
    }
    displayArea.appendChild(floorContainer);
  }
}

async function openRoomModal() {
  const hostels = await api.get('/api/hostels');
  const select = document.getElementById('roomHostelSelect');
  select.innerHTML = '';
  hostels.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h.id;
    opt.textContent = h.name;
    select.appendChild(opt);
  });
  openModal('modalRoom');
}

async function openRoomConfig(roomId) {
  const rooms = await api.get('/api/rooms');
  const room = rooms.find(r => r.id === roomId);
  if (!room) return;
  
  const students = await api.get('/api/students');
  const occupants = students.filter(s => s.roomId === roomId && s.status === 'Active');
  
  const action = confirm(`Configure Room ${room.roomNumber}:\n\n` +
    `Type: ${room.type} (Rent: ₹${room.rent})\n` +
    `Occupants:\n` + occupants.map(o => ` - Bed ${o.bedNo}: ${o.name}`).join('\n') + `\n\n` +
    `Press [OK] to toggle status (Available <-> Maintenance).\n` +
    `Press [Cancel] to exit.`);
    
  if (action) {
    const newStatus = room.status === 'Maintenance' ? 'Available' : 'Maintenance';
    try {
      await api.put(`/api/rooms/${roomId}`, { ...room, status: newStatus });
      showToast(`Room status updated to ${newStatus}`, 'success');
      renderRooms();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}

// --- MODULE 5: BED ALLOCATION ---
async function renderAllocation() {
  const [students, hostels, rooms] = await Promise.all([
    api.get('/api/students'),
    api.get('/api/hostels'),
    api.get('/api/rooms')
  ]);
  
  const studentSelect = document.getElementById('allocStudentSelect');
  const hostelSelect = document.getElementById('allocHostelSelect');
  const roomSelect = document.getElementById('allocRoomSelect');
  const bedSelect = document.getElementById('allocBedSelect');
  
  studentSelect.innerHTML = '<option value="">Choose student...</option>';
  students.filter(s => s.roomId === null && s.status === 'Active').forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.collegeId} - ${s.gender})`;
    studentSelect.appendChild(opt);
  });
  
  hostelSelect.innerHTML = '<option value="">Choose hostel wing...</option>';
  hostels.forEach(h => {
    const opt = document.createElement('option');
    opt.value = h.id;
    opt.textContent = h.name;
    hostelSelect.appendChild(opt);
  });
  
  roomSelect.innerHTML = '<option value="">First choose a hostel...</option>';
  roomSelect.disabled = true;
  bedSelect.innerHTML = '<option value="">First choose a room...</option>';
  bedSelect.disabled = true;
  
  if (!hostelSelect.dataset.allocListener) {
    hostelSelect.addEventListener('change', async (e) => {
      const hostelId = e.target.value;
      if (!hostelId) {
        roomSelect.disabled = true;
        roomSelect.innerHTML = '<option value="">First choose a hostel...</option>';
        return;
      }
      
      const allRooms = await api.get('/api/rooms');
      const allStudents = await api.get('/api/students');
      const availRooms = allRooms.filter(r => r.hostelId === hostelId && r.status === 'Available');
      
      roomSelect.innerHTML = '<option value="">Choose room...</option>';
      availRooms.forEach(room => {
        const occStudents = allStudents.filter(s => s.roomId === room.id && s.status === 'Active');
        if (occStudents.length < room.beds) {
          const opt = document.createElement('option');
          opt.value = room.id;
          opt.textContent = `Room ${room.roomNumber} (${room.type} - Rent ₹${room.rent}) - [${occStudents.length}/${room.beds} Beds]`;
          roomSelect.appendChild(opt);
        }
      });
      roomSelect.disabled = false;
      bedSelect.disabled = true;
    });
    
    roomSelect.addEventListener('change', async (e) => {
      const roomId = e.target.value;
      if (!roomId) {
        bedSelect.disabled = true;
        return;
      }
      const allRooms = await api.get('/api/rooms');
      const allStudents = await api.get('/api/students');
      const selectedRoom = allRooms.find(r => r.id === roomId);
      const allocatedBeds = allStudents.filter(s => s.roomId === roomId && s.status === 'Active').map(s => s.bedNo);
      
      bedSelect.innerHTML = '<option value="">Choose bed...</option>';
      for (let b = 1; b <= selectedRoom.beds; b++) {
        if (!allocatedBeds.includes(b)) {
          const opt = document.createElement('option');
          opt.value = b;
          opt.textContent = `Bed Slot ${b}`;
          bedSelect.appendChild(opt);
        }
      }
      bedSelect.disabled = false;
    });
    hostelSelect.dataset.allocListener = 'true';
  }
  
  // Right side list
  const tbody = document.querySelector('#allocationsTable tbody');
  tbody.innerHTML = '';
  
  const allocatedStudents = students.filter(s => s.roomId !== null && s.status === 'Active');
  if (allocatedStudents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">No active resident allocations.</td></tr>`;
    return;
  }
  
  allocatedStudents.forEach(s => {
    const hostel = hostels.find(h => h.id === s.hostelId);
    const room = rooms.find(r => r.id === s.roomId);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${s.name}</strong><br><code style="font-size:0.75rem">${s.collegeId}</code></td>
      <td>${hostel ? hostel.name : 'Unknown Wing'}</td>
      <td><span class="badge badge-info">Room ${room ? room.roomNumber : ''} - Bed ${s.bedNo}</span></td>
      <td>₹${room ? room.rent : 0}</td>
      <td>
        <button class="btn btn-sm btn-danger" onclick="releaseBedAllocation('${s.id}')">Release Bed</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function releaseBedAllocation(studentId) {
  if (confirm('Are you sure you want to release this bed allocation?')) {
    try {
      await api.delete(`/api/allocations/${studentId}`);
      showToast('Bed allocation released', 'success');
      
      // Dispatch simulated parent notifications
      triggerSimulatedEmail('parent@example.com', 'Hostel Room Contract Released', 'Room allocation released from Aegis Hostels.');
      
      renderAllocation();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}
window.releaseBedAllocation = releaseBedAllocation;

// --- MODULE 6: FEES MANAGEMENT ---
async function renderFees(searchQuery = '') {
  const [fees, students] = await Promise.all([
    api.get('/api/fees'),
    api.get('/api/students')
  ]);
  
  const statusFilterVal = document.getElementById('filterFeeStatus').value;
  const tbody = document.querySelector('#feesTable tbody');
  tbody.innerHTML = '';
  
  // Student role: can only view and pay their own invoices
  let filtered = fees;
  if (currentUser.role === 'STUDENT') {
    const myProfile = students.find(s => s.email === currentUser.email);
    filtered = fees.filter(f => f.studentId === myProfile?.id);
    // Hide generate bills button for students
    document.getElementById('btnGenerateBills').style.display = 'none';
  } else {
    document.getElementById('btnGenerateBills').style.display = 'flex';
  }
  
  filtered = filtered.filter(f => {
    const student = students.find(s => s.id === f.studentId);
    const matchesSearch = student ? student.name.toLowerCase().includes(searchQuery) : false;
    const matchesStatus = statusFilterVal === 'all' || f.status === statusFilterVal;
    return (currentUser.role === 'STUDENT' || matchesSearch) && matchesStatus;
  });
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted)">No transaction invoices found.</td></tr>`;
    return;
  }
  
  filtered.forEach(invoice => {
    const student = students.find(s => s.id === invoice.studentId);
    const badgeClass = invoice.status === 'Paid' ? 'badge-success' : (invoice.status === 'Pending' ? 'badge-warning' : 'badge-danger');
    
    let actionsHTML = `<button class="btn btn-sm" onclick="viewInvoice('${invoice.id}')">View Invoice</button>`;
    if (invoice.status !== 'Paid') {
      if (currentUser.role === 'STUDENT') {
        actionsHTML += ` <button class="btn btn-sm btn-accent" onclick="payStudentBill('${invoice.id}')">Pay Now</button>`;
      } else {
        actionsHTML += ` <button class="btn btn-sm btn-accent" onclick="collectFee('${invoice.id}')">Mark Paid</button>`;
      }
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><code>${invoice.id}</code></td>
      <td><strong>${student ? student.name : 'Unknown Student'}</strong></td>
      <td>${invoice.term}</td>
      <td>₹${invoice.amount}</td>
      <td>${invoice.dueDate}</td>
      <td><span class="badge ${badgeClass}">${invoice.status}</span></td>
      <td>${actionsHTML}</td>
    `;
    tbody.appendChild(row);
  });
  
  const filterSelect = document.getElementById('filterFeeStatus');
  if (!filterSelect.dataset.listener) {
    filterSelect.addEventListener('change', () => renderFees());
    filterSelect.dataset.listener = 'true';
  }
}

async function collectFee(invoiceId) {
  try {
    await api.post(`/api/fees/collect/${invoiceId}`);
    showToast('Invoice marked paid successfully!', 'success');
    renderFees();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}
window.collectFee = collectFee;

async function payStudentBill(invoiceId) {
  // Simulate payment checkout portal
  const activeInvoice = (await api.get('/api/fees')).find(f => f.id === invoiceId);
  if (!activeInvoice) return;
  
  const action = confirm(`Aegis Mock Payment Gateway:\n\n` +
    `Invoice: ${activeInvoice.id}\n` +
    `Particulars: ${activeInvoice.term}\n` +
    `Amount: ₹${activeInvoice.amount}\n\n` +
    `Click [OK] to simulate a successful Card/UPI transaction.`);
    
  if (action) {
    try {
      await api.post(`/api/fees/collect/${invoiceId}`);
      showToast('Payment successful! Invoice cleared.', 'success');
      
      // Dispatch simulated parent notifications
      triggerSimulatedEmail(currentUser.email, 'Invoice Payment Receipt - Aegis', `Thank you for the payment of ₹${activeInvoice.amount} for ${activeInvoice.term}. Receipt generated.`);
      
      renderFees();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}
window.payStudentBill = payStudentBill;

async function viewInvoice(invoiceId) {
  const fees = await api.get('/api/fees');
  const invoice = fees.find(f => f.id === invoiceId);
  const students = await api.get('/api/students');
  const hostels = await api.get('/api/hostels');
  const rooms = await api.get('/api/rooms');
  
  if (!invoice) return;
  const s = students.find(x => x.id === invoice.studentId);
  const h = s ? hostels.find(x => x.id === s.hostelId) : null;
  const r = s ? rooms.find(x => x.id === s.roomId) : null;
  
  const container = document.getElementById('invoicePrintArea');
  const stampHTML = invoice.status === 'Paid' 
    ? `<div class="invoice-total-row"><div class="invoice-stamp">Paid</div></div>` 
    : `<div class="invoice-total-row"><div class="invoice-stamp" style="border-color:var(--danger); color:var(--danger)">Unpaid</div></div>`;
  
  container.innerHTML = `
    <div class="invoice-print-container">
      <div class="invoice-header">
        <div>
          <div class="invoice-title">AEGIS HOSTELS</div>
          <div style="font-size:0.85rem; color:var(--text-muted); margin-top:4px">Campus Gate 2, Residency Block</div>
        </div>
        <div style="text-align: right">
          <div style="font-size:1.2rem; font-weight:700">INVOICE</div>
          <div style="font-size:0.9rem; margin-top:4px">Invoice ID: <code>${invoice.id}</code></div>
          <div style="font-size:0.85rem; color:var(--text-muted)">Issued: ${invoice.dueDate}</div>
        </div>
      </div>
      
      <div class="invoice-details-grid">
        <div>
          <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px">Billed Resident</div>
          <div style="font-weight:700; font-size:1.1rem">${s ? s.name : 'Unknown Resident'}</div>
          <div style="font-size:0.9rem; margin-top:4px">ID: <code>${s ? s.collegeId : ''}</code></div>
          <div style="font-size:0.9rem">Email: ${s ? s.email : ''}</div>
          <div style="font-size:0.9rem">Phone: ${s ? s.phone : ''}</div>
        </div>
        
        <div style="text-align: right">
          <div style="font-size:0.85rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px">Accommodation Info</div>
          <div style="font-weight:600">${h ? h.name : 'Not Allocated'}</div>
          <div style="font-size:0.9rem; margin-top:4px">Room: ${r ? r.roomNumber : ''} | Bed: ${s ? s.bedNo : ''}</div>
          <div style="font-size:0.9rem">Type: ${r ? r.type : ''} Sharing</div>
        </div>
      </div>
      
      <table class="invoice-summary-table">
        <thead>
          <tr>
            <th>Billing Item & Particulars</th>
            <th style="text-align: right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div style="font-weight:600">${invoice.term}</div>
              <div style="font-size:0.8rem; color:var(--text-muted)">Monthly maintenance fee including water, high-speed campus internet, and security.</div>
            </td>
            <td style="text-align: right; font-weight:600; font-size:1.1rem">₹${invoice.amount}.00</td>
          </tr>
        </tbody>
      </table>
      
      <div class="invoice-total-row" style="margin-top:20px; font-size:1.4rem">
        <span>Total Due: ₹${invoice.amount}.00</span>
      </div>
      
      ${stampHTML}
    </div>
  `;
  openModal('modalInvoice');
  document.getElementById('btnPrintInvoice').onclick = () => window.print();
}
window.viewInvoice = viewInvoice;

// Auto generating billing
const _btnGenBills = document.getElementById('btnGenerateBills');
if (_btnGenBills) _btnGenBills.addEventListener('click', async () => {
  try {
    const res = await api.post('/api/fees/generate');
    if (res.count > 0) {
      showToast(`Successfully generated ${res.count} monthly billing invoices!`, 'success');
      
      // Dispatch simulated parent notifications
      triggerSimulatedEmail('student-body@aegis.com', 'New Monthly Invoices Published', 'Billing published. Please clear outstanding amounts.');
      
      renderFees();
    } else {
      showToast('Invoices for this month have already been generated.', 'warning');
    }
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// --- MODULE 7: COMPLAINTS ---
async function renderComplaints() {
  const complaints = await api.get('/api/complaints');
  const students = await api.get('/api/students');
  
  const listPending = document.getElementById('list-pending');
  const listProgress = document.getElementById('list-progress');
  const listResolved = document.getElementById('list-resolved');
  
  listPending.innerHTML = '';
  listProgress.innerHTML = '';
  listResolved.innerHTML = '';
  
  let pendingCount = 0;
  let progressCount = 0;
  let resolvedCount = 0;
  
  // Student role: can only view their own filed complaint tickets
  let filtered = complaints;
  if (currentUser.role === 'STUDENT') {
    const myProfile = students.find(s => s.email === currentUser.email);
    filtered = complaints.filter(c => c.studentId === myProfile?.id);
  }
  
  filtered.forEach(c => {
    const ticket = document.createElement('div');
    ticket.className = 'complaint-ticket';
    ticket.innerHTML = `
      <div class="complaint-ticket-header">
        <span class="complaint-ticket-title">${c.title}</span>
        <span class="complaint-ticket-category category-${c.category.toLowerCase()}">${c.category}</span>
      </div>
      <p class="complaint-ticket-desc">${c.description}</p>
      <div class="complaint-ticket-footer">
        <span class="complaint-ticket-student">By: ${c.studentName}</span>
        <span>${c.date}</span>
      </div>
    `;
    
    ticket.addEventListener('click', () => openTicketDetails(c.id));
    
    if (c.status === 'Pending') {
      listPending.appendChild(ticket);
      pendingCount++;
    } else if (c.status === 'In Progress') {
      listProgress.appendChild(ticket);
      progressCount++;
    } else {
      listResolved.appendChild(ticket);
      resolvedCount++;
    }
  });
  
  document.getElementById('count-pending').textContent = pendingCount;
  document.getElementById('count-progress').textContent = progressCount;
  document.getElementById('count-resolved').textContent = resolvedCount;
}

async function openTicketDetails(ticketId) {
  const complaints = await api.get('/api/complaints');
  const c = complaints.find(x => x.id === ticketId);
  if (!c) return;
  
  document.getElementById('viewCompId').textContent = c.id;
  document.getElementById('viewCompDate').textContent = c.date;
  document.getElementById('viewCompStudent').textContent = c.studentName;
  
  const badge = document.getElementById('viewCompCategoryBadge');
  badge.textContent = c.category;
  badge.className = `badge category-${c.category.toLowerCase()}`;
  
  document.getElementById('viewCompTitle').textContent = c.title;
  document.getElementById('viewCompDesc').textContent = c.description;
  document.getElementById('viewCompEditId').value = c.id;
  
  // Student mode restricts ticket status edits
  const statusForm = document.getElementById('compStatusUpdateForm');
  if (currentUser.role === 'STUDENT') {
    statusForm.style.display = 'none';
  } else {
    statusForm.style.display = 'block';
    document.getElementById('viewCompStatusSelect').value = c.status;
    document.getElementById('viewCompResolution').value = c.resolution || '';
  }
  
  openModal('modalComplaintView');
}

// --- MODULE 8: VISITORS ---
async function renderVisitors(searchQuery = '') {
  const visitors = await api.get('/api/visitors');
  const tbody = document.querySelector('#visitorsTable tbody');
  tbody.innerHTML = '';
  
  const filtered = visitors.filter(v => 
    v.name.toLowerCase().includes(searchQuery) || 
    v.studentName.toLowerCase().includes(searchQuery)
  );
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted)">No visitor registry entries found.</td></tr>`;
    return;
  }
  
  filtered.forEach(v => {
    const formattedCheckIn = formatDateTime(v.checkIn);
    const formattedCheckOut = v.checkOut ? formatDateTime(v.checkOut) : '<span class="badge badge-warning">Checked In</span>';
    
    let actionHTML = '-';
    if (!v.checkOut) {
      actionHTML = `<button class="btn btn-sm btn-accent" onclick="checkoutVisitor('${v.id}')">Check Out</button>`;
    }
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${v.name}</strong></td>
      <td>${v.phone}</td>
      <td><span class="badge badge-muted">${v.relation}</span></td>
      <td>${v.studentName}</td>
      <td>${formattedCheckIn}</td>
      <td>${formattedCheckOut}</td>
      <td style="font-size:0.85rem">${v.purpose}</td>
      <td>${actionHTML}</td>
    `;
    tbody.appendChild(row);
  });
}

async function checkoutVisitor(visitorId) {
  try {
    await api.post(`/api/visitors/checkout/${visitorId}`);
    showToast('Visitor check-out logged successfully', 'success');
    renderVisitors();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}
window.checkoutVisitor = checkoutVisitor;

function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

// --- MODULE 9: STAFF ---
async function renderStaff(searchQuery = '') {
  const staff = await api.get('/api/staff');
  const tbody = document.querySelector('#staffTable tbody');
  tbody.innerHTML = '';
  
  const filtered = staff.filter(s => s.name.toLowerCase().includes(searchQuery) || s.role.toLowerCase().includes(searchQuery));
  
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted)">No staff logs found.</td></tr>`;
    return;
  }
  
  filtered.forEach(s => {
    const statusBadgeClass = s.status === 'Active' ? 'badge-success' : (s.status === 'On Leave' ? 'badge-warning' : 'badge-danger');
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <div style="display:flex; align-items:center; gap:10px">
          <div class="profile-avatar" style="width:32px; height:32px; font-size:0.8rem; background:linear-gradient(135deg, var(--primary), var(--secondary))">${getInitials(s.name)}</div>
          <div>
            <div style="font-weight:600">${s.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted)">Staff ID: ${s.id}</div>
          </div>
        </div>
      </td>
      <td><strong>${s.role}</strong></td>
      <td>${s.phone}</td>
      <td>${s.shift} Shift</td>
      <td>₹${s.salary}</td>
      <td><span class="badge ${statusBadgeClass}">${s.status}</span></td>
      <td>
        <div class="action-buttons">
          <button class="btn btn-icon-only" onclick="editStaff('${s.id}')" title="Edit Profile">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
          </button>
          <button class="btn btn-icon-only btn-danger" onclick="deleteStaff('${s.id}')" title="Delete">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function openStaffModal(staffId = null) {
  const form = document.getElementById('staffForm');
  form.reset();
  
  if (staffId) {
    document.getElementById('staffModalTitle').textContent = 'Edit Staff Profile';
    const staff = await api.get('/api/staff');
    const s = staff.find(x => x.id === staffId);
    if (!s) return;
    document.getElementById('staffEditId').value = s.id;
    document.getElementById('staffName').value = s.name;
    document.getElementById('staffRole').value = s.role;
    document.getElementById('staffPhone').value = s.phone;
    document.getElementById('staffShift').value = s.shift;
    document.getElementById('staffSalary').value = s.salary;
    document.getElementById('staffStatus').value = s.status;
  } else {
    document.getElementById('staffModalTitle').textContent = 'Add Staff Profile';
    document.getElementById('staffEditId').value = '';
  }
  openModal('modalStaff');
}
window.editStaff = openStaffModal;

async function deleteStaff(staffId) {
  if (confirm('Are you sure you want to delete this staff profile?')) {
    try {
      await api.delete(`/api/staff/${staffId}`);
      showToast('Staff profile deleted successfully', 'success');
      renderStaff();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}
window.deleteStaff = deleteStaff;

// --- MODULE 10: ATTENDANCE ---
async function renderAttendance() {
  const dateInput = document.getElementById('attendanceDatePicker');
  const dateStr = dateInput.value;
  
  const [students, rooms, dayRecord] = await Promise.all([
    api.get('/api/students'),
    api.get('/api/rooms'),
    api.get(`/api/attendance/${dateStr}`)
  ]);
  
  const activeStudents = students.filter(s => s.roomId !== null && s.status === 'Active');
  const tbody = document.querySelector('#attendanceTable tbody');
  tbody.innerHTML = '';
  
  if (activeStudents.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">Please allocate rooms to residents to take attendance.</td></tr>`;
    return;
  }
  
  activeStudents.forEach(s => {
    const room = rooms.find(r => r.id === s.roomId);
    const roomStr = room ? room.roomNumber : '';
    const status = dayRecord.records[s.id] || 'Present';
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><strong>${s.name}</strong></td>
      <td><code>${s.collegeId}</code></td>
      <td>Room ${roomStr}</td>
      <td>
        <div style="display:flex; gap:16px">
          <label style="display:inline-flex; align-items:center; gap:6px; cursor:pointer">
            <input type="radio" name="attendance-${s.id}" value="Present" ${status === 'Present' ? 'checked' : ''}>
            Present
          </label>
          <label style="display:inline-flex; align-items:center; gap:6px; cursor:pointer">
            <input type="radio" name="attendance-${s.id}" value="Absent" ${status === 'Absent' ? 'checked' : ''}>
            Absent
          </label>
          <label style="display:inline-flex; align-items:center; gap:6px; cursor:pointer">
            <input type="radio" name="attendance-${s.id}" value="Late" ${status === 'Late' ? 'checked' : ''}>
            Late
          </label>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });
  
  if (!dateInput.dataset.listener) {
    dateInput.addEventListener('change', () => renderAttendance());
    dateInput.dataset.listener = 'true';
  }
}

const _btnSaveAtt = document.getElementById('btnSaveAttendance');
if (_btnSaveAtt) _btnSaveAtt.addEventListener('click', async () => {
  const dateStr = document.getElementById('attendanceDatePicker').value;
  if (!dateStr) {
    showToast('Please select a valid date.', 'danger');
    return;
  }
  
  const students = await api.get('/api/students');
  const activeStudents = students.filter(s => s.roomId !== null && s.status === 'Active');
  const records = {};
  
  let absentCount = 0;
  activeStudents.forEach(s => {
    const radio = document.querySelector(`input[name="attendance-${s.id}"]:checked`);
    if (radio) {
      records[s.id] = radio.value;
      if (radio.value === 'Absent') {
        absentCount++;
        // Dispatch warning email simulation alert to Parent
        triggerSimulatedEmail(s.email, `ABSENCE NOTICE - Date: ${dateStr}`, `Resident ${s.name} marked absent. Contact warden office.`);
      }
    }
  });
  
  try {
    await api.post('/api/attendance', { date: dateStr, records });
    showToast(`Attendance registry for ${dateStr} saved successfully!`, 'success');
    renderAttendance();
  } catch (err) {
    showToast(err.message, 'danger');
  }
});

// --- MODULE 11: NOTICE BOARD ---
async function renderNoticeBoard(searchQuery = '') {
  const notices = await api.get('/api/notices');
  const area = document.getElementById('noticesDisplayArea');
  area.innerHTML = '';
  
  const filtered = notices.filter(n => n.title.toLowerCase().includes(searchQuery) || n.content.toLowerCase().includes(searchQuery));
  
  if (filtered.length === 0) {
    area.innerHTML = `<div class="glass-panel" style="width:100%; text-align:center; padding:40px; color:var(--text-muted)">No announcements matches query.</div>`;
    return;
  }
  
  // Hide write notice button for students
  const btnPostNotice = document.getElementById('btnNewNotice');
  if (currentUser.role === 'STUDENT') {
    btnPostNotice.style.display = 'none';
  } else {
    btnPostNotice.style.display = 'flex';
  }
  
  filtered.forEach(n => {
    const card = document.createElement('div');
    card.className = `notice-card ${n.category.toLowerCase()}`;
    
    // Hide delete button for students
    const deleteBtn = currentUser.role !== 'STUDENT' 
      ? `<button class="btn btn-sm btn-icon-only btn-danger" onclick="deleteNotice('${n.id}')" title="Delete Notice">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
         </button>`
      : '';
      
    card.innerHTML = `
      <div class="notice-card-header">
        <span class="notice-card-badge">${n.category}</span>
        <span class="notice-card-date">${n.date}</span>
      </div>
      <div class="notice-card-title">${n.title}</div>
      <div class="notice-card-content">${n.content}</div>
      <div class="notice-card-footer">
        <span class="notice-card-by">By: ${n.postedBy}</span>
        ${deleteBtn}
      </div>
    `;
    area.appendChild(card);
  });
}

async function deleteNotice(noticeId) {
  if (confirm('Are you sure you want to delete this notice/announcement?')) {
    try {
      await api.delete(`/api/notices/${noticeId}`);
      showToast('Notice announcement removed', 'success');
      renderNoticeBoard();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  }
}
window.deleteNotice = deleteNotice;

// --- MODULE 12: REPORTS ---
async function renderReports() {
  const container = document.getElementById('reportContentArea');
  container.innerHTML = '';
  
  const reportBtns = document.querySelectorAll('.report-menu-btn');
  reportBtns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-report') === activeReportTab) {
      btn.classList.add('active');
    }
  });
  
  if (!reportBtns[0].dataset.listener) {
    reportBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        activeReportTab = btn.getAttribute('data-report');
        renderReports();
      });
    });
    reportBtns[0].dataset.listener = 'true';
  }
  
  if (activeReportTab === 'occupancy') {
    const [hostels, rooms, students] = await Promise.all([
      api.get('/api/hostels'),
      api.get('/api/rooms'),
      api.get('/api/students')
    ]);
    
    let rowsHTML = '';
    hostels.forEach(h => {
      const wingRooms = rooms.filter(r => r.hostelId === h.id);
      const maintenanceRooms = wingRooms.filter(r => r.status === 'Maintenance').length;
      const capacity = wingRooms.filter(r => r.status !== 'Maintenance').reduce((sum, r) => sum + r.beds, 0);
      const occupied = students.filter(s => s.hostelId === h.id && s.status === 'Active').length;
      const vacant = Math.max(0, capacity - occupied);
      const rate = capacity > 0 ? Math.round((occupied/capacity)*100) : 0;
      
      rowsHTML += `
        <tr>
          <td><strong>${h.name}</strong></td>
          <td>${wingRooms.length}</td>
          <td>${maintenanceRooms}</td>
          <td>${capacity}</td>
          <td><span style="color:var(--primary); font-weight:600">${occupied}</span></td>
          <td><span style="color:var(--success); font-weight:600">${vacant}</span></td>
          <td><strong>${rate}%</strong></td>
        </tr>
      `;
    });
    
    container.innerHTML = `
      <div class="print-section">
        <h2 class="section-title" style="margin-bottom: 20px;">Accommodation Occupancy Audit Report</h2>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Hostel Wing</th>
                <th>Total Rooms</th>
                <th>Under Maintenance</th>
                <th>Total Capacity</th>
                <th>Occupied Beds</th>
                <th>Vacant Beds</th>
                <th>Occupancy Rate</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
  } else if (activeReportTab === 'fees') {
    const fees = await api.get('/api/fees');
    const paidTotal = fees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
    const pendingTotal = fees.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0);
    const overdueTotal = fees.filter(f => f.status === 'Overdue').reduce((sum, f) => sum + f.amount, 0);
    const totalBilling = paidTotal + pendingTotal + overdueTotal;
    
    container.innerHTML = `
      <div class="print-section">
        <h2 class="section-title" style="margin-bottom: 20px;">Financial Ledger Billings Report</h2>
        <div class="stats-grid" style="margin-bottom:24px">
          <div class="stat-card" style="padding:16px">
            <div class="stat-info">
              <span class="stat-value" style="color:var(--success)">₹${paidTotal}</span>
              <span class="stat-label">Paid Collections</span>
            </div>
          </div>
          <div class="stat-card" style="padding:16px">
            <div class="stat-info">
              <span class="stat-value" style="color:var(--warning)">₹${pendingTotal}</span>
              <span class="stat-label">Pending Invoices</span>
            </div>
          </div>
          <div class="stat-card" style="padding:16px">
            <div class="stat-info">
              <span class="stat-value" style="color:var(--danger)">₹${overdueTotal}</span>
              <span class="stat-label">Overdue Outstanding</span>
            </div>
          </div>
          <div class="stat-card" style="padding:16px">
            <div class="stat-info">
              <span class="stat-value">₹${totalBilling}</span>
              <span class="stat-label">Total Billing Amount</span>
            </div>
          </div>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Billing Classification</th>
                <th>Count</th>
                <th>Revenue Percentage</th>
                <th>Total Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span class="badge badge-success">Paid Transactions</span></td>
                <td>${fees.filter(f => f.status === 'Paid').length}</td>
                <td>${totalBilling > 0 ? Math.round((paidTotal/totalBilling)*100) : 0}%</td>
                <td>₹${paidTotal}</td>
              </tr>
              <tr>
                <td><span class="badge badge-warning">Pending Invoices</span></td>
                <td>${fees.filter(f => f.status === 'Pending').length}</td>
                <td>${totalBilling > 0 ? Math.round((pendingTotal/totalBilling)*100) : 0}%</td>
                <td>₹${pendingTotal}</td>
              </tr>
              <tr>
                <td><span class="badge badge-danger">Overdue Billing</span></td>
                <td>${fees.filter(f => f.status === 'Overdue').length}</td>
                <td>${totalBilling > 0 ? Math.round((overdueTotal/totalBilling)*100) : 0}%</td>
                <td>₹${overdueTotal}</td>
              </tr>
              <tr style="border-top: 2px solid var(--border-glass)">
                <td><strong>Aggregate Billings</strong></td>
                <td><strong>${fees.length}</strong></td>
                <td><strong>100%</strong></td>
                <td><strong>₹${totalBilling}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
    
  } else if (activeReportTab === 'complaints') {
    const complaints = await api.get('/api/complaints');
    let rowsHTML = '';
    complaints.forEach(c => {
      const badgeClass = c.status === 'Resolved' ? 'badge-success' : (c.status === 'In Progress' ? 'badge-warning' : 'badge-danger');
      rowsHTML += `
        <tr>
          <td><code>${c.id}</code></td>
          <td><strong>${c.studentName}</strong></td>
          <td>${c.title}</td>
          <td><span class="badge category-${c.category.toLowerCase()}">${c.category}</span></td>
          <td>${c.date}</td>
          <td><span class="badge ${badgeClass}">${c.status}</span></td>
        </tr>
      `;
    });
    
    container.innerHTML = `
      <div class="print-section">
        <h2 class="section-title" style="margin-bottom: 20px;">Resident Complaint Maintenance Tickets Log</h2>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Student Name</th>
                <th>Issue Summary</th>
                <th>Category</th>
                <th>File Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML || '<tr><td colspan="6" style="text-align:center; color:var(--text-muted)">No complaints tickets logged.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
  } else if (activeReportTab === 'visitors') {
    const visitors = await api.get('/api/visitors');
    let rowsHTML = '';
    visitors.forEach(v => {
      rowsHTML += `
        <tr>
          <td><strong>${v.name}</strong></td>
          <td>${v.relation}</td>
          <td>${v.studentName}</td>
          <td>${formatDateTime(v.checkIn)}</td>
          <td>${v.checkOut ? formatDateTime(v.checkOut) : '<span class="badge badge-warning">Checked In</span>'}</td>
          <td>${v.purpose}</td>
        </tr>
      `;
    });
    
    container.innerHTML = `
      <div class="print-section">
        <h2 class="section-title" style="margin-bottom: 20px;">Hostel Wings Guest Check-in Registry Logs</h2>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Guest Name</th>
                <th>Relation</th>
                <th>Host Resident</th>
                <th>Check In Date-Time</th>
                <th>Check Out Date-Time</th>
                <th>Purpose of Visit</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML || '<tr><td colspan="6" style="text-align:center; color:var(--text-muted)">No guests entries logged.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

// ==========================================
// 5. DATA MUTATIONS FORM ACTIONS
// ==========================================
function setupFormHandlers() {
  
  // Student profile
  document.getElementById('studentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('studentEditId').value;
    const data = {
      name: document.getElementById('studentName').value,
      email: document.getElementById('studentEmail').value,
      phone: document.getElementById('studentPhone').value,
      collegeId: document.getElementById('studentCollegeId').value,
      gender: document.getElementById('studentGender').value,
      parentName: document.getElementById('studentParent').value,
      parentPhone: document.getElementById('studentParentPhone').value,
      status: document.getElementById('studentStatus').value,
      feeStatus: document.getElementById('studentFeeStatus').value
    };
    
    try {
      if (id) {
        await api.put(`/api/students/${id}`, data);
        showToast('Resident profile updated', 'success');
      } else {
        await api.post('/api/students', data);
        showToast('Resident profile created', 'success');
      }
      closeModal('modalStudent');
      renderStudents();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });
  
  // Hostel Wing
  document.getElementById('hostelForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('hostelEditId').value;
    const data = {
      name: document.getElementById('hostelName').value,
      type: document.getElementById('hostelType').value,
      floors: parseInt(document.getElementById('hostelFloors').value),
      warden: document.getElementById('hostelWarden').value,
      contact: document.getElementById('hostelContact').value,
      capacity: parseInt(document.getElementById('hostelFloors').value) * 20
    };
    
    try {
      if (id) {
        await api.put(`/api/hostels/${id}`, data);
        showToast('Hostel wing settings updated', 'success');
      } else {
        await api.post('/api/hostels', data);
        showToast('Hostel wing added successfully', 'success');
      }
      closeModal('modalHostel');
      renderHostels();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });
  
  // Room
  document.getElementById('roomForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const hostelId = document.getElementById('roomHostelSelect').value;
    const roomNumber = document.getElementById('roomNumber').value;
    const type = document.getElementById('roomType').value;
    
    let bedsCount = 1;
    if (type === 'Double') bedsCount = 2;
    if (type === 'Triple') bedsCount = 3;
    
    const data = {
      hostelId,
      roomNumber,
      floor: parseInt(document.getElementById('roomFloor').value),
      type,
      rent: parseInt(document.getElementById('roomRent').value),
      status: document.getElementById('roomStatus').value,
      beds: bedsCount
    };
    
    try {
      await api.post('/api/rooms', data);
      showToast(`Room ${roomNumber} created successfully`, 'success');
      closeModal('modalRoom');
      renderRooms();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });
  
  // Complaint Submit
  document.getElementById('complaintForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      studentId: document.getElementById('compStudentSelect').value,
      title: document.getElementById('compTitle').value,
      category: document.getElementById('compCategory').value,
      description: document.getElementById('compDescription').value
    };
    
    try {
      await api.post('/api/complaints', data);
      showToast('Maintenance ticket filed successfully!', 'success');
      
      // Dispatch simulated warden alert emails
      triggerSimulatedEmail('warden@aegis.com', 'New Complaint Ticket Filed', `New ticket regarding ${data.category} submitted.`);
      
      closeModal('modalComplaint');
      renderComplaints();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });
  
  // Complaint Update (Admin/Warden)
  document.getElementById('compStatusUpdateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('viewCompEditId').value;
    const status = document.getElementById('viewCompStatusSelect').value;
    const resolution = document.getElementById('viewCompResolution').value;
    
    try {
      const ticket = await api.put(`/api/complaints/${id}`, { status, resolution });
      showToast('Ticket status updated', 'success');
      
      // Dispatch simulated resident updates emails
      const student = (await api.get('/api/students')).find(s => s.name === document.getElementById('viewCompStudent').textContent);
      if (student) {
        triggerSimulatedEmail(student.email, `Complaint Status Update: ${status}`, `Ticket regarding ${ticket.title} updated. Notes: ${resolution}`);
      }
      
      closeModal('modalComplaintView');
      renderComplaints();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });
  
  // Guest Visitor check-in
  document.getElementById('visitorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('visitorName').value,
      phone: document.getElementById('visitorPhone').value,
      relation: document.getElementById('visitorRelation').value,
      studentId: document.getElementById('visitorStudentSelect').value,
      purpose: document.getElementById('visitorPurpose').value
    };
    
    try {
      await api.post('/api/visitors', data);
      showToast(`Visitor entry logged successfully`, 'success');
      closeModal('modalVisitor');
      renderVisitors();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });
  
  // Notices bulletins
  document.getElementById('noticeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById('noticeTitle').value,
      category: document.getElementById('noticeCategory').value,
      postedBy: document.getElementById('noticePostedBy').value,
      content: document.getElementById('noticeContent').value
    };
    
    try {
      await api.post('/api/notices', data);
      showToast('Notice announcement published!', 'success');
      
      // Dispatch simulated announcements
      triggerSimulatedEmail('students-list@aegis.com', `ANNOUNCEMENT: ${data.title}`, data.content.substring(0, 50) + '...');
      
      closeModal('modalNotice');
      renderNoticeBoard();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });
  
  // Bed allocation form
  document.getElementById('bedAllocationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const studentId = document.getElementById('allocStudentSelect').value;
    const hostelId = document.getElementById('allocHostelSelect').value;
    const roomId = document.getElementById('allocRoomSelect').value;
    const bedNo = parseInt(document.getElementById('allocBedSelect').value);
    
    if (!studentId || !hostelId || !roomId || !bedNo) {
      showToast('Please fill all allocation fields.', 'warning');
      return;
    }
    
    try {
      await api.post('/api/allocations', { studentId, hostelId, roomId, bedNo });
      showToast('Bed slot allocated successfully!', 'success');
      
      triggerSimulatedEmail('student@aegis.com', 'Room Allocation Confirmed - Aegis Hostels', 'You have been allocated a room. Please report to the warden office.');
      
      renderAllocation();
    } catch (err) {
      showToast(err.message, 'danger');
    }
  });
  
  // Buttons Add-Student, Add-Hostel, Add-Room, etc.
  document.getElementById('btnAddStudent').addEventListener('click', () => openStudentModal());
  document.getElementById('btnAddHostel').addEventListener('click', () => openHostelModal());
  document.getElementById('btnAddRoom').addEventListener('click', () => openRoomModal());
  document.getElementById('btnAddStaff').addEventListener('click', () => openStaffModal());
  document.getElementById('btnNewComplaint').addEventListener('click', () => openComplaintModal());
  document.getElementById('btnCheckInVisitor').addEventListener('click', () => openVisitorModal());
  document.getElementById('btnNewNotice').addEventListener('click', () => openNoticeModal());
}

// ==========================================
// 6. MISSING MODAL OPEN FUNCTIONS
// ==========================================
async function openComplaintModal() {
  const students = await api.get('/api/students');
  const select = document.getElementById('compStudentSelect');
  select.innerHTML = '<option value="">Select resident student...</option>';
  students.filter(s => s.status === 'Active').forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.collegeId})`;
    // Auto-select if current user is student
    if (currentUser.role === 'STUDENT' && s.email === currentUser.email) {
      opt.selected = true;
    }
    select.appendChild(opt);
  });
  openModal('modalComplaint');
}

async function openVisitorModal() {
  const students = await api.get('/api/students');
  const select = document.getElementById('visitorStudentSelect');
  select.innerHTML = '<option value="">Select hosting student...</option>';
  students.filter(s => s.status === 'Active').forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.collegeId})`;
    select.appendChild(opt);
  });
  openModal('modalVisitor');
}

function openNoticeModal() {
  // Pre-fill author as current user name
  document.getElementById('noticePostedBy').value = currentUser?.name || '';
  openModal('modalNotice');
}

// ==========================================
// 7. GLOBAL SEARCH WIRING
// ==========================================
function initGlobalSearch() {
  const searchInput = document.getElementById('globalSearch');
  let debounceTimer;
  
  searchInput.addEventListener('input', (e) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const query = e.target.value.toLowerCase().trim();
      switch (currentActiveTab) {
        case 'students':
          renderStudents(query);
          break;
        case 'hostels':
          renderHostels(query);
          break;
        case 'staff':
          renderStaff(query);
          break;
        case 'visitors':
          renderVisitors(query);
          break;
        case 'noticeboard':
          renderNoticeBoard(query);
          break;
        case 'fees':
          renderFees(query);
          break;
        default:
          break;
      }
    }, 300);
  });
}

function getInitials(name) {
  if (!name) return 'US';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}


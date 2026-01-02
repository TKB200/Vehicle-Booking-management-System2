// --- State Management ---
let state = {
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
    users: {},
    vehicles: [],
    bookings: []
};

async function refreshState() {
    try {
        const response = await fetch('api.php?action=get_state');
        const data = await response.json();
        if (data.success) {
            state.users = data.users;
            state.vehicles = data.vehicles;
            state.bookings = data.bookings;
            showView();
        }
    } catch (error) {
        console.error('Failed to fetch state:', error);
    }
}

function saveUserToLocal() {
    localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
}

// --- DOM Elements ---
const authSection = document.getElementById('auth-section');
const userDashboard = document.getElementById('user-dashboard');
const adminDashboard = document.getElementById('admin-dashboard');
const vehicleGrid = document.getElementById('vehicle-grid');
const userDisplay = document.getElementById('user-display');
const logoutBtn = document.getElementById('logout-btn');

// --- Auth Handling ---
document.getElementById('show-register').onclick = () => {
    document.getElementById('login-form-container').style.display = 'none';
    document.getElementById('register-form-container').style.display = 'block';
};

document.getElementById('show-login').onclick = () => {
    document.getElementById('register-form-container').style.display = 'none';
    document.getElementById('login-form-container').style.display = 'block';
};

document.getElementById('register-form').onsubmit = async (e) => {
    e.preventDefault();
    const userId = document.getElementById('register-userid').value;
    const name = document.getElementById('register-name').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;

    const response = await fetch('api.php?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, name, phone, password })
    });
    const data = await response.json();

    if (data.success) {
        alert('Registration successful! Please login.');
        document.getElementById('show-login').click();
        refreshState();
    } else {
        alert(data.message || 'Registration failed');
    }
};

document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const userId = document.getElementById('login-userid').value;
    const password = document.getElementById('login-password').value;

    const response = await fetch('api.php?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password })
    });
    const data = await response.json();

    if (data.success) {
        state.currentUser = data.user;
        saveUserToLocal();
        refreshState();
    } else {
        alert(data.message || 'Invalid credentials');
    }
};

logoutBtn.onclick = () => {
    state.currentUser = null;
    saveUserToLocal();
    showView();
};

function showView() {
    authSection.style.display = 'none';
    userDashboard.style.display = 'none';
    adminDashboard.style.display = 'none';
    logoutBtn.style.display = 'none';
    userDisplay.innerText = '';

    if (!state.currentUser) {
        authSection.style.display = 'block';
    } else {
        logoutBtn.style.display = 'block';

        const availableCount = state.vehicles.filter(v => {
            const isBooked = state.bookings.some(b => b.vehicle_id === v.id && new Date(b.return_date + 'T' + b.return_time) > new Date());
            return v.status === 'Available' && !isBooked;
        }).length;

        userDisplay.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; background: var(--accent-blue); padding: 4px 12px; border-radius: 20px; font-size: 0.75rem;">
                    <span style="color: var(--success); font-weight: 700;">${availableCount}/${state.vehicles.length}</span>
                    <span style="color: var(--text-gray);">Fleets Ready</span>
                </div>
                <span style="color: var(--text-white); font-weight: 600;">${state.currentUser.name}</span>
            </div>
        `;

        if (state.currentUser.role === 'admin') {
            adminDashboard.style.display = 'block';
            renderAdminDashboard();
        } else {
            userDashboard.style.display = 'block';
            renderUserDashboard();
        }
    }
}

// --- User Dashboard ---
function renderUserDashboard() {
    vehicleGrid.innerHTML = '';
    state.vehicles.forEach(vehicle => {
        const card = document.createElement('div');
        card.className = 'glass-panel animate-fade-in';
        card.style.padding = '0';
        card.style.overflow = 'hidden';

        const activeBooking = state.bookings.find(b => b.vehicle_id === vehicle.id && new Date(b.return_date + 'T' + b.return_time) > new Date());
        let status = 'Available';
        let statusColor = 'var(--success)';

        if (vehicle.status === 'Maintenance') {
            status = 'Under Maintenance';
            statusColor = 'var(--warning)';
        } else if (activeBooking) {
            status = 'Booked';
            statusColor = 'var(--danger)';
        }

        card.innerHTML = `
            <div style="position: relative;">
                <img src="${vehicle.image}" alt="${vehicle.name}" style="width: 100%; height: 200px; object-fit: cover;">
                <div style="position: absolute; top: 1rem; right: 1rem; background: rgba(10, 25, 47, 0.7); padding: 4px 10px; border-radius: 20px; font-size: 0.7rem; backdrop-filter: blur(4px); border: 1px solid var(--glass-border);">
                    <span class="status-pulse" style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${statusColor}; margin-right: 5px;"></span>
                    ${status}
                </div>
            </div>
            <div style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0;">${vehicle.name}</h3>
                    <span style="font-size: 0.7rem; color: var(--text-gray); border: 1px solid var(--glass-border); padding: 2px 6px; border-radius: 4px;">${vehicle.id}</span>
                </div>
                <p style="color: var(--text-gray); font-size: 0.85rem; margin-bottom: 1.5rem;">${vehicle.type}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 0.9rem; color: ${statusColor}">
                        ${status === 'Available' ? 'Ready for use' : (status === 'Booked' ? 'Currently in use' : 'Service in progress')}
                    </span>
                    ${status === 'Available' ?
                `<button onclick="openBookingModal('${vehicle.id}')" class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">Book Now</button>` :
                `<button disabled class="btn btn-outline" style="padding: 0.5rem 1rem; font-size: 0.85rem; opacity: 0.5;">Unavailable</button>`
            }
                </div>
                ${activeBooking ? `
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--glass-border); font-size: 0.8rem; color: var(--text-gray); line-height: 1.6;">
                        <span style="color: var(--text-white); font-weight: 600;">Booked by:</span> ${state.users[activeBooking.user_id]?.name || 'Unknown'}<br>
                        <span style="color: var(--text-white); font-weight: 600;">Tel:</span> ${state.users[activeBooking.user_id]?.phone || 'N/A'}<br>
                        <span style="color: var(--text-white); font-weight: 600;">Until:</span> ${activeBooking.return_date} ${activeBooking.return_time}
                    </div>
                ` : ''}
            </div>
        `;
        vehicleGrid.appendChild(card);
    });
}

// --- Admin Dashboard ---
function renderAdminDashboard() {
    const activeBookingsCount = state.bookings.filter(b => new Date(b.return_date + 'T' + b.return_time) > new Date()).length;
    const maintenanceCount = state.vehicles.filter(v => v.status === 'Maintenance').length;
    const totalVehicles = state.vehicles.length || 1;

    document.getElementById('stats-active').innerText = activeBookingsCount;
    document.getElementById('stats-maintenance').innerText = maintenanceCount;

    const activeProgress = (activeBookingsCount / totalVehicles) * 100;
    const maintProgress = (maintenanceCount / totalVehicles) * 100;

    document.getElementById('stats-progress-active').style.width = activeProgress + '%';
    document.getElementById('stats-progress-maint').style.width = maintProgress + '%';
    document.getElementById('stats-readiness').innerText = Math.round(100 - maintProgress) + '%';

    // Logs
    const logsTbody = document.getElementById('admin-booking-logs');
    logsTbody.innerHTML = '';
    [...state.bookings].reverse().forEach(booking => {
        const vehicle = state.vehicles.find(v => v.id === booking.vehicle_id);
        const user = state.users[booking.user_id];
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid var(--glass-border)';
        const isPast = new Date(booking.return_date + 'T' + booking.return_time) < new Date();

        tr.innerHTML = `
            <td style="padding: 1rem;">
                <div style="font-weight: 600; color: var(--text-white);">${vehicle?.name || 'Unknown'}</div>
                <div style="font-size: 0.75rem;">${vehicle?.id || ''}</div>
            </td>
            <td style="padding: 1rem;">
                <div style="font-weight: 600; color: var(--text-white);">${user?.name || 'Unknown'}</div>
                <div style="font-size: 0.75rem;">${user?.phone || 'N/A'}</div>
            </td>
            <td style="padding: 1rem;">
                <div style="font-size: 0.85rem;">${booking.pickup_date} ${booking.pickup_time}</div>
                <div style="font-size: 0.85rem; color: var(--text-gray);">to ${booking.return_date} ${booking.return_time}</div>
            </td>
            <td style="padding: 1rem;">
                <span style="color: ${isPast ? 'var(--text-gray)' : 'var(--success)'}; font-size: 0.8rem; font-weight: 600;">
                    ${isPast ? 'COMPLETED' : 'ACTIVE'}
                </span>
            </td>
        `;
        logsTbody.appendChild(tr);
    });

    // Fleet Status List
    const fleetList = document.getElementById('admin-fleet-list');
    fleetList.innerHTML = '';
    state.vehicles.forEach(vehicle => {
        const div = document.createElement('div');
        div.className = 'glass-panel';
        div.style.padding = '1rem';
        div.style.display = 'flex';
        div.style.justifyContent = 'space-between';
        div.style.alignItems = 'center';

        div.innerHTML = `
            <div>
                <p style="font-weight: 600; margin: 0;">${vehicle.name}</p>
                <p style="font-size: 0.75rem; color: var(--text-gray); margin: 0;">${vehicle.id}</p>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span style="font-size: 0.75rem; color: ${vehicle.status === 'Maintenance' ? 'var(--warning)' : 'var(--success)'}">
                    ${vehicle.status}
                </span>
                <button onclick="toggleMaintenance('${vehicle.id}')" class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.7rem;">
                    ${vehicle.status === 'Maintenance' ? 'Fix' : 'Maint.'}
                </button>
            </div>
        `;
        fleetList.appendChild(div);
    });
}

window.toggleMaintenance = async (vehicleId) => {
    const response = await fetch('api.php?action=toggle_maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId })
    });
    const data = await response.json();
    if (data.success) {
        refreshState();
    }
};

// --- Booking Modal ---
const modal = document.getElementById('booking-modal');
window.openBookingModal = (vehicleId) => {
    document.getElementById('booking-vehicle-id').value = vehicleId;
    const vehicle = state.vehicles.find(v => v.id === vehicleId);
    document.getElementById('modal-title').innerText = `Book ${vehicle.name}`;
    modal.style.display = 'flex';
};

document.getElementById('close-modal').onclick = () => {
    modal.style.display = 'none';
};

document.getElementById('booking-form').onsubmit = async (e) => {
    e.preventDefault();
    const vehicleId = document.getElementById('booking-vehicle-id').value;
    const pickupDate = document.getElementById('booking-pickup-date').value;
    const pickupTime = document.getElementById('booking-pickup-time').value;
    const returnDate = document.getElementById('booking-return-date').value;
    const returnTime = document.getElementById('booking-return-time').value;

    const response = await fetch('api.php?action=book_vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            vehicleId,
            userId: state.currentUser.user_id,
            pickupDate,
            pickupTime,
            returnDate,
            returnTime
        })
    });
    const data = await response.json();

    if (data.success) {
        modal.style.display = 'none';
        alert('Booking Confirmed!');
        refreshState();
    } else {
        alert(data.message || 'Booking failed');
    }
};

// Initial View
refreshState();

window.onclick = (event) => {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

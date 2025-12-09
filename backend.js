// =====================================
// Backend
// =====================================
const ROOM_CAPACITY = {
    'ห้องประชุม A': 60,
    'ห้องประชุม B': 300,
    'หอประชุม': 500
};

// =====================================
// Global State
// =====================================
let currentPage = 'booking';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let allBookings = [];

// =====================================
// UI Utilities
// =====================================
function showStatus(message, isSuccess = true) {
    const box = document.getElementById('statusMessage');
    if (!box) return;

    box.textContent = message;
    box.className = isSuccess ? 'status-message success' : 'status-message error';
    box.style.display = 'block';

    setTimeout(() => (box.style.display = 'none'), 5000);
}

function toggleLoading(show) {
    const btn1 = document.querySelector('.order-btn');
    const btn2 = document.querySelector('.btn-ghost');
    const loading = document.getElementById('loading');

    if (loading) loading.style.display = show ? 'block' : 'none';
    if (btn1) btn1.disabled = show;
    if (btn2) btn2.disabled = show;
}

// =====================================
// Submit Booking Form
// =====================================
function submitForm(params) {
    const scriptURL = "https://script.google.com/macros/s/AKfycbxuYQlZqkgobToZXEGP9qTR64NgGCgn1pscyhkorM2tLBvDjSdQh8h7wH0V5tCi8lr9jw/exec";
    toggleLoading(true);

    fetch(scriptURL, {
        method: "POST",
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
            return res.json();
        })
        .then(data => {
            toggleLoading(false);
            if (data.result === "success") {
                document.getElementById("bookingForm")?.reset();
                document.getElementById("otherInputBox").style.display = "none";
                showStatus("✅ ส่งข้อมูลสำเร็จ!", true);
            } else {
                showStatus("❌ " + (data.message || "เกิดข้อผิดพลาด"), false);
            }
        })
        .catch(err => {
            toggleLoading(false);
            showStatus("❌ ส่งข้อมูลล้มเหลว: " + err.message, false);
        });
}

// =====================================
// Page Navigation
// =====================================
document.addEventListener("DOMContentLoaded", () => {
    const today = new Date().toISOString().split("T")[0];
    const bookingInput = document.getElementById("bookingDate");
    if (bookingInput) bookingInput.min = today;

    document.getElementById('mainMenuBtn')?.addEventListener('click', () => switchPage('booking'));
    document.getElementById('calendarMenuBtn')?.addEventListener('click', () => switchPage('calendar'));
    document.getElementById('statusBtn')?.addEventListener('click', () => {
        window.open('https://docs.google.com/spreadsheets/d/1ArBhbv2iQGkSBLus0b88vVxpmzc4i2QgM_w2JdEnjBc/edit?gid=0', '_blank');
    });

    // Calendar navigation
    document.getElementById('prevMonth')?.addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth')?.addEventListener('click', () => changeMonth(1));

    // Room filters
    ['filterRoomA', 'filterRoomB', 'filterHall'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', renderCalendar);
    });
});

function switchPage(page) {
    currentPage = page;

    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('bookingPage').style.display = page === 'booking' ? 'block' : 'none';
    document.getElementById('calendarPage').style.display = page === 'calendar' ? 'block' : 'none';

    if (page === 'booking') {
        document.getElementById('mainMenuBtn')?.classList.add('active');
    } else {
        document.getElementById('calendarMenuBtn')?.classList.add('active');
        loadBookingsData();
    }
}

function changeMonth(step) {
    currentMonth += step;
    if (currentMonth < 0) (currentMonth = 11, currentYear--);
    if (currentMonth > 11) (currentMonth = 0, currentYear++);
    renderCalendar();
}

// =====================================
// Fetch Booking Data
// =====================================
async function loadBookingsData() {
    const loading = document.getElementById('calendarLoading');
    if (loading) loading.style.display = 'block';

    try {
        const url = "https://script.google.com/macros/s/AKfycbzB1JwJltwD8CNx5iAIz80uq5O_oqV5LZBLcrcuEcWLWJqY2CBAjDCDuBHTcRe9W1Wbzw/exec";
        const res = await fetch(url);
        const raw = await res.text();

        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            throw new Error("ข้อมูลไม่ใช่ JSON");
        }

        if (!Array.isArray(data)) throw new Error("API ไม่ได้ส่ง array กลับมา");

        allBookings = data.map(row => ({
            name: row.fullName || "",
            email: row.email || "",
            department: row.department || "",
            participants: Number(row.participants || 0),
            date: normalizeDate(row.bookingDate),
            startTime: row.startTime || "",
            endTime: row.endTime || "",
            purpose: row.purpose || "",
            room: row.room || "",
            additionalInfo: row.additionalInfo || "",
            breakTime: row.breakTime || "",
            status: row.status || "รอตรวจสอบ"
        }));

        renderCalendar();

    } catch (err) {
        showCalendarError("โหลดข้อมูลล้มเหลว: " + err.message);
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// =====================================
// Helper: Normalize Date Format
// =====================================
function normalizeDate(value) {
    if (!value) return "";

    if (typeof value === "string" && value.includes("/")) {
        const [d, m, y] = value.split("/");
        return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }

    const d = new Date(value);
    if (isNaN(d)) return "";
    return d.toISOString().split("T")[0];
}

// =====================================
// Calendar Rendering
// =====================================
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const head = document.getElementById('currentMonthYear');
    if (!grid || !head) return;

    const MONTH = [
        "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
        "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"
    ];

    head.textContent = `${MONTH[currentMonth]} ${currentYear + 543}`;
    grid.innerHTML = "";

    // Day Headers
    ["อา","จ","อ","พ","พฤ","ศ","ส"].forEach(d => {
        const div = document.createElement('div');
        div.className = "calendar-day-header";
        div.textContent = d;
        grid.appendChild(div);
    });

    const first = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevDays = new Date(currentYear, currentMonth, 0).getDate();

    const today = new Date();
    const isThisMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

    const activeRooms = getActiveRooms();

    // Previous month filler cells
    for (let i = first - 1; i >= 0; i--) {
        grid.appendChild(createDayCell(prevDays - i, true));
    }

    // Main month cells
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const isToday = isThisMonth && d === today.getDate();
        grid.appendChild(createDayCell(d, false, isToday, dateStr, activeRooms));
    }

    // Next month filler
    const total = first + daysInMonth;
    for (let i = 1; i <= 42 - total; i++) {
        grid.appendChild(createDayCell(i, true));
    }
}

function getActiveRooms() {
    const rooms = [];
    if (document.getElementById('filterRoomA')?.checked) rooms.push('ห้องประชุม A');
    if (document.getElementById('filterRoomB')?.checked) rooms.push('ห้องประชุม B');
    if (document.getElementById('filterHall')?.checked) rooms.push('หอประชุม');
    return rooms;
}

// =====================================
// Create Calendar Cell
// =====================================
function createDayCell(day, isOther, isToday = false, dateStr = null, activeRooms = []) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    if (isOther) div.classList.add('other-month');
    if (isToday) div.classList.add('today');

    div.innerHTML = `<div class="day-number">${day}</div>`;

    if (!isOther && dateStr) {
        const books = allBookings.filter(b => b.date === dateStr);

        if (books.length > 0) {
            div.classList.add('has-booking');

            // Count
            const count = document.createElement('div');
            count.className = 'booking-count';
            count.textContent = `${books.length} การจอง`;
            div.appendChild(count);

            // Seat summary
            const info = document.createElement('div');
            info.className = 'seats-info';

            activeRooms.forEach(room => {
                const used = books.filter(b => b.room === room)
                    .reduce((s, b) => s + b.participants, 0);

                const left = ROOM_CAPACITY[room] - used;
                const short = room.replace("ห้องประชุม ", "") || "Hall";

                let cls = "seats-available";
                if (left <= 0) cls = "seats-full";
                else if (left < 30) cls = "seats-warning";

                info.innerHTML += `<div><span class="${cls}">${short}: ${left}/${ROOM_CAPACITY[room]}</span></div>`;
            });

            div.appendChild(info);

            // Indicators
            const indicator = document.createElement('div');
            indicator.className = 'booking-indicator';

            [...new Set(books.map(b => b.room))].forEach(room => {
                const dot = document.createElement('div');
                dot.className = 'room-dot ' +
                    (room === 'ห้องประชุม A' ? 'room-a' :
                     room === 'ห้องประชุม B' ? 'room-b' : 'hall');
                indicator.appendChild(dot);
            });

            div.appendChild(indicator);

            div.addEventListener('click', () => showBookingDetails(dateStr, books));
        }
    }

    return div;
}

// =====================================
// Show Booking Details
// =====================================
function showBookingDetails(dateStr, bookings) {
    const details = document.getElementById('bookingDetails');
    const dateText = document.getElementById('selectedDate');
    const list = document.getElementById('bookingList');

    if (!details || !dateText || !list) return;

    const [y, m, d] = dateStr.split('-');
    const MONTH = [
        "มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน",
        "กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"
    ];

    dateText.textContent = `${parseInt(d)} ${MONTH[m - 1]} ${parseInt(y) + 543}`;
    list.innerHTML = "";

    const summary = document.createElement('div');
    summary.className = 'booking-summary';

    ['ห้องประชุม A','ห้องประชุม B','หอประชุม'].forEach(room => {
        const used = bookings.filter(b => b.room === room)
            .reduce((sum, b) => sum + b.participants, 0);

        const left = ROOM_CAPACITY[room] - used;
        const short = room.replace("ห้องประชุม ", "");

        summary.innerHTML += `
            <div class="summary-item ${room === 'ห้องประชุม A' ? 'room-a' : room === 'ห้องประชุม B' ? 'room-b' : 'hall'}">
                <strong>${left}</strong>
                <span>${short} - ที่นั่งเหลือ</span>
            </div>
        `;
    });

    list.appendChild(summary);

    bookings.forEach(b => {
        const item = document.createElement('div');
        item.className = 'booking-item';
        item.innerHTML = `
            <strong>${b.name}</strong>
            <div>${b.room} | ${b.startTime} - ${b.endTime}</div>
            <div>ผู้เข้าร่วม: ${b.participants}</div>
            <div>วัตถุประสงค์: ${b.purpose}</div>
        `;
        list.appendChild(item);
    });

    details.style.display = 'block';
}

function showCalendarError(msg) {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:20px; color:#dc3545;">
            ${msg}
        </div>`;
}

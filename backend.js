// =======================
// Configuration
// =======================
const ROOM_CAPACITY = {
    'ห้องประชุม A': 60,
    'ห้องประชุม B': 300,
    'หอประชุม': 500
};

// =======================
// Navigation & State
// =======================
let currentPage = 'booking';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let allBookings = [];

// =======================
// Form Submission (Original)
// =======================
function showStatus(message, isSuccess) {
    const statusElement = document.getElementById('statusMessage');
    statusElement.textContent = message;
    statusElement.className = isSuccess ? 'status-message success' : 'status-message error';
    statusElement.style.display = 'block';

    setTimeout(() => {
        statusElement.style.display = 'none';
    }, 5000);
}

function toggleLoading(show) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
    document.querySelector('.order-btn').disabled = show;
    document.querySelector('.btn-ghost').disabled = show;
}

function submitForm(params) {
    // ✅ ใส่ URL GAS ทั้งสอง
    const scriptURLs = [
        "https://script.google.com/macros/s/AKfycbxyAF2s2dtvV9T7eGffmDbP2QkmMYiNEsT3tKDRmxhi6pRNtq74aAJCwjmL1Zj-Ec3uPg/exec",
        "https://script.google.com/macros/s/AKfycby9ZiuVp2kDUqtB5wBrR7jw2pDlHGpJi8ivKjbXQIzIH_AUavm2uusbnmDxfwT9hJua/exec"
    ];

    toggleLoading(true);

    // ส่งแบบ Promise.all เพื่อให้รอผลทั้งหมด
    Promise.all(
        scriptURLs.map(url =>
            fetch(url, {
                method: "POST",
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: params
            }).then(res => {
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
                return res.json();
            })
        )
    )
        .then(results => {
            toggleLoading(false);

            const allSuccess = results.every(r => r.result === "success");

            if (allSuccess) {
                showStatus("✅ ส่งข้อมูลสำเร็จ! ข้อมูลถูกบันทึกแล้วในทั้งสองชีท", true);
                document.getElementById("bookingForm").reset();
                document.getElementById("otherInputBox").style.display = "none";
            } else {
                const failed = results.filter(r => r.result !== "success");
                showStatus("❌ เกิดข้อผิดพลาด: " + JSON.stringify(failed), false);
            }
        })
        .catch(err => {
            toggleLoading(false);
            showStatus("❌ เกิดข้อผิดพลาดในการส่งข้อมูล: " + err.message, false);
            console.error('❌ Error:', err);
        });
}


// =======================
// Page Navigation
// =======================
document.addEventListener('DOMContentLoaded', function () {
    // Set minimum date
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('bookingDate');
    if (dateInput) {
        dateInput.min = today;
    }

    // Menu navigation
    document.getElementById('mainMenuBtn')?.addEventListener('click', () => switchPage('booking'));
    document.getElementById('calendarMenuBtn')?.addEventListener('click', () => switchPage('calendar'));
    document.getElementById('statusBtn')?.addEventListener('click', () => {
        window.open('https://docs.google.com/spreadsheets/d/1ArBhbv2iQGkSBLus0b88vVxpmzc4i2QgM_w2JdEnjBc/edit?gid=0', '_blank');
    });

    // Calendar controls
    document.getElementById('prevMonth')?.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('nextMonth')?.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    // Room filters
    ['filterRoomA', 'filterRoomB', 'filterHall'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => renderCalendar());
    });
});

function switchPage(page) {
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));

    if (page === 'booking') {
        document.getElementById('mainMenuBtn').classList.add('active');
        document.getElementById('bookingPage').style.display = 'block';
        document.getElementById('calendarPage').style.display = 'none';
        currentPage = 'booking';
    } else if (page === 'calendar') {
        document.getElementById('calendarMenuBtn').classList.add('active');
        document.getElementById('bookingPage').style.display = 'none';
        document.getElementById('calendarPage').style.display = 'block';
        currentPage = 'calendar';
        loadBookingsData();
    }
}

// =======================
// Load Bookings Data
// =======================
async function loadBookingsData() {
    const loading = document.getElementById('calendarLoading');
    loading.style.display = 'block';

    try {
        // ✅ ลองทั้ง 2 วิธี
        const scriptURL = "https://script.google.com/macros/s/AKfycbxyAF2s2dtvV9T7eGffmDbP2QkmMYiNEsT3tKDRmxhi6pRNtq74aAJCwjmL1Zj-Ec3uPg/exec";
       

        console.log('🔄 Fetching data from:', scriptURL);

        const response = await fetch(scriptURL);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        console.log('📡 Raw response:', text.substring(0, 200) + '...');

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('❌ JSON parse error:', e);
            throw new Error('ไม่สามารถแปลง response เป็น JSON ได้');
        }

        console.log('📊 Parsed data type:', typeof data);
        console.log('📊 Is array?', Array.isArray(data));
        console.log('📊 Data:', data);

        // ✅ ตรวจสอบว่า data เป็น array หรือไม่
        if (!Array.isArray(data)) {
            console.error('❌ Response is not an array:', data);
            throw new Error('ข้อมูลที่ได้รับไม่ถูกต้อง - API ไม่ได้ส่ง array กลับมา');
        }

        // แปลงข้อมูลให้อยู่ในรูปแบบที่ใช้งานได้
        allBookings = data.map(item => ({
            name: item.fullName || '',
            email: item.email || '',
            department: item.department || '',
            participants: parseInt(item.participants) || 0,
            date: formatDateString(item.bookingDate),
            startTime: item.startTime || '',
            endTime: item.endTime || '',
            purpose: item.purpose || '',
            room: item.room || '',
            additionalInfo: item.additionalInfo || '',
            status: item.status || 'รอตรวจสอบ',
            breakTime: item.breakTime || '',
            timestamp: item.timestamp || ''
        }));

        console.log('✅ โหลดข้อมูลสำเร็จ:', allBookings.length, 'รายการ');
        renderCalendar();

    } catch (error) {
        console.error('Error loading bookings:', error);
        showCalendarError('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + error.message);
    } finally {
        loading.style.display = 'none';
    }
}

function formatDateString(dateValue) {
    if (!dateValue) return '';

    let date;
    if (typeof dateValue === 'string') {
        // ถ้าเป็น format DD/MM/YYYY (จาก timestamp)
        if (dateValue.includes('/')) {
            const parts = dateValue.split('/');
            if (parts.length === 3) {
                date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        } else {
            date = new Date(dateValue);
        }
    } else {
        date = new Date(dateValue);
    }

    if (!date || isNaN(date)) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function showCalendarError(message) {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = `<div style="grid-column: 1/-1; padding:20px; text-align:center; color:#dc3545;">${message}</div>`;
}

// =======================
// Render Calendar
// =======================
function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthYear = document.getElementById('currentMonthYear');

    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];

    monthYear.textContent = `${thaiMonths[currentMonth]} ${currentYear + 543}`;

    grid.innerHTML = '';

    // Day headers
    const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    const todayDate = today.getDate();

    const activeRooms = [];
    if (document.getElementById('filterRoomA')?.checked) activeRooms.push('ห้องประชุม A');
    if (document.getElementById('filterRoomB')?.checked) activeRooms.push('ห้องประชุม B');
    if (document.getElementById('filterHall')?.checked) activeRooms.push('หอประชุม');

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayDiv = createDayCell(day, true, false, null, activeRooms);
        grid.appendChild(dayDiv);
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday = isCurrentMonth && day === todayDate;
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayDiv = createDayCell(day, false, isToday, dateStr, activeRooms);
        grid.appendChild(dayDiv);
    }

    // Next month days
    const remainingCells = 42 - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        const dayDiv = createDayCell(day, true, false, null, activeRooms);
        grid.appendChild(dayDiv);
    }
}

function createDayCell(day, isOtherMonth, isToday, dateStr, activeRooms) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';

    if (isOtherMonth) {
        dayDiv.classList.add('other-month');
    }
    if (isToday) {
        dayDiv.classList.add('today');
    }

    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    dayDiv.appendChild(dayNumber);

    if (!isOtherMonth && dateStr) {
        const dayBookings = allBookings.filter(b => b.date === dateStr);

        if (dayBookings.length > 0) {
            // คำนวณจำนวนที่นั่งแต่ละห้อง
            const roomSeats = {};
            activeRooms.forEach(room => {
                const roomBookings = dayBookings.filter(b => b.room === room);
                const totalSeats = roomBookings.reduce((sum, b) => sum + b.participants, 0);
                const available = ROOM_CAPACITY[room] - totalSeats;
                roomSeats[room] = { used: totalSeats, available: available };
            });

            dayDiv.classList.add('has-booking');

            // แสดงจำนวนการจอง
            const countDiv = document.createElement('div');
            countDiv.className = 'booking-count';
            countDiv.textContent = `${dayBookings.length} การจอง`;
            dayDiv.appendChild(countDiv);

            // แสดงที่นั่งคงเหลือ
            const seatsInfo = document.createElement('div');
            seatsInfo.className = 'seats-info';

            Object.keys(roomSeats).forEach(room => {
                const info = roomSeats[room];
                const roomShort = room === 'ห้องประชุม A' ? 'A' : room === 'ห้องประชุม B' ? 'B' : 'Hall';
                const seatDiv = document.createElement('div');

                let className = 'seats-available';
                if (info.available <= 0) className = 'seats-full';
                else if (info.available < 30) className = 'seats-warning';

                seatDiv.innerHTML = `<span class="${className}">${roomShort}: ${info.available}/${ROOM_CAPACITY[room]}</span>`;
                seatsInfo.appendChild(seatDiv);
            });

            dayDiv.appendChild(seatsInfo);

            // Room indicators
            const indicator = document.createElement('div');
            indicator.className = 'booking-indicator';

            const rooms = [...new Set(dayBookings.map(b => b.room))];
            rooms.forEach(room => {
                const dot = document.createElement('div');
                dot.className = 'room-dot';
                if (room === 'ห้องประชุม A') dot.classList.add('room-a');
                else if (room === 'ห้องประชุม B') dot.classList.add('room-b');
                else if (room === 'หอประชุม') dot.classList.add('hall');
                indicator.appendChild(dot);
            });

            dayDiv.appendChild(indicator);

            // Click to show details
            dayDiv.addEventListener('click', () => showBookingDetails(dateStr, dayBookings));
        }
    }

    return dayDiv;
}

// =======================
// Show Booking Details
// =======================
function showBookingDetails(dateStr, bookings) {
    const detailsDiv = document.getElementById('bookingDetails');
    const dateSpan = document.getElementById('selectedDate');
    const listDiv = document.getElementById('bookingList');

    // Format date
    const [year, month, day] = dateStr.split('-');
    const thaiMonths = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    dateSpan.textContent = `${parseInt(day)} ${thaiMonths[parseInt(month) - 1]} ${parseInt(year) + 543}`;

    // Clear list
    listDiv.innerHTML = '';

    // สรุปจำนวนที่นั่งแต่ละห้อง
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'booking-summary';

    ['ห้องประชุม A', 'ห้องประชุม B', 'หอประชุม'].forEach(room => {
        const roomBookings = bookings.filter(b => b.room === room);
        const totalUsed = roomBookings.reduce((sum, b) => sum + b.participants, 0);
        const available = ROOM_CAPACITY[room] - totalUsed;

        const summaryItem = document.createElement('div');
        summaryItem.className = 'summary-item';
        if (room === 'ห้องประชุม A') summaryItem.classList.add('room-a');
        else if (room === 'ห้องประชุม B') summaryItem.classList.add('room-b');
        else summaryItem.classList.add('hall');

        const roomShort = room.replace('ห้องประชุม ', '');

        summaryItem.innerHTML = `
            <strong>${available}</strong>
            <span>${roomShort} - ที่นั่งเหลือ</span>
            <div style="font-size:0.75rem; margin-top:5px; color:#6c757d;">
                ใช้ไป ${totalUsed} คน
            </div>
        `;

        summaryDiv.appendChild(summaryItem);
    });

    listDiv.appendChild(summaryDiv);

    // แสดงรายละเอียดแต่ละการจอง
    bookings.forEach(booking => {
        const item = document.createElement('div');
        item.className = 'booking-item';
        if (booking.room === 'ห้องประชุม B') item.classList.add('room-b');
        else if (booking.room === 'หอประชุม') item.classList.add('hall');

        let statusClass = 'status-pending';
        if (booking.status === 'อนุมัติ') statusClass = 'status-approved';
        else if (booking.status === 'ไม่อนุมัติ') statusClass = 'status-rejected';

        // ✅ Format timestamp
        let formattedTimestamp = 'ไม่ระบุ';
        if (booking.timestamp) {
            try {
                const ts = new Date(booking.timestamp);
                if (!isNaN(ts)) {
                    const day = String(ts.getDate()).padStart(2, '0');
                    const month = String(ts.getMonth() + 1).padStart(2, '0');
                    const year = ts.getFullYear() + 543;
                    const hours = String(ts.getHours()).padStart(2, '0');
                    const minutes = String(ts.getMinutes()).padStart(2, '0');
                    formattedTimestamp = `${day}/${month}/${year} ${hours}:${minutes} น.`;
                }
            } catch (e) {
                formattedTimestamp = String(booking.timestamp);
            }
        }

        item.innerHTML = `
            <h4>🏢 ${booking.room}</h4>
            <p><b>⏰ เวลา:</b> ${booking.startTime} - ${booking.endTime} น.</p>
            <p><b>👤 ผู้จอง:</b> ${booking.name}</p>
            <p><b>👥 จำนวน:</b> ${booking.participants} คน</p>
            <p><b>🏛️ หน่วยงาน:</b> ${booking.department}</p>
            <p><b>🎯 วัตถุประสงค์:</b> ${booking.purpose}</p>
            <p><b>🔧 อุปกรณ์:</b> ${booking.additionalInfo}</p>
            <p><b>☕ พักเบรก:</b> ${booking.breakTime}</p>
            <p><b>📊 สถานะ:</b> <span class="booking-status ${statusClass}">${booking.status}</span></p>
            <div class="booking-timestamp">⏱️ ส่งจองเมื่อ: ${formattedTimestamp}</div>
        `;

        listDiv.appendChild(item);
    });

    detailsDiv.style.display = 'block';
    detailsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// =======================
// Form Submission Handler
// =======================
document.getElementById("bookingForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const department = document.getElementById("department").value.trim();
    const participants = parseInt(document.getElementById("participants").value);
    const bookingDate = document.getElementById("bookingDate").value;
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;
    const purpose = document.getElementById("purpose").value.trim();
    const room = document.querySelector('input[name="room"]:checked');
    const breakTime = document.getElementById("breakTime").value;

    let additionalInfo = document.getElementById("additionalInfo").value;

    if (additionalInfo === "other") {
        const otherText = document.getElementById("otherText").value.trim();
        if (otherText.length > 0) {
            additionalInfo = "อื่นๆ: " + otherText;
        } else {
            showStatus("❌ กรุณาระบุรายละเอียดในช่อง 'อื่นๆ'", false);
            return;
        }
    } else if (additionalInfo === "") {
        showStatus("❌ กรุณาเลือกอุปกรณ์เพิ่มเติม", false);
        return;
    }

    if (!room) {
        showStatus("❌ กรุณาเลือกห้องประชุม", false);
        return;
    }

    if (startTime >= endTime) {
        showStatus("❌ เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุด", false);
        return;
    }

    if (!breakTime || breakTime === "") {
        showStatus("❌ กรุณาเลือกช่วงเวลาพัก", false);
        return;
    }

    if (purpose.length < 5) {
        showStatus("❌ กรุณาระบุวัตถุประสงค์ให้ชัดเจน (อย่างน้อย 5 ตัวอักษร)", false);
        return;
    }

    // ✅ ตรวจสอบเวลาซ้อนทับและที่นั่งเต็ม
    toggleLoading(true);

    try {
        // โหลดข้อมูลการจองทั้งหมดจาก API
        const scriptURL = "https://script.google.com/macros/s/AKfycbxyAF2s2dtvV9T7eGffmDbP2QkmMYiNEsT3tKDRmxhi6pRNtq74aAJCwjmL1Zj-Ec3uPg/exec";
        const response = await fetch(scriptURL);
        const allData = await response.json();

        if (!Array.isArray(allData)) {
            throw new Error('ไม่สามารถโหลดข้อมูลการจองได้');
        }

        // กรองเฉพาะการจองในวันและห้องเดียวกัน
        const sameRoomBookings = allData.filter(booking => {
            const bookDate = formatDateString(booking.bookingDate);
            return bookDate === bookingDate && booking.room === room.value;
        });

        // ✅ 1. ตรวจสอบเวลาซ้อนทับ
        const hasTimeConflict = sameRoomBookings.some(booking => {
            const existingStart = booking.startTime;
            const existingEnd = booking.endTime;

            // ตรวจสอบว่าเวลาซ้อนทับหรือไม่
            const isOverlapping = (
                (startTime >= existingStart && startTime < existingEnd) ||
                (endTime > existingStart && endTime <= existingEnd) ||
                (startTime <= existingStart && endTime >= existingEnd)
            );

            if (isOverlapping) {
                console.log('⚠️ เวลาซ้อนทับกับ:', booking);
            }

            return isOverlapping;
        });

        if (hasTimeConflict) {
            toggleLoading(false);
            showStatus(`❌ ไม่สามารถจองได้! ห้อง${room.value}มีคนจองในช่วงเวลา ${startTime}-${endTime} น. แล้ว`, false);
            return;
        }

        // ✅ 2. ตรวจสอบจำนวนที่นั่ง
        const totalBookedSeats = sameRoomBookings.reduce((sum, booking) => {
            return sum + (parseInt(booking.participants) || 0);
        }, 0);

        const roomCapacity = ROOM_CAPACITY[room.value];
        const remainingSeats = roomCapacity - totalBookedSeats;

        if (participants > remainingSeats) {
            toggleLoading(false);
            showStatus(`❌ ที่นั่งไม่พอ! ${room.value} เหลือที่นั่งเพียง ${remainingSeats} ที่ แต่คุณต้องการจอง ${participants} ที่`, false);
            return;
        }

        // ✅ ผ่านการตรวจสอบทั้งหมด ส่งข้อมูล
        const params = new URLSearchParams();
        params.append("fullName", fullName);
        params.append("email", email);
        params.append("department", department);
        params.append("participants", participants);
        params.append("bookingDate", bookingDate);
        params.append("startTime", startTime);
        params.append("endTime", endTime);
        params.append("purpose", purpose);
        params.append("additionalInfo", additionalInfo);
        params.append("room", room.value);
        params.append("breakTime", breakTime);
        params.append("timestamp", new Date().toISOString());

        submitForm(params);

    } catch (error) {
        toggleLoading(false);
        showStatus("❌ เกิดข้อผิดพลาดในการตรวจสอบข้อมูล: " + error.message, false);
        console.error('Validation error:', error);
    }

    
});

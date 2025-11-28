
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
    }


    function submitForm(formData) {
      const scriptURL = 'https://script.google.com/macros/library/d/1Q5jNjuFAbe_rdvJc7cXTwncGcowLqdsiPMzhzEXI1CdMz2FF017ouE6U/1';


      toggleLoading(true);


      fetch(scriptURL, {
        method: 'POST',
        body: formData
      })
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error('เกิดข้อผิดพลาดในการส่งข้อมูล');
          }
        })
        .then(data => {
          toggleLoading(false);
          if (data.result === 'success') {
            showStatus('ส่งข้อมูลสำเร็จ! ข้อมูลของคุณได้รับการบันทึกแล้ว', true);
            document.getElementById('bookingForm').reset();
          } else {
            throw new Error(data.message);
          }
        })
        .catch(error => {
          toggleLoading(false);
          console.error('Error:', error);
          showStatus('เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message, false);
        });
    }


    document.getElementById('bookingForm').addEventListener('submit', function (e) {
      e.preventDefault();


      const fullName = document.getElementById('fullName').value;
      const email = document.getElementById('email').value;
      const department = document.getElementById('department').value;
      const participants = document.getElementById('participants').value;
      const bookingDate = document.getElementById('bookingDate').value;
      const startTime = document.getElementById('startTime').value;
      const endTime = document.getElementById('endTime').value;
      const purpose = document.getElementById('purpose').value;
      const room = document.querySelector('input[name="room"]:checked');
      const additionalInfo = document.getElementById('additionalInfo').value;


      if (!room) {
        showStatus('กรุณาเลือกห้องประชุม', false);
        return;
      }


      const today = new Date().toISOString().split('T')[0];
      if (bookingDate < today) {
        showStatus('ไม่สามารถจองวันที่ในอดีตได้', false);
        return;
      }


      if (startTime >= endTime) {
        showStatus('เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุด', false);
        return;
      }


      const formData = new FormData();
      formData.append('fullName', fullName);
      formData.append('email', email);
      formData.append('department', department);
      formData.append('participants', participants);
      formData.append('bookingDate', bookingDate);
      formData.append('startTime', startTime);
      formData.append('endTime', endTime);
      formData.append('purpose', purpose);
      formData.append('room', room.value);
      formData.append('additionalInfo', additionalInfo);
      formData.append('timestamp', new Date().toISOString());


      submitForm(formData);
    });


    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('bookingDate').min = tomorrow.toISOString().split('T')[0];

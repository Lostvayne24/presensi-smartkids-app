import React, { useState, useEffect } from 'react';
import { getStudentsDetail, getClasses, saveMultipleAttendance } from '../services/database';

const AttendanceForm = ({ user, onSuccess, allowManualDate = false, tutors = [], enableTutorSelection = false }) => {
  const [sessionForm, setSessionForm] = useState({
    date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0],
    educationLevel: '',
    classType: '',
    location: '',
    timeStart: '',
    timeEnd: '',
    status: 'Hadir',
    tutor: user.name || ''
  });

  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // STATE BARU: Untuk sistem sesi dan draft
  const [currentStudent, setCurrentStudent] = useState('');
  const [currentNotes, setCurrentNotes] = useState('');
  const [draftAttendances, setDraftAttendances] = useState([]);
  const [activeSession, setActiveSession] = useState(null);

  // STATE UNTUK OPSI WAKTU
  const [useCustomTime, setUseCustomTime] = useState(false);
  const [customTimeStart, setCustomTimeStart] = useState('');
  const [customTimeEnd, setCustomTimeEnd] = useState('');

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const studentList = await getStudentsDetail();
        const classList = getClasses();
        // Filter out deleted students if getStudentsDetail includes them (it has a param or defaults)
        // Check `getStudentsDetail` impl: defaults to !isDeleted. Good.
        // We need to keep full objects.
        setStudents(studentList);
        setFilteredStudents(studentList);
        setClasses(classList);
      } catch (error) {
        console.error('Error loading initial data:', error);
        setStudents([]);
        setFilteredStudents([]);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Generate time slots berdasarkan tingkat pendidikan
  const generateTimeSlots = (educationLevel) => {
    const slots = [];

    // Range waktu: 07:00 - 22:00
    const startHour = 7;
    const endHourLimit = 22; // Batas akhir kegiatan

    if (educationLevel === 'TK') {
      // TK: 60 menit duration
      for (let hour = startHour; hour < endHourLimit; hour++) {
        for (let minute of ['00', '30']) {
          const startTime = `${hour.toString().padStart(2, '0')}:${minute}`;

          // Fix duration 60 menit: jam + 1, menit sama
          const nextHour = hour + 1;
          const endTime = `${nextHour.toString().padStart(2, '0')}:${minute}`;

          // Pastikan tidak melebihi batas waktu (opsional, sesuaikan kebutuhan)
          if (nextHour <= endHourLimit || (nextHour === endHourLimit && minute === '00')) {
            slots.push({
              value: `${startTime}-${endTime}`,
              label: `${startTime} - ${endTime}`,
              start: startTime,
              end: endTime
            });
          }
        }
      }
    } else {
      // SD, SMP, SMA, Umum: 90 menit duration
      for (let hour = startHour; hour < endHourLimit; hour++) {
        for (let minute of ['00', '30']) {
          const startTime = `${hour.toString().padStart(2, '0')}:${minute}`;

          let calcEndHour = hour;
          let calcEndMinute = parseInt(minute) + 90;

          if (calcEndMinute >= 60) {
            calcEndHour += Math.floor(calcEndMinute / 60);
            calcEndMinute = calcEndMinute % 60;
          }

          const endTime = `${calcEndHour.toString().padStart(2, '0')}:${calcEndMinute.toString().padStart(2, '0')}`;

          // Filter jika waktu selesai melebihi batas yang wajar (misal lewat dari 22:00 atau 23:00)
          // Di sini kita izinkan sampai sedikit lewat 22:00 jika startnya masih wajar (misal start 20:30 -> 22:00)
          if (calcEndHour < endHourLimit || (calcEndHour === endHourLimit && calcEndMinute === 0)) {
            slots.push({
              value: `${startTime}-${endTime}`,
              label: `${startTime} - ${endTime}`,
              start: startTime,
              end: endTime
            });
          } else if (calcEndHour === endHourLimit && calcEndMinute <= 30) {
            // Toleransi sampai 22:30? Jika user minta strict max 22:00, sesuaikan.
            // User request: "sampai 10 malam" (22:00).
            // Jika start 20:30 -> 22:00. Pas.
            slots.push({
              value: `${startTime}-${endTime}`,
              label: `${startTime} - ${endTime}`,
              start: startTime,
              end: endTime
            });
          }
        }
      }
    }

    return slots;
  };

  // Filter students berdasarkan input
  const filterStudents = (searchTerm) => {
    if (!Array.isArray(students)) {
      console.warn('Students is not an array:', students);
      setFilteredStudents([]);
      return;
    }

    if (!searchTerm) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student =>
      student && student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  };

  const handleStudentInputChange = (e) => {
    const value = e.target.value;
    setCurrentStudent(value);
    filterStudents(value);
    setShowStudentDropdown(true);
  };

  const handleStudentSelect = (student) => {
    // Validasi Status Siswa
    if (student.status === 'Cuti') {
      alert(`Siswa ${student.name} sedang CUTI. Tidak dapat dipilih.`);
      return;
    }
    if (student.status === 'Off') {
      alert(`Siswa ${student.name} statusnya OFF. Tidak dapat dipilih.`);
      return;
    }

    setCurrentStudent(student.name);
    setShowStudentDropdown(false);
  };

  // HANDLER BARU: Untuk opsi waktu
  const handleTimeOptionChange = (e) => {
    const useCustom = e.target.value === 'custom';
    setUseCustomTime(useCustom);

    if (!useCustom) {
      // Reset ke waktu preset
      setSessionForm(prev => ({
        ...prev,
        timeStart: '',
        timeEnd: ''
      }));
      setCustomTimeStart('');
      setCustomTimeEnd('');
    } else {
      // Gunakan waktu custom
      setSessionForm(prev => ({
        ...prev,
        timeStart: customTimeStart,
        timeEnd: customTimeEnd
      }));
    }
  };

  const handleCustomTimeChange = (field, value) => {
    if (field === 'start') {
      setCustomTimeStart(value);
      if (useCustomTime) {
        setSessionForm(prev => ({
          ...prev,
          timeStart: value
        }));
      }
    } else {
      setCustomTimeEnd(value);
      if (useCustomTime) {
        setSessionForm(prev => ({
          ...prev,
          timeEnd: value
        }));
      }
    }
  };

  const handleTimeSlotChange = (e) => {
    const selectedValue = e.target.value;
    if (selectedValue) {
      const selectedSlot = availableTimeSlots.find(slot => slot.value === selectedValue);
      if (selectedSlot) {
        setSessionForm({
          ...sessionForm,
          timeStart: selectedSlot.start,
          timeEnd: selectedSlot.end
        });
      }
    } else {
      setSessionForm({
        ...sessionForm,
        timeStart: '',
        timeEnd: ''
      });
    }
  };

  const handleSessionFormChange = (e) => {
    const { name, value } = e.target;

    setSessionForm({
      ...sessionForm,
      [name]: value
    });

    // Jika tingkat pendidikan berubah, generate time slots baru
    if (name === 'educationLevel') {
      const slots = generateTimeSlots(value);
      setAvailableTimeSlots(slots);

      // LOGIC BARU: Cek jika ada sesi aktif/draft
      if (draftAttendances.length > 0 && activeSession) {
        // Pertahankan waktu dari sesi aktif
        setSessionForm(prev => ({
          ...prev,
          educationLevel: value,
          timeStart: activeSession.timeStart,
          timeEnd: activeSession.timeEnd
        }));

        // Aktifkan mode custom agar waktu tidak hilang
        setUseCustomTime(true);
        setCustomTimeStart(activeSession.timeStart);
        setCustomTimeEnd(activeSession.timeEnd);
      } else {
        // Default: Reset waktu
        setSessionForm(prev => ({
          ...prev,
          educationLevel: value,
          timeStart: '',
          timeEnd: ''
        }));
        setUseCustomTime(false);
        setCustomTimeStart('');
        setCustomTimeEnd('');
      }
    }
  };

  // FUNGSI BARU: Tambah siswa ke draft sesi aktif
  // FUNGSI BARU: Tambah siswa ke draft sesi aktif
  const addStudentToDraft = () => {
    // Validasi Kelengkapan Data Sesi
    const requiredFields = [
      { key: 'date', label: 'Tanggal' },
      { key: 'educationLevel', label: 'Tingkat Pendidikan' },
      { key: 'classType', label: 'Jenis Kelas' },
      { key: 'location', label: 'Tempat' },
      { key: 'status', label: 'Status Kehadiran' }
    ];

    for (const field of requiredFields) {
      if (!sessionForm[field.key]) {
        alert(`Mohon isi ${field.label} terlebih dahulu.`);
        return;
      }
    }

    // Validasi Tutor (jika seleksi tutor aktif)
    if (enableTutorSelection && !sessionForm.tutor) {
      alert('Mohon pilih Tutor terlebih dahulu.');
      return;
    }

    // Validasi Waktu
    if (!sessionForm.timeStart || !sessionForm.timeEnd) {
      alert('Harap set waktu sesi terlebih dahulu');
      return;
    }

    // Validasi Siswa
    if (!currentStudent) {
      alert('Harap pilih siswa terlebih dahulu');
      return;
    }

    const newAttendance = {
      id: Date.now() + Math.random(), // ID sementara untuk draft
      date: sessionForm.date,
      educationLevel: sessionForm.educationLevel,
      classType: sessionForm.classType,
      location: sessionForm.location,
      timeStart: sessionForm.timeStart,
      timeEnd: sessionForm.timeEnd,
      timeSlot: `${sessionForm.timeStart}-${sessionForm.timeEnd}`,
      studentName: currentStudent,
      status: sessionForm.status,
      notes: currentNotes,
      tutor: sessionForm.tutor || user.name,
      timestamp: new Date().toISOString(),
      isDraft: true
    };

    setDraftAttendances(prev => [...prev, newAttendance]);
    setCurrentStudent('');
    setCurrentNotes('');
    setShowStudentDropdown(false);

    // Set sesi aktif jika belum ada
    if (!activeSession) {
      setActiveSession({
        timeStart: sessionForm.timeStart,
        timeEnd: sessionForm.timeEnd,
        timeSlot: `${sessionForm.timeStart}-${sessionForm.timeEnd}`,
        educationLevel: sessionForm.educationLevel,
        classType: sessionForm.classType,
        location: sessionForm.location
      });
    }
  };

  // FUNGSI BARU: Hapus siswa dari draft
  const removeStudentFromDraft = (id) => {
    setDraftAttendances(prev => prev.filter(item => item.id !== id));
  };

  // FUNGSI BARU: Mulai sesi baru
  const startNewSession = () => {
    if (draftAttendances.length > 0) {
      if (!window.confirm('Sesi saat ini masih memiliki draft. Yakin ingin mulai sesi baru?')) {
        return;
      }
    }

    setSessionForm({
      date: sessionForm.date, // Pertahankan tanggal
      educationLevel: '',
      classType: '',
      location: '',
      timeStart: '',
      timeEnd: '',
      status: 'Hadir',
      tutor: enableTutorSelection ? (sessionForm.tutor || user.name) : user.name
    });
    setActiveSession(null);
    setAvailableTimeSlots([]);
    setUseCustomTime(false);
    setCustomTimeStart('');
    setCustomTimeEnd('');
  };

  // FUNGSI BARU: Simpan semua draft
  const saveAllDrafts = async () => {
    if (draftAttendances.length === 0) {
      alert('Tidak ada data presensi untuk disimpan');
      return;
    }

    try {
      setLoading(true);

      // Siapkan data untuk disimpan (hapus properti sementara)
      const attendancesToSave = draftAttendances.map(attendance => {
        const { id, isDraft, ...attendanceToSave } = attendance;
        return attendanceToSave;
      });

      // Gunakan fungsi bulk save yang baru
      const result = await saveMultipleAttendance(attendancesToSave);

      if (result.success) {
        alert(`Berhasil menyimpan ${draftAttendances.length} data presensi!`);

        // Reset semua state
        setDraftAttendances([]);
        setActiveSession(null);
        setSessionForm({
          date: new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0],
          educationLevel: '',
          classType: '',
          location: '',
          timeStart: '',
          timeEnd: '',
          status: 'Hadir',
          tutor: enableTutorSelection ? (sessionForm.tutor || user.name) : user.name
        });
        setCurrentStudent('');
        setCurrentNotes('');
        setUseCustomTime(false);
        setCustomTimeStart('');
        setCustomTimeEnd('');
        setAvailableTimeSlots([]);

        if (onSuccess) onSuccess();
      } else {
        // Tampilkan detail error
        const failedRecords = result.results?.filter(r => !r.success) || [];
        if (failedRecords.length > 0) {
          alert(`Gagal menyimpan ${failedRecords.length} dari ${draftAttendances.length} data. Silakan coba lagi.`);
        } else {
          alert('Gagal menyimpan data presensi: ' + result.error);
        }
      }
    } catch (error) {
      console.error('Error saving attendances:', error);
      alert('Gagal menyimpan presensi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // FUNGSI BARU: Group draft berdasarkan sesi
  const getDraftsBySession = () => {
    const groups = {};
    draftAttendances.forEach(attendance => {
      const sessionKey = `${attendance.timeStart}-${attendance.timeEnd}`;
      if (!groups[sessionKey]) {
        groups[sessionKey] = [];
      }
      groups[sessionKey].push(attendance);
    });
    return groups;
  };

  const draftGroups = getDraftsBySession();

  return (
    <div className="attendance-form">
      <h3>Form Presensi Berdasarkan Sesi</h3>
      {loading && <div className="loading">Memuat data siswa...</div>}

      {/* Form Sesi */}
      <div className="session-form-section">
        <h4>Setting Sesi</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Tanggal:</label>
            <input
              type="date"
              name="date"
              value={sessionForm.date}
              onChange={handleSessionFormChange}
              readOnly={!allowManualDate}
              className={!allowManualDate ? "readonly-date" : "form-control"}
            />
          </div>

          <div className="form-group">
            <label>Tingkat Pendidikan:</label>
            <select
              name="educationLevel"
              value={sessionForm.educationLevel}
              onChange={handleSessionFormChange}
              required
            >
              <option value="">Pilih Tingkat</option>
              <option value="TK">TK</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
              <option value="Umum">Umum</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Jenis Kelas:</label>
            <select
              name="classType"
              value={sessionForm.classType}
              onChange={handleSessionFormChange}
              required
            >
              <option value="">Pilih Kelas</option>
              {classes.map((cls, index) => (
                <option key={index} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tempat:</label>
            <select
              name="location"
              value={sessionForm.location}
              onChange={handleSessionFormChange}
              required
            >
              <option value="">Pilih Tempat</option>
              <option value="Rumah Kuning">Rumah Kuning</option>
              <option value="Sapphire">Sapphire</option>
              <option value="Private di Rumah Siswa">Private di Rumah Siswa</option>
            </select>
          </div>
        </div>


        {/* KOLOM TUTOR (KHUSUS ADMIN) */}
        {enableTutorSelection && (
          <div className="form-row">
            <div className="form-group">
              <label>Tutor:</label>
              <select
                name="tutor"
                value={sessionForm.tutor}
                onChange={handleSessionFormChange}
                required
              >
                <option value="">Pilih Tutor</option>
                {tutors && tutors.length > 0 ? (
                  tutors.map((t, index) => (
                    <option key={index} value={t.name}>{t.name}</option>
                  ))
                ) : (
                  <option value={user.name}>{user.name}</option>
                )}
              </select>
            </div>
          </div>
        )}

        {/* OPSI WAKTU - DENGAN 2 PILIHAN */}
        <div className="form-row">
          <div className="form-group time-selection-group">
            <label>Waktu Sesi:</label>

            {/* Toggle Opsi Waktu */}
            <div className="time-option-toggle">
              <label>
                <input
                  type="radio"
                  name="timeOption"
                  value="preset"
                  checked={!useCustomTime}
                  onChange={handleTimeOptionChange}
                />
                Pilih dari Opsi
              </label>
              <label>
                <input
                  type="radio"
                  name="timeOption"
                  value="custom"
                  checked={useCustomTime}
                  onChange={handleTimeOptionChange}
                />
                Input Manual
              </label>
            </div>

            {/* Opsi Preset Time Slots */}
            {!useCustomTime && (
              <div className="preset-time-section">
                <select
                  name="timeSlot"
                  value={`${sessionForm.timeStart}-${sessionForm.timeEnd}`}
                  onChange={handleTimeSlotChange}
                  required
                  disabled={!sessionForm.educationLevel}
                >
                  <option value="">Pilih Waktu Sesi</option>
                  {availableTimeSlots.map((slot, index) => (
                    <option key={index} value={slot.value}>{slot.label}</option>
                  ))}
                </select>
                {!sessionForm.educationLevel && (
                  <small className="form-hint">Pilih tingkat pendidikan terlebih dahulu</small>
                )}
                {sessionForm.timeStart && sessionForm.timeEnd && (
                  <div className="selected-time-info">
                    <small>Terpilih: <strong>{sessionForm.timeStart} - {sessionForm.timeEnd}</strong></small>
                  </div>
                )}
              </div>
            )}

            {/* Opsi Custom Time Input */}
            {useCustomTime && (
              <div className="custom-time-section">
                <div className="custom-time-inputs">
                  <div className="time-input-group">
                    <label>Dari Jam:</label>
                    <input
                      type="time"
                      value={customTimeStart}
                      onChange={(e) => handleCustomTimeChange('start', e.target.value)}
                      required
                    />
                  </div>
                  <div className="time-input-group">
                    <label>Sampai Jam:</label>
                    <input
                      type="time"
                      value={customTimeEnd}
                      onChange={(e) => handleCustomTimeChange('end', e.target.value)}
                      required
                    />
                  </div>
                </div>
                {customTimeStart && customTimeEnd && (
                  <div className="selected-time-info">
                    <small>Waktu Manual: <strong>{customTimeStart} - {customTimeEnd}</strong></small>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Status Default:</label>
            <select
              name="status"
              value={sessionForm.status}
              onChange={handleSessionFormChange}
              required
            >
              <option value="Hadir">Hadir</option>
              <option value="Tidak Hadir">Tidak Hadir</option>
              <option value="Izin">Izin</option>
              <option value="Sakit">Sakit</option>
            </select>
          </div>
        </div>

        <div className="session-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={startNewSession}
            disabled={!sessionForm.timeStart}
          >
            Sesi Baru
          </button>
        </div>
      </div>

      {/* Form Input Siswa */}
      {
        sessionForm.timeStart && sessionForm.timeEnd && (
          <div className="student-input-section">
            <h4>
              Tambah Siswa ke Sesi: {sessionForm.timeStart} - {sessionForm.timeEnd}
              {activeSession && ` (${draftAttendances.filter(d =>
                d.timeStart === activeSession.timeStart && d.timeEnd === activeSession.timeEnd
              ).length} siswa)`}
            </h4>

            <div className="form-row">
              <div className="form-group">
                <label>Nama Siswa:</label>
                <div className="searchable-dropdown">
                  <input
                    type="text"
                    value={currentStudent}
                    onChange={handleStudentInputChange}
                    onFocus={() => setShowStudentDropdown(true)}
                    placeholder="Ketik nama siswa atau pilih dari daftar"
                    required
                    disabled={loading}
                  />
                  {showStudentDropdown && Array.isArray(filteredStudents) && filteredStudents.length > 0 && (
                    <div className="dropdown-list">
                      {filteredStudents.map((student, index) => (
                        <div
                          key={index}
                          className="student-option"
                          onClick={() => handleStudentSelect(student)}
                        >
                          <div className="student-name">{student.name}</div>
                          <div className="student-info">
                            {student.class && <span className="student-class">{student.class}</span>}
                            {student.status && student.status !== 'Aktif' && (
                              <span className={`status-badge-small ${student.status.toLowerCase()}`}>
                                {student.status}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showStudentDropdown && Array.isArray(filteredStudents) && filteredStudents.length === 0 && currentStudent && (
                    <div className="dropdown-list">
                      <div className="dropdown-item no-results">Tidak ada siswa yang cocok</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Catatan:</label>
                <input
                  type="text"
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  placeholder="Catatan khusus untuk siswa ini..."
                />
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={addStudentToDraft}
              disabled={!currentStudent}
            >
              Tambah ke Draft
            </button>
          </div>
        )
      }

      {/* Daftar Draft */}
      {
        draftAttendances.length > 0 && (
          <div className="draft-section">
            <h4>Draft Presensi ({draftAttendances.length} siswa)</h4>

            {Object.entries(draftGroups).map(([sessionKey, attendances]) => (
              <div key={sessionKey} className="session-draft-group">
                <h5>Sesi: {sessionKey} ({attendances.length} siswa)</h5>
                <div className="draft-list">
                  {attendances.map((attendance, index) => (
                    <div key={attendance.id} className="draft-item">
                      <div className="draft-info">
                        <span className="student-name">{attendance.studentName}</span>
                        <span className="session-info">
                          {attendance.classType} - {attendance.location} - {attendance.educationLevel}
                        </span>
                        {attendance.notes && (
                          <span className="notes">Catatan: {attendance.notes}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        className="btn-remove"
                        onClick={() => removeStudentFromDraft(attendance.id)}
                      >
                        Hapus
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="draft-actions">
              <button
                type="button"
                className="btn-save-all"
                onClick={saveAllDrafts}
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : `Simpan Semua (${draftAttendances.length})`}
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default AttendanceForm;
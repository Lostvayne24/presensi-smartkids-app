// components/AttendanceTable.js
import React, { useState } from 'react';
import { deleteAttendance, updateAttendance, deleteAllAttendance, getClasses } from '../services/database';

const AttendanceTable = ({ data, onUpdate, isAdmin = false, onAdd }) => {
  // State for inline editing
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    status: '',
    notes: '',
    timeStart: '',
    timeEnd: '',
    studentName: '',
    classType: '',
    location: '',
    educationLevel: ''
  });

  // State for filtering
  const [filterType, setFilterType] = useState('daily'); // 'daily', 'range', 'all'
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Validasi data sebelum digunakan
  const rawAttendanceData = Array.isArray(data) ? data : [];

  // Filter Data Logic
  const getFilteredData = () => {
    let filtered = [...rawAttendanceData];

    if (filterType === 'daily') {
      filtered = filtered.filter(item => item.date === startDate);
    } else if (filterType === 'range') {
      filtered = filtered.filter(item => {
        return item.date >= startDate && item.date <= endDate;
      });
    }
    // if 'all', return everything (no filter)

    // Sort by date descending (newest first)
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const attendanceData = getFilteredData();

  // Helper check if date is today
  const isToday = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  // FUNGSI BARU: Format waktu untuk display yang lebih baik
  const formatTimeSlot = (item) => {
    if (item.timeStart && item.timeEnd) {
      return `${item.timeStart} - ${item.timeEnd} `;
    }
    if (item.timeSlot) {
      return item.timeSlot;
    }
    return '-';
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setEditForm({
      status: item.status || 'Hadir',
      notes: item.notes || '',
      timeStart: item.timeStart || '',
      timeEnd: item.timeEnd || '',
      studentName: item.studentName || '',
      classType: item.classType || '',
      location: item.location || '',
      educationLevel: item.educationLevel || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      status: '',
      notes: '',
      timeStart: '',
      timeEnd: '',
      studentName: '',
      classType: '',
      location: '',
      educationLevel: ''
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      if (!editForm.studentName || !editForm.classType || !editForm.location) {
        alert('Nama, Kelas, dan Tempat harus diisi');
        return;
      }

      const updates = {
        status: editForm.status,
        notes: editForm.notes,
        studentName: editForm.studentName,
        classType: editForm.classType,
        location: editForm.location,
        timeStart: editForm.timeStart,
        timeEnd: editForm.timeEnd,
        timeSlot: `${editForm.timeStart} -${editForm.timeEnd} `,
        educationLevel: editForm.educationLevel
      };

      const success = await updateAttendance(id, updates);
      if (success) {
        setEditingId(null);
        onUpdate();
      } else {
        alert('Gagal mengupdate data');
      }
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Terjadi kesalahan saat menyimpan');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      const success = await deleteAttendance(id);
      if (success) {
        // Jika sedang edit row ini, batalkan
        if (editingId === id) handleCancelEdit();
        onUpdate();
      } else {
        alert('Gagal menghapus data presensi');
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    const success = await updateAttendance(id, { status: newStatus });
    if (success) {
      onUpdate();
    } else {
      alert('Gagal mengupdate status presensi');
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data presensi yang ditampilkan saat ini? Tindakan ini tidak dapat dibatalkan.')) {
      try {
        // Hapus data yang sedang ditampilkan (filtered)
        const idsToDelete = attendanceData.map(item => item.id);
        if (idsToDelete.length === 0) {
          alert('Tidak ada data untuk dihapus');
          return;
        }

        await deleteAllAttendance(idsToDelete);
        alert(`Berhasil menghapus ${idsToDelete.length} data presensi.`);
        if (onUpdate) onUpdate();
      } catch (error) {
        console.error('Error deleting all attendance:', error);
        alert('Gagal menghapus semua data presensi: ' + error.message);
      }
    }
  };

  // Early return for invalid data only
  if (!Array.isArray(data)) {
    console.error('Data is not an array:', data);
    return (
      <div className="attendance-table">
        <h3>Data Presensi</h3>
        <div className="error-message">
          <p>Terjadi kesalahan dalam memuat data presensi</p>
          <small>Data format tidak valid</small>
        </div>
      </div>
    );
  }



  // Predefined options for dropdowns (could be props or context)
  const classOptions = getClasses();

  const locationOptions = [
    'Rumah Kuning', 'Sapphire', 'Private di Rumah Siswa'
  ];

  return (
    <div className="attendance-table">
      <div className="filter-card">
        <div className="filter-header">
          <h4>
            <span>🔍</span> Filter Data Presensi
          </h4>
        </div>

        <div className="filter-controls">
          <div className="filter-buttons">
            <button
              onClick={() => setFilterType('daily')}
              className={`filter-btn ${filterType === 'daily' ? 'active' : ''}`}
            >
              Harian
            </button>
            <button
              onClick={() => setFilterType('range')}
              className={`filter-btn ${filterType === 'range' ? 'active' : ''}`}
            >
              Rentang Tanggal
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
            >
              Semua Data
            </button>
          </div>

          <div className="date-inputs-container">
            {filterType === 'daily' && (
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            )}

            {filterType === 'range' && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="date-separator">s/d</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </>
            )}
          </div>
        </div>
      </div>



      {
        attendanceData.length === 0 ? (
          <div className="no-data" style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
            Tidak ada data presensi untuk filter yang dipilih
          </div>
        ) : (
          <>
            <div className="table-header-actions">
              <h3>Data Presensi ({attendanceData.length} data)</h3>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="add-btn"
                    onClick={onAdd}
                    style={{ backgroundColor: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    + Tambah Presensi
                  </button>
                  {attendanceData.length > 0 && (
                    <button
                      className="delete-all-btn"
                      onClick={handleDeleteAll}
                      style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      Hapus Semua Data
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Hari/Tanggal</th>
                    <th>Tingkat</th>
                    <th>Kelas</th>
                    <th>Nama Siswa</th>
                    <th>Tutor</th>
                    <th>Tempat</th>
                    <th>Waktu</th>
                    <th>Status</th>
                    <th>Catatan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceData.map((item, index) => {
                    const editable = isAdmin || isToday(item.date);
                    const isEditing = editingId === item.id;

                    return (
                      <tr key={item.id || index} className={isEditing ? 'editing-row' : ''}>
                        <td>{index + 1}</td>
                        <td>
                          {item.date ? new Date(item.date).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : '-'}
                        </td>

                        {/* Tingkat Pendidikan */}
                        <td>
                          {isEditing ? (
                            <select
                              value={editForm.educationLevel}
                              onChange={(e) => setEditForm({ ...editForm, educationLevel: e.target.value })}
                              className="edit-input"
                            >
                              <option value="">Pilih</option>
                              {['TK', 'SD', 'SMP', 'SMA', 'Umum'].map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (item.educationLevel || '-')}
                        </td>

                        {/* Kelas */}
                        <td>
                          {isEditing ? (
                            <select
                              value={editForm.classType}
                              onChange={(e) => setEditForm({ ...editForm, classType: e.target.value })}
                              className="edit-input"
                            >
                              <option value="">Pilih</option>
                              {!classOptions.includes(editForm.classType) && editForm.classType && (
                                <option value={editForm.classType}>{editForm.classType}</option>
                              )}
                              {classOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (item.classType || '-')}
                        </td>

                        {/* Nama Siswa */}
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.studentName}
                              onChange={(e) => setEditForm({ ...editForm, studentName: e.target.value })}
                              className="edit-input"
                              placeholder="Nama Siswa"
                            />
                          ) : (item.studentName || '-')}
                        </td>

                        <td>{item.tutor || '-'}</td>

                        {/* Tempat */}
                        <td>
                          {isEditing ? (
                            <select
                              value={editForm.location}
                              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                              className="edit-input"
                            >
                              <option value="">Pilih</option>
                              {locationOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (item.location || '-')}
                        </td>

                        {/* Waktu */}
                        <td>
                          {isEditing ? (
                            <div className="time-edit-container">
                              <input
                                type="time"
                                value={editForm.timeStart}
                                onChange={(e) => setEditForm({ ...editForm, timeStart: e.target.value })}
                                className="edit-input-time"
                              />
                              <span>-</span>
                              <input
                                type="time"
                                value={editForm.timeEnd}
                                onChange={(e) => setEditForm({ ...editForm, timeEnd: e.target.value })}
                                className="edit-input-time"
                              />
                            </div>
                          ) : formatTimeSlot(item)}
                        </td>

                        {/* Status */}
                        <td>
                          {isEditing ? (
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="edit-input"
                            >
                              <option value="Hadir">Hadir</option>
                              <option value="Tidak Hadir">Tidak Hadir</option>
                              <option value="Izin">Izin</option>
                              <option value="Sakit">Sakit</option>
                            </select>
                          ) : (
                            isAdmin ? (
                              <select
                                value={item.status || 'Hadir'}
                                onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              >
                                <option value="Hadir">Hadir</option>
                                <option value="Tidak Hadir">Tidak Hadir</option>
                                <option value="Izin">Izin</option>
                                <option value="Sakit">Sakit</option>
                              </select>
                            ) : (
                              <div className="status-display">
                                {item.status || '-'}
                              </div>
                            )
                          )}
                        </td>

                        {/* Catatan */}
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editForm.notes}
                              onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                              className="edit-input"
                            />
                          ) : (
                            item.notes || '-'
                          )}
                        </td>

                        {/* Aksi */}
                        <td>
                          <div className="action-buttons" style={{ display: 'flex', gap: '5px' }}>
                            {isEditing ? (
                              <>
                                <button
                                  onClick={() => handleSaveEdit(item.id)}
                                  style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              editable && (
                                <>
                                  <button
                                    className="edit-btn"
                                    onClick={() => handleEditClick(item)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="delete-btn"
                                    onClick={() => handleDelete(item.id)}
                                    disabled={!item.id}
                                  >
                                    Hapus
                                  </button>
                                </>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
    </div>
  );
};

export default AttendanceTable;
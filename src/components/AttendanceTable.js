// components/AttendanceTable.js
import React, { useState } from 'react';
import { deleteAttendance, updateAttendance, deleteAllAttendance } from '../services/database';

const AttendanceTable = ({ data, onUpdate, isAdmin = false }) => {
  // State for inline editing
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    status: '',
    notes: '',
    timeStart: '',
    timeEnd: '',
    studentName: '',
    classType: '',
    location: ''
  });

  // Validasi data sebelum digunakan
  const attendanceData = Array.isArray(data) ? data : [];

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
      return `${item.timeStart} - ${item.timeEnd}`;
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
      location: item.location || ''
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
      location: ''
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
        timeSlot: `${editForm.timeStart}-${editForm.timeEnd}`
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
    if (window.confirm('Apakah Anda yakin ingin menghapus SEMUA data presensi?')) {
      const success = await deleteAllAttendance();
      if (success) {
        onUpdate();
      } else {
        alert('Gagal menghapus semua data');
      }
    }
  };

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

  if (attendanceData.length === 0) {
    return (
      <div className="attendance-table">
        <h3>Data Presensi</h3>
        <div className="no-data">Tidak ada data presensi</div>
      </div>
    );
  }

  // Predefined options for dropdowns (could be props or context)
  const classOptions = [
    'Private', 'Semi Private', 'Kelompok', 'Reguler', 'Online'
  ];

  const locationOptions = [
    'Rumah Kuning', 'Sapphire', 'Private di Rumah Siswa'
  ];

  return (
    <div className="attendance-table">
      <div className="table-header-actions">
        <h3>Data Presensi ({attendanceData.length} data)</h3>
        {isAdmin && attendanceData.length > 0 && (
          <button
            className="delete-all-btn"
            onClick={handleDeleteAll}
            style={{ backgroundColor: '#dc2626', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Hapus Semua Data
          </button>
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
    </div>
  );
};

export default AttendanceTable;
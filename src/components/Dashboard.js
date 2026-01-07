// components/Dashboard.js
import React, { useState, useEffect, useCallback } from 'react';
import { getAttendanceData } from '../services/database';
import { getAllUsers } from '../services/firebaseAuth';
import AttendanceTable from './AttendanceTable';
import ExportButtons from './ExportButtons';
import UserManagement from './UserManagement';
import StudentManagement from './StudentManagement';
import PaymentManagement from './PaymentManagement';
import AttendanceForm from './AttendanceForm';

const Dashboard = ({ user }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]); // DATA BARU: Untuk hasil pencarian
  const [tutors, setTutors] = useState([]);
  const [filters, setFilters] = useState({
    tutor: '',
    classType: '',
    educationLevel: '',
    location: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    studentName: ''
  });
  const [activeTab, setActiveTab] = useState('presensi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // STATE BARU: Untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // 20 data per halaman

  // STATE BARU: Daftar nama siswa unik untuk autocomplete
  const [studentNames, setStudentNames] = useState([]);

  // STATE BARU: Modal Tambah Presensi
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load daftar tutor dari sistem user management
  const loadTutors = useCallback(async () => {
    try {
      const userList = await getAllUsers();
      setTutors(Array.isArray(userList) ? userList : []);
    } catch (err) {
      console.error('Error loading tutors:', err);
      setTutors([]);
    }
  }, []);

  const loadAttendanceData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAttendanceData(filters);
      console.log('Dashboard loaded data:', data); // Debug log

      // SORTING: Urutkan berdasarkan tanggal dan waktu mulai
      let sortedData = Array.isArray(data) ? data : [];
      sortedData = sortedData.sort((a, b) => {
        // Urutkan berdasarkan tanggal (descending - terbaru dulu)
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;

        // Jika tanggal sama, urutkan berdasarkan waktu mulai
        const timeA = a.timeStart || a.timeSlot?.split('-')[0] || '';
        const timeB = b.timeStart || b.timeSlot?.split('-')[0] || '';

        if (timeA < timeB) return -1;
        if (timeA > timeB) return 1;

        return 0;
      });

      setAttendanceData(sortedData);
      setFilteredData(sortedData); // Set filtered data sama dengan data awal

      // EXTRACT NAMA SISWA UNIK untuk autocomplete
      const uniqueStudentNames = [...new Set(sortedData
        .map(item => item.studentName)
        .filter(name => name && name.trim() !== '')
      )].sort();
      setStudentNames(uniqueStudentNames);

      // Reset ke halaman 1 ketika data berubah
      setCurrentPage(1);
    } catch (err) {
      console.error('Error loading attendance data:', err);
      setError('Gagal memuat data presensi');
      setAttendanceData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // FUNGSI BARU: Filter data berdasarkan pencarian nama siswa
  const filterDataByStudentName = useCallback(() => {
    if (!filters.studentName.trim()) {
      setFilteredData(attendanceData);
    } else {
      const searchTerm = filters.studentName.toLowerCase();
      const filtered = attendanceData.filter(item =>
        item.studentName && item.studentName.toLowerCase().includes(searchTerm)
      );
      setFilteredData(filtered);
    }
    setCurrentPage(1); // Reset ke halaman 1 saat filter berubah
  }, [filters.studentName, attendanceData]);

  // EFFECT BARU: Jalankan filter setiap kali studentName atau attendanceData berubah
  useEffect(() => {
    filterDataByStudentName();
  }, [filterDataByStudentName]);

  useEffect(() => {
    loadTutors();
  }, [loadTutors]);

  useEffect(() => {
    if (activeTab === 'presensi') {
      loadAttendanceData();
    }
  }, [loadAttendanceData, activeTab]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  // FUNGSI BARU: Clear filter student name
  const clearStudentFilter = () => {
    setFilters({
      ...filters,
      studentName: ''
    });
  };

  // FUNGSI BARU: Untuk pagination - sekarang menggunakan filteredData
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const currentData = getCurrentPageData();

  // Pastikan stats menggunakan data yang valid - sekarang menggunakan filteredData
  const stats = {
    totalStudents: new Set(filteredData.map(item => item.studentName).filter(Boolean)).size,
    totalSessions: filteredData.length,
    presentCount: filteredData.filter(item => item.status === 'Hadir').length,
    absentCount: filteredData.filter(item => item.status === 'Tidak Hadir').length
  };

  const handleAddAttendance = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleAttendanceSuccess = () => {
    handleCloseModal();
    loadAttendanceData();
  };

  return (
    <div className="dashboard">
      <h2>Dashboard Admin</h2>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'presensi' ? 'active' : ''}`}
          onClick={() => setActiveTab('presensi')}
        >
          Data Presensi
        </button>
        <button
          className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
        >
          Data Siswa
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Manajemen User
        </button>
        <button
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Pembayaran
        </button>
      </div>

      {activeTab === 'presensi' ? (
        <>
          {/* Filter Section */}
          <div className="filters">
            {/* FILTER BARU: Pencarian Nama Siswa dengan ukuran yang lebih baik */}
            <div className="filter-group student-search-group">
              <label>Cari Nama Siswa:</label>
              <div className="searchable-input">
                <input
                  type="text"
                  name="studentName"
                  value={filters.studentName}
                  onChange={handleFilterChange}
                  placeholder="Ketik nama siswa untuk mencari..."
                  list="studentNamesList"
                  className="student-search-input"
                />
                {filters.studentName && (
                  <button
                    type="button"
                    className="clear-filter-btn"
                    onClick={clearStudentFilter}
                    title="Hapus Filter"
                  >
                    ×
                  </button>
                )}
                <datalist id="studentNamesList">
                  {studentNames.map((name, index) => (
                    <option key={index} value={name} />
                  ))}
                </datalist>
              </div>
              <small className="form-hint">
                {studentNames.length} siswa tersedia | {filteredData.length} data ditemukan
              </small>
            </div>

            <div className="filter-group">
              <label>Tutor:</label>
              <select name="tutor" value={filters.tutor} onChange={handleFilterChange}>
                <option value="">Semua Tutor</option>
                {tutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.name}>
                    {tutor.name}
                  </option>
                ))}
              </select>
              <small className="form-hint">
                {tutors.length} tutor tersedia
              </small>
            </div>

            {/* Filter lainnya tetap sama */}
            <div className="filter-group">
              <label>Jenis Kelas:</label>
              <select name="classType" value={filters.classType} onChange={handleFilterChange}>
                <option value="">Semua Kelas</option>
                <option value="Matematika">Matematika</option>
                <option value="Fisika">Fisika</option>
                <option value="Kimia">Kimia</option>
                <option value="Bahasa Inggris">Bahasa Inggris</option>
                <option value="Calistung">Calistung</option>
                <option value="IPA">IPA</option>
                <option value="Informatika">Informatika</option>
                <option value="IPA">IPS</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Tingkat Pendidikan:</label>
              <select name="educationLevel" value={filters.educationLevel} onChange={handleFilterChange}>
                <option value="">Semua Tingkat</option>
                <option value="TK">TK</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
                <option value="Umum">Umum</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Tempat:</label>
              <select name="location" value={filters.location} onChange={handleFilterChange}>
                <option value="">Semua Tempat</option>
                <option value="Rumah Kuning">Rumah Kuning</option>
                <option value="Sapphire">Sapphire</option>
                <option value="Private di Rumah Siswa">Private di Rumah Siswa</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Bulan:</label>
              <select name="month" value={filters.month} onChange={handleFilterChange}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Tahun:</label>
              <select name="year" value={filters.year} onChange={handleFilterChange}>
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={i} value={new Date().getFullYear() - 2 + i}>
                    {new Date().getFullYear() - 2 + i}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading && <div className="loading">Memuat data...</div>}
          {error && <div className="error-message">{error}</div>}

          {/* Statistics - sekarang menggunakan filteredData */}
          <div className="stats">
            <div className="stat-card">
              <h3>Total Siswa</h3>
              <p>{stats.totalStudents}</p>
            </div>
            <div className="stat-card">
              <h3>Total Sesi</h3>
              <p>{stats.totalSessions}</p>
            </div>
            <div className="stat-card">
              <h3>Hadir</h3>
              <p>{stats.presentCount}</p>
            </div>
            <div className="stat-card">
              <h3>Tidak Hadir</h3>
              <p>{stats.absentCount}</p>
            </div>
          </div>

          {/* Data Summary dengan Pagination Info - sekarang menggunakan filteredData */}
          <div className="data-summary">
            <p>
              Total: <strong>{filteredData.length}</strong> record |
              Halaman: <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> |
              Menampilkan: <strong>{currentData.length}</strong> data
              {filters.studentName && (
                <span className="filter-info">
                  | Filter aktif: <strong>"{filters.studentName}"</strong>
                  <button
                    className="clear-filter-text-btn"
                    onClick={clearStudentFilter}
                    title="Hapus filter"
                  >
                    ×
                  </button>
                </span>
              )}
            </p>
          </div>

          {/* Pagination Controls - Tampilkan jika ada lebih dari 1 halaman */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Sebelumnya
              </button>

              <span className="pagination-info">
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Selanjutnya →
              </button>
            </div>
          )}

          {/* Export Buttons - sekarang menggunakan filteredData */}
          <ExportButtons data={filteredData} filters={filters} />

          {/* Attendance Table - sekarang menggunakan currentData dari filteredData */}
          <AttendanceTable
            data={currentData}
            onUpdate={loadAttendanceData}
            isAdmin={true}
            onAdd={handleAddAttendance}
          />


          {/* Pagination Controls - Tampilkan juga di bawah tabel */}
          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ← Sebelumnya
              </button>

              <span className="pagination-info">
                Halaman {currentPage} dari {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Selanjutnya →
              </button>
            </div>
          )}
        </>
      ) : activeTab === 'students' ? (
        <StudentManagement />
      ) : activeTab === 'payments' ? (
        <PaymentManagement />
      ) : (
        <UserManagement onUserUpdate={loadTutors} />
      )}


      {/* Modal Tambah Presensi */}
      {
        isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <button className="modal-close-btn" onClick={handleCloseModal}>×</button>
              <AttendanceForm
                user={user}
                onSuccess={handleAttendanceSuccess}
                allowManualDate={true}
                tutors={tutors}
                enableTutorSelection={true}
              />
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Dashboard;
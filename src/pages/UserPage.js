// pages/UserPage.js
import React, { useState, useEffect, useCallback } from 'react';
import AttendanceForm from '../components/AttendanceForm';
import AttendanceTable from '../components/AttendanceTable';
import ChangePassword from '../components/ChangePassword';
import WhatsAppRecap from '../components/WhatsAppRecap';
import { getAttendanceData } from '../services/database';
import logo from '../assets/logo-smartkids.jpeg';

const UserPage = ({ user, onLogout }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [filteredData, setFilteredData] = useState([]); // For search results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [searchName, setSearchName] = useState(''); // Search filter
  const [studentNames, setStudentNames] = useState([]); // List of unique student names

  const loadUserAttendance = useCallback(async () => {
    if (!user || !user.name) {
      console.log('❌ No user or user name found:', user);
      setAttendanceData([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 Loading attendance for tutor:', user.name);
      const data = await getAttendanceData({ tutor: user.name });
      console.log('📊 Raw data received:', data);

      let validatedData = Array.isArray(data) ? data : [];

      validatedData = validatedData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);

        if (dateA > dateB) return -1;
        if (dateA < dateB) return 1;

        const timeA = a.timeStart || a.timeSlot?.split('-')[0] || '';
        const timeB = b.timeStart || b.timeSlot?.split('-')[0] || '';

        if (timeA < timeB) return -1;
        if (timeA > timeB) return 1;

        return 0;
      });

      console.log(`✅ Validated and sorted data: ${validatedData.length} records`);

      setAttendanceData(validatedData);
      setFilteredData(validatedData); // Initialize filtered data

      // Extract unique student names for autocomplete
      const uniqueNames = [...new Set(validatedData
        .map(item => item.studentName)
        .filter(name => name && name.trim() !== '')
      )].sort();
      setStudentNames(uniqueNames);

      setCurrentPage(1);
    } catch (err) {
      console.error('❌ Error loading attendance:', err);
      setError('Gagal memuat data presensi: ' + err.message);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleSuccess = useCallback(() => {
    console.log('🎉 Success callback triggered, refreshing data...');
    setTimeout(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 1500);
  }, []);

  useEffect(() => {
    console.log('🔄 UserPage useEffect triggered, loading attendance...');
    loadUserAttendance();
  }, [loadUserAttendance, refreshTrigger]);

  // Filter data by student name
  useEffect(() => {
    if (!searchName.trim()) {
      setFilteredData(attendanceData);
    } else {
      const searchTerm = searchName.toLowerCase();
      const filtered = attendanceData.filter(item =>
        item.studentName && item.studentName.toLowerCase().includes(searchTerm)
      );
      setFilteredData(filtered);
    }
    setCurrentPage(1); // Reset to page 1 when search changes
  }, [searchName, attendanceData]);

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

  return (
    <div className="user-page">
      <header className="header">
        <div className="header-content">
          <div className="logo-header">
            <img src={logo} alt="Smart Kids Logo" className="logo" />
            <div className="header-text">
              <h1>Sistem Presensi Digital Bimbel</h1>
              <p className="subtitle">Smart Kids Global Institute</p>
            </div>
          </div>
          <div className="user-info">
            <span>Halo, {user?.name || 'User'} (Tutor)</span>
            <div className="header-actions">
              <button
                onClick={loadUserAttendance}
                className="refresh-btn"
                disabled={loading}
              >
                {loading ? 'Memuat...' : 'Refresh Data'}
              </button>
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="change-password-btn"
              >
                🔐 Ubah Password
              </button>
              <button onClick={onLogout} className="logout-btn">Logout</button>
            </div>
          </div>
        </div>
      </header>
      <main className="user-main">
        <div className="user-content">
          {/* Tampilkan form ubah password */}
          {showChangePassword && <ChangePassword user={user} />}

          <AttendanceForm user={user} onSuccess={handleSuccess} />

          {/* Status Section */}
          <div className="data-status">
            {/* Search Filter */}
            <div className="search-filter-section">
              <label htmlFor="student-search">🔍 Cari Nama Siswa:</label>
              <div className="searchable-input">
                <input
                  id="student-search"
                  type="text"
                  className="student-search-input"
                  placeholder="Ketik nama siswa untuk mencari..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  list="tutorStudentNamesList"
                />
                {searchName && (
                  <button
                    type="button"
                    className="clear-filter-btn"
                    onClick={() => setSearchName('')}
                    title="Hapus Filter"
                  >
                    ×
                  </button>
                )}
                <datalist id="tutorStudentNamesList">
                  {studentNames.map((name, index) => (
                    <option key={index} value={name} />
                  ))}
                </datalist>
              </div>
              <small className="form-hint">
                {studentNames.length} siswa tersedia | {filteredData.length} data ditemukan
              </small>
            </div>

            {loading && (
              <div className="loading">
                <span>Memuat data presensi...</span>
              </div>
            )}
            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}
            {!loading && !error && (
              <div className="data-summary">
                <h3>Data Presensi Saya</h3>
                <p>
                  Total: <strong>{filteredData.length}</strong> record |
                  Halaman: <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> |
                  Menampilkan: <strong>{currentData.length}</strong> data
                  {searchName && (
                    <span className="filter-info">
                      | Filter aktif: <strong>"{searchName}"</strong>
                      <button
                        className="clear-filter-text-btn"
                        onClick={() => setSearchName('')}
                        title="Hapus filter"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </p>
                {filteredData.length === 0 && attendanceData.length > 0 && (
                  <div className="no-data-message">
                    <p>🔍 Tidak ada data yang cocok dengan pencarian "{searchName}"</p>
                    <small>Coba kata kunci lain atau hapus filter</small>
                  </div>
                )}
                {attendanceData.length === 0 && (
                  <div className="no-data-message">
                    <p>📝 Belum ada data presensi</p>
                    <small>Data akan muncul setelah Anda mengisi form presensi di atas</small>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp Recap - Only show if there's data */}
          {attendanceData.length > 0 && (
            <WhatsAppRecap
              attendanceData={attendanceData}
              tutorName={user?.name || 'Tutor'}
            />
          )}

          {/* Pagination Controls */}
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

          {/* Attendance Table */}
          {currentData.length > 0 && (
            <AttendanceTable
              data={currentData}
              onUpdate={loadUserAttendance}
              isAdmin={false}
            />
          )}

          {/* Pagination Controls di bawah */}
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
        </div>
      </main>


    </div>
  );
};

export default UserPage;
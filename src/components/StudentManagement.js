import React from 'react';
import { useStudentManagement } from '../hooks/useStudentManagement';
import StudentTable from './StudentTable';
import StudentForm from './StudentForm';
import StudentStats from './StudentStats';
import ImportForm from './ImportForm';

const StudentManagement = () => {
  const {
    students,
    filteredStudents,
    showImportForm, setShowImportForm,
    showAddForm, setShowAddForm,
    showEditForm, setShowEditForm,
    editingStudent,
    message,
    importing,
    deletingAll,
    newStudent,
    searchTerm,
    showDeleteConfirm,
    fileInputRef,

    // Actions
    calculateEducationStats,
    handleFileImport,
    handleAddStudent,
    handleEditStudent,
    handleUpdateStudent,
    handleEditInputChange,
    handleDeleteStudent,
    handleDeleteAllStudents,
    cancelDeleteAll,
    handleInputChange,
    handleSearchChange,
    clearSearch,
    clearMessage,
    refreshData,
    cancelEdit,
    copyToClipboard,

    // Services exports
    exportStudentTemplate,
    exportStudentsToExcel
  } = useStudentManagement();

  // Additional stats calculation for display
  const additionalStats = {
    withPhone: students.filter(s => s.phone && s.phone.trim() !== '').length,
    withParent: students.filter(s => s.parentName && s.parentName.trim() !== '').length,
    withNotes: students.filter(s => s.notes && s.notes.trim() !== '').length
  };

  return (
    <div className="student-management">
      <div className="section-header">
        <h3>Manajemen Data Siswa</h3>
        <div className="action-buttons">
          <button
            className="refresh-btn"
            onClick={refreshData}
            title="Refresh Data"
          >
            ↻ Refresh
          </button>
          <button
            className="excel-btn"
            onClick={exportStudentTemplate}
            title="Download Template Excel"
          >
            ⬇ Template
          </button>
          <button
            className="excel-btn"
            onClick={exportStudentsToExcel}
            disabled={students.length === 0}
            title="Export data ke Excel"
          >
            📊 Export Excel
          </button>
          <button
            className="add-btn"
            onClick={() => {
              setShowImportForm(!showImportForm);
              setShowAddForm(false);
              setShowEditForm(false);
            }}
            title="Import data dari Excel"
          >
            📁 Import Excel
          </button>
          <button
            className="add-btn"
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowImportForm(false);
              setShowEditForm(false);
            }}
            title="Tambah siswa baru"
          >
            ＋ Tambah Siswa
          </button>
          <button
            className="delete-btn"
            onClick={handleDeleteAllStudents}
            disabled={students.length === 0}
            title="Hapus semua data siswa"
          >
            🗑 {showDeleteConfirm ? 'Klik lagi untuk konfirmasi' : 'Hapus Semua'}
          </button>
        </div>
      </div>

      {/* Konfirmasi Hapus Semua Data */}
      {showDeleteConfirm && (
        <div className="delete-confirm-modal">
          <div className="modal-content">
            <h4>⚠️ Konfirmasi Penghapusan Semua Data</h4>
            <p>Anda akan menghapus <strong>{students.length} siswa</strong>. Tindakan ini tidak dapat dibatalkan!</p>
            <div className="warning-box">
              <p>Data yang akan dihapus:</p>
              <ul>
                <li>Semua data siswa</li>
                <li><strong>Catatan: Data presensi akan tetap tersimpan</strong></li>
                <li>Data siswa tidak dapat dikembalikan</li>
              </ul>
            </div>
            <div className="modal-actions">
              <button
                className="confirm-delete-btn"
                onClick={handleDeleteAllStudents}
                disabled={deletingAll}
              >
                {deletingAll ? 'Menghapus...' : 'Ya, Hapus Semua'}
              </button>
              <button
                className="cancel-btn"
                onClick={cancelDeleteAll}
                disabled={deletingAll}
              >
                Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pesan Status */}
      {message.text && (
        <div className={`message ${message.type}`}>
          <span>{message.text}</span>
          <button className="close-message-btn" onClick={clearMessage}>×</button>
        </div>
      )}

      {/* Statistik Data */}
      <StudentStats
        totalStudents={students.length}
        filteredCount={filteredStudents.length}
        educationStats={calculateEducationStats()}
        additionalStats={additionalStats}
      />

      {/* Pencarian */}
      <div className="search-section">
        <div className="searchable-input">
          <input
            type="text"
            placeholder="🔍 Cari siswa (nama, kelas, orang tua)..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="student-search-input"
          />
          {searchTerm && (
            <button
              className="clear-filter-btn"
              onClick={clearSearch}
              title="Hapus pencarian"
            >
              ×
            </button>
          )}
        </div>
        {searchTerm && (
          <div className="filter-info">
            Menampilkan {filteredStudents.length} dari {students.length} siswa
            {filteredStudents.length === 0 && ' (tidak ditemukan)'}
          </div>
        )}
      </div>

      {/* Import Form */}
      {showImportForm && (
        <ImportForm
          onImport={handleFileImport}
          onCancel={() => setShowImportForm(false)}
          fileInputRef={fileInputRef}
          isImporting={importing}
        />
      )}

      {/* Add Student Form */}
      {showAddForm && (
        <StudentForm
          onSubmit={handleAddStudent}
          initialData={newStudent}
          onChange={handleInputChange}
          onCancel={() => setShowAddForm(false)}
          isEditing={false}
        />
      )}

      {/* Edit Student Form */}
      {showEditForm && editingStudent && (
        <StudentForm
          onSubmit={handleUpdateStudent}
          initialData={editingStudent}
          onChange={handleEditInputChange}
          onCancel={cancelEdit}
          isEditing={true}
        />
      )}

      {/* Students Table */}
      <StudentTable
        students={filteredStudents}
        searchTerm={searchTerm}
        onEdit={handleEditStudent}
        onDelete={handleDeleteStudent}
        onClearSearch={clearSearch}
        onCopyToClipboard={copyToClipboard}
        onAddFirst={() => setShowAddForm(true)}
      />
    </div>
  );
};

export default StudentManagement;
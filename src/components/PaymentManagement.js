import React, { useState, useEffect } from 'react';
import { getStudentsDetail, updateStudent } from '../services/database';

const PaymentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Filter States
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('all'); // 'all', 'unpaid' (includes overdue)

    // Modal States
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingCell, setEditingCell] = useState(null); // { studentId, month, year, currentPaymentDate }
    const [paymentDateInput, setPaymentDateInput] = useState('');

    const months = [
        { value: 1, label: 'Januari' },
        { value: 2, label: 'Februari' },
        { value: 3, label: 'Maret' },
        { value: 4, label: 'April' },
        { value: 5, label: 'Mei' },
        { value: 6, label: 'Juni' },
        { value: 7, label: 'Juli' },
        { value: 8, label: 'Agustus' },
        { value: 9, label: 'September' },
        { value: 10, label: 'Oktober' },
        { value: 11, label: 'November' },
        { value: 12, label: 'Desember' }
    ];

    const shortMonths = [
        { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
        { value: 4, label: 'Apr' }, { value: 5, label: 'Mei' }, { value: 6, label: 'Jun' },
        { value: 7, label: 'Jul' }, { value: 8, label: 'Agt' }, { value: 9, label: 'Sep' },
        { value: 10, label: 'Okt' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Des' }
    ];

    const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    useEffect(() => {
        loadStudents();
    }, []);

    // Handle Escape key to close modals
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (showPaymentModal) {
                    setShowPaymentModal(false);
                } else if (showDetailModal) {
                    setShowDetailModal(false);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showPaymentModal, showDetailModal]);

    const loadStudents = async () => {
        setLoading(true);
        try {
            const data = await getStudentsDetail();
            setStudents(data);
        } catch (err) {
            setError('Gagal memuat data siswa');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getDeadline = (student, month, year) => {
        if (!student.createdAt) return null;

        let registerDate;
        if (student.createdAt.toDate) {
            registerDate = student.createdAt.toDate();
        } else if (student.createdAt instanceof Date) {
            registerDate = student.createdAt;
        } else {
            registerDate = new Date(student.createdAt);
        }

        const registerDay = registerDate.getDate();
        // Deadline is same day of following month? Or same month?
        // Based on logic "1 month after registration".
        // Let's keep consistent: Month X column deadline is (RegisterDay) of Month X+1.

        const deadline = new Date(year, month - 1, registerDay);

        // Adjust for month rollover
        if (deadline.getMonth() !== month - 1) {
            deadline.setDate(0);
        }

        // Deadline logic:
        // If reg Jan 15.
        // Payment for Jan period?
        // Let's assume billing period = month.
        // Deadline = 1 month from start of billing period? Or from registration date relative to month?
        // Let's stick to previous visualized logic:
        // Deadline for Month X = Same Day of Month X + 1.
        const billingDeadline = new Date(deadline);
        billingDeadline.setMonth(billingDeadline.getMonth() + 1);

        return billingDeadline;
    };

    const getPaymentStatus = (student, month, year) => {
        const deadline = getDeadline(student, month, year);
        if (!deadline) return { status: 'none', label: '-', isOverdue: false };

        let registerDate;
        if (student.createdAt?.toDate) registerDate = student.createdAt.toDate();
        else registerDate = new Date(student.createdAt);

        // Ignore months before INTENDED registration month
        // But let's be safe: if reg Jan 20, Jan is included.
        if (registerDate > new Date(year, month, 0)) {
            return { status: 'none', label: '-', isOverdue: false };
        }

        const paymentKey = `${year}-${String(month).padStart(2, '0')}`;
        const paymentDateStr = student.payments?.[paymentKey]; // Format 'YYYY-MM-DD'

        if (paymentDateStr) {
            const paymentDate = new Date(paymentDateStr);
            // Reset time for fair comparison
            paymentDate.setHours(0, 0, 0, 0);

            // deadline is already set to 00:00:00 by default construction in getDeadline? 
            // Actually getDeadline returns a date object.
            // Let's ensure deadline is also 00:00:00 for comparison
            const compareDeadline = new Date(deadline);
            compareDeadline.setHours(0, 0, 0, 0);

            if (paymentDate > compareDeadline) {
                return { status: 'paid-late', label: 'Lunas (Telat)', date: paymentDateStr, isOverdue: false };
            }
            return { status: 'paid', label: 'Lunas', date: paymentDateStr, isOverdue: false };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        deadline.setHours(0, 0, 0, 0);

        if (today > deadline) {
            return { status: 'overdue', label: 'Telat', isOverdue: true };
        } else {
            return { status: 'pending', label: 'Belum', isOverdue: false };
        }
    };

    const handleUpdatePayment = async (student, month, year, dateValue) => {
        try {
            const paymentKey = `${year}-${String(month).padStart(2, '0')}`;
            const updatedPayments = {
                ...(student.payments || {}),
                [paymentKey]: dateValue
            };

            if (!dateValue) delete updatedPayments[paymentKey];

            const updatedStudent = {
                ...student,
                payments: updatedPayments
            };

            const result = await updateStudent(updatedStudent);
            if (result.success) {
                setStudents(prev => prev.map(s =>
                    s.id === student.id ? updatedStudent : s
                ));
                // If editing from modal, close modal or keep open?
                // Close small payment modal
                setShowPaymentModal(false);

                // If detailing, update selected student
                if (selectedStudent && selectedStudent.id === student.id) {
                    setSelectedStudent(updatedStudent);
                }
            } else {
                alert('Gagal update: ' + result.error);
            }
        } catch (err) {
            console.error(err);
            alert('Error updating payment');
        }
    };

    const handleUpdateCreatedDate = async (student, newDate) => {
        try {
            const updatedStudent = {
                ...student,
                createdAt: new Date(newDate).toISOString() // Store as ISO string
            };

            const result = await updateStudent(updatedStudent);
            if (result.success) {
                setStudents(prev => prev.map(s =>
                    s.id === student.id ? updatedStudent : s
                ));
            } else {
                alert('Gagal update tanggal daftar: ' + result.error);
            }
        } catch (err) {
            console.error(err);
            alert('Error updating registration date');
        }
    };

    // --- Interaction Handlers ---

    const openDetailModal = (student) => {
        setSelectedStudent(student);
        setShowDetailModal(true);
    };

    const openPaymentModal = (student, month, year) => {
        const paymentKey = `${year}-${String(month).padStart(2, '0')}`;
        setEditingCell({ student, month, year });
        setPaymentDateInput(student.payments?.[paymentKey] || '');
        setShowPaymentModal(true);
    };

    // --- Filtering Logic ---
    const filteredStudents = students.filter(student => {
        const nameMatch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
        if (!nameMatch) return false;

        if (paymentStatusFilter === 'unpaid') {
            const { status } = getPaymentStatus(student, selectedMonth, selectedYear);
            return status === 'pending' || status === 'overdue';
        }

        if (paymentStatusFilter === 'paid') {
            const { status } = getPaymentStatus(student, selectedMonth, selectedYear);
            return status === 'paid' || status === 'paid-late';
        }

        return true;
    });

    if (loading) return <div className="loading">Memuat data...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="payment-management">
            <div className="section-header">
                <h3>Monitoring Pembayaran</h3>
                <div className="filters-row" style={{ flexWrap: 'wrap' }}>
                    <div className="filter-group-compact">
                        <label>Tahun:</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="year-select"
                        >
                            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="filter-group-compact">
                        <label>Bulan:</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="month-select"
                        >
                            {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="filter-group-compact">
                        <label>Status:</label>
                        <select
                            value={paymentStatusFilter}
                            onChange={(e) => setPaymentStatusFilter(e.target.value)}
                            className="status-select"
                        >
                            <option value="all">Semua</option>
                            <option value="unpaid">Belum Lunas</option>
                            <option value="paid">Sudah Lunas</option>
                        </select>
                    </div>
                    <div className="searchable-input">
                        <input
                            type="text"
                            placeholder="Cari nama siswa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="student-search-input"
                        />
                    </div>
                </div>
            </div>

            {/* STATISTICS CARDS */}
            <div className="stats">
                <div className="stat-card">
                    <h3>Total Siswa</h3>
                    <p>{filteredStudents.length}</p>
                </div>
                <div className="stat-card">
                    <h3>Sudah Bayar</h3>
                    <p>{filteredStudents.filter(s => {
                        const { status } = getPaymentStatus(s, selectedMonth, selectedYear);
                        return status === 'paid' || status === 'paid-late';
                    }).length}</p>
                </div>
                <div className="stat-card">
                    <h3>Belum Bayar</h3>
                    <p>{filteredStudents.filter(s => {
                        const { status } = getPaymentStatus(s, selectedMonth, selectedYear);
                        return status === 'pending' || status === 'overdue';
                    }).length}</p>
                </div>
            </div>

            {/* MAIN LIST VIEW */}
            <div className="table-container">
                <table className="payment-table">
                    <thead>
                        <tr>
                            <th>Nama Siswa</th>
                            <th>Tingkat</th>
                            <th>Tanggal Daftar</th>
                            <th>Deadline</th>
                            <th>Tanggal Bayar</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.map(student => {
                            const { status, label, date, isOverdue } = getPaymentStatus(student, selectedMonth, selectedYear);
                            const deadlineDate = getDeadline(student, selectedMonth, selectedYear);

                            return (
                                <tr key={student.id}>
                                    <td className={isOverdue ? 'text-danger font-bold' : ''}>
                                        <strong>{student.name}</strong>
                                    </td>
                                    <td>{student.educationLevel || '-'}</td>
                                    <td>
                                        <input
                                            type="date"
                                            value={(() => {
                                                if (!student.createdAt) return '2025-12-29'; // Default requested by user
                                                let date;
                                                if (student.createdAt?.toDate) {
                                                    date = student.createdAt.toDate();
                                                } else {
                                                    date = new Date(student.createdAt);
                                                }
                                                // Check if valid date
                                                if (isNaN(date.getTime())) return '2025-12-29';

                                                // Adjust for timezone to ensure correct date displays in input
                                                const offset = date.getTimezoneOffset() * 60000;
                                                return new Date(date.getTime() - offset).toISOString().split('T')[0];
                                            })()}
                                            onChange={(e) => handleUpdateCreatedDate(student, e.target.value)}
                                            className="date-input"
                                        />
                                    </td>
                                    <td>
                                        {deadlineDate ? deadlineDate.toLocaleDateString('id-ID') : '-'}
                                    </td>
                                    <td>
                                        <input
                                            type="date"
                                            value={date || ''}
                                            onChange={(e) => handleUpdatePayment(student, selectedMonth, selectedYear, e.target.value)}
                                            className="date-input"
                                        />
                                    </td>
                                    <td>
                                        <span className={`badge ${status === 'paid' ? 'success' : status === 'overdue' ? 'danger' : 'warning'}`}>
                                            {label}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="detail-btn"
                                            onClick={() => openDetailModal(student)}
                                        >
                                            Detail
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredStudents.length === 0 && (
                    <div className="no-data">Tidak ada data pembayaran ditemukan</div>
                )}
            </div>


            {/* DETAIL MODAL (12 Month Grid) */}
            {showDetailModal && selectedStudent && (
                <div className="modal-overlay">
                    <div className="modal-content large-modal">
                        <div className="modal-header">
                            <h4>Rincian Pembayaran: {selectedStudent.name} ({selectedYear})</h4>
                            <button className="close-btn" onClick={() => setShowDetailModal(false)}>×</button>
                        </div>

                        <div className="monthly-grid-container">
                            <table className="monthly-table">
                                <thead>
                                    <tr>
                                        {shortMonths.map(m => <th key={m.value}>{m.label}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        {shortMonths.map(m => {
                                            const { status, label } = getPaymentStatus(selectedStudent, m.value, selectedYear);
                                            return (
                                                <td
                                                    key={m.value}
                                                    className={`status-cell ${status}`}
                                                    onClick={() => status !== 'none' && openPaymentModal(selectedStudent, m.value, selectedYear)}
                                                >
                                                    <span className={`status-badge ${status}`}>
                                                        {label}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                            <div className="grid-legend">
                                <small>Klik pada sel bulan untuk mengubah status pembayaran.</small>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENT EDIT MODAL */}
            {showPaymentModal && editingCell && (
                <div className="modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="modal-content small-modal">
                        <h4>Update Pembayaran</h4>
                        <p>
                            Siswa: <strong>{editingCell.student.name}</strong><br />
                            Periode: <strong>{months[editingCell.month - 1].label} {editingCell.year}</strong>
                        </p>

                        <div className="form-group">
                            <label>Tanggal Bayar:</label>
                            <input
                                type="date"
                                value={paymentDateInput}
                                onChange={(e) => setPaymentDateInput(e.target.value)}
                                className="date-input full-width"
                            />
                            <small className="form-hint">Kosongkan untuk menghapus status bayar</small>
                        </div>

                        <div className="modal-actions">
                            <button className="confirm-btn" onClick={() => handleUpdatePayment(editingCell.student, editingCell.month, editingCell.year, paymentDateInput)}>Simpan</button>
                            <button className="cancel-btn" onClick={() => setShowPaymentModal(false)}>Batal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentManagement;

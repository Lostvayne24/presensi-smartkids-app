import { useState, useEffect, useRef } from 'react';
import {
    getStudentsDetail,
    importStudentsFromExcel,
    addStudent,
    updateStudent,
    deleteStudent,
    deleteAllStudents,
    exportStudentTemplate,
    exportStudentsToExcel
} from '../services/database';

export const useStudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [showImportForm, setShowImportForm] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [importing, setImporting] = useState(false);
    const [deletingAll, setDeletingAll] = useState(false);
    const [newStudent, setNewStudent] = useState({
        name: '',
        educationLevel: '',
        class: '',
        phone: '',
        parentName: '',
        notes: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadStudents();
    }, []);

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredStudents((prev) => {
                // Only update if length differs or it's a fresh load to avoid loops, 
                // strictly speaking direct assignment is fine if referential equality isn't critical for downstream deps
                return students;
            });
        } else {
            const filtered = students.filter(student =>
                student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (student.class && student.class.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (student.parentName && student.parentName.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setFilteredStudents(filtered);
        }
    }, [students, searchTerm]);

    const calculateEducationStats = () => {
        const stats = {
            tk: 0,
            sd: 0,
            smp: 0,
            sma: 0,
            umum: 0,
            unknown: 0
        };

        students.forEach(student => {
            const level = student.educationLevel || '';
            switch (level.toUpperCase()) {
                case 'TK':
                    stats.tk++;
                    break;
                case 'SD':
                    stats.sd++;
                    break;
                case 'SMP':
                    stats.smp++;
                    break;
                case 'SMA':
                    stats.sma++;
                    break;
                case 'UMUM':
                    stats.umum++;
                    break;
                default:
                    stats.unknown++;
                    break;
            }
        });

        return stats;
    };

    const loadStudents = async () => {
        try {
            const studentList = await getStudentsDetail();
            setStudents(studentList);
            setFilteredStudents(studentList);
        } catch (error) {
            console.error('Error loading students:', error);
            setMessage({ type: 'error', text: 'Gagal memuat data siswa' });
        }
    };

    const handleFileImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            setMessage({ type: 'error', text: 'Hanya file Excel (.xlsx, .xls) yang didukung' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Ukuran file maksimal 5MB' });
            return;
        }

        setImporting(true);
        try {
            const result = await importStudentsFromExcel(file);
            setMessage({ type: 'success', text: result.message });
            await loadStudents();
            setShowImportForm(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Gagal mengimport data' });
        } finally {
            setImporting(false);
        }
    };

    const handleAddStudent = async (e) => {
        e.preventDefault();

        if (!newStudent.name.trim()) {
            setMessage({ type: 'error', text: 'Nama siswa harus diisi' });
            return;
        }

        if (newStudent.phone && !/^[0-9+\-\s()]*$/.test(newStudent.phone)) {
            setMessage({ type: 'error', text: 'Format nomor telepon tidak valid' });
            return;
        }

        try {
            const result = await addStudent(newStudent);
            if (result.success) {
                setMessage({ type: 'success', text: 'Siswa berhasil ditambahkan' });
                setNewStudent({
                    name: '',
                    educationLevel: '',
                    class: '',
                    phone: '',
                    parentName: '',
                    notes: ''
                });
                setShowAddForm(false);
                await loadStudents();
            } else {
                setMessage({ type: 'error', text: result.error || 'Gagal menambah siswa' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal menambah siswa: ' + error.message });
        }
    };

    const handleEditStudent = (student) => {
        setEditingStudent({ ...student });
        setShowEditForm(true);
        setShowAddForm(false);
        setShowImportForm(false);
    };

    const handleUpdateStudent = async (e) => {
        e.preventDefault();

        if (!editingStudent.name.trim()) {
            setMessage({ type: 'error', text: 'Nama siswa harus diisi' });
            return;
        }

        if (editingStudent.phone && !/^[0-9+\-\s()]*$/.test(editingStudent.phone)) {
            setMessage({ type: 'error', text: 'Format nomor telepon tidak valid' });
            return;
        }

        try {
            const result = await updateStudent(editingStudent);
            if (result.success) {
                setMessage({ type: 'success', text: 'Data siswa berhasil diperbarui' });
                setShowEditForm(false);
                setEditingStudent(null);
                await loadStudents();
            } else {
                setMessage({ type: 'error', text: result.error || 'Gagal memperbarui data siswa' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Gagal memperbarui data siswa: ' + error.message });
        }
    };

    const handleEditInputChange = (e) => {
        setEditingStudent({
            ...editingStudent,
            [e.target.name]: e.target.value
        });
    };

    const handleDeleteStudent = async (studentId, studentName) => {
        if (window.confirm(`Apakah Anda yakin ingin menghapus siswa "${studentName}"?\n\nCatatan: Data presensi siswa ini akan tetap tersimpan.`)) {
            try {
                const success = await deleteStudent(studentId, true);
                if (success) {
                    setMessage({ type: 'success', text: `Siswa "${studentName}" berhasil dihapus` });
                    await loadStudents();
                } else {
                    setMessage({ type: 'error', text: 'Gagal menghapus siswa' });
                }
            } catch (error) {
                setMessage({ type: 'error', text: 'Gagal menghapus siswa: ' + error.message });
            }
        }
    };

    const handleDeleteAllStudents = async () => {
        if (!showDeleteConfirm) {
            setShowDeleteConfirm(true);
            return;
        }

        setDeletingAll(true);
        try {
            const success = await deleteAllStudents(true);
            if (success) {
                setMessage({
                    type: 'success',
                    text: `Semua data siswa (${students.length}) berhasil dihapus. Data presensi tetap tersimpan.`
                });
                await loadStudents();
            } else {
                setMessage({
                    type: 'error',
                    text: 'Gagal menghapus semua data siswa'
                });
            }
        } catch (error) {
            setMessage({
                type: 'error',
                text: 'Gagal menghapus semua data siswa: ' + error.message
            });
        } finally {
            setDeletingAll(false);
            setShowDeleteConfirm(false);
        }
    };

    const cancelDeleteAll = () => {
        setShowDeleteConfirm(false);
    };

    const handleInputChange = (e) => {
        setNewStudent({
            ...newStudent,
            [e.target.name]: e.target.value
        });
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
    };

    const clearMessage = () => {
        setMessage({ type: '', text: '' });
    };

    const refreshData = async () => {
        await loadStudents();
        setMessage({ type: 'info', text: 'Data diperbarui' });
    };

    const cancelEdit = () => {
        setShowEditForm(false);
        setEditingStudent(null);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setMessage({ type: 'success', text: 'Data disalin ke clipboard' });
            })
            .catch(() => {
                setMessage({ type: 'error', text: 'Gagal menyalin data' });
            });
    };

    return {
        students,
        filteredStudents,
        showImportForm, setShowImportForm,
        showAddForm, setShowAddForm,
        showEditForm, setShowEditForm,
        editingStudent, setEditingStudent,
        message, setMessage,
        importing,
        deletingAll,
        newStudent, setNewStudent,
        searchTerm, setSearchTerm,
        showDeleteConfirm, setShowDeleteConfirm,
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
    };
};

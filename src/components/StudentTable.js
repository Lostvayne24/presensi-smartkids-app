import React from 'react';

const StudentTable = ({
    students,
    searchTerm,
    onEdit,
    onDelete,
    onClearSearch,
    onCopyToClipboard,
    onAddFirst
}) => {
    if (students.length === 0) {
        return (
            <div className="no-data">
                {searchTerm ? (
                    <>
                        <p>🔍 Tidak ada siswa yang cocok dengan pencarian "{searchTerm}"</p>
                        <button
                            className="cancel-btn"
                            onClick={onClearSearch}
                        >
                            Tampilkan Semua
                        </button>
                    </>
                ) : (
                    <>
                        <p>📭 Belum ada data siswa.</p>
                        <p>Silakan import dari Excel atau tambah siswa manual.</p>
                        <div className="no-data-actions">
                            <button
                                className="add-btn"
                                onClick={onAddFirst}
                            >
                                ＋ Tambah Siswa Pertama
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="table-actions">
                <button
                    className="excel-btn"
                    onClick={() => onCopyToClipboard(JSON.stringify(students.map(s => s.name)))}
                    title="Salin daftar nama ke clipboard"
                >
                    📋 Salin Daftar
                </button>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>No</th>
                            <th>Nama Siswa</th>
                            <th>Tingkat</th>
                            <th>Kelas</th>
                            <th>No. Telepon</th>
                            <th>Orang Tua</th>
                            <th>Catatan</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student, index) => (
                            <tr key={student.id}>
                                <td>{index + 1}</td>
                                <td>
                                    <strong>{student.name}</strong>
                                </td>
                                <td>
                                    <span className={`badge ${student.educationLevel?.toLowerCase() || 'unknown'}`}>
                                        {student.educationLevel || '-'}
                                    </span>
                                </td>
                                <td>{student.class || '-'}</td>
                                <td>
                                    {student.phone ? (
                                        <a href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
                                            {student.phone}
                                        </a>
                                    ) : '-'}
                                </td>
                                <td>{student.parentName || '-'}</td>
                                <td className="notes-cell">{student.notes || '-'}</td>
                                <td className="actions-cell">
                                    <button
                                        className="edit-btn"
                                        onClick={() => onEdit(student)}
                                        title="Edit"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="delete-btn-icon"
                                        onClick={() => onDelete(student.id, student.name)}
                                        title="Hapus"
                                    >
                                        🗑
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default StudentTable;

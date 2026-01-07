import React from 'react';

const StudentForm = ({
    onSubmit,
    initialData,
    onCancel,
    isEditing,
    onChange
}) => {
    return (
        <div className={isEditing ? "edit-form" : "add-form"}>
            <h4>{isEditing ? "✏️ Edit Data Siswa" : "＋ Tambah Siswa Baru"}</h4>
            <form onSubmit={onSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label>Nama Siswa *</label>
                        <input
                            type="text"
                            name="name"
                            value={initialData.name}
                            onChange={onChange}
                            required
                            placeholder="Nama lengkap siswa"
                            autoFocus
                        />
                    </div>
                    <div className="form-group">
                        <label>Tingkat Pendidikan</label>
                        <select
                            name="educationLevel"
                            value={initialData.educationLevel}
                            onChange={onChange}
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
                        <label>Status Siswa</label>
                        <select
                            name="status"
                            value={initialData.status || 'Aktif'}
                            onChange={onChange}
                        >
                            <option value="Aktif">Aktif</option>
                            <option value="Cuti">Cuti</option>
                            <option value="Off">Off</option>
                        </select>
                    </div>

                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Kelas</label>
                        <input
                            type="text"
                            name="class"
                            value={initialData.class}
                            onChange={onChange}
                            placeholder="Contoh: 4A, 7B, X IPA 1"
                        />
                    </div>
                    <div className="form-group">
                        <label>No. Telepon</label>
                        <input
                            type="tel"
                            name="phone"
                            value={initialData.phone}
                            onChange={onChange}
                            placeholder="0812-3456-7890"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>Nama Orang Tua</label>
                    <input
                        type="text"
                        name="parentName"
                        value={initialData.parentName}
                        onChange={onChange}
                        placeholder="Nama orang tua/wali"
                    />
                </div>

                <div className="form-group">
                    <label>Catatan</label>
                    <textarea
                        name="notes"
                        value={initialData.notes}
                        onChange={onChange}
                        rows="3"
                        placeholder="Catatan khusus tentang siswa..."
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="submit-btn">
                        {isEditing ? "💾 Simpan Perubahan" : "💾 Simpan Siswa"}
                    </button>
                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={onCancel}
                    >
                        Batal
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StudentForm;

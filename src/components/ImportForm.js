import React from 'react';

const ImportForm = ({
    onImport,
    onCancel,
    fileInputRef,
    isImporting
}) => {
    return (
        <div className="import-form">
            <h4>📁 Import Data dari Excel</h4>
            <div className="form-group">
                <label>Pilih File Excel:</label>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={onImport}
                    disabled={isImporting}
                />
                <small className="form-hint">
                    Format: .xlsx atau .xls (max 5MB). Kolom: Nama, Tingkat Pendidikan, Kelas, Telepon, Orang Tua, Catatan
                </small>
                <div className="upload-hint">
                    <p><strong>Tips:</strong></p>
                    <ul>
                        <li>Download template terlebih dahulu untuk format yang benar</li>
                        <li>Nama siswa harus diisi (kolom pertama)</li>
                        <li>Data duplikat akan diabaikan</li>
                    </ul>
                </div>
            </div>
            <div className="form-actions">
                <button
                    type="button"
                    className="cancel-btn"
                    onClick={onCancel}
                    disabled={isImporting}
                >
                    Batal
                </button>
            </div>
            {isImporting && (
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Mengimport data... Harap tunggu</p>
                </div>
            )}
        </div>
    );
};

export default ImportForm;

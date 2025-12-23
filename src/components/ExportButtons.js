import React, { useState } from 'react';
import { exportToExcel, exportToPDF } from '../services/exportService';

const ExportButtons = ({ data, filters }) => {
  const [exporting, setExporting] = useState(false);

  const handleExcelExport = async () => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diexport');
      return;
    }

    setExporting(true);
    try {
      await exportToExcel(data, filters);
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal mengexport ke Excel: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const handlePDFExport = async () => {
    if (data.length === 0) {
      alert('Tidak ada data untuk diexport');
      return;
    }

    setExporting(true);
    try {
      await exportToPDF(data, filters);
    } catch (error) {
      console.error('Export error:', error);
      alert('Gagal mengexport ke PDF: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-buttons">
      <h3>Export Data</h3>
      <div className="button-group">
        <button 
          onClick={handleExcelExport} 
          className="excel-btn"
          disabled={exporting || data.length === 0}
        >
          {exporting ? 'Exporting...' : 'Export ke Excel'}
        </button>
        <button 
          onClick={handlePDFExport} 
          className="pdf-btn"
          disabled={exporting || data.length === 0}
        >
          {exporting ? 'Exporting...' : 'Export ke PDF'}
        </button>
      </div>
      {data.length === 0 && (
        <small className="form-hint">Tidak ada data untuk diexport</small>
      )}
    </div>
  );
};

export default ExportButtons;
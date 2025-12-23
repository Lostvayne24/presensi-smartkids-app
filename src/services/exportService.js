import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

// Import jspdf-autotable dengan benar
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data, filters) => {
  try {
    // SORTING: Urutkan data sebelum export
    const sortedData = [...data].sort((a, b) => {
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

    // Fungsi untuk menghitung durasi dalam menit
    const calculateDuration = (startTime, endTime) => {
      if (!startTime || !endTime) return 0;
      
      try {
        // Parse waktu dari format HH:MM
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        // Hitung total menit dari waktu mulai dan selesai
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;
        
        // Hitung selisih
        const durationMinutes = endTotalMinutes - startTotalMinutes;
        
        // Pastikan durasi tidak negatif
        return durationMinutes > 0 ? durationMinutes : 0;
      } catch (error) {
        console.error('Error calculating duration:', error);
        return 0;
      }
    };

    // Format data untuk Excel - TAMBAH KOLOM DURASI
    const excelData = sortedData.map((item, index) => {
      const startTime = item.timeStart || item.timeSlot?.split('-')[0] || '';
      const endTime = item.timeEnd || item.timeSlot?.split('-')[1] || '';
      const durationMinutes = calculateDuration(startTime, endTime);
      
      return {
        'No': index + 1,
        'Hari': new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long' }),
        'Tanggal': new Date(item.date).toLocaleDateString('id-ID'),
        'Tingkat Pendidikan': item.educationLevel,
        'Kelas': item.classType,
        'Nama Siswa': item.studentName,
        'Tutor': item.tutor,
        'Tempat': item.location,
        'Waktu Mulai': startTime,
        'Waktu Selesai': endTime,
        'Durasi (menit)': durationMinutes, // KOLOM BARU
        'Status': item.status,
        'Catatan': item.notes,
        'Waktu Input': new Date(item.timestamp).toLocaleString('id-ID')
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Presensi');

    // Set column widths - SESUAIKAN DENGAN KOLOM DURASI BARU
    const colWidths = [
      { wch: 5 },   // No
      { wch: 10 },  // Hari
      { wch: 12 },  // Tanggal
      { wch: 15 },  // Tingkat Pendidikan
      { wch: 15 },  // Kelas
      { wch: 20 },  // Nama Siswa
      { wch: 15 },  // Tutor
      { wch: 15 },  // Tempat
      { wch: 12 },  // Waktu Mulai
      { wch: 12 },  // Waktu Selesai
      { wch: 12 },  // Durasi (menit) - KOLOM BARU
      { wch: 10 },  // Status
      { wch: 25 },  // Catatan
      { wch: 20 }   // Waktu Input
    ];
    worksheet['!cols'] = colWidths;

    // Generate filename
    const month = filters.month || 'all';
    const year = filters.year || 'all';
    const tutor = filters.tutor ? `_${filters.tutor.replace(/\s+/g, '_')}` : '';
    const filename = `presensi_bimbel_${month}_${year}${tutor}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Error saat mengexport ke Excel: ' + error.message);
  }
};

export const exportToPDF = (data, filters) => {
  try {
    // Validasi data
    if (!data || data.length === 0) {
      alert('Tidak ada data untuk diexport');
      return;
    }

    // SORTING: Urutkan data sebelum export PDF
    const sortedData = [...data].sort((a, b) => {
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

    // Fungsi untuk menghitung durasi dalam menit
    const calculateDuration = (startTime, endTime) => {
      if (!startTime || !endTime) return 0;
      
      try {
        // Parse waktu dari format HH:MM
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        // Hitung total menit dari waktu mulai dan selesai
        const startTotalMinutes = startHour * 60 + startMinute;
        const endTotalMinutes = endHour * 60 + endMinute;
        
        // Hitung selisih
        const durationMinutes = endTotalMinutes - startTotalMinutes;
        
        // Pastikan durasi tidak negatif
        return durationMinutes > 0 ? durationMinutes : 0;
      } catch (error) {
        console.error('Error calculating duration:', error);
        return 0;
      }
    };

    // Create PDF document
    const doc = new jsPDF();
    
    // Set document properties
    doc.setProperties({
      title: 'Laporan Presensi Bimbel',
      subject: 'Data Presensi Siswa',
      author: 'Sistem Presensi Bimbel',
      keywords: 'presensi, bimbel, laporan',
      creator: 'Sistem Presensi Digital'
    });

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN PRESENSI BIMBEL', 105, 15, { align: 'center' });
    
    // Filter info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let filterText = 'Semua Data';
    
    if (filters.month && filters.year) {
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                         'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      filterText = `Bulan: ${monthNames[parseInt(filters.month) - 1]} ${filters.year}`;
    }
    
    if (filters.tutor) filterText += ` | Tutor: ${filters.tutor}`;
    if (filters.classType) filterText += ` | Kelas: ${filters.classType}`;
    if (filters.educationLevel) filterText += ` | Tingkat: ${filters.educationLevel}`;
    if (filters.location) filterText += ` | Tempat: ${filters.location}`;
    
    // Split long filter text into multiple lines if needed
    const maxWidth = 180;
    const splitFilterText = doc.splitTextToSize(filterText, maxWidth);
    doc.text(splitFilterText, 105, 22, { align: 'center' });

    // Prepare table data - TAMBAH KOLOM DURASI
    const tableData = sortedData.map((item, index) => {
      const startTime = item.timeStart || item.timeSlot?.split('-')[0] || '';
      const endTime = item.timeEnd || item.timeSlot?.split('-')[1] || '';
      const durationMinutes = calculateDuration(startTime, endTime);
      
      return [
        (index + 1).toString(),
        new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long' }),
        new Date(item.date).toLocaleDateString('id-ID'),
        item.educationLevel || '-',
        item.classType || '-',
        item.studentName || '-',
        item.tutor || '-',
        item.location || '-',
        startTime,
        endTime,
        durationMinutes.toString(), // KOLOM BARU: Durasi
        item.status || '-',
        item.notes || '-'
      ];
    });

    // Calculate startY based on filter text height
    const filterTextHeight = splitFilterText.length * 5;
    const startY = 30 + filterTextHeight;

    // Create table menggunakan autoTable sebagai function terpisah
    autoTable(doc, {
      startY: startY,
      head: [
        // TAMBAH KOLOM DURASI
        ['No', 'Hari', 'Tanggal', 'Tingkat', 'Kelas', 'Nama Siswa', 'Tutor', 'Tempat', 'Mulai', 'Selesai', 'Durasi (Menit)', 'Status', 'Catatan']
      ],
      body: tableData,
      theme: 'grid',
      styles: { 
        fontSize: 7,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [41, 128, 185],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },   // No
        1: { cellWidth: 12, halign: 'center' },  // Hari
        2: { cellWidth: 17, halign: 'center' },  // Tanggal
        3: { cellWidth: 15, halign: 'center' },  // Tingkat
        4: { cellWidth: 17 },                    // Kelas
        5: { cellWidth: 16 },                    // Nama Siswa
        6: { cellWidth: 17 },                    // Tutor
        7: { cellWidth: 15, halign: 'center' },  // Tempat
        8: { cellWidth: 13, halign: 'center' },  // Mulai
        9: { cellWidth: 13, halign: 'center' },  // Selesai
        10: { cellWidth: 12, halign: 'center' }, // Durasi - KOLOM BARU
        11: { cellWidth: 12, halign: 'center' }, // Status
        12: { cellWidth: 15 }                    // Catatan
      },
      margin: { top: startY },
      didDrawPage: function (data) {
        // Footer on each page
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Generated on ${new Date().toLocaleDateString('id-ID')} - Page ${data.pageNumber} of ${data.pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });

    // Generate filename
    const month = filters.month || 'all';
    const year = filters.year || 'all';
    const tutor = filters.tutor ? `_${filters.tutor.replace(/\s+/g, '_')}` : '';
    const classType = filters.classType ? `_${filters.classType.replace(/\s+/g, '_')}` : '';
    const filename = `presensi_bimbel_${month}_${year}${tutor}${classType}.pdf`;

    // Save PDF
    doc.save(filename);
    
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    alert('Error saat mengexport ke PDF: ' + error.message);
  }
};

// Fungsi tambahan untuk export data spesifik
export const exportFilteredData = (data, filters, format = 'excel') => {
  if (format === 'excel') {
    exportToExcel(data, filters);
  } else {
    exportToPDF(data, filters);
  }
};
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import * as XLSX from 'xlsx';

// ========== FUNGSI ATTENDANCE ==========

// FUNGSI BARU: Save multiple attendance records sekaligus
export const saveMultipleAttendance = async (records) => {
  try {
    const batch = writeBatch(db);
    const results = [];

    for (const record of records) {
      const docRef = doc(collection(db, 'attendance'));
      batch.set(docRef, {
        ...record,
        timestamp: Timestamp.now()
      });
      results.push({ success: true, id: docRef.id, studentName: record.studentName });
    }

    await batch.commit();
    console.log(`✅ Successfully saved ${records.length} attendance records`);
    return {
      success: true,
      message: `Berhasil menyimpan ${records.length} data presensi`,
      results: results
    };
  } catch (error) {
    console.error('❌ Error saving multiple attendance:', error);
    return {
      success: false,
      error: error.message,
      results: records.map(record => ({
        success: false,
        studentName: record.studentName,
        error: error.message
      }))
    };
  }
};

// Attendance functions
export const saveAttendance = async (record) => {
  try {
    const docRef = await addDoc(collection(db, 'attendance'), {
      ...record,
      timestamp: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving attendance:', error);
    return { success: false, error: error.message };
  }
};

export const getAttendanceData = async (filters = {}) => {
  try {
    console.log('🔍 Fetching attendance with filters:', filters);

    let q = collection(db, 'attendance');
    const constraints = [];

    // Gunakan index untuk filter tutor + order by date
    if (filters.tutor && filters.tutor.trim() !== '') {
      constraints.push(where('tutor', '==', filters.tutor.trim()));
    }

    // Selalu gunakan orderBy date
    constraints.push(orderBy('date', 'desc'));

    q = query(q, ...constraints);

    const querySnapshot = await getDocs(q);
    const data = [];

    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      data.push({
        id: doc.id,
        ...docData,
        date: docData.date,
        timestamp: docData.timestamp?.toDate?.() || docData.timestamp
      });
    });

    console.log(`✅ Found ${data.length} attendance records`);

    // Filter lainnya tetap di JavaScript (opsional)
    let finalData = data;

    if (filters.classType) {
      finalData = finalData.filter(item => item.classType === filters.classType);
    }

    if (filters.educationLevel) {
      finalData = finalData.filter(item => item.educationLevel === filters.educationLevel);
    }

    if (filters.location) {
      finalData = finalData.filter(item => item.location === filters.location);
    }

    if (filters.month && filters.year) {
      finalData = finalData.filter(item => {
        if (!item.date) return false;
        const itemDate = new Date(item.date);
        return itemDate.getMonth() + 1 === parseInt(filters.month) &&
          itemDate.getFullYear() === parseInt(filters.year);
      });
    }

    return finalData;

  } catch (error) {
    console.error('❌ Error getting attendance data:', error);

    // Fallback ke metode temporary jika masih ada error index
    if (error.code === 'failed-precondition') {
      console.log('🔄 Falling back to client-side filtering...');
      return await getAttendanceDataFallback(filters);
    }

    return [];
  }
};

// Fallback function untuk client-side filtering
const getAttendanceDataFallback = async (filters = {}) => {
  try {
    const q = query(collection(db, 'attendance'), orderBy('date', 'desc'));
    const querySnapshot = await getDocs(q);

    const allData = [];
    querySnapshot.forEach((doc) => {
      const docData = doc.data();
      allData.push({
        id: doc.id,
        ...docData,
        date: docData.date,
        timestamp: docData.timestamp?.toDate?.() || docData.timestamp
      });
    });

    // Filter di JavaScript
    let filteredData = allData;

    if (filters.tutor) {
      filteredData = filteredData.filter(item =>
        item.tutor && item.tutor.trim() === filters.tutor.trim()
      );
    }

    if (filters.classType) {
      filteredData = filteredData.filter(item => item.classType === filters.classType);
    }

    if (filters.educationLevel) {
      filteredData = filteredData.filter(item => item.educationLevel === filters.educationLevel);
    }

    if (filters.location) {
      filteredData = filteredData.filter(item => item.location === filters.location);
    }

    if (filters.month && filters.year) {
      filteredData = filteredData.filter(item => {
        if (!item.date) return false;
        const itemDate = new Date(item.date);
        return itemDate.getMonth() + 1 === parseInt(filters.month) &&
          itemDate.getFullYear() === parseInt(filters.year);
      });
    }

    return filteredData;
  } catch (error) {
    console.error('❌ Error in fallback function:', error);
    return [];
  }
};

export const deleteAttendance = async (id) => {
  try {
    await deleteDoc(doc(db, 'attendance', id));
    return true;
  } catch (error) {
    console.error('Error deleting attendance:', error);
    return false;
  }
};

// Fungsi untuk menghapus semua data attendance
export const deleteAllAttendance = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'attendance'));
    const batch = writeBatch(db);

    querySnapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });

    await batch.commit();
    console.log(`🗑️ Successfully deleted ${querySnapshot.size} attendance records`);
    return true;
  } catch (error) {
    console.error('Error deleting all attendance:', error);
    return false;
  }
};

export const updateAttendance = async (id, updates) => {
  try {
    await updateDoc(doc(db, 'attendance', id), updates);
    return true;
  } catch (error) {
    console.error('Error updating attendance:', error);
    return false;
  }
};

// ========== FUNGSI STUDENT ==========

export const getStudents = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'students'));
    const students = querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Filter out deleted students
      if (data.isDeleted) return null;
      return data.name;
    }).filter(name => name && name.trim() !== ''); // Filter valid names

    console.log(`✅ Loaded ${students.length} active students from database`);
    return students;
  } catch (error) {
    console.error('❌ Error getting students:', error);
    return [];
  }
};

export const getStudentsDetail = async (includeDeleted = false) => {
  try {
    const querySnapshot = await getDocs(collection(db, 'students'));
    const students = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).filter(student => includeDeleted || !student.isDeleted); // Filter based on param

    console.log(`✅ Loaded ${students.length} student details from database (includeDeleted: ${includeDeleted})`);
    return students;
  } catch (error) {
    console.error('Error getting student details:', error);
    return [];
  }
};

export const addStudent = async (studentData) => {
  try {
    const docRef = await addDoc(collection(db, 'students'), {
      ...studentData,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding student:', error);
    return { success: false, error: error.message };
  }
};

// FUNGSI PERBAIKAN: Update student dengan parameter object student
export const updateStudent = async (student) => {
  try {
    if (!student.id) {
      throw new Error('ID siswa diperlukan untuk update');
    }

    const studentData = { ...student };
    delete studentData.id; // Hapus id dari data yang akan diupdate

    await updateDoc(doc(db, 'students', student.id), {
      ...studentData,
      updatedAt: Timestamp.now()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating student:', error);
    return { success: false, error: error.message };
  }
};

// FUNGSI KHUSUS: Hard Delete untuk membersihkan duplikat (PERMANEN)
export const hardDeleteStudent = async (studentId) => {
  try {
    // Hapus data siswa secara permanen
    await deleteDoc(doc(db, 'students', studentId));

    // Kita juga bisa hapus attendance jika perlu, tapi untuk cleanup duplikat
    // biasanya kita ingin menghapus entry siswa yang salah saja.
    // Asumsi: duplikat "hantu" mungkin tidak punya attendance penting, atau user ingin menghapusnya.

    console.log(`🔥 Hard deleted student with ID: ${studentId}`);
    return true;
  } catch (error) {
    console.error('Error hard deleting student:', error);
    return false;
  }
};

// FUNGSI KHUSUS: Hard Delete BATCH (Banyak data sekaligus)
export const hardDeleteStudentsBatch = async (studentIds) => {
  try {
    const batch = writeBatch(db);

    studentIds.forEach(id => {
      const docRef = doc(db, 'students', id);
      batch.delete(docRef);
    });

    await batch.commit();
    console.log(`🔥 Hard deleted ${studentIds.length} students`);
    return true;
  } catch (error) {
    console.error('Error batch hard deleting:', error);
    return false;
  }
};

// FUNGSI PERBAIKAN: Delete student dengan parameter preserveAttendance (SOFT DELETE)
export const deleteStudent = async (studentId, preserveAttendance = true) => {
  try {
    // Implementasi SOFT DELETE: Hanya tandai isDeleted = true
    // Kita tidak menghapus record fisik agar data pembayaran tetap ada

    await updateDoc(doc(db, 'students', studentId), {
      isDeleted: true,
      deletedAt: Timestamp.now()
    });

    console.log(`🗑️ Soft deleted student with ID: ${studentId}`);
    return true;

    // TODO: cleanup unused code below if hard delete is no longer desired for specific paths
    /*
    // Jika preserveAttendance = true, hanya hapus data siswa saja
    if (preserveAttendance) {
      await deleteDoc(doc(db, 'students', studentId));
      console.log(`🗑️ Deleted student with ID: ${studentId} (attendance preserved)`);
      return true;
    } 
    // Jika preserveAttendance = false, hapus siswa dan attendance terkait
    else {
       // Pertama, dapatkan nama siswa untuk menghapus attendance terkait
      const studentDoc = await getDocs(query(
        collection(db, 'students'),
        where('__name__', '==', studentId)
      ));

      let studentName = '';
      if (!studentDoc.empty) {
        studentName = studentDoc.docs[0].data().name;
      }

      // Hapus data siswa
      await deleteDoc(doc(db, 'students', studentId));

      // Hapus attendance terkait jika ada nama siswa
      if (studentName) {
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('studentName', '==', studentName)
        );

        const attendanceSnapshot = await getDocs(attendanceQuery);

        if (!attendanceSnapshot.empty) {
          const batch = writeBatch(db);
          attendanceSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log(`🗑️ Deleted ${attendanceSnapshot.size} attendance records for ${studentName}`);
        }
      }

      console.log(`🗑️ Deleted student with ID: ${studentId} and related attendance`);
      return true;
    }
    */
  } catch (error) {
    console.error('Error deleting student:', error);
    return false;
  }
};

// FUNGSI PERBAIKAN: Menghapus semua data siswa (SOFT DELETE)
export const deleteAllStudents = async (preserveAttendance = true) => {
  try {
    // Get all student documents
    const querySnapshot = await getDocs(collection(db, 'students'));

    if (querySnapshot.empty) {
      console.log('📭 No students found to delete');
      return true;
    }

    // Use batch write for updates
    const batch = writeBatch(db);
    let count = 0;

    querySnapshot.docs.forEach((docSnapshot) => {
      // Hanya update yang belum deleted
      if (!docSnapshot.data().isDeleted) {
        batch.update(docSnapshot.ref, {
          isDeleted: true,
          deletedAt: Timestamp.now()
        });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`🗑️ Successfully soft deleted ${count} students`);
    } else {
      console.log('No active students to delete');
    }

    // Logic attendance removal optional for soft delete, user asked to keep payment history
    // so we skip deleting attendance/payments.

    return true;

  } catch (error) {
    console.error('❌ Error deleting all students:', error);
    throw new Error('Gagal menghapus semua data siswa: ' + error.message);
  }
};

// FUNGSI BARU: Menghapus siswa dan attendance terkait (deprecated, gunakan deleteStudent dengan parameter)
export const deleteStudentAndAttendance = async (studentId, studentName) => {
  try {
    // Delete student
    await deleteDoc(doc(db, 'students', studentId));

    // Delete related attendance records
    const attendanceQuery = query(
      collection(db, 'attendance'),
      where('studentName', '==', studentName)
    );

    const attendanceSnapshot = await getDocs(attendanceQuery);

    if (!attendanceSnapshot.empty) {
      const batch = writeBatch(db);
      attendanceSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`🗑️ Deleted ${attendanceSnapshot.size} attendance records for ${studentName}`);
    }

    return true;
  } catch (error) {
    console.error('Error deleting student and attendance:', error);
    return false;
  }
};

// FUNGSI BARU: Search students by name
export const searchStudents = async (searchTerm) => {
  try {
    const students = await getStudentsDetail();
    return students.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.class && student.class.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.parentName && student.parentName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  } catch (error) {
    console.error('Error searching students:', error);
    return [];
  }
};

// FUNGSI BARU: Get student statistics
export const getStudentStatistics = async () => {
  try {
    const students = await getStudentsDetail();

    const stats = {
      total: students.length,
      byEducationLevel: {},
      byClass: {},
      withPhone: 0,
      withParentInfo: 0
    };

    students.forEach(student => {
      // Count by education level
      const level = student.educationLevel || 'Tidak Diketahui';
      stats.byEducationLevel[level] = (stats.byEducationLevel[level] || 0) + 1;

      // Count by class (if any)
      if (student.class) {
        stats.byClass[student.class] = (stats.byClass[student.class] || 0) + 1;
      }

      // Count with phone
      if (student.phone && student.phone.trim() !== '') {
        stats.withPhone++;
      }

      // Count with parent info
      if (student.parentName && student.parentName.trim() !== '') {
        stats.withParentInfo++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting student statistics:', error);
    return null;
  }
};

// ========== FUNGSI IMPORT/EXPORT ==========

// Import Students from Excel - DENGAN VALIDASI LEBIH KETAT
export const importStudentsFromExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Ambil sheet pertama
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // Convert ke JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Validasi data minimal
        if (jsonData.length <= 1) {
          throw new Error('File Excel kosong atau hanya berisi header');
        }

        // Proses data (skip header row jika ada)
        const students = [];
        let startRow = 0;

        // Cek jika ada header
        if (jsonData.length > 0) {
          // Cari baris header yang mengandung "Nama" atau "Name"
          for (let r = 0; r < Math.min(jsonData.length, 10); r++) {
            const potentialHeader = jsonData[r];
            if (Array.isArray(potentialHeader) && potentialHeader.length > 0 &&
              typeof potentialHeader[0] === 'string' &&
              (potentialHeader[0].toLowerCase().includes('nama') ||
                potentialHeader[0].toLowerCase().includes('name'))) {
              startRow = r + 1;
              break;
            }
          }
        }

        // Gunakan batch write untuk performa lebih baik
        const batch = writeBatch(db);
        let successCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;
        const errors = [];

        // Get existing students to check for duplicates (including deleted ones)
        const existingStudents = await getStudentsDetail(true);
        // Map normalized name to student object for smarter checks
        const existingStudentsMap = new Map();
        existingStudents.forEach(s => {
          if (s.name) {
            existingStudentsMap.set(s.name.toLowerCase().trim(), s);
          }
        });



        // Keywords to blacklist/ignore (metadata rows from export)
        const ignoredKeywords = [
          'statistik', 'statistic', 'total', 'tanggal export', 'export date',
          'tk:', 'sd:', 'smp:', 'sma:', 'umum:', 'petunjuk'
        ];

        // Process each row
        for (let i = startRow; i < jsonData.length; i++) {
          const row = jsonData[i];

          try {
            if (row && row.length > 0 && row[0]) {
              const studentName = row[0].toString().trim();

              if (!studentName) {
                continue; // Skip empty names silently
              }

              // Check if row is a footer/metadata row
              const lowerName = studentName.toLowerCase();
              if (ignoredKeywords.some(keyword => lowerName.includes(keyword)) || studentName.endsWith(':')) {
                console.log(`ℹ️ Skipping metadata row: ${studentName}`);
                continue;
              }

              // Check for duplicate or deleted student
              if (existingStudentsMap.has(lowerName)) {
                const existingStudent = existingStudentsMap.get(lowerName);

                // If student exists but is deleted -> Reactivate them!
                if (existingStudent.isDeleted) {
                  console.log(`♻️ Reactivating soft-deleted student: ${studentName}`);

                  // Update existing doc to remove isDeleted flag
                  const studentRef = doc(db, 'students', existingStudent.id);
                  batch.update(studentRef, {
                    isDeleted: false,
                    deletedAt: null,
                    updatedAt: Timestamp.now(),
                    // Optionally update other fields if they changed in Excel?
                    // For safety, let's just reactivate for now to preserve history.
                  });

                  // Update map so we don't process this again if duplicate rows exist in Excel
                  existingStudent.isDeleted = false;
                  successCount++;
                  continue;
                } else {
                  // Student exists and is active -> Duplicate
                  console.log(`⚠️ Skipping duplicate: ${studentName}`);
                  duplicateCount++;
                  continue;
                }
              }

              // Validate education level
              let educationLevel = '';
              if (row[1]) {
                const level = row[1].toString().trim().toUpperCase();
                const validLevels = ['TK', 'SD', 'SMP', 'SMA', 'UMUM'];
                educationLevel = validLevels.includes(level) ? level : '';
              }

              // Validate phone number
              let phone = '';
              if (row[3]) {
                phone = row[3].toString().trim();
                // Basic phone validation
                const phoneRegex = /^[0-9+\-\s()]*$/;
                if (phone && !phoneRegex.test(phone)) {
                  console.log(`⚠️ Phone format warning for ${studentName}: ${phone}`);
                }
              }

              const studentData = {
                name: studentName,
                educationLevel: educationLevel,
                class: row[2] ? row[2].toString().trim() : '',
                phone: phone,
                parentName: row[4] ? row[4].toString().trim() : '',
                notes: row[5] ? row[5].toString().trim() : '',
                createdAt: Timestamp.now(),
                imported: true,
                isDeleted: false // Explicitly set active
              };

              // Tambah ke batch
              const docRef = doc(collection(db, 'students'));
              batch.set(docRef, studentData);
              students.push(studentData);

              // Add to map to prevent duplicates within same import file
              existingStudentsMap.set(lowerName, { ...studentData, id: docRef.id });
              successCount++;
            }
          } catch (rowError) {
            errors.push(`Baris ${i + 1}: ${rowError.message}`);
            errorCount++;
          }
        }

        // Commit batch jika ada data yang valid
        if (successCount > 0) {
          await batch.commit();
        }

        // Prepare result message
        let message = `Berhasil mengimport ${successCount} siswa`;
        if (duplicateCount > 0) {
          message += ` (${duplicateCount} data duplikat dilewati)`;
        }
        if (errorCount > 0) {
          message += ` (${errorCount} error)`;
        }

        resolve({
          success: successCount > 0,
          message: message,
          data: students,
          stats: {
            imported: successCount,
            duplicates: duplicateCount,
            errors: errorCount,
            errorDetails: errors
          }
        });

      } catch (error) {
        reject({
          success: false,
          message: 'Error membaca file Excel: ' + error.message
        });
      }
    };

    reader.onerror = () => {
      reject({
        success: false,
        message: 'Error membaca file'
      });
    };

    reader.readAsArrayBuffer(file);
  });
};

// Export Student Template - VERSI IMPROVED
export const exportStudentTemplate = () => {
  const templateData = [
    ['Nama Siswa', 'Tingkat Pendidikan', 'Kelas', 'No. Telepon', 'Nama Orang Tua', 'Catatan'],
    ['Contoh: Andi Wijaya', 'SD', '4A', '08123456789', 'Budi Wijaya', 'Siswa berprestasi'],
    ['Siti Nurhaliza', 'SMP', '7B', '082112345678', 'Ahmad Nurhaliza', ''],
    ['Budi Santoso', 'SMA', 'X IPA 1', '081312345678', 'Siti Santoso', 'Siswa baru'],
    ['', '', '', '', '', ''],
    ['PETUNJUK PENGISIAN:', '', '', '', '', ''],
    ['1. Kolom "Nama Siswa" WAJIB diisi', '', '', '', '', ''],
    ['2. Kolom "Tingkat Pendidikan" isi dengan: TK, SD, SMP, SMA, atau Umum', '', '', '', '', ''],
    ['3. Kolom lainnya opsional', '', '', '', '', ''],
    ['4. Hapus baris contoh sebelum import data asli', '', '', '', '', ''],
    ['5. Pastikan format Excel sesuai (.xlsx atau .xls)', '', '', '', '', '']
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa');

  // Set column widths
  const colWidths = [
    { wch: 25 }, // Nama Siswa
    { wch: 18 }, // Tingkat Pendidikan
    { wch: 12 }, // Kelas
    { wch: 18 }, // No. Telepon
    { wch: 25 }, // Nama Orang Tua
    { wch: 30 }  // Catatan
  ];
  worksheet['!cols'] = colWidths;

  // Add some styling through cell formatting
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  for (let R = 0; R <= range.e.r; R++) {
    for (let C = 0; C <= range.e.c; C++) {
      const cell_address = { c: C, r: R };
      const cell_ref = XLSX.utils.encode_cell(cell_address);

      if (R === 0) {
        // Header row - bold
        if (!worksheet[cell_ref]) worksheet[cell_ref] = {};
        worksheet[cell_ref].s = { font: { bold: true } };
      } else if (R >= 6 && R <= 10) {
        // Instruction rows - italic
        if (!worksheet[cell_ref]) worksheet[cell_ref] = {};
        worksheet[cell_ref].s = { font: { italic: true, color: { rgb: "FF0000" } } };
      }
    }
  }

  XLSX.writeFile(workbook, 'template_import_siswa.xlsx');
};

// Export Students to Excel - DENGAN FORMATTING LEBIH BAIK
export const exportStudentsToExcel = async () => {
  try {
    const students = await getStudentsDetail();

    if (students.length === 0) {
      throw new Error('Tidak ada data siswa untuk di-export');
    }

    const excelData = [
      ['DATA SISWA', '', '', '', '', ''],
      ['Tanggal Export:', new Date().toLocaleDateString('id-ID'), '', '', '', ''],
      ['Total Siswa:', students.length, '', '', '', ''],
      ['', '', '', '', '', ''],
      ['Nama Siswa', 'Tingkat Pendidikan', 'Kelas', 'No. Telepon', 'Nama Orang Tua', 'Catatan']
    ];

    // Add student data
    students.forEach(student => {
      excelData.push([
        student.name || '',
        student.educationLevel || '',
        student.class || '',
        student.phone || '',
        student.parentName || '',
        student.notes || ''
      ]);
    });

    // Add statistics at the end
    const stats = {
      tk: students.filter(s => s.educationLevel === 'TK').length,
      sd: students.filter(s => s.educationLevel === 'SD').length,
      smp: students.filter(s => s.educationLevel === 'SMP').length,
      sma: students.filter(s => s.educationLevel === 'SMA').length,
      umum: students.filter(s => s.educationLevel === 'UMUM').length
    };

    excelData.push(['', '', '', '', '', '']);
    excelData.push(['STATISTIK:', '', '', '', '', '']);
    excelData.push(['TK:', stats.tk, '', '', '', '']);
    excelData.push(['SD:', stats.sd, '', '', '', '']);
    excelData.push(['SMP:', stats.smp, '', '', '', '']);
    excelData.push(['SMA:', stats.sma, '', '', '', '']);
    excelData.push(['Umum:', stats.umum, '', '', '', '']);

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Siswa');

    // Set column widths
    const colWidths = [
      { wch: 25 }, // Nama Siswa
      { wch: 18 }, // Tingkat Pendidikan
      { wch: 12 }, // Kelas
      { wch: 18 }, // No. Telepon
      { wch: 25 }, // Nama Orang Tua
      { wch: 30 }  // Catatan
    ];
    worksheet['!cols'] = colWidths;

    // Format cells
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let R = 0; R <= range.e.r; R++) {
      for (let C = 0; C <= range.e.c; C++) {
        const cell_address = { c: C, r: R };
        const cell_ref = XLSX.utils.encode_cell(cell_address);

        if (!worksheet[cell_ref]) continue;

        // Header formatting
        if (R === 0) {
          worksheet[cell_ref].s = {
            font: { bold: true, size: 14, color: { rgb: "0000FF" } },
            alignment: { horizontal: "center" }
          };
        } else if (R === 4) {
          worksheet[cell_ref].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: "E0E0E0" } }
          };
        } else if (R >= 5 && R < 5 + students.length) {
          // Student data rows - alternate coloring
          if ((R - 5) % 2 === 0) {
            worksheet[cell_ref].s = { fill: { fgColor: { rgb: "F8F8F8" } } };
          }
        }
      }
    }

    // Merge header cells
    if (!worksheet['!merges']) worksheet['!merges'] = [];
    worksheet['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });

    const fileName = `data_siswa_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return { success: true, fileName: fileName, count: students.length };

  } catch (error) {
    console.error('Error exporting students to Excel:', error);
    return { success: false, error: error.message };
  }
};

// FUNGSI BARU: Backup semua data ke Excel
export const backupAllData = async () => {
  try {
    // Get all data
    const [students, attendance] = await Promise.all([
      getStudentsDetail(),
      getAttendanceData({})
    ]);

    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Students sheet
    const studentData = students.map(student => ({
      'ID': student.id,
      'Nama Siswa': student.name,
      'Tingkat Pendidikan': student.educationLevel,
      'Kelas': student.class,
      'No. Telepon': student.phone,
      'Nama Orang Tua': student.parentName,
      'Catatan': student.notes,
      'Dibuat': student.createdAt?.toDate?.()?.toLocaleString() || ''
    }));

    const studentSheet = XLSX.utils.json_to_sheet(studentData);
    XLSX.utils.book_append_sheet(workbook, studentSheet, 'Siswa');

    // Attendance sheet
    const attendanceData = attendance.map(record => ({
      'ID': record.id,
      'Tanggal': record.date,
      'Nama Siswa': record.studentName,
      'Tutor': record.tutor,
      'Tipe Kelas': record.classType,
      'Tingkat Pendidikan': record.educationLevel,
      'Lokasi': record.location,
      'Waktu Mulai': record.startTime,
      'Waktu Selesai': record.endTime,
      'Durasi (menit)': record.duration,
      'Catatan': record.notes,
      'Waktu Input': record.timestamp?.toLocaleString() || ''
    }));

    const attendanceSheet = XLSX.utils.json_to_sheet(attendanceData);
    XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Presensi');

    // Summary sheet
    const summaryData = [
      ['BACKUP DATA SISTEM PRESENSI'],
      ['Tanggal Backup:', new Date().toLocaleDateString('id-ID')],
      ['Waktu Backup:', new Date().toLocaleTimeString('id-ID')],
      [''],
      ['STATISTIK DATA'],
      ['Total Siswa:', students.length],
      ['Total Presensi:', attendance.length],
      [''],
      ['INFO SISTEM'],
      ['Backup dibuat oleh:', 'Sistem Presensi Bimbel'],
      ['Format file:', 'Excel (.xlsx)'],
      ['Total sheet:', '3']
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan');

    const fileName = `backup_data_${new Date().toISOString().split('T')[0]}_${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return {
      success: true,
      fileName: fileName,
      stats: {
        students: students.length,
        attendance: attendance.length
      }
    };

  } catch (error) {
    console.error('Error creating backup:', error);
    return { success: false, error: error.message };
  }
};

// ========== FUNGSI LAINNYA ==========

export const getClasses = () => {
  return [
    'Matematika',
    'Fisika',
    'Kimia',
    'Biologi',
    'Bahasa Inggris',
    'Bahasa Indonesia',
    'Komputer',
    'Calistung',
    'IPA',
    'IPS'
  ];
};

// FUNGSI BARU: Get unique values for filters
export const getUniqueValues = async (collectionName, fieldName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const values = new Set();

    querySnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data[fieldName]) {
        values.add(data[fieldName]);
      }
    });

    return Array.from(values).sort();
  } catch (error) {
    console.error(`Error getting unique ${fieldName}:`, error);
    return [];
  }
};

// FUNGSI BARU: Bulk update students
export const bulkUpdateStudents = async (updates) => {
  try {
    const batch = writeBatch(db);

    for (const update of updates) {
      if (update.id) {
        const docRef = doc(db, 'students', update.id);
        batch.update(docRef, update.data);
      }
    }

    await batch.commit();
    return { success: true, updated: updates.length };
  } catch (error) {
    console.error('Error in bulk update:', error);
    return { success: false, error: error.message };
  }
};

// FUNGSI BARU: Get system statistics
export const getSystemStatistics = async () => {
  try {
    const [students, attendance] = await Promise.all([
      getStudentsDetail(),
      getAttendanceData({})
    ]);

    // Calculate monthly attendance
    const monthlyStats = {};
    attendance.forEach(record => {
      if (record.date) {
        const date = new Date(record.date);
        const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyStats[monthYear]) {
          monthlyStats[monthYear] = 0;
        }
        monthlyStats[monthYear]++;
      }
    });

    return {
      students: {
        total: students.length,
        withPhone: students.filter(s => s.phone && s.phone.trim() !== '').length,
        withParentInfo: students.filter(s => s.parentName && s.parentName.trim() !== '').length
      },
      attendance: {
        total: attendance.length,
        byMonth: monthlyStats
      },
      lastUpdated: Timestamp.now()
    };
  } catch (error) {
    console.error('Error getting system statistics:', error);
    return null;
  }
};
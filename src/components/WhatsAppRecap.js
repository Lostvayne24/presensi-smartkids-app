// components/WhatsAppRecap.js
import React, { useState } from 'react';

const WhatsAppRecap = ({ attendanceData, tutorName }) => {
    const [copied, setCopied] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');

    // Get unique dates from attendance data
    const getUniqueDates = () => {
        const dates = [...new Set(attendanceData.map(item => item.date))].sort((a, b) => new Date(b) - new Date(a));
        return dates;
    };

    const uniqueDates = getUniqueDates();

    // Format date to Indonesian format
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

        const dayName = days[date.getDay()];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();

        return `${dayName}, ${day} ${month} ${year}`;
    };

    // Generate WhatsApp recap text
    const generateRecapText = (date) => {
        if (!date) return '';

        // Filter data for selected date and only "Hadir" status
        const dayData = attendanceData.filter(item => item.date === date && item.status === 'Hadir');

        if (dayData.length === 0) return '';

        // Group by location first, then by time slot
        const locationGroups = {};

        dayData.forEach(item => {
            const location = item.location || 'Lokasi tidak disebutkan';
            const timeSlot = item.timeStart && item.timeEnd
                ? `${item.timeStart} - ${item.timeEnd}`
                : item.timeSlot || 'Waktu tidak disebutkan';

            // Initialize location group if not exists
            if (!locationGroups[location]) {
                locationGroups[location] = {};
            }

            // Initialize time slot within location if not exists
            if (!locationGroups[location][timeSlot]) {
                locationGroups[location][timeSlot] = [];
            }

            // Parse education level to extract number and level (e.g., "2 SD" from educationLevel)
            let educationText = '';
            if (item.educationLevel) {
                // Check if classType contains a number (e.g., "Kelas 2", "2", etc.)
                const classMatch = item.classType?.match(/\d+/);
                const classNumber = classMatch ? classMatch[0] : '';

                educationText = classNumber ? `${classNumber} ${item.educationLevel}` : item.educationLevel;
            }

            locationGroups[location][timeSlot].push({
                name: item.studentName,
                education: educationText,
                notes: item.notes
            });
        });

        // Build the recap text
        let recap = `${tutorName}\n`;
        recap += `${formatDate(date)}\n\n`;

        // Sort locations alphabetically
        const sortedLocations = Object.keys(locationGroups).sort();

        sortedLocations.forEach(location => {
            // Display location name once
            recap += `${location}\n`;

            // Sort time slots within this location
            const timeSlots = Object.keys(locationGroups[location]).sort();

            timeSlots.forEach((timeSlot, index) => {
                recap += `${timeSlot}\n`;

                const students = locationGroups[location][timeSlot];
                students.forEach(student => {
                    const educationText = student.education ? ` (${student.education})` : '';
                    recap += `- ${student.name}${educationText}\n`;
                });

                // Don't add extra line break after the last time slot in this location
                // We'll add it after all time slots for this location are done
            });

            // Add blank line after all time slots for this location
            recap += '\n';
        });

        // Add notes section if there are any notes
        const allNotes = dayData
            .filter(item => item.notes && item.notes.trim() !== '')
            .map(item => {
                // Get first name (first word of student name)
                const firstName = item.studentName?.split(' ')[0] || '';
                return `- ${firstName} ${item.notes}`;
            })
            .join('\n');

        if (allNotes) {
            recap += `Ket:\n${allNotes}\n`;
        }

        return recap.trim();
    };

    const handleCopy = () => {
        const text = generateRecapText(selectedDate);
        if (!text) {
            alert('Tidak ada data untuk tanggal yang dipilih');
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
            alert('Gagal menyalin teks. Silakan coba lagi.');
        });
    };

    if (uniqueDates.length === 0) {
        return null;
    }

    return (
        <div className="whatsapp-recap-container">
            <div className="whatsapp-recap-header">
                <h3>📱 Salin Rekap untuk WhatsApp</h3>
                <p className="whatsapp-recap-description">
                    Pilih tanggal untuk membuat rekap presensi yang siap dikirim ke grup WhatsApp
                </p>
            </div>

            <div className="whatsapp-recap-controls">
                <div className="date-selector">
                    <label htmlFor="recap-date">Pilih Tanggal:</label>
                    <select
                        id="recap-date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="recap-date-select"
                    >
                        <option value="">-- Pilih Tanggal --</option>
                        {uniqueDates.map((date, index) => (
                            <option key={index} value={date}>
                                {formatDate(date)}
                            </option>
                        ))}
                    </select>
                </div>

                {selectedDate && (
                    <button
                        onClick={handleCopy}
                        className={`copy-recap-btn ${copied ? 'copied' : ''}`}
                    >
                        {copied ? '✓ Tersalin!' : '📋 Salin Rekap'}
                    </button>
                )}
            </div>

            {selectedDate && (
                <div className="recap-preview">
                    <h4>Preview:</h4>
                    <pre className="recap-text">{generateRecapText(selectedDate)}</pre>
                </div>
            )}
        </div>
    );
};

export default WhatsAppRecap;

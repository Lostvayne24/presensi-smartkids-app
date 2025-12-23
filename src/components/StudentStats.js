import React from 'react';

const StudentStats = ({
    totalStudents,
    filteredCount,
    educationStats,
    additionalStats
}) => {
    return (
        <div className="stats-container">
            <h3>📊 Statistik Dashboard</h3>

            {/* Main Stats */}
            <div className="main-stats-grid">
                <div className="stat-card-modern primary">
                    <div className="stat-icon">👥</div>
                    <div>
                        <div className="stat-value-big">{totalStudents}</div>
                        <div className="stat-label-modern">Total Siswa</div>
                    </div>
                </div>

                <div className="stat-card-modern success">
                    <div className="stat-icon">🎓</div>
                    <div>
                        <div className="stat-value-big">{educationStats.tk + educationStats.sd + educationStats.smp + educationStats.sma}</div>
                        <div className="stat-label-modern">Siswa Sekolah</div>
                    </div>
                </div>

                <div className="stat-card-modern warning">
                    <div className="stat-icon">🔍</div>
                    <div>
                        <div className="stat-value-big">{filteredCount}</div>
                        <div className="stat-label-modern">Ditampilkan</div>
                    </div>
                </div>
            </div>

            {/* Education Levels Breakdown */}
            <h4>Tingkat Pendidikan</h4>
            <div className="education-levels-grid">
                <div className="edu-card">
                    <span className="count">{educationStats.tk}</span>
                    <span className="label">TK</span>
                </div>
                <div className="edu-card">
                    <span className="count">{educationStats.sd}</span>
                    <span className="label">SD</span>
                </div>
                <div className="edu-card">
                    <span className="count">{educationStats.smp}</span>
                    <span className="label">SMP</span>
                </div>
                <div className="edu-card">
                    <span className="count">{educationStats.sma}</span>
                    <span className="label">SMA</span>
                </div>
                <div className="edu-card">
                    <span className="count">{educationStats.umum}</span>
                    <span className="label">Umum</span>
                </div>
                <div className="edu-card">
                    <span className="count">{educationStats.unknown}</span>
                    <span className="label">Lainnya</span>
                </div>
            </div>

            {/* Additional Info */}
            <div className="additional-stats-modern">
                <div className="mini-stat-item">
                    <div className="mini-stat-icon">📱</div>
                    <div className="mini-stat-info">
                        <strong>{additionalStats.withPhone}</strong>
                        <span>Nomor Telepon</span>
                    </div>
                </div>
                <div className="mini-stat-item">
                    <div className="mini-stat-icon">👨‍👩‍👧</div>
                    <div className="mini-stat-info">
                        <strong>{additionalStats.withParent}</strong>
                        <span>Data Orang Tua</span>
                    </div>
                </div>
                <div className="mini-stat-item">
                    <div className="mini-stat-icon">📝</div>
                    <div className="mini-stat-info">
                        <strong>{additionalStats.withNotes}</strong>
                        <span>Catatan Khusus</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentStats;

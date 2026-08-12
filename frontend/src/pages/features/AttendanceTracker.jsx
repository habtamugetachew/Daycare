import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/useLanguage';

const AttendanceTracker = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [attendance, setAttendance] = useState({ records: [], absentChildren: [], summary: {} });
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const query = selectedClassroom ? `?classroomId=${selectedClassroom}` : '';
      const res = await api.get(`/attendance/today${query}`);
      setAttendance(res.data.data);
    } catch (err) {
      setError('Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadClassrooms = async () => {
      if (['admin', 'reception'].includes(user?.role)) {
        const res = await api.get('/classrooms');
        setClassrooms(res.data.data);
      }
    };
    loadClassrooms();
  }, [user]);

  useEffect(() => {
    fetchAttendance();
  }, [selectedClassroom]);

  const handleSetStatus = async (childId, classroomId, status) => {
    setActionLoading(childId);
    setError('');
    try {
      if (status === 'present') {
        await api.post('/attendance/checkin', { childId, classroomId });
      } else {
        await api.post('/attendance/absence', { childId, classroomId, status });
      }
      setSuccess(`Status updated to ${status}`);
      fetchAttendance();
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to update status.');
    } finally {
      setActionLoading('');
    }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  // Derive unified list of all students
  const allStudents = [];
  if (attendance.records) {
    attendance.records.forEach(r => {
      if (r.child) {
        allStudents.push({
          _id: r.child._id,
          firstName: r.child.firstName,
          lastName: r.child.lastName,
          classroom: r.classroom?._id || r.classroom,
          record: r
        });
      }
    });
  }
  if (attendance.absentChildren) {
    attendance.absentChildren.forEach(c => {
      allStudents.push({
        _id: c._id,
        firstName: c.firstName,
        lastName: c.lastName,
        classroom: c.classroom,
        record: null
      });
    });
  }
  allStudents.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('attendanceTracker', 'Attendance Tracker')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{today}</p>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-4 text-sm">{error}</div>}
      {success && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-4 text-sm">✅ {success}</div>}

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('present', 'Present'), value: attendance.summary?.present || 0,
            icon: 'bx-user-check',
            bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-400' },
          { label: t('absent', 'Absent'),  value: (attendance.absentChildren?.length || 0) + (attendance.records?.filter(r => r.status === 'absent').length || 0),
            icon: 'bx-user-x',
            bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20', text: 'text-rose-600 dark:text-rose-400' },
          { label: t('late', 'Late'),    value: attendance.summary?.late || 0,
            icon: 'bx-time',
            bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20', text: 'text-amber-600 dark:text-amber-400' },
          { label: t('sick', 'Sick'),    value: attendance.summary?.sick || 0,
            icon: 'bx-plus-medical',
            bg: 'bg-[#00ADB5]/5 dark:bg-[#00ADB5]/10', border: 'border-[#00ADB5]/20', text: 'text-[#00ADB5]' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-2xl p-5 shadow-sm`}>
            <i className={`bx ${s.icon} text-xl ${s.text}`} />
            <p className={`text-2xl font-bold ${s.text} mt-2`}>{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white dark:bg-[#111c2d] rounded-2xl border border-slate-200 dark:border-teal-900/30 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-teal-900/30 bg-slate-50 dark:bg-[#0d1520]/50">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <i className="bx bx-group text-indigo-400" /> {t('allStudents', 'All Students')} ({allStudents.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-teal-900/30 max-h-[600px] overflow-y-auto">
            {allStudents.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-10">{t('noStudentsFound', 'No students found.')}</p>
            ) : (
              allStudents.map(student => {
                const currentStatus = student.record?.status; // 'present', 'absent', 'late', 'sick'
                return (
                  <div key={student._id} className="flex flex-col lg:flex-row lg:items-center justify-between px-6 py-4 gap-4 hover:bg-slate-50 dark:hover:bg-[#162030]/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-base font-bold shadow-sm flex-shrink-0">
                        {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-800 dark:text-white">
                          {student.firstName} {student.lastName}
                        </p>
                        {student.record?.checkIn?.time && (
                          <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
                            <i className="bx bx-time-five" /> 
                            {t('checkedInAt', 'Checked in at')} {new Date(student.record.checkIn.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { id: 'present', label: t('present', 'Present'), icon: 'bx-user-check', activeClass: 'bg-emerald-500 text-white shadow-emerald-500/40', inactiveClass: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20' },
                        { id: 'absent',  label: t('absent', 'Absent'),  icon: 'bx-user-x',     activeClass: 'bg-rose-500 text-white shadow-rose-500/40',    inactiveClass: 'bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20' },
                        { id: 'late',    label: t('late', 'Late'),    icon: 'bx-time',       activeClass: 'bg-amber-500 text-white shadow-amber-500/40',  inactiveClass: 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:hover:bg-amber-500/20' },
                        { id: 'sick',    label: t('sick', 'Sick'),    icon: 'bx-plus-medical',activeClass: 'bg-purple-500 text-white shadow-purple-500/40',inactiveClass: 'bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:hover:bg-purple-500/20' }
                      ].map(opt => {
                        const isActive = currentStatus === opt.id;
                        return (
                          <button
                            key={opt.id}
                            onClick={() => handleSetStatus(student._id, student.classroom, opt.id)}
                            disabled={actionLoading === student._id}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                              isActive 
                                ? `${opt.activeClass} shadow-lg scale-105`
                                : `${opt.inactiveClass} hover:scale-105`
                            } ${actionLoading === student._id ? 'opacity-50 cursor-not-allowed scale-100' : ''}`}
                          >
                            <i className={`bx ${opt.icon} text-sm`} />
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;


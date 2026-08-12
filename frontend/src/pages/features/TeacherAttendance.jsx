import React, { useMemo, useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../context/useLanguage';

/* ── status config — moved inside component to support t() ── */

const fmt = (v) => (!v || v === '-' ? '—' : v);
const initials = (name = '') => name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

/* convert HH:mm → h:mm AM/PM */
const to12h = (t) => {
  if (!t || t === '-') return '-';
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

/* ══════════════════════════════════════════════════════════ */
const TeacherAttendance = () => {
  const { t } = useLanguage();

  const STATUS_CONFIG = {
    present:    { label: t('present'),  accent: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
    late:       { label: t('late'),     accent: 'bg-amber-50  text-amber-700  border-amber-200',  dot: 'bg-amber-400'  },
    absent:     { label: t('absent'),   accent: 'bg-rose-50   text-rose-600   border-rose-200',   dot: 'bg-rose-400'   },
    'on-leave': { label: t('onLeave'),  accent: 'bg-cyan-50   text-cyan-700   border-cyan-200',   dot: 'bg-cyan-400'   },
  };
  const STATUS_OPTIONS = [
    { key: 'present',   label: t('present')  },
    { key: 'late',      label: t('late')     },
    { key: 'absent',    label: t('absent')   },
    { key: 'on-leave',  label: t('onLeave')  },
  ];

  const [teachers, setTeachers]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  /* filters */
  const [currentDate, setCurrentDate]       = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch]                 = useState('');
  const [classroomFilter, setClassroomFilter] = useState('__ALL__');
  const [statusFilter, setStatusFilter]     = useState('__ALL__');

  /* modal */
  const [modalOpen, setModalOpen]           = useState(false);
  const [selectedId, setSelectedId]         = useState(null);
  const [selStatus, setSelStatus]           = useState('present');
  const [selCheckIn, setSelCheckIn]         = useState('08:00');
  const [selCheckOut, setSelCheckOut]       = useState('15:00');

  /* recent submissions */
  const [recentRecords, setRecentRecords]   = useState([]);

  /* ── load teachers + today attendance ──────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      /* 1. Fetch all teachers from staff list */
      const staffRes = await api.get('/staff', { params: { role: 'teacher' } });
      const staffList = staffRes.data?.data || staffRes.data || [];

      /* 2. Try to fetch today's saved attendance (may fail if none saved yet) */
      let attendanceMap = {};
      try {
        const attRes = await api.get('/teacher-attendance');
        const records = attRes.data?.data || [];
        records.forEach(r => {
          attendanceMap[String(r.id || r._id)] = r;
        });
      } catch {
        /* no attendance yet — that's fine */
      }

      /* 3. Merge: every teacher gets a row, with saved attendance overlaid */
      const merged = staffList.map(t => {
        const tid = String(t._id || t.id);
        const saved = attendanceMap[tid];
        return {
          id:        tid,
          fullName:  t.fullName || t.name || 'Unknown',
          role:      t.role     || 'Nanny',
          classroom: saved?.classroom || t.classroom || 'Unassigned',
          status:    saved?.status    || 'absent',
          checkIn:   saved?.checkIn   || '-',
          checkOut:  saved?.checkOut  || '-',
        };
      });

      setTeachers(merged);
    } catch (err) {
      console.error('Failed to load teachers:', err);
      setError('Could not load teachers. Check backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flash = (setter, msg) => { setter(msg); setTimeout(() => setter(''), 3500); };

  /* ── derived ────────────────────────────────────────────── */
  const classroomOptions = useMemo(() => [
    '__ALL__',
    ...Array.from(new Set(teachers.map(teacher => teacher.classroom).filter(Boolean))),
  ], [teachers]);

  const filtered = useMemo(() => teachers.filter(teacher => {
    const q = search.toLowerCase();
    const matchQ = !q
      || teacher.fullName.toLowerCase().includes(q)
      || teacher.role.toLowerCase().includes(q)
      || teacher.classroom.toLowerCase().includes(q);
    const matchC = classroomFilter === '__ALL__' || teacher.classroom === classroomFilter;
    const matchS = statusFilter === '__ALL__' || STATUS_CONFIG[teacher.status]?.label === statusFilter;
    return matchQ && matchC && matchS;
  }), [teachers, search, classroomFilter, statusFilter, STATUS_CONFIG]);

  const totals = useMemo(() => ({
    total:   teachers.length,
    present: teachers.filter(teacher => teacher.status === 'present').length,
    late:    teachers.filter(teacher => teacher.status === 'late').length,
    absent:  teachers.filter(teacher => teacher.status === 'absent').length,
    onLeave: teachers.filter(teacher => teacher.status === 'on-leave').length,
  }), [teachers]);

  /* ── open modal ─────────────────────────────────────────── */
  const openModal = (teacherId) => {
    const t = teachers.find(x => x.id === teacherId);
    if (!t) return;
    setSelectedId(teacherId);
    setSelStatus(t.status === 'absent' ? 'present' : t.status); // default to present when unmarked
    setSelCheckIn(t.checkIn  === '-' ? '08:00' : t.checkIn);
    setSelCheckOut(t.checkOut === '-' ? '15:00' : t.checkOut);
    setModalOpen(true);
  };

  /* ── open modal from header button (picks first teacher) ── */
  const openModalFirst = () => {
    if (teachers.length === 0) {
      flash(setError, 'No providers loaded. Check backend connection.');
      return;
    }
    openModal(teachers[0].id);
  };

  /* ── save attendance ────────────────────────────────────── */
  const saveAttendance = async () => {
    const noTime      = selStatus === 'absent' || selStatus === 'on-leave';
    const checkInVal  = noTime ? '-' : to12h(selCheckIn  || '08:00');
    const checkOutVal = noTime ? '-' : to12h(selCheckOut || '15:00');

    const teacher = teachers.find(t => t.id === selectedId);
    if (!teacher) return;

    setSaving(true);

    /* optimistic UI update */
    setTeachers(prev => prev.map(t =>
      t.id === selectedId
        ? { ...t, status: selStatus, checkIn: checkInVal, checkOut: checkOutVal }
        : t
    ));

    try {
      await api.post('/teacher-attendance', {
        teacherId: selectedId,
        status:    selStatus,
        checkIn:   checkInVal,
        checkOut:  checkOutVal,
      });

      /* push to recent list (newest first, max 10) */
      setRecentRecords(prev => [
        {
          id:        selectedId,
          fullName:  teacher.fullName,
          classroom: teacher.classroom,
          status:    selStatus,
          checkIn:   checkInVal,
          checkOut:  checkOutVal,
          savedAt:   new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev.filter(r => r.id !== selectedId),
      ].slice(0, 10));

      flash(setSuccessMsg, `${teacher.fullName}'s attendance saved successfully.`);

      // Re-fetch to confirm DB state (replaces optimistic update with real data)
      await load();
    } catch (err) {
      console.error('Save failed:', err.response?.data || err.message);
      flash(setError, err.response?.data?.message || 'Failed to save. Please try again.');
      load(); /* roll back optimistic update */
    } finally {
      setSaving(false);
      setModalOpen(false);
    }
  };

  /* ── loading ────────────────────────────────────────────── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-400">{t('loadingTeachers')}</p>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-600/80">{t('receptionDeskLabel')}</p>
          <h1 className="text-3xl font-bold text-slate-950">{t('providerAttendanceTitle')}</h1>
          <p className="max-w-2xl text-slate-500 mt-1 text-sm">
            {t('providerAttendanceSubtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={openModalFirst}
          className="self-start inline-flex items-center gap-2 rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-300"
        >
          <i className="bx bx-check-square text-base" />
          {t('markAttendance')}
        </button>
      </div>

      {/* ── Alerts ─────────────────────────────────────────── */}
      {error      && <div className="rounded-xl bg-rose-50    border border-rose-200    text-rose-600    p-4 text-sm flex items-center gap-2"><i className="bx bx-error-circle text-lg"/>{error}</div>}
      {successMsg && <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 text-sm flex items-center gap-2"><i className="bx bx-check-circle text-lg"/>{successMsg}</div>}

      {/* ── Metric cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: t('totalProviders'), value: totals.total,   accent: 'from-slate-900 to-slate-700',   icon: 'bx-group'     },
          { label: t('present'),        value: totals.present, accent: 'from-emerald-900 to-emerald-600',icon: 'bx-user-check'},
          { label: t('late'),           value: totals.late,    accent: 'from-amber-900 to-amber-600',   icon: 'bx-time'      },
          { label: t('absent'),         value: totals.absent,  accent: 'from-rose-900 to-rose-600',     icon: 'bx-user-x'   },
          { label: t('onLeave'),        value: totals.onLeave, accent: 'from-cyan-900 to-cyan-600',     icon: 'bx-briefcase' },
        ].map(c => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className={`mb-3 h-1.5 w-14 rounded-full bg-gradient-to-r ${c.accent}`} />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-slate-950">{c.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{c.label}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-teal-600">
                <i className={`bx ${c.icon} text-lg`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          <input
            type="date"
            value={currentDate}
            onChange={e => setCurrentDate(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-950 outline-none focus:border-cyan-400 [color-scheme:light]"
          />
          <div className="relative">
            <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder={t('searchTeacher')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-950 outline-none focus:border-cyan-400"
            />
          </div>
          <div className="relative">
            <select
              value={classroomFilter}
              onChange={e => setClassroomFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-950 outline-none focus:border-cyan-400"
            >
              {classroomOptions.map(r => (
              <option key={r} value={r}>
                {r === '__ALL__' ? t('allClassrooms') : r}
              </option>
            ))}
            </select>
            <i className="bx bx-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-950 outline-none focus:border-cyan-400"
            >
              <option value="__ALL__">{t('allStatuses')}</option>
              {STATUS_OPTIONS.map(s => <option key={s.key} value={STATUS_CONFIG[s.key].label}>{STATUS_CONFIG[s.key].label}</option>)}
            </select>
            <i className="bx bx-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
            <i className="bx bx-group text-4xl opacity-30" />
            <p className="text-sm">
              {filtered.length === 0 && teachers.length === 0
                ? t('noProvidersFound')
                : t('noProvidersFound') + ' ' + t('tryFilters')}
            </p>
            {teachers.length === 0 && (
              <button onClick={load} className="mt-2 text-xs font-semibold text-cyan-600 hover:underline">
                {t('retryBtn')}
              </button>
            )}
          </div>
        ) : (
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {[
                  t('providerTh'), t('roleProvider'), t('classroom'),
                  t('checkInLabel'), t('checkOutLabel'), t('statusTh'), t('thActions')
                ].map(h => (
                  <th key={h} className="px-5 py-4 text-left font-semibold uppercase tracking-[0.12em] text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(teacher => {
                const cfg = STATUS_CONFIG[teacher.status] || STATUS_CONFIG.absent;
                return (
                  <tr key={teacher.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-50 ring-1 ring-cyan-200 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-cyan-700">{initials(teacher.fullName)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{teacher.fullName}</p>
                          <p className="text-xs text-slate-400">{teacher.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                      {teacher.role === 'teacher' ? t('roleTeacher') : teacher.role}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg whitespace-nowrap">
                        {teacher.classroom === 'Unassigned' ? t('unassigned') : teacher.classroom}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-600 font-mono text-xs">{fmt(teacher.checkIn)}</td>
                    <td className="px-5 py-4 text-slate-600 font-mono text-xs">{fmt(teacher.checkOut)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${cfg.accent}`}>
                        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openModal(teacher.id)}
                        className="rounded-xl border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 px-3 py-1.5 text-xs font-semibold text-cyan-700 transition"
                      >
                        {t('updateBtn')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Recent Submissions ─────────────────────────────── */}
      {recentRecords.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
              <span className="w-6 h-6 rounded-lg bg-cyan-50 flex items-center justify-center">
                <i className="bx bx-history text-cyan-600 text-sm" />
              </span>
              {t('recentSubmissions')}
              <span className="text-xs font-normal text-slate-400 ml-1">— {t('thisSession')}</span>
            </h3>
            <button
              onClick={() => setRecentRecords([])}
              className="text-xs text-slate-400 hover:text-rose-400 transition font-medium"
            >
              {t('clearBtn')}
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentRecords.map((r, i) => {
              const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.absent;
              return (
                <div key={`${r.id}-${i}`} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-50 ring-1 ring-cyan-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-cyan-700">{initials(r.fullName)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{r.fullName}</p>
                      <p className="text-xs text-slate-400">{r.classroom} · {t('savedAt')} {r.savedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {r.checkIn !== '-' && (
                      <span className="text-xs text-slate-500 font-mono hidden sm:block">
                        {r.checkIn} → {r.checkOut}
                      </span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${cfg.accent}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Mark Attendance Modal ──────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-teal-900/40 bg-white dark:bg-[#111c2d] shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-teal-900/30">
              <div>
                <p className="text-xs uppercase tracking-widest text-cyan-600 dark:text-cyan-400">{t('receptionDeskLabel')}</p>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{t('markAttendance')}</h2>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-[#0d1520] transition">
                <i className="bx bx-x text-xl" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">

              {/* Teacher selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t('providerLabel')}</label>
                <div className="relative">
                  <select
                    value={selectedId || ''}
                    onChange={e => {
                      const tid = e.target.value;
                      const t = teachers.find(x => x.id === tid);
                      if (!t) return;
                      setSelectedId(tid);
                      // only pre-fill times — do NOT reset the status the user already picked
                      setSelCheckIn(t.checkIn === '-' ? '08:00' : t.checkIn);
                      setSelCheckOut(t.checkOut === '-' ? '15:00' : t.checkOut);
                    }}
                    className="w-full appearance-none rounded-xl border border-slate-200 dark:border-teal-900/40 bg-slate-50 dark:bg-[#0d1520] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-400"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName} — {t.classroom}</option>
                    ))}
                  </select>
                  <i className="bx bx-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Status picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t('statusPickerLabel')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSelStatus(opt.key)}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        selStatus === opt.key
                          ? 'border-cyan-400 bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300'
                          : 'border-slate-200 dark:border-teal-900/40 bg-slate-50 dark:bg-[#0d1520] text-slate-600 dark:text-slate-300 hover:border-cyan-300 dark:hover:border-cyan-500/50'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${STATUS_CONFIG[opt.key].dot}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Times (hidden when absent/on-leave) */}
              {selStatus !== 'absent' && selStatus !== 'on-leave' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t('checkInLabel')}</label>
                    <input
                      type="time"
                      value={selCheckIn}
                      onChange={e => setSelCheckIn(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-teal-900/40 bg-slate-50 dark:bg-[#0d1520] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">{t('checkOutLabel')}</label>
                    <input
                      type="time"
                      value={selCheckOut}
                      onChange={e => setSelCheckOut(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-teal-900/40 bg-slate-50 dark:bg-[#0d1520] px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-teal-900/30">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-teal-900/40 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#0d1520] transition"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={saveAttendance}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-sm font-bold text-slate-950 transition disabled:opacity-60"
              >
                {saving ? <><i className="bx bx-loader-alt animate-spin" /> {t('saving')}</> : <><i className="bx bx-check" /> {t('saveRecord')}</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeacherAttendance;

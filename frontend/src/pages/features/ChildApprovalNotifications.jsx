import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/useLanguage';

/* ── helpers ─────────────────────────────────────────────── */
const mkInitials = (first = '', last = '') =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();

const StatusBadge = ({ status }) => {
  const map = {
    approved:    'bg-emerald-100 text-emerald-700 border-emerald-200',
    disapproved: 'bg-amber-100   text-amber-700   border-amber-200',
    pending:     'bg-cyan-100    text-cyan-700    border-cyan-200',
    active:      'bg-emerald-100 text-emerald-700 border-emerald-200',
    waitlist:    'bg-slate-100   text-slate-600   border-slate-200',
    inactive:    'bg-slate-100   text-slate-500   border-slate-200',
  };
  return (
    <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${map[status] || map.pending}`}>
      {status}
    </span>
  );
};

const DecisionBox = ({ isApproved, isDisapproved, approvalNote, name, noReasonText, successText, enrolledText }) => {
  if (isDisapproved) return (
    <div className="mt-4 rounded-xl border-l-4 border-amber-400 bg-white dark:bg-amber-900/10 p-4 shadow-sm">
      <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1.5">
        Admin Reason / የውድቅ የተደረገበት ምክንያት:
      </p>
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {approvalNote || noReasonText}
      </p>
    </div>
  );
  if (isApproved) return (
    <div className="mt-4 rounded-xl border-l-4 border-emerald-400 bg-white dark:bg-emerald-900/10 p-4 shadow-sm">
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <span className="font-semibold text-emerald-700 dark:text-emerald-400">{successText}</span>{' '}
        {name && <span className="font-medium">{name}</span>}{' '}
        {name ? enrolledText : 'Registration is approved.'}
        {approvalNote && (
          <span className="block text-xs text-slate-400 mt-1 italic">Note: {approvalNote}</span>
        )}
      </p>
    </div>
  );
  return null;
};

/* ═══════════════════════════════════════════════════════════ */
const ChildApprovalNotifications = () => {
  const { user }    = useAuth();
  const { t }       = useLanguage();
  const [parentProfile, setParentProfile] = useState(null);
  const [children, setChildren]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');

  const isReception = user?.role === 'reception';
  const isParent    = user?.role === 'parent';

  /* ── fetch ───────────────────────────────────────────────── */
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const promises = [api.get('/children')];
      if (isParent) promises.push(api.get('/auth/me'));
      const [childrenRes, profileRes] = await Promise.all(promises);

      const all = childrenRes.data?.data || [];
      setChildren(all.filter(c =>
        ['approved', 'disapproved', 'active', 'pending', 'waitlist'].includes(c.status)
      ));

      if (profileRes) setParentProfile(profileRes.data?.user || null);
    } catch {
      setError('Failed to load registration history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isParent]);

  useEffect(() => { load(); }, [load]);

  /* ── filter + search ─────────────────────────────────────── */
  const filtered = children.filter(c => {
    const matchFilter =
      filter === 'all'         ? true :
      filter === 'approved'    ? (c.status === 'approved' || c.status === 'active') :
      filter === 'disapproved' ? c.status === 'disapproved' :
      filter === 'pending'     ? (c.status === 'pending' || c.status === 'waitlist') : true;

    const q = search.toLowerCase();
    const matchSearch = !q ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
      c.status?.toLowerCase().includes(q);

    return matchFilter && matchSearch;
  });

  const approvedCount    = children.filter(c => c.status === 'approved' || c.status === 'active').length;
  const disapprovedCount = children.filter(c => c.status === 'disapproved').length;
  const pendingCount     = children.filter(c => c.status === 'pending' || c.status === 'waitlist').length;

  const editPath = isReception ? '/dashboard/reception/update-info' : '/dashboard/parent/profile-card';

  const parentApproved    = parentProfile?.approvalStatus === 'approved';
  const parentDisapproved = parentProfile?.approvalStatus === 'disapproved';

  /* ════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#00ADB5] mb-1">
            {isReception ? t('receptionPortalLabel') : t('parentPortal')} · {t('registration')}
          </p>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('registrationUpdatesTitle')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('registrationUpdatesSubtitle')}
          </p>
        </div>
        <button
          onClick={load}
          className="self-start inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent px-4 py-2 text-sm font-semibold text-[#00ADB5] hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm"
        >
          <i className="bx bx-refresh text-base" /> {t('refreshBtn')}
        </button>
      </div>

      {/* ── Parent Account Status card ───────────────────── */}
      {isParent && parentProfile && (
        <div className={`rounded-2xl border p-5 shadow-sm ${
          parentDisapproved
            ? 'border-amber-200 bg-amber-50 dark:bg-amber-500/5 dark:border-amber-500/20'
            : parentApproved
            ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-500/5 dark:border-emerald-500/20'
            : 'border-cyan-200 bg-cyan-50 dark:bg-cyan-500/5 dark:border-cyan-500/20'
        }`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold flex-shrink-0 ${
                parentDisapproved ? 'bg-amber-400' : parentApproved ? 'bg-[#00ADB5]' : 'bg-cyan-400'
              }`}>
                {(parentProfile.fullName || user?.fullName || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">
                    {parentProfile.fullName || user?.fullName}
                  </h3>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#00ADB5]/10 text-[#00ADB5] border border-[#00ADB5]/20">
                    {t('yourAccount')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{parentProfile.email || user?.email}</p>
              </div>
            </div>
            <StatusBadge status={parentProfile.approvalStatus || 'pending'} />
          </div>
          <DecisionBox
            isApproved={parentApproved}
            isDisapproved={parentDisapproved}
            approvalNote={parentProfile.approvalNote}
            name={parentProfile.fullName}
            noReasonText={t('noReasonProvided')}
            successText={t('successfullyRegistered')}
            enrolledText={t('isNowEnrolled')}
          />
        </div>
      )}

      {/* ── Summary filter chips ─────────────────────────── */}
      {!loading && children.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'all',         label: t('totalLabel'),       value: children.length,  icon: 'bx-list-ul',      cls: 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300' },
            { key: 'approved',    label: t('approved'),    value: approvedCount,    icon: 'bx-check-circle', cls: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            { key: 'disapproved', label: t('disapproved'), value: disapprovedCount, icon: 'bx-error-circle', cls: 'bg-amber-50 border-amber-200 text-amber-700' },
            { key: 'pending',     label: t('pending'),     value: pendingCount,     icon: 'bx-time',         cls: 'bg-cyan-50 border-cyan-200 text-cyan-700' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-left transition-all ${
                filter === tab.key
                  ? `${tab.cls} shadow-sm ring-2 ring-current/20`
                  : 'bg-white dark:bg-[#0d1929] border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#00ADB5]/30'
              }`}
            >
              <i className={`bx ${tab.icon} text-lg flex-shrink-0`} />
              <div>
                <p className="text-lg font-extrabold leading-none">{tab.value}</p>
                <p className="text-[11px] font-medium mt-0.5">{tab.label}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ── Search ───────────────────────────────────────── */}
      {!loading && children.length > 0 && (
        <div className="relative">
          <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder={t('searchByNameOrStatus')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d1929] text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-[#00ADB5] focus:ring-2 focus:ring-[#00ADB5]/15 transition-all"
          />
        </div>
      )}

      {/* ── Error ────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
          <i className="bx bx-error-circle flex-shrink-0" />{error}
        </div>
      )}

      {/* ── Loading ──────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-[#00ADB5] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">{t('loadingRegistrationHistory')}</p>
        </div>
      )}

      {/* ── Children section header ──────────────────────── */}
      {!loading && children.length > 0 && (
        <div className="flex items-center gap-2">
          <i className="bx bx-child text-[#00ADB5]" />
          <h3 className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            {isParent ? t('yourChildrenStatus') : t('allChildrenStatus')}
          </h3>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────── */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white dark:bg-[#0d1929] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <i className="bx bx-bell-off text-5xl text-slate-300 dark:text-slate-600" />
          <p className="text-base font-semibold text-slate-500 dark:text-slate-400">
            {filter === 'all' ? t('noChildRegistrations') : `No ${filter} registrations`}
          </p>
          <p className="text-sm text-slate-400 text-center max-w-xs">
            {t('registrationDecisionsAppearHere')}
          </p>
        </div>
      )}

      {/* ── Child cards ──────────────────────────────────── */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map(child => {
            const isApproved    = child.status === 'approved' || child.status === 'active';
            const isDisapproved = child.status === 'disapproved';

            return (
              <div
                key={child._id}
                className={`rounded-2xl border p-5 shadow-sm ${
                  isDisapproved
                    ? 'border-amber-200 bg-amber-50 dark:bg-amber-500/5 dark:border-amber-500/20'
                    : isApproved
                    ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-500/5 dark:border-emerald-500/20'
                    : 'border-slate-200 bg-white dark:bg-[#0d1929] dark:border-slate-800'
                }`}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-base font-bold flex-shrink-0 ${
                      isDisapproved ? 'bg-amber-400' : isApproved ? 'bg-[#00ADB5]' : 'bg-slate-400'
                    }`}>
                      {mkInitials(child.firstName, child.lastName)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-white text-base">
                        {child.firstName} {child.lastName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {child.age && (
                          <p className="text-xs text-slate-400">
                            {child.age} yrs{child.gender ? ` · ${child.gender}` : ''}
                          </p>
                        )}
                        {child.classroom?.name && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#00ADB5]/10 text-[#00ADB5] border border-[#00ADB5]/20">
                            {child.classroom.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={child.status} />
                </div>

                {/* Decision box */}
                <DecisionBox
                  isApproved={isApproved}
                  isDisapproved={isDisapproved}
                  approvalNote={child.approvalNote}
                  name={`${child.firstName} ${child.lastName}`}
                  noReasonText={t('noReasonProvided')}
                  successText={t('successfullyRegistered')}
                  enrolledText={t('isNowEnrolled')}
                />

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-current/10">
                  <p className="text-[10px] text-slate-400 flex items-center gap-1">
                    <i className="bx bx-time text-xs" />
                    {child.updatedAt
                      ? new Date(child.updatedAt).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })
                      : '—'}
                  </p>
                  {isDisapproved && (
                    <Link
                      to={editPath}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <i className="bx bx-edit-alt text-sm" />
                      {t('updateChildDetails')}
                    </Link>
                  )}
                  {isApproved && (
                    <Link
                      to={editPath}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <i className="bx bx-user text-sm" />
                      {t('viewProfile')}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChildApprovalNotifications;

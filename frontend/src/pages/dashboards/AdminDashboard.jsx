import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/useLanguage';
import { useSettings } from '../../context/SettingsContext';


const INPUT = 'w-full border border-glass rounded-xl px-4 py-2.5 text-sm bg-card text-primary focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)]';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isFreeMode, togglePaymentMode } = useSettings();
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState({ stats: {}, data: [] });
  const [appointments, setAppointments] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [meals, setMeals] = useState([]);
  const [naps, setNaps] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingMode, setTogglingMode] = useState(false);

  const handleToggleFreeMode = async () => {
    setTogglingMode(true);
    try { await togglePaymentMode(); }
    catch (e) { console.error(e); }
    finally { setTogglingMode(false); }
  };

  // Quick-add modals
  const [modal, setModal] = useState(null); // 'parent' | 'staff' | null
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const emptyParent = { fullName: '', email: '', phone: '', password: '', organization: '' };
  const emptyStaff  = { fullName: '', email: '', phone: '', password: '', role: 'teacher' };
  const [parentForm, setParentForm] = useState(emptyParent);
  const [staffForm,  setStaffForm]  = useState(emptyStaff);

  const fetchData = async () => {
    try {
      const [statsRes, paymentsRes, apptsRes, classroomsRes, mealsRes, napsRes] = await Promise.all([
        api.get('/staff/admin-stats'),
        api.get('/payments'),
        api.get('/appointments/upcoming'),
        api.get('/classrooms'),
        api.get('/meals').catch(() => ({ data: { data: [] } })),
        api.get('/attendance/today').catch(() => ({ data: { data: { records: [] } } }))
      ]);
      setStats(statsRes.data.data);
      setPayments(paymentsRes.data);
      setAppointments(apptsRes.data.data);
      setClassrooms(classroomsRes.data.data);
      setMeals(mealsRes.data.data || []);
      setNaps(napsRes.data.data.records || []);
      // fetch recent announcements from sent messages
      try {
        const sentRes = await api.get('/messages/sent');
        const sent = sentRes.data.data || [];
        setAnnouncements(sent.filter(m => m.subject?.startsWith('[Announcement]')).slice(0, 5));
      } catch { /* silent */ }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (type) => {
    setModal(type);
    setFormError('');
    setFormSuccess('');
    setParentForm(emptyParent);
    setStaffForm(emptyStaff);
  };
  const closeModal = () => { setModal(null); setFormError(''); setFormSuccess(''); };

  const handleAddParent = async (e) => {
    e.preventDefault();
    setFormLoading(true); setFormError('');
    try {
      await api.post('/auth/register', { ...parentForm, role: 'parent' });
      setFormSuccess(`✅ Parent "${parentForm.fullName}" created! They can log in with their email.`);
      setParentForm(emptyParent);
      fetchData();
      setTimeout(closeModal, 2500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create parent.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setFormLoading(true); setFormError('');
    try {
      await api.post('/auth/register', { ...staffForm });
      setFormSuccess(`✅ ${staffForm.role} "${staffForm.fullName}" added successfully!`);
      setStaffForm(emptyStaff);
      fetchData();
      setTimeout(closeModal, 2500);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to add staff.');
    } finally {
      setFormLoading(false);
    }
  };

  const statCards = stats
    ? [
        { label: t('totalChildren'), value: stats.totalChildren, icon: 'bx-child', color: 'indigo', path: '/dashboard/admin/children' },
        { label: t('activeParents'), value: stats.totalParents, icon: 'bx-group', color: 'purple', path: '/dashboard/admin/parents' },
        { label: t('childcareProviders'), value: stats.totalTeachers, icon: 'bxs-graduation', color: 'cyan', path: '/dashboard/admin/staff' },
        { label: t('supportStaff'), value: stats.totalStaff, icon: 'bx-id-card', color: 'amber', path: '/dashboard/admin/staff' },
        { label: t('classrooms'), value: stats.totalClassrooms, icon: 'bx-buildings', color: 'rose', path: '/dashboard/admin/classrooms' },
        { label: t('monthlyRevenue'), value: `ETB ${(payments.stats.totalPaid || 0).toLocaleString()}`, icon: 'bx-wallet', color: 'emerald', path: '/dashboard/admin/payments' }
      ]
    : [];

  const colorMap = {
    indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/20 text-teal-400',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20 text-purple-400',
    cyan: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/20 text-cyan-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400',
    rose: 'from-rose-500/20 to-rose-600/10 border-rose-500/20 text-rose-400',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          {new Date().getHours() < 12 ? t('goodMorning') : t('goodAfternoon')}, {user?.fullName?.split(' ')[0]} 👋
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{t('happeningToday')}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.path}
            className={`bg-gradient-to-br ${colorMap[card.color]} border-glass rounded-2xl p-4 hover:scale-105 transition-all duration-200 cursor-pointer`}
          >
            <i className={`bx ${card.icon} text-2xl ${colorMap[card.color].split(' ').pop()}`} />
            <div className="mt-2">
              <p className="text-2xl font-bold text-primary">{card.value}</p>
              <p className="text-xs text-muted mt-0.5">{card.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Summary */}
        <div className="bg-card rounded-2xl border border-glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <i className="bx bx-wallet text-teal-400" /> {t('paymentOverview')}
            </h3>
            <Link to="/dashboard/admin/payments" className="text-xs text-teal-400 hover:underline">{t('viewAll')}</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t('collected'), amount: payments.stats.totalPaid || 0, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: t('pending'), amount: payments.stats.totalPending || 0, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: t('overdue'), amount: payments.stats.totalOverdue || 0, color: 'text-rose-400', bg: 'bg-rose-500/10' }
            ].map(p => (
              <div key={p.label} className={`${p.bg} rounded-xl p-3 text-center`}>
                <p className={`text-lg font-bold ${p.color}`}>ETB {p.amount.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">{p.label}</p>
              </div>
            ))}
          </div>
          {/* Recent payments */}
          <div className="mt-4 space-y-2">
            {payments.data.slice(0, 4).map(p => (
              <div key={p._id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-teal-900/30 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{p.child?.firstName} {p.child?.lastName}</p>
                  <p className="text-xs text-slate-400">{p.invoiceNumber} · {p.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">ETB {p.amount}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                    p.status === 'overdue' ? 'bg-rose-500/10 text-rose-400' :
                    'bg-amber-500/10 text-amber-400'
                  }`}>{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white dark:bg-[#111c2d] rounded-2xl border border-slate-200 dark:border-teal-900/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <i className="bx bx-calendar text-teal-400" /> {t('upcomingAppointments')}
            </h3>
            <Link to="/dashboard/admin/appointments" className="text-xs text-teal-400 hover:underline">{t('viewAll')}</Link>
          </div>
          {appointments.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">{t('noUpcomingAppointments')}</p>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 5).map(a => (
                <div key={a._id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0d1520]">
                  <div className="w-10 h-10 rounded-xl bg-teal-600/10 flex items-center justify-center flex-shrink-0">
                    <i className="bx bx-calendar-event text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{a.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(a.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(a.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-400">{a.requestedBy?.fullName || 'N/A'}</p>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
                    a.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>{a.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-[#111c2d] rounded-2xl border border-slate-200 dark:border-teal-900/30 p-6">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <i className="bx bx-grid-alt text-teal-400" /> {t('quickActions')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: t('addChild'), icon: 'bx-user-plus', path: '/dashboard/admin/register-child', color: 'indigo' },
            { label: t('addParent'), icon: 'bx-group', action: () => openModal('parent'), color: 'purple' },
            { label: t('addStaff'), icon: 'bx-id-card', action: () => openModal('staff'), color: 'cyan' },
            { label: t('newInvoice'), icon: 'bx-receipt', path: '/dashboard/admin/invoices', color: 'emerald' },
            { label: t('attendance'), icon: 'bx-calendar-check', path: '/dashboard/admin/check-in-out', color: 'amber' },
            { label: t('classrooms'), icon: 'bx-buildings', path: '/dashboard/admin/classrooms', color: 'rose' },
            { label: t('sendMessage'), icon: 'bx-message-square-add', path: '/dashboard/admin/messages', color: 'violet' },
            { label: t('viewReports'), icon: 'bx-file', path: '/dashboard/admin/daily-report', color: 'slate' }
          ].map(action => (
            action.path ? (
              <Link key={action.label} to={action.path}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-[#0d1520] hover:bg-teal-600/10 dark:hover:bg-teal-600/10 transition-all duration-200 group">
                <i className={`bx ${action.icon} text-2xl text-slate-400 group-hover:text-teal-400 transition-colors`} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-teal-400 text-center">{action.label}</span>
              </Link>
            ) : (
              <button key={action.label} onClick={action.action}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-[#0d1520] hover:bg-teal-600/10 dark:hover:bg-teal-600/10 transition-all duration-200 group">
                <i className={`bx ${action.icon} text-2xl text-slate-400 group-hover:text-teal-400 transition-colors`} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-teal-400 text-center">{action.label}</span>
              </button>
            )
          ))}
        </div>
      </div>

      {/* Add Parent Modal */}
      {modal === 'parent' && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111c2d] rounded-2xl border border-slate-200 dark:border-teal-900/30 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-teal-900/30">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('addNewParent')}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t('createParentDesc')}</p>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0d1520] transition-colors">
                <i className="bx bx-x text-xl" />
              </button>
            </div>
            <form onSubmit={handleAddParent} className="p-6 space-y-4">
              {formError && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-3 text-sm">{formError}</div>}
              {formSuccess && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-3 text-sm">{formSuccess}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{t('fullName')} *</label>
                  <input required type="text" value={parentForm.fullName} onChange={e => setParentForm({ ...parentForm, fullName: e.target.value })} className={INPUT} placeholder="John Parent" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{t('emailLabel')} *</label>
                  <input required type="email" value={parentForm.email} onChange={e => setParentForm({ ...parentForm, email: e.target.value })} className={INPUT} placeholder="parent@email.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{t('phoneNumber')}</label>
                  <input type="tel" value={parentForm.phone} onChange={e => setParentForm({ ...parentForm, phone: e.target.value })} className={INPUT} placeholder="555-0100" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{t('organization')}</label>
                  <input type="text" value={parentForm.organization} onChange={e => setParentForm({ ...parentForm, organization: e.target.value })} className={INPUT} placeholder={t('optional')} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{t('passwordLabel')} *</label>
                  <input required type="password" value={parentForm.password} onChange={e => setParentForm({ ...parentForm, password: e.target.value })} className={INPUT} placeholder="Min 6 chars" minLength={6} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#0d1520] rounded-xl hover:bg-slate-200 transition-colors">{t('cancel')}</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60">
                  {formLoading ? t('creating') : t('createParentBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {modal === 'staff' && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111c2d] rounded-2xl border border-slate-200 dark:border-teal-900/30 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-teal-900/30">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('addNewStaff')}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t('createStaffDesc')}</p>
              </div>
              <button onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0d1520] transition-colors">
                <i className="bx bx-x text-xl" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              {formError && <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-xl p-3 text-sm">{formError}</div>}
              {formSuccess && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl p-3 text-sm">{formSuccess}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{t('fullName')} *</label>
                  <input required type="text" value={staffForm.fullName} onChange={e => setStaffForm({ ...staffForm, fullName: e.target.value })} className={INPUT} placeholder="Sarah Johnson" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{t('emailLabel')} *</label>
                  <input required type="email" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} className={INPUT} placeholder="staff@daycare.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{t('phoneNumber')}</label>
                  <input type="tel" value={staffForm.phone} onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })} className={INPUT} placeholder="555-0100" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{t('role')}</label>
                  <select value={staffForm.role} onChange={e => setStaffForm({ ...staffForm, role: e.target.value })} className={INPUT}>
                    <option value="teacher">{t('teacherRole')}</option>
                    <option value="reception">{t('receptionRole')}</option>
                    <option value="staff">{t('supportStaffRole')}</option>
                    <option value="admin">{t('adminRole')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">{t('passwordLabel')} *</label>
                  <input required type="password" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} className={INPUT} placeholder="Min 6 chars" minLength={6} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#0d1520] rounded-xl hover:bg-slate-200 transition-colors">{t('cancel')}</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2.5 text-sm font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-colors disabled:opacity-60">
                  {formLoading ? t('adding') : t('addStaffBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Additional Overview Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classroom Capacity Overview */}
        <div className="bg-white dark:bg-[#111c2d] rounded-2xl border border-slate-200 dark:border-teal-900/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <i className="bx bx-buildings text-teal-400" /> {t('classroomCapacity')}
            </h3>
            <Link to="/dashboard/admin/capacity" className="text-xs text-teal-400 hover:underline">{t('manage')}</Link>
          </div>
          <div className="space-y-3">
            {classrooms.slice(0, 4).map(c => {
              const enrolled = c.children?.length || 0;
              const percentage = Math.round((enrolled / c.capacity) * 100);
              return (
                <div key={c._id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-slate-700 dark:text-slate-200">{c.name}</span>
                      <span className="text-slate-400">{enrolled}/{c.capacity}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-[#0d1520] rounded-full h-2">
                      <div className={`h-2 rounded-full ${percentage >= 100 ? 'bg-rose-500' : percentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Meals & Naps */}
        <div className="bg-white dark:bg-[#111c2d] rounded-2xl border border-slate-200 dark:border-teal-900/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <i className="bx bx-restaurant text-teal-400" /> {t('todaysOverview')}
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-amber-500/10 rounded-xl p-4 text-center">
              <i className="bx bx-bowl-hot text-2xl text-amber-400" />
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-2">{meals.filter(m => m.date === new Date().toISOString().split('T')[0]).length}</p>
              <p className="text-xs text-slate-500">{t('mealsToday')}</p>
            </div>
            <div className="bg-teal-600/10 rounded-xl p-4 text-center">
              <i className="bx bx-moon text-2xl text-teal-400" />
              <p className="text-2xl font-bold text-slate-800 dark:text-white mt-2">{naps.filter(n => n.napStart && !n.napEnd).length}</p>
              <p className="text-xs text-slate-500">{t('currentlyNapping')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Announcements */}
      <div className="bg-white dark:bg-[#111c2d] rounded-2xl border border-slate-200 dark:border-teal-900/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <i className="bx bx-megaphone text-amber-400" /> {t('recentAnnouncements')}
          </h3>
          <Link to="/dashboard/admin/communication" className="text-xs text-teal-400 hover:underline">
            {t('viewAll')}
          </Link>
        </div>
        {announcements.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <i className="bx bx-megaphone text-3xl opacity-30" />
            <p className="mt-2 text-sm">{t('noAnnouncements')}</p>
            <Link to="/dashboard/admin/communication"
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors">
              <i className="bx bx-plus-circle" /> {t('createAnnouncement')}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a._id}
                className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#0d1520] border border-slate-100 dark:border-teal-900/20 hover:border-amber-500/30 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  a.priority === 'urgent' ? 'bg-rose-500/10' : 'bg-amber-500/10'
                }`}>
                  <i className={`bx bx-megaphone text-lg ${a.priority === 'urgent' ? 'text-rose-400' : 'text-amber-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {a.priority === 'urgent' && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        🚨 {t('urgent')}
                      </span>
                    )}
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {a.subject?.replace('[Announcement] ', '') || a.subject}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{a.body}</p>
                </div>
                <span className="text-[10px] text-slate-400 flex-shrink-0 mt-1">
                  {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;


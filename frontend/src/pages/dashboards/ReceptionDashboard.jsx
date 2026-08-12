import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/useLanguage';

const ReceptionDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [visitors, setVisitors] = useState({ count: 0, checkedIn: 0, data: [] });
  const [appointments, setAppointments] = useState([]);
  const [children, setChildren] = useState([]);
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [visitorsRes, apptsRes, childrenRes, mealsRes] = await Promise.all([
          api.get('/visitors/today'),
          api.get('/appointments/upcoming'),
          api.get('/children'),
          api.get('/meals')
        ]);
        setVisitors(visitorsRes.data);
        setAppointments(apptsRes.data.data);
        setChildren(childrenRes.data.data);
        setMeals(mealsRes.data.data || []);
      } catch (err) {
        console.error('Reception dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVisitorCheckout = async (visitorId) => {
    try {
      await api.put(`/visitors/${visitorId}/checkout`);
      setVisitors(prev => ({
        ...prev,
        checkedIn: prev.checkedIn - 1,
        data: prev.data.map(v => v._id === visitorId ? { ...v, status: 'checked-out', checkOut: new Date() } : v)
      }));
    } catch (err) {
      console.error('Checkout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          {t('receptionDesk')} 👋
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('totalFamilies'), value: visitors.count, icon: 'bx-user-check', color: 'indigo' },
          { label: t('present'), value: visitors.checkedIn, icon: 'bx-building', color: 'emerald' },
          { label: t('upcomingAppointments'), value: appointments.length, icon: 'bx-calendar', color: 'cyan' },
          { label: t('totalChildren'), value: children.length, icon: 'bx-child', color: 'purple' }
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-glass p-4">
            <i className={`bx ${s.icon} text-xl text-${s.color}-400`} />
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-2">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Check-in */}
        <div className="bg-white dark:bg-[#111c2d] rounded-2xl border border-slate-200 dark:border-teal-900/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <i className="bx bx-log-in-circle text-indigo-400" /> {t('providerAttendance')}
            </h3>
            <Link to="/dashboard/reception/visitor-check-in" className="text-xs text-white bg-indigo-500 px-3 py-1.5 rounded-full hover:bg-indigo-600 transition-colors font-semibold">
              + {t('markAttendance')}
            </Link>
          </div>

          {visitors.data.filter(v => v.status === 'checked-in').length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">{t('noActiveVisitors')}</p>
          ) : (
            <div className="space-y-3">
              {visitors.data.filter(v => v.status === 'checked-in').map(v => (
                <div key={v._id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <i className="bx bx-user text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{v.fullName || 'Unknown Visitor'}</p>
                      <p className="text-xs text-slate-400">{v.purpose || 'N/A'} · In since {v.checkIn ? new Date(v.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleVisitorCheckout(v._id)}
                    className="text-xs text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full hover:bg-rose-500/20 transition-colors font-semibold"
                  >
                    Check Out
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white dark:bg-[#111c2d] rounded-2xl border border-slate-200 dark:border-teal-900/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <i className="bx bx-calendar text-indigo-400" /> {t('upcomingAppointments')}
            </h3>
            <Link to="/dashboard/reception/parent-meetings" className="text-xs text-indigo-400 hover:underline">{t('viewAll')}</Link>
          </div>
          {appointments.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">{t('noUpcomingAppointments')}</p>
          ) : (
            <div className="space-y-3">
              {appointments.slice(0, 5).map(a => (
                <div key={a._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#0d1520]">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <i className="bx bx-calendar-event text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{a.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(a.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {new Date(a.scheduledAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
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
          <i className="bx bx-grid-alt text-indigo-400" /> {t('quickActions')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { labelKey: 'childAttendance', icon: 'bx-log-in-circle', path: '/dashboard/reception/visitor-check-in', color: 'emerald' },
            { labelKey: 'providerAttendance', icon: 'bx-calendar-check', path: '/dashboard/reception/teacher-attendance', color: 'cyan' },
            { labelKey: 'registerChild', icon: 'bx-user-plus', path: '/dashboard/reception/new-child-registry', color: 'indigo' },
            { labelKey: 'newRegister', icon: 'bx-user-circle', path: '/dashboard/reception/register-parent', color: 'purple' },
            { labelKey: 'upcomingAppointments', icon: 'bx-calendar-plus', path: '/dashboard/reception/parent-meetings', color: 'cyan' },
            { labelKey: 'pickupLog', icon: 'bx-list-ol', path: '/dashboard/reception/visitor-registry', color: 'rose' }
          ].map(action => (
            <Link
              key={action.labelKey}
              to={action.path}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-slate-50 dark:bg-[#0d1520] hover:bg-indigo-500/10 transition-all group"
            >
              <i className={`bx ${action.icon} text-xl text-slate-400 group-hover:text-indigo-400 transition-colors`} />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 group-hover:text-indigo-400 text-center">{t(action.labelKey)}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Today's Meals Overview */}
      {meals.filter(m => m.date === new Date().toISOString().split('T')[0]).length > 0 && (
        <div className="bg-white dark:bg-[#111c2d] rounded-2xl border border-slate-200 dark:border-teal-900/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <i className="bx bx-restaurant text-amber-400" /> {t('mealsToday')}
            </h3>
            <Link to="/dashboard/staff/meal-preparation" className="text-xs text-indigo-400 hover:underline">{t('viewAll')}</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {meals.filter(m => m.date === new Date().toISOString().split('T')[0]).slice(0, 4).map(meal => (
              <div key={meal._id} className="bg-amber-500/10 rounded-xl p-3 text-center">
                <i className="bx bx-bowl-hot text-xl text-amber-400" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-2 truncate">{meal.name}</p>
                <p className="text-xs text-slate-400 mt-1">{meal.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionDashboard;


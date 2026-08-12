import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// Import all real feature pages
import ChildList from '../features/ChildList';
import AttendanceTracker from '../features/AttendanceTracker';
import StaffAttendance from '../features/StaffAttendance';
import StudentAttendance from '../features/StudentAttendance';
import PaymentList from '../features/PaymentList';
import DailyReports from '../features/DailyReports';
import ClassroomList from '../features/ClassroomList';
import VisitorLog from '../features/VisitorLog';
import AppointmentCalendar from '../features/AppointmentCalendar';
import MessageInbox from '../features/MessageInbox';
import StaffList from '../features/StaffList';
import AddStaff from '../features/AddStaff';
import AssignRole from '../features/AssignRole';
import AssignTeacher from '../features/AssignTeacher';
import CapacityManagement from '../features/CapacityManagement';
import AssignedRoom from '../features/AssignedRoom';
import SleepNaps from '../features/SleepNaps';
import MealPrep from '../features/MealPrep';
import ActivitiesList from '../features/ActivitiesList';
import ParentManagement from '../features/ParentManagement';
import ReceptionRegisterParent from '../features/ReceptionRegisterParent';
import TeacherAttendance from '../features/TeacherAttendance';
import AdminApprovalWizard from '../features/AdminApprovalWizard';
import AdminTeacherAttendance from '../features/AdminTeacherAttendance';
import AttendanceDashboard from '../features/AttendanceDashboard';
import MakePayment from '../features/MakePayment';
import PaymentSuccess from '../features/PaymentSuccess';
// New parent-specific pages
import ChildProfile from '../features/ChildProfile';
import ClassroomRoom from '../features/ClassroomRoom';
import VaccinationLog from '../features/VaccinationLog';
import RegisterChild from '../features/RegisterChild';
import RegisterChildOnly from '../features/RegisterChildOnly';
import BalanceInfo from '../features/BalanceInfo';    // kept for legacy direct access
import ReceiptsHistory from '../features/ReceiptsHistory'; // kept for legacy direct access
import Communication from '../features/Communication';
import UpdateParentInfo from '../features/UpdateParentInfo';
import ChildApprovalNotifications from '../features/ChildApprovalNotifications';
import ChildIDGenerate from '../features/ChildIDGenerate';
import UpdateInfoTabs from '../features/UpdateInfoTabs';

const FeatureMockup = () => {
  const { role: roleParam, feature } = useParams();
  const location = useLocation();
  // role may come from URL param (:role/:feature) or must be extracted from pathname (/dashboard/admin/:feature)
  const role = roleParam || location.pathname.split('/')[2];
  const navigate = useNavigate();

  // Helper to map a URL slug to a real component
  const renderFeature = () => {
    const slug = feature?.toLowerCase() || '';

    // ── Parent: My Children ───────────────────────────────────────────────────
    if (slug === 'profile-card')    return <ChildProfile />;
    if (slug === 'classroom-room')  return <ClassroomRoom />;
    if (slug === 'registration-updates') return <ChildApprovalNotifications />;
    if (slug === 'vaccination-log' || slug === 'vaccinationlog' || slug.includes('vaccination')) return <VaccinationLog />;
    if (slug === 'new-child-registry') return <RegisterChild />;
    if (slug === 'register-child') return <RegisterChildOnly />;
    if (slug === 'update-info') return <UpdateInfoTabs />;
    if (slug === 'update-parent-info') return <UpdateParentInfo />;
    if (slug === 'child-id-generate') return <ChildIDGenerate />;
    if (slug === 'register-parent') return <ReceptionRegisterParent />;
    if (slug === 'child-attendance') return <AttendanceTracker />;

    // ── Payments (all sub-routes → unified tabbed page) ───────────────────────
    if (slug === 'make-payment') return <MakePayment />;
    if (slug === 'payment-success') return <PaymentSuccess />;
    if (slug === 'payments' || slug === 'balance-info' || slug === 'receipts-history' || slug === 'invoices' || slug === 'billing') return <PaymentList />;

    // ── Parent: Communication ─────────────────────────────────────────────────
    if (slug === 'announcements' || slug === 'communication') return <Communication />;
    if (slug === 'messages')      return <Communication />;

    // ── Children Management ───────────────────────────────────────────────────
    if (slug.includes('child') || slug.includes('student') || slug.includes('roster')) {
      return <ChildList />;
    }

    // ── Attendance ────────────────────────────────────────────────────────────
    if (slug === 'attendance') {
      if (role === 'admin') return <AttendanceDashboard />;
      if (role === 'reception') return <TeacherAttendance />;
      if (role === 'teacher') return <AttendanceTracker />;
      return <AttendanceTracker />;
    }
    if (slug === 'teacher-attendance') {
      return <TeacherAttendance />;
    }
    if (slug === 'student-attendance') {
      return <StudentAttendance />;
    }
    if (slug.includes('check-in-out')) {
      return <AttendanceTracker />;
    }

    // ── Payments / Invoices ───────────────────────────────────────────────────
    if (slug.includes('payment') || slug.includes('invoice')) {
      return <PaymentList />;
    }

    // ── Daily Reports ─────────────────────────────────────────────────────────
    if (slug.includes('report') || slug.includes('daily')) {
      return <DailyReports />;
    }

    // ── Activities ────────────────────────────────────────────────────────────
    if (slug.includes('activit')) return <ActivitiesList />;

    // ── Classrooms ────────────────────────────────────────────────────────────
    if (slug.includes('classroom')) return <ClassroomList />;

    // ── Capacity ──────────────────────────────────────────────────────────────
    if (slug.includes('capacity')) return <CapacityManagement />;

    // ── Teacher / Classroom Assignment ─────────────────────────────────────────
    if (slug === 'assign') return <AssignTeacher />;
    if (slug.includes('assigned') || slug.includes('assign-room')) return <AssignedRoom />;

    // ── Sleep / Naps ──────────────────────────────────────────────────────────
    if (slug.includes('sleep') || slug.includes('nap')) return <SleepNaps />;

    // ── Meals ─────────────────────────────────────────────────────────────────
    if (slug.includes('meal') || slug.includes('food') || slug.includes('prep') || slug.includes('kitchen')) {
      return <MealPrep />;
    }

    // ── Visitors ──────────────────────────────────────────────────────────────
    if (slug.includes('visitor')) return <VisitorLog />;

    // ── Appointments / Meetings ───────────────────────────────────────────────
    if (slug.includes('appointment') || slug.includes('meeting') || slug.includes('school-visit')) {
      return <AppointmentCalendar />;
    }

    // ── Messages / Inbox ──────────────────────────────────────────────────────
    if (slug.includes('message') || slug.includes('inbox') || slug.includes('sent')) {
      return <MessageInbox />;
    }

    // ── Staff ─────────────────────────────────────────────────────────────────
    if (slug === 'add-staff')        return <AddStaff />;
    if (slug === 'assign-role' || slug === 'assignments') return <AssignRole />;
    if (slug.includes('staff') || slug.includes('view-staff') || slug.includes('edit-delete-staff')) {
      return <StaffList />;
    }

    // ── Parent management ─────────────────────────────────────────────────────
    if (slug.includes('parent') || slug.includes('add-parent') || slug.includes('assign-children') || slug.includes('emergency')) {
      return <ParentManagement />;
    }
    if (slug === 'approvals') return <AdminApprovalWizard />;

    // ── Fallback ──────────────────────────────────────────────────────────────
    return (
      <div className="bg-white dark:bg-[#111c2d] rounded-2xl border border-slate-200 dark:border-teal-900/30 p-8 text-center">
        <div className="w-16 h-16 bg-indigo-50 dark:bg-[#0d1520] text-indigo-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
          <i className="bx bx-wrench"></i>
        </div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Feature Under Construction</h3>
        <p className="text-slate-500 text-sm">
          The <strong>{feature}</strong> module is currently being built by the development team. Check back later!
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Back Button removed globally */}

      {/* Dynamic Feature Component */}
      <div className="animate-fade-in">
        {renderFeature()}
      </div>
    </div>
  );
};

export default FeatureMockup;


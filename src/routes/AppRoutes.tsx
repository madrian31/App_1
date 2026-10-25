import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth, RequireRole } from "../auth/RequireAuth";
import { STAFF_ROLES } from "../types/auth";
import CalendarPage from "../pages/Calendar/Calendar";
import Dashboard from "../pages/Dashboard/Dashboard";
import LoginPage from "../pages/Login/Login";
import Members from "../pages/Members/Members";
import ArchivesMembers from "../pages/Members/ArchivesMembers";
import VisitorsMembers from "../pages/Members/VisitorsMembers";
import MembersAttendance from "../pages/Attendance/Attendance";
import AttendanceReport from "../pages/Attendance/AttendanceReport";
import Profile from "../pages/Profile/Profile";
import PledgesMembers from "../pages/Pledges/PledgesMembers";
import PledgeTracker from "../pages/Pledges/PledgeTracker";
import Visitation from "../pages/Visitation/Visitation";
import VisitForm from "../pages/Visitation/VisitForm";
import VisitationReports from "../pages/Visitation/VisitationReports";
import ManageLists from "../pages/Settings/ManageLists";
import GeneralSettings from "../pages/Settings/GeneralSettings";
import UsersPage from "../pages/Settings/Users";
import DepartmentsSettings from "../pages/Settings/Departments";
import DepartmentFunds from "../pages/DepartmentFunds/DepartmentFunds";
import PledgesReport from "../pages/Pledges/PledgesReport";
import Ledger from "../pages/Ledger/Ledger";
import ProgramLineUp from "../pages/ProgramLineUp/ProgramLineUp";
import ProgramLineUpSchedule from "../pages/ProgramLineUp/ProgramLineUpSchedule";
import PraiseWorshipMembers from "../pages/PraiseWorship/PraiseWorshipMembers";
import PraiseWorshipLineUp from "../pages/PraiseWorship/PraiseWorshipLineUp";
import SundaySchoolKidsMembers from "../pages/SundaySchool/SundaySchoolKidsMembers";
import SundaySchoolChildForm from "../pages/SundaySchool/SundaySchoolChildForm";
import SundaySchoolAttendance from "../pages/SundaySchool/SundaySchoolAttendance";
import Tithes from "../pages/Tithes/Tithes";
import FinanceReport from "../pages/Finance/FinanceReport";
import Expenses from "../pages/Expenses/Expenses";
import Offerings from "../pages/Offerings/Offerings";
import ComingSoon from "../pages/ComingSoon/ComingSoon";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      {/* Everything below needs a signed-in user. */}
      <Route element={<RequireAuth />}>
        {/* ── Every role, Users included ── */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/Calendar" element={<CalendarPage />} />

        <Route path="/ProgramLineUp" element={<ProgramLineUp />} />
        <Route path="/ProgramLineUpSchedule" element={<ProgramLineUpSchedule />} />

        <Route path="/PraiseWorship" element={<Navigate to="/PraiseWorship/Members" replace />} />
        <Route path="/PraiseWorship/Members" element={<PraiseWorshipMembers />} />
        <Route path="/PraiseWorship/LineUp" element={<PraiseWorshipLineUp />} />

        {/* ── Super Admin and Admin only ── */}
        <Route element={<RequireRole allow={STAFF_ROLES} />}>
          <Route path="/members" element={<Members />} />
          <Route path="/ArchivesMembers" element={<ArchivesMembers />} />
          <Route path="/MembersVisitors" element={<VisitorsMembers />} />
          <Route path="/MembersAttendance" element={<MembersAttendance />} />
          <Route path="/MembersAttendanceReport" element={<AttendanceReport />} />
          <Route path="/Profile/:id" element={<Profile />} />

          <Route path="/SundaySchoolKidsMembers" element={<SundaySchoolKidsMembers />} />
          <Route path="/SundaySchoolKidsMembers/new" element={<SundaySchoolChildForm />} />
          <Route path="/SundaySchoolKidsMembers/:id" element={<SundaySchoolChildForm />} />
          <Route path="/SundaySchoolAttendance" element={<Navigate to="/SundaySchoolAttendance/attendance" replace />}/>
          <Route path="/SundaySchoolAttendance/:filter" element={<SundaySchoolAttendance />}/>

          <Route path="/PledgesMembers" element={<PledgesMembers />} />
          <Route path="/PledgeTracker" element={<PledgeTracker />} />
          <Route path="/PledgesReport" element={<PledgesReport />} />

          <Route path="/Visitation" element={<Visitation />} />
          <Route path="/Visitation/Reports" element={<VisitationReports />} />
          <Route path="/Visitation/new" element={<VisitForm />} />
          <Route path="/Visitation/:id" element={<VisitForm />} />

          <Route path="/Settings/ManageLists" element={<ManageLists />} />
          <Route path="/Settings/Users" element={<UsersPage />} />
          <Route path="/Settings/Departments" element={<DepartmentsSettings />} />

          {/* Menu items without a page yet */}
          <Route path="/Roles" element={<ComingSoon title="Roles" />} />
          <Route path="/settings" element={<GeneralSettings />} />
          <Route path="/SundaySchool" element={<ComingSoon title="Sunday School Savings" />} />
          <Route path="/SundaySchoolReport" element={<ComingSoon title="Sunday School Report" />} />
          <Route path="/Finance/Tithes" element={<Tithes />} />
          <Route path="/Finance/Offerings" element={<Offerings />} />
          <Route path="/Finance/Expenses" element={<Expenses />} />
          {/* Old per-utility pages were merged into Expenses — keep bookmarks working. */}
          <Route path="/Finance/Expenses/*" element={<Navigate to="/Finance/Expenses" replace />} />
          <Route path="/Finance/DepartmentFunds" element={<DepartmentFunds />} />
          <Route path="/Finance/Report" element={<FinanceReport />} />

          <Route path="/ledger/:department" element={<Ledger />} />
        </Route>
      </Route>
    </Routes>
  );
}

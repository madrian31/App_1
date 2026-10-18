import { Routes, Route, Navigate } from "react-router-dom";
import CalendarPage from "../pages/Calendar/Calendar";
import Dashboard from "../pages/Dashboard/Dashboard";
import LoginPage from "../pages/Login/Login";
import Members from "../pages/Members/Members";
import ArchivesMembers from "../pages/Members/ArchivesMembers";
import MembersAttendance from "../pages/Attendance/Attendance";
import AttendanceReport from "../pages/Attendance/AttendanceReport";
import Profile from "../pages/Profile/Profile";
import PledgesMembers from "../pages/Pledges/PledgesMembers";
import PledgeTracker from "../pages/Pledges/PledgeTracker";
import Visitation from "../pages/Visitation/Visitation";
import VisitForm from "../pages/Visitation/VisitForm";
import VisitationReports from "../pages/Visitation/VisitationReports";
import ManageLists from "../pages/Settings/ManageLists";
import PledgesReport from "../pages/Pledges/PledgesReport";
import Ledger from "../pages/Ledger/Ledger";
import ProgramLineUp from "../pages/ProgramLineUp/ProgramLineUp";
import ProgramLineUpSchedule from "../pages/ProgramLineUp/ProgramLineUpSchedule";
import SundaySchoolKidsMembers from "../pages/SundaySchool/SundaySchoolKidsMembers";
import SundaySchoolChildForm from "../pages/SundaySchool/SundaySchoolChildForm";
import SundaySchoolAttendance from "../pages/SundaySchool/SundaySchoolAttendance";
import Tithes from "../pages/Tithes/Tithes";
import FinanceReport from "../pages/Finance/FinanceReport";
import ComingSoon from "../pages/ComingSoon/ComingSoon";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/Calendar" element={<CalendarPage />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/members" element={<Members />} />
      <Route path="/ArchivesMembers" element={<ArchivesMembers />} />
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

      {/* Menu items without a page yet */}
      <Route path="/Roles" element={<ComingSoon title="Roles" />} />
      <Route path="/settings" element={<ComingSoon title="General Settings" />} />
      <Route path="/SundaySchool" element={<ComingSoon title="Sunday School Savings" />} />
      <Route path="/SundaySchoolReport" element={<ComingSoon title="Sunday School Report" />} />
      <Route path="/Finance/Tithes" element={<Tithes />} />
      <Route path="/Finance/Offerings" element={<ComingSoon title="Offerings" />} />
      <Route path="/Finance/Expenses/Electricity" element={<ComingSoon title="Electricity" />} />
      <Route path="/Finance/Expenses/Internet" element={<ComingSoon title="Internet" />} />
      <Route path="/Finance/Expenses/Water" element={<ComingSoon title="Water" />} />
      <Route path="/Finance/Report" element={<FinanceReport />} />

      <Route path="/ledger/:department" element={<Ledger />} />

      <Route path="/ProgramLineUp" element={<ProgramLineUp />} />
      <Route path="/ProgramLineUpSchedule" element={<ProgramLineUpSchedule />} />

      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
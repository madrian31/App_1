import { Routes, Route, Navigate } from "react-router-dom";
import CalendarPage from "../pages/Calendar/Calendar";
import Dashboard from "../pages/Dashboard/Dashboard";
import LoginPage from "../pages/Login/Login";
import Members from "../pages/Members/Members";
import ArchivesMembers from "../pages/Members/ArchivesMembers";
import MembersAttendance from "../pages/Attendance/Attendance";
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

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/Calendar" element={<CalendarPage />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/members" element={<Members />} />
      <Route path="/ArchivesMembers" element={<ArchivesMembers />} />
      <Route path="/MembersAttendance" element={<MembersAttendance />} />
      <Route path="/Profile/:id" element={<Profile />} />

      <Route path="/SundaySchoolKidsMembers" element={<SundaySchoolKidsMembers />} />
      <Route path="/SundaySchoolKidsMembers/new" element={<SundaySchoolChildForm />} />
      <Route path="/SundaySchoolKidsMembers/:id" element={<SundaySchoolChildForm />} />
      <Route path="/SundaySchoolAttendance" element={<Navigate to="/SundaySchoolAttendance/attendance" replace />}/>
      <Route path="/SundaySchoolAttendance/:filter" element={<SundaySchoolAttendance />}/>

      <Route path="/PledgesMembers" element={<PledgesMembers />} />
      <Route path="/PledgeTracker" element={<PledgeTracker />} />
      <Route path="/PledgesReport" element={<PledgesReport />} />

      <Route path="/visitation" element={<Visitation />} />
      <Route path="/Visitation/Reports" element={<VisitationReports />} />
      <Route path="/Visitation/new" element={<VisitForm />} />
      <Route path="/Visitation/:id" element={<VisitForm />} />

      <Route path="/Settings/ManageLists" element={<ManageLists />} />

      <Route path="/ledger/:department" element={<Ledger />} />

      <Route path="/ProgramLineUp" element={<ProgramLineUp />} />
      <Route path="/ProgramLineUpSchedule" element={<ProgramLineUpSchedule />} />

      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
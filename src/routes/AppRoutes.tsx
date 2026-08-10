import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import LoginPage from "../pages/Login/Login";
import Members from "../pages/Members/Members";
import ArchivesMembers from "../pages/Members/ArchivesMembers";
import Profile from "../pages/Profile/Profile";
import PledgesMembers from "../pages/Pledges/PledgesMembers";
import Visitation from "../pages/Visitation/Visitation";
import VisitForm from "../pages/Visitation/VisitForm";
import VisitationReports from "../pages/Visitation/VisitationReports";
import ManageLists from "../pages/Settings/ManageLists";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/members" element={<Members />} />
      <Route path="/ArchivesMembers" element={<ArchivesMembers />} />
      <Route path="/Profile/:id" element={<Profile />} />
      <Route path="/PledgesMembers" element={<PledgesMembers />} />

      <Route path="/visitation" element={<Visitation />} />
      <Route path="/Visitation/Reports" element={<VisitationReports />} />
      <Route path="/Visitation/new" element={<VisitForm />} />
      <Route path="/Visitation/:id" element={<VisitForm />} />

      <Route path="/Settings/ManageLists" element={<ManageLists />} />

      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
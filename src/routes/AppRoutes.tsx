import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import LoginPage from "../pages/Login/Login";
import Members from "../pages/Members/Members";
import Profile from "../pages/Profile/Profile";
import PledgesMembers from "../pages/Pledgers/PledgesMembers";
import Visitation from "../pages/Visitation/Visitation";
import VisitForm from "../pages/Visitation/VisitForm";
import VisitationReports from "../pages/Visitation/VisitationReports";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/members" element={<Members />} />
      <Route path="/Profile/:id" element={<Profile />} />
      <Route path="/PledgesMembers" element={<PledgesMembers />} />

      <Route path="/visitation" element={<Visitation />} />
      <Route path="/Visitation/Reports" element={<VisitationReports />} />
      <Route path="/Visitation/new" element={<VisitForm />} />
      <Route path="/Visitation/:id" element={<VisitForm />} />

      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
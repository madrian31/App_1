import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "../pages/Dashboard/Dashboard";
import LoginPage from "../pages/Login/Login";
import Members from "../pages/Members/Members";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path ="/members" element={<Members />} />

      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}
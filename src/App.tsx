import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import { Layout } from "./components/Layout";
import { Spinner } from "./components/ui";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Students from "./pages/Students";
import Departments from "./pages/Departments";
import Placeholder from "./pages/Placeholder";
import { ReactNode } from "react";

function Protected({ children }: { children: ReactNode }) {
  const { loading, userId, configured } = useAuth();
  if (loading) return <div className="min-h-full grid place-items-center"><Spinner /></div>;
  // When Supabase isn't configured we still let the shell render so the user
  // can see the app and the "connect Supabase" guidance.
  if (configured && !userId) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Overview /></Protected>} />
      <Route path="/attendance" element={<Protected><Placeholder title="Attendance Records" /></Protected>} />
      <Route path="/students" element={<Protected><Students /></Protected>} />
      <Route path="/departments" element={<Protected><Departments /></Protected>} />
      <Route path="/programmes" element={<Protected><Placeholder title="Programmes / Courses" /></Protected>} />
      <Route path="/groups" element={<Protected><Placeholder title="Intakes & Class Groups" /></Protected>} />
      <Route path="/units" element={<Protected><Placeholder title="Units" /></Protected>} />
      <Route path="/lecturers" element={<Protected><Placeholder title="Lecturers & Staff" /></Protected>} />
      <Route path="/assignments" element={<Protected><Placeholder title="Teaching Assignments" /></Protected>} />
      <Route path="/sessions" element={<Protected><Placeholder title="Timetable & Sessions" /></Protected>} />
      <Route path="/analytics" element={<Protected><Placeholder title="Analytics & Reports" /></Protected>} />
      <Route path="/users" element={<Protected><Placeholder title="User Management" /></Protected>} />
      <Route path="/audit" element={<Protected><Placeholder title="Audit Logs" /></Protected>} />
      <Route path="/settings" element={<Protected><Placeholder title="Settings" /></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Students from './pages/Students';
import FeeSlips from './pages/FeeSlips';
import Reports from './pages/Reports';
import StudentDetail from './pages/StudentDetail';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/classes/:classId/students" element={<Students />} />
        <Route path="/students/:studentId" element={<StudentDetail />} />
        <Route path="/fee-slips" element={<FeeSlips />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Layout>
  );
}

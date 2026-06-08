import { useState, lazy, Suspense } from 'react'
import './styles.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import LayoutWrapper from './components/LayoutWrapper';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const BackupConfig = lazy(() => import('./pages/admin/BackupConfig'));
const UserManagement = lazy(() => import('./pages/admin/UsersManagement'));
const DepartmentsManagement = lazy(() => import('./pages/admin/DepartmentsManagement'));
const DocumentTypesManagement = lazy(() => import('./pages/admin/DocumentTypesManagement'));
const ActivityLogs = lazy(() => import('./pages/admin/ActivityLogs'));
const AprobarExpedientes = lazy(() => import('./pages/admin/AprobarExpedientes'));
const SolicitarExpediente = lazy(() => import('./pages/admin/SolicitarExpediente'));
const DocumentosPendientes = lazy(() => import('./pages/analyst/DocumentosPendientes'));
const Expedientes = lazy(() => import('./pages/analyst/Expedientes'));
const ValidarExpedientes = lazy(() => import('./pages/analyst/ValidarExpedientes'));
const Reportes = lazy(() => import('./pages/analyst/Reportes'));
const MisExpedientes = lazy(() => import('./pages/recepcionista/MisExpedientes'));
const Notificaciones = lazy(() => import('./pages/recepcionista/Notificaciones'));
const GestionCorrecciones = lazy(() => import('./pages/recepcionista/GestionCorrecciones'));

const spinner = (
  <div className="h-screen flex items-center justify-center bg-slate-100">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-slate-200 rounded-full mx-auto mb-4" style={{ borderTopColor: '#2563eb', animation: 'spin 1s linear infinite' }}></div>
      <p className="text-slate-500">Cargando...</p>
    </div>
  </div>
);

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return spinner;
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <ErrorBoundary>
        <Suspense fallback={spinner}>
        <Routes>
         <Route path="/login" element={<Login />} />
         <Route path="/register" element={<Register />} />
         <Route path="/change-password" element={<ChangePassword />} />
         <Route path="/" element={<LayoutWrapper />}>
           <Route index element={<Dashboard />} />
           <Route path="dashboard" element={<Dashboard />} />
           <Route path="admin/backup" element={<ProtectedRoute allowedRoles={['admin']}><BackupConfig /></ProtectedRoute>} />
           <Route path="admin/users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
           <Route path="admin/logs" element={<ProtectedRoute allowedRoles={['admin']}><ActivityLogs /></ProtectedRoute>} />
           <Route path="admin/departments" element={<ProtectedRoute allowedRoles={['admin']}><DepartmentsManagement /></ProtectedRoute>} />
           <Route path="admin/document-types" element={<ProtectedRoute allowedRoles={['admin']}><DocumentTypesManagement /></ProtectedRoute>} />
           <Route path="admin/notificaciones" element={<ProtectedRoute allowedRoles={['admin', 'analyst', 'recepcionista']}><Notificaciones /></ProtectedRoute>} />
           <Route path="admin/aprobar-expedientes" element={<ProtectedRoute allowedRoles={['admin']}><AprobarExpedientes /></ProtectedRoute>} />
           <Route path="admin/solicitar-expediente" element={<ProtectedRoute allowedRoles={['admin']}><SolicitarExpediente /></ProtectedRoute>} />
           <Route path="admin/pendientes" element={<ProtectedRoute allowedRoles={['admin', 'analyst']}><DocumentosPendientes /></ProtectedRoute>} />
           <Route path="analyst/pendientes" element={<ProtectedRoute allowedRoles={['admin', 'analyst']}><DocumentosPendientes /></ProtectedRoute>} />
           <Route path="analyst/expedientes" element={<ProtectedRoute allowedRoles={['admin', 'analyst']}><Expedientes /></ProtectedRoute>} />
           <Route path="analyst/validar" element={<ProtectedRoute allowedRoles={['admin', 'analyst']}><ValidarExpedientes /></ProtectedRoute>} />
           <Route path="analyst/reportes" element={<ProtectedRoute allowedRoles={['admin', 'analyst']}><Reportes /></ProtectedRoute>} />
           <Route path="analyst/notificaciones" element={<ProtectedRoute allowedRoles={['admin', 'analyst', 'recepcionista']}><Notificaciones /></ProtectedRoute>} />
           <Route path="recepcionista/mis-expedientes" element={<ProtectedRoute allowedRoles={['admin', 'recepcionista']}><MisExpedientes /></ProtectedRoute>} />
           <Route path="recepcionista/gestion-correcciones" element={<ProtectedRoute allowedRoles={['admin', 'recepcionista']}><GestionCorrecciones /></ProtectedRoute>} />
           <Route path="recepcionista/notificaciones" element={<ProtectedRoute allowedRoles={['admin', 'analyst', 'recepcionista']}><Notificaciones /></ProtectedRoute>} />
         </Route>
         <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}

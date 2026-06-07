import { useState } from 'react'
import './styles.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import ChangePassword from './pages/ChangePassword';
import Dashboard from './pages/Dashboard';
import LayoutWrapper from './components/LayoutWrapper';

 //Admin pages
 import BackupConfig from './pages/admin/BackupConfig';
 import UserManagement from './pages/admin/UsersManagement';
 import DepartmentsManagement from './pages/admin/DepartmentsManagement';
 import DocumentTypesManagement from './pages/admin/DocumentTypesManagement';
 import ActivityLogs from './pages/admin/ActivityLogs';
 import AprobarExpedientes from './pages/admin/AprobarExpedientes';

 //Analyst pages
 import Expedientes from './pages/analyst/Expedientes';
 import ValidarExpedientes from './pages/analyst/ValidarExpedientes';
 import Reportes from './pages/analyst/Reportes';

 //Employee Pages
 import MisExpedientes from './pages/employee/MisExpedientes';
 import Notificaciones from './pages/employee/Notificaciones';
 import GestionCorrecciones from './pages/employee/GestionCorrecciones';


 function ProtectedRoute({ children, allowedRoles }) {
   const { user, loading } = useAuth();

   if (loading) {
     return (
        <div className="h-screen flex items-center justify-center bg-slate-100">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-200 rounded-full mx-auto mb-4" style={{ borderTopColor: '#2563eb', animation: 'spin 1s linear infinite' }}></div>
            <p className="text-slate-500">Cargando...</p>
         </div>
       </div>
     );
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
             <Route path="admin/notificaciones" element={<ProtectedRoute allowedRoles={['admin', 'analyst', 'employee']}><Notificaciones /></ProtectedRoute>} />
             <Route path="admin/aprobar-expedientes" element={<ProtectedRoute allowedRoles={['admin']}><AprobarExpedientes /></ProtectedRoute>} />
             <Route path="analyst/expedientes" element={<ProtectedRoute allowedRoles={['admin', 'analyst']}><Expedientes /></ProtectedRoute>} />
             <Route path="analyst/validar" element={<ProtectedRoute allowedRoles={['admin', 'analyst']}><ValidarExpedientes /></ProtectedRoute>} />
             <Route path="analyst/reportes" element={<ProtectedRoute allowedRoles={['admin', 'analyst']}><Reportes /></ProtectedRoute>} />
             <Route path="analyst/notificaciones" element={<ProtectedRoute allowedRoles={['admin', 'analyst', 'employee']}><Notificaciones /></ProtectedRoute>} />
             <Route path="employee/mis-expedientes" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><MisExpedientes /></ProtectedRoute>} />
             <Route path="employee/gestion-correcciones" element={<ProtectedRoute allowedRoles={['admin', 'employee']}><GestionCorrecciones /></ProtectedRoute>} />
             <Route path="employee/notificaciones" element={<ProtectedRoute allowedRoles={['admin', 'analyst', 'employee']}><Notificaciones /></ProtectedRoute>} />
           </Route>
           <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    );
  }

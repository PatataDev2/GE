  import { useState } from 'react'
  import './styles.css'
  import { BrowserRouter, Routes, Route } from 'react-router-dom';
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


  export default function App() {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/" element={<LayoutWrapper />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="admin/backup" element={<BackupConfig />} />
            <Route path="admin/users" element={<UserManagement />} />
            <Route path="admin/logs" element={<ActivityLogs />} />
            <Route path="admin/departments" element={<DepartmentsManagement />} />
            <Route path="admin/document-types" element={<DocumentTypesManagement />} />
            <Route path="admin/notificaciones" element={<Notificaciones />} />
            <Route path="admin/aprobar-expedientes" element={<AprobarExpedientes />} />
            <Route path="analyst/expedientes" element={<Expedientes />} />
            <Route path="analyst/validar" element={<ValidarExpedientes />} />
            <Route path="analyst/reportes" element={<Reportes />} />
            <Route path="analyst/notificaciones" element={<Notificaciones />} />
            <Route path="employee/mis-expedientes" element={<MisExpedientes />} />
            <Route path="employee/gestion-correcciones" element={<GestionCorrecciones />} />
            <Route path="employee/notificaciones" element={<Notificaciones />} />
          </Route>
        </Routes>
      </BrowserRouter>
    );
  }

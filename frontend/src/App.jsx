import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import LoginPage from './pages/Login/LoginPage';
import DuenoList from './pages/Dueno/DuenoList';
import DuenoForm from './pages/Dueno/DuenoForm';

import MascotaList from './pages/Mascota/MascotaList';
import MascotaForm from './pages/Mascota/MascotaForm';

import CitaList from './pages/Cita/CitaList';
import CitaForm from './pages/Cita/CitaForm';

import UsuarioList from './pages/Usuario/UsuarioList';
import UsuarioForm from './pages/Usuario/UsuarioForm';

import AdopcionList from './pages/Adopción/AdopcionList';
import AdopcionForm from './pages/Adopción/AdopcionForm';

import PostAdopcionList from './pages/PostAdopcion/PostAdopcionList';
import PostAdopcionForm from './pages/PostAdopcion/PostAdopcionForm';
import SeguimientoReportes from './pages/PostAdopcion/PostAdopcionReportes';

import HistorialClinico from './pages/HistorialClinico/HistorialClinico';

import Dashboard from './pages/Dashboard/Dashboard';

import AplicacionForm from './pages/Aplicaciones/AplicacionForm';
import AplicacionesList from './pages/Aplicaciones/AplicacionesList';

import VacunaList from './pages/Vacuna/VacunaList';
import VacunaForm from './pages/Vacuna/VacunaForm';

import MedicamentoList from './pages/Medicamento/MedicamentoList';
import MedicamentoForm from './pages/Medicamento/MedicamentoForm';

import AlergiaList from './pages/Alergia/AlergiaList';
import AlergiaForm from './pages/Alergia/AlergiaForm';

import TratamientoList from './pages/Tratamiento/TratamientoList';
import TratamientoForm from './pages/Tratamiento/TratamientoForm';

import TratamientoMedicamentoList from './pages/TratamientoMedico/TratamientoMedicamentoList';
import TratamientoMedicamentoForm from './pages/TratamientoMedico/TratamientoMedicamentoForm';

import EnfermedadList from './pages/Enfermedad/EnfermedadList';
import EnfermedadForm from './pages/Enfermedad/EnfermedadForm';

import MascotaEnfermedadList from './pages/MascotaEnfermedad/MascotaEnfermedadList';
import MascotaEnfermedadForm from './pages/MascotaEnfermedad/MascotaEnfermedadForm';
import MascotaAlergiaList from './pages/MascotaAlergia/MascotaAlergiaList';
import MascotaAlergiaForm from './pages/MascotaAlergia/MascotaAlergiaForm';

import CampaniaList from './pages/Campania/CampaniaList';
import CampaniaForm from './pages/Campania/CampaniaForm';

import DonacionList from './pages/Donacion/DonacionList';
import DonacionForm from './pages/Donacion/DonacionForm';

import CalendarioCitas from './pages/Calendario/CalendarioCitas';

import ForgotPasswordPage from './pages/Login/ForgotPasswordPage';
import ResetPasswordPage from './pages/Login/ResetPasswordPage';

const ALL_ROLES = ['Administrador', 'Veterinario', 'Voluntario'];
const ADMIN_ONLY = ['Administrador'];
const ADMIN_VET = ['Administrador', 'Veterinario'];
const ADMIN_VOL = ['Administrador', 'Voluntario'];

const withRoles = (roles, element) => (
  <ProtectedRoute allowedRoles={roles}>{element}</ProtectedRoute>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Rutas protegidas dentro de layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={withRoles(ALL_ROLES, <Dashboard />)} />

                    <Route path="/" element={withRoles(ALL_ROLES, <DuenoList />)} />
                    <Route path="duenos" element={withRoles(ALL_ROLES, <DuenoList />)} />
                    <Route path="duenos/new" element={withRoles(ALL_ROLES, <DuenoForm />)} />
                    <Route path="duenos/edit/:id" element={withRoles(ALL_ROLES, <DuenoForm />)} />

                    <Route path="/mascotas" element={withRoles(ALL_ROLES, <MascotaList />)} />
                    <Route path="/mascotas/nueva" element={withRoles(ALL_ROLES, <MascotaForm />)} />
                    <Route path="/mascotas/editar/:id" element={withRoles(ALL_ROLES, <MascotaForm />)} />

                    <Route path="/citas" element={withRoles(ADMIN_VET, <CitaList />)} />
                    <Route path="/citas/nueva" element={withRoles(ADMIN_VET, <CitaForm />)} />
                    <Route path="/citas/editar/:id" element={withRoles(ADMIN_VET, <CitaForm />)} />

                    <Route path="/calendario" element={withRoles(ADMIN_VET, <CalendarioCitas />)} />

                    <Route path="/usuarios" element={withRoles(ADMIN_ONLY, <UsuarioList />)} />
                    <Route path="/usuarios/nuevo" element={withRoles(ADMIN_ONLY, <UsuarioForm />)} />
                    <Route path="/usuarios/editar/:id" element={withRoles(ADMIN_ONLY, <UsuarioForm />)} />

                    <Route path="/adopciones" element={withRoles(ADMIN_VOL, <AdopcionList />)} />
                    <Route path="/adopciones/nueva" element={withRoles(ADMIN_VOL, <AdopcionForm />)} />
                    <Route path="/adopciones/editar/:id" element={withRoles(ADMIN_VOL, <AdopcionForm />)} />

                    <Route path="/post-adopcion" element={withRoles(ADMIN_VOL, <PostAdopcionList />)} />
                    <Route path="/post-adopcion/new" element={withRoles(ADMIN_VOL, <PostAdopcionForm />)} />
                    <Route path="/post-adopcion/edit/:id" element={withRoles(ADMIN_VOL, <PostAdopcionForm />)} />

                    <Route path="/seguimientos/reportes" element={withRoles(ADMIN_VOL, <SeguimientoReportes />)} />

                    <Route path="/historial" element={withRoles(ADMIN_VET, <HistorialClinico />)} />

                    <Route path="/vacunas" element={withRoles(ADMIN_VET, <AplicacionesList />)} />
                    <Route path="/vacunas/nueva" element={withRoles(ADMIN_VET, <AplicacionForm />)} />
                    <Route path="/vacunas/editar/:id" element={withRoles(ADMIN_VET, <AplicacionForm />)} />

                    <Route path="/vacuna" element={withRoles(ADMIN_VET, <VacunaList />)} />
                    <Route path="/vacuna/nueva" element={withRoles(ADMIN_VET, <VacunaForm />)} />
                    <Route path="/vacuna/editar/:id" element={withRoles(ADMIN_VET, <VacunaForm />)} />

                    <Route path="/medicamentos" element={withRoles(ADMIN_VET, <MedicamentoList />)} />
                    <Route path="/medicamentos/nuevo" element={withRoles(ADMIN_VET, <MedicamentoForm />)} />
                    <Route path="/medicamentos/editar/:id" element={withRoles(ADMIN_VET, <MedicamentoForm />)} />

                    <Route path="/alergias" element={withRoles(ADMIN_VET, <AlergiaList />)} />
                    <Route path="/alergias/nuevo" element={withRoles(ADMIN_VET, <AlergiaForm />)} />
                    <Route path="/alergias/editar/:id" element={withRoles(ADMIN_VET, <AlergiaForm />)} />

                    <Route path="/tratamientos" element={withRoles(ADMIN_VET, <TratamientoList />)} />
                    <Route path="/tratamientos/nuevo" element={withRoles(ADMIN_VET, <TratamientoForm />)} />
                    <Route path="/tratamientos/editar/:id" element={withRoles(ADMIN_VET, <TratamientoForm />)} />

                    <Route
                      path="/tratamiento-medicamento"
                      element={withRoles(ADMIN_VET, <TratamientoMedicamentoList />)}
                    />
                    <Route
                      path="/tratamiento-medicamento/nuevo"
                      element={withRoles(ADMIN_VET, <TratamientoMedicamentoForm />)}
                    />
                    <Route
                      path="/tratamiento-medicamento/editar/:id"
                      element={withRoles(ADMIN_VET, <TratamientoMedicamentoForm />)}
                    />

                    <Route path="/enfermedades" element={withRoles(ADMIN_VET, <EnfermedadList />)} />
                    <Route path="/enfermedades/nueva" element={withRoles(ADMIN_VET, <EnfermedadForm />)} />
                    <Route path="/enfermedades/editar/:id" element={withRoles(ADMIN_VET, <EnfermedadForm />)} />

                    <Route path="/mascota-enfermedad" element={withRoles(ADMIN_VET, <MascotaEnfermedadList />)} />
                    <Route path="/mascota-enfermedad/nueva" element={withRoles(ADMIN_VET, <MascotaEnfermedadForm />)} />
                    <Route
                      path="/mascota-enfermedad/editar/:id"
                      element={withRoles(ADMIN_VET, <MascotaEnfermedadForm />)}
                    />
                    <Route path="/mascota-alergia" element={withRoles(ADMIN_VET, <MascotaAlergiaList />)} />
                    <Route path="/mascota-alergia/nueva" element={withRoles(ADMIN_VET, <MascotaAlergiaForm />)} />
                    <Route
                      path="/mascota-alergia/editar/:id"
                      element={withRoles(ADMIN_VET, <MascotaAlergiaForm />)}
                    />

                    <Route path="/campanias" element={withRoles(ADMIN_VOL, <CampaniaList />)} />
                    <Route path="/campanias/nueva" element={withRoles(ADMIN_VOL, <CampaniaForm />)} />
                    <Route path="/campanias/editar/:id" element={withRoles(ADMIN_VOL, <CampaniaForm />)} />

                    <Route path="/donaciones" element={withRoles(ADMIN_VOL, <DonacionList />)} />
                    <Route path="/donaciones/nueva" element={withRoles(ADMIN_VOL, <DonacionForm />)} />
                    <Route path="/donaciones/editar/:id" element={withRoles(ADMIN_VOL, <DonacionForm />)} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

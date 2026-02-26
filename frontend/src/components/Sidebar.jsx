import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Users,
  Home,
  Dog,
  User,
  Heart,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  CalendarCheck,
  FileText,
  Syringe,
  Pill,
  Activity,
  BarChart2,
  Calendar,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import logoNAF from '../assets/logo-naf.png';

const ALL_ROLES = ['Administrador', 'Veterinario', 'Voluntario'];
const ADMIN_VET = ['Administrador', 'Veterinario'];
const ADMIN_VOL = ['Administrador', 'Voluntario'];
const ADMIN_ONLY = ['Administrador'];

export default function Sidebar({ logoSrc = logoNAF, appName = 'Sistema Web' }) {
  const navigate = useNavigate();
  const { hasRole, logout } = useAuth();

  const canSee = (roles) => {
    if (!roles || roles.length === 0) return true;
    return hasRole(...roles);
  };

  const categories = [
    {
      title: 'Gestión',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: Home, roles: ALL_ROLES },
        { to: '/duenos', label: 'Dueños', icon: Users, roles: ALL_ROLES },
        { to: '/mascotas', label: 'Mascotas', icon: Dog, roles: ALL_ROLES },
      ],
    },
    {
      title: 'Servicios Veterinaria',
      items: [
        { to: '/citas', label: 'Citas', icon: CalendarCheck, roles: ADMIN_VET },
        { to: '/calendario', label: 'Calendario', icon: Calendar, roles: ADMIN_VET },
        { to: '/vacunas', label: 'Mascota Vacunas', icon: Syringe, roles: ADMIN_VET },
        { to: '/tratamiento-medicamento', label: 'Tratamientos con Medicamentos', icon: Activity, roles: ADMIN_VET },
        { to: '/mascota-enfermedad', label: 'Mascotas con Enfermedades', icon: Dog, roles: ADMIN_VET },
        { to: '/mascota-alergia', label: 'Mascotas con Alergias', icon: AlertCircle, roles: ADMIN_VET },
        { to: '/historial', label: 'Historial Clínico', icon: FileText, roles: ADMIN_VET },
      ],
    },
    {
      title: 'Control Veterinaria',
      items: [
        { to: '/vacuna', label: 'Vacunas', icon: Syringe, roles: ADMIN_VET },
        { to: '/medicamentos', label: 'Medicamentos', icon: Pill, roles: ADMIN_VET },
        { to: '/tratamientos', label: 'Tratamientos', icon: Activity, roles: ADMIN_VET },
        { to: '/alergias', label: 'Alergias', icon: AlertCircle, roles: ADMIN_VET },
        { to: '/enfermedades', label: 'Enfermedades', icon: Dog, roles: ADMIN_VET },
      ],
    },
    {
      title: 'Adopciones',
      items: [
        { to: '/adopciones', label: 'Adopciones', icon: Heart, roles: ADMIN_VOL },
        { to: '/post-adopcion', label: 'Seguimiento', icon: BarChart2, roles: ADMIN_VOL },
        { to: '/seguimientos/reportes', label: 'Reportes Post-Adopción', icon: BarChart2, roles: ADMIN_VOL },
      ],
    },
    {
      title: 'Procesos Refugio',
      items: [
        { to: '/campanias', label: 'Campañas', icon: AlertCircle, roles: ADMIN_VOL },
        { to: '/donaciones', label: 'Donaciones', icon: Dog, roles: ADMIN_VOL },
      ],
    },
    {
      title: 'Sistema',
      items: [{ to: '/usuarios', label: 'Usuarios', icon: User, roles: ADMIN_ONLY }],
    },
  ];

  const [openCategories, setOpenCategories] = useState({ GestiA3n: true, Salud: true });

  const toggleCategory = (title) => {
    setOpenCategories((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="
        fixed top-0 left-0 h-full w-64 z-50 flex flex-col border-r
        bg-white shadow-xl
        before:content-[''] before:absolute before:inset-x-0 before:top-0 before:h-1
        before:bg-[#FFD200]
      "
    >
      {/* Header */}
      <div className="relative p-5 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="relative size-12 overflow-hidden flex items-center justify-center">
            {/* SVG techo amarillo */}
            <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full text-[#FFD200]">
              <path
                d="M150 16L40 92v130a22 22 0 0 0 22 22h176a22 22 0 0 0 22-22V92L150 16z"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Logo dentro del cuadrito */}
            <img
              src={logoSrc}
              alt="Logo NAF"
              className="relative z-10 w-[85%] h-[85%] object-contain"
            />
          </div>

          <div className="leading-tight">
            <div className="text-sm font-semibold text-black/60 tracking-wide">entidad civil de rescate</div>
            <div className="text-xl font-black">
              <span className="text-[#FFD200]">Narices</span>{' '}
              <span className="text-black">Frias</span>
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs font-medium text-black/60">{appName}</div>
      </div>

      {/* NavegaciA3n */}
      <nav className="flex-1 overflow-y-auto py-3">
        {categories.map((category) => {
          const visibleItems = category.items.filter((item) => canSee(item.roles));
          if (visibleItems.length === 0) return null;
          const open = !!openCategories[category.title];
          return (
            <div key={category.title}>
              <button
                onClick={() => toggleCategory(category.title)}
                className="
                  w-full flex items-center justify-between px-4 py-2
                  text-[13px] font-semibold text-black/70
                  hover:bg-[#FFF6C7] transition-colors
                "
              >
                <span className="flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#FFD200]" />
                  {category.title}
                </span>
                {open ? (
                  <ChevronDown className="w-4 h-4 text-black/50" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-black/50" />
                )}
              </button>

              {open && (
                <div className="flex flex-col mt-1">
                  {visibleItems.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `
                        group flex items-center gap-3 mx-2 my-0.5 px-3 py-2 rounded-lg
                        text-[13px] transition
                        border
                        ${
                          isActive
                            ? 'bg-[#FFD200]/90 border-[#FFD200] text-black font-semibold shadow-sm'
                            : 'bg-white hover:bg-[#FFF6C7] border-black/10 text-black/80'
                        }
                      `
                      }
                    >
                      <Icon className="w-5 h-5" strokeWidth={2.25} />
                      <span className="truncate">{label}</span>
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer con botA3n de cerrar sesiA3n */}
      <div className="p-4 border-t bg-white">
        <button
          onClick={handleLogout}
          className="
            w-full inline-flex items-center justify-center gap-2
            rounded-xl px-4 py-2 text-sm font-semibold
            bg-[#111] text-white border border-black hover:shadow-md active:scale-95
          "
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

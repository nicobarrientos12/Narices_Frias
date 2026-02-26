const dashboardRepo = require('../repositories/dashboard.repository');
const usuarioRepo = require('../repositories/usuario.repository');

async function overview(params = {}, req) {
  const start = params?.start || null;
  const end = params?.end || null;

  let usuario = null;
  const userId = req?.user?.sub;
  if (userId) {
    const u = await usuarioRepo.findById(userId);
    if (u) {
      usuario = {
        id: u.id,
        nombre: u.nombre,
        primer_apellido: u.primer_apellido,
        rol: u.rol,
        correo: u.correo,
      };
    }
  }

  const [
    totalDonaciones,
    totalCampanias,
    totalCitas,
    totalTratamientos,
    ingresosEspecie,
    adopciones,
    proximasCitas,
    ultimasMascotas,
    tratamientosActivos,
    refugioConEnfermedades,
    proximasCampanias,
    ultimasDonaciones,
    vacunas,
    medicamentos,
    vacunasSemana,
    tratamientosSemana,
    citasSinContactoSemana,
  ] = await Promise.all([
    dashboardRepo.sumDonaciones(start, end),
    dashboardRepo.sumCampanias(start, end),
    dashboardRepo.sumCitas(start, end),
    dashboardRepo.sumTratamientos(start, end),
    dashboardRepo.ingresosPorEspecie(start, end),
    dashboardRepo.countAdopciones(start, end),
    dashboardRepo.proximasCitas(10),
    dashboardRepo.ultimasMascotas(10),
    dashboardRepo.tratamientosActivos(10),
    dashboardRepo.refugioConEnfermedades(10),
    dashboardRepo.proximasCampanias(10),
    dashboardRepo.ultimasDonaciones(10),
    dashboardRepo.inventarioVacunas(),
    dashboardRepo.inventarioMedicamentos(),
    dashboardRepo.vacunasProximasSemana(10),
    dashboardRepo.tratamientosPorVencerSemana(10),
    dashboardRepo.citasSinContactoSemana(10),
  ]);

  const desglose = [
    { concepto: 'Donaciones', monto: Number(totalDonaciones || 0) },
    { concepto: 'Campanias', monto: Number(totalCampanias || 0) },
    { concepto: 'Citas', monto: Number(totalCitas || 0) },
    { concepto: 'Tratamientos', monto: Number(totalTratamientos || 0) },
  ];

  const totalGeneral = desglose.reduce((acc, x) => acc + Number(x.monto || 0), 0);

  return {
    filtros: { start, end },
    usuario,
    ingresos: {
      total_general: totalGeneral,
      desglose,
      por_especie: ingresosEspecie || [],
    },
    listas: {
      proximas_citas: proximasCitas || [],
      ultimas_mascotas: ultimasMascotas || [],
      tratamientos_activos: tratamientosActivos || [],
      refugio_con_enfermedades: refugioConEnfermedades || [],
      proximas_campanias: proximasCampanias || [],
      ultimas_donaciones: ultimasDonaciones || [],
    },
    adopciones,
    inventario: {
      vacunas: vacunas || [],
      medicamentos: medicamentos || [],
    },
    alertas: {
      vacunas_proximas: vacunasSemana || [],
      tratamientos_por_vencer: tratamientosSemana || [],
      citas_sin_contacto: citasSinContactoSemana || [],
    },
  };
}

async function exportPdf(params) {
  return null;
}

async function exportExcel(params) {
  return null;
}

module.exports = { overview, exportPdf, exportExcel };

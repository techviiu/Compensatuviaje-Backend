/**
 * Admin Reports Controller
 * Generación de reportes y exportaciones para SuperAdmin
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../../../utils/logger');

/**
 * GET /api/admin/reports/emissions
 * Reporte de emisiones
 */
const getEmissionsReport = async (req, res) => {
  try {
    const {
      period = '30d',
      groupBy = 'company',
      projectId,
      companyId,
      dateFrom,
      dateTo
    } = req.query;

    // Calcular fechas
    const startDate = dateFrom ? new Date(dateFrom) : calculateDateFrom(period);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    let reportData = {};

    if (groupBy === 'company') {
      reportData = await getEmissionsByCompany(startDate, endDate, companyId);
    } else if (groupBy === 'project') {
      reportData = await getEmissionsByProject(startDate, endDate, projectId);
    } else if (groupBy === 'time') {
      reportData = await getEmissionsByTime(startDate, endDate, period);
    } else if (groupBy === 'type') {
      reportData = await getEmissionsByType(startDate, endDate);
    }

    // Calcular totales
    const totals = await calculateEmissionsTotals(startDate, endDate);

    res.json({
      success: true,
      data: {
        report: reportData,
        totals,
        filters: {
          period,
          groupBy,
          dateFrom: startDate,
          dateTo: endDate,
          projectId,
          companyId
        }
      }
    });
  } catch (error) {
    console.error('Error en getEmissionsReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte de emisiones'
    });
  }
};

/**
 * GET /api/admin/reports/financial
 * Reporte financiero
 */
const getFinancialReport = async (req, res) => {
  try {
    const {
      period = '30d',
      groupBy = 'month',
      currency = 'CLP',
      companyId,
      projectId,
      dateFrom,
      dateTo
    } = req.query;

    // Calcular fechas
    const startDate = dateFrom ? new Date(dateFrom) : calculateDateFrom(period);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    let reportData = {};

    if (groupBy === 'month') {
      reportData = await getRevenueByMonth(startDate, endDate);
    } else if (groupBy === 'company') {
      reportData = await getRevenueByCompany(startDate, endDate, companyId);
    } else if (groupBy === 'project') {
      reportData = await getRevenueByProject(startDate, endDate, projectId);
    } else if (groupBy === 'source') {
      reportData = await getRevenueBySource(startDate, endDate);
    }

    // Calcular totales
    const totals = await calculateFinancialTotals(startDate, endDate);

    res.json({
      success: true,
      data: {
        report: reportData,
        totals,
        filters: {
          period,
          groupBy,
          currency,
          dateFrom: startDate,
          dateTo: endDate,
          companyId,
          projectId
        }
      }
    });
  } catch (error) {
    console.error('Error en getFinancialReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte financiero'
    });
  }
};

/**
 * GET /api/admin/reports/companies
 * Reporte de empresas
 */
const getCompaniesReport = async (req, res) => {
  try {
    const {
      period = '30d',
      status,
      industry,
      dateFrom,
      dateTo
    } = req.query;

    // Calcular fechas
    const startDate = dateFrom ? new Date(dateFrom) : calculateDateFrom(period);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    // Obtener datos de empresas
    const where = {};
    if (status) where.status = status;
    if (industry) where.industria = industry;

    const companies = await prisma.company.findMany({
      where: {
        ...where,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      select: {
        id: true,
        razonSocial: true,
        nombreComercial: true,
        rut: true,
        industria: true,
        tamanoEmpresa: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            certificates: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Estadísticas por industria
    const byIndustry = await prisma.company.groupBy({
      by: ['industria'],
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: { id: true }
    });

    // Estadísticas por tamaño
    const bySize = await prisma.company.groupBy({
      by: ['tamanoEmpresa'],
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: { id: true }
    });

    // Estadísticas por estado
    const byStatus = await prisma.company.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      _count: { id: true }
    });

    // Formatear datos
    const industryMap = {};
    byIndustry.forEach(i => {
      industryMap[i.industria || 'Sin especificar'] = i._count.id;
    });

    const sizeMap = {};
    bySize.forEach(s => {
      sizeMap[s.tamanoEmpresa || 'Sin especificar'] = s._count.id;
    });

    const statusMap = {};
    byStatus.forEach(s => {
      statusMap[s.status || 'registered'] = s._count.id;
    });

    res.json({
      success: true,
      data: {
        companies: companies.map(c => ({
          id: c.id,
          name: c.nombreComercial || c.razonSocial,
          rut: c.rut,
          industry: c.industria,
          size: c.tamanoEmpresa,
          status: c.status,
          certificatesCount: c._count.certificates,
          createdAt: c.createdAt
        })),
        stats: {
          total: companies.length,
          byIndustry: industryMap,
          bySize: sizeMap,
          byStatus: statusMap
        },
        filters: {
          period,
          status,
          industry,
          dateFrom: startDate,
          dateTo: endDate
        }
      }
    });
  } catch (error) {
    console.error('Error en getCompaniesReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte de empresas'
    });
  }
};

/**
 * GET /api/admin/reports/b2c
 * Reporte de usuarios B2C
 */
const getB2CReport = async (req, res) => {
  try {
    const {
      period = '30d',
      // country, // No existe en schema
      dateFrom,
      dateTo
    } = req.query;

    // Calcular fechas
    const startDate = dateFrom ? new Date(dateFrom) : calculateDateFrom(period);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    const where = {
      createdAt: { gte: startDate, lte: endDate }
    };
    // if (country) where.pais = country;

    // Obtener usuarios del período
    const users = await prisma.b2cUser.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
        provider: true,
        lastLoginAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Estadísticas por proveedor de auth
    const byProvider = await prisma.b2cUser.groupBy({
      by: ['provider'],
      where,
      _count: { id: true }
    });

    // Formatear datos
    const providerMap = {};
    byProvider.forEach(p => {
      providerMap[p.provider || 'email'] = p._count.id;
    });

    res.json({
      success: true,
      data: {
        users: users.map(u => ({
          id: u.id,
          name: u.nombre || u.email,
          email: u.email,
          country: 'N/A',
          authProvider: u.provider,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt
        })),
        stats: {
          total: users.length,
          byCountry: {},
          byAuthProvider: providerMap
        },
        filters: {
          period,
          // country,
          dateFrom: startDate,
          dateTo: endDate
        }
      }
    });
  } catch (error) {
    console.error('Error en getB2CReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar reporte de usuarios B2C'
    });
  }
};

/**
 * GET /api/admin/reports/export
 * Exportar reporte
 */
const exportReport = async (req, res) => {
  try {
    const {
      reportType,
      format = 'csv',
      period = '30d',
      dateFrom,
      dateTo,
      ...filters
    } = req.query;

    // Validar tipo de reporte
    const validTypes = ['emissions', 'financial', 'companies', 'b2c', 'projects'];
    if (!reportType || !validTypes.includes(reportType)) {
      return res.status(400).json({
        success: false,
        message: `Tipo de reporte inválido. Válidos: ${validTypes.join(', ')}`
      });
    }

    // Validar formato
    const validFormats = ['csv', 'excel', 'pdf'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        message: `Formato inválido. Válidos: ${validFormats.join(', ')}`
      });
    }

    // Calcular fechas
    const startDate = dateFrom ? new Date(dateFrom) : calculateDateFrom(period);
    const endDate = dateTo ? new Date(dateTo) : new Date();

    // Obtener datos según tipo de reporte
    let data = [];
    let columns = [];

    switch (reportType) {
      case 'emissions':
        const emissionsData = await getExportEmissionsData(startDate, endDate);
        data = emissionsData.rows;
        columns = emissionsData.columns;
        break;

      case 'financial':
        const financialData = await getExportFinancialData(startDate, endDate);
        data = financialData.rows;
        columns = financialData.columns;
        break;

      case 'companies':
        const companiesData = await getExportCompaniesData(startDate, endDate);
        data = companiesData.rows;
        columns = companiesData.columns;
        break;

      case 'b2c':
        const b2cData = await getExportB2CData(startDate, endDate);
        data = b2cData.rows;
        columns = b2cData.columns;
        break;

      case 'projects':
        const projectsData = await getExportProjectsData();
        data = projectsData.rows;
        columns = projectsData.columns;
        break;
    }

    // Generar archivo según formato
    if (format === 'csv') {
      const csv = generateCSV(data, columns);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=reporte_${reportType}_${Date.now()}.csv`);
      return res.send(csv);
    }

    if (format === 'excel') {
      // Para Excel completo necesitaríamos exceljs
      // Por ahora retornamos JSON
      return res.json({
        success: true,
        message: 'Para exportar a Excel, instale el paquete exceljs',
        data: { columns, rows: data }
      });
    }

    if (format === 'pdf') {
      // Para PDF completo necesitaríamos pdfkit
      return res.json({
        success: true,
        message: 'Para exportar a PDF, instale el paquete pdfkit',
        data: { columns, rows: data }
      });
    }

    res.json({
      success: true,
      data: { columns, rows: data }
    });

  } catch (error) {
    console.error('Error en exportReport:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar reporte'
    });
  }
};

// ============================================
// FUNCIONES AUXILIARES - EMISIONES
// ============================================

async function getEmissionsByCompany(startDate, endDate, companyId) {
  try {
    const where = {
      createdAt: { gte: startDate, lte: endDate }
    };
    if (companyId) where.companyId = companyId;

    const data = await prisma.certificate.groupBy({
      by: ['companyId'],
      where,
      _sum: { emissionsKg: true },
      _count: { id: true }
    });

    // Obtener nombres de empresas
    const companyIds = data.map(d => d.companyId);
    const companies = await prisma.company.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, nombreComercial: true, razonSocial: true }
    });

    const companyMap = {};
    companies.forEach(c => {
      companyMap[c.id] = c.nombreComercial || c.razonSocial;
    });

    return data.map(d => ({
      companyId: d.companyId,
      companyName: companyMap[d.companyId] || 'Desconocida',
      totalEmissionsKg: d._sum.emissionsKg || 0,
      certificatesCount: d._count.id
    }));
  } catch (error) {
    return [];
  }
}

async function getEmissionsByProject(startDate, endDate, projectId) {
  try {
    const where = {
      createdAt: { gte: startDate, lte: endDate }
    };
    if (projectId) where.projectId = projectId;

    const data = await prisma.certificate.groupBy({
      by: ['projectId'],
      where,
      _sum: { emissionsKg: true },
      _count: { id: true }
    });

    // Obtener nombres de proyectos
    const projectIds = data.map(d => d.projectId).filter(Boolean);
    const projects = await prisma.esgProject.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, code: true }
    });

    const projectMap = {};
    projects.forEach(p => {
      projectMap[p.id] = p.name;
    });

    return data.map(d => ({
      projectId: d.projectId,
      projectName: projectMap[d.projectId] || 'Sin proyecto',
      totalEmissionsKg: d._sum.emissionsKg || 0,
      certificatesCount: d._count.id
    }));
  } catch (error) {
    return [];
  }
}

async function getEmissionsByTime(startDate, endDate, period) {
  // Generar series temporales
  const series = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayStart = new Date(current);
    const dayEnd = new Date(current);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayStats = await prisma.certificate.aggregate({
      where: {
        createdAt: { gte: dayStart, lt: dayEnd }
      },
      _sum: { emissionsKg: true },
      _count: { id: true }
    });

    series.push({
      date: current.toISOString().split('T')[0],
      emissionsKg: dayStats._sum.emissionsKg || 0,
      count: dayStats._count.id || 0
    });

    current.setDate(current.getDate() + 1);
  }

  return series;
}

async function getEmissionsByType(startDate, endDate) {
  // Por tipo de proyecto
  const data = await prisma.certificate.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    select: {
      emissionsKg: true,
      project: {
        select: { projectType: true }
      }
    }
  });

  const byType = {};
  data.forEach(d => {
    const type = d.project?.projectType || 'Sin tipo';
    if (!byType[type]) {
      byType[type] = { count: 0, totalKg: 0 };
    }
    byType[type].count++;
    byType[type].totalKg += d.emissionsKg || 0;
  });

  return Object.entries(byType).map(([type, stats]) => ({
    type,
    count: stats.count,
    totalEmissionsKg: stats.totalKg
  }));
}

async function calculateEmissionsTotals(startDate, endDate) {
  try {
    const stats = await prisma.certificate.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: { emissionsKg: true, amountClp: true },
      _count: { id: true }
    });

    return {
      totalEmissionsKg: stats._sum.emissionsKg || 0,
      totalEmissionsTon: ((stats._sum.emissionsKg || 0) / 1000).toFixed(2),
      totalCertificates: stats._count.id || 0,
      totalRevenueCLP: stats._sum.amountClp || 0
    };
  } catch (error) {
    return {
      totalEmissionsKg: 0,
      totalEmissionsTon: 0,
      totalCertificates: 0,
      totalRevenueCLP: 0
    };
  }
}

// ============================================
// FUNCIONES AUXILIARES - FINANCIERO
// ============================================

async function getRevenueByMonth(startDate, endDate) {
  const series = [];
  const current = new Date(startDate);
  current.setDate(1); // Inicio del mes

  while (current <= endDate) {
    const monthStart = new Date(current);
    const monthEnd = new Date(current);
    monthEnd.setMonth(monthEnd.getMonth() + 1);

    const monthStats = await prisma.certificate.aggregate({
      where: {
        createdAt: { gte: monthStart, lt: monthEnd }
      },
      _sum: { amountClp: true },
      _count: { id: true }
    });

    series.push({
      month: current.toISOString().slice(0, 7), // YYYY-MM
      revenueCLP: monthStats._sum.amountClp || 0,
      revenueUSD: Math.round((monthStats._sum.amountClp || 0) / 900),
      transactions: monthStats._count.id || 0
    });

    current.setMonth(current.getMonth() + 1);
  }

  return series;
}

async function getRevenueByCompany(startDate, endDate, companyId) {
  const where = {
    createdAt: { gte: startDate, lte: endDate }
  };
  if (companyId) where.companyId = companyId;

  const data = await prisma.certificate.groupBy({
    by: ['companyId'],
    where,
    _sum: { amountClp: true },
    _count: { id: true }
  });

  // Obtener nombres
  const companyIds = data.map(d => d.companyId);
  const companies = await prisma.company.findMany({
    where: { id: { in: companyIds } },
    select: { id: true, nombreComercial: true, razonSocial: true }
  });

  const companyMap = {};
  companies.forEach(c => {
    companyMap[c.id] = c.nombreComercial || c.razonSocial;
  });

  return data.map(d => ({
    companyId: d.companyId,
    companyName: companyMap[d.companyId] || 'Desconocida',
    revenueCLP: d._sum.amountClp || 0,
    revenueUSD: Math.round((d._sum.amountClp || 0) / 900),
    transactions: d._count.id
  }));
}

async function getRevenueByProject(startDate, endDate, projectId) {
  const where = {
    createdAt: { gte: startDate, lte: endDate }
  };
  if (projectId) where.projectId = projectId;

  const data = await prisma.certificate.groupBy({
    by: ['projectId'],
    where,
    _sum: { amountClp: true },
    _count: { id: true }
  });

  // Obtener nombres
  const projectIds = data.map(d => d.projectId).filter(Boolean);
  const projects = await prisma.esgProject.findMany({
    where: { id: { in: projectIds } },
    select: { id: true, name: true }
  });

  const projectMap = {};
  projects.forEach(p => {
    projectMap[p.id] = p.name;
  });

  return data.map(d => ({
    projectId: d.projectId,
    projectName: projectMap[d.projectId] || 'Sin proyecto',
    revenueCLP: d._sum.amountClp || 0,
    revenueUSD: Math.round((d._sum.amountClp || 0) / 900),
    transactions: d._count.id
  }));
}

async function getRevenueBySource(startDate, endDate) {
  // Agrupar por fuente: B2B vs B2C
  const b2bStats = await prisma.certificate.aggregate({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      companyId: { not: null }
    },
    _sum: { amountClp: true },
    _count: { id: true }
  });

  // B2C
  const b2cStats = await prisma.certificate.aggregate({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      b2cUserId: { not: null }
    },
    _sum: { amountClp: true },
    _count: { id: true }
  });

  return [
    {
      source: 'B2B',
      revenueCLP: b2bStats._sum.amountClp || 0,
      revenueUSD: Math.round((b2bStats._sum.amountClp || 0) / 900),
      transactions: b2bStats._count.id || 0
    },
    {
      source: 'B2C',
      revenueCLP: b2cStats._sum.amountClp || 0,
      revenueUSD: Math.round((b2cStats._sum.amountClp || 0) / 900),
      transactions: b2cStats._count.id || 0
    }
  ];
}

async function calculateFinancialTotals(startDate, endDate) {
  try {
    const stats = await prisma.certificate.aggregate({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      _sum: { amountClp: true },
      _count: { id: true }
    });

    return {
      totalRevenueCLP: stats._sum.amountClp || 0,
      totalRevenueUSD: Math.round((stats._sum.amountClp || 0) / 900),
      totalTransactions: stats._count.id || 0,
      averageTransactionCLP: stats._count.id > 0 
        ? Math.round((stats._sum.amountClp || 0) / stats._count.id)
        : 0
    };
  } catch (error) {
    return {
      totalRevenueCLP: 0,
      totalRevenueUSD: 0,
      totalTransactions: 0,
      averageTransactionCLP: 0
    };
  }
}

// ============================================
// FUNCIONES AUXILIARES - EXPORTACIÓN
// ============================================

async function getExportEmissionsData(startDate, endDate) {
  const certificates = await prisma.certificate.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    include: {
      company: {
        select: { nombreComercial: true, razonSocial: true, rut: true }
      },
      project: {
        select: { name: true, code: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const columns = [
    'Fecha', 'N° Certificado', 'Empresa', 'RUT', 'Proyecto',
    'Emisiones (kg)', 'Emisiones (ton)', 'Monto (CLP)'
  ];

  const rows = certificates.map(c => ({
    Fecha: c.createdAt.toISOString().split('T')[0],
    'N° Certificado': c.certificateNumber,
    Empresa: c.company?.nombreComercial || c.company?.razonSocial || '',
    RUT: c.company?.rut || '',
    Proyecto: c.project?.name || '',
    'Emisiones (kg)': c.emissionsKg || 0,
    'Emisiones (ton)': ((c.emissionsKg || 0) / 1000).toFixed(3),
    'Monto (CLP)': c.amountClp || 0
  }));

  return { columns, rows };
}

async function getExportFinancialData(startDate, endDate) {
  const certificates = await prisma.certificate.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    include: {
      company: {
        select: { nombreComercial: true, razonSocial: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const columns = [
    'Fecha', 'N° Certificado', 'Empresa', 'Monto (CLP)', 'Monto (USD)', 'Emisiones (kg)'
  ];

  const rows = certificates.map(c => ({
    Fecha: c.createdAt.toISOString().split('T')[0],
    'N° Certificado': c.certificateNumber,
    Empresa: c.company?.nombreComercial || c.company?.razonSocial || '',
    'Monto (CLP)': c.amountClp || 0,
    'Monto (USD)': Math.round((c.amountClp || 0) / 900),
    'Emisiones (kg)': c.emissionsKg || 0
  }));

  return { columns, rows };
}

async function getExportCompaniesData(startDate, endDate) {
  const companies = await prisma.company.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    include: {
      _count: {
        select: { certificates: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const columns = [
    'Fecha Registro', 'Razón Social', 'Nombre Comercial', 'RUT',
    'Industria', 'Tamaño', 'Estado', 'Certificados'
  ];

  const rows = companies.map(c => ({
    'Fecha Registro': c.createdAt.toISOString().split('T')[0],
    'Razón Social': c.razonSocial,
    'Nombre Comercial': c.nombreComercial || '',
    RUT: c.rut,
    Industria: c.industria || '',
    Tamaño: c.tamanoEmpresa || '',
    Estado: c.status,
    Certificados: c._count.certificates
  }));

  return { columns, rows };
}

async function getExportB2CData(startDate, endDate) {
  const users = await prisma.b2cUser.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    orderBy: { createdAt: 'desc' }
  });

  const columns = [
    'Fecha Registro', 'Nombre', 'Email', 'Proveedor Auth', 'Último Login'
  ];

  const rows = users.map(u => ({
    'Fecha Registro': u.createdAt.toISOString().split('T')[0],
    Nombre: u.nombre || '',
    Email: u.email,
    'Proveedor Auth': u.provider || 'email',
    'Último Login': u.lastLoginAt ? u.lastLoginAt.toISOString().split('T')[0] : ''
  }));

  return { columns, rows };
}

async function getExportProjectsData() {
  const projects = await prisma.esgProject.findMany({
    where: {
      status: { not: 'archived' }
    },
    include: {
      _count: {
        select: { certificateProjects: true }
      },
      pricingVersions: {
        where: { status: 'active' },
        take: 1
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const columns = [
    'Código', 'Nombre', 'Tipo', 'País', 'Estado',
    'Precio/Ton (USD)', 'Tons Disponibles', 'Certificados'
  ];

  const rows = projects.map(p => ({
    Código: p.code,
    Nombre: p.name,
    Tipo: p.projectType,
    País: p.country,
    Estado: p.status,
    'Precio/Ton (USD)': p.pricingVersions[0]?.finalPriceUsdPerTon || p.currentBasePriceUsdPerTon || 0,
    'Tons Disponibles': p.totalTonsAvailable || 0,
    Certificados: p._count.certificateProjects
  }));

  return { columns, rows };
}

function generateCSV(data, columns) {
  if (data.length === 0) return columns.join(',') + '\n';

  const header = columns.join(',');
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col];
      // Escapar comillas y envolver en comillas si contiene comas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });

  return header + '\n' + rows.join('\n');
}

function calculateDateFrom(period) {
  const now = new Date();
  switch (period) {
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    case '90d':
      return new Date(now.setDate(now.getDate() - 90));
    case '365d':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case 'ytd':
      return new Date(new Date().getFullYear(), 0, 1);
    default:
      return new Date(now.setDate(now.getDate() - 30));
  }
}

module.exports = {
  getEmissionsReport,
  getFinancialReport,
  getCompaniesReport,
  getB2CReport,
  exportReport
};

/**
 * Admin B2C Users Controller
 * Gestión y visualización de usuarios B2C para SuperAdmin
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/admin/b2c/users
 * Lista paginada de usuarios B2C con filtros
 */
const listUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      hasCompensations,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      dateFrom,
      dateTo
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construir filtros
    const where = {};

    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // status no existe en B2cUser schema, ignoramos por ahora o asumimos activo
    // if (status) { where.status = status; }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Ejecutar consultas en paralelo
    const [users, total] = await Promise.all([
      prisma.b2cUser.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          nombre: true,
          // apellido: true, // No existe en schema
          // telefono: true, // No existe en schema
          // pais: true, // No existe en schema
          // status: true, // No existe en schema
          // emailVerified: true, // No existe en schema
          provider: true, // authProvider -> provider
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true
        }
      }),
      prisma.b2cUser.count({ where })
    ]);

    // Agregar estadísticas de compensación a cada usuario
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const stats = await getUserCompensationStats(user.id);
        return {
          ...user,
          stats
        };
      })
    );

    res.json({
      success: true,
      data: {
        users: usersWithStats,
        pagination: {
          page: parseInt(page),
          limit: take,
          total,
          totalPages: Math.ceil(total / take)
        }
      }
    });
  } catch (error) {
    console.error('Error en listUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar usuarios B2C'
    });
  }
};

/**
 * GET /api/admin/b2c/users/:id
 * Detalle completo de un usuario B2C
 */
const getUserDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.b2cUser.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        avatarUrl: true,
        provider: true,
        preferredCurrency: true,
        preferredLanguage: true,
        newsletterOptIn: true,
        totalEmissionsKg: true,
        totalCompensatedKg: true,
        totalFlights: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener estadísticas de compensación
    const compensationStats = await getUserCompensationStats(user.id);

    // Obtener historial de cálculos/compensaciones
    const compensationHistory = await getUserCompensationHistory(user.id);

    // Obtener certificados
    const certificates = await getUserCertificates(user.id);

    // Obtener actividad reciente
    const recentActivity = await getUserRecentActivity(user.id);

    res.json({
      success: true,
      data: {
        user,
        stats: compensationStats,
        compensationHistory,
        certificates,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Error en getUserDetail:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle del usuario'
    });
  }
};

/**
 * GET /api/admin/b2c/users/:id/activity
 * Historial de actividad del usuario
 */
const getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Verificar que el usuario existe
    const userExists = await prisma.b2cUser.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Obtener actividades del usuario
    const activities = await getFullActivityHistory(id, skip, take);

    res.json({
      success: true,
      data: {
        activities: activities.items,
        pagination: {
          page: parseInt(page),
          limit: take,
          total: activities.total,
          totalPages: Math.ceil(activities.total / take)
        }
      }
    });
  } catch (error) {
    console.error('Error en getUserActivity:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener actividad del usuario'
    });
  }
};

/**
 * GET /api/admin/b2c/stats
 * Estadísticas globales de B2C
 */
const getB2CStats = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    const dateFrom = calculateDateFrom(period);

    const [
      totalUsers,
      newUsers,
      activeUsers,
      authProviderStats
      // countryStats // pais no existe en schema
    ] = await Promise.all([
      prisma.b2cUser.count(),
      prisma.b2cUser.count({
        where: { createdAt: { gte: dateFrom } }
      }),
      prisma.b2cUser.count({
        where: { lastLoginAt: { gte: dateFrom } }
      }),
      prisma.b2cUser.groupBy({
        by: ['provider'],
        _count: { id: true }
      })
    ]);

    // Calcular tasa de retención
    const retentionRate = totalUsers > 0 
      ? ((activeUsers / totalUsers) * 100).toFixed(2)
      : 0;

    // Formatear estadísticas de proveedores de auth
    const byAuthProvider = {};
    authProviderStats.forEach(stat => {
      byAuthProvider[stat.provider || 'email'] = stat._count.id;
    });

    // Obtener métricas de compensación
    const compensationMetrics = await getGlobalCompensationMetrics(dateFrom);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          newUsers,
          activeUsers,
          retentionRate: parseFloat(retentionRate)
        },
        byAuthProvider,
        byCountry: [], // No disponible en schema actual
        compensations: compensationMetrics,
        period
      }
    });
  } catch (error) {
    console.error('Error en getB2CStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas B2C'
    });
  }
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function getUserCompensationStats(userId) {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_calculations,
        COALESCE(SUM(CASE WHEN "is_compensated" = true THEN 1 ELSE 0 END), 0) as compensated_count,
        COALESCE(SUM("emissions_kg"), 0) as total_emissions,
        COALESCE(SUM(CASE WHEN "is_compensated" = true THEN "emissions_kg" ELSE 0 END), 0) as compensated_emissions
      FROM "b2c_calculations"
      WHERE "user_id" = ${userId}::uuid
    `;

    if (stats[0]) {
      return {
        totalCalculations: Number(stats[0].total_calculations) || 0,
        compensatedCount: Number(stats[0].compensated_count) || 0,
        totalEmissionsKg: Number(stats[0].total_emissions) || 0,
        compensatedEmissionsKg: Number(stats[0].compensated_emissions) || 0,
        totalSpentCLP: 0 // No disponible en tabla
      };
    }

    return {
      totalCalculations: 0,
      compensatedCount: 0,
      totalEmissionsKg: 0,
      compensatedEmissionsKg: 0,
      totalSpentCLP: 0
    };
  } catch (error) {
    console.error('Error getUserCompensationStats', error);
    return {
      totalCalculations: 0,
      compensatedCount: 0,
      totalEmissionsKg: 0,
      compensatedEmissionsKg: 0,
      totalSpentCLP: 0
    };
  }
}

async function getUserCompensationHistory(userId, limit = 10) {
  try {
    const calculations = await prisma.$queryRaw`
      SELECT 
        id, "origin_airport" as origin, "destination_airport" as destination, "emissions_kg" as "emissionsKg",
        "is_compensated" as "isCompensated", "compensated_at" as "compensatedAt", "created_at" as "createdAt"
      FROM "b2c_calculations"
      WHERE "user_id" = ${userId}::uuid
      ORDER BY "created_at" DESC
      LIMIT ${limit}
    `;

    return calculations.map(calc => ({
      id: calc.id,
      type: 'flight', // Default type since we only have flights for now
      origin: calc.origin,
      destination: calc.destination,
      emissionsKg: Number(calc.emissionsKg),
      amountCLP: 0,
      isCompensated: calc.isCompensated,
      compensatedAt: calc.compensatedAt,
      createdAt: calc.createdAt
    }));
  } catch (error) {
    console.error('Error getUserCompensationHistory', error);
    return [];
  }
}

async function getUserCertificates(userId, limit = 10) {
  try {
    const certificates = await prisma.$queryRaw`
      SELECT 
        id, number, "tons_compensated", "total_amount_clp",
        status, "pdf_url", "created_at"
      FROM "certificates"
      WHERE "b2c_user_id" = ${userId}::uuid
      ORDER BY "created_at" DESC
      LIMIT ${limit}
    `;

    return certificates.map(cert => ({
      id: cert.id,
      certificateNumber: cert.number,
      emissionsKg: Number(cert.tons_compensated) * 1000,
      amountCLP: Number(cert.total_amount_clp),
      status: cert.status,
      pdfUrl: cert.pdf_url,
      createdAt: cert.created_at
    }));
  } catch (error) {
    console.error('Error getUserCertificates', error);
    return [];
  }
}

async function getUserRecentActivity(userId, limit = 10) {
  const activities = [];

  try {
    // Obtener cálculos recientes
    const calculations = await prisma.$queryRaw`
      SELECT id, "emissions_kg", "is_compensated", "created_at"
      FROM "b2c_calculations"
      WHERE "user_id" = ${userId}::uuid
      ORDER BY "created_at" DESC
      LIMIT 5
    `;

    calculations.forEach(calc => {
      activities.push({
        type: calc.is_compensated ? 'compensation' : 'calculation',
        description: calc.is_compensated 
          ? `Compensó ${Number(calc.emissions_kg).toFixed(1)} kg CO₂`
          : `Calculó ${Number(calc.emissions_kg).toFixed(1)} kg CO₂`,
        timestamp: calc.created_at,
        entityId: calc.id,
        entityType: 'B2CCalculation'
      });
    });

  } catch (error) {
    // Continuar sin actividades de cálculo
  }

  // Ordenar por fecha
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return activities.slice(0, limit);
}

async function getFullActivityHistory(userId, skip, take) {
  // Por ahora retornar lista vacía si no hay tabla de actividades
  return {
    items: [],
    total: 0
  };
}

async function getGlobalCompensationMetrics(dateFrom) {
  try {
    const metrics = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_calculations,
        COALESCE(SUM(CASE WHEN "is_compensated" = true THEN 1 ELSE 0 END), 0) as compensations,
        COALESCE(SUM("emissions_kg"), 0) as total_emissions,
        COALESCE(SUM(CASE WHEN "is_compensated" = true THEN "emissions_kg" ELSE 0 END), 0) as compensated_emissions
      FROM "b2c_calculations"
      WHERE "created_at" >= ${dateFrom}
    `;

    if (metrics[0]) {
      const totalCalcs = Number(metrics[0].total_calculations) || 0;
      const compensations = Number(metrics[0].compensations) || 0;
      
      return {
        totalCalculations: totalCalcs,
        totalCompensations: compensations,
        conversionRate: totalCalcs > 0 
          ? ((compensations / totalCalcs) * 100).toFixed(2)
          : 0,
        totalEmissionsKg: Number(metrics[0].total_emissions) || 0,
        compensatedEmissionsKg: Number(metrics[0].compensated_emissions) || 0,
        totalRevenueCLP: 0
      };
    }

    return {
      totalCalculations: 0,
      totalCompensations: 0,
      conversionRate: 0,
      totalEmissionsKg: 0,
      compensatedEmissionsKg: 0,
      totalRevenueCLP: 0
    };
  } catch (error) {
    console.error('Error getGlobalCompensationMetrics', error);
    return {
      totalCalculations: 0,
      totalCompensations: 0,
      conversionRate: 0,
      totalEmissionsKg: 0,
      compensatedEmissionsKg: 0,
      totalRevenueCLP: 0
    };
  }
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
    default:
      return new Date(now.setDate(now.getDate() - 30));
  }
}

module.exports = {
  listUsers,
  getUserDetail,
  getUserActivity,
  getB2CStats
};

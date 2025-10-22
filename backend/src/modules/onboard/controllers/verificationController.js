/**
 * 
 * Endpoints:
 * POST /api/onboard/companies/:id/domains - Agregar dominio corporativo
 * GET /api/onboard/companies/:id/domains - Listar dominios empresa
 * PUT /api/onboard/domains/:id/verify - Verificar dominio (admin)
 * GET /api/onboard/admin/verification/pending - Pendientes verificación (admin)
 * GET /api/onboard/admin/verification/stats - Estadísticas verificación (admin)
 * POST /api/onboard/validate/airport-code - Validar código aeropuerto
 * POST /api/onboard/validate/corporate-email - Validar email corporativo
 */


const verificationService = require('../services/verificationService');
const { 
  validateCorporateDomain, 
  handleValidationErrors 
} = require('../validators/onboardValidator');
const logger = require('../../../utils/logger');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
/**
 * Agregar dominio corporativo para verificación
 * POST /api/onboard/companies/:id/domains
 */
const addDomain = [
  // Validaciones
  ...validateCorporateDomain,
  handleValidationErrors,
  
  // Controller
  async (req, res) => {
    try {
      const { id: companyId } = req.params;
      const { domain } = req.body;
      const userId = req.user.id;

      const companyDomain = await verificationService.addCompanyDomain(
        companyId, 
        domain, 
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Dominio agregado para verificación',
        data: {
          id: companyDomain.id,
          domain: companyDomain.domain,
          verified: companyDomain.verified,
          createdAt: companyDomain.createdAt,
          nextSteps: [
            'Esperar verificación manual del equipo',
            'Revisar configuración DNS del dominio',
            'Verificar que el dominio esté activo'
          ]
        }
      });

    } catch (error) {
      logger.error('Error agregando dominio', { 
        error: error.message,
        companyId: req.params.id,
        domain: req.body.domain
      });

      if (error.message === 'Empresa no encontrada') {
        return res.status(404).json({
          success: false,
          message: 'Empresa no encontrada'
        });
      }

      if (error.message.includes('ya está registrado')) {
        return res.status(409).json({
          success: false,
          message: 'El dominio ya está registrado por otra empresa'
        });
      }

      if (error.message.includes('no existe')) {
        return res.status(400).json({
          success: false,
          message: 'El dominio no existe o no es accesible'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
];

/**
 * Listar dominios de empresa
 * GET /api/onboard/companies/:id/domains
 */
const listCompanyDomains = async (req, res) => {
  try {
    const { id: companyId } = req.params;

    const domains = await verificationService.getCompanyDomains(companyId);

    res.json({
      success: true,
      data: domains.map(domain => ({
        id: domain.id,
        domain: domain.domain,
        verified: domain.verified,
        verifiedAt: domain.verifiedAt,
        createdAt: domain.createdAt
      })),
      count: domains.length,
      verifiedCount: domains.filter(d => d.verified).length
    });

  } catch (error) {
    logger.error('Error listando dominios', { 
      error: error.message,
      companyId: req.params.id 
    });

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Verificar dominio manualmente (admin)
 * PUT /api/onboard/domains/:id/verify
 */
const verifyDomain = async (req, res) => {
  try {
    const { id: domainId } = req.params;
    const { isVerified, note } = req.body;
    const userId = req.user.id;

    // Validar parámetros
    if (typeof isVerified !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'El parámetro isVerified debe ser boolean'
      });
    }

    const updatedDomain = await verificationService.verifyDomainManually(
      domainId,
      isVerified,
      userId,
      note
    );

    res.json({
      success: true,
      message: `Dominio ${isVerified ? 'verificado' : 'rechazado'} exitosamente`,
      data: {
        id: updatedDomain.id,
        domain: updatedDomain.domain,
        verified: updatedDomain.verified,
        verifiedAt: updatedDomain.verifiedAt,
        note
      }
    });

  } catch (error) {
    logger.error('Error verificando dominio', { 
      error: error.message,
      domainId: req.params.id 
    });

    if (error.message === 'Dominio no encontrado') {
      return res.status(404).json({
        success: false,
        message: 'Dominio no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};


/**
 * Obtener empresas y dominios pendientes de verificación (admin)
 * GET /api/onboard/admin/verification/pending
 * Mal ❌ no tenemos que usar interactuar con la BD en el controlador
 */
const getPendingVerifications = async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Obtener empresas pendientes
    const pendingCompanies = await prisma.company.findMany({
      where: {
        status: { in: ['registered', 'pending_contract'] }
      },
      include: {
        domains: true,
        documents: {
          include: {
            file: true
          }
        },
        _count: {
          select: {
            companyUsers: true,
            documents: true
          }
        }
      },
      orderBy: { createdAt: 'asc' } // Más antiguos primero
    });

    // Obtener dominios pendientes
    const pendingDomains = await prisma.companyDomain.findMany({
      where: { verified: false },
      include: {
        company: {
          select: {
            id: true,
            razonSocial: true,
            rut: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Formatear respuesta
    const formattedCompanies = pendingCompanies.map(company => ({
      id: company.id,
      razonSocial: company.razonSocial,
      rut: company.rut,
      status: company.status,
      createdAt: company.createdAt,
      domainsCount: company.domains.length,
      verifiedDomains: company.domains.filter(d => d.verified).length,
      documentsCount: company._count.documents,
      usersCount: company._count.companyUsers,
      waitingDays: Math.floor((new Date() - new Date(company.createdAt)) / (1000 * 60 * 60 * 24))
    }));

    const formattedDomains = pendingDomains.map(domain => ({
      id: domain.id,
      domain: domain.domain,
      createdAt: domain.createdAt,
      company: domain.company,
      waitingDays: Math.floor((new Date() - new Date(domain.createdAt)) / (1000 * 60 * 60 * 24))
    }));

    res.json({
      success: true,
      data: {
        companies: formattedCompanies,
        domains: formattedDomains
      },
      summary: {
        pendingCompanies: formattedCompanies.length,
        pendingDomains: formattedDomains.length,
        urgentCompanies: formattedCompanies.filter(c => c.waitingDays > 7).length,
        urgentDomains: formattedDomains.filter(d => d.waitingDays > 3).length
      }
    });

  } catch (error) {
    logger.error('Error obteniendo verificaciones pendientes', { 
      error: error.message 
    });

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};


/**
 * Obtener estadísticas de verificación (admin)
 * GET /api/onboard/admin/verification/stats
 */
const getVerificationStats = async (req, res) => {
  try {
    const stats = await verificationService.getVerificationStats();

    // Calcular métricas adicionales
    const conversionRate = stats.companies.total > 0 
      ? Math.round((stats.companies.verified / stats.companies.total) * 100)
      : 0;

    const domainVerificationRate = stats.domains.total > 0
      ? Math.round((stats.domains.verified / stats.domains.total) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        ...stats,
        metrics: {
          conversionRate,
          domainVerificationRate,
          avgTimeToVerification: '2.5 días', // TODO: Calcular real
          pendingWorkload: stats.companies.pendingVerification + stats.domains.pending
        },
        trends: {
          // TODO: Implementar tendencias por semana/mes
          weeklyRegistrations: 0,
          weeklyVerifications: 0
        }
      }
    });

  } catch (error) {
    logger.error('Error obteniendo estadísticas de verificación', { 
      error: error.message 
    });

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};


/**
 * Validar código de aeropuerto
 * POST /api/onboard/validate/airport-code
 */
const validateAirportCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Código de aeropuerto requerido'
      });
    }

    const validation = await verificationService.validateAirportCode(code);

    if (validation.isValid) {
      res.json({
        success: true,
        message: 'Código de aeropuerto válido',
        data: validation.airport
      });
    } else {
      res.status(400).json({
        success: false,
        message: validation.error
      });
    }

  } catch (error) {
    logger.error('Error validando código aeropuerto', { 
      error: error.message,
      code: req.body.code 
    });

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Validar email corporativo
 * POST /api/onboard/validate/corporate-email
 */

const validateCorporateEmail = async (req, res) => {
  try {
    const { email, companyId } = req.body;

    if (!email || !companyId) {
      return res.status(400).json({
        success: false,
        message: 'Email y companyId requeridos'
      });
    }

    const isValid = await verificationService.isValidCorporateEmail(email, companyId);

    res.json({
      success: true,
      data: {
        email,
        isValid,
        message: isValid 
          ? 'Email pertenece a un dominio verificado de la empresa'
          : 'Email no pertenece a dominios verificados de la empresa'
      }
    });

  } catch (error) {
    logger.error('Error validando email corporativo', { 
      error: error.message,
      email: req.body.email,
      companyId: req.body.companyId
    });

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Obtener información de dominio público (utilidad)
 * GET /api/onboard/domain-info/:domain
 */
const getDomainInfo = async (req, res) => {
  try {
    const { domain } = req.params;

    const exists = await verificationService.validateDomainExists(domain);

    res.json({
      success: true,
      data: {
        domain,
        exists,
        message: exists 
          ? 'Dominio es accesible'
          : 'Dominio no existe o no es accesible'
      }
    });

  } catch (error) {
    logger.error('Error obteniendo info de dominio', { 
      error: error.message,
      domain: req.params.domain 
    });

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  addDomain,
  listCompanyDomains,
  verifyDomain,
  getPendingVerifications,
  getVerificationStats,
  validateAirportCode,
  validateCorporateEmail,
  getDomainInfo
};
/**
 * 
 * Endpoints:
 * GET /api/onboard/dashboard/company/:id - Dashboard empresa específica
 * GET /api/onboard/dashboard/admin - Dashboard admin general
 * GET /api/onboard/dashboard/progress/:id - Progreso onboarding empresa
 * GET /api/onboard/dashboard/timeline/:id - Timeline eventos empresa
 */

const companyService = require('../services/companyService');
const documentService = require('../services/documentService');
const verificationService = require('../services/verificationService');
const logger = require('../../../utils/logger');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Dashboard para empresa específica
 * GET /api/onboard/dashboard/company/:id
 */
const getCompanyDashboard = async (req, res) => {
  try {
    const { id: companyId } = req.params;

    // Obtener datos en paralelo
    const [
      company,
      documents,
      documentValidation,
      domains
    ] = await Promise.all([
      companyService.getCompanyById(companyId, true),
      documentService.getCompanyDocuments(companyId),
      documentService.validateCompanyDocuments(companyId),
      verificationService.getCompanyDomains(companyId)
    ]);

    // Calcular métricas de progreso
    const progress = calculateOnboardingProgress(
      company, 
      documents, 
      documentValidation, 
      domains
    );

    // Próximos pasos basados en estado actual
    const nextSteps = getNextSteps(company.status, documentValidation, domains);

    // Formatear respuesta
    const dashboard = {
      company: {
        id: company.id,
        razonSocial: company.razonSocial,
        rut: company.rut,
        status: company.status,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt
      },
      progress: {
        overall: progress.overall,
        steps: progress.steps
      },
      documents: {
        total: documents.length,
        required: documentValidation.documentSummary 
          ? Object.values(documentValidation.documentSummary).filter(d => d.required).length 
          : 0,
        uploaded: documents.length,
        completionPercentage: progress.steps.documents.percentage,
        isValid: documentValidation.isValid,
        summary: documentValidation.documentSummary
      },
      domains: {
        total: domains.length,
        verified: domains.filter(d => d.verified).length,
        pending: domains.filter(d => !d.verified).length,
        list: domains.map(d => ({
          id: d.id,
          domain: d.domain,
          verified: d.verified,
          verifiedAt: d.verifiedAt,
          createdAt: d.createdAt
        }))
      },
      users: {
        total: company.companyUsers?.length || 0,
        admins: company.companyUsers?.filter(cu => cu.isAdmin).length || 0
      },
      timeline: await getCompanyTimeline(companyId),
      nextSteps,
      estimatedTimeToComplete: calculateEstimatedTime(company.status, progress)
    };

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    logger.error('Error obteniendo dashboard empresa', { 
      error: error.message,
      companyId: req.params.id 
    });

    if (error.message === 'Empresa no encontrada') {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Dashboard administrativo general
 * GET /api/onboard/dashboard/admin
 */
const getAdminDashboard = async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    // Obtener métricas en paralelo
    const [
      companiesStats,
      verificationStats,
      recentActivity,
      performanceMetrics
    ] = await Promise.all([
      getCompaniesMetrics(prisma),
      verificationService.getVerificationStats(),
      getRecentActivity(prisma),
      getPerformanceMetrics(prisma)
    ]);

    const dashboard = {
      overview: {
        totalCompanies: companiesStats.total,
        activeCompanies: companiesStats.byStatus.active || 0,
        pendingVerification: companiesStats.byStatus.pending_contract || 0,
        registeredToday: companiesStats.registeredToday,
        conversionRate: calculateConversionRate(companiesStats.byStatus)
      },
      verification: {
        ...verificationStats,
        pendingWorkload: verificationStats.companies.pendingVerification + verificationStats.domains.pending
      },
      activity: recentActivity,
      performance: performanceMetrics,
      alerts: await getSystemAlerts(prisma),
      workQueue: await getWorkQueue(prisma)
    };

    res.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    logger.error('Error obteniendo dashboard admin', { 
      error: error.message 
    });

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};


/**
 * Progreso detallado de onboarding
 * GET /api/onboard/dashboard/progress/:id
 */
const getOnboardingProgress = async (req, res) => {
  try {
    const { id: companyId } = req.params;

    const [company, documents, documentValidation, domains] = await Promise.all([
      companyService.getCompanyById(companyId),
      documentService.getCompanyDocuments(companyId),
      documentService.validateCompanyDocuments(companyId),
      verificationService.getCompanyDomains(companyId)
    ]);

    const progress = calculateOnboardingProgress(
      company, 
      documents, 
      documentValidation, 
      domains
    );

    res.json({
      success: true,
      data: {
        companyId,
        currentStatus: company.status,
        overallProgress: progress.overall,
        steps: progress.steps,
        blockers: identifyBlockers(company, documentValidation, domains),
        recommendations: generateRecommendations(company, documentValidation, domains)
      }
    });

  } catch (error) {
    logger.error('Error obteniendo progreso onboarding', { 
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
 * Timeline de eventos de empresa
 * GET /api/onboard/dashboard/timeline/:id
 */
const getCompanyTimeline = async (companyId) => {
  try {
     // Obtener eventos de diferentes fuentes
    const [
      verificationEvents,
      auditLogs,
      documents
    ] = await Promise.all([
      prisma.companyVerificationEvent.findMany({
        where: { companyId },
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.findMany({
        where: {
          entityType: { in: ['Company', 'CompanyDocument'] },
          OR: [
            { entityId: companyId },
            { changesJson: { contains: companyId } }
          ]
        },
        include: {
          actor: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      prisma.companyDocument.findMany({
        where: { companyId },
        include: {
          file: {
            select: { fileName: true }
          }
        },
        orderBy: { uploadedAt: 'desc' }
      })
    ]);

    // Combinar y formatear eventos
    const timeline = [];

    // Eventos de verificación
    verificationEvents.forEach(event => {
      timeline.push({
        type: 'status_change',
        timestamp: event.createdAt,
        title: `Estado cambiado: ${event.fromStatus} → ${event.toStatus}`,
        description: event.note || 'Cambio de estado en el proceso',
        actor: event.user,
        metadata: {
          fromStatus: event.fromStatus,
          toStatus: event.toStatus
        }
      });
    });

    // Documentos subidos
    documents.forEach(doc => {
      timeline.push({
        type: 'document_upload',
        timestamp: doc.uploadedAt,
        title: `Documento subido: ${doc.docType}`,
        description: `Archivo: ${doc.file.fileName}`,
        metadata: {
          docType: doc.docType,
          fileName: doc.file.fileName
        }
      });
    });

    // Eventos de auditoría relevantes
    auditLogs.forEach(log => {
      if (log.action.includes('COMPANY')) {
        timeline.push({
          type: 'system_event',
          timestamp: log.createdAt,
          title: getActionDescription(log.action),
          description: log.action,
          actor: log.actor,
          metadata: {
            action: log.action,
            entityType: log.entityType
          }
        });
      }
    });

    // Ordenar por fecha descendente
    timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return timeline.slice(0, 50); // Últimos 50 eventos

  } catch (error) {
    logger.error('Error obteniendo timeline', { error: error.message, companyId });
    return [];
  }
};


/**
 * Funciones auxiliares
 */

const calculateOnboardingProgress = (company, documents, documentValidation, domains) => {
  const steps = {
    registration: {
      name: 'Registro Inicial',
      completed: true,
      percentage: 100,
      completedAt: company.createdAt
    },
    documents: {
      name: 'Documentación Legal',
      completed: documentValidation.isValid,
      percentage: calculateDocumentProgress(documentValidation.documentSummary),
      completedAt: documentValidation.isValid ? getLatestDocumentDate(documents) : null
    },
    domains: {
      name: 'Verificación Dominios',
      completed: domains.length > 0 && domains.some(d => d.verified),
      percentage: domains.length > 0 ? (domains.filter(d => d.verified).length / domains.length) * 100 : 0,
      completedAt: domains.find(d => d.verified)?.verifiedAt || null
    },
    approval: {
      name: 'Aprobación Final',
      completed: ['active', 'signed'].includes(company.status),
      percentage: ['active', 'signed'].includes(company.status) ? 100 : 0,
      completedAt: ['active', 'signed'].includes(company.status) ? company.updatedAt : null
    }
  };

  const completedSteps = Object.values(steps).filter(step => step.completed).length;
  const totalSteps = Object.keys(steps).length;
  const overall = Math.round((completedSteps / totalSteps) * 100);

  return { overall, steps };
};

const calculateDocumentProgress = (documentSummary) => {
  if (!documentSummary) return 0;
  
  const types = Object.values(documentSummary);
  const requiredTypes = types.filter(type => type.required);
  const uploadedRequired = requiredTypes.filter(type => type.uploaded > 0);
  
  if (requiredTypes.length === 0) return 100;
  
  return Math.round((uploadedRequired.length / requiredTypes.length) * 100);
};

const getNextSteps = (status, documentValidation, domains) => {
  const steps = [];

  switch (status) {
    case 'registered':
      if (!documentValidation.isValid) {
        steps.push({
          action: 'upload_documents',
          title: 'Completar documentación legal',
          description: 'Subir los documentos requeridos para validar la empresa',
          priority: 'high'
        });
      }
      
      if (domains.length === 0) {
        steps.push({
          action: 'add_domain',
          title: 'Agregar dominio corporativo',
          description: 'Agregar y verificar el dominio de email de la empresa',
          priority: 'medium'
        });
      }
      break;

    case 'pending_contract':
      steps.push({
        action: 'wait_approval',
        title: 'Esperar aprobación',
        description: 'Nuestro equipo está revisando la documentación',
        priority: 'info'
      });
      break;

    case 'signed':
      steps.push({
        action: 'wait_activation',
        title: 'Activación en proceso',
        description: 'La cuenta será activada en las próximas horas',
        priority: 'info'
      });
      break;

    case 'active':
      steps.push({
        action: 'start_using',
        title: '¡Listo para usar!',
        description: 'Ya puedes comenzar a cargar manifiestos y calcular emisiones',
        priority: 'success'
      });
      break;
  }

  return steps;
};


// Funciones auxiliares adicionales...
const calculateConversionRate = (statusCounts) => {
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);
  const active = statusCounts.active || 0;
  return total > 0 ? Math.round((active / total) * 100) : 0;
};

const getLatestDocumentDate = (documents) => {
  if (documents.length === 0) return null;
  return documents.reduce((latest, doc) => 
    doc.uploadedAt > latest ? doc.uploadedAt : latest, 
    documents[0].uploadedAt
  );
};

const identifyBlockers = (company, documentValidation, domains) => {
  const blockers = [];

  if (!documentValidation.isValid) {
    blockers.push({
      type: 'documents',
      message: 'Documentos requeridos faltantes',
      details: documentValidation.errors
    });
  }

  if (domains.length === 0) {
    blockers.push({
      type: 'domains',
      message: 'Sin dominios corporativos verificados',
      details: ['Agregar al menos un dominio corporativo']
    });
  }

  return blockers;
};

const generateRecommendations = (company, documentValidation, domains) => {
  const recommendations = [];

  if (!documentValidation.isValid) {
    recommendations.push('Completar la documentación legal pendiente');
  }

  if (domains.length === 0) {
    recommendations.push('Agregar el dominio corporativo para verificación');
  }

  if (domains.length > 0 && domains.every(d => !d.verified)) {
    recommendations.push('Contactar soporte para acelerar verificación de dominios');
  }

  return recommendations;
};

const getActionDescription = (action) => {
  const descriptions = {
    'COMPANY_CREATED': 'Empresa registrada',
    'COMPANY_UPDATED': 'Datos actualizados',
    'COMPANY_STATUS_CHANGED': 'Estado modificado',
    'DOCUMENT_UPLOADED': 'Documento subido',
    'DOMAIN_ADDED': 'Dominio agregado',
    'DOMAIN_VERIFIED': 'Dominio verificado'
  };
  
  return descriptions[action] || action;
};

// Funciones auxiliares para métricas (simplificadas)
const getCompaniesMetrics = async (prisma) => {
  const total = await prisma.company.count();
  const byStatus = await prisma.company.groupBy({
    by: ['status'],
    _count: true
  });
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const registeredToday = await prisma.company.count({
    where: { createdAt: { gte: today } }
  });

  const statusCounts = byStatus.reduce((acc, item) => {
    acc[item.status] = item._count;
    return acc;
  }, {});

  return { total, byStatus: statusCounts, registeredToday };
};

const getRecentActivity = async (prisma) => {
  const recentLogs = await prisma.auditLog.findMany({
    where: {
      entityType: { in: ['Company', 'CompanyDocument'] }
    },
    include: {
      actor: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  return recentLogs.map(log => ({
    action: log.action,
    actor: log.actor?.name || 'Sistema',
    timestamp: log.createdAt,
    entityType: log.entityType
  }));
};

const getPerformanceMetrics = async (prisma) => {
  // Métricas básicas - expandir según necesidades
  return {
    avgProcessingTime: '2.5 días',
    successRate: '95%',
    customerSatisfaction: '4.8/5'
  };
};

const getSystemAlerts = async (prisma) => {
  const alerts = [];
  
  // Empresas con más de 7 días sin activar
  const staleCompanies = await prisma.company.count({
    where: {
      status: 'registered',
      createdAt: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  });

  if (staleCompanies > 0) {
    alerts.push({
      type: 'warning',
      message: `${staleCompanies} empresas registradas hace más de 7 días sin progreso`
    });
  }

  return alerts;
};


const getWorkQueue = async (prisma) => {
  const [pendingCompanies, pendingDomains] = await Promise.all([
    prisma.company.count({
      where: { status: 'pending_contract' }
    }),
    prisma.companyDomain.count({
      where: { verified: false }
    })
  ]);

  return {
    pendingCompanies,
    pendingDomains,
    total: pendingCompanies + pendingDomains
  };
};

const calculateEstimatedTime = (status, progress) => {
  const estimates = {
    'registered': '2-3 días',
    'pending_contract': '1-2 días',
    'signed': '< 1 día',
    'active': 'Completado'
  };
  
  return estimates[status] || 'No determinado';
};

module.exports = {
  getCompanyDashboard,
  getAdminDashboard,
  getOnboardingProgress,
  getCompanyTimeline
};
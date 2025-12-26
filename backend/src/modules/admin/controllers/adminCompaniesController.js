/**
 * Admin Companies Controller
 * Gestión completa de empresas B2B para SuperAdmin
 * Según ADMIN_B2B_EMPRESAS_SPEC.md
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../../../utils/logger');

// Transiciones de estado válidas
const VALID_TRANSITIONS = {
  'registered': ['pending_contract', 'suspended'],
  'pending_contract': ['signed', 'registered', 'suspended'],
  'signed': ['active', 'suspended'],
  'active': ['suspended'],
  'suspended': ['active']
};

/**
 * GET /api/admin/companies
 * Lista paginada de empresas B2B con filtros
 */
const listCompanies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      tamanoEmpresa,
      industria,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * Math.min(parseInt(limit), 100);
    const take = Math.min(parseInt(limit), 100);

    // Construir filtros
    const where = {};

    if (status) {
      where.status = status;
    }

    if (tamanoEmpresa) {
      where.tamanoEmpresa = tamanoEmpresa;
    }

    if (industria) {
      where.industria = industria;
    }

    if (search) {
      where.OR = [
        { razonSocial: { contains: search, mode: 'insensitive' } },
        { nombreComercial: { contains: search, mode: 'insensitive' } },
        { rut: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Ejecutar consultas en paralelo
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              companyUsers: true,
              certificates: true,
              flightRecords: true,
              documents: true
            }
          },
          settings: {
            select: {
              publicTagline: true
            }
          }
        }
      }),
      prisma.company.count({ where })
    ]);

    // Formatear respuesta según especificación
    const formattedCompanies = companies.map(company => ({
      id: company.id,
      razonSocial: company.razonSocial,
      rut: company.rut,
      nombreComercial: company.nombreComercial,
      giroSii: company.giroSii,
      tamanoEmpresa: company.tamanoEmpresa,
      status: company.status,
      publicProfileOptIn: company.publicProfileOptIn,
      slugPublico: company.slugPublico,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      _count: {
        companyUsers: company._count.companyUsers,
        certificates: company._count.certificates,
        flightRecords: company._count.flightRecords
      }
    }));

    res.json({
      success: true,
      data: formattedCompanies,
      pagination: {
        page: parseInt(page),
        limit: take,
        totalRecords: total,
        totalPages: Math.ceil(total / take)
      },
      filters: {
        status: status || null,
        search: search || null,
        tamanoEmpresa: tamanoEmpresa || null,
        industria: industria || null
      }
    });
  } catch (error) {
    logger.error('Error en listCompanies:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar empresas'
    });
  }
};

/**
 * GET /api/admin/companies/:id
 * Detalle completo de una empresa
 */
const getCompanyDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeUsers = 'true' } = req.query;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        settings: true,
        documents: {
          include: {
            file: {
              select: {
                fileName: true,
                mimeType: true,
                sizeBytes: true,
                storageUrl: true
              }
            }
          },
          orderBy: { uploadedAt: 'desc' }
        },
        domains: {
          orderBy: { createdAt: 'desc' }
        },
        companyUsers: includeUsers === 'true' ? {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                lastLoginAt: true,
                isActive: true
              }
            },
            roles: {
              include: {
                role: {
                  select: {
                    code: true,
                    name: true
                  }
                }
              }
            }
          }
        } : false,
        _count: {
          select: {
            certificates: true,
            flightRecords: true,
            payments: true
          }
        }
      }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    // Calcular métricas
    const metrics = await calculateCompanyMetrics(id);

    // Formatear respuesta según especificación
    const formattedCompany = {
      id: company.id,
      razonSocial: company.razonSocial,
      rut: company.rut,
      nombreComercial: company.nombreComercial,
      giroSii: company.giroSii,
      tamanoEmpresa: company.tamanoEmpresa,
      direccion: company.direccion,
      phone: company.phone,
      slugPublico: company.slugPublico,
      publicProfileOptIn: company.publicProfileOptIn,
      preferredCalculationMethod: company.preferredCalculationMethod,
      status: company.status,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      companyUsers: company.companyUsers ? company.companyUsers.map(cu => ({
        id: cu.id,
        isAdmin: cu.isAdmin,
        status: cu.status,
        user: cu.user,
        roles: cu.roles.map(r => ({
          code: r.role.code,
          name: r.role.name
        }))
      })) : [],
      documents: company.documents.map(doc => ({
        id: doc.id,
        docType: doc.docType,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
        file: doc.file
      })),
      domains: company.domains,
      settings: company.settings,
      metrics
    };

    res.json({
      success: true,
      data: formattedCompany
    });
  } catch (error) {
    logger.error('Error en getCompanyDetail:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle de empresa'
    });
  }
};

/**
 * PUT /api/admin/companies/:id/status
 * Cambiar estado de empresa con validación de transiciones
 */
const changeCompanyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { toStatus, note } = req.body;

    if (!toStatus) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere el nuevo estado (toStatus)'
      });
    }

    // Obtener empresa actual
    const company = await prisma.company.findUnique({
      where: { id },
      select: { id: true, status: true, nombreComercial: true, razonSocial: true }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    const currentStatus = company.status;

    // Validar transición permitida
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(toStatus)) {
      return res.status(400).json({
        success: false,
        message: `Transición no permitida de ${currentStatus} a ${toStatus}`,
        allowedTransitions
      });
    }

    // Ejecutar transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar estado de empresa
      const updatedCompany = await tx.company.update({
        where: { id },
        data: { status: toStatus }
      });

      // Registrar evento de verificación
      await tx.companyVerificationEvent.create({
        data: {
          companyId: id,
          fromStatus: currentStatus,
          toStatus,
          note: note || null,
          notedByUserId: req.user.id
        }
      });

      // Crear log de auditoría
      await tx.auditLog.create({
        data: {
          action: 'COMPANY_STATUS_CHANGE',
          entityType: 'Company',
          entityId: id,
          actorUserId: req.user.id,
          changesJson: JSON.stringify({
            fromStatus: currentStatus,
            toStatus,
            note
          })
        }
      });

      return updatedCompany;
    });

    logger.info(`Estado de empresa ${id} cambiado de ${currentStatus} a ${toStatus} por ${req.user.email}`);

    res.json({
      success: true,
      message: `Estado cambiado a ${toStatus}`,
      data: {
        company: {
          id: result.id,
          status: result.status,
          updatedAt: result.updatedAt
        },
        transition: {
          from: currentStatus,
          to: toStatus,
          note: note || null
        }
      }
    });
  } catch (error) {
    logger.error('Error en changeCompanyStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado de empresa'
    });
  }
};

/**
 * GET /api/admin/companies/:id/documents
 * Lista documentos de una empresa
 */
const getCompanyDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que existe la empresa
    const company = await prisma.company.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    const documents = await prisma.companyDocument.findMany({
      where: { companyId: id },
      include: {
        file: {
          select: {
            fileName: true,
            mimeType: true,
            sizeBytes: true,
            storageUrl: true
          }
        }
      },
      orderBy: { uploadedAt: 'desc' }
    });

    res.json({
      success: true,
      data: documents.map(doc => ({
        id: doc.id,
        type: doc.docType,
        fileName: doc.file.fileName,
        fileUrl: doc.file.storageUrl,
        fileSizeBytes: doc.file.sizeBytes,
        mimeType: doc.file.mimeType,
        status: doc.status,
        uploadedAt: doc.uploadedAt
      }))
    });
  } catch (error) {
    logger.error('Error en getCompanyDocuments:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener documentos'
    });
  }
};

/**
 * PUT /api/admin/companies/:id/documents/:docId/review
 * Revisar/aprobar documento
 */
const reviewDocument = async (req, res) => {
  try {
    const { id, documentId } = req.params;
    const { status, notes } = req.body;

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Usar: approved, rejected, pending'
      });
    }

    // Verificar que el documento pertenece a la empresa
    const document = await prisma.companyDocument.findFirst({
      where: {
        id: documentId,
        companyId: id
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }

    // Actualizar documento
    const updatedDoc = await prisma.companyDocument.update({
      where: { id: documentId },
      data: { status }
    });

    // Crear log de auditoría
    await prisma.auditLog.create({
      data: {
        action: 'DOCUMENT_REVIEW',
        entityType: 'CompanyDocument',
        entityId: documentId,
        actorUserId: req.user.id,
        changesJson: JSON.stringify({
          newStatus: status,
          notes,
          companyId: id
        })
      }
    });

    logger.info(`Documento ${documentId} revisado por ${req.user.email}: ${status}`);

    res.json({
      success: true,
      message: 'Documento revisado',
      data: {
        id: updatedDoc.id,
        status: updatedDoc.status,
        reviewedAt: new Date().toISOString(),
        reviewedBy: req.user.email
      }
    });
  } catch (error) {
    logger.error('Error en reviewDocument:', error);
    res.status(500).json({
      success: false,
      message: 'Error al revisar documento'
    });
  }
};

/**
 * GET /api/admin/companies/:id/timeline
 * Historial de cambios de estado de la empresa
 */
const getCompanyTimeline = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que existe la empresa
    const company = await prisma.company.findUnique({
      where: { id },
      select: { id: true, createdAt: true, status: true }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Empresa no encontrada'
      });
    }

    const events = await prisma.companyVerificationEvent.findMany({
      where: { companyId: id },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        companyId: id,
        currentStatus: company.status,
        createdAt: company.createdAt,
        events: events.map(e => ({
          id: e.id,
          fromStatus: e.fromStatus,
          toStatus: e.toStatus,
          note: e.note,
          createdAt: e.createdAt,
          changedBy: e.user
        }))
      }
    });
  } catch (error) {
    logger.error('Error en getCompanyTimeline:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener timeline'
    });
  }
};

/**
 * GET /api/admin/companies/stats
 * Estadísticas generales de empresas
 */
const getCompaniesStats = async (req, res) => {
  try {
    const [
      byStatus,
      bySize,
      byIndustry,
      recentCompanies
    ] = await Promise.all([
      prisma.company.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      prisma.company.groupBy({
        by: ['tamanoEmpresa'],
        _count: { id: true }
      }),
      prisma.company.groupBy({
        by: ['giroSii'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),
      prisma.company.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Convertir a objetos
    const statusMap = {};
    byStatus.forEach(s => {
      statusMap[s.status || 'unknown'] = s._count.id;
    });

    const sizeMap = {};
    bySize.forEach(s => {
      sizeMap[s.tamanoEmpresa || 'Sin especificar'] = s._count.id;
    });

    const total = Object.values(statusMap).reduce((a, b) => a + b, 0);

    res.json({
      success: true,
      data: {
        total,
        byStatus: statusMap,
        bySize: sizeMap,
        topIndustries: byIndustry.map(i => ({
          industry: i.giroSii || 'Sin especificar',
          count: i._count.id
        })),
        newLast30Days: recentCompanies
      }
    });
  } catch (error) {
    logger.error('Error en getCompaniesStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function calculateCompanyMetrics(companyId) {
  try {
    const [
      certificatesData,
      emissionsSummary,
      paymentsData
    ] = await Promise.all([
      prisma.certificate.aggregate({
        where: { companyId },
        _sum: { tonsCompensated: true, totalAmountClp: true },
        _count: { id: true }
      }),
      prisma.emissionSummary.aggregate({
        where: { companyId },
        _sum: { emissionsTco2: true, passengers: true, flightsCount: true }
      }),
      prisma.payment.aggregate({
        where: { companyId, status: 'completed' },
        _sum: { amount: true },
        _count: { id: true }
      })
    ]);

    return {
      totalEmissionsTons: emissionsSummary._sum.emissionsTco2 || 0,
      totalCertificates: certificatesData._count.id || 0,
      totalCompensatedTons: certificatesData._sum.tonsCompensated || 0,
      totalPaymentsCLP: paymentsData._sum.amount || 0,
      totalFlights: emissionsSummary._sum.flightsCount || 0,
      totalPassengers: emissionsSummary._sum.passengers || 0
    };
  } catch (error) {
    logger.error('Error en calculateCompanyMetrics:', error);
    return {
      totalEmissionsTons: 0,
      totalCertificates: 0,
      totalCompensatedTons: 0,
      totalPaymentsCLP: 0,
      totalFlights: 0,
      totalPassengers: 0
    };
  }
}

module.exports = {
  listCompanies,
  getCompanyDetail,
  changeCompanyStatus,
  getCompanyDocuments,
  reviewDocument,
  getCompanyTimeline,
  getCompaniesStats
};

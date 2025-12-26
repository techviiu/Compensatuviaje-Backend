/**
 * Admin Projects ESG Controller
 * CRUD completo para proyectos de compensación ESG
 * Según ADMIN_PROJECTS_SPEC.md
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const logger = require('../../../utils/logger');

/**
 * GET /api/admin/projects
 * Lista paginada de proyectos con filtros
 */
const listProjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      projectType,
      country,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * Math.min(parseInt(limit), 100);
    const take = Math.min(parseInt(limit), 100);

    // Construir filtros
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (projectType) {
      where.projectType = projectType;
    }

    if (country) {
      where.country = country;
    }

    // Ejecutar consultas con el modelo correcto: esgProject
    const [projects, total] = await Promise.all([
      prisma.esgProject.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              certificateProjects: true,
              evidence: true,
              pricingVersions: true
            }
          },
          pricingVersions: {
            where: { status: 'active' },
            orderBy: { effectiveFrom: 'desc' },
            take: 1
          },
          partners: {
            take: 1
          }
        }
      }),
      prisma.esgProject.count({ where })
    ]);

    // Formatear respuesta según especificación
    const formattedProjects = projects.map(project => {
      const activePricing = project.pricingVersions[0];
      return {
        id: project.id,
        code: project.code,
        name: project.name,
        description: project.description,
        projectType: project.projectType,
        country: project.country,
        region: project.region,
        status: project.status,
        providerOrganization: project.providerOrganization,
        certification: project.certification,
        currentPrice: activePricing ? {
          pricePerTonUsd: activePricing.finalPriceUsdPerTon,
          basePriceUsd: activePricing.basePriceUsdPerTon,
          marginPercent: activePricing.compensaMarginPercent
        } : {
          pricePerTonUsd: project.currentBasePriceUsdPerTon
        },
        transparencyUrl: project.transparencyUrl,
        coBenefits: project.coBenefits,
        certificatesCount: project._count.certificateProjects,
        evidencesCount: project._count.evidence,
        pricingVersionsCount: project._count.pricingVersions,
        partner: project.partners[0] || null,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
      };
    });

    // Obtener resumen de estadísticas
    const summary = await getProjectsSummary();

    res.json({
      success: true,
      data: formattedProjects,
      pagination: {
        page: parseInt(page),
        limit: take,
        totalRecords: total,
        totalPages: Math.ceil(total / take)
      },
      summary
    });
  } catch (error) {
    logger.error('Error en listProjects:', error);
    res.status(500).json({
      success: false,
      message: 'Error al listar proyectos'
    });
  }
};

/**
 * GET /api/admin/projects/:id
 * Detalle completo de un proyecto
 */
const getProjectDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.esgProject.findUnique({
      where: { id },
      include: {
        evidence: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        pricingVersions: {
          orderBy: { effectiveFrom: 'desc' },
          take: 10,
          include: {
            creator: {
              select: {
                id: true,
                email: true,
                name: true
              }
            }
          }
        },
        certificateProjects: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            certificate: {
              select: {
                id: true,
                number: true,
                tonsCompensated: true,
                totalAmountClp: true,
                status: true,
                issuedAt: true,
                company: {
                  select: {
                    id: true,
                    nombreComercial: true,
                    razonSocial: true
                  }
                },
                b2cUser: {
                  select: {
                    id: true,
                    email: true,
                    nombre: true
                  }
                }
              }
            }
          }
        },
        partners: true,
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
          }
        },
        metrics: {
          orderBy: { recordedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Calcular estadísticas del proyecto
    const stats = await calculateProjectStats(id);

    // Obtener precio activo
    const activePricing = project.pricingVersions.find(pv => pv.status === 'active');

    res.json({
      success: true,
      data: {
        id: project.id,
        name: project.name,
        code: project.code,
        description: project.description,
        projectType: project.projectType,
        status: project.status,
        country: project.country,
        region: project.region,
        providerOrganization: project.providerOrganization,
        certification: project.certification,
        currentBasePriceUsdPerTon: project.currentBasePriceUsdPerTon,
        transparencyUrl: project.transparencyUrl,
        coBenefits: project.coBenefits,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        
        currentPricing: activePricing ? {
          id: activePricing.id,
          version: activePricing.versionName,
          basePriceUsdPerTon: activePricing.basePriceUsdPerTon,
          marginPercent: activePricing.compensaMarginPercent,
          finalPriceUsdPerTon: activePricing.finalPriceUsdPerTon,
          effectiveFrom: activePricing.effectiveFrom,
          status: activePricing.status
        } : null,
        
        pricingHistory: project.pricingVersions.map(pv => ({
          id: pv.id,
          version: pv.versionName,
          basePriceUsdPerTon: pv.basePriceUsdPerTon,
          marginPercent: pv.compensaMarginPercent,
          finalPriceUsdPerTon: pv.finalPriceUsdPerTon,
          effectiveFrom: pv.effectiveFrom,
          effectiveTo: pv.effectiveTo,
          status: pv.status,
          reason: pv.reason,
          createdBy: pv.creator
        })),
        
        evidences: project.evidence.map(ev => ({
          id: ev.id,
          periodMonth: ev.periodMonth,
          photoUrl: ev.photoUrl,
          metricName: ev.metricName,
          metricValue: ev.metricValue,
          note: ev.note,
          createdAt: ev.createdAt
        })),
        
        documents: project.documents.map(doc => ({
          id: doc.id,
          docType: doc.docType,
          file: doc.file,
          createdAt: doc.createdAt
        })),
        
        partners: project.partners,
        
        metrics: project.metrics,
        
        recentCertificates: project.certificateProjects.map(cp => ({
          id: cp.certificate.id,
          number: cp.certificate.number,
          tonsCompensated: cp.allocationTons,
          priceUsdPerTon: cp.priceUsdPerTon,
          amountUsd: cp.amountUsd,
          status: cp.certificate.status,
          issuedAt: cp.certificate.issuedAt,
          purchaser: cp.certificate.company 
            ? { type: 'b2b', ...cp.certificate.company }
            : cp.certificate.b2cUser 
              ? { type: 'b2c', ...cp.certificate.b2cUser }
              : null
        })),
        
        stats
      }
    });
  } catch (error) {
    logger.error('Error en getProjectDetail:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener detalle del proyecto'
    });
  }
};

/**
 * POST /api/admin/projects
 * Crear nuevo proyecto ESG
 */
const createProject = async (req, res) => {
  try {
    const {
      code,
      name,
      description,
      projectType,
      country,
      region,
      providerOrganization,
      certification,
      status = 'pending',
      basePriceUsdPerTon,
      marginPercent,
      transparencyUrl,
      coBenefits
    } = req.body;

    // Validaciones
    if (!code || !name || !projectType || !country || !providerOrganization) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: code, name, projectType, country, providerOrganization'
      });
    }

    // Verificar que el código sea único
    const existingProject = await prisma.esgProject.findUnique({
      where: { code }
    });

    if (existingProject) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un proyecto con este código'
      });
    }

    // Calcular precio final si se proporciona precio base y margen
    const finalPrice = basePriceUsdPerTon && marginPercent 
      ? parseFloat(basePriceUsdPerTon) * (1 + parseFloat(marginPercent) / 100)
      : parseFloat(basePriceUsdPerTon) || 0;

    // Crear proyecto con transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear proyecto
      const project = await tx.esgProject.create({
        data: {
          code,
          name,
          description,
          projectType,
          country,
          region,
          providerOrganization,
          certification,
          status,
          currentBasePriceUsdPerTon: parseFloat(basePriceUsdPerTon) || 0,
          transparencyUrl,
          coBenefits
        }
      });

      // Crear versión de precio inicial si se especificó
      if (basePriceUsdPerTon) {
        await tx.projectPricingVersion.create({
          data: {
            projectId: project.id,
            versionName: 'v1',
            basePriceUsdPerTon: parseFloat(basePriceUsdPerTon),
            compensaMarginPercent: parseFloat(marginPercent) || 0,
            finalPriceUsdPerTon: finalPrice,
            effectiveFrom: new Date(),
            status: 'active',
            reason: 'Precio inicial del proyecto',
            createdBy: req.user.id
          }
        });
      }

      // Registrar auditoría
      await tx.auditLog.create({
        data: {
          action: 'PROJECT_CREATED',
          entityType: 'EsgProject',
          entityId: project.id,
          actorUserId: req.user.id,
          changesJson: JSON.stringify({
            code,
            name,
            projectType,
            country,
            providerOrganization
          })
        }
      });

      return project;
    });

    logger.info(`Proyecto ${result.code} creado por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Proyecto creado exitosamente',
      data: { project: result }
    });
  } catch (error) {
    logger.error('Error en createProject:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear proyecto'
    });
  }
};

/**
 * PUT /api/admin/projects/:id
 * Actualizar proyecto existente
 */
const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      projectType,
      country,
      region,
      providerOrganization,
      certification,
      status,
      currentBasePriceUsdPerTon,
      transparencyUrl,
      coBenefits
    } = req.body;

    // Verificar que existe el proyecto
    const existingProject = await prisma.esgProject.findUnique({
      where: { id }
    });

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Construir datos de actualización (solo campos proporcionados)
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (projectType !== undefined) updateData.projectType = projectType;
    if (country !== undefined) updateData.country = country;
    if (region !== undefined) updateData.region = region;
    if (providerOrganization !== undefined) updateData.providerOrganization = providerOrganization;
    if (certification !== undefined) updateData.certification = certification;
    if (status !== undefined) updateData.status = status;
    if (currentBasePriceUsdPerTon !== undefined) updateData.currentBasePriceUsdPerTon = parseFloat(currentBasePriceUsdPerTon);
    if (transparencyUrl !== undefined) updateData.transparencyUrl = transparencyUrl;
    if (coBenefits !== undefined) updateData.coBenefits = coBenefits;

    // Actualizar proyecto
    const project = await prisma.esgProject.update({
      where: { id },
      data: updateData
    });

    // Registrar auditoría
    await prisma.auditLog.create({
      data: {
        action: 'PROJECT_UPDATED',
        entityType: 'EsgProject',
        entityId: id,
        actorUserId: req.user.id,
        changesJson: JSON.stringify({
          previousValues: existingProject,
          newValues: updateData
        })
      }
    });

    logger.info(`Proyecto ${project.code} actualizado por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
      data: { project }
    });
  } catch (error) {
    logger.error('Error en updateProject:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar proyecto'
    });
  }
};

/**
 * PUT /api/admin/projects/:id/status
 * Cambiar estado de proyecto
 */
const changeProjectStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!status || !['active', 'pending', 'inactive', 'archived'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Usar: active, pending, inactive, archived'
      });
    }

    const project = await prisma.esgProject.findUnique({
      where: { id },
      select: { id: true, status: true, code: true }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const previousStatus = project.status;

    // Actualizar estado
    const updatedProject = await prisma.esgProject.update({
      where: { id },
      data: { status }
    });

    // Registrar auditoría
    await prisma.auditLog.create({
      data: {
        action: 'PROJECT_STATUS_CHANGE',
        entityType: 'EsgProject',
        entityId: id,
        actorUserId: req.user.id,
        changesJson: JSON.stringify({
          fromStatus: previousStatus,
          toStatus: status,
          reason
        })
      }
    });

    logger.info(`Estado de proyecto ${project.code} cambiado de ${previousStatus} a ${status} por ${req.user.email}`);

    res.json({
      success: true,
      message: `Estado cambiado a ${status}`,
      data: {
        project: {
          id: updatedProject.id,
          code: updatedProject.code,
          status: updatedProject.status
        },
        transition: {
          from: previousStatus,
          to: status,
          reason
        }
      }
    });
  } catch (error) {
    logger.error('Error en changeProjectStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar estado del proyecto'
    });
  }
};

/**
 * DELETE /api/admin/projects/:id
 * Eliminar proyecto (soft delete)
 */
const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que existe
    const project = await prisma.esgProject.findUnique({
      where: { id },
      include: {
        _count: {
          select: { certificateProjects: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Verificar que no tiene certificados emitidos
    if (project._count.certificateProjects > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un proyecto con certificados emitidos. Considere archivarlo.'
      });
    }

    // Soft delete - cambiar estado a 'archived'
    await prisma.$transaction(async (tx) => {
      await tx.esgProject.update({
        where: { id },
        data: {
          status: 'archived'
        }
      });

      // Registrar auditoría
      await tx.auditLog.create({
        data: {
          action: 'PROJECT_DELETED',
          entityType: 'EsgProject',
          entityId: id,
          actorUserId: req.user.id,
          changesJson: JSON.stringify({
            projectCode: project.code,
            projectName: project.name,
            deletedAt: new Date()
          })
        }
      });
    });

    logger.info(`Proyecto ${project.code} archivado por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Proyecto eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error en deleteProject:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar proyecto'
    });
  }
};

/**
 * POST /api/admin/projects/:id/evidences
 * Agregar evidencia a un proyecto
 */
const addEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      periodMonth,
      photoUrl,
      metricName,
      metricValue,
      note
    } = req.body;

    // Verificar que existe el proyecto
    const project = await prisma.esgProject.findUnique({
      where: { id },
      select: { id: true, code: true }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Crear evidencia
    const evidence = await prisma.projectEvidence.create({
      data: {
        projectId: id,
        periodMonth: periodMonth ? new Date(periodMonth) : new Date(),
        photoUrl,
        metricName,
        metricValue: metricValue ? parseFloat(metricValue) : null,
        note
      }
    });

    logger.info(`Evidencia agregada al proyecto ${project.code} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Evidencia agregada exitosamente',
      data: { evidence }
    });
  } catch (error) {
    logger.error('Error en addEvidence:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar evidencia'
    });
  }
};

/**
 * DELETE /api/admin/projects/:id/evidences/:evidenceId
 * Eliminar evidencia de un proyecto
 */
const deleteEvidence = async (req, res) => {
  try {
    const { id, evidenceId } = req.params;

    // Verificar que existe
    const evidence = await prisma.projectEvidence.findFirst({
      where: {
        id: evidenceId,
        projectId: id
      }
    });

    if (!evidence) {
      return res.status(404).json({
        success: false,
        message: 'Evidencia no encontrada'
      });
    }

    // Eliminar
    await prisma.projectEvidence.delete({
      where: { id: evidenceId }
    });

    logger.info(`Evidencia ${evidenceId} eliminada por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Evidencia eliminada exitosamente'
    });
  } catch (error) {
    logger.error('Error en deleteEvidence:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar evidencia'
    });
  }
};

/**
 * GET /api/admin/projects/:id/pricing
 * Historial de precios de un proyecto
 */
const getPricingHistory = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que existe el proyecto
    const project = await prisma.esgProject.findUnique({
      where: { id },
      select: { id: true, code: true, currentBasePriceUsdPerTon: true }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    const pricingVersions = await prisma.projectPricingVersion.findMany({
      where: { projectId: id },
      orderBy: { effectiveFrom: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: {
        projectId: id,
        projectCode: project.code,
        currentBasePrice: project.currentBasePriceUsdPerTon,
        pricingHistory: pricingVersions.map(pv => ({
          id: pv.id,
          version: pv.versionName,
          basePriceUsdPerTon: pv.basePriceUsdPerTon,
          marginPercent: pv.compensaMarginPercent,
          finalPriceUsdPerTon: pv.finalPriceUsdPerTon,
          effectiveFrom: pv.effectiveFrom,
          effectiveTo: pv.effectiveTo,
          status: pv.status,
          reason: pv.reason,
          createdAt: pv.createdAt,
          createdBy: pv.creator
        }))
      }
    });
  } catch (error) {
    logger.error('Error en getPricingHistory:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de precios'
    });
  }
};

/**
 * POST /api/admin/projects/:id/pricing
 * Crear nueva versión de precio
 */
const addPricing = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      basePriceUsdPerTon, 
      marginPercent, 
      effectiveFrom, 
      reason 
    } = req.body;

    // Verificar que existe el proyecto
    const project = await prisma.esgProject.findUnique({
      where: { id },
      select: { id: true, code: true }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Proyecto no encontrado'
      });
    }

    // Validar que el precio base está presente
    if (!basePriceUsdPerTon) {
      return res.status(400).json({
        success: false,
        message: 'Debe especificar basePriceUsdPerTon'
      });
    }

    // Obtener última versión para generar número de versión
    const lastVersion = await prisma.projectPricingVersion.findFirst({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    });

    const versionNumber = lastVersion 
      ? parseInt(lastVersion.versionName.replace('v', '')) + 1 
      : 1;

    // Calcular precio final
    const margin = parseFloat(marginPercent) || 0;
    const basePrice = parseFloat(basePriceUsdPerTon);
    const finalPrice = basePrice * (1 + margin / 100);

    // Desactivar versión anterior si existe y la nueva es efectiva desde ahora
    const effectiveDate = effectiveFrom ? new Date(effectiveFrom) : new Date();
    
    await prisma.$transaction(async (tx) => {
      // Desactivar versiones activas previas si la nueva es efectiva
      if (effectiveDate <= new Date()) {
        await tx.projectPricingVersion.updateMany({
          where: { 
            projectId: id, 
            status: 'active' 
          },
          data: { 
            status: 'superseded',
            effectiveTo: effectiveDate
          }
        });
      }

      // Crear nueva versión
      const pricing = await tx.projectPricingVersion.create({
        data: {
          projectId: id,
          versionName: `v${versionNumber}`,
          basePriceUsdPerTon: basePrice,
          compensaMarginPercent: margin,
          finalPriceUsdPerTon: finalPrice,
          effectiveFrom: effectiveDate,
          status: effectiveDate <= new Date() ? 'active' : 'pending',
          reason,
          createdBy: req.user.id
        }
      });

      // Actualizar precio base del proyecto si es efectivo desde ahora
      if (effectiveDate <= new Date()) {
        await tx.esgProject.update({
          where: { id },
          data: { currentBasePriceUsdPerTon: basePrice }
        });
      }

      // Registrar auditoría
      await tx.projectPricingAudit.create({
        data: {
          projectId: id,
          newVersionId: pricing.id,
          oldVersionId: lastVersion?.id || null,
          changedBy: req.user.id,
          changeReason: reason,
          changedAt: new Date(),
          newValues: {
            basePriceUsdPerTon: basePrice,
            marginPercent: margin,
            finalPriceUsdPerTon: finalPrice
          },
          oldValues: lastVersion ? {
            basePriceUsdPerTon: lastVersion.basePriceUsdPerTon,
            marginPercent: lastVersion.compensaMarginPercent,
            finalPriceUsdPerTon: lastVersion.finalPriceUsdPerTon
          } : null
        }
      });

      return pricing;
    });

    logger.info(`Nueva versión de precio creada para proyecto ${project.code} por ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Precio agregado exitosamente',
      data: {
        version: `v${versionNumber}`,
        basePriceUsdPerTon: basePrice,
        marginPercent: margin,
        finalPriceUsdPerTon: finalPrice,
        effectiveFrom: effectiveDate,
        status: effectiveDate <= new Date() ? 'active' : 'pending'
      }
    });
  } catch (error) {
    logger.error('Error en addPricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar precio'
    });
  }
};

/**
 * PUT /api/admin/projects/:id/pricing/:pricingId/activate
 * Activar una versión de precio
 */
const activatePricing = async (req, res) => {
  try {
    const { id, pricingId } = req.params;

    // Verificar que existe la versión de precio
    const pricingVersion = await prisma.projectPricingVersion.findFirst({
      where: {
        id: pricingId,
        projectId: id
      }
    });

    if (!pricingVersion) {
      return res.status(404).json({
        success: false,
        message: 'Versión de precio no encontrada'
      });
    }

    await prisma.$transaction(async (tx) => {
      // Desactivar otras versiones activas
      await tx.projectPricingVersion.updateMany({
        where: { 
          projectId: id, 
          status: 'active',
          id: { not: pricingId }
        },
        data: { 
          status: 'superseded',
          effectiveTo: new Date()
        }
      });

      // Activar la versión seleccionada
      await tx.projectPricingVersion.update({
        where: { id: pricingId },
        data: { 
          status: 'active',
          effectiveFrom: new Date()
        }
      });

      // Actualizar precio base del proyecto
      await tx.esgProject.update({
        where: { id },
        data: { 
          currentBasePriceUsdPerTon: pricingVersion.basePriceUsdPerTon 
        }
      });
    });

    logger.info(`Precio ${pricingId} activado para proyecto ${id} por ${req.user.email}`);

    res.json({
      success: true,
      message: 'Precio activado exitosamente'
    });
  } catch (error) {
    logger.error('Error en activatePricing:', error);
    res.status(500).json({
      success: false,
      message: 'Error al activar precio'
    });
  }
};

/**
 * GET /api/admin/projects/stats
 * Estadísticas globales de proyectos
 */
const getProjectsStats = async (req, res) => {
  try {
    const [
      totalProjects,
      byStatus,
      byType,
      byCountry,
      totalTonsAvailable
    ] = await Promise.all([
      prisma.esgProject.count(),
      prisma.esgProject.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      prisma.esgProject.groupBy({
        by: ['projectType'],
        _count: { id: true }
      }),
      prisma.esgProject.groupBy({
        by: ['country'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),
      prisma.esgProject.aggregate({
        _sum: {
          totalTonsAvailable: true
        }
      })
    ]);

    // Formatear datos
    const statusMap = {};
    byStatus.forEach(s => {
      statusMap[s.status] = s._count.id;
    });

    const typeMap = {};
    byType.forEach(t => {
      typeMap[t.projectType] = t._count.id;
    });

    const countryList = byCountry.map(c => ({
      country: c.country,
      count: c._count.id
    }));

    // Obtener totales de compensación por certificados
    const certificateStats = await prisma.certificateProject.aggregate({
      _sum: {
        tonsAllocated: true,
        amountUsd: true
      }
    });

    // Obtener proyectos activos con precios
    const activeProjects = await prisma.esgProject.count({
      where: { status: 'active' }
    });

    res.json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        byStatus: statusMap,
        byType: typeMap,
        topCountries: countryList,
        inventory: {
          totalTonsAvailable: totalTonsAvailable._sum.totalTonsAvailable || 0,
          totalTonsAllocated: certificateStats._sum.tonsAllocated || 0,
          totalRevenueUsd: certificateStats._sum.amountUsd || 0
        }
      }
    });
  } catch (error) {
    logger.error('Error en getProjectsStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de proyectos'
    });
  }
};

// ============================================
// FUNCIONES AUXILIARES
// ============================================

/**
 * Calcula estadísticas de un proyecto específico
 */
async function calculateProjectStats(projectId) {
  try {
    const certStats = await prisma.certificateProject.aggregate({
      where: { projectId },
      _count: { id: true },
      _sum: {
        tonsAllocated: true,
        amountUsd: true
      }
    });

    // Contar evidencias
    const evidenceCount = await prisma.projectEvidence.count({
      where: { projectId }
    });

    return {
      totalCertificates: certStats._count.id || 0,
      totalTonsAllocated: certStats._sum.tonsAllocated || 0,
      totalRevenueUsd: certStats._sum.amountUsd || 0,
      evidenceCount
    };
  } catch (error) {
    logger.error('Error calculating project stats:', error);
    return {
      totalCertificates: 0,
      totalTonsAllocated: 0,
      totalRevenueUsd: 0,
      evidenceCount: 0
    };
  }
}

/**
 * Obtiene resumen de proyectos para listado
 */
async function getProjectsSummary() {
  try {
    const summary = await prisma.esgProject.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const result = {
      active: 0,
      pending: 0,
      inactive: 0,
      archived: 0
    };

    summary.forEach(s => {
      if (result.hasOwnProperty(s.status)) {
        result[s.status] = s._count.id;
      }
    });

    result.total = Object.values(result).reduce((a, b) => a + b, 0);
    return result;
  } catch (error) {
    logger.error('Error getting projects summary:', error);
    return { active: 0, pending: 0, inactive: 0, archived: 0, total: 0 };
  }
}

module.exports = {
  listProjects,
  getProjectDetail,
  createProject,
  updateProject,
  changeProjectStatus,
  deleteProject,
  addEvidence,
  deleteEvidence,
  getPricingHistory,
  addPricing,
  activatePricing,
  getProjectsStats
};

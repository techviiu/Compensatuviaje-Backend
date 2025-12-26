/**
 * Funciones:
 * - Resgistra y gestiona empresas
 * - Workflow de estado (mas info revisar las validaciones)
 * - Validacion de duplicaciones
 * - Gestión de usuarios empresariales
 */


const {PrismaClient, CertificateStatus} = require('@prisma/client');
const bcrypt  = require('bcryptjs');
const {validateRutResult} = require('../validators/rutValidator');
const {validateStatusTransition} = require('../validators/onboardValidator');
const logger = require('../../../utils/logger');

const prisma = new PrismaClient();

/**
 * Crear nueva empresa con usuario administrador
 * @param {object} companyData - Datos de la empresa
 * @param {object} adminUserData - Datos del usuario administrador
 * @returns {object} Empresa creada por usuario
 */
 

const createCompany = async (companyData, adminUserData) => {
    try {
        // valida RUT
        const rutValidation = validateRutResult(companyData.rut);
        if(!rutValidation.isValid){
            throw new Error(`RUT inválido : ${rutValidation.errors.join(', ')}`);
        }

        // verificamso que la empresa es nueva
        const existingCompany = await prisma.company.findFirst({
            where: {rut: rutValidation.formatted}
        });
        if(existingCompany){
            throw new Error('Ya existe una empresa registradacon este RUT')
        }
        
        // verificamos que el email es nuevo
        const existingUser = await prisma.user.findFirst({
            where: {email: adminUserData.email}
        });
        if(existingUser){
            throw new Error(`Ya existe un usuario registrado con este amail`);
        }

        // generamos un slug único sino se proporciona
        let slugPublico = companyData.slugPublico;
        if(!slugPublico){
            slugPublico = await generateUniqueSlug(companyData.razonSocial);
        }else{
            // verificamos que el slug es único
            const existingSlug = await prisma.company.findFirst({
                where: {slugPublico}
            })
            if(!existingSlug){
                throw new Error(`Ya está en uso el slug que ingresaste`);
            }
        }

        // creamos la trasaccion para empresa + usuario + rolaciones
        const result = await prisma.$transaction(async (tx) => {
            // crea empresa
            const company = await tx.company.create({
                data: {
                    razonSocial: companyData.razonSocial,
                    rut: companyData.rut,
                    nombreComercial: companyData.nombreComercial || null,
                    giroSii: companyData.giroSii || null,
                    tamanoEmpresa: companyData.tamanoEmpresa || null,
                    direccion: companyData.direccion || null,
                    phone: companyData.phone || null,
                    slugPublico: slugPublico,
                    status: 'registered',
                    preferredCalculationMethod: 'MINIMAL_INPUT'
                }
            });

            // crea usuario administrador
            const cantSalts = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10)
            const hashedPassword = await bcrypt.hash(adminUserData.password, cantSalts)
            const user = await tx.user.create({
                data: {
                    email: adminUserData.email,
                    name: adminUserData.name,
                    passwordHash: hashedPassword,
                    isActive: true
                }
            })

            // creamos la relación de empresa-usuario
            const companyUser = await tx.companyUser.create({
                data: {
                    companyId: company.id,
                    userId: user.id,
                    isAdmin: true,
                    status: 'active'
                }
            })

            // obtner el rol COMPANY_ADMIN
            const adminRole = await tx.role.findFirst({
                where: { code: 'COMPANY_ADMIN'}
            });
            if(!adminRole){
                throw new Error('Rol COMPANY_ADMIN no encontrado en el sistema');
            }
            // asginar rol al usuario
            await tx.companyUserRole.create({
                data: {
                    companyUserId: companyUser.id,
                    roleId: adminRole.id
                }
            })

            // crea configuraciones iniciales de empresa
            await tx.companySettings.create({
                data: {
                    companyId: company.id,
                    publicTagline: null,
                    publicBannerUrl: null,
                    notificationsJson: JSON.stringify({
                        emailNotifications: true,
                        weeklyReports: true,
                        certificateReady: true
                    })
                }
            });
            
            return {
                company,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    isActive: user.isActive
                },
                companyUser
            };
        });
        
        // log de auditoria
        await createAuditLog({
            action: 'COMPANY_CREATED',
            entityType: 'Company',
            entityId: result.company.id,
            actorUserId: result.user.id,
            changesJson: JSON.stringify({
                company: result.company,
                adminUser: result.user.email
            })
        });
        logger.info('Empresa creada exitosamente', {
            companyId: result.company.id,
            rut: result.company.rut,
            adminEmail: result.user.email
        })
        return result;
    } catch (error) {
        logger.error('Error creando empresa', {error: error.message, companyData})
        throw error;
    }
};

/**
 * Obtener empresa por ID con datos relacionados
 * @param {string} companyId - ID de la empresa
 * @param {boolean} includeUsers - Incluir usuarios relacionados
 * @returns {Object} Empresa con datos relacionados
 */
const getCompanyById = async (companyId, includeUsers = false) =>{
    try {
        if (!companyId) {
            throw new Error('COMPANY_ID_REQUIRED');
        }

        const include = {
            settings: true,
            documets: {
                include: {
                    file: true
                }
            },
            domains: true,
            verificationEvents: {
                include: {
                    user: {
                        select: {
                            id: true, name: true, email: true
                        }
                    },
                },
                orderBy: {createAt: 'desc'}
                
            }
        };
        if(includeUsers){
            include.companyUsers = {
                include: {
                    user: {
                        select: {id: true, name: true, email: true, isActive: true}
                    },
                    roles: {
                        include: {
                            role: true
                        }
                    }
                }
            };
        }

        const company = await prisma.company.findUnique({
            where: {id: companyId},
            
        })
        if(!company){
            throw new Error('Empresa no econtrada');
        }

        return company;

    } catch (error) {
        logger.warn("No se econtró la companía", {error: error.message});
       throw error;
    }
};

/**
 * Actualizar datos de empresa
 * @param {string} companyId - ID de la empresa
 * @param {Object} updateData - Datos a actualizar
 * @param {string} actorUserId - ID del usuario que hace el cambio
 * @returns {Object} Empresa actualizada
 */

const updateCompany = async (companyId, updateData, actorUserId) => {
  try {
    // 1. Obtener empresa actual
    const currentCompany = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!currentCompany) {
      throw new Error('Empresa no encontrada');
    }

      console.log(" ❌Empresa: ", currentCompany)

    // 2. Validar slug único si se proporciona
    if (updateData.slugPublico && updateData.slugPublico !== currentCompany.slugPublico) {
      const existingSlug = await prisma.company.findFirst({
        where: { 
          slugPublico: updateData.slugPublico,
          id: { not: companyId }
        }
      });
      
      if (existingSlug) {
        throw new Error(' ❌ El slug público ya está en uso');
      }
    }
      console.log(" 🍻Empresa id: ", companyId)

    // Filtrar y mapear campos permitidos
    const allowedFields = [
        'razonSocial', 'rut', 'nombreComercial', 'giroSii', 
        'tamanoEmpresa', 'direccion', 'phone', 'slugPublico', 
        'publicProfileOptIn', 'preferredCalculationMethod', 'status'
    ];

    const dataToUpdate = {};

    // Mapear address -> direccion si es necesario
    if (updateData.address && !updateData.direccion) {
        let fullAddress = updateData.address;
        if (updateData.city) fullAddress += `, ${updateData.city}`;
        if (updateData.country) fullAddress += `, ${updateData.country}`;
        dataToUpdate.direccion = fullAddress;
    }

    // Copiar campos permitidos
    Object.keys(updateData).forEach(key => {
        if (allowedFields.includes(key)) {
            dataToUpdate[key] = updateData[key];
        }
    });

    // 3. Actualizar empresa
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...dataToUpdate,
        updatedAt: new Date()
      }
    });

    // 4. Log de auditoría
    await createAuditLog({
      action: 'COMPANY_UPDATED',
      entityType: 'Company',
      entityId: companyId,
      actorUserId,
      changesJson: JSON.stringify({
        before: currentCompany,
        after: updatedCompany,
        changes: updateData
      })
    });

    logger.info('Empresa actualizada', { companyId, changes: Object.keys(updateData) });

    return updatedCompany;

  } catch (error) {
    logger.error('Error actualizando empresa', { error: error.message, companyId });
    throw error;
  }
};


/**
 * Cambiar estado de empresa con validación de workflow
 * @param {string} companyId - ID de la empresa
 * @param {string} newStatus - Nuevo estado
 * @param {string} actorUserId - ID del usuario que hace el cambio
 * @param {string} note - Nota opcional del cambio
 * @returns {Object} Empresa actualizada
 */




const changeCompanyStatus = async (companyId, newStatus, actorUserId, note = null) => {
  try {
    // 1. Obtener empresa actual
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new Error('Empresa no encontrada');
    }

    // 2. Validar transición de estado
    if (!validateStatusTransition(company.status, newStatus)) {
      throw new Error(`Transición de estado inválida: ${company.status} → ${newStatus}`);
    }

    // 3. Actualizar estado en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar empresa
      const updatedCompany = await tx.company.update({
        where: { id: companyId },
        data: { 
          status: newStatus,
          updatedAt: new Date()
        }
      });

      // Crear evento de verificación
      await tx.companyVerificationEvent.create({
        data: {
          companyId,
          fromStatus: company.status,
          toStatus: newStatus,
          notedByUserId: actorUserId,
          note
        }
      });

      return updatedCompany;
    });

    // 4. Log de auditoría
    await createAuditLog({
      action: 'COMPANY_STATUS_CHANGED',
      entityType: 'Company',
      entityId: companyId,
      actorUserId,
      changesJson: JSON.stringify({
        fromStatus: company.status,
        toStatus: newStatus,
        note
      })
    });

    logger.info('Estado de empresa cambiado', { 
      companyId, 
      fromStatus: company.status, 
      toStatus: newStatus 
    });

    return result;

  } catch (error) {
    logger.error('Error cambiando estado de empresa', { 
      error: error.message, 
      companyId, 
      newStatus 
    });
    throw error;
  }
};


/**
 * Obtener empresas con filtros y paginación
 * @param {Object} filters - Filtros de búsqueda
 * @param {Object} pagination - Configuración de paginación
 * @returns {Object} Empresas paginadas
 */
const getCompanies = async (filters = {}, pagination = { page: 1, limit: 10 }) => {
  try {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    // Construir filtros dinámicos
    const whereFilter = {};
    
    if (filters.status) {
      whereFilter.status = filters.status;
    }


    if (filters.search) {
      whereFilter.OR = [
        { razonSocial: { contains: filters.search, mode: 'insensitive' } },
        { nombreComercial: { contains: filters.search, mode: 'insensitive' } },
        { rut: { contains: filters.search } }
      ];
    }
    
    if (filters.tamanoEmpresa) {
      whereFilter.tamanoEmpresa = filters.tamanoEmpresa;
    }
   

    // Obtener empresas y total
    const [companies, total] = await Promise.all([
      prisma.company.findMany({
      where: whereFilter,
        include: {
          _count: {
            select: {
              companyUsers: true,
              uploadBatches: true,
              certificates: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.company.count()
    ]);

    return {
      companies,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        count: companies.length,
        totalRecords: total
      }
    };

  } catch (error) {
    logger.error('Error obteniendo empresas', { error: error.message, filters });
    throw error;
  }
};

/**
 * Generar slug único basado en razón social
 * @param {string} razonSocial - Razón social de la empresa
 * @returns {string} Slug único
 */
const generateUniqueSlug = async (razonSocial) => {
  // Limpiar y normalizar razón social
  let baseSlug = razonSocial
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-') // Múltiples guiones a uno
    .replace(/^-|-$/g, ''); // Remover guiones inicio/final

  // Limitar longitud
  baseSlug = baseSlug.substring(0, 40);

  // Verificar unicidad
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.company.findFirst({
      where: { slugPublico: slug }
    });

    if (!existing) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;

    // Evitar bucle infinito
    if (counter > 100) {
      slug = `${baseSlug}-${Date.now()}`;
      break;
    }
  }

  return slug;
};

/**
 * Crear log de auditoría
 * @param {Object} logData - Datos del log
 */
const createAuditLog = async (logData) => {
  try {
    await prisma.auditLog.create({
      data: logData
    });
  } catch (error) {
    logger.error('Error creando audit log', { error: error.message, logData });
    // No lanzar error para no interrumpir operación principal
  }
};


module.exports = {
  createCompany,
  getCompanyById,
  updateCompany,
  changeCompanyStatus,
  getCompanies,
  generateUniqueSlug
};
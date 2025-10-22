/**
 * Middleware para verificar que el usuario tiene acceso a la empresa
 */

const { PrismaClient } = require('@prisma/client');
const logger = require('../../../utils/logger');

const prisma = new PrismaClient();

/**
 * Verificar que el usuario tiene acceso a la empresa especificada
 */
const checkCompanyAccess = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const companyId = req.params.id;

    // SuperAdmins tienen acceso a todo
    if (req.user.isSuperAdmin) {
      return next();
    }

    // Verificar que el usuario pertenece a la empresa
    const companyUser = await prisma.companyUser.findFirst({
      where: {
        userId: userId,
        companyId: companyId,
        status: 'active'
      },
      include: {
        company: {
          select: { id: true, razonSocial: true, status: true }
        }
      }
    });

    if (!companyUser) {
      logger.warn('Acceso denegado a empresa', { 
        userId, 
        companyId,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        message: 'No tienes acceso a esta empresa'
      });
    }

    // Agregar información de la empresa al request
    req.userCompany = {
      companyUser: companyUser,
      company: companyUser.company,
      isAdmin: companyUser.isAdmin
    };

    next();

  } catch (error) {
    logger.error('Error verificando acceso a empresa', { 
      error: error.message,
      userId: req.user?.id,
      companyId: req.params.id
    });

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Verificar que el usuario es admin de la empresa
 */
const requireCompanyAdmin = async (req, res, next) => {
  // Primero verificar acceso general
  await checkCompanyAccess(req, res, () => {
    // Si llegamos aquí, el usuario tiene acceso
    if (req.user.isSuperAdmin || req.userCompany.isAdmin) {
      return next();
    }

    logger.warn('Acceso de admin denegado', { 
      userId: req.user.id, 
      companyId: req.params.id,
      isAdmin: req.userCompany.isAdmin
    });

    return res.status(403).json({
      success: false,
      message: 'Requiere permisos de administrador de la empresa'
    });
  });
};

module.exports = {
  checkCompanyAccess,
  requireCompanyAdmin
};
/**
x * 
 * Funciones:
 * - Verificación dominios corporativos
 * - Validación códigos IATA/ICAO
 * - Verificación automática y manual
 * - Gestión de tokens de verificación
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const dns = require('dns').promises;
const logger = require('../../../utils/logger');

const prisma = new PrismaClient();

/**
 * Agregar dominio corporativo para verificación
 * @param {string} companyId - ID de la empresa
 * @param {string} domain - Dominio a verificar
 * @param {string} requestedByUserId - ID del usuario que solicita
 * @returns {Object} Dominio agregado
 */
const addCompanyDomain = async (companyId, domain, requestedByUserId) => {
  try {
    // 1. Verificar que empresa existe
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new Error('Empresa no encontrada');
    }

    // 2. Verificar que dominio no esté ya registrado
    const existingDomain = await prisma.companyDomain.findFirst({
      where: { domain: domain.toLowerCase() }
    });

    if (existingDomain) {
      throw new Error('El dominio ya está registrado por otra empresa');
    }

    // 3. Validar dominio con DNS lookup básico
    const isDomainValid = await validateDomainExists(domain);
    if (!isDomainValid) {
      throw new Error('El dominio no existe o no es accesible');
    }

    // 4. Crear registro de dominio
    const companyDomain = await prisma.companyDomain.create({
      data: {
        companyId,
        domain: domain.toLowerCase(),
        verified: false
      }
    });

    // 5. Log de auditoría
    await createAuditLog({
      action: 'DOMAIN_ADDED',
      entityType: 'CompanyDomain',
      entityId: companyDomain.id,
      actorUserId: requestedByUserId,
      changesJson: JSON.stringify({
        domain,
        companyId
      })
    });

    logger.info('Dominio agregado para verificación', { 
      companyId, 
      domain, 
      domainId: companyDomain.id 
    });

    return companyDomain;

  } catch (error) {
    logger.error('Error agregando dominio', { 
      error: error.message, 
      companyId, 
      domain 
    });
    throw error;
  }
};

/**
 * Verificar dominio manualmente (admin)
 * @param {string} domainId - ID del dominio
 * @param {boolean} isVerified - true para verificar, false para rechazar
 * @param {string} verifiedByUserId - ID del admin que verifica
 * @param {string} note - Nota opcional
 * @returns {Object} Dominio actualizado
 */
const verifyDomainManually = async (domainId, isVerified, verifiedByUserId, note = null) => {
  try {
    // 1. Obtener dominio
    const domain = await prisma.companyDomain.findUnique({
      where: { id: domainId },
      include: { company: true }
    });

    if (!domain) {
      throw new Error('Dominio no encontrado');
    }

    // 2. Actualizar estado de verificación
    const updatedDomain = await prisma.companyDomain.update({
      where: { id: domainId },
      data: {
        verified: isVerified,
        verifiedAt: isVerified ? new Date() : null
      }
    });

    // 3. Si se verifica el dominio, crear evento en empresa
    if (isVerified) {
      await prisma.companyVerificationEvent.create({
        data: {
          companyId: domain.companyId,
          fromStatus: domain.company.status,
          toStatus: domain.company.status, // Mantener mismo estado
          notedByUserId: verifiedByUserId,
          note: `Dominio verificado: ${domain.domain}${note ? ` - ${note}` : ''}`
        }
      });
    }

    // 4. Log de auditoría
    await createAuditLog({
      action: isVerified ? 'DOMAIN_VERIFIED' : 'DOMAIN_REJECTED',
      entityType: 'CompanyDomain',
      entityId: domainId,
      actorUserId: verifiedByUserId,
      changesJson: JSON.stringify({
        domain: domain.domain,
        isVerified,
        note
      })
    });

    logger.info(`Dominio ${isVerified ? 'verificado' : 'rechazado'}`, { 
      domainId, 
      domain: domain.domain,
      companyId: domain.companyId
    });

    return updatedDomain;

  } catch (error) {
    logger.error('Error verificando dominio', { 
      error: error.message, 
      domainId 
    });
    throw error;
  }
};

/**
 * Validar que un dominio existe (DNS lookup)
 * @param {string} domain - Dominio a validar
 * @returns {boolean} true si existe
 */
const validateDomainExists = async (domain) => {
  try {
    // Intentar resolver MX records (para email) o A records
    try {
      await dns.resolveMx(domain);
      return true;
    } catch {
      try {
        await dns.resolve(domain);
        return true;
      } catch {
        return false;
      }
    }
  } catch (error) {
    logger.warn('Error validando dominio DNS', { domain, error: error.message });
    return false;
  }
};

/**
 * Validar códigos IATA/ICAO de aeropuertos
 * @param {string} airportCode - Código del aeropuerto
 * @returns {Object} Información del aeropuerto si existe
 */
const validateAirportCode = async (airportCode) => {
  try {
    const code = airportCode.toUpperCase();
    
    // Buscar en catálogo local
    const airport = await prisma.airport.findFirst({
      where: {
        OR: [
          { code: code },
          { code: { startsWith: code.substring(0, 3) } } // Para códigos ICAO vs IATA
        ]
      }
    });

    if (airport) {
      return {
        isValid: true,
        airport: {
          id: airport.id,
          code: airport.code,
          name: airport.name,
          city: airport.city,
          country: airport.country
        }
      };
    }

    return {
      isValid: false,
      error: 'Código de aeropuerto no encontrado en catálogo'
    };

  } catch (error) {
    logger.error('Error validando código aeropuerto', { 
      error: error.message, 
      airportCode 
    });
    return {
      isValid: false,
      error: 'Error interno validando código'
    };
  }
};

/**
 * Obtener dominios de una empresa
 * @param {string} companyId - ID de la empresa
 * @returns {Array} Lista de dominios
 */
const getCompanyDomains = async (companyId) => {
  try {
    const domains = await prisma.companyDomain.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' }
    });

    return domains;

  } catch (error) {
    logger.error('Error obteniendo dominios de empresa', { 
      error: error.message, 
      companyId 
    });
    throw error;
  }
};

/**
 * Verificar si un email pertenece a dominios verificados de la empresa
 * @param {string} email - Email a verificar
 * @param {string} companyId - ID de la empresa
 * @returns {boolean} true si es válido
 */
const isValidCorporateEmail = async (email, companyId) => {
  try {
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!emailDomain) return false;

    const verifiedDomain = await prisma.companyDomain.findFirst({
      where: {
        companyId,
        domain: emailDomain,
        verified: true
      }
    });

    return !!verifiedDomain;

  } catch (error) {
    logger.error('Error validando email corporativo', { 
      error: error.message, 
      email, 
      companyId 
    });
    return false;
  }
};

/**
 * Obtener estadísticas de verificación para admin
 * @returns {Object} Estadísticas de verificación
 */
const getVerificationStats = async () => {
  try {
    const [
      totalCompanies,
      pendingVerification,
      verifiedCompanies,
      pendingDomains,
      verifiedDomains
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: 'pending_contract' } }),
      prisma.company.count({ where: { status: { in: ['active', 'signed'] } } }),
      prisma.companyDomain.count({ where: { verified: false } }),
      prisma.companyDomain.count({ where: { verified: true } })
    ]);

    return {
      companies: {
        total: totalCompanies,
        pendingVerification,
        verified: verifiedCompanies
      },
      domains: {
        pending: pendingDomains,
        verified: verifiedDomains,
        total: pendingDomains + verifiedDomains
      }
    };

  } catch (error) {
    logger.error('Error obteniendo estadísticas de verificación', { 
      error: error.message 
    });
    throw error;
  }
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
  }
};

module.exports = {
  addCompanyDomain,
  verifyDomainManually,
  validateDomainExists,
  validateAirportCode,
  getCompanyDomains,
  isValidCorporateEmail,
  getVerificationStats
};
/**
 * aquí manejaremos la lógica de negocio del modulo de auth  para B2B y SuperAdmin
 * tambien (no seria lo correcto utilizando clean archt) acceder a la
 * BD desde el servicio talvez crar un nueva capa de abstrancción para accederla, 
 * 
 */

const bcrypt = require('bcrypt');
const {PrismaClient} = require('@prisma/client');
const config = require('../../../config/security');
const logger = require('../../../utils/logger');

const prisma = new PrismaClient()

class AuthService{
  /**
   * autenticamos al usuario con email y password
   * 1: Buscamos al user por email
   * 2: verificamos que la empresa al que pertenece esté activa
   */

async authenticateUser(email , password , clientInfo) {
  try {
    // PASO 1: CONSULTA LIGERA Y VALIDACIONES BÁSICAS
    // Buscamos al usuario e incluimos la relación a roles globales.
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { 
        globalRoles: { 
          include: {
            role: true, 
          },
        },
      },
    });

    // Validación 1: ¿Existe el usuario?
    if (!user) {
      logger.warn('Authentication attempt with non-existent email', { email, ip: clientInfo.ip });
      throw new Error('Invalid credentials');
    }
    
    // Validación 2: ¿Contraseña correcta?
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        await this.recordFailedAttempt(clientInfo.ip, user.id, 'INVALID_PASSWORD');
        logger.warn('Authentication failed - invalid password', { userId: user.id, email, ip: clientInfo.ip });
        throw new Error('Invalid credentials');
    }

    // Validación 3: ¿Usuario activo?
    if (!user.isActive) {
      logger.warn('Authentication attempt with inactive user', { userId: user.id, email, ip: clientInfo.ip });
      throw new Error('Account is inactive');
    }
    
    await this.checkRateLimiting(clientInfo.ip, user.id);
    
    // Si llegamos aquí, la contraseña es correcta y el usuario está activo.
    await this.clearFailedAttempts(clientInfo.ip, user.id);
    await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
    });

    // VÍA RÁPIDA: ¿Es un Administrador Global?
    if (user.globalRoles && user.globalRoles.length > 0) {
      const globalRole = user.globalRoles[0];

      const userInfo = {
        user_id: user.id,
        email: user.email,
        name: user.name,
        role: globalRole.role.code, 
        permissions: ['*'], 
        is_super_admin: true,
      };

      logger.info('SuperAdmin authenticated successfully', { userId: user.id, ip: clientInfo.ip });
      return userInfo;
    }

    // VÍA NORMAL: Es un Usuario de Empresa
    const companyData = await prisma.companyUser.findMany({
        where: {
            userId: user.id,
            
        },
        include: {
            company: true,
            roles: {
                include: {
                    role: {
                        include: {
                            permissions: { include: { permission: true } }
                        }
                    }
                }
            }
        }
    });

    if (companyData.length === 0) {
        logger.warn('User has no active companies', { userId: user.id, email });
        throw new Error('No active companies associated');
    }

    const primaryCompanyUser = companyData[0];
    const company = primaryCompanyUser.company;
    const permissions = primaryCompanyUser.roles[0]?.role.permissions.map(p => p.permission.code) || [];
    
    const userInfo = {
        user_id: user.id,
        email: user.email,
        name: user.name,
        company_id: company.id,
        company_name: company.nombreComercial,
        role: primaryCompanyUser.roles[0]?.role.code || 'viewer',
        permissions: permissions,
        is_super_admin: false,
    };
    
    logger.info('User authenticated successfully', { userId: user.id, company_id: company.id, ip: clientInfo.ip });
    return userInfo;

  } catch (error) {
    throw error;
  }
}

  /**
   * Verificamso rate limiting para evitar ataques de fuerza bruta 
   * 
   * Estrategia:
   * Por ip: Maximo X intentos por intentos de tiempo
   * Por usuario: maximo y  intetno por ventana de tiempo
   * lockup progresivo: Cada fallo incrementa el tiempo de bloque
   */

  async checkRateLimiting(ip, userId = null){
    const windowMs = config.rateLimit.apiWindowMs;
    const maxAttempts = config.rateLimit.loginMaxAttempts;
    const lockoutMinutes = config.rateLimit.loginLockoutMinutes;

    const since = new Date(Date.now() - windowMs);
    try{
      // verificamos por intento por ip

      if(ip){
        const ipAttempts = await prisma.loginEvent.count(
          {
            where: {
              ip: ip,
              result: 'FAILURE',
              createdAt: {gte: since}
            }
          }
        );
        if(ipAttempts >= maxAttempts){
          logger.warm('Rate limit exceeded for IP', {
            ip: ip,
            attemps: ipAttempts
          });

          throw new Error(`Rate limit exceded. Try again in ${lockoutMinutes} minutes`)
        }
      }
      // verificamos intentos por usuario
      if(userId){
        const userAttempts = await prisma.loginEvent.count({
          where:{
            userId: userId,
            result: 'FAILURE',
            createdAt: {gte: since}
          }
        });
        if(userAttempts >= maxAttempts){
          logger.warm('Rate limit exceded for user', {
            user_id: userId,
            attemps: userAttempts
          });

          throw new Error(`Account temporaly locked, try again in ${lockoutMinutes} minutes  `);
        }
      }
    }catch(error){
      if(error.message.includes('Rate limit exceeded')||
      error.message.includes('Account temporaly locked')){
        throw error;
      }
      logger.error('Error checking rate liimiting', error);
    }

  }

  // registros de login fallidos
  async recordFailedAttempt(ip, userId, reason){
    try {
      await prisma.loginEvent.create({
        data: {
          userId: userId,
          ip: ip || 'unknow',
          userAgent: 'unknow', // esto lo mejoraremos en la proxima iteracion
          result: 'FAILURE'
        }
      }) 
    } catch (error) {
      logger.error('Error recording failed attempt', error)
    }
  }

  // hacemos la "limpieza" despúes de login exitoso
  async clearFailedAttempts(ip, userId){
    try {
      // por ahora solo registraremos el login exitoso
      await prisma.loginEvent.create({
        data: {
          userId: userId,
          ip: ip || 'unknown',
          userAgent: 'unknown',
          result: 'SUCCESS'
        }
      }) 
    } catch (error) {
      logger.error('Error clearing failed attempts', error)
    }
  }





 async getUserForToken(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
        isActive: true, 
      },
      include: {
        globalRoles: { 
          include: { role: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    // 2. VÍA RÁPIDA: Si es un SuperAdmin, construye su payload y termina
    if (user.globalRoles && user.globalRoles.length > 0) {
      return {
        user_id: user.id,
        email: user.email,
        name: user.name,
        role: user.globalRoles[0].role.code, 
        permissions: ['*'],
        is_super_admin: true,
      };
    }

    // 3. VÍA NORMAL: Si es un usuario de empresa, busca sus datos de empresa
    const companyData = await prisma.companyUser.findFirst({
      where: {
        userId: user.id,
        company: { status: 'ACTIVE' },
      },
      include: {
        company: true,
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
      },
    });

    if (!companyData) {
      return null;
    }

    // payload del usuario de empresa
    const permissions = companyData.roles[0]?.role.permissions.map(p => p.permission.code) || [];

    return {
      user_id: user.id,
      email: user.email,
      name: user.name,
      company_id: companyData.company.id,
      company_name: companyData.company.nombreComercial,
      role: companyData.roles[0]?.role.code || 'viewer',
      permissions: permissions,
      is_admin: companyData.isAdmin, 
    };

  } catch (error) {
    logger.error('Error getting user for token', error);
    return null;
  }
}

  async getUserById(userId) {
    try {
      return await prisma.user.findUnique({
        where: { 
          id: userId,
          isActive: true 
        },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          companyUsers: {
            include: {
              company: {
                select: {
                  id: true,
                  nombreComercial: true,
                  status: true
                }
              }
            }
          }
        }
      });
    } catch (error) {
      logger.error('Error getting user by ID', error);
      return null;
    }
  }
}


module.exports = new AuthService();


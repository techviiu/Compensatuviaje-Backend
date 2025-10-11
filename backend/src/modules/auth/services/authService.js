/**
 * aquí manejaremos la lógica de negocio del modulo de auth
 * tambien (no seria lo correcto utilizando clean archt) acceder a la
 * BD desde el servicio talvez crar un nueva capa de abstrancción para accederla, 
 * tambien validaremso las credenciales.
 * Tambien gestionaremos los intentos fallidos 
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
   * 3: Verifcamos el ratelimiting   (cantidad de solicitudes)
   * 4: Comparamos el password previamente hasheado
   * 5: Actuliza ultimo login
   * 6: Retorna informacion completa del usuario
   */

  async authenticateUser(email, password, clientInfo = {}){
    try {

      // 1️ buscamos al usuario por correo en la BD
      const user = await prisma.user.findUnique({
        where: {
          email: email.toLoweCase().trim()
        },
        include: {
          companyUsers: {
            include: {
              company: {
                select: {
                  id: true,
                  nombreComercial: true,
                  razonSocial: true,
                  status: true,
                  slugPublico: true
                }
              },
              // roles de cada empresa
              roles: {
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: {
                          permission: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // user = none o null?
      if(!user){
        logger.warn('Authentication attempt with non-existent email', {
          email: email,
          iip: clientInfo.ip
        });
        throw new Error('Invalid crendentials ')
      }

      // user = inactivo?
      if(!user.isActive){
        logger.warn('Authentication attempt with inactive user', {
          user_id: user.id,
          email: user.email,
          ip: clientInfo.ip
        })
        throw new Error('Account is inactive');
      }

      // 2️ Verificamo al menos que tenga una empresa activa
      const activeCompanies = user.companyUsers.filter(
        cu => cu.company.status === 'ACTIVE'
      );

      if (activeCompanies.length === 0){
        logger.warn('User has no active companies', {
          user_id: user.id,
          email: email
        });

        throw new Error('No active companies associated');
      }

      // 3️  Vericamo el ratelimiting (intentos fallido)
      await this.checkRateLimiting(clientInfo.ip, user.id);

      // 4️  Verificamos el password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if(!isPasswordValid){
        await this.recordFailedAttempt(clientInfo.ip, user.id, 'INVALID_PASSWORD');
        logger.warn('✖️Authentication failed - invalidd password', {
          user_id: user.id,
          email: email,
          ip: clientInfo.ip
        })

        throw new Error('Invalid credentials');
      }

      // 5️ la autenticacion se completo con exito, entonces limpiamo 
      // los intento fallidos
      await this.clearFailedAttempts(clientInfo.ip, user.id);

      // 6️ Actualizamos el último login 
      await prisma.user.update({
        where: {id: user.id},
        data: {lastLoginAt: new Date()}
      })
      // 7️ Preparar info para el token
      // para el mvp estamos haciendo que para que un usuario tenga varios roles 
      // tenga que tener diferente cuentas
      const primaryCompanyUser = activeCompanies[0];
      const company = primaryCompanyUser.company;

      // extraemos permisos del primer rol (MVP simplificado)
      const permissions = primaryCompanyUser.roles.length > 0 ? primaryCompanyUser.roles[0].role.permissions.map(rp=>rp.permission.code) : [];


      const userInfo = {
        user_id: user.id,
        email: user.email,
        name: user.name,
        company_id: company.id,
        company_name: company.nombreComercial,
        role: primaryCompanyUser.role.length > 0 ? primaryCompanyUser.roles[0].role.code : 'viewer',
        permissions: permissions,
        is_admin : primaryCompanyUser.isAdmin,
        companies: activeCompanies.map(cu => ({
          id: cu.company.id,
          name: cu.company.nombreComercial,
          slug: cu.company.slugPublico,
          is_admin: cu.isAdmin
        }))
      };

      logger.info('User authenticated successfully', {
        user_id: user.id,
        company_id: comapany.id,
        ip: clientInfo.ip
      });

      return userInfo;

    } catch (error){
      if(error.message.includes('Invalid credentials') ||
      error.message.includes('Account is inactive') ||
      error.message.includes('No active companies') ||
      error.message.includes('Rate limit exceeded')) {
        throw error;
      }

      // error inesperado
      logger.error('Unexpected error during authentication', {
        email: email,
        error: error.message,
        stack: error.stack
      });

      throw new Error('Authentication service error');
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

  async checkRateLImiting(ip, userId = null){
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
          isActive: true 
        },
        include: {
          companyUsers: {
            where: {
              company: {
                status: 'ACTIVE'
              }
            },
            include: {
              company: {
                select: {
                  id: true,
                  nombreComercial: true,
                  status: true
                }
              },
              roles: {
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: {
                          permission: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!user || user.companyUsers.length === 0) {
        return null;
      }

       // Usar primera empresa activa (MVP)
      const primaryCompanyUser = user.companyUsers[0];
      const permissions = primaryCompanyUser.roles.length > 0 
        ? primaryCompanyUser.roles[0].role.permissions.map(rp => rp.permission.code)
        : [];

      return {
        user_id: user.id,
        email: user.email,
        name: user.name,
        company_id: primaryCompanyUser.company.id,
        company_name: primaryCompanyUser.company.nombreComercial,
        role: primaryCompanyUser.roles.length > 0 ? primaryCompanyUser.roles[0].role.code : 'viewer',
        permissions: permissions,
        is_admin: primaryCompanyUser.isAdmin
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


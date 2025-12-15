const authService = require('../services/authService');
const tokenService = require('../services/tokenService');
const auditService = require('../services/auditService');

const {validateLogin, validateRefresh, validateChangePassword} = require('../validators/authValidators'); 
const logger = require('../../../utils/logger'); 

class AuthController{
  async login(req, res){
    const startTime = Date.now();
    try {
      // 1️ validamos inputs
      const {error, value}  = validateLogin(req.body);
      if(error){
        logger.warn('Login validation failes', {
          errors: error.details,
          //ip: req.ip
        })

        return res.status(400).json(
          {
            success: false,
            error_code: 'VALIDATION_ERROR',
            error_message: 'Datos en entrada inválids',
            details: error.details.map(
              d =>({
                field: d.path.join('.'),
                message: d.message
              })
            )
          }
        );
      }

      const {email, password, remember_me = false} = value;
      //  2 Extraemos info del cliente
      const clientInfo = {
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        user_agent: req.get('User-Agent') || 'unknown',
        timestamp: new Date().toISOString()
      }

      logger.info('Login attempt started', {
        email:email,
        ip: clientInfo.ip,
        user_agent: clientInfo.user_agent
      })

      // 3️ atenticamos al usuario
      const userInfo  = await authService.authenticateUser(email, password, clientInfo)

      // 4️ generamos token jwt
      const accessToken = tokenService.generateAccessToken(userInfo);
      const refreshToken = tokenService.generateRefreshToken(userInfo.user_id);

      const expiresIn = 15 * 60; // 15 min

      // 6️ Registrar evento de auditoria
      await auditService.logEvent({
        user_id: userInfo.user_id,
        company_id: userInfo.company_id,
        action: 'LOGIN_SUCCESS',
        entity_type: 'auth',
        entity_id: userInfo.user_id,
        details: {
          ip: clientInfo.ip,
          user_agent: clientInfo.user_agent,
          remember_me: remember_me
          // para que se mas completo aqui deveria el metodo de login
        }
      });

      // 7️ respuesta exitosa
      const duration = Date.now() - startTime;

      logger.info('Login successful', {
        user_id: userInfo.user_id,
        company_id: userInfo.company_id,
        duration_ms: duration
      });

      res.status(200).json({
        success: true,
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_id: expiresIn,
        user_info: {
          user_id: userInfo.user_id,
          email: userInfo.email,
          name: userInfo.name,
          company_id: userInfo.company_id,
          company_name: userInfo.company_name,
          role:userInfo.role,
          permissions:userInfo.permissions,
          is_admin: userInfo.is_admin
        },
        meta : {
          login_time : new Date().toISOString(),
          expires_at: new Date(Date.now() + (expiresIn * 1000)).toISOString()
        }
      })
    } catch (error) {
      const duration = Date.now() - startTime;
      
      if (error.message.includes('Invalid credentials')) {
        logger.warn('Login failed - invalid credentials', { 
          duration_ms: duration,
          ip: req.ip 
        });
        
        return res.status(401).json({
          success: false,
          error_code: 'INVALID_CREDENTIALS',
          error_message: 'Email o contraseña incorrectos'
        });
      }

      if (error.message.includes('Rate limit exceeded') || error.message.includes('Account temporarily locked')) {
        logger.warn('Login failed - rate limited', { 
          error: error.message,
          duration_ms: duration,
          ip: req.ip 
        });
        
        return res.status(429).json({
          success: false,
          error_code: 'RATE_LIMIT_EXCEEDED',
          error_message: error.message,
          retry_after: 15 * 60 // 15 minutos en segundos
        });
      }

      if (error.message.includes('Account is inactive')) {
        return res.status(403).json({
          success: false,
          error_code: 'ACCOUNT_INACTIVE',
          error_message: 'Cuenta inactiva. Contacte al administrador.'
        });
      }

      if (error.message.includes('No active companies')) {
        return res.status(403).json({
          success: false,
          error_code: 'NO_ACTIVE_COMPANIES',
          error_message: 'No tiene empresas activas asociadas.'
        });
      }

      // error sistema
      logger.error('Login system error', { 
        error: error.message,
        stack: error.stack,
        duration_ms: duration,
        ip: req.ip 
      });

      res.status(500).json({
        success: false,
        error_code: 'SYSTEM_ERROR',
        error_message: 'Error interno del sistema. Intente nuevamente',
        support_contact: 'support@compensatuviaje.com'
      });
    }
  }
  /**
   * POST  /api/auth/refresh
   * 
   * renueva acccess token usando refresh token, para no loguearse cada 15 min
   */

  async refresh(req, res){
    try {
      // 1️ Validamos imputs
      const {error, value} = validateRefresh(req.body);
      if(error){
        return res.status(400).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          error_message: 'Refresh token requerido'
        });
      }

      // desestructuracion al 2do nivel
      const {refresh_token} = value

      // 2️ renovar tokens
      const result = await tokenService.renewTokens(refresh_token, authService);

      // 3️ Registrar evento
      await auditService.logEvent({
        user_id: result.user_info.user_id,
        company_id: result.user_info.company_id,
        action: 'TOKEN_REFRESH',
        entity_type: 'auth',
        entity_id: result.user_info.user_id,
        details: {
          ip: req.ip,
          user_agent: req.get('User-Agent')
        }
      });

      res.status(200).json({
        success: true,
        access_token: result.access_token,
        refresh_token: result.refresh_token, // falta evaluar esto  aun
        token_type: 'Bearer',
        expires_in: result.expires_in,
        user_info: result.user_info
      });

    } catch (error) {
      if (error.message.includes('Invalid refresh token') || error.message.includes('Token is not a refresh token')) {
        return res.status(401).json({
          success: false,
          error_code: 'INVALID_REFRESH_TOKEN',
          error_message: 'Refresh token inválido. Inicie sesión nuevamente.'
        });
      }

      if (error.message.includes('User not found')) {
        return res.status(401).json({
          success: false,
          error_code: 'USER_NOT_FOUND',
          error_message: 'Usuario no encontrado. Inicie sesión nuevamente.'
        });
      }

      logger.error('Token refresh error', { 
        error: error.message,
        ip: req.ip 
      });

      res.status(500).json({
        success: false,
        error_code: 'SYSTEM_ERROR',
        error_message: 'Error al renovar token'
      });
    }
  }


  /**
   *  POST  /api/auth/logout
   * 
   * cerramos la sesion y tachamos el token
   * 
   * 
   */
   async logout(req, res) {
    try {
      const userId = req.user?.user_id;
      const companyId = req.user?.company_id;

      //  MVP REAL INCLUIRÍA:
      // 1. Agregar token actual a blacklist
      // await tokenService.blacklistToken(req.token);
      // 
      // 2. Opcional: Cerrar todas las sesiones
      // if (req.body.logout_all_devices) {
      //   await tokenService.blacklistAllUserTokens(userId);
      // }
      // 
      // 3. Limpiar cookies
      // res.clearCookie('refresh_token');

      // Registramos evento de auditoría
      if (userId) {
        await auditService.logEvent({
          user_id: userId,
          company_id: companyId,
          action: 'LOGOUT',
          entity_type: 'auth',
          entity_id: userId,
          details: {
            ip: req.ip,
            user_agent: req.get('User-Agent'),
          }
        });
      }

      res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente'
      });

    } catch (error) {
      logger.error('Logout error', { 
        error: error.message,
        user_id: req.user?.user_id 
      });

      res.status(200).json({
        success: true,
        message: 'Sesión cerrada'
      });
    }
  }

  /**
   * GET  api/auth/me
   * 
   * Obtiene ifo del usuario actual
   * para verifcar el estado de sesion y datos actualizado como perfil
   */

  async me(req, res){
    try {
      const userid = req.user.user_id;

      const userInfo = await authService.getUserForToken(userId);

      // se econtró la info?
      if(!userInfo){
        return res.status(401).json({
          success: false,
          error_code: 'USER_NOT_FOUND',
          error_message: 'Usuario no encontrado o inactivo'
        });
      }

      res.status(200).json({
        success: true,
        user_info: userInfo
        // falata mas info como session_info y securty_info
      });

    } catch (error) {
      logger.error('Get current user error', {
        error: error.message,
        user_id: req.user?.user_id
      });

      res.status(500).json({
        success: false,
        error_code: 'SYSTEM_ERROR',
        error_message: 'Error al obtener información del usuario'
      })
    }
  }


  /**
   *  POST /api/auth/change-password
   * 
   * Cambiar contraseña  del usuario actual
   *  necesita contraseña actual para verificacion
   */

  async changePassword(req, res){
    try {

      const  {error, value} = validateChangePassword(req.body);
      if(error){
        return res.status(400).json({
          success: false,
          error_code: 'VALIDATION_ERROR',
          error_message: 'Datos de entrada invádios',
          details: error.details.map(d => d.message)
        })
      }

      // MVP REAL INCLUIRÍA 
      // 1. Verificar política de contraseñas avanzada
      // 2. Verificar historial de contraseña
      // 3. Verificar contraseñas comprometidas

      // Por ahora, implementación básica pendiente...

      res.status(501).json({
        success: false,
        error_code: 'NOT_IMPLEMENTED',
        error_message: 'Funcionalidad pendiente de implementación'
      });

      const {current_password, new_password, force_logout_other_sessions = true} = value

      const userId = req.user.user_id;


    } catch (error) {
      logger.error('Change password failed', {
        error: error.message,
        user_id: req.user?.user_id
      });
      res.status(500).json({
        success: false,
        error_code: 'SYSTEM_ERROR',
        error_message: 'Error al cambiar contraseña'
      });
    }
  }
}

// Crear instancia y exportar métodos individuales
const authController = new AuthController();

module.exports = {
  login: authController.login.bind(authController),
  refresh: authController.refresh.bind(authController),
  logout: authController.logout.bind(authController),
  me: authController.me.bind(authController),
  changePassword: authController.changePassword.bind(authController)
};
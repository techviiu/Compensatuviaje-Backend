

const { verifyToken, getGoogleAuthUrl, exchangeCodeForSession, signOut } = require('../services/supabaseService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class B2cAuthController {

  /**
   * GET /api/public/b2c/auth/google-url
   * 
   * Genera la URL para iniciar login con Google.
   * El frontend debe redirigir al usuario a esta URL.
   * 
   * Query params:
   * - redirect: URL del frontend donde volver después del login
   */
  async getGoogleUrl(req, res) {
    try {
      // URL donde el frontend recibirá el callback
      const redirectTo = req.query.redirect || process.env.FRONTEND_B2C_URL || 'http://localhost:5173/auth/callback';
      
      const url = await getGoogleAuthUrl(redirectTo);
      
      return res.json({
        success: true,
        data: {
          url: url,
          provider: 'google',
          message: 'Redirige al usuario a esta URL para iniciar login'
        }
      });
    } catch (error) {
      console.error('[B2cAuth] Error generando URL de Google:', error);
      return res.status(500).json({
        success: false,
        error_code: 'OAUTH_URL_ERROR',
        message: 'Error generando URL de autenticación'
      });
    }
  }

  async verifyToken(req, res) {
    try {
      const { access_token } = req.body;

      if (!access_token) {
        return res.status(400).json({
          success: false,
          error_code: 'MISSING_TOKEN',
          message: 'access_token es requerido'
        });
      }

      // 1. Verificar token con Supabase
      let supabaseUser;
      try {
        supabaseUser = await verifyToken(access_token);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error_code: 'INVALID_TOKEN',
          message: 'Token inválido o expirado'
        });
      }

      // 2. Buscar o crear usuario en nuestra BD
      let b2cUser = await prisma.b2cUser.findUnique({
        where: { supabaseUid: supabaseUser.id }
      });

      let isNewUser = false;

      if (!b2cUser) {
        // Primer login - crear usuario
        isNewUser = true;
        console.log('[B2cAuth] Nuevo usuario B2C:', supabaseUser.email);

        b2cUser = await prisma.b2cUser.create({
          data: {
            supabaseUid: supabaseUser.id,
            email: supabaseUser.email,
            nombre: supabaseUser.user_metadata?.full_name || 
                    supabaseUser.user_metadata?.name || 
                    supabaseUser.email.split('@')[0],
            avatarUrl: supabaseUser.user_metadata?.avatar_url || 
                       supabaseUser.user_metadata?.picture || 
                       null,
            provider: 'google',
            lastLoginAt: new Date()
          }
        });
      } else {
        // Usuario existente - actualizar último login
        b2cUser = await prisma.b2cUser.update({
          where: { id: b2cUser.id },
          data: { lastLoginAt: new Date() }
        });
      }

      // 3. Responder con datos del usuario
      return res.json({
        success: true,
        message: isNewUser ? 'Usuario registrado exitosamente' : 'Login exitoso',
        data: {
          user: {
            id: b2cUser.id,
            email: b2cUser.email,
            nombre: b2cUser.nombre,
            avatarUrl: b2cUser.avatarUrl,
            preferredCurrency: b2cUser.preferredCurrency,
            preferredLanguage: b2cUser.preferredLanguage,
            totalEmissionsKg: b2cUser.totalEmissionsKg,
            totalCompensatedKg: b2cUser.totalCompensatedKg,
            totalFlights: b2cUser.totalFlights,
            createdAt: b2cUser.createdAt
          },
          isNewUser: isNewUser,
          provider: 'google'
        }
      });
    } catch (error) {
      console.error('[B2cAuth] Error verificando token:', error);
      return res.status(500).json({
        success: false,
        error_code: 'VERIFY_ERROR',
        message: 'Error verificando autenticación'
      });
    }
  }


  async getMe(req, res) {
    try {
      // El middleware ya inyectó el usuario
      const b2cUser = req.b2cUser;

      if (!b2cUser) {
        return res.status(401).json({
          success: false,
          error_code: 'NOT_AUTHENTICATED',
          message: 'Usuario no autenticado'
        });
      }

      // Obtener datos actualizados con estadísticas
      const user = await prisma.b2cUser.findUnique({
        where: { id: b2cUser.id },
        include: {
          _count: {
            select: {
              calculations: true,
              certificates: true,
              badges: true,
              savedTrips: true
            }
          }
        }
      });

      return res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            avatarUrl: user.avatarUrl,
            preferredCurrency: user.preferredCurrency,
            preferredLanguage: user.preferredLanguage,
            newsletterOptIn: user.newsletterOptIn,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt
          },
          stats: {
            totalEmissionsKg: user.totalEmissionsKg,
            totalCompensatedKg: user.totalCompensatedKg,
            totalFlights: user.totalFlights,
            calculationsCount: user._count.calculations,
            certificatesCount: user._count.certificates,
            badgesCount: user._count.badges,
            savedTripsCount: user._count.savedTrips
          }
        }
      });
    } catch (error) {
      console.error('[B2cAuth] Error obteniendo usuario:', error);
      return res.status(500).json({
        success: false,
        error_code: 'GET_USER_ERROR',
        message: 'Error obteniendo datos del usuario'
      });
    }
  }

  /**
   * POST /api/b2c/auth/logout
   * 
   * Cerrar sesión del usuario.
   * En realidad el logout lo maneja el frontend con Supabase,
   * pero este endpoint permite limpiar cosas del backend si es necesario.
   */
  async logout(req, res) {
    try {
      // Por ahora solo respondemos OK
      // El frontend debe llamar a supabase.auth.signOut()
      
      return res.json({
        success: true,
        message: 'Sesión cerrada. Recuerda llamar a supabase.auth.signOut() en el frontend.'
      });
    } catch (error) {
      console.error('[B2cAuth] Error en logout:', error);
      return res.status(500).json({
        success: false,
        error_code: 'LOGOUT_ERROR',
        message: 'Error cerrando sesión'
      });
    }
  }
}

module.exports = new B2cAuthController();

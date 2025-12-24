

const { verifyToken } = require('../services/supabaseService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const authenticateB2c = async (req, res, next) => {
  try {
    // 1. Extraer token del header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error_code: 'MISSING_TOKEN',
        message: 'Token de autorización requerido'
      });
    }

    // Verificar formato "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        error_code: 'INVALID_TOKEN_FORMAT',
        message: 'Formato de token inválido. Use: Bearer <token>'
      });
    }

    const token = parts[1];

    // 2. Verificar token con Supabase
    let supabaseUser;
    try {
      supabaseUser = await verifyToken(token);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error_code: 'INVALID_TOKEN',
        message: 'Token inválido o expirado'
      });
    }

    // 3. Buscar usuario en nuestra BD
    let b2cUser = await prisma.b2cUser.findUnique({
      where: { supabaseUid: supabaseUser.id }
    });

    // 4. Si no existe, crear automáticamente (primer login)
    if (!b2cUser) {
      console.log('[AuthB2C] Creando nuevo usuario B2C:', supabaseUser.email);
      
      b2cUser = await prisma.b2cUser.create({
        data: {
          supabaseUid: supabaseUser.id,
          email: supabaseUser.email,
          nombre: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
          avatarUrl: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture || null,
          provider: 'google', // Por ahora solo Google
          lastLoginAt: new Date()
        }
      });
    } else {
      // Actualizar último login
      await prisma.b2cUser.update({
        where: { id: b2cUser.id },
        data: { lastLoginAt: new Date() }
      });
    }

    // 5. Inyectar usuario en request
    req.b2cUser = b2cUser;
    req.supabaseUser = supabaseUser; // Por si necesitamos datos adicionales

    next();
  } catch (error) {
    console.error('[AuthB2C] Error en middleware:', error);
    return res.status(500).json({
      success: false,
      error_code: 'AUTH_ERROR',
      message: 'Error interno de autenticación'
    });
  }
};

const optionalAuthenticateB2c = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Si no hay token, continuar sin usuario
    if (!authHeader) {
      req.b2cUser = null;
      return next();
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      req.b2cUser = null;
      return next();
    }

    const token = parts[1];

    // Intentar verificar token
    try {
      const supabaseUser = await verifyToken(token);
      
      const b2cUser = await prisma.b2cUser.findUnique({
        where: { supabaseUid: supabaseUser.id }
      });

      req.b2cUser = b2cUser;
      req.supabaseUser = supabaseUser;
    } catch (error) {
      // Token inválido, continuar sin usuario
      req.b2cUser = null;
    }

    next();
  } catch (error) {
    console.error('[AuthB2C] Error en middleware opcional:', error);
    req.b2cUser = null;
    next();
  }
};

module.exports = {
  authenticateB2c,
  optionalAuthenticateB2c
};

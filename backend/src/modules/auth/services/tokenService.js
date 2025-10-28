const jwt = require('jsonwebtoken');
const {v4: uuidv4} = require('uuid');
const config = require('../../../config/jwt')
const logger = require('../../../utils/logger')

class TokenService{
  /**
   * genera un Access Token 
   * user_id
   * company_id
   * role
   * permissions: Arraya de permisos de específicos
   * jti: jwt id único para tracking
   */
generateAccessToken(payload) {
  try {
    // Objeto base con la información común para todos los usuarios
    const basePayload = {
      user_id: payload.user_id,
      email: payload.email,
      role: payload.role,
      permissions: payload.permissions || [],
      is_super_admin: payload.is_super_admin || false,
    };

   
    const tokenPayload = {
      ...basePayload,
      ...(!payload.is_super_admin && { company_id: payload.company_id }),

      jti: uuidv4(),
      token_type: 'access',
      iat: Math.floor(Date.now() / 1000),
      iss: config.issuer,
      aud: config.audience
    };

    const token = jwt.sign(tokenPayload, config.secret, {
      expiresIn: config.accessTokenExpiry,
      algorithm: 'HS256'
    });

    const logMetadata = {
      user_id: payload.user_id,
      jti: tokenPayload.jti,
      ...(tokenPayload.company_id && { company_id: tokenPayload.company_id }) 
    };

    logger.info(`Access token generated for user ${payload.user_id}`, logMetadata);
    
    return token;

  } catch (error) {
    logger.error('Error generating access token', error);
    throw new Error('Token generation failed');
  }
}

  generateRefreshToken(userId){
    try {
      const tokenPayload = {
        user_id : userId,
        token_type: 'refresh',
        jti: uuidv4(),
        iat: Math.floor(Date.now()/1000),
        iss: config.issuer,
        aud: config.audience
      }
      

      const token = jwt.sign(tokenPayload, config.secret, {
        expiresIn: config.refreshTokenExpiry,
        algorithm: 'HS256'
      })

      logger.info(`Refreh token generated for user ${userId}`, {
        user_id: userId,
        jti: tokenPayload.jti
      });

      return token;
      
    } catch (error) {
      logger.error('Error generating refrsh token', error) 
      throw new Error('Refresh token generation failed')
    }
  }

  /**
   * validaremos las firmas token
   * si no fue moficado, alterado y estructura
   */
  validateToken(token){
    try {
      // verifcamso que sea el correcto
      const decoded = jwt.verify(token, config.secret, {
        issuer: config.issuer,
        audience: config.audience
      }); 

      // verificamso si es la estructura requerida
      if(!decoded.user_id || !decoded.token_type){
        throw new Error('Invalida token estructure');
      }
      logger.info(`Token validate for user ${decoded.user_id}`, {
        user_id: decoded.user_id,
        token_type: decoded.token_type,
        jti: decoded.jti
      })

      return {
        valid: true,
        decoded, // peligro
        expired: false
      }
    } catch (error) {
      // manejamos diferente tipos de error
      if(error.name === 'TokenExpiredError'){
        logger.warn('Token expired', {error: error.message});
        return {
          valid: false,
          decoded:null,
          expired: true,
          error: 'Token expired'
        }
      }
      if(error.name === 'JsonWebTokenError'){
        logger.warn('Invalid token', {
          error: error.message
        });
        return {
          valid: false,
          decoded: null,
          expired: false,
          error: 'invalid token'
        };
      }

      logger.error('Token validation error', error);
      return {
        valid: false,
        decoded: null,
        expired: false,
        error: 'Token validation failed'
      };
    }
  }

  // para debugin, creamo una 
  // funcion que decodifique que
  // estamos enviando en el token, pero no valida
  decodedToken(token){
    try {
      return jwt.decode(token) 
    } catch (error) {
      logger.error('Error decoding token:', error) 
      return null;
    }
  }

  async renewTokens(refreshToken, authService){
    try {

      // obtenemos el refresh token y validamos que sea el 
      const validation = this.validateToken(refreshToken) 
      if(!validation.valid){
        throw new Error('Invalida refresh token');
      }
      if(validation.decoded.token_type !== 'refresh'){
        throw new Error('Token is not a refresh token')
      }

      // obtenemos informacion actualizada del usuario
      const userInfo = await authService.getUserForToken(validation.decoded.user_id);

      if(!userInfo){
        throw new Error('User not found or inative')
      }

      // Generamos nuevos tokens
      const newAccessToken = this.generateAccessToken(userInfo);
      const newRefreshToken = this.generateRefreshToken(userInfo.user_id);

      logger.info(`tokens renewed for user ${userInfo.user_id}`, {
        user_id: userInfo.user_id,
        old_jti: validation.decoded.jti // peligro
      });

      return {
        access_token: newAccessToken,
        refreshToken: newRefreshToken,
        expires_in: 9000, // 15 minuto en milisegundo
        user_info: userInfo
      }


    } catch (error) {
      logger.error('Error renewing token', error.message) 
      throw error;
    }
  }
}

module.exports = new TokenService();
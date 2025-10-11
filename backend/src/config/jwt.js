module.exports = {
  secret: process.env.JWT_SECRET,
  
  // ⏰ Tiempos de expiración
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY,
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY,
  
  issuer: process.env.JWT_ISSUER,
  
  audience: process.env.JWT_AUDIENCE || 'compensatuviaje-app',

  options: {
    algorithm: 'HS256', 
    expiresIn: '15m'    
  }
};


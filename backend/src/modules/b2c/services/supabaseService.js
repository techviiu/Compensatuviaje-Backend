
// Usa el SDK oficial de Supabase para verificar tokens (RS256).


const { createClient } = require('@supabase/supabase-js');

// Crear cliente de Supabase con service_role para operaciones del backend
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Cliente público (para generar URLs de OAuth)
const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Verificar token de acceso de Supabase
 * 
 * @param {string} token - Access token de Supabase
 * @returns {object} - Datos del usuario de Supabase
 * @throws {Error} - Si el token es inválido o expirado
 */
const verifyToken = async (token) => {
  // Usamos getUser() que verifica el token internamente
  const { data, error } = await supabase.auth.getUser(token);
  
  if (error) {
    console.error('[SupabaseService] Error verificando token:', error.message);
    throw new Error(error.message);
  }
  
  if (!data.user) {
    throw new Error('Usuario no encontrado en token');
  }
  
  return data.user;
};

/**
 * Generar URL para login con Google
 * 
 * @param {string} redirectTo - URL de redirección después del login
 * @returns {string} - URL para iniciar OAuth con Google
 */
const getGoogleAuthUrl = async (redirectTo) => {
  const { data, error } = await supabasePublic.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectTo,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });
  
  if (error) {
    console.error('[SupabaseService] Error generando URL de Google:', error.message);
    throw new Error(error.message);
  }
  
  return data.url;
};

/**
 * Obtener sesión desde código de autorización
 * (Usado cuando el callback viene con code en lugar de token)
 * 
 * @param {string} code - Código de autorización de OAuth
 * @returns {object} - Session con access_token y user
 */
const exchangeCodeForSession = async (code) => {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  
  if (error) {
    console.error('[SupabaseService] Error intercambiando código:', error.message);
    throw new Error(error.message);
  }
  
  return data;
};

/**
 * Cerrar sesión (revocar token)
 * 
 * @param {string} token - Access token a revocar
 */
const signOut = async (token) => {
  // Nota: Con service_role podemos invalidar cualquier sesión
  const { error } = await supabase.auth.admin.signOut(token);
  
  if (error) {
    console.error('[SupabaseService] Error cerrando sesión:', error.message);
    // No lanzamos error, logout siempre debe "funcionar" del lado del cliente
  }
};

module.exports = {
  supabase,
  supabasePublic,
  verifyToken,
  getGoogleAuthUrl,
  exchangeCodeForSession,
  signOut
};

# 🚀 Variables de Entorno para SeeNode

## ⚠️ IMPORTANTE: Logger corregido

El logger ahora funciona correctamente en SeeNode:
- ✅ **Producción**: Solo usa `Console` (stdout/stderr) - SeeNode captura esto automáticamente
- ✅ **Desarrollo**: Usa `Console` + archivos de log locales
- ✅ Sin errores de "Failed to fetch logs"

---

## 📋 Variables Requeridas en SeeNode

Copia estas en el panel de **Environment Variables** de SeeNode:

```bash
# ==========================================
# DATABASE (PostgreSQL de SeeNode o externa)
# ==========================================
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# ==========================================
# JWT & SECURITY
# ==========================================
JWT_SECRET=super-secret-key-compensatuviaje-2025-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
JWT_ISSUER=compensatuviaje.com
JWT_AUDIENCE=compensatuviaje-audience-airline
BCRYPT_ROUNDS=12
SESSION_SECRET=session-secret-key-2025-production

# ==========================================
# REDIS (Opcional - deja false si no usas)
# ==========================================
REDIS_ENABLED=false
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ==========================================
# RATE LIMITING
# ==========================================
LOGIN_ATTEMPTS_MAX=5
LOGIN_LOCKOUT_MINUTES=15
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100

# ==========================================
# SERVER
# ==========================================
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://tu-frontend.com

# ==========================================
# FILE UPLOAD
# ==========================================
MAX_FILE_SIZE=10485760
MAX_ROWS_PER_FILE=10000
UPLOAD_PATH=./uploads

# ==========================================
# LOGGING (SIN archivos, solo Console)
# ==========================================
LOG_LEVEL=info
# LOG_FILE ya NO se usa en producción (solo console)

# ==========================================
# BUSINESS
# ==========================================
AUDIT_RETENTION_DAYS=90
EMISSION_FACTOR_VERSION=1.0

# ==========================================
# EMAIL (tus credenciales actuales)
# ==========================================
SMTP_HOST=s470.v2nets.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=infrastructure@compensatuviaje.com
SMTP_PASS=+_BZ5KHqtXRSfOWZ
FROM_NAME="CompensaTuViaje"
FROM_EMAIL=infrastructure@compensatuviaje.com

# ==========================================
# SUPERADMIN (⚠️ CAMBIA LA PASSWORD!)
# ==========================================
FIRST_SUPER_ADMIN_EMAIL=superadmin@compensatuviaje.com
FIRST_SUPER_ADMIN_PASSWORD=TuPasswordSeguro2025!
```

---

## 🔧 Configuración en Panel SeeNode

### Build Settings:
```bash
Build Command: npm install
Start Command: npm run seenode:start
```

### Environment:
- NODE_ENV: `production`
- LOG_LEVEL: `info` (o `warn` para menos logs)

---

## ✅ ¿Cómo funciona el Logger ahora?

### En Desarrollo (local):
```javascript
// Logs van a:
// 1. Console (terminal)
// 2. logs/app.log
// 3. logs/error.log
```

### En Producción (SeeNode):
```javascript
// Logs van SOLO a:
// 1. Console (stdout/stderr)
// SeeNode captura esto automáticamente en su dashboard
```

---

## 📊 Ver Logs en SeeNode

1. Ve al Dashboard de tu proyecto
2. Click en **"Logs"** o **"Runtime Logs"**
3. Verás todos los logs en tiempo real
4. Formato JSON para mejor parsing

Ejemplo de log en SeeNode:
```json
{
  "timestamp": "2025-01-29 10:30:45",
  "level": "info",
  "message": "Server started",
  "port": 3001,
  "environment": "production"
}
```

---

## 🐛 Solución al Error "Failed to fetch logs"

**Causa**: El logger intentaba crear carpeta `/logs` en sistema de archivos de SeeNode (read-only)

**Solución Aplicada**:
✅ Logger detecta automáticamente si está en producción
✅ En producción: NO crea archivos, solo usa Console
✅ SeeNode captura stdout/stderr automáticamente
✅ Sin errores de permisos

---

## 🚀 Deploy

```bash
git add .
git commit -m "fix: logger optimizado para SeeNode (solo console en producción)"
git push origin main
```

SeeNode detectará el push y deployará automáticamente.

---

## ✅ Verificar Deploy

Después del deploy, en los logs de SeeNode deberías ver:

```
📦 Generando Prisma Client...
🔄 Ejecutando migraciones...
🌱 Ejecutando seed...
✅ Seed completado
🚀 Iniciando servidor...
✅ Server started on port 3001
```

**Sin** el error `Failed to fetch logs` ❌

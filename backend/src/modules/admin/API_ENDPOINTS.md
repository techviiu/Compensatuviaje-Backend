# Admin Module - API Endpoints

## Base URL
`/api/admin/*` - Requiere autenticación JWT + rol SuperAdmin

## Middleware
- `authenticate` - Verificación de token JWT
- `requireSuperAdmin` - Verificación de rol global `super_admin`

---

## 📊 Dashboard
Base: `/api/admin/dashboard`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Dashboard principal con métricas |
| GET | `/metrics` | Series temporales para gráficos |
| GET | `/companies-stats` | Estadísticas detalladas de empresas |
| GET | `/company/:id` | Dashboard de empresa específica |

### Query Parameters
- `period`: `7d`, `30d`, `90d`, `365d`, `ytd`
- `groupBy`: `day`, `week`, `month`

---

## 🏢 Empresas B2B
Base: `/api/admin/companies`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Lista paginada de empresas |
| GET | `/stats` | Estadísticas globales |
| GET | `/:id` | Detalle de empresa |
| PUT | `/:id/status` | Cambiar estado de empresa |
| GET | `/:id/documents` | Documentos de verificación |
| PUT | `/:id/documents/:docId/review` | Revisar documento |
| GET | `/:id/timeline` | Timeline de eventos |

### Estados de Empresa (CompanyStatus)
- `registered` → `pending_contract`
- `pending_contract` → `signed`
- `signed` → `active`
- `active` → `suspended`
- `suspended` → `active`

### Body para cambio de estado
```json
{
  "status": "active",
  "reason": "Documentación verificada correctamente"
}
```

### Query Parameters (listado)
- `page`, `limit`, `search`, `status`, `sortBy`, `sortOrder`

---

## 👤 Usuarios B2C
Base: `/api/admin/b2c`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/users` | Lista paginada de usuarios |
| GET | `/users/:id` | Detalle de usuario |
| GET | `/users/:id/activity` | Historial de actividad |
| GET | `/stats` | Estadísticas globales B2C |

### Query Parameters
- `page`, `limit`, `search`, `status`, `hasCompensations`
- `sortBy`, `sortOrder`, `dateFrom`, `dateTo`
- `period`: `7d`, `30d`, `90d`, `365d`

---

## 🌱 Proyectos ESG
Base: `/api/admin/projects`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Lista paginada de proyectos |
| GET | `/stats` | Estadísticas globales |
| POST | `/` | Crear proyecto |
| GET | `/:id` | Detalle de proyecto |
| PUT | `/:id` | Actualizar proyecto |
| PUT | `/:id/status` | Cambiar estado |
| DELETE | `/:id` | Eliminar (soft delete) |
| GET | `/:id/pricing` | Historial de precios |
| POST | `/:id/pricing` | Agregar versión de precio |
| PUT | `/:id/pricing/:pricingId/activate` | Activar precio |
| POST | `/:id/evidences` | Agregar evidencia |
| DELETE | `/:id/evidences/:evidenceId` | Eliminar evidencia |

### Estados de Proyecto (ProjectStatus)
- `pending`, `active`, `inactive`, `archived`

### Body para crear proyecto
```json
{
  "code": "PROJ-001",
  "name": "Reforestación Amazonas",
  "description": "...",
  "projectType": "reforestation",
  "country": "BR",
  "region": "Amazonas",
  "providerOrganization": "Amazon Forest Foundation",
  "certification": "Gold Standard",
  "totalTonsAvailable": 10000,
  "basePriceUsdPerTon": 15.00,
  "marginPercent": 20
}
```

### Body para agregar precio
```json
{
  "basePriceUsdPerTon": 16.50,
  "marginPercent": 25,
  "effectiveFrom": "2025-02-01",
  "reason": "Ajuste por inflación"
}
```

---

## 📈 Reportes
Base: `/api/admin/reports`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/emissions` | Reporte de emisiones |
| GET | `/financial` | Reporte financiero |
| GET | `/companies` | Reporte de empresas |
| GET | `/b2c` | Reporte de usuarios B2C |
| GET | `/export` | Exportar a CSV/Excel |

### Query Parameters
- `period`: `7d`, `30d`, `90d`, `365d`, `ytd`
- `groupBy`: `company`, `project`, `time`, `type`, `month`, `source`
- `dateFrom`, `dateTo`
- `companyId`, `projectId`

### Export Parameters
- `reportType`: `emissions`, `financial`, `companies`, `b2c`, `projects`
- `format`: `csv`, `excel` (default: csv)

---

## ✅ Verificaciones
Base: `/api/admin/verification`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/pending` | Verificaciones pendientes |
| GET | `/stats` | Estadísticas de verificación |
| PUT | `/domains/:id/verify` | Verificar dominio |

---

## 🔒 Rate Limiting

| Endpoint | Límite |
|----------|--------|
| `/companies/:id/status` | 10 req / 5 min |
| `/verification/*` | 20 req / 5 min |
| `/dashboard/*` | 30 req / 1 min |

---

## Respuestas Estándar

### Éxito
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

### Error
```json
{
  "success": false,
  "message": "Descripción del error",
  "code": "ERROR_CODE"
}
```

### Paginación
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

---

## Modelos Prisma Utilizados

- `Company` - Empresas B2B
- `CompanyDocument` - Documentos de verificación
- `CompanyVerificationEvent` - Timeline de verificación
- `B2cUser` - Usuarios B2C
- `B2cCalculation` - Cálculos de emisiones B2C
- `EsgProject` - Proyectos ESG
- `ProjectPricingVersion` - Versiones de precios
- `ProjectEvidence` - Evidencias de proyectos
- `Certificate` - Certificados emitidos
- `CertificateProject` - Relación certificado-proyecto
- `AuditLog` - Registro de auditoría

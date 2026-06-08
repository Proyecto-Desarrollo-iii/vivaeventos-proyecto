# Pruebas de Control de Acceso — PFD3-42

## 1. Mapeo de Roles (Auth — Unit Test)

| # | Entrada | Salida esperada | Estado |
|---|---------|-----------------|--------|
| 1 | `"CLIENTE"` / `"CLIENT"` | `"CLIENT"` | ✅ |
| 2 | `"ORGANIZADOR"` / `"ORGANIZER"` | `"ORGANIZER"` | ✅ |
| 3 | `"ADMIN"` / `"ADMINISTRADOR"` | `"ADMIN"` | ✅ |
| 4 | `"GERENTE"` | `"ADMIN"` | ✅ |
| 5 | `"LOGISTICA"` / `"LOGISTICS"` | `"LOGISTICA"` | ✅ |
| 6 | `null` o desconocido | `"CLIENT"` | ✅ |

Ver: `UsuarioServiceImplTest.java` (`mvn test` en vivaeventos-auth)

## 2. Validación de Roles en Gateway (Manual)

### Prerrequisitos
- Todos los servicios levantados (gateway puerto 8090, auth 8083, orders 8083)
- Obtener JWT para cada rol (CLIENT, ORGANIZER, ADMIN, LOGISTICA)

### 2.1 Promocodes (solo ORGANIZER, ADMIN)
```bash
# CLIENT intenta crear promocode → 403
curl -X POST http://localhost:8090/api/v1/promocodes \
  -H "Authorization: Bearer $TOKEN_CLIENT" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST","discount":10}'

# ORGANIZER crea promocode → 200
curl -X POST http://localhost:8090/api/v1/promocodes \
  -H "Authorization: Bearer $TOKEN_ORGANIZER" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST","discount":10}'

# LOGISTICA intenta → 403
curl -X POST http://localhost:8090/api/v1/promocodes \
  -H "Authorization: Bearer $TOKEN_LOGISTICA" \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST","discount":10}'
```

### 2.2 Checkin (solo LOGISTICA, ORGANIZER, ADMIN)
```bash
# CLIENT intenta validar checkin → 403
curl -X POST http://localhost:8090/api/v1/checkin/validate \
  -H "Authorization: Bearer $TOKEN_CLIENT" \
  -H "Content-Type: application/json" \
  -d '{"code":"TICKET-123"}'

# LOGISTICA valida → 200
curl -X POST http://localhost:8090/api/v1/checkin/validate \
  -H "Authorization: Bearer $TOKEN_LOGISTICA" \
  -H "Content-Type: application/json" \
  -d '{"code":"TICKET-123"}'
```

### 2.3 Rutas abiertas a todos los autenticados
```bash
# CLIENT puede crear orden
curl -X POST http://localhost:8090/api/v1/orders \
  -H "Authorization: Bearer $TOKEN_CLIENT" \
  -H "Content-Type: application/json" \
  -d '{"eventId":"...","tickets":[...]}'

# Cualquier autenticado puede listar eventos
curl -X GET http://localhost:8090/api/v1/events \
  -H "Authorization: Bearer $TOKEN_CLIENT"
```

## 3. Frontend — Role Enforcement (Manual)

| Dashboard | Roles permitidos | URL directa >
|-----------|-----------------|-------------|
| DashboardOrganizer.html | ORGANIZER, ADMIN | Si CLIENT o LOGISTICA accede → redirige a login |
| DashboardManager.html | ADMIN | Si ORGANIZER CLIENT LOGISTICA accede → redirige a login |
| DashboardLogistica.html | LOGISTICA | Si CLIENT ORGANIZER ADMIN accede → redirige a login |

### Flujos a probar
1. Login como ADMIN → redirige a DashboardManager.html
2. Login como ORGANIZER → redirige a DashboardOrganizer.html
3. Login como LOGISTICA → redirige a DashboardLogistica.html
4. Login como CLIENT → redirige a index.html
5. Navegar directamente a `/assets/DashboardManager.html` sin token → redirige a login
6. Navegar directamente a `/assets/DashboardManager.html` con token CLIENT → redirige a login

## 4. Token sin autenticación

```bash
# Sin token → 401
curl http://localhost:8090/api/v1/orders -v

# Token inválido/expirado → 401
curl -H "Authorization: Bearer token-invalido" http://localhost:8090/api/v1/orders -v
```

## 5. Rutas públicas (sin token)

```bash
# Login → 200 sin token
curl -X POST http://localhost:8090/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass"}'

# Ping → 200
curl http://localhost:8090/api/v1/auth/ping

# Listar eventos → 200
curl http://localhost:8090/api/v1/events
```

## 6. Resumen de autorización por ruta

| Ruta | Roles permitidos | Notas |
|------|-----------------|-------|
| `/api/v1/auth/**` | Todos autenticados | login registro ping son públicos |
| `/api/v1/events/**` | Todos autenticados | GET /events es público |
| `/api/v1/tickets/**` | Todos autenticados | |
| `/api/v1/issued-tickets/**` | Todos autenticados | |
| `/api/v1/orders/**` | Todos autenticados | |
| `/api/v1/promocodes/**` | ORGANIZER, ADMIN | |
| `/api/v1/payments/**` | Todos autenticados | webhook es público |
| `/api/v1/checkin/**` | LOGISTICA, ORGANIZER, ADMIN | |
| `/api/v1/notifications/**` | Todos autenticados | |

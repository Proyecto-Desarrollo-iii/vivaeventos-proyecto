# VivaEventos - Frontend del Proyecto

Frontend para VivaEventos con servidor Node.js/Express, proxy API y static file serving.

## Tecnologías

- **Node.js** 21.x
- **Express** 4.18.x (servidor HTTP)
- **http-proxy-middleware** (proxy a gateway)
- **PostgreSQL** (conexión a bases de datos de tickets y check-in)
- **Jest** + **Supertest** (testing e integración)

## Configuración

### Variables de Entorno

```bash
PORT=5000                         # Puerto del servidor (default: 5000)
GATEWAY_URL=http://localhost:8090 # URL del gateway API
DB_TICKETS_HOST=localhost         # Host base de datos de tickets
DB_TICKETS_PORT=5433
DB_TICKETS_DATABASE=vivaeventos_tickets
DB_TICKETS_USER=devdb
DB_TICKETS_PASSWORD=a1b2c3d4
DB_CHECKIN_HOST=localhost         # Host base de datos de check-in
DB_CHECKIN_PORT=5433
DB_CHECKIN_DATABASE=vivaeventos_checkin
DB_CHECKIN_USER=devdb
DB_CHECKIN_PASSWORD=a1b2c3d4
```

## Scripts

```bash
# Desarrollo
npm start                  # Inicia servidor en http://localhost:5000

# Testing
npm test                   # Ejecuta Jest con coverage
npm test -- --watch       # Modo watch (development)

# Docker
docker build -t vivaeventos-proyecto .
docker run -p 5000:5000 vivaeventos-proyecto
```

## Estructura del Proyecto

```
vivaeventos-proyecto/
├── server.js                    # Servidor Express principal
├── package.json                 # Dependencias y scripts
├── Dockerfile                   # Imagen Docker
├── __tests__/
│   └── server.test.js          # Test suite (Jest + Supertest)
├── admin/                       # Admin frontend
├── auth/                        # Auth frontend
├── validator/                   # Validator frontend
├── shared/                      # Componentes compartidos
├── assets/                      # Recursos estáticos
└── index.html                   # Página principal SPA
```

## Funcionalidades

### Server (Express)

- **Static File Serving**: Sirve frontend desde `/admin`, `/auth`, `/validator`, `/shared`
- **SPA Fallback**: Rutas SPA desconocidas redirigen a `index.html` para enrutamiento client-side
- **API Proxy**: Proxy transparente a `/api/v1` hacia el gateway
- **CORS Middleware**: Permite requests desde cualquier origen
- **Validaciones**: Endpoint `/api/validations/today` que:
  - Consulta validaciones de ambas BD (tickets y check-in)
  - Filtra por operador
  - Fusiona y ordena resultados por fecha

### Testing

**Cobertura actual**: 96.55% statements, 69.76% branches, 100% functions

**Test suite incluye**:
- Static file serving (HTML, SPA)
- Error handling (404, 500)
- Database pool creation y connection
- API validations endpoint
- CORS middleware behavior
- Proxy middleware configuration
- Local IP detection
- Module execution (require.main === module)

**Umbral de cobertura** (Jest):
- Branches: 65%
- Functions: 80%
- Lines: 80%
- Statements: 80%

## CI/CD - GitHub Actions

### Flujo de Build

El archivo `.github/workflows/ci-cd.yml` ejecuta:

1. **Checkout** code
2. **Setup Node.js** 21
3. **Install dependencies** (npm ci)
4. **Run tests** con coverage (`npm test`)
5. **Upload coverage** como artifact
6. **SonarQube analysis** (si hay `SONAR_TOKEN`):
   - Proyecto: `vivaeventos-proyecto`
   - Organización: `proyecto-desarrollo-iii`
   - Host: SonarCloud (`https://sonarcloud.io`)
   - Reporta cobertura LCOV desde `coverage/lcov.info`

### Docker Build & Push

6. **Build Docker image** y push a GHCR
7. **Deploy to Cloud Run** (solo main/master)

## Requisitos de Secrets

Para CI/CD completo, configurar en GitHub:

- `SONAR_TOKEN`: Token de SonarCloud para análisis
- `DB_HOST`: Host de las bases de datos
- `DB_USER`: Usuario de BD
- `DB_PASSWORD`: Contraseña de BD
- `GATEWAY_URL`: URL del gateway API

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar tests
npm test

# Ver reporte HTML de cobertura
# El archivo se genera en: coverage/lcov-report/index.html

# Iniciar servidor
npm start

# Visitar en navegador
# http://localhost:5000
```

## Endpoints

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/` | GET | SPA main page |
| `/api/validations/today` | GET | Validaciones del día (query: `?operator=`) |
| `/api/v1/*` | * | Proxy al gateway |
| `/admin/*` | GET | Admin frontend (static) |
| `/auth/*` | GET | Auth frontend (static) |
| `/validator/*` | GET | Validator frontend (static) |
| `/shared/*` | GET | Shared components (static) |

## Documentación

- [Documento de Arquitectura](https://github.com/SebastianCastro-R/desarrollo-software-iii)
- [Multi-Repo](https://github.com/Proyecto-Desarrollo-iii)

## Equipo

- Sebastian Castro Rengifo - 2359435
- Karol Tatiana Burbano Nasner - 2359305
- Jeidy Nicol Murillo Murillo - 2359310
- Veronica Lorena Mujica Gavidia - 2359406
- Sofia Carolina Quenoran Ipujan - 2376849

# URL Shortener API with Redis Cache

## 1. Descripción

REST API construida con Node.js, Express, PostgreSQL, Prisma y Redis.

Esta API permite crear URLs acortadas, redirigir mediante un `shortCode` y llevar estadísticas de clicks.
Redis se utiliza como capa de cache para reducir consultas a la base de datos y mejorar el rendimiento.

## 2. Características

- Crear URLs acortadas
- Redirección automática
- Registro de clicks
- Estadísticas por URL
- Integración con Redis como cache
- Prevención de duplicados (mismo `originalUrl`)
- Persistencia en PostgreSQL

## 3. Tecnologías

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- Redis
- Docker (opcional)
- dotenv

## 4. Arquitectura

Client
↓
Express API
↓
Redis (cache)
↓
PostgreSQL (persistencia)

Cuando se solicita una URL acortada:

1. Se consulta Redis (cache-aside).
2. Si existe, se retorna inmediatamente la URL original.
3. Si no existe, se consulta PostgreSQL.
4. El resultado se guarda en Redis para futuras peticiones.
5. Se realiza la redirección.

## 5. Modelo de datos

### Url

| Field       | Type     |
|-------------|----------|
| id          | Int      |
| originalUrl | String   |
| shortCode   | String   |
| clicks      | Int      |
| createdAt   | DateTime |
| updatedAt   | DateTime |

Ejemplo de esquema en Prisma (`schema.prisma`):

```prisma
model Url {
  id          Int      @id @default(autoincrement())
  originalUrl String
  shortCode   String   @unique
  clicks      Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 6. Endpoints

### Crear URL

POST /shorten

Body:

```json
{
  "url": "https://youtube.com"
}
```

Respuesta:

```json
{
  "shortUrl": "http://localhost:3000/abc123",
  "shortCode": "abc123"
}
```

### Redireccionar

GET /:shortCode

Ejemplo: `GET /abc123` redirige a la `originalUrl` y aumenta el contador de `clicks`.

### Estadísticas

GET /stats/:shortCode

Respuesta:

```json
{
  "originalUrl": "https://youtube.com",
  "shortCode": "abc123",
  "clicks": 25,
  "createdAt": "2026-06-03T18:45:52.000Z"
}
```

## 7. Instalación

Clona el repositorio e instala dependencias:

```bash
git clone <repo-url>
cd url-shortener-api
npm install
```

Configura variables de entorno (ver siguiente sección) y prepara la base de datos.

## 8. Variables de entorno

Crea un archivo `.env` con estas variables mínimas:

```
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
```

## 9. Ejecutar

Genera el cliente Prisma y ejecuta migraciones (desarrollo):

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

En producción, aplica las migraciones y ejecuta el proceso con `npm start` o un proceso manager.

## 10. Buenas prácticas y funcionamiento

- Cache-aside: la aplicación primero consulta Redis y luego la base de datos si es necesario.
- Configura TTL en Redis para entradas de URL para balancear frescura y uso de memoria.
- Maneja colisiones de `shortCode` regenerando un código cuando ya existe.

## 11. Lo que aprendí

- Diseño de APIs REST
- Estrategias de caching con Redis
- Persistencia en PostgreSQL y uso de Prisma ORM
- Algoritmos de acortamiento de URLs y prevención de duplicados
- Patrón cache-aside y optimización de rendimiento

---

Si quieres, puedo: instalar dependencias y ejecutar los tests (`npm install`/`npm test`), o traducir todo el README al español completo (ahora mezcla español y términos en inglés técnicos).


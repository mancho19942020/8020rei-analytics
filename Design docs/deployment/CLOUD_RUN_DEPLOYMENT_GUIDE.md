# Guía de Deployment - 8020REI Analytics Dashboard

> **Fecha:** 10 de Febrero 2026  
> **Objetivo:** Desplegar el dashboard en Google Cloud Run con autodeploy desde GitHub

---

## Paso 0: Solicitar Permisos a John (Frontend Lead)

Antes de comenzar, enviar este mensaje a John:

```
Asunto: Solicitud de permisos para desplegar Dashboard Analytics 8020REI

Hola John,

Estoy trabajando en el dashboard de analytics para 8020REI (el proyecto Next.js 
que lee de BigQuery). Para poder desplegarlo y compartirlo con el equipo necesito 
los siguientes permisos en el proyecto web-app-production-451214:

1. Habilitar estas APIs:
   - Cloud Run Admin API
   - Cloud Build API  
   - Artifact Registry API

2. Roles IAM para mi usuario:
   - Cloud Run Admin (o Cloud Run Developer)
   - Cloud Build Editor
   - Service Account User

3. Acceso a BigQuery:
   - Rol BigQuery Data Viewer en el dataset analytics_489035450 
     (para que la app pueda leer los datos)

Con esto podré desplegar en Cloud Run con autodeploy desde GitHub (como Vercel 
pero dentro de GCP), y tendremos una URL para que el equipo pruebe el dashboard.

Gracias!
```

**Esperar confirmación de John antes de continuar.**

---

## Paso 1: Verificar que el Código Está Listo

El repositorio ya tiene todo configurado:

- ✅ `Dockerfile` - Configuración de contenedor
- ✅ `.dockerignore` - Archivos excluidos del build
- ✅ `next.config.ts` - Con `output: 'standalone'`
- ✅ Todo el código está en GitHub: `mancho19942020/8020rei-analytics`

**Verificar último commit:**
```bash
git log --oneline -3
# Debe mostrar:
# 8fcba64 chore: add Cloud Run deployment configuration
# a8dedd5 feat: complete dashboard implementation...
```

---

## Paso 2: Crear Service Account (Solo si es necesario)

Si John no da acceso directo al dataset de BigQuery, crear un service account:

1. Ir a: [IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click **"Create Service Account"**
3. Nombre: `cloudrun-bigquery-access`
4. Rol: **BigQuery Data Viewer**
5. Crear key JSON y guardarla

> **Nota:** Si Cloud Run está en el mismo proyecto que BigQuery (`web-app-production-451214`), 
> la autenticación es automática y NO se necesita service account key.

---

## Paso 3: Desplegar en Cloud Run

### 3.1 Ir a Cloud Run

1. [Google Cloud Console](https://console.cloud.google.com) → seleccionar proyecto `web-app-production-451214`
2. Buscar **"Cloud Run"** en el buscador o menú lateral
3. Click **"Create Service"**

### 3.2 Configurar Continuous Deployment

1. Seleccionar **"Continuously deploy from a repository"**
2. Click **"Set up with Cloud Build"**
3. **Connect GitHub Repository:**
   - Autorizar Google Cloud en GitHub
   - Seleccionar repositorio: `mancho19942020/8020rei-analytics`
   - Click **"Connect"**
4. **Build Configuration:**
   - Branch: `main`
   - Build Type: **Dockerfile** (seleccionar automático)
5. Click **"Save"** → **"Next"**

### 3.3 Configurar el Servicio

**Service Settings:**

| Campo | Valor |
|-------|-------|
| Service name | `rei-analytics-dashboard` (o nombre deseado) |
| Region | `us-central1` (recomendado) |
| CPU | 1 vCPU |
| Memory | 512 MiB (o 1 GiB si hay problemas) |
| Concurrency | 80 (default) |
| Minimum instances | 0 (escala a cero, más barato) |
| Maximum instances | 10 |

**Environment Variables:**

| Variable | Valor |
|----------|-------|
| `GOOGLE_CLOUD_PROJECT` | `web-app-production-451214` |
| `BIGQUERY_DATASET` | `analytics_489035450` |

> Si se usa service account key (solo si es necesario):
> `GOOGLE_APPLICATION_CREDENTIALS_JSON` = `[pegar JSON key aquí]`

### 3.4 Crear el Servicio

1. Click **"Create"**
2. Esperar 3-5 minutos mientras se construye y despliega
3. Se generará una URL automática: `https://rei-analytics-dashboard-xxxxx-uc.a.run.app`

---

## Paso 4: Verificar el Deployment

### 4.1 Probar la URL

1. Abrir la URL proporcionada por Cloud Run
2. Verificar que carga el login de Firebase
3. Intentar login con Google
4. Verificar que el dashboard carga datos

### 4.2 Si hay errores de Firebase Auth (Dominio no autorizado)

1. Ir a [Firebase Console](https://console.firebase.google.com) → proyecto `rei-analytics-b4b8b`
2. Authentication → Settings → Authorized domains
3. Agregar el dominio de Cloud Run: `rei-analytics-dashboard-xxxxx-uc.a.run.app`

---

## Paso 5: Configurar Dominio Personalizado (Opcional)

Para tener una URL más profesional:

1. En Cloud Run → click en el servicio
2. Tab **"Domain Mappings"**
3. Click **"Add Mapping"**
4. Opciones:
   - Usar subdominio gratuito de Google (`xxxx.run.app`)
   - O conectar dominio propio (requiere configurar DNS)

---

## Comandos Útiles (Para referencia)

### Ver logs del servicio
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=rei-analytics-dashboard" --limit=50
```

### Redeploy manual (si es necesario)
```bash
gcloud run deploy rei-analytics-dashboard --source . --region=us-central1
```

---

## Variables de Entorno Resumen

| Variable | Valor | ¿Dónde se configura? |
|----------|-------|---------------------|
| `GOOGLE_CLOUD_PROJECT` | `web-app-production-451214` | Cloud Run Console |
| `BIGQUERY_DATASET` | `analytics_489035450` | Cloud Run Console |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyBvPgBxqdKIc1lYj2zESZVSrEb8cPjucX4` | Ya en código (public) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `rei-analytics-b4b8b.firebaseapp.com` | Ya en código (public) |

---

## Checklist Final

- [ ] John dio los permisos necesarios
- [ ] APIs habilitadas (Cloud Run, Cloud Build, Artifact Registry)
- [ ] Service account con acceso a BigQuery (si aplica)
- [ ] Repositorio GitHub conectado a Cloud Run
- [ ] Servicio creado con environment variables
- [ ] URL funciona y carga el login
- [ ] Firebase domain autorizado
- [ ] Dashboard carga datos correctamente
- [ ] Compartir URL con el equipo

---

## Notas Importantes

1. **Autodeploy:** Cada push a `main` en GitHub automáticamente redeploya en ~3 minutos
2. **Costo:** Cloud Run tiene free tier generoso, probablemente $0/mes para uso de prueba
3. **BigQuery:** La app solo LEE datos, no hay riesgo de modificar datos
4. **Seguridad:** Las variables de entorno en Cloud Run están encriptadas

---

## Contactos

- **John:** Frontend Lead (permisos GCP)
- **Repositorio:** https://github.com/mancho19942020/8020rei-analytics
- **Proyecto GCP:** `web-app-production-451214`
- **Proyecto Firebase:** `rei-analytics-b4b8b`

---

*¡Listo para deployar mañana! 🚀*

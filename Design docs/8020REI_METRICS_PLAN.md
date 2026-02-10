# 8020REI Metrics Dashboard — Plan de Métricas v2

**Propósito:** Definición de los 8 capítulos del dashboard, métricas específicas por capítulo, y validación de disponibilidad en GA4 BigQuery.  
**Fecha:** Febrero 2026  
**GA4 Property:** 489035450  
**BigQuery Project:** `web-app-production-451214`  
**BigQuery Dataset:** `analytics_489035450`  
**Tables:** `events_*` (daily export, formato `events_YYYYMMDD`)  
**App Port:** localhost:4000  
**Stack:** Next.js 16 + TypeScript + Recharts + @google-cloud/bigquery  

---

## Tabla de Contenidos

1. [Estructura del Dashboard (8 Tabs)](#1-estructura-del-dashboard-8-tabs)
2. [Fuente de Datos y Campos BigQuery](#2-fuente-de-datos-y-campos-bigquery)
3. [Cap 1 — Overview](#3-cap-1--overview) ✅ Construido
4. [Cap 2 — Users](#4-cap-2--users) 🔨 Por construir
5. [Cap 3 — Features](#5-cap-3--features) 🔨 Por construir
6. [Cap 4 — Clients](#6-cap-4--clients) 🔨 Por construir
7. [Cap 5 — Traffic](#7-cap-5--traffic) 🔨 Por construir
8. [Cap 6 — Technology](#8-cap-6--technology) 🔨 Por construir
9. [Cap 7 — Geography](#9-cap-7--geography) ✅ Construido
10. [Cap 8 — Events](#10-cap-8--events) 🔨 Por construir
11. [Matriz de Validación Completa](#11-matriz-de-validación-completa)
12. [Custom Events — Fase Futura](#12-custom-events--fase-futura)

---

## 1. Estructura del Dashboard (8 Tabs)

El dashboard tiene **8 capítulos** (tabs) en la navegación:

| # | Tab | Status | Descripción |
|---|-----|--------|-------------|
| 1 | **Overview** | ✅ Construido | Panorama general, KPIs principales |
| 2 | **Users** | 🔨 Por construir | Comportamiento y retención de usuarios |
| 3 | **Features** | 🔨 Por construir | Adopción y uso de features del producto |
| 4 | **Clients** | 🔨 Por construir | Actividad por cliente (subdominio) |
| 5 | **Traffic** | 🔨 Por construir | Fuentes de tráfico y adquisición |
| 6 | **Technology** | 🔨 Por construir | Dispositivos, navegadores, OS |
| 7 | **Geography** | ✅ Construido | Ubicación geográfica de usuarios |
| 8 | **Events** | 🔨 Por construir | Detalle de todos los eventos capturados |

**Estado actual:** Solo el tab Overview está construido y funcional con datos reales de BigQuery. Los otros 7 tabs existen en la navegación pero no tienen contenido.

**Resumen numérico:**
- 8 capítulos totales
- 1 construido (Overview)
- 7 por construir
- ~35 métricas totales definidas
- ~35 disponibles en GA4 (no se necesitan datos externos)

---

## 2. Fuente de Datos y Campos BigQuery

### Pipeline

```
8020REI App → GA4 (Property 489035450) → BigQuery (events_*) → Dashboard (Next.js)
```

- Cada cliente tiene un subdominio: `[cliente].8020rei.com`
- GA4 recolecta eventos estándar (page_view, click, scroll, etc.)
- BigQuery recibe export diario con 24-48h de delay
- Dashboard consulta BigQuery via API route `/api/metrics`

### Campos Disponibles en el Esquema GA4 BigQuery

Cada fila en `events_*` es un **evento individual**. Estos son los campos que alimentan cada capítulo:

#### Campos de Evento (top-level)

| Campo | Tipo | Ejemplo | Capítulos |
|-------|------|---------|-----------|
| `event_name` | STRING | page_view, click, scroll | Overview, Events |
| `event_date` | STRING | 20260210 | Todos (series temporales) |
| `event_timestamp` | INTEGER | microseconds | Events |

#### Campos de Usuario (top-level)

| Campo | Tipo | Ejemplo | Capítulos |
|-------|------|---------|-----------|
| `user_pseudo_id` | STRING | abc123def456 | Overview, Users, Clients |

#### Event Params (nested — requiere UNNEST o subquery)

| Parámetro | Tipo valor | Ejemplo | Capítulos |
|-----------|-----------|---------|-----------|
| `page_location` | string_value | `https://dmforce.8020rei.com/buybox` | Features, Clients |
| `page_referrer` | string_value | `https://google.com` | Traffic |
| `page_title` | string_value | 8020REI - Buybox | Features |
| `engagement_time_msec` | int_value | 15000 | Users |
| `session_engaged` | int_value | 1 | Users |
| `ga_session_id` | int_value | 1724112663 | Users, Events |

**Cómo extraer event_params:**
```sql
(SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
```

#### Device (RECORD — acceso con dot notation)

| Campo | Tipo | Ejemplo | Capítulos |
|-------|------|---------|-----------|
| `device.category` | STRING | desktop, mobile, tablet | Technology |
| `device.browser` | STRING | Chrome, Safari, Firefox | Technology |
| `device.operating_system` | STRING | Windows, macOS, iOS | Technology |
| `device.language` | STRING | en-us, es | Technology |
| `device.mobile_brand_name` | STRING | Apple, Samsung | Technology |

#### Geo (RECORD — acceso con dot notation)

| Campo | Tipo | Ejemplo | Capítulos |
|-------|------|---------|-----------|
| `geo.country` | STRING | United States | Geography |
| `geo.region` | STRING | California | Geography |
| `geo.city` | STRING | Los Angeles | Geography |
| `geo.continent` | STRING | Americas | Geography |

#### Traffic Source (RECORD — first-touch attribution)

| Campo | Tipo | Ejemplo | Capítulos |
|-------|------|---------|-----------|
| `traffic_source.source` | STRING | google, direct, (not set) | Traffic |
| `traffic_source.medium` | STRING | organic, cpc, referral | Traffic |
| `traffic_source.name` | STRING | campaign name | Traffic |

> **IMPORTANTE:** `traffic_source` es first-touch (la fuente con la que el usuario llegó la primera vez). Para 8020REI (SaaS con login directo), la mayoría será "direct".

### Eventos Capturados Actualmente (8 eventos estándar)

| Evento | Tipo | ~Volumen (30d) | Descripción |
|--------|------|----------------|-------------|
| `click` | Enhanced Measurement | ~141,000 | Clics en enlaces salientes |
| `page_view` | Auto-collected | ~26,000 | Cada vista de página |
| `scroll` | Enhanced Measurement | ~12,000 | Scroll al 90% de la página |
| `user_engagement` | Auto-collected | ~11,000 | Usuario activo en la página |
| `form_start` | Enhanced Measurement | ~6,000 | Inicio de formulario |
| `session_start` | Auto-collected | ~3,900 | Inicio de sesión |
| `first_visit` | Auto-collected | ~500 | Primera visita del usuario |
| `form_submit` | Enhanced Measurement | ~24 | Envío de formulario |

### Base Query Pattern

Todas las queries usan este patrón base:

```sql
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
```

Donde `@days` es 7, 30 o 90 según el filtro de tiempo seleccionado.

---

## 3. Cap 1 — Overview

**Status:** ✅ Construido y funcional  
**Pregunta clave:** "¿Cómo va la plataforma en general?"  
**API endpoint:** `GET /api/metrics?days=30`

### Métricas

| Métrica | Tipo Visual | Query BigQuery | GA4 |
|---------|-------------|----------------|-----|
| **Total Users** | Scorecard | `COUNT(DISTINCT user_pseudo_id)` | ✅ |
| **Total Events** | Scorecard | `COUNT(*)` | ✅ |
| **Page Views** | Scorecard | `COUNT(*) WHERE event_name = 'page_view'` | ✅ |
| **Active Clients** | Scorecard | `COUNT(DISTINCT REGEXP_EXTRACT(page_location, r'https://([^.]+)\.8020rei\.com'))` | ✅ |
| **Users Over Time** | Line Chart | `COUNT(DISTINCT user_pseudo_id) GROUP BY event_date` | ✅ |
| **Feature Usage** | Bar Chart (horizontal) | CASE por URL pattern en page_location | ✅ |
| **Top Clients** | Table | REGEXP_EXTRACT subdomain, ranking por events DESC | ✅ |

### Queries Actuales (en src/lib/queries.ts)

**getMetricsQuery(days):**
```sql
SELECT
  COUNT(DISTINCT user_pseudo_id) as total_users,
  COUNT(*) as total_events,
  COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views,
  COUNT(DISTINCT
    REGEXP_EXTRACT(
      (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
      r'https://([^.]+)\.8020rei\.com'
    )
  ) as active_clients
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
```

**getUsersByDayQuery(days):**
```sql
SELECT
  event_date,
  COUNT(DISTINCT user_pseudo_id) as users,
  COUNT(*) as events
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
GROUP BY event_date
ORDER BY event_date
```

**getFeatureUsageQuery(days):**
```sql
SELECT
  CASE
    WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
    WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox - Deals'
    WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
    WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
    WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
    WHEN REGEXP_CONTAINS(page_url, '/integrations/api-tokens') THEN 'API Tokens'
    WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
    WHEN REGEXP_CONTAINS(page_url, '/session/login') THEN 'Login'
    ELSE 'Other'
  END as feature,
  COUNT(*) as views
FROM (
  SELECT
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
    AND event_name = 'page_view'
)
GROUP BY feature
HAVING feature != 'Other'
ORDER BY views DESC
```

**getTopClientsQuery(days):**
```sql
SELECT
  REGEXP_EXTRACT(
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
    r'https://([^.]+)\.8020rei\.com'
  ) as client,
  COUNT(*) as events,
  COUNT(DISTINCT user_pseudo_id) as users,
  COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
GROUP BY client
HAVING client IS NOT NULL
ORDER BY events DESC
LIMIT 20
```

### Componentes React Existentes

| Componente | Archivo | Props |
|-----------|---------|-------|
| `Scorecard` | `src/components/Scorecard.tsx` | `{ label, value, icon, color? }` |
| `TimeSeriesChart` | `src/components/TimeSeriesChart.tsx` | `{ data: { event_date, users }[] }` |
| `FeatureBarChart` | `src/components/FeatureBarChart.tsx` | `{ data: { feature, views }[] }` |
| `ClientsTable` | `src/components/ClientsTable.tsx` | `{ data: { client, events, users, page_views }[] }` |

### Arquitectura de la Página (src/app/page.tsx)

```typescript
// State
const [data, setData] = useState(null);
const [days, setDays] = useState(30);        // 7, 30, 90
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// Fetch
useEffect(() => { fetchData(); }, [days]);

async function fetchData() {
  const res = await fetch(`/api/metrics?days=${days}`);
  const json = await res.json();
  setData(json.data);
}
```

### API Response Format (GET /api/metrics?days=30)

```json
{
  "success": true,
  "data": {
    "metrics": {
      "total_users": 1234,
      "total_events": 56789,
      "page_views": 12345,
      "active_clients": 45
    },
    "usersByDay": [
      { "event_date": "20260206", "users": 123, "events": 456 }
    ],
    "featureUsage": [
      { "feature": "Home Dashboard", "views": 1234 }
    ],
    "topClients": [
      { "client": "dmforce", "events": 5678, "users": 234, "page_views": 3456 }
    ]
  }
}
```

---

## 4. Cap 2 — Users

**Status:** 🔨 Por construir  
**Pregunta clave:** "¿Quiénes son nuestros usuarios, con qué frecuencia vuelven, y qué tan comprometidos están?"

### Métricas

| Métrica | Tipo Visual | Query BigQuery | GA4 |
|---------|-------------|----------------|-----|
| **DAU** | Scorecard | `COUNT(DISTINCT user_pseudo_id) WHERE event_date = today` | ✅ |
| **WAU** | Scorecard | `COUNT(DISTINCT user_pseudo_id)` últimos 7 días | ✅ |
| **MAU** | Scorecard | `COUNT(DISTINCT user_pseudo_id)` últimos 30 días | ✅ |
| **New vs Returning Users** | Stacked Bar Chart | `COUNT(*) WHERE event_name = 'first_visit'` vs total unique users por día | ✅ |
| **Sessions per User** | Scorecard | `COUNT(session_start) / COUNT(DISTINCT user_pseudo_id)` | ✅ |
| **Avg. Engagement Time** | Scorecard | `AVG(engagement_time_msec)` de user_engagement events, convertir a segundos | ✅ |
| **Engaged Sessions %** | Scorecard | `COUNT(WHERE session_engaged = 1) / total sessions * 100` | ✅ |
| **Users Trend** | Line Chart | New users + Returning users por día | ✅ |
| **Bounce Rate** | Scorecard | Non-engaged sessions / total sessions (inverso de engaged rate) | ✅ |

### Queries Sugeridas

**DAU/WAU/MAU:**
```sql
SELECT
  COUNT(DISTINCT CASE 
    WHEN event_date = FORMAT_DATE('%Y%m%d', CURRENT_DATE()) 
    THEN user_pseudo_id END) as dau,
  COUNT(DISTINCT CASE 
    WHEN _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)) 
    THEN user_pseudo_id END) as wau,
  COUNT(DISTINCT CASE 
    WHEN _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)) 
    THEN user_pseudo_id END) as mau
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY))
```

**New vs Returning por día:**
```sql
SELECT
  event_date,
  COUNT(DISTINCT CASE WHEN event_name = 'first_visit' THEN user_pseudo_id END) as new_users,
  COUNT(DISTINCT user_pseudo_id) - COUNT(DISTINCT CASE WHEN event_name = 'first_visit' THEN user_pseudo_id END) as returning_users
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
GROUP BY event_date
ORDER BY event_date
```

**Engagement metrics:**
```sql
SELECT
  COUNT(DISTINCT CASE WHEN event_name = 'session_start' THEN 
    CONCAT(user_pseudo_id, (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id'))
  END) as total_sessions,
  
  COUNT(DISTINCT CASE WHEN 
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'session_engaged') = 1
    AND event_name = 'session_start'
    THEN CONCAT(user_pseudo_id, (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id'))
  END) as engaged_sessions,
  
  AVG(CASE WHEN event_name = 'user_engagement' 
    THEN (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec')
  END) as avg_engagement_time_ms
  
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
```

### Layout Sugerido

```
┌─────────────┬─────────────┬─────────────┐
│  DAU (num)  │  WAU (num)  │  MAU (num)  │  ← 3 Scorecards
└─────────────┴─────────────┴─────────────┘
┌─────────────────────────────────────────┐
│  New vs Returning Users (Stacked Bar)   │  ← Stacked bar chart por día
└─────────────────────────────────────────┘
┌────────────┬────────────┬───────────────┐
│ Sess/User  │ Bounce %   │ Engaged %     │  ← 3 Scorecards
└────────────┴────────────┴───────────────┘
┌─────────────────────────────────────────┐
│  Avg Engagement Time (Scorecard grande) │
└─────────────────────────────────────────┘
```

---

## 5. Cap 3 — Features

**Status:** 🔨 Por construir  
**Pregunta clave:** "¿Qué features usan los clientes y cuáles tienen más adopción?"

### Métricas

| Métrica | Tipo Visual | Query BigQuery | GA4 |
|---------|-------------|----------------|-----|
| **Views por Feature** | Bar Chart (horizontal) | CASE WHEN page_location → feature name, COUNT | ✅ |
| **Distribución de Uso %** | Donut Chart | % de views por feature del total | ✅ |
| **Feature Adoption Rate** | Table / Bar | % de clientes activos que visitaron cada feature | ✅ |
| **Feature Trend Over Time** | Multi-line Chart | `GROUP BY event_date, feature` | ✅ |
| **Top 20 Pages** | Table | Top page_location por views | ✅ |

### URL → Feature Mapping

| URL Pattern | Feature Name | Datos en GA4 |
|-------------|-------------|--------------|
| `/home` | Home Dashboard | ✅ Confirmado |
| `/buybox` | Buybox | ✅ Confirmado |
| `/buybox/deals` | Buybox — Deals | ✅ Confirmado |
| `/properties` | Properties | ✅ Confirmado |
| `/importer` | Importer | ✅ Confirmado |
| `/integrations/api-tokens` | API Tokens | ✅ Confirmado |
| `/integrations` | Integrations | ✅ Confirmado |
| `/session/login` | Login | ✅ Confirmado |
| `/skip-trace` | Skip Trace | ⚠️ Verificar — puede estar en framework anterior |
| `/rapid-response` | Rapid Response | ⚠️ Verificar — puede estar en framework anterior |
| `/buyers-list` | Buyers List | ⚠️ Verificar — puede estar en framework anterior |
| `/reports` | Reports | ⚠️ Verificar — puede estar en framework anterior |

> **NOTA:** Algunos features pueden usar el framework anterior y no enviar datos a GA4. Correr query en BigQuery para confirmar.

### Queries Sugeridas

**Feature Adoption (% clientes por feature):**
```sql
WITH total_clients AS (
  SELECT COUNT(DISTINCT REGEXP_EXTRACT(
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
    r'https://([^.]+)\.8020rei\.com'
  )) as total
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
),
feature_clients AS (
  SELECT
    CASE
      WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home Dashboard'
      WHEN REGEXP_CONTAINS(page_url, '/buybox/deals') THEN 'Buybox - Deals'
      WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
      WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
      WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
      WHEN REGEXP_CONTAINS(page_url, '/integrations/api-tokens') THEN 'API Tokens'
      WHEN REGEXP_CONTAINS(page_url, '/integrations') THEN 'Integrations'
      ELSE 'Other'
    END as feature,
    COUNT(DISTINCT REGEXP_EXTRACT(page_url, r'https://([^.]+)\.8020rei\.com')) as clients_using
  FROM (
    SELECT (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
    FROM `web-app-production-451214.analytics_489035450.events_*`
    WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
      AND event_name = 'page_view'
  )
  GROUP BY feature
)
SELECT feature, clients_using, ROUND(clients_using * 100.0 / total, 1) as adoption_pct
FROM feature_clients, total_clients
WHERE feature != 'Other'
ORDER BY clients_using DESC
```

**Feature Trend por día:**
```sql
SELECT
  event_date,
  CASE
    WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home'
    WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
    WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
    WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
    ELSE 'Other'
  END as feature,
  COUNT(*) as views
FROM (
  SELECT event_date,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
    AND event_name = 'page_view'
)
GROUP BY event_date, feature
HAVING feature != 'Other'
ORDER BY event_date, views DESC
```

### Layout Sugerido

```
┌─────────────────────────────────────────┐
│  Views por Feature (Bar horizontal)     │
└─────────────────────────────────────────┘
┌───────────────────┬─────────────────────┐
│ Distribución %    │ Feature Adoption    │
│ (Donut chart)     │ (Table: feat, %, #) │
└───────────────────┴─────────────────────┘
┌─────────────────────────────────────────┐
│  Feature Trend Over Time (Multi-line)   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  Top 20 Pages (Table)                   │
└─────────────────────────────────────────┘
```

---

## 6. Cap 4 — Clients

**Status:** 🔨 Por construir  
**Pregunta clave:** "¿Quiénes son los clientes más activos y qué features usan?"

### Métricas

| Métrica | Tipo Visual | Query BigQuery | GA4 |
|---------|-------------|----------------|-----|
| **Top Clients Ranking** | Table | `REGEXP_EXTRACT subdomain, ORDER BY events DESC` | ✅ |
| **Users per Client** | Column en Table | `COUNT(DISTINCT user_pseudo_id) GROUP BY client` | ✅ |
| **Page Views per Client** | Column en Table | `COUNT(page_view) GROUP BY client` | ✅ |
| **Features Used per Client** | Detail / Drill-down | Cruce subdomain + URL feature mapping | ✅ |
| **Client Activity Trend** | Line Chart (filterable) | `GROUP BY event_date WHERE client = [selected]` | ✅ |

### Clave: Extracción de Subdominio

```sql
REGEXP_EXTRACT(
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
  r'https://([^.]+)\.8020rei\.com'
) as client
```

Ejemplos de subdominios: `dmforce`, `prosourcehomebuyers`, `rapidfirehb`, `expresshb`, `fifthavenue`

### Queries Sugeridas

**Top clients con features usados:**
```sql
SELECT
  client,
  COUNT(*) as events,
  COUNT(DISTINCT user_pseudo_id) as users,
  COUNT(CASE WHEN event_name = 'page_view' THEN 1 END) as page_views,
  COUNT(DISTINCT CASE
    WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
    WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
    WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
    WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home'
  END) as features_used
FROM (
  SELECT
    user_pseudo_id, event_name,
    REGEXP_EXTRACT(
      (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
      r'https://([^.]+)\.8020rei\.com'
    ) as client,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
)
WHERE client IS NOT NULL
GROUP BY client
ORDER BY events DESC
LIMIT 20
```

**Trend de un cliente específico:**
```sql
SELECT event_date, COUNT(DISTINCT user_pseudo_id) as users, COUNT(*) as events
FROM (
  SELECT event_date, user_pseudo_id,
    REGEXP_EXTRACT(
      (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location'),
      r'https://([^.]+)\.8020rei\.com'
    ) as client
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
)
WHERE client = @selected_client
GROUP BY event_date
ORDER BY event_date
```

### Layout Sugerido

```
┌─────────────────────────────────────────────────────────────┐
│  Top Clients Table                                          │
│  (columns: Client, Events, Users, Page Views, Features #)  │
│  + click para drill-down a trend de ese cliente             │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  Client Activity Trend (Line Chart)     │
│  (filterable por cliente seleccionado)  │
└─────────────────────────────────────────┘
```

---

## 7. Cap 5 — Traffic

**Status:** 🔨 Por construir  
**Pregunta clave:** "¿De dónde vienen nuestros usuarios?"

### Métricas

| Métrica | Tipo Visual | Query BigQuery | GA4 |
|---------|-------------|----------------|-----|
| **Traffic by Source** | Bar Chart | `traffic_source.source` — google, direct, etc. | ✅ |
| **Traffic by Medium** | Donut Chart | `traffic_source.medium` — organic, cpc, referral | ✅ |
| **Top Referrers** | Table | `page_referrer` event param | ✅ |
| **Sessions by Day of Week** | Bar Chart | `EXTRACT(DAYOFWEEK FROM PARSE_DATE('%Y%m%d', event_date))` | ✅ |
| **First Visits Trend** | Line Chart | `COUNT(*) WHERE event_name = 'first_visit' GROUP BY event_date` | ✅ |

> **⚠️ NOTA:** `traffic_source` es **first-touch attribution** (la fuente original con la que el usuario llegó por primera vez). Dado que 8020REI es un SaaS con login directo, la mayoría del tráfico será "direct". El valor está en detectar excepciones y entender cómo llegan nuevos usuarios.

### Queries Sugeridas

**Traffic by Source/Medium:**
```sql
SELECT
  traffic_source.source as source,
  traffic_source.medium as medium,
  COUNT(DISTINCT user_pseudo_id) as users,
  COUNT(*) as events
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
GROUP BY source, medium
ORDER BY users DESC
LIMIT 20
```

**Sessions by Day of Week:**
```sql
SELECT
  EXTRACT(DAYOFWEEK FROM PARSE_DATE('%Y%m%d', event_date)) as day_of_week,
  COUNT(DISTINCT CONCAT(user_pseudo_id, 
    CAST((SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)
  )) as sessions
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
GROUP BY day_of_week
ORDER BY day_of_week
```

**First Visits Trend:**
```sql
SELECT event_date, COUNT(*) as first_visits
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
  AND event_name = 'first_visit'
GROUP BY event_date
ORDER BY event_date
```

### Layout Sugerido

```
┌───────────────────┬─────────────────────┐
│ By Source (Bar)   │ By Medium (Donut)   │
└───────────────────┴─────────────────────┘
┌─────────────────────────────────────────┐
│  Top Referrers (Table)                  │
└─────────────────────────────────────────┘
┌───────────────────┬─────────────────────┐
│ Sessions/Day(Bar) │ First Visits (Line) │
└───────────────────┴─────────────────────┘
```

---

## 8. Cap 6 — Technology

**Status:** 🔨 Por construir  
**Pregunta clave:** "¿Desde qué dispositivos y navegadores acceden nuestros clientes?"

### Métricas

| Métrica | Tipo Visual | Query BigQuery | GA4 |
|---------|-------------|----------------|-----|
| **Device Category** | Donut Chart | `device.category` — desktop, mobile, tablet | ✅ |
| **Browser Distribution** | Bar Chart | `device.browser` — Chrome, Safari, Firefox, Edge | ✅ |
| **Operating System** | Bar Chart | `device.operating_system` — Windows, macOS, iOS, Android | ✅ |
| **Device Language** | Table | `device.language` — en-us, es, etc. | ✅ |

### Queries Sugeridas

**Todas las métricas de Technology en una query:**
```sql
SELECT
  device.category as device_category,
  device.browser as browser,
  device.operating_system as os,
  device.language as language,
  COUNT(DISTINCT user_pseudo_id) as users,
  COUNT(*) as events
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
GROUP BY device_category, browser, os, language
ORDER BY users DESC
```

**O queries separadas más eficientes:**

```sql
-- Device Category
SELECT device.category, COUNT(DISTINCT user_pseudo_id) as users
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
GROUP BY device.category ORDER BY users DESC

-- Browser
SELECT device.browser, COUNT(DISTINCT user_pseudo_id) as users
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
GROUP BY device.browser ORDER BY users DESC LIMIT 10

-- OS
SELECT device.operating_system, COUNT(DISTINCT user_pseudo_id) as users
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
GROUP BY device.operating_system ORDER BY users DESC LIMIT 10

-- Language
SELECT device.language, COUNT(DISTINCT user_pseudo_id) as users
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
GROUP BY device.language ORDER BY users DESC LIMIT 10
```

### Layout Sugerido

```
┌─────────────────────────────────────────┐
│  Device Category (Donut: desktop/mob)   │
└─────────────────────────────────────────┘
┌───────────────────┬─────────────────────┐
│ Browser (Bar)     │ OS (Bar)            │
└───────────────────┴─────────────────────┘
┌─────────────────────────────────────────┐
│  Language (Table)                       │
└─────────────────────────────────────────┘
```

> **💡 Utilidad para el equipo:** Si 95% usa desktop Chrome, el esfuerzo en mobile puede ser menor. Datos muy útiles para decisiones de responsive design.

---

## 9. Cap 7 — Geography

**Status:** ✅ Construido  
**Pregunta clave:** "¿Desde dónde geográficamente acceden nuestros clientes?"

### Métricas

| Métrica | Tipo Visual | Query BigQuery | GA4 |
|---------|-------------|----------------|-----|
| **Users by Country** | Bar Chart | `geo.country` | ✅ |
| **Users by State/Region** | Table | `geo.region` | ✅ |
| **Users by City** | Table | `geo.city` | ✅ |
| **Activity by Continent** | Donut Chart | `geo.continent` | ✅ |

### Queries Sugeridas

```sql
-- By Country
SELECT geo.country, COUNT(DISTINCT user_pseudo_id) as users, COUNT(*) as events
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
GROUP BY geo.country ORDER BY users DESC LIMIT 20

-- By Region (filtrar por US para relevancia)
SELECT geo.region, COUNT(DISTINCT user_pseudo_id) as users, COUNT(*) as events
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
  AND geo.country = 'United States'
GROUP BY geo.region ORDER BY users DESC LIMIT 20

-- By City
SELECT geo.city, geo.region, COUNT(DISTINCT user_pseudo_id) as users
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
  AND geo.country = 'United States'
GROUP BY geo.city, geo.region ORDER BY users DESC LIMIT 20

-- By Continent
SELECT geo.continent, COUNT(DISTINCT user_pseudo_id) as users
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
GROUP BY geo.continent ORDER BY users DESC
```

### Layout Sugerido

```
┌───────────────────┬─────────────────────┐
│ By Country (Bar)  │ By Continent(Donut) │
└───────────────────┴─────────────────────┘
┌───────────────────┬─────────────────────┐
│ By State (Table)  │ By City (Table)     │
└───────────────────┴─────────────────────┘
```

> **💡 Contexto:** 8020REI es una plataforma de real estate investing enfocada en US. La gran mayoría del tráfico debería venir de Estados Unidos. Útil para detectar uso internacional inesperado.

---

## 10. Cap 8 — Events

**Status:** 🔨 Por construir  
**Pregunta clave:** "¿Qué eventos ocurren en la plataforma y en qué volumen?"

### Métricas

| Métrica | Tipo Visual | Query BigQuery | GA4 |
|---------|-------------|----------------|-----|
| **Event Breakdown** | Bar Chart | `event_name, COUNT(*) GROUP BY event_name ORDER BY count DESC` | ✅ |
| **Event Volume Trend** | Stacked Area Chart | `COUNT(*) GROUP BY event_date, event_name` | ✅ |
| **Events per Session** | Scorecard | `COUNT(*) / COUNT(DISTINCT ga_session_id)` | ✅ |
| **Form Conversion Rate** | Funnel / Scorecard | `form_submit / form_start * 100` | ✅ |
| **Scroll Depth by Page** | Table | scroll events + page_location | ✅ |

### Eventos capturados actualmente

| Evento | Tipo | ~Vol (30d) | Descripción |
|--------|------|------------|-------------|
| `click` | Enhanced | 141K | Clics en enlaces salientes |
| `page_view` | Auto | 26K | Cada vista de página |
| `scroll` | Enhanced | 12K | Scroll al 90% |
| `user_engagement` | Auto | 11K | Usuario activo en página |
| `form_start` | Enhanced | 6K | Inicio de formulario |
| `session_start` | Auto | 3.9K | Inicio de sesión |
| `first_visit` | Auto | 500 | Primera visita |
| `form_submit` | Enhanced | 24 | Envío de formulario |

### Queries Sugeridas

**Event Breakdown:**
```sql
SELECT event_name, COUNT(*) as count
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
GROUP BY event_name
ORDER BY count DESC
```

**Event Volume Trend (para stacked area):**
```sql
SELECT event_date, event_name, COUNT(*) as count
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
  AND event_name IN ('page_view', 'click', 'scroll', 'user_engagement', 'form_start', 'session_start')
GROUP BY event_date, event_name
ORDER BY event_date, count DESC
```

**Form Conversion:**
```sql
SELECT
  COUNT(CASE WHEN event_name = 'form_start' THEN 1 END) as form_starts,
  COUNT(CASE WHEN event_name = 'form_submit' THEN 1 END) as form_submits,
  SAFE_DIVIDE(
    COUNT(CASE WHEN event_name = 'form_submit' THEN 1 END),
    COUNT(CASE WHEN event_name = 'form_start' THEN 1 END)
  ) * 100 as conversion_rate
FROM `web-app-production-451214.analytics_489035450.events_*`
WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
```

**Scroll by Page:**
```sql
SELECT
  CASE
    WHEN REGEXP_CONTAINS(page_url, '/home') THEN 'Home'
    WHEN REGEXP_CONTAINS(page_url, '/buybox') THEN 'Buybox'
    WHEN REGEXP_CONTAINS(page_url, '/properties') THEN 'Properties'
    WHEN REGEXP_CONTAINS(page_url, '/importer') THEN 'Importer'
    ELSE 'Other'
  END as page,
  COUNT(*) as scroll_events
FROM (
  SELECT (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') as page_url
  FROM `web-app-production-451214.analytics_489035450.events_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY))
    AND event_name = 'scroll'
)
GROUP BY page
HAVING page != 'Other'
ORDER BY scroll_events DESC
```

### Layout Sugerido

```
┌─────────────────────────────────────────┐
│  Event Breakdown (Bar Chart)            │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  Event Volume Trend (Stacked Area)      │
└─────────────────────────────────────────┘
┌──────────────┬──────────────┬───────────┐
│ Events/Sess  │ Form Start   │ Conv Rate │  ← Scorecards
└──────────────┴──────────────┴───────────┘
┌─────────────────────────────────────────┐
│  Scroll Depth by Page (Table)           │
└─────────────────────────────────────────┘
```

---

## 11. Matriz de Validación Completa

Resumen de **todas las métricas** con su status de disponibilidad en GA4:

### Cap 1 — OVERVIEW ✅

| Métrica | GA4 | Notas |
|---------|-----|-------|
| Total Users | ✅ | user_pseudo_id |
| Total Events | ✅ | COUNT(*) |
| Page Views | ✅ | event_name = 'page_view' |
| Active Clients | ✅ | Subdomain extraction |
| Users Over Time | ✅ | GROUP BY event_date |
| Feature Usage | ✅ | URL → feature CASE |
| Top Clients | ✅ | Subdomain ranking |

### Cap 2 — USERS ✅

| Métrica | GA4 | Notas |
|---------|-----|-------|
| DAU / WAU / MAU | ✅ | user_pseudo_id + time filter |
| New vs Returning | ✅ | first_visit event |
| Sessions per User | ✅ | session_start / users |
| Avg. Engagement Time | ✅ | engagement_time_msec |
| Engaged Sessions % | ✅ | session_engaged param |
| Users Trend | ✅ | New + Returning daily |
| Bounce Rate | ✅ | Non-engaged sessions |

### Cap 3 — FEATURES ✅

| Métrica | GA4 | Notas |
|---------|-----|-------|
| Views por Feature | ✅ | URL pattern CASE |
| Distribución % | ✅ | % del total |
| Feature Adoption | ✅ | Clientes por feature |
| Feature Trend | ✅ | date + feature |
| Top Pages | ✅ | page_location ranking |

### Cap 4 — CLIENTS ✅

| Métrica | GA4 | Notas |
|---------|-----|-------|
| Top Clients | ✅ | Subdomain extraction |
| Users per Client | ✅ | user_pseudo_id per subdomain |
| Page Views per Client | ✅ | page_view per subdomain |
| Features per Client | ✅ | Subdomain + URL feature |
| Client Activity Trend | ✅ | Filterable line chart |

### Cap 5 — TRAFFIC ✅

| Métrica | GA4 | Notas |
|---------|-----|-------|
| Traffic by Source | ✅ | traffic_source.source |
| Traffic by Medium | ✅ | traffic_source.medium |
| Top Referrers | ✅ | page_referrer param |
| Sessions by Day | ✅ | EXTRACT from event_date |
| First Visits Trend | ✅ | first_visit daily |

### Cap 6 — TECHNOLOGY ✅

| Métrica | GA4 | Notas |
|---------|-----|-------|
| Device Category | ✅ | device.category |
| Browser Distribution | ✅ | device.browser |
| Operating System | ✅ | device.operating_system |
| Device Language | ✅ | device.language |

### Cap 7 — GEOGRAPHY ✅

| Métrica | GA4 | Notas |
|---------|-----|-------|
| Users by Country | ✅ | geo.country |
| Users by Region | ✅ | geo.region |
| Users by City | ✅ | geo.city |
| Activity by Continent | ✅ | geo.continent |

### Cap 8 — EVENTS ✅

| Métrica | GA4 | Notas |
|---------|-----|-------|
| Event Breakdown | ✅ | GROUP BY event_name |
| Event Volume Trend | ✅ | Stacked by event daily |
| Events per Session | ✅ | events / sessions |
| Form Conversion | ✅ | form_submit / form_start |
| Scroll by Page | ✅ | scroll + page_location |

### Resultado

**~35 métricas planificadas → ~35 disponibles en GA4 BigQuery.** No se necesitan datos externos, CRM, billing, ni custom events para construir los 8 tabs.

---

## 12. Custom Events — Fase Futura

Estos eventos **no existen actualmente** en GA4. Requieren agregar `gtag('event', ...)` en el código frontend por el equipo de desarrollo. Se incluyen como referencia para expandir el dashboard en el futuro.

| Evento | Feature | Cuándo se dispara | Parámetros sugeridos |
|--------|---------|-------------------|---------------------|
| `deal_created` | Buybox | Usuario crea un deal | deal_id, deal_value |
| `deal_edited` | Buybox | Usuario edita un deal | deal_id, fields_changed |
| `weight_modified` | Buybox | Modifica weights | weight_type |
| `property_imported` | Properties | Importación completada | count, source |
| `property_exported` | Properties | Exportación completada | count, format |
| `rapid_response_created` | Rapid Response | Crea rapid response | response_id, property_id |
| `skip_trace_completed` | Skip Trace | Skip trace finalizado | records_count, success_rate |
| `api_token_created` | Integrations | Token API creado | token_name |
| `salesforce_connected` | Integrations | Salesforce integrado | connection_type |
| `buyer_added` | Buyers List | Buyer agregado | buyer_id, source |

**Implementación:**
```javascript
// Ejemplo en el frontend
gtag('event', 'deal_created', {
  'deal_id': '12345',
  'deal_value': 150000,
  'feature': 'buybox'
});
```

> **⛔ No necesarios para los 8 tabs actuales.** Los custom events agregan profundidad (ej: no solo quién visitó /buybox, sino cuántos deals crearon), pero los 8 capítulos funcionan completamente con eventos estándar GA4.

---

## Referencia Rápida

### Conexión BigQuery

```typescript
// src/lib/bigquery.ts
import { BigQuery } from '@google-cloud/bigquery';
const bigquery = new BigQuery({
  projectId: process.env.GOOGLE_CLOUD_PROJECT, // web-app-production-451214
});
```

### Variables de Entorno (.env.local)

```
GOOGLE_CLOUD_PROJECT=web-app-production-451214
BIGQUERY_DATASET=analytics_489035450
```

### Estructura del Proyecto

```
src/
├── app/
│   ├── api/metrics/route.ts    ← API endpoint (4 queries en paralelo)
│   ├── page.tsx                ← Dashboard principal
│   ├── layout.tsx              ← Root layout (Inter font)
│   └── globals.css             ← Design system tokens
├── components/
│   ├── Scorecard.tsx           ← Tarjetas de métricas
│   ├── TimeSeriesChart.tsx     ← Line chart (Recharts)
│   ├── FeatureBarChart.tsx     ← Bar chart horizontal
│   └── ClientsTable.tsx        ← Tabla de clientes
└── lib/
    ├── bigquery.ts             ← Cliente BigQuery
    └── queries.ts              ← SQL query definitions
```

### Design System

- **Font:** Inter (400, 500, 600)
- **Primary Color:** Blue (#1d4ed8 / main-700)
- **Charts:** Recharts con fill/stroke #1d4ed8
- **Cards:** bg-surface-raised, border-stroke, shadow-sm → shadow-md on hover
- **Grid:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`

### Patrón para Agregar un Nuevo Tab

1. Crear query(s) en `src/lib/queries.ts`
2. Crear API route o extender `/api/metrics` en `src/app/api/metrics/route.ts`
3. Crear componentes React en `src/components/`
4. Crear página del tab o sección en `src/app/page.tsx`
5. Conectar datos via `useEffect` + `fetch`
6. Aplicar design system tokens

---

*Documento generado: Febrero 2026*  
*Versión: 2.0 — Alineado con los 8 tabs del dashboard*

# Plan: Centralizar Axiomas en Aurora PostgreSQL

## Context

Los axiomas son el sistema de integridad de datos de 8020REI. Actualmente viven en **MySQL del backoffice** (4 tablas) y solo migracion escribe resultados. El objetivo es moverlos a **Aurora PostgreSQL** para:
- Centralizar axiomas de **multiples fuentes** (migracion, data team, QA, etc.)
- Consumirlos desde **Grafana** (dashboards/alertas) y **BigQuery** (analytics)
- Exponer una **API de ingestion** para que cualquier equipo registre axiomas

Ya existe infraestructura Aurora en el proyecto (`main8020db`, `grafana8020db`) usando RDS Data API.

---

## Arquitectura

```
              PRODUCTORES (escriben axiomas)
  ┌────────────────┬────────────────┬────────────────┐
  │  migracion     │  Data Team     │  QA Team       │
  │  (Laravel)     │  (Python/      │  (CI/CD)       │
  │                │   Airflow)     │                │
  │ AxiomAurora    │  HTTP POST     │  HTTP POST     │
  │ Repository     │                │                │
  └──────┬─────────┴───────┬────────┴───────┬────────┘
         │ RDS Data API    │ HTTPS          │ HTTPS
         │         ┌───────▼────────────────▼────────┐
         │         │  API Gateway + Lambda            │
         │         │  POST /axioms/results            │
         │         │  POST /axioms/results/batch      │
         │         └───────┬─────────────────────────┘
         │                 │ RDS Data API
  ┌──────▼─────────────────▼─────────────────────────┐
  │          Aurora PostgreSQL (axioms8020db)          │
  │  axiom_results (partitioned mensual)              │
  │  axiom_execution_logs                             │
  │  axiom_check_configs                              │
  │  axiom_resolution_logs                            │
  └──────┬─────────────────┬──────────────┬──────────┘
  ┌──────▼──────┐  ┌───────▼──────┐  ┌───▼──────────┐
  │ Backoffice  │  │  Grafana     │  │  BigQuery    │
  │ Dashboard   │  │  PG directo  │  │  Export      │
  └─────────────┘  └──────────────┘  └──────────────┘
```

**Decisiones clave:**
- **Migracion escribe directo** via RDS Data API (patron existente, sin hop extra)
- **Equipos externos escriben via API Gateway + Lambda** (HTTP simple, language-agnostic)
- **Grafana conecta directo** al PostgreSQL de Aurora (datasource nativo PG)
- **BigQuery** via export diario programado (volumen bajo, batch es suficiente)

---

## Schema PostgreSQL (DDL)

### 1. axiom_results (particionada por mes)

```sql
CREATE TABLE axiom_results (
    id              BIGSERIAL,
    -- Identificacion multi-source (NUEVO)
    source          VARCHAR(50)   NOT NULL DEFAULT 'migracion',
    module          VARCHAR(100)  NOT NULL,
    -- Contexto cliente (nullable para axiomas no-cliente)
    domain_id       INTEGER,
    domain_name     VARCHAR(100),
    -- Identificacion del check
    check_type      VARCHAR(50)   NOT NULL,
    check_key       VARCHAR(100)  NOT NULL,
    check_label     VARCHAR(255)  NOT NULL,
    -- Resultado
    value           INTEGER       NOT NULL DEFAULT 0,
    status          VARCHAR(20)   NOT NULL DEFAULT 'success'
        CHECK (status IN ('success', 'warning', 'error', 'info', 'skip')),
    details         JSONB,
    -- Timing
    executed_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, executed_at)
) PARTITION BY RANGE (executed_at);

CREATE INDEX idx_results_domain_type ON axiom_results (domain_id, check_type, executed_at DESC);
CREATE INDEX idx_results_source_module ON axiom_results (source, module, executed_at DESC);
CREATE INDEX idx_results_status ON axiom_results (status, executed_at DESC);
CREATE INDEX idx_results_check_key ON axiom_results (check_key, executed_at DESC);
CREATE INDEX idx_results_details ON axiom_results USING GIN (details);
```

### 2. axiom_execution_logs

```sql
CREATE TABLE axiom_execution_logs (
    id              BIGSERIAL     PRIMARY KEY,
    source          VARCHAR(50)   NOT NULL DEFAULT 'migracion',
    domain_id       INTEGER,
    execution_type  VARCHAR(30)   NOT NULL DEFAULT 'manual'
        CHECK (execution_type IN ('manual', 'scheduled', 'all_domains', 'api', 'ci_cd')),
    started_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    finished_at     TIMESTAMP,
    status          VARCHAR(20)   NOT NULL DEFAULT 'running'
        CHECK (status IN ('running', 'completed', 'failed')),
    error_message   TEXT,
    total_checks    INTEGER       DEFAULT 0,
    warnings_found  INTEGER       DEFAULT 0,
    errors_found    INTEGER       DEFAULT 0,
    metadata        JSONB,
    created_at      TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT NOW()
);
```

### 3. axiom_check_configs

```sql
CREATE TABLE axiom_check_configs (
    id                  BIGSERIAL     PRIMARY KEY,
    source              VARCHAR(50)   NOT NULL DEFAULT 'migracion',
    check_type          VARCHAR(50)   NOT NULL,
    check_key           VARCHAR(100)  NOT NULL,
    check_label         VARCHAR(255)  NOT NULL,
    check_description   VARCHAR(500),
    is_active           BOOLEAN       NOT NULL DEFAULT TRUE,
    warning_threshold   INTEGER       DEFAULT 1,
    error_threshold     INTEGER       DEFAULT 10,
    sort_order          INTEGER       DEFAULT 0,
    metadata            JSONB,
    created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
    UNIQUE (source, check_type, check_key)
);
```

### 4. axiom_resolution_logs

```sql
CREATE TABLE axiom_resolution_logs (
    id                  BIGSERIAL     PRIMARY KEY,
    domain_id           INTEGER       NOT NULL,
    check_key           VARCHAR(100)  NOT NULL,
    action              VARCHAR(100)  NOT NULL,
    affected_ids        JSONB,
    affected_count      INTEGER       DEFAULT 0,
    result              VARCHAR(20)   NOT NULL
        CHECK (result IN ('success', 'partial', 'failed')),
    failure_reason      TEXT,
    before_snapshot     JSONB,
    after_snapshot      JSONB,
    resolved_by         INTEGER       DEFAULT 0,
    source              VARCHAR(50)   NOT NULL DEFAULT 'migracion',
    note                TEXT,
    created_at          TIMESTAMP     NOT NULL DEFAULT NOW()
);
```

### 5. Views optimizadas para Grafana

```sql
-- Time-series para dashboards
CREATE VIEW v_axiom_timeseries AS
SELECT
    executed_at AS time, source, module, domain_name,
    check_type, check_key, check_label, value, status,
    CASE status WHEN 'error' THEN 3 WHEN 'warning' THEN 2
                WHEN 'info' THEN 1 ELSE 0 END AS severity_score
FROM axiom_results;

-- Estado actual (ultimo resultado por check por dominio)
CREATE VIEW v_axiom_latest AS
SELECT DISTINCT ON (source, domain_id, check_key)
    id, source, module, domain_id, domain_name,
    check_type, check_key, check_label,
    value, status, details, executed_at
FROM axiom_results
ORDER BY source, domain_id, check_key, executed_at DESC;
```

### Decisiones de diseno del schema

| Decision | Razon |
|----------|-------|
| `source` en todas las tablas | Identifica equipo/sistema productor |
| `module` en results | Agrupa checks dentro de un source |
| VARCHAR con CHECK en vez de ENUM | Multi-source implica que los valores evolucionan; ALTER TYPE es doloroso |
| Status `info` y `skip` agregados | Data team y QA pueden necesitar resultados informativos |
| JSONB para details/metadata | Patron existente; indexable con GIN para Grafana |
| Particionamiento mensual | Queries time-series rapidos; retencion barata |
| Sin FK a domains | Domains viven en backoffice MySQL; domain_id es referencia logica |

---

## API de Ingestion (Lambda + API Gateway)

**Auth:** API key en header `x-api-key` (un key por equipo via API Gateway usage plans)

### POST /axioms/results (un resultado)

```json
// Request
{
    "source": "data_team",
    "module": "data_quality",
    "domain_id": 5,                        // opcional
    "domain_name": "client_name",          // opcional
    "check_type": "completeness",
    "check_key": "missing_phone_numbers",
    "check_label": "Properties sin telefono",
    "value": 142,
    "status": "warning",                   // opcional (auto-calcula si hay thresholds)
    "details": { "sample_ids": [1001, 1002], "percentage": 14.2 },
    "executed_at": "2026-03-31T10:00:00Z"  // opcional (default: now)
}

// Response 201
{ "id": 98765, "status": "created", "computed_status": "warning" }
```

### POST /axioms/results/batch (hasta 100 resultados)

```json
{
    "source": "qa_team",
    "results": [
        {
            "module": "regression",
            "check_type": "api_tests",
            "check_key": "buyers_endpoint_latency",
            "check_label": "Buyers API p99 latency",
            "value": 850,
            "details": { "p99_ms": 850, "threshold_ms": 500 }
        }
    ]
}

// Response 201
{ "inserted": 1, "execution_id": 4567 }
```

### POST /axioms/executions (iniciar ejecucion)

```json
{
    "source": "data_team",
    "execution_type": "scheduled",
    "metadata": { "airflow_dag_id": "axioms_daily" }
}
// Response 201 → { "execution_id": 4567, "status": "running" }
```

### PATCH /axioms/executions/{id} (completar/fallar)

```json
{ "status": "completed", "total_checks": 12, "warnings_found": 2, "errors_found": 0 }
```

### GET /axioms/health

```json
{ "status": "ok", "database": "connected" }
```

---

## Integracion con consumidores

### Grafana (PostgreSQL datasource directo)

- **Conexion:** Aurora reader endpoint → `axioms8020db`
- **User:** `grafana_reader` (read-only, `GRANT SELECT` en todas las tablas/views)
- **SSL:** requerido (default Aurora)

| Panel sugerido | Query target | Tipo |
|----------------|-------------|------|
| Estado actual por dominio | `v_axiom_latest` | Tabla |
| Errores en el tiempo | `v_axiom_timeseries WHERE status='error'` | Time series |
| Trend warnings 30d | `v_axiom_timeseries` agrupado por dia | Time series |
| Health heatmap | `v_axiom_latest` pivot domain x check_type | Heatmap |
| Comparacion por source | `v_axiom_latest` agrupado por source | Bar chart |

**Alertas Grafana:**
- Check con `status = 'error'` por 2+ ejecuciones consecutivas
- Execution log con `status = 'failed'`
- Sin resultados de un source en 48 horas

### BigQuery (export diario)

Lambda en cron diario exporta `axiom_results` del dia anterior a GCS → BigQuery Load.
Volumen bajo (cientos de rows/dia), batch diario es suficiente.

---

## Mapeo backward-compatible

| MySQL actual | Aurora nuevo |
|---|---|
| `check_type = 'action_plans'` | `source='migracion', module='integrity', check_type='action_plans'` |
| `check_type = 'scoring_rules'` | `source='migracion', module='integrity', check_type='scoring_rules'` |
| `check_type = 'payments'` | `source='migracion', module='financial', check_type='payments'` |
| `check_type = 'salesforce_download'` | `source='migracion', module='salesforce', check_type='salesforce_download'` |

---

## Fases de rollout

| Fase | Que | Archivos clave | Riesgo |
|------|-----|----------------|--------|
| **0: Setup DB** | Crear `axioms8020db`, correr DDL, particiones iniciales, agregar config | `config/services.php` | Bajo |
| **1: Dual-Write** | Nuevo `AxiomAuroraRepository`, migracion escribe a MySQL + Aurora | `services/AxiomResultService.php`, nuevo `app/Repositories/AxiomAuroraRepository.php` | Bajo (MySQL sigue siendo primario) |
| **2: Backfill** | Comando artisan para copiar historico de MySQL → Aurora | Nuevo comando one-time | Bajo |
| **3: Switch reads** | Backoffice dashboard lee de Aurora; Grafana datasource configurado | Backoffice `AxiomDashboardService.php` | Medio |
| **4: Remove MySQL** | Parar dual-write, drop tablas MySQL | `AxiomResultService.php`, backoffice migrations | Bajo (post-validacion) |
| **5: Ingestion API** | Deploy Lambda + API GW, distribuir keys, onboard equipos | Nuevo repo Lambda | Bajo (independiente) |

**Fase 5 se puede desarrollar en paralelo con fases 3-4.**

---

## Archivos criticos (implementacion en migracion)

- `services/AxiomResultService.php` — modificar `saveResults()`, `createExecutionLog()`, etc. para dual-write
- `app/Repositories/ApiTokenUsageLogRepository.php` — patron de referencia para el nuevo repo
- `services/AuroraDataService.php` — cliente RDS Data API que usara el nuevo repo
- `config/services.php` — agregar `axioms_db` junto a `main_db` y `grafana_db`
- `app/Repositories/HybridQueryRepository.php` — patron para queries de lectura

## Verificacion

1. Fase 0: Conectar a Aurora via `psql` o Grafana y verificar tablas/views
2. Fase 1: Ejecutar `php artisan app:axioms` para un dominio, verificar datos en Aurora y MySQL
3. Fase 2: Comparar conteos MySQL vs Aurora post-backfill
4. Fase 3: Dashboard backoffice muestra mismos datos que antes
5. Fase 5: `curl -X POST` al API con payload de prueba, verificar en Aurora

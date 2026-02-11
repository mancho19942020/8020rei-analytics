# 🏗️ Product Operations Dashboard — Arquitectura

## Filosofía de Capas (Stakeholder Layers)

| Capa | Audiencia | Qué ve | Frecuencia sugerida |
|------|-----------|--------|---------------------|
| **L1 — Executive** | CEO, Leadership | KPIs agregados, salud general, alertas críticas | Semanal |
| **L2 — Head of Product** | Camilo, Product Leads | Métricas por dominio, tendencias, bottlenecks, uso de herramientas | Diaria |
| **L3 — Operativo** | Ingeniería, Data, QA | Detalle granular, logs, validaciones, pipelines | Tiempo real / Diaria |

---

## Categorías del Dashboard

### 1. 📊 Acquisition & Traffic (Google Analytics)

| Elemento | Dominios | Fuente | Contacto |
|----------|----------|--------|----------|
| Sessions, Users, Conversions | REI, Roofing | BigQuery (GA export) | — |
| Landing page performance | REI, Roofing | BigQuery (GA export) | — |
| Channel attribution | REI, Roofing | BigQuery (GA export) | — |

**Vista L1:** Tráfico total y conversion rate por dominio.
**Vista L2:** Breakdown por canal, landing page, tendencia semanal.
**Vista L3:** Eventos custom, debugging de tracking.

---

### 2. ⚙️ Data Processing & ETL Pipelines

| Elemento | Dominios | Fuente | Contacto |
|----------|----------|--------|----------|
| Pipeline Bronze → Silver → Gold | REI, Roofing | AWS (Aurora/Dynamo/Athena) | **Diego** |
| Buyers List processing | REI | AWS | **Diego** |
| Volumen procesado, latencia, errores | REI, Roofing | AWS / BigQuery | **Diego** |

**Vista L1:** % pipelines saludables (verde/amarillo/rojo), volumen procesado.
**Vista L2:** Latencia por stage, throughput, tendencias de volumen.
**Vista L3:** Jobs fallidos, registros rechazados, logs de error.

---

### 3. 🤖 Machine Learning Models (Deals & Scoring)

| Elemento | Dominios | Fuente | Contacto |
|----------|----------|--------|----------|
| Deal scoring models | REI | Data Science | **Eduardo** |
| Model performance (precision, recall) | REI | Data Science | **Eduardo** |
| Drift detection | REI | Data Science | **Eduardo** |

**Vista L1:** # deals generados, accuracy general.
**Vista L2:** Performance por modelo, distribución de scores, drift alerts.
**Vista L3:** Feature importance, retraining logs, A/B results.

---

### 4. ✅ QA & Data Quality

| Elemento | Fuente | Contacto | Estado actual |
|----------|--------|----------|---------------|
| Validación de Axiomas | Back Office + Slack | **Johan** | Alertas a Slack |
| Validación de columnas BuyBox | Back Office | **Nicolás Hernández** | En back office |
| Pruebas Smoke & Sanity | Slack | **Nicolás Hernández** | Alertas a Slack |

**Vista L1:** Semáforo de calidad de datos (pass/fail rate).
**Vista L2:** Axiomas fallidos por cliente/dominio, tendencia de errores.
**Vista L3:** Detalle de cada axioma, columna, test case fallido.

---

### 5. 🔧 Uso de Herramientas Internas (Tool Adoption & Usage)

#### 5.1 SILO (Scraping)
| Métrica | Fuente | Contacto |
|---------|--------|----------|
| Capacidad utilizada vs. disponible | Proveedor externo | — |
| Usuarios activos, dominios scrapeados | Proveedor externo | — |
| Costo vs. presupuesto | Proveedor externo | — |

#### 5.2 Rapid Response (Direct Mail individual)
| Métrica | Fuente | Contacto |
|---------|--------|----------|
| Cartas enviadas, tasa de respuesta | Interno (no integrado) | **Job** |
| Costo por carta | Interno | **Job** |

#### 5.3 Smart Drop (Direct Mail masivo)
| Métrica | Fuente | Contacto |
|---------|--------|----------|
| Volumen de envíos, campañas activas | Interno (no integrado) | **Job** |
| ROI por campaña | Interno | **Job** |

#### 5.4 Skip Trace
| Métrica | Proveedores | Fuente | Contacto |
|---------|-------------|--------|----------|
| Volumen usado por proveedor | **Batch Elites**, **Direct Skip** | Dominios internos | **Johan** |
| Gasto vs. facturación | Ambos proveedores | Dominios internos | **Johan** |
| Usuarios activos | Ambos proveedores | Dominios internos | **Johan** |
| Compromisos contractuales vs. uso real | Ambos proveedores | Dominios internos | **Johan** |

**Vista L1:** Gasto total en herramientas, adoption rate, ROI agregado.
**Vista L2:** Uso por herramienta, por cliente, por dominio. Gaps de adopción.
**Vista L3:** Logs de uso, detalle por usuario, errores de integración.

---

### 6. 🔄 Salesforce & Feedback Loop

| Elemento | Fuente | Contacto |
|----------|--------|----------|
| Integraciones activas por cliente | BigQuery (SF export) | **Job / Ignacio / Johan** |
| Leads, Appointments, Deals entregados | BigQuery | **Job / Ignacio** |
| Auditoría de entrega (¿cliente recibe?) | BigQuery | **Johan** (API docs) |
| Match quality (deals fuera de mercado) | BigQuery | **Eduardo / Johan** |
| Alertas de integración | BigQuery | **Johan** |
| Feedback Loop (recepción → acción) | BigQuery / Salesforce | **Job / Ignacio** |

**Vista L1:** Clientes activos, leads/deals entregados, % match en mercado.
**Vista L2:** Funnel por cliente (leads → appointments → deals), alertas de mismatch, integraciones rotas.
**Vista L3:** Registros individuales, payloads de API, logs de sincronización.

---

## 📋 Resumen de Fuentes de Datos

| Fuente | Categorías que alimenta | Estado |
|--------|------------------------|--------|
| **BigQuery** | GA, Salesforce, Feedback Loop | ✅ Integrado |
| **AWS (Aurora/Dynamo/Athena)** | ETL Pipelines, Buyers List | ✅ Integrado |
| **Data Science (Eduardo)** | ML Models | ✅ Integrado |
| **Back Office** | QA Axiomas, Validaciones | ⚠️ Parcial (Slack) |
| **Slack** | QA alerts (Axiomas, Smoke/Sanity) | ⚠️ Solo notificaciones |
| **Proveedor SILO** | Scraping usage | ⚠️ Externo, revisar API |
| **Herramientas DM (Rapid Response, Smart Drop)** | Direct Mail | ❌ No integrado |
| **Skip Trace (Batch Elites, Direct Skip)** | Skip Trace | ⚠️ En dominios, no centralizado |

---

## 📋 Resumen de Contactos

| Persona | Responsable de |
|---------|---------------|
| **Diego** | ETL Pipelines, Buyers List, infra AWS |
| **Eduardo** | Modelos ML, Deal scoring |
| **Johan** | Axiomas QA, Skip Trace, Salesforce API docs |
| **Nicolás Hernández** | Validación BuyBox, Smoke & Sanity tests |
| **Job** | Direct Mail (Rapid Response, Smart Drop), Salesforce integraciones |
| **Ignacio** | Salesforce integraciones, Feedback Loop |

---

## 🚀 Recomendación de Priorización (Build Order)

| Fase | Categoría | Razón |
|------|-----------|-------|
| **Fase 1** | Salesforce & Feedback Loop + Data Processing | Ya en BigQuery, alto impacto de negocio |
| **Fase 2** | Google Analytics + QA | Ya en BigQuery/Slack, visibilidad rápida |
| **Fase 3** | ML Models | Requiere coordinación con Eduardo |
| **Fase 4** | Herramientas (SILO, Skip Trace) | Requiere integración con proveedores |
| **Fase 5** | Direct Mail (Rapid Response, Smart Drop) | No integrado, requiere trabajo previo |

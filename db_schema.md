# Skiptrace — Referencia de base de datos para el equipo de Dashboard

Documento orientado al equipo que está construyendo el dashboard de métricas
(gasto, volumen de requests, hits por proveedor, litigators, etc.). Describe
qué tablas existen, qué significa cada campo, qué valores pueden aparecer y
cómo consultarlas de forma eficiente.

> Repositorio de origen: `/Users/jam/Desarrollo/skiptrace`
> Handler Lambda: `Skiptrace-Function` (us-east-1, Node.js 22.x)
> Rama actual: `feat/multi-provider`
> Fecha de este snapshot: 2026-04-16

---

## 1. Infraestructura y acceso

| Recurso | Valor |
|---|---|
| Cuenta AWS | `611201211946` (8020rei prod — misma cuenta donde vive Aurora) |
| Región | `us-east-1` |
| Tabla de datos (cache) | `skiptrace-db` |
| Tabla de logs | `skiptrace-logs` |
| Modo de facturación | `PAY_PER_REQUEST` (on-demand) en ambas tablas |
| Clase de almacenamiento | `skiptrace-db` = `STANDARD`; `skiptrace-logs` = `STANDARD_IA` |
| Protección de borrado | **deshabilitada** (ambas tablas) |

### Credenciales sugeridas para el dashboard

El dashboard necesita solo permisos **de lectura**. Recomendación: crear un
IAM user o rol dedicado (no reutilizar claves humanas) con una política
mínima como:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:DescribeTable",
        "dynamodb:GetItem",
        "dynamodb:BatchGetItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:611201211946:table/skiptrace-db",
        "arn:aws:dynamodb:us-east-1:611201211946:table/skiptrace-db/index/*",
        "arn:aws:dynamodb:us-east-1:611201211946:table/skiptrace-logs",
        "arn:aws:dynamodb:us-east-1:611201211946:table/skiptrace-logs/index/*"
      ]
    }
  ]
}
```

> Las credenciales de Aurora **sirven solo para Postgres/MySQL**, no para
> DynamoDB. Hay que crear un IAM user/role distinto para el dashboard.

### Tamaño actual de las tablas (snapshot)

| Tabla | Items | Tamaño |
|---|---|---|
| `skiptrace-db` | ≈ 29,170,234 | ≈ 10.45 GB |
| `skiptrace-logs` | ≈ 39,665 | ≈ 20.5 MB |

> `skiptrace-logs` es chica y perfecta para dashboards operativos (scans
> baratos). `skiptrace-db` es grande; **no hacer Scan completo**, siempre
> Query con clave primaria o GSI.

---

## 2. Tabla `skiptrace-logs` — métricas por request

Es la tabla clave para el dashboard: **una fila = una llamada al Lambda**
(es decir, un skiptrace iniciado por un cliente). Contiene el resumen
agregado del resultado, los errores, tiempos y estadísticas por proveedor.

### 2.1 Claves e índices

| Tipo | Atributo | Notas |
|---|---|---|
| Partition key (HASH) | `DomainDate` (String) | Formato `{domain}#{YYYY-MM-DD}`, ej. `atlasproperty.8020rei.com#2026-02-23`. Al mezclar dominio + día, todas las requests de un cliente en un día caen en la misma partición — ideal para filtros "dominio × día". |
| Sort key (RANGE) | `CreatedAt` (Number) | Epoch en **milisegundos** (ej. `1771852730334`). Permite ordenar requests dentro del día. |

No tiene GSI. Filtros por rango de fecha más amplio (últimos 30 días,
últimos 7 días) requieren **scan con FilterExpression** o, lo más eficiente,
hacer N `Query` paralelos — uno por día — reconstruyendo `DomainDate`.

### 2.2 Campos

| Campo | Tipo | Descripción | Valores posibles |
|---|---|---|---|
| `DomainDate` | String | PK: `domain#YYYY-MM-DD`. El `domain` es el subdominio del cliente (ej. `zoomrei.8020rei.com`). | Cualquier dominio cliente válido. |
| `CreatedAt` | Number | Epoch ms del inicio del request. | `Date.now()` |
| `CreatedAtTimestamp` | String (ISO-8601) | Redundante con `CreatedAt`, pero legible. | ISO string |
| `UpdatedAt` | Number | Epoch **en segundos** de la última actualización de este log. **Ojo: no es ms.** | Epoch seconds |
| `UpdatedAtTimestamp` | String (ISO-8601) | Última update legible. | ISO string |
| `SkiptraceId` | Number | ID del skip trace en el sistema Laravel del cliente (viene en el evento). | Entero |
| `BatchId` | Number | Número de lote. Un `SkiptraceId` puede dispararse en múltiples batches. | Entero |
| `Token` | String | Token de autenticación del cliente para su webhook. **Sensible** — no mostrar en UIs públicas. | `$2y$10$...` bcrypt-like |
| `TotalProperties` | Number | Total de propiedades recibidas en el evento de entrada. | ≥ 0 |
| `TotalPropertiesFoundDB` | Number | Propiedades servidas desde el cache de DynamoDB (no fueron a ningún proveedor). | 0..TotalProperties |
| `TotalPropertiesSentToBatchLeads` | Number | **Legacy / deprecated**: propiedades enviadas al proveedor en el flujo antiguo. En multi-proveedor representa "properties que fueron a algún proveedor". Para nuevos cálculos usar `ProviderStats.<provider>.sent`. | 0..TotalProperties |
| `MonthCondition` | Number | Ventana (en meses) del cache. Si la última vez que se skiptraceó una propiedad fue hace ≤ `MonthCondition` meses, se usa cache. Típicos: 1, 3, 48. | 1, 3, 6, 12, 48, ... |
| `CheckLitigators` | Boolean | `true` → se llama a Blacklist Alliance para marcar litigators/DNC. | `true` / `false` |
| `ProvidersUsed` | List<String> | Orden de cascada efectivo. Vacío o ausente en logs antiguos. | Subconjunto ordenado de `["directskip", "batchleads"]` |
| `ProviderStats` | Map | Métricas por proveedor. Ver §2.3. | Ver §2.3 |
| `TotalDurationMs` | Number | Wall-clock total (ms) de la parte de proveedores (min `startedAt` → max `finishedAt`). No incluye cache ni webhook. | ≥ 0 |
| `TotalHitsBatchLeads` | Number | **Legacy** — equivalente a `ProviderStats.batchleads.hits`. | ≥ 0 |
| `TotalNumbersSentToBlackList` | Number | Propiedades con al menos un teléfono no-DNC enviadas al bulk-lookup de Blacklist Alliance. **Cuidado: se cuentan propiedades, no teléfonos** (bug histórico en el nombre). | ≥ 0 |
| `TotalHitsBlacklist` | Number | Valor que devuelve Blacklist en el campo `count` (total de números procesados por Blacklist en esa llamada). | ≥ 0 |
| `Status` | String | Etapa final del procesamiento. Ver tabla de valores abajo. | `received`, `dynamo`, `directskip`, `batchleads`, `updateDynamo`, `sentToWebHook`, `finished`. En prácticamente todos los items completados queda `"finished"`. |
| `ErrorInfo` | String / Null | Campo libre de error. Hoy en casi todos los logs aparece `NULL`. | Null o mensaje |
| `BatchLeadsError` | String / Null | **Legacy** — concatenación de mensajes de error de BatchLeads. Hoy se pobla desde `ProviderStats.batchleads.errorMessages`. | Null o "..." |
| `BlackListError` | String / Null | **Legacy** — siempre Null en logs recientes. El error de blacklist ahora se maneja vía `ProviderError` + Slack. | Null |
| `WebhookError` | String / Null | Error al enviar el webhook al cliente. | Null o mensaje |

#### Valores posibles de `Status`

El campo se reescribe varias veces durante el ciclo de vida del request;
lo que quedará en DynamoDB es el **último valor**:

| Status | Cuándo se pone |
|---|---|
| `received` | Valor inicial al crear el log. |
| `dynamo` | Se terminó la búsqueda en el cache. |
| `batchleads` | Entró al proveedor BatchLeads. |
| `directskip` | Entró al proveedor DirectSkip. |
| `updateDynamo` | Va a escribir resultados nuevos en el cache. |
| `sentToWebHook` | Acaba de enviar el webhook al cliente. |
| `finished` | Terminó OK (valor final esperado). |

> Si un item aparece con un Status distinto de `finished`, casi siempre es
> un request que **murió a mitad de camino** (lambda timeout, error no
> capturado, etc.). Útil para una métrica de "requests abortados".

### 2.3 Estructura de `ProviderStats`

> **Contexto importante para el dashboard**: antes existían campos planos
> específicos de BatchLeads a nivel del log (`TotalPropertiesSentToBatchLeads`,
> `TotalHitsBatchLeads`, `BatchLeadsError`). Funcionaban cuando solo había
> un proveedor, pero no escalan: cada nuevo proveedor obligaría a añadir
> tres columnas más. Como el sistema se está moviendo a multi-proveedor
> (hoy DirectSkip + BatchLeads, y se podrían sumar más), se introdujo el
> mapa `ProviderStats` como **fuente única de verdad para todas las
> métricas por proveedor dentro de un skiptrace** (identificado por su
> `SkiptraceId` / `BatchId`). Las claves del mapa son los nombres de los
> proveedores, así que agregar uno nuevo no requiere cambios de schema —
> simplemente aparece una nueva entrada. Los campos planos legacy se
> siguen escribiendo por compatibilidad, pero **el dashboard debe leer
> `ProviderStats`** y tratar los legacy como fallback para logs antiguos.

```jsonc
ProviderStats = {
  "directskip": {
    "sent": 500,               // properties entregadas al proveedor
    "hits": 468,               // properties que volvieron con ≥1 phone
    "misses": 32,              // sent - hits
    "errors": 0,               // # de chunks que tiraron excepción
    "errorMessages": [],       // primeros 5 strings de error (cap)
    "chunks": 10,              // # de chunks HTTP procesados
    "order": 0,                // posición en la cascada (0-based)
    "startedAt": "2026-03-06T16:09:55.081Z",
    "finishedAt": "2026-03-06T16:10:45.700Z",
    "durationMs": 50619
  },
  "batchleads": { ... mismo shape ... }
  // si mañana se agrega otro proveedor, aparecerá aquí como una nueva key
}
```

Reglas útiles:
- **Hit-rate por proveedor**: `hits / sent`.
- **Error-rate**: `errors / chunks` (es error por chunk, no por propiedad).
- **Cascade efficiency**: hits con `order=0` vs hits con `order=1` — mide qué
  tanto rescata el segundo proveedor.
- Si un proveedor no corrió (porque el anterior cubrió todo), **no aparece
  en el mapa**. No asumir que siempre están las dos claves.

### 2.4 Para estimar costos

El modelo actual no guarda el costo monetario directamente. El dashboard
puede calcularlo con:

```
costo = Σ ProviderStats[p].sent * costo_unitario[p]
```

`costo_unitario` es un valor externo al sistema (viene del contrato con
cada proveedor). Recomendación: guardar la tabla de tarifas del lado del
dashboard (no inventar un campo nuevo en DynamoDB).

Adicional: `TotalNumbersSentToBlackList` x tarifa-Blacklist = costo de
verificación DNC.

---

## 3. Tabla `skiptrace-db` — cache de resultados (propiedad × contacto)

Cada item representa **un contacto (teléfono o email) de una propiedad**.
Una propiedad con 3 teléfonos y 2 emails genera 5 items.

### 3.1 Claves e índices

| Tipo | Atributo | Notas |
|---|---|---|
| Partition key | `ZipCode` (String) | ZIP de la propiedad (tipado como String aunque son dígitos). |
| Sort key | `Address#PhoneNumber` (String) | Compuesto `{address}#{phone_or_email}`. Permite `begins_with(address)` para traer todos los contactos de una dirección. |
| GSI `PhoneNumber-index` | HASH: `PhoneNumber` | Proyección: **ALL**. Usado para lookups directos por número (ej. findLitigators). |
| GSI `MailingZip-MailingAddress-index` | HASH: `MailingZip`, RANGE: `MailingAddress` | Proyección: **ALL**. Usado cuando el cliente envía mailing address en vez de property address. |

### 3.2 Campos

| Campo | Tipo | Descripción | Valores posibles |
|---|---|---|---|
| `ZipCode` | String | ZIP de la propiedad (PK). | 5 dígitos |
| `Address` | String | Dirección de la propiedad. Case-sensitive, **tal cual** la envía el cliente. | String libre |
| `Address#PhoneNumber` | String | SK: `address + "#" + phoneOrEmail`. | — |
| `PhoneNumber` | String | Número telefónico o email (cuando `Type=email`). Normalizado a 10 dígitos US (sin +1). | Dígitos o email |
| `Type` | String | Tipo de contacto. **Tiene variantes históricas** — ver tabla de abajo. | `Mobile`, `Landline`, `Land Line`, `email`, `OtherPhone`, `Pager`, `VoIP`, `Wireless`, `Residential`, ... |
| `Carrier` | String / Null | Operadora cuando la reporta el proveedor. DirectSkip siempre retorna `null`. BatchLeads a veces la incluye. | String o Null |
| `Dnc` | Boolean / Null | `true` = en Do-Not-Call. `null` = desconocido. | `true`, `false`, `null` |
| `IsLitigator` | Boolean | `true` = este número está en lista negra (Blacklist Alliance o DirectSkip con `dncScrub`). | `true`, `false` |
| `IsOwnerLitigator` | Boolean | `true` = al menos un contacto del owner es litigator. Redundante pero se guarda en todos los items de esa propiedad. | `true`, `false` |
| `MailingAddress` | String | Dirección postal del owner (puede diferir de la de la propiedad). | String |
| `MailingZip` | String | ZIP de la mailing address. | String |
| `State` | String | Estado US (código de 2 letras) de la propiedad. | `OH`, `FL`, `TX`, ... |
| `PropertyId` | Number | ID externo del cliente para la propiedad (viene en el request). `0` cuando el cliente no envía ID. | Entero |
| `ConfirmedAddress` | String / Null | Dirección "golden" confirmada por DirectSkip. `NULL` para resultados de BatchLeads u otros. | String o Null |
| `ConfirmedCity` | String / Null | Ciudad confirmada (DirectSkip). | String o Null |
| `ConfirmedState` | String / Null | Estado confirmado (DirectSkip). | String o Null |
| `ConfirmedZip` | String / Null | ZIP confirmado (DirectSkip). | String o Null |
| `Vendor` | String | Proveedor que entregó este dato. **Ojo**: solo se pobla en items creados por la lógica multi-proveedor (≈ desde feb-2026). Items anteriores tienen `Vendor` ausente. | `directskip`, `batchleads`, `unknown`, o **ausente** en items antiguos. |
| `LastSkiptraceAt` | Number | Epoch segundos del último skiptrace. Usado para filtrar cache (`>= fromDate`). | Epoch seconds |
| `LastSkiptraceTimestamp` | String (ISO) | Versión legible. | ISO |
| `ModifiedTimestamp` | String (ISO) | Última modificación. Normalmente igual a `LastSkiptraceTimestamp` en inserts. | ISO |

### 3.3 Variantes del campo `Type` (muestra real)

Del scan real:

| Valor | Origen típico | Recomendación para dashboard |
|---|---|---|
| `Mobile` | DirectSkip (mapeo) y BatchLeads reciente | Agrupar bajo "Mobile" |
| `Wireless` | DirectSkip raw `phonetype=Wireless` → hoy se mapea a `Mobile`, pero hay items antiguos con este valor | Normalizar a "Mobile" |
| `Landline` | Normalizado | Agrupar bajo "Landline" |
| `Land Line` | Legacy (BatchLeads antiguo) | Normalizar a "Landline" |
| `Residential` | DirectSkip raw (casos sin mapeo) | Normalizar a "Landline" |
| `VoIP` | Ambos proveedores | "VoIP" |
| `email` | Todos los emails | Tratar como contacto tipo email |
| `OtherPhone` | BatchLeads | Mantener |
| `Pager` | Raro | Mantener o agrupar como "Other" |
| `Unknown` | Fallback del mapeador | Agrupar como "Other" |

Sugerencia concreta para el dashboard: aplicar un LOWER + mapping al
leer, para no mostrar duplicados tipo "Landline" y "Land Line" en el mismo
gráfico.

---

## 4. Flujo de datos (qué genera cada fila)

```
Cliente (Laravel) ──► POST evento al Lambda
                          │
                          ▼
          [CREA 1 fila en skiptrace-logs]      ← Status = received
                          │
                          ▼
          ¿Hay cache en skiptrace-db?
            ├── HIT  ──► cuenta en TotalPropertiesFoundDB
            └── MISS ──► va a cascade de proveedores
                              │
                              ▼
                    DirectSkip (order=0) ──► ProviderStats.directskip
                              │
                     properties sin phone?
                              ▼
                    BatchLeads (order=1) ──► ProviderStats.batchleads
                              │
                              ▼
                    ¿checkLitigators?
                     └── sí ──► Blacklist Alliance bulk-lookup
                                 └── marca IsLitigator / IsOwnerLitigator
                              │
                              ▼
          [INSERT/UPDATE en skiptrace-db por cada phone + email]
                              │
                              ▼
          Webhook al cliente (Laravel)    Status = sentToWebHook
                              │
                              ▼
          Status = finished  ← fila final en skiptrace-logs
```

Importante:
- `skiptrace-logs` se **sobrescribe** (PutItem) en cada transición de estado,
  así que no existe "histórico de transiciones" dentro de DynamoDB. Lo que
  el dashboard ve es el último snapshot.
- Los errores en proveedores quedan en `ProviderStats.<p>.errorMessages`
  (truncado a 5). Errores no atribuibles a un proveedor pueden terminar en
  `ErrorInfo` o `WebhookError`.

---

## 5. Escenarios concretos para el dashboard

### 5.1 "¿Cuántos requests hizo el cliente X en el último mes?"

- Query directo a `skiptrace-logs` con `KeyConditionExpression` por
  `DomainDate = "X#YYYY-MM-DD"` — **uno por día**. Disparar 30 queries en
  paralelo y sumar.
- Alternativa (más simple, más cara): `Scan` con
  `FilterExpression = begins_with(DomainDate, "X#") AND CreatedAt BETWEEN :a AND :b`
  — la tabla es pequeña (~40 k items, 20 MB), es tolerable.

Métricas derivadas:
- Total requests = count de items.
- Total propiedades procesadas = `Σ TotalProperties`.
- Ahorro por cache = `Σ TotalPropertiesFoundDB / Σ TotalProperties`.

### 5.2 "¿Cuánto nos gastamos por proveedor en un rango de fechas?"

```
costo_proveedor = Σ ProviderStats[p].sent * tarifa[p]
```

Donde el rango se obtiene scaneando `skiptrace-logs` o queryando por día.
Tarifas las mantiene el dashboard (no vive en DynamoDB).

### 5.3 "¿Cuántos hits obtuvimos por proveedor?"

Por fila del log:
- `ProviderStats.directskip.hits` y `ProviderStats.batchleads.hits`.
- Para un agregado por rango, sumar sobre las filas filtradas.

Tip: si `ProviderStats` está ausente o vacío (logs legacy anteriores al
multi-proveedor), caer al campo legacy `TotalHitsBatchLeads`.

### 5.4 "¿Cuántos litigators detectamos por dominio/mes?"

- A nivel log → `TotalHitsBlacklist` (son conteos de blacklist),
  `TotalNumbersSentToBlackList` (denominador).
- A nivel ítem (por teléfono) → en `skiptrace-db`, contar items con
  `IsLitigator = true`. Requiere Scan con FilterExpression; como la tabla
  es grande, programarlo como job diario y cachear el resultado en el
  dashboard, no en live queries.

### 5.5 "¿Qué porcentaje de las propiedades se resolvieron desde cache?"

Por request: `TotalPropertiesFoundDB / TotalProperties`.
Agregado por dominio: ponderar por `TotalProperties`.

### 5.6 "¿Qué proveedor es más rápido?"

Usar `ProviderStats[p].durationMs / ProviderStats[p].sent` como proxy de
latencia por propiedad. DirectSkip es 1 request por propiedad con
concurrencia 20; BatchLeads es batch de 50 por request. Los valores crudos
no son directamente comparables entre proveedores, pero sí consistentes
dentro del mismo proveedor.

### 5.7 "¿Qué requests fallaron parcialmente?"

- `proccessError` lo traduce el handler a:
  - `Status` podría quedar en cualquier valor (si el lambda explotó).
  - `ProviderStats[p].errors > 0` → falló algún chunk.
  - `ErrorInfo` ≠ null → error global no atribuible.
  - `WebhookError` ≠ null → el cliente no recibió el webhook.

### 5.8 "¿Cuántas propiedades únicas tenemos cacheadas?"

`skiptrace-db` cuenta contactos, no propiedades. Para propiedades únicas,
hay que hacer Scan con `ProjectionExpression = "ZipCode,Address"` y
deduplicar del lado del dashboard. Job offline, no live.

---

## 6. Supuestos útiles y gotchas

1. **Dos precisiones distintas para timestamps**:
   - `CreatedAt` en `skiptrace-logs` → **epoch milliseconds**.
   - `UpdatedAt` en `skiptrace-logs` → **epoch seconds**.
   - `LastSkiptraceAt` en `skiptrace-db` → **epoch seconds**.
   El dashboard debe normalizar antes de restar fechas.

2. **`Status` refleja la etapa final**, no el historial. Si un request murió
   entre etapas, su Status puede quedar congelado en `dynamo`, `batchleads`,
   etc. Esos son candidatos a "requests abortados".

3. **Typo de Blacklist Alliance**: la API devuelve a veces `supression` y a
   veces `suppression` (con una o dos "p"). El handler maneja ambas, pero
   si algún día se guarda raw en DynamoDB, hay que mirar las dos variantes.

4. **`Token` es sensible**: es el token del webhook del cliente. No
   exponerlo en UI públicas ni en exports sin redactar.

5. **Items antiguos sin `Vendor`**: representan la era mono-proveedor
   (BatchLeads). Para un conteo "por vendor" fidedigno, tratar
   `Vendor missing` como `batchleads-legacy`.

6. **`TotalPropertiesSentToBatchLeads` ya no significa literalmente "a
   BatchLeads"** en flujos multi-proveedor — representa "properties
   enviadas a algún proveedor del cascade". El script
   `lambda_reporting/fix_total_properties_found_db.py` recalcula este
   derivado.

7. **Cache TTL lo controla el cliente** vía `MonthCondition` en el evento
   (no hay TTL nativo en DynamoDB). Cada request decide qué tan "fresco"
   necesita el cache.

8. **Una propiedad genera múltiples items** en `skiptrace-db`: uno por
   teléfono y uno por email. Para conteos a nivel "propiedad", agrupar por
   `(ZipCode, Address)`.

9. **Deduplicación intra-batch** ya ocurre en la Lambda
   (`Property.insertMassive` usa un `Set` con key `zip-address#number`),
   así que el dashboard no debería ver teléfonos duplicados para la misma
   propiedad generados en el mismo request.

10. **`TotalHitsBlacklist`** = `count` que retorna Blacklist, que es el
    total de números **procesados** por Blacklist, no los que son DNC. Los
    litigators reales están en `supression`/`suppression` de la respuesta,
    pero el handler solo persiste `count` en el log. Para contar litigators
    reales toca leer `skiptrace-db` (items con `IsLitigator=true`).

---

## 7. Próximos pasos sugeridos

- Crear un IAM user `skiptrace-dashboard-readonly` en la cuenta
  `611201211946` con la política del §1 y entregar las credenciales al
  equipo del dashboard.
- Definir en el dashboard una capa de "normalización" para `Type` y
  `Vendor` (ver §3.3 y §6.5).
- Si el dashboard quiere latencias a nivel end-to-end, habría que añadir un
  campo `FinishedAt` en el Lambda (hoy solo hay `UpdatedAtTimestamp`,
  que es cualquier update, no el cierre).
- Si se necesita histórico de transiciones (qué tan lejos llegó un
  request antes de morir), conviene emitir eventos a CloudWatch
  Logs/EventBridge además de sobrescribir `Status`.

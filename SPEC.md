# CuidaTuFocus - Especificación Formal

## 1. Proyecto

**Nombre:** CuidaTuFocus  
**Tipo:** App de escritorio para Windows  
**Descripción:** Aplicación que bloquea la ejecución de videojuegos fuera de horarios permitidos, ayudando al usuario a mantener el foco y la productividad.  
**Versión objetivo:** 1.0.0  
**Stack:** Tauri 2.x (Rust + React/TypeScript)

---

## 2. Definiciones

| Término | Definición |
|---------|------------|
| **Horario permitido** | Franja horaria durante la cual las apps bloqueadas pueden ejecutarse |
| **Horario bloqueado** | Franja horaria durante la cual las apps bloqueadas serán cerradas/inhibidas |
| **App bloqueada** | Aplicación (juego) registrada por el usuario que está sujeta a control horario |
| **Modo de bloqueo** | Nivel de restricción configurado (Suave, Medio, Estricto) |
| **Sesión de foco** | Período activo donde el usuario está enfocado y las restricciones aplican |

---

## 3. Funcionalidades

### 3.1 Sistema de Horarios con Grupos

**Descripción:** Gestión de franjas horarias organizadas en grupos, permitiendo asignar diferentes configuraciones de horarios a diferentes apps.

**Entidad Horario:**
- `id`: UUID
- `nombre`: string (ej: "Horario laboral")
- `tipo`: enum (BLOQUEADO, PERMITIDO)
- `hora_inicio`: Time (HH:MM)
- `hora_fin`: Time (HH:MM)
- `dias`: array de enum (LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO)
- `activo`: boolean
- `created_at`: timestamp
- `updated_at`: timestamp

**Entidad GrupoHorario:**
- `id`: UUID
- `nombre`: string (ej: "Juegos nocturnos", "Apps de productividad")
- `horarios_ids`: array de UUIDs (referencias a Horarios)
- `apps_ids`: array de UUIDs (referencias a AppsBloqueadas)
- `activo`: boolean
- `created_at`: timestamp
- `updated_at`: timestamp

**Relación Many-to-Many:**
- Una app puede pertenecer a múltiples grupos de horarios
- Un grupo puede contener múltiples horarios y múltiples apps
- El bloqueo se evalúa por app: se buscan los grupos a los que pertenece la app, se obtienen sus horarios activos, y se verifica si el momento actual cae dentro de algún horario BLOQUEADO

**Reglas de negocio:**
- Un día puede tener múltiples horarios
- Los horarios no pueden superponerse en el mismo día para la misma app
- Si un horario abarca medianoche (ej: 22:00–02:00), se maneja con lógica de overnight
- Por defecto, horario bloqueado 08:00–18:00, permitido 18:00–00:00
- Cada app puede tener múltiples grupos de horarios activos

**Vista de Horarios (24hs):**
- Visualización de franjas horarias en formato 24 horas
- Selector visual de días de la semana
- Indicadores visuales de bloques BLOQUEADO (rojo) y PERMITIDO (verde)

**Operaciones CRUD:**
- Crear/editar/eliminar horarios individuales
- Crear/editar/eliminar grupos de horarios
- Asignar/remover apps a grupos de horarios
- Activar/desactivar sin eliminar

---

### 3.2 Gestión de Apps Bloqueadas

**Descripción:** Registro y mantenimiento de aplicaciones sujetas a control horario.

**Entidad AppBloqueada:**
- `id`: UUID
- `nombre`: string
- `ruta_ejecutable`: string (path completo al .exe)
- `icono`: blob (extraído del .exe)
- `categoria`: enum (STEAM, EPIC, GOG, MANUAL, DETECTADO)
- `ultima_ejecucion`: timestamp (nullable)
- `veces_ejecutado`: integer
- `bloqueado`: boolean
- `creado_en`: timestamp

**Entidad Categoria:**
- STEAM: detecta automáticamente desde carpeta estándar
- EPIC: detecta desde carpeta Epic Games
- GOG: detecta desde carpeta GOG
- MANUAL: agregado manualmente por el usuario
- DETECTADO: sugerido por haber sido usado recientemente

**Operaciones:**
- Agregar app manualmente (buscador de archivos)
- Agregar desde proceso activo
- Detectar automáticamente juegos de Steam/Epic/GOG
- Buscar por nombre
- Eliminar app
- Ver última ejecución

---

### 3.3 Modos de Bloqueo

**Descripción:** Niveles de restricción que determinan el comportamiento al intentar abrir una app bloqueada.

| Modo | Código | Comportamiento |
|------|--------|----------------|
| **Suave** | `SOFT` | Cierra el proceso silenciosamente. No muestra notificación ni alerta. |
| **Medio** | `MEDIUM` | Muestra notificación de advertencia durante 5 segundos antes de cerrar. Registra el intento. |
| **Estricto** | `STRICT` | Bloqueo inmediato sin notificación. Registra el intento. Tras 3 intentos en 60 segundos, bloquea por 5 minutos. |

**Configuración por modo:**
- SOFT: Sin configuración adicional
- MEDIUM: Duración de advertencia (default 5s), mensaje personalizable
- STRICT: Intentos antes de cooldown (default 3), duración de cooldown (default 5min)

---

### 3.4 Detección y Bloqueo de Procesos

**Descripción:** Monitoreo en tiempo real de procesos del sistema y aplicación de reglas de bloqueo.

**Flujo de detección:**
1. Background service ejecuta cada 2 segundos
2. Obtiene lista de procesos activos (nombre + PID + ruta)
3. Compara con lista de apps bloqueadas (por nombre o hash de executable)
4. Si matchea y horario actual es BLOQUEADO:
   - Obtiene modo de bloqueo configurado
   - Ejecuta acción según modo
   - Registra en historial

**Métodos de identificación de proceso:**
- Por nombre de executable exacto (case-insensitive)
- Por hash SHA256 del archivo (más robusto, evita renombrado)

**Acción de bloqueo:**
- Obtiene PID del proceso
- Usa Windows API `TerminateProcess` para cerrarlo
- En modo ESTRICTO, agrega a lista de "cooldown" por intentos

**Steam Games:**
- Steam guarda información de juegos en `steamapps/libraryfolders.vdf`
- El ejecutable de un juego Steam es identificado por `appmanifest_*.acf`
- Hook al cliente Steam para detectar launches directos

---

### 3.5 Notificaciones

**Descripción:** Sistema de feedback al usuario cuando una app es bloqueada.

**Tipos de notificación:**
- `BLOQUEO_SOFT`: Sin notificación (no existe)
- `BLOQUEO_MEDIUM`: Advertencia con countdown
- `BLOQUEO_STRICT`: Notificación de bloqueo con tiempo restante
- `BLOQUEO_MOMENTANEO`: "Este juego se puede abrir a las HH:MM"

**Componentes de notificación:**
- Título: "¡Espera!" o "Bloqueado"
- Mensaje: "No podés abrir [nombre del juego] ahora"
- Tiempo restante: "Podés abrirlo a las 18:00"
- Frase motivacional: Rotativa de pool configurable
- Acción: Botón "Entendido" (solo en modo MEDIUM)

**Frases motivacionales (pool default):**
- "Tu futuro yo te lo va a agradecer"
- "Cada minuto cuenta. Volvé al foco 💪"
- "Los pequeños sacrificios generan grandes resultados"
- "Hoy sacrificás el juego, mañana cosechás el éxito"

---

### 3.6 Registro de Actividad (Historial)

**Descripción:** Log detallado de eventos de bloqueo y uso.

**Entidad EventoHistorial:**
- `id`: UUID
- `app_id`: UUID (FK a AppBloqueada)
- `tipo_evento`: enum (BLOQUEO, APERTURA_PERMITIDA, INTENTO_BLOQUEO)
- `timestamp`: timestamp
- `modo_bloqueo_aplicado`: enum
- `duracion_proceso_ms`: integer (cuanto tiempo estuvo abierto antes de cierre)
- `detalles`: JSON (metadata adicional)

**Entidad SesionDiaria:**
- `fecha`: date
- `total_bloqueos`: integer
- `total_intentos`: integer
- `tiempo_total_permitido_ms`: integer
- `app_mas_bloqueada`: UUID (nullable)
- `horas_mas_activas`: JSON array

**Métricas calculadas:**
- Bloqueos por día/semana/mes
- Racha actual sin intentos (días)
- App más temptación (más bloqueos)
- Horarios de mayor temptación

---

### 3.7 Protección Anti-Auto-Sabotaje

**Descripción:** Mecanismos para evitar que el usuario eluda las restricciones.

### 3.7.1 Auto-inicio con Windows

**Implementación:**
- Registro en `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`
- Valor: path al ejecutable con flag `--minimized`
- Habilitable/deshabilitable desde settings

### 3.7.2 Modo后台 (Background)

**Comportamiento:**
- Al cerrar ventana principal, minimiza a system tray
- Icono en system tray indica estado (activo/paused/inactivo)
- Doble click en tray abre ventana principal
- Click derecho: menú contextual (Abrir, Pausar 15min, Salir)

### 3.7.3 Protección con Contraseña

**Flujo:**
- Primera ejecución: solicita crear contraseña (mínimo 6 caracteres)
- Al intentar desactivar protección: solicita contraseña
- Al intentar desinstalar: solicita contraseña
- 3 intentos fallidos = lockout de 30 segundos

**Almacenamiento:**
- Hash bcrypt de contraseña en config segura
- Nunca se almacena en texto plano

### 3.7.4 Auto-reinicio

**Trigger:**
- Si proceso es terminado manualmente
- Si servicio de monitoreo se detiene
- Si se detecta manipulación del proceso

**Comportamiento:**
- Usa Windows Task Scheduler para mantener servicio
- Reinicio automático dentro de 5 segundos
- Log del evento para debugging

---

### 3.8 Modo Focus Extremo

**Descripción:** Estado opcional donde las restricciones son irrevocables.

**Características:**
- Solo se puede activar manualmente desde la UI
- Para desactivar: requiere contraseña Y esperar 5 minutos
- Diseñado para sesiones de trabajo intensivas
- Notificación cada hora rappelantdo que está activo

---

## 4. Casos de Uso

### CU-001: Configurar horarios de bloqueo
1. Usuario abre Settings > Horarios
2. Sistema muestra lista de horarios actuales
3. Usuario hace click en "Agregar horario"
4. Usuario configura: nombre, tipo, días, hora inicio, hora fin
5. Sistema valida que no haya conflictos
6. Sistema guarda y actualiza UI

### CU-002: Agregar juego a lista de bloqueados
1. Usuario abre Settings > Apps
2. Usuario hace click en "Agregar"
3. Sistema muestra opciones: Buscar archivo, Desde proceso activo, Detectar Steam
4. Usuario selecciona opción
5. Sistema extrae nombre e icono
6. Sistema guarda y actualiza UI

### CU-003: Intento de apertura de juego bloqueado
1. Usuario ejecuta juego (doble click en .exe o desde launcher)
2. Sistema detecta proceso en los siguientes 2 segundos
3. Sistema consulta horario actual
4. Si horario es BLOQUEADO:
   - SOFT: cierra proceso silenciosamente
   - MEDIUM: muestra notificación 5s, luego cierra
   - STRICT: cierra inmediatamente, registra intento
5. Sistema registra en historial

### CU-004: Desactivar protección temporalmente
1. Usuario hace click en toggle de protección
2. Sistema solicita contraseña
3. Usuario ingresa contraseña
4. Sistema valida
5. Sistema pausa monitoreo por 15 minutos
6. Sistema muestra countdown en UI

---

## 5. Modelo de Datos

```
┌─────────────────┐     ┌──────────────────┐
│    Horario      │     │   AppBloqueada   │
├─────────────────┤     ├──────────────────┤
│ id (PK)         │     │ id (PK)          │
│ nombre          │     │ nombre           │
│ tipo            │     │ ruta_ejecutable  │
│ hora_inicio     │     │ icono            │
│ hora_fin        │     │ hash_sha256      │
│ dias            │     │ categoria        │
│ activo          │     │ ultima_ejecucion │
│ created_at      │     │ veces_ejecutado  │
│ updated_at      │     │ bloqueado        │
└────────┬────────┘     │ creado_en        │
         │              └────────┬─────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌──────────────────┐
│  GrupoHorario   │<--->│ app_grupo_horario│
├─────────────────┤     ├──────────────────┤
│ id (PK)         │     │ app_id (FK)     │
│ nombre          │     │ grupo_id (FK)   │
│ horarios_ids    │     └──────────────────┘
│ apps_ids        │
│ activo          │
│ created_at      │
│ updated_at      │
└─────────────────┘

┌─────────────────┐     ┌──────────────────┐
│  EventoHistorial│     │  SesionDiaria    │
├─────────────────┤     ├──────────────────┤
│ id (PK)         │     │ fecha (PK)       │
│ app_id (FK)     │     │ total_bloqueos   │
│ tipo_evento     │     │ total_intentos   │
│ timestamp       │     │ tiempo_permitido │
│ modo_bloqueo    │     │ app_mas_bloqueada│
│ duracion_ms     │     │ horas_activas    │
│ detalles (JSON) │     └──────────────────┘
└─────────────────┘

┌─────────────────┐
│     Config      │
├─────────────────┤
│ clave (PK)      │
│ valor           │
│ tipo_dato       │
│ updated_at      │
└─────────────────┘
```

---

## 6. API Commands (Tauri)

### Horarios
- `get_horarios() -> Vec<Horario>`
- `create_horario(horario: NuevoHorario) -> Horario`
- `update_horario(id: String, horario: HorarioUpdate) -> Horario`
- `delete_horario(id: String) -> bool`
- `toggle_horario(id: String) -> Horario`

### Grupos de Horarios
- `get_grupos_horarios() -> Vec<GrupoHorario>`
- `create_grupo_horario(grupo: NuevoGrupoHorario) -> GrupoHorario`
- `update_grupo_horario(id: String, grupo: GrupoHorario) -> GrupoHorario`
- `delete_grupo_horario(id: String) -> bool`
- `toggle_grupo_horario(id: String) -> GrupoHorario`
- `assign_app_to_grupo(appId: String, grupoId: String) -> bool`
- `remove_app_from_grupo(appId: String, grupoId: String) -> bool`
- `get_apps_with_grupos() -> Vec<AppConHorarios>`

### Apps
- `get_apps_bloqueadas() -> Vec<AppBloqueada>`
- `add_app_bloqueada(app: NuevaApp) -> AppBloqueada`
- `remove_app_bloqueada(id: String) -> bool`
- `detect_steam_games() -> Vec<SteamGame>`
- `get_running_processes() -> Vec<ProcessInfo>`

### Bloqueo
- `get_modo_bloqueo() -> ModoBloqueo`
- `set_modo_bloqueo(modo: ModoBloqueo) -> bool`
- `get_estado_proteccion() -> EstadoProteccion`
- `toggle_proteccion(password: String) -> bool`
- `pause_proteccion(minutes: u32, password: String) -> bool`

### Sistema
- `get_config(key: String) -> Value`
- `set_config(key: String, value: Value) -> bool`
- `set_autostart(enabled: bool) -> bool`
- `minimize_to_tray() -> bool`
- `quit_app() -> bool`

---

## 7. Requisitos No Funcionales

### Performance
- Uso de CPU < 2% en idle
- Memoria < 80MB en uso normal
- Detección de proceso < 3 segundos desde launch
- UI responsive (60fps)

### Seguridad
- Contraseña hasheada con bcrypt
- Datos locales en SQLite en AppData (no roaming)
- No transmitir datos externamente
- Proceso de monitoreo difícil de matar

### Compatibilidad
- Windows 10 (1903+) y Windows 11
- Permisos de administrador NO requeridos (usa user-level APIs)
- Soporte para HiDPI

---

## 8. Pantallas

### 8.1 Dashboard
**Propósito:** Vista general del estado actual

**Componentes:**
- Card estado: Indicador grande (activo/pausado) con toggle
- Card próximo horario: "Se permite a las 18:00" con countdown
- Card estadísticas rápidas: Bloqueos hoy, racha actual
- Card actividad reciente: Lista últimos 5 eventos

### 8.2 Horarios
**Propósito:** Configurar franjas horarias

**Componentes:**
- Timeline visual del día actual
- Lista de horarios con edit/delete
- Botón "Agregar horario"
- Modal de edición inline

### 8.3 Apps Bloqueadas
**Propósito:** Gestionar lista de apps

**Componentes:**
- Grid de cards con icono + nombre
- Input de búsqueda
- Botones: Agregar archivo, Desde proceso, Detectar Steam
- Toggle individual de bloqueo por app
- Menú contextual: Editar, Eliminar, Detalles

### 8.4 Historial
**Propósito:** Ver registro de actividad

**Componentes:**
- Filtros: Hoy, Semana, Mes, Custom
- Gráfico de bloqueos por día (bar chart)
- Tabla de eventos con paginación
- Card "App más temptación"

### 8.5 Settings
**Propósito:** Configuración general

**Secciones:**
- General: Modo de bloqueo, idioma
- Protección: Contraseña, auto-start
- Notificaciones: Frases motivacionales, sonido
- Acerca de: Versión, links

---

## 9. Criterios de Aceptación

| ID | Criterio | Condición de éxito |
|----|----------|-------------------|
| CA-01 | Al intentar abrir un juego fuera de horario, el juego no se ejecuta | Proceso terminates dentro de 3s |
| CA-02 | Al intentar abrir un juego en horario permitido, el juego se ejecuta normalmente | Sin intervención |
| CA-03 | Los cambios de horario se aplican sin reiniciar |生效 < 5s |
| CA-04 | El modo STRICT bloquea 3 intentos consecutivos | 4to intento no se muestra en 5min |
| CA-05 | La app inicia con Windows si está configurado | Proceso visible en Task Manager > Startup |
| CA-06 | La app se minimiza a tray al cerrar | Icono visible en system tray |
| CA-07 | La contraseña es requerida para desactivar | No se puede pausar sin contraseña |
| CA-08 | El historial registra todos los intentos | Cada evento tiene registro en DB |

---

## 10. Glosario

- **Tauri**: Framework de escritorio que usa Rust + WebView
- **Rust**: Lenguaje de programación de sistemas, usado para el backend
- **SQLite**: Base de datos embebida, local
- **System tray**: Área de notificaciones de Windows (bandeja del sistema)
- **Glassmorphism**: Estilo visual con transparencia y blur
- **Neon accent**: Efecto de brillo en colores vibrantes

# CuidaTuFocus - Product Requirements Document (PRD)

> **Versión:** 1.0.0  
> **Última actualización:** 2026-04-02  
> **Tipo:** App de escritorio para Windows

---

## 1. Resumen Ejecutivo

### 1.1 Descripción del Producto

App de escritorio para Windows que bloquea la ejecución de videojuegos fuera de horarios permitidos, ayudando al usuario a mantener el foco y la productividad.

### 1.2 Problema que resuelve

Los usuarios desean reducir el tiempo dedicado a videojuegos durante horarios de trabajo o estudio, pero carecen de herramientas automáticas que les impidan abrir juegos fuera de horarios permitidos. La falta de disciplina genera procrastinación y pérdida de productividad.

### 1.3 Solución

Un sistema de bloqueo automático basado en horarios configurables que detecta y cierra videojuegos cuando el usuario intenta ejecutarlos fuera de los períodos permitidos.

### 1.4 Objetivo Principal

> **"Cuando intento abrir un juego fuera del horario permitido → NO se abre"**

---

## 2. Stakeholders

| Rol                    | Descripción                                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------------- |
| **Usuario primario**   | Adultos jóvenes (18-35) que quieren limitar su consumo de videojuegos para ser más productivos |
| **Usuario secundario** | Padres que quieren controlar el tiempo de juego de sus hijos adolescentes                      |
| **Desarrollador**      | Equipo responsable de implementar y mantener la aplicación                                     |

---

## 3. Definiciones

| Término               | Definición                                                                     |
| --------------------- | ------------------------------------------------------------------------------ |
| **Horario permitido** | Franja horaria durante la cual las apps bloqueadas pueden ejecutarse           |
| **Horario bloqueado** | Franja horaria durante la cual las apps bloqueadas serán cerradas/inhibidas    |
| **App bloqueada**     | Aplicación (juego) registrada por el usuario que está sujeta a control horario |
| **Modo de bloqueo**   | Nivel de restricción configurado (Suave, Medio, Estricto)                      |
| **Sesión de foco**    | Período activo donde el usuario está enfocado y las restricciones aplican      |
| **System tray**       | Área de notificaciones de Windows (bandeja del sistema)                        |
| **Glassmorphism**     | Estilo visual con transparencia y blur                                         |
| **Neon accent**       | Efecto de brillo en colores vibrantes                                          |

---

## 4. Funcionalidades

### 4.1 Sistema de Horarios (Núcleo)

Definir franjas horarias que determinan cuando las apps bloqueadas pueden o no ejecutarse.

**Entidad Horario:**

- `id`: UUID
- `nombre`: string (ej: "Horario laboral")
- `tipo`: enum (BLOQUEADO, PERMITIDO)
- `hora_inicio`: Time (HH:MM)
- `hora_fin`: Time (HH:MM)
- `dias`: array de enum (LUNES, MARTES, MIERCOLES, JUEVES, VIERNES, SABADO, DOMINGO)
- `activo`: boolean

**Reglas de negocio:**

- Un día puede tener múltiples horarios
- Los horarios no pueden superponerse en el mismo día
- Si un horario abarca medianoche (ej: 22:00–02:00), se divide en dos registros
- Por defecto: Bloqueado 08:00–18:00, Permitido 18:00–00:00 y si a esa hora esta abierto alguna de las aplicaciones bloqueadas entonces sale un aviso par el usuario que esta fuera del horario permitido pero no se cierra la aplicacion

**Operaciones CRUD:**

- Crear horario con validación de conflictos
- Editar horario
- Eliminar horario
- Activar/desactivar sin eliminar

---

### 4.2 Detección y Bloqueo de Juegos

Monitoreo en tiempo real de procesos del sistema y aplicación de reglas.

**Flujo de detección:**

1. Background service ejecuta cada 2 segundos
2. Obtiene lista de procesos activos (nombre + PID + ruta)
3. Compara con lista de apps bloqueadas (por nombre o hash SHA256)
4. Si matchea y horario actual es BLOQUEADO → ejecuta acción según modo

**Steam Games:**

- Steam guarda información en `steamapps/libraryfolders.vdf`
- Ejecutable identificado por `appmanifest_*.acf`

---

### 4.3 Lista Configurable de Apps

Gestión de aplicaciones sujetas a control horario.

**Entidad AppBloqueada:**

- `id`: UUID
- `nombre`: string
- `ruta_ejecutable`: string (path completo al .exe)
- `icono`: blob (extraído del .exe)
- `categoria`: enum (STEAM, EPIC, GOG, MANUAL, DETECTADO)
- `hash_sha256`: string
- `ultima_ejecucion`: timestamp
- `veces_ejecutado`: integer
- `bloqueado`: boolean

**Categorías:**

- **STEAM**: detecta automáticamente desde carpeta estándar
- **EPIC**: detecta desde carpeta Epic Games
- **GOG**: detecta desde carpeta GOG
- **MANUAL**: agregado manualmente por el usuario
- **DETECTADO**: sugerido por haber sido usado recientemente

**Métodos de búsqueda:**

- Por nombre
- Seleccionar desde procesos activos
- Detección automática de Steam/Epic/GOG
- Botón "Agregar desde app en ejecución"

---

### 4.4 Modos de Bloqueo

Diferentes niveles de restricción:

| Modo            | Código   | Comportamiento                                                               | Configuración                                          |
| --------------- | -------- | ---------------------------------------------------------------------------- | ------------------------------------------------------ |
| 🟢 **Suave**    | `SOFT`   | Cierra el proceso silenciosamente. Sin notificación.                         | Sin configuración adicional                            |
| 🟡 **Medio**    | `MEDIUM` | Muestra advertencia durante 5 segundos antes de cerrar. Registra el intento. | Duración advertencia (default 5s)                      |
| 🔴 **Estricto** | `STRICT` | Bloqueo inmediato. Tras 3 intentos en 60s, bloquea por 5 minutos.            | Intentos cooldown (default 3), duración (default 5min) |

---

### 4.5 Sistema de Notificaciones

Feedback al usuario cuando una app es bloqueada.

**Tipos de notificación:**

- `BLOQUEO_SOFT`: Sin notificación
- `BLOQUEO_MEDIUM`: Advertencia con countdown de 5 segundos
- `BLOQUEO_STRICT`: Notificación de bloqueo con tiempo restante
- `BLOQUEO_MOMENTANEO`: "Este juego se puede abrir a las HH:MM"

**Componentes:**

- Título: "¡Espera!" o "Bloqueado"
- Mensaje: "No podés abrir [nombre del juego] ahora"
- Tiempo restante: "Podés abrirlo a las 18:00"
- Frase motivacional rotativa
- Botón "Entendido" (solo en modo MEDIUM)

**Frases motivacionales (pool default):**

- "Tu futuro yo te lo va a agradecer"
- "Cada minuto cuenta. Volvé al foco 💪"
- "Los pequeños sacrificios generan grandes resultados"
- "Hoy sacrificás el juego, mañana cosechás el éxito"

---

### 4.6 Registro de Actividad (Historial)

Log detallado de eventos de bloqueo y uso.

**Entidad EventoHistorial:**

- `id`: UUID
- `app_id`: UUID (FK a AppBloqueada)
- `tipo_evento`: enum (BLOQUEO, APERTURA_PERMITIDA, INTENTO_BLOQUEO)
- `timestamp`: timestamp
- `modo_bloqueo_aplicado`: enum
- `duracion_proceso_ms`: integer
- `detalles`: JSON

**Entidad SesionDiaria:**

- `fecha`: date
- `total_bloqueos`: integer
- `total_intentos`: integer
- `tiempo_total_permitido_ms`: integer
- `app_mas_bloqueada`: UUID
- `horas_mas_activas`: JSON array

**Métricas:**

- Bloqueos por día/semana/mes
- Racha actual sin intentos (días)
- App más temptación (más bloqueos)
- Horarios de mayor temptación

---

### 4.7 Protección Anti-Auto-Sabotaje

Mecanismos para evitar que el usuario eluda las restricciones.

#### 4.7.1 Auto-inicio con Windows

- Registro en `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`
- Valor: path al ejecutable con flag `--minimized`
- Habilitable/deshabilitable desde settings

#### 4.7.2 Modo Background (System Tray)

- Al cerrar ventana principal, minimiza a system tray
- Icono indica estado (activo/pausado/inactivo)
- Doble click: abre ventana principal
- Click derecho: menú contextual (Abrir, Pausar 15min, Salir)

#### 4.7.3 Protección con Contraseña

- Primera ejecución: solicita crear contraseña (mínimo 6 caracteres)
- 3 intentos fallidos = lockout de 30 segundos
- Hash bcrypt de contraseña en config segura

#### 4.7.4 Auto-reinicio

- Trigger: proceso terminado manualmente o servicio detenido
- Reinicio automático dentro de 5 segundos
- Log del evento

---

### 4.8 Modo Focus Extremo

Estado opcional donde las restricciones son irrevocables.

- Solo se activa manualmente
- Para desactivar: requiere contraseña + esperar 5 minutos
- Notificación cada hora recordando que está activo

---

## 5. Casos de Uso

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

## 6. Diseño Visual

### 6.1 Estilo

- **Dark UI** con glassmorphism suave
- **Neon accents** en elementos activos
- Base oscura con elementos flotantes tipo tarjetas
- Iluminación suave con colores vibrantes
- Sensación de "control total" y sistema inteligente

> **Transmite:** poder, precisión, control, foco.

### 6.2 Paleta de Colores

| Elemento         | Color               | Hex       |
| ---------------- | ------------------- | --------- |
| Fondo principal  | Negro azulado       | `#0B0F1A` |
| Fondo cards      | Gris azulado oscuro | `#151B2B` |
| Primario         | Violeta             | `#8B5CF6` |
| Secundario       | Azul                | `#3B82F6` |
| Alerta           | Naranja             | `#F97316` |
| Peligro          | Rojo                | `#EF4444` |
| Texto principal  | Blanco grisáceo     | `#F8FAFC` |
| Texto secundario | Gris azulado        | `#94A3B8` |

### 6.3 Layout

```
┌──────────────────────────────────────────────────┐
│  Sidebar       │         Content Area            │
│  ──────────    │  ┌────────────────────────────┐ │
│  Dashboard     │  │     Topbar (search)       │ │
│  Horarios      │  ├────────────────────────────┤ │
│  Apps          │  │                            │ │
│  Historial     │  │     Cards / Content        │ │
│  ──────────    │  │                            │ │
│  Ajustes       │  │                            │ │
└──────────────────────────────────────────────────┘
```

**Componentes:**

- **Sidebar izquierda:** Minimalista, íconos + texto, estado activo con fondo violeta brillante
- **Topbar:** Buscador, perfil de usuario, limpia
- **Dashboard principal:** Cards flotantes con bordes redondeados (12-16px), sombras suaves

### 6.4 Detalles Visuales

- Glow sutil en íconos y elementos activos
- Gradientes en botones y highlights
- Bordes suaves
- Mucho espaciado (aire)
- Animaciones suaves en hover y transiciones
- Indicadores circulares (gauge) estilo radial con gradientes rojo → naranja

### 6.5 Tipografía

- **Fuente:** Sans-serif moderna (Inter, Poppins)
- **Jerarquía:**
  - Títulos: semi-bold
  - Métricas: bold grande
  - Texto: light/regular

---

## 7. Pantallas

### 7.1 Dashboard

**Propósito:** Vista general del estado actual

**Componentes:**

- Card estado: Indicador grande (activo/pausado) con toggle
- Card próximo horario: "Se permite a las 18:00" con countdown
- Card estadísticas rápidas: Bloqueos hoy, racha actual
- Card actividad reciente: Lista últimos 5 eventos

### 7.2 Horarios

**Propósito:** Configurar franjas horarias

**Componentes:**

- Timeline visual del día actual
- Lista de horarios con edit/delete
- Botón "Agregar horario"
- Modal de edición inline

### 7.3 Apps Bloqueadas

**Propósito:** Gestionar lista de apps

**Componentes:**

- Grid de cards con icono + nombre
- Input de búsqueda
- Botones: Agregar archivo, Desde proceso, Detectar Steam
- Toggle individual de bloqueo por app
- Menú contextual: Editar, Eliminar, Detalles

### 7.4 Historial

**Propósito:** Ver registro de actividad

**Componentes:**

- Filtros: Hoy, Semana, Mes, Custom
- Gráfico de bloqueos por día (bar chart)
- Tabla de eventos con paginación
- Card "App más temptación"

### 7.5 Settings

**Propósito:** Configuración general

**Secciones:**

- General: Modo de bloqueo, idioma
- Protección: Contraseña, auto-start
- Notificaciones: Frases motivacionales, sonido
- Acerca de: Versión, links

---

## 8. Modelo de Datos

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
└─────────────────┘     │ creado_en        │
                        └──────────────────┘

┌─────────────────┐     ┌──────────────────┐
│  EventoHistorial│     │  SesionDiaria    │
├─────────────────┤     ├──────────────────┤
│ id (PK)         │     │ fecha (PK)       │
│ app_id (FK)     │     │ total_bloqueos   │
│ tipo_evento     │     │ total_intentos   │
│ timestamp       │     │ tiempo_permitido │
│ modo_bloqueo    │     │ app_mas_bloqueada│
│ duracion_ms     │     │ horas_activas    │
│ detalles (JSON)  │     └──────────────────┘
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

## 9. API Commands (Tauri)

### Horarios

- `get_horarios() -> Vec<Horario>`
- `create_horario(horario: NuevoHorario) -> Horario`
- `update_horario(id: String, horario: HorarioUpdate) -> Horario`
- `delete_horario(id: String) -> bool`
- `toggle_horario(id: String) -> Horario`

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

## 10. Tech Stack

| Componente        | Tecnología                |
| ----------------- | ------------------------- |
| **Framework**     | Tauri 2.x (Rust + Web)    |
| **Frontend**      | React + TypeScript + Vite |
| **Estilo**        | TailwindCSS               |
| **Estado**        | Zustand                   |
| **Base de datos** | SQLite (local)            |
| **Sistema**       | Rust para APIs de Windows |

---

## 11. Requisitos No Funcionales

### 11.1 Performance

- Uso de CPU < 2% en idle
- Memoria < 80MB en uso normal
- Detección de proceso < 3 segundos desde launch
- UI responsive (60fps)

### 11.2 Seguridad

- Contraseña hasheada con bcrypt
- Datos locales en SQLite en AppData (no roaming)
- No transmitir datos externamente
- Proceso de monitoreo difícil de matar

### 11.3 Compatibilidad

- Windows 10 (1903+) y Windows 11
- Permisos de administrador NO requeridos (usa user-level APIs)
- Soporte para HiDPI

---

## 12. Criterios de Aceptación

| ID    | Criterio                                                                         | Condición de éxito                        |
| ----- | -------------------------------------------------------------------------------- | ----------------------------------------- |
| CA-01 | Al intentar abrir un juego fuera de horario, el juego no se ejecuta              | Proceso terminate dentro de 3s            |
| CA-02 | Al intentar abrir un juego en horario permitido, el juego se ejecuta normalmente | Sin intervención                          |
| CA-03 | Los cambios de horario se aplican sin reiniciar                                  | 生效 < 5s                                 |
| CA-04 | El modo STRICT bloquea 3 intentos consecutivos                                   | 4to intento no se muestra en 5min         |
| CA-05 | La app inicia con Windows si está configurado                                    | Proceso visible en Task Manager > Startup |
| CA-06 | La app se minimiza a tray al cerrar                                              | Icono visible en system tray              |
| CA-07 | La contraseña es requerida para desactivar                                       | No se puede pausar sin contraseña         |
| CA-08 | El historial registra todos los intentos                                         | Cada evento tiene registro en DB          |

---

## 13. Roadmap

### Fase 1: Setup y Core (1-2 semanas)

- [ ] Configurar proyecto Tauri + React
- [ ] Setup base de datos SQLite
- [ ] UI base (layout, navegación, tema)
- [ ] Sistema de horarios (CRUD)

### Fase 2: Bloqueo (1-2 semanas)

- [ ] Detección de procesos
- [ ] Lista de apps bloqueadas
- [ ] Lógica de bloqueo por horario
- [ ] Modos de restricción

### Fase 3: Polish (1 semana)

- [ ] Notificaciones
- [ ] Historial básico
- [ ] Protección anti-sabotaje básica

### Fase 4: Extras (opcional)

- [ ] Auto-start con Windows
- [ ] Contraseña de protección
- [ ] Métricas y estadísticas avanzadas

---

## 14. Nota de Implementación

Para el **monitoreo de procesos en tiempo real** en Windows con Tauri:

- `sysinfo` crate para enumerar procesos
- `windows` crate para APIs avanzadas
- Background task con `tokio` corriendo cada 2 segundos
- Bloqueo via `TerminateProcess` de Windows API

---

## 15. Dependencias y Constraints

### Dependencias Externas

- Steam client (opcional, para detección automática)
- Epic Games Launcher (opcional, para detección automática)
- GOG Galaxy (opcional, para detección automática)

### Constraints

- Solo Windows 10 (1903+) y Windows 11
- No requiere permisos de administrador
- Datos almacenados localmente (no cloud)
- Sin acceso a internet requerido

---

## 16. Glosario Técnico

| Término    | Definición                                                  |
| ---------- | ----------------------------------------------------------- |
| **Tauri**  | Framework de escritorio que usa Rust + WebView              |
| **Rust**   | Lenguaje de programación de sistemas, usado para el backend |
| **SQLite** | Base de datos embebida, local                               |
| **SHA256** | Algoritmo de hash criptográfico para identificar archivos   |
| **bcrypt** | Algoritmo de hashing para contraseñas                       |
| **UUID**   | Identificador único universal                               |
| **PK/FK**  | Primary Key / Foreign Key (base de datos)                   |

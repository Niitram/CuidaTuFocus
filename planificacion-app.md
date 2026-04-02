# CuidaTuFocus - Planificación

## Descripción
App de escritorio para Windows que bloquea la ejecución de videojuegos fuera de horarios permitidos, ayudando al usuario a mantener el foco y la productividad.

---

## Funcionalidades

### 1. Sistema de Horarios (Núcleo)
Definir franjas horarias que determinan cuando las apps bloqueadas pueden o no ejecutarse.

**Características:**
- Horarios de tipo BLOQUEADO o PERMITIDO
- Configurable por día específico (lunes a viernes, fines de semana, días individuales)
- Múltiples bloques por día
- Ejemplo:
  - ❌ Bloqueado: 08:00–18:00
  - ✅ Permitido: 18:00–23:00

> **Nota:** Este es la base de todas las decisiones de la app.

---

### 2. Detección y Bloqueo de Juegos
Monitoreo en tiempo real de procesos del sistema y aplicación de reglas.

**Características:**
- Detecta ejecución de `.exe`
- Compara con lista de apps bloqueadas (por nombre o hash SHA256)
- Cancela o cierra instantáneamente según modo configurado
- Detecta:
  - Juegos de Steam (carpetas estándar)
  - Juegos fuera de Steam (ejecutables manuales)

---

### 3. Lista Configurable de Apps
Gestión de aplicaciones sujetas a control horario.

**Características:**
- Agregar/quitar juegos fácilmente
- Detección automática de juegos de Steam/Epic/GOG
- Métodos de búsqueda:
  - Por nombre
  - Seleccionar desde procesos activos
  - Botón "Agregar desde app en ejecución"

---

### 4. Modos de Bloqueo
Diferentes niveles de restricción:

| Modo | Comportamiento |
|------|----------------|
| 🟢 **Suave** | Cierra el juego silenciosamente. Sin notificación. |
| 🟡 **Medio** | Muestra advertencia durante 5 segundos antes de cerrar. |
| 🔴 **Estricto** | Bloqueo inmediato sin aviso. Tras 3 intentos en 60s, bloquea por 5 minutos. |

---

### 5. Sistema de Notificaciones
Feedback al usuario cuando una app es bloqueada.

**Mensaje ejemplo:** "No podés abrir esto hasta las 18:00"

**Componentes:**
- Título y mensaje configurable
- Tiempo restante hasta horario permitido
- Frases motivacionales (rotativas)
- Botón "Entendido" (solo en modo Medio)

**Frases motivacionales:**
- "Tu futuro yo te lo va a agradecer"
- "Cada minuto cuenta. Volvé al foco 💪"
- "Los pequeños sacrificios generan grandes resultados"
- "Hoy sacrificás el juego, mañana cosechás el éxito"

---

### 6. Registro de Actividad (Historial)
Log detallado de eventos de bloqueo y uso.

**Registra:**
- Intentos de apertura bloqueados
- Tiempo de uso permitido
- Historial diario/semanal

**Métricas:**
- Bloqueos por día/semana/mes
- Racha actual sin intentos
- App más temptación (más bloqueos)
- Horarios de mayor temptación

> **Future:** Esto se puede convertir en métricas de productividad y features premium.

---

### 7. Protección Anti-Auto-Sabotaje
Mecanismos para evitar que el usuario eluda las restricciones.

**Características:**
- Ejecución al iniciar Windows
- Minimizado en segundo plano (system tray)
- Contraseña requerida para desactivar
- Auto-reinicio si el proceso es cerrado

---

### 8. Modo Focus Extremo
Estado opcional donde las restricciones son irrevocables.

**Características:**
- Solo se activa manualmente
- Para desactivar: requiere contraseña + esperar 5 minutos
- Notificación cada hora recordando que está activo

---

## Diseño Visual

### Estilo
- **Dark UI** con glassmorphism suave
- **Neon accents** en elementos activos
- Base oscura con elementos flotantes tipo tarjetas
- Iluminación suave con colores vibrantes
- Sensación de "control total" y sistema inteligente

> **Transmite:** poder, precisión, control, foco.

---

### Paleta de Colores

| Elemento | Color |
|----------|-------|
| Fondo principal | `#0B0F1A` (negro azulado) |
| Fondo cards | `#151B2B` |
| Primario (violeta) | `#8B5CF6` |
| Secundario (azul) | `#3B82F6` |
| Alerta (naranja) | `#F97316` |
| Peligro (rojo) | `#EF4444` |
| Texto principal | `#F8FAFC` |
| Texto secundario | `#94A3B8` |

> **Importante:** Fondo oscuro + colores vivos = contraste fuerte y moderno.

---

### Layout

```
┌──────────────────────────────────────────────────┐
│  Sidebar       │         Content Area            │
│  ──────────    │  ┌────────────────────────────┐ │
│  Dashboard     │  │     Topbar (search)         │ │
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

---

### Detalles Visuales
- Glow sutil en íconos y elementos activos
- Gradientes en botones y highlights
- Bordes suaves
- Mucho espaciado (aire)
- Animaciones suaves en hover y transiciones
- Indicadores circulares (gauge) estilo radial con gradientes rojo → naranja

---

### Tipografía
- **Fuente:** Sans-serif moderna (Inter, Poppins)
- **Jerarquía:**
  - Títulos: semi-bold
  - Métricas: bold grande
  - Texto: light/regular

---

## Tech Stack

| Componente | Tecnología |
|------------|------------|
| **Framework** | Tauri 2.x (Rust + Web) |
| **Frontend** | React + TypeScript + Vite |
| **Estilo** | TailwindCSS |
| **Estado** | Zustand |
| **Base de datos** | SQLite (local) |
| **Sistema** | Rust para APIs de Windows |

---

## Roadmap

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

## Nota de Implementación

Para el **monitoreo de procesos en tiempo real** en Windows con Tauri:

- `sysinfo` crate para enumerar procesos
- `windows` crate para APIs avanzadas
- Background task con `tokio` corriendo cada 2 segundos
- Bloqueo via `TerminateProcess` de Windows API

---

## Objetivo Principal

> **"Cuando intento abrir un juego fuera del horario permitido → NO se abre"**

Y alrededor de eso:
- Configuración (horarios + apps)
- Protección (anti-bypass)
- Feedback (notificaciones + estadísticas)

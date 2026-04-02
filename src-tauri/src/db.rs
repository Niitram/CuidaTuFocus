use crate::{
    AppBloqueada, AppConHorarios, AppMasTentacion, Estadisticas, EventoHistorial, GrupoHorario,
    Horario, NuevaApp, NuevoGrupoHorario, NuevoHorario,
};
use chrono::{Duration, Local};
use rusqlite::{params, Connection, Result};
use std::path::PathBuf;
use uuid::Uuid;

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_db() -> Result<Database> {
        let conn = Connection::open_in_memory()?;
        let db = Database { conn };
        db.init_schema()?;
        Ok(db)
    }

    #[test]
    fn test_database_creation() {
        let result = create_test_db();
        assert!(result.is_ok());
    }

    #[test]
    fn test_init_schema_creates_tables() {
        let conn = Connection::open_in_memory().unwrap();
        let db = Database { conn };

        assert!(db.init_schema().is_ok());

        let count: i32 = db.conn
            .query_row("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, 6);
    }

    #[test]
    fn test_get_horarios_empty() {
        let db = create_test_db().unwrap();
        let horarios = db.get_horarios();
        assert!(horarios.is_ok());
    }

    #[test]
    fn test_create_horario() {
        let db = create_test_db().unwrap();

        let horario = NuevoHorario {
            nombre: "Test Horario".to_string(),
            tipo: "BLOQUEADO".to_string(),
            hora_inicio: "09:00".to_string(),
            hora_fin: "17:00".to_string(),
            dias: vec!["LUNES".to_string(), "MARTES".to_string()],
        };

        let result = db.create_horario(horario);
        assert!(result.is_ok());

        let created = result.unwrap();
        assert_eq!(created.nombre, "Test Horario");
        assert_eq!(created.tipo, "BLOQUEADO");
        assert!(created.activo);
    }

    #[test]
    fn test_update_horario() {
        let db = create_test_db().unwrap();

        let horario = NuevoHorario {
            nombre: "Original".to_string(),
            tipo: "BLOQUEADO".to_string(),
            hora_inicio: "09:00".to_string(),
            hora_fin: "17:00".to_string(),
            dias: vec!["LUNES".to_string()],
        };

        let created = db.create_horario(horario).unwrap();

        let mut updated = created.clone();
        updated.nombre = "Updated".to_string();

        let result = db.update_horario(&created.id, updated);
        assert!(result.is_ok());
        assert_eq!(result.unwrap().nombre, "Updated");
    }

    #[test]
    fn test_delete_horario() {
        let db = create_test_db().unwrap();

        let horario = NuevoHorario {
            nombre: "To Delete".to_string(),
            tipo: "PERMITIDO".to_string(),
            hora_inicio: "18:00".to_string(),
            hora_fin: "22:00".to_string(),
            dias: vec!["VIERNES".to_string()],
        };

        let created = db.create_horario(horario).unwrap();

        let delete_result = db.delete_horario(&created.id);
        assert!(delete_result.is_ok());
        assert!(delete_result.unwrap());

        let get_result = db.get_horarios().unwrap();
        assert!(get_result.iter().find(|h| h.id == created.id).is_none());
    }

    #[test]
    fn test_toggle_horario() {
        let db = create_test_db().unwrap();

        let horario = NuevoHorario {
            nombre: "Toggle Test".to_string(),
            tipo: "BLOQUEADO".to_string(),
            hora_inicio: "08:00".to_string(),
            hora_fin: "18:00".to_string(),
            dias: vec!["LUNES".to_string()],
        };

        let created = db.create_horario(horario).unwrap();
        assert!(created.activo);

        let toggled = db.toggle_horario(&created.id).unwrap();
        assert!(!toggled.activo);

        let toggled_again = db.toggle_horario(&created.id).unwrap();
        assert!(toggled_again.activo);
    }

    #[test]
    fn test_get_apps_bloqueadas_empty() {
        let db = create_test_db().unwrap();
        let apps = db.get_apps_bloqueadas();
        assert!(apps.is_ok());
        assert!(apps.unwrap().is_empty());
    }

    #[test]
    fn test_add_app_bloqueada() {
        let db = create_test_db().unwrap();

        let app = NuevaApp {
            nombre: "Test Game".to_string(),
            ruta_ejecutable: "C:\\Games\\TestGame.exe".to_string(),
            categoria: "MANUAL".to_string(),
        };

        let result = db.add_app_bloqueada(app, None, None);
        assert!(result.is_ok());

        let added = result.unwrap();
        assert_eq!(added.nombre, "Test Game");
        assert_eq!(added.categoria, "MANUAL");
        assert!(added.bloqueado);
    }

    #[test]
    fn test_remove_app_bloqueada() {
        let db = create_test_db().unwrap();

        let app = NuevaApp {
            nombre: "To Remove".to_string(),
            ruta_ejecutable: "C:\\Games\\Remove.exe".to_string(),
            categoria: "MANUAL".to_string(),
        };

        let created = db.add_app_bloqueada(app, None, None).unwrap();

        let remove_result = db.remove_app_bloqueada(&created.id);
        assert!(remove_result.is_ok());
        assert!(remove_result.unwrap());
    }

    #[test]
    fn test_toggle_app_bloqueada() {
        let db = create_test_db().unwrap();

        let app = NuevaApp {
            nombre: "Toggle App".to_string(),
            ruta_ejecutable: "C:\\Games\\Toggle.exe".to_string(),
            categoria: "STEAM".to_string(),
        };

        let created = db.add_app_bloqueada(app, None, None).unwrap();
        assert!(created.bloqueado);

        let toggled = db.toggle_app_bloqueada(&created.id).unwrap();
        assert!(!toggled.bloqueado);
    }

    #[test]
    fn test_record_event() {
        let db = create_test_db().unwrap();

        let app = NuevaApp {
            nombre: "Event Test".to_string(),
            ruta_ejecutable: "C:\\Games\\Event.exe".to_string(),
            categoria: "MANUAL".to_string(),
        };

        db.add_app_bloqueada(app, None, None).unwrap();
        let apps = db.get_apps_bloqueadas().unwrap();
        let app_id = apps[0].id.clone();

        let result = db.record_event(&app_id, "BLOQUEO", "MEDIUM", 5000);
        assert!(result.is_ok());
    }

    #[test]
    fn test_get_estadisticas_empty() {
        let db = create_test_db().unwrap();
        let stats = db.get_estadisticas();
        assert!(stats.is_ok());

        let stats = stats.unwrap();
        assert_eq!(stats.bloqueos_hoy, 0);
        assert_eq!(stats.bloqueos_semana, 0);
        assert!(stats.app_mas_tentacion.is_none());
    }

    #[test]
    fn test_get_historial_empty() {
        let db = create_test_db().unwrap();
        let historial = db.get_historial(10);
        assert!(historial.is_ok());
        assert!(historial.unwrap().is_empty());
    }

    #[test]
    fn test_get_historial_with_limit() {
        let db = create_test_db().unwrap();

        let app = NuevaApp {
            nombre: "Limit Test".to_string(),
            ruta_ejecutable: "C:\\Games\\Limit.exe".to_string(),
            categoria: "MANUAL".to_string(),
        };

        db.add_app_bloqueada(app, None, None).unwrap();
        let apps = db.get_apps_bloqueadas().unwrap();
        let app_id = apps[0].id.clone();

        for i in 0..5 {
            db.record_event(&app_id, "BLOQUEO", "MEDIUM", i as i64 * 1000)
                .unwrap();
        }

        let historial = db.get_historial(3);
        assert!(historial.is_ok());
        assert_eq!(historial.unwrap().len(), 3);
    }

    #[test]
    fn test_multiple_horarios_same_day_no_conflict() {
        let db = create_test_db().unwrap();

        let horario1 = NuevoHorario {
            nombre: "Morning Block".to_string(),
            tipo: "BLOQUEADO".to_string(),
            hora_inicio: "08:00".to_string(),
            hora_fin: "12:00".to_string(),
            dias: vec!["LUNES".to_string()],
        };

        let horario2 = NuevoHorario {
            nombre: "Afternoon Block".to_string(),
            tipo: "BLOQUEADO".to_string(),
            hora_inicio: "14:00".to_string(),
            hora_fin: "18:00".to_string(),
            dias: vec!["LUNES".to_string()],
        };

        assert!(db.create_horario(horario1).is_ok());
        assert!(db.create_horario(horario2).is_ok());

        let horarios = db.get_horarios().unwrap();
        assert_eq!(horarios.len(), 2);
    }
}

pub struct Database {
    conn: Connection,
}

impl Database {
    pub fn new() -> Result<Self> {
        let db_path = get_db_path();

        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(&db_path)?;
        let db = Database { conn };
        db.init_schema()?;
        db.insert_default_data()?;
        Ok(db)
    }

    fn init_schema(&self) -> Result<()> {
        self.conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS horarios (
                id TEXT PRIMARY KEY,
                nombre TEXT NOT NULL,
                tipo TEXT NOT NULL,
                hora_inicio TEXT NOT NULL,
                hora_fin TEXT NOT NULL,
                dias TEXT NOT NULL,
                activo INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS apps_bloqueadas (
                id TEXT PRIMARY KEY,
                nombre TEXT NOT NULL,
                ruta_ejecutable TEXT NOT NULL UNIQUE,
                icono TEXT,
                hash_sha256 TEXT,
                categoria TEXT NOT NULL,
                ultima_ejecucion TEXT,
                veces_ejecutado INTEGER NOT NULL DEFAULT 0,
                bloqueado INTEGER NOT NULL DEFAULT 1,
                creado_en TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS historial (
                id TEXT PRIMARY KEY,
                app_id TEXT NOT NULL,
                app_nombre TEXT NOT NULL,
                tipo_evento TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                modo_bloqueo TEXT NOT NULL,
                duracion_proceso_ms INTEGER NOT NULL DEFAULT 0,
                detalles TEXT NOT NULL DEFAULT '{}'
            );
            
            CREATE TABLE IF NOT EXISTS config (
                clave TEXT PRIMARY KEY,
                valor TEXT NOT NULL,
                tipo_dato TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE INDEX IF NOT EXISTS idx_historial_timestamp ON historial(timestamp);
            CREATE INDEX IF NOT EXISTS idx_historial_app_id ON historial(app_id);

            CREATE TABLE IF NOT EXISTS grupos_horarios (
                id TEXT PRIMARY KEY,
                nombre TEXT NOT NULL,
                horarios_ids TEXT NOT NULL,
                apps_ids TEXT NOT NULL,
                activo INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );
            
            CREATE TABLE IF NOT EXISTS app_grupo_horario (
                app_id TEXT NOT NULL,
                grupo_id TEXT NOT NULL,
                PRIMARY KEY (app_id, grupo_id)
            );
            ",
        )?;
        Ok(())
    }

    fn insert_default_data(&self) -> Result<()> {
        let count: i32 = self
            .conn
            .query_row("SELECT COUNT(*) FROM horarios", [], |row| row.get(0))?;

        if count == 0 {
            let now = Local::now().to_rfc3339();

            self.conn.execute(
                "INSERT INTO horarios (id, nombre, tipo, hora_inicio, hora_fin, dias, activo, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    Uuid::new_v4().to_string(),
                    "Horario laboral",
                    "BLOQUEADO",
                    "08:00",
                    "18:00",
                    "[\"LUNES\",\"MARTES\",\"MIERCOLES\",\"JUEVES\",\"VIERNES\"]",
                    true,
                    &now,
                    &now
                ]
            )?;

            self.conn.execute(
                "INSERT INTO horarios (id, nombre, tipo, hora_inicio, hora_fin, dias, activo, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    Uuid::new_v4().to_string(),
                    "Tiempo libre",
                    "PERMITIDO",
                    "18:00",
                    "00:00",
                    "[\"LUNES\",\"MARTES\",\"MIERCOLES\",\"JUEVES\",\"VIERNES\"]",
                    true,
                    &now,
                    &now
                ]
            )?;
        }

        Ok(())
    }

    pub fn get_horarios(&self) -> Result<Vec<Horario>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, nombre, tipo, hora_inicio, hora_fin, dias, activo, created_at, updated_at FROM horarios"
        )?;

        let rows = stmt.query_map([], |row| {
            let dias_str: String = row.get(5)?;
            let dias: Vec<String> = serde_json::from_str(&dias_str).unwrap_or_default();

            Ok(Horario {
                id: row.get(0)?,
                nombre: row.get(1)?,
                tipo: row.get(2)?,
                hora_inicio: row.get(3)?,
                hora_fin: row.get(4)?,
                dias,
                activo: row.get::<_, i32>(6)? == 1,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        rows.collect()
    }

    pub fn create_horario(&self, horario: NuevoHorario) -> Result<Horario> {
        let id = Uuid::new_v4().to_string();
        let now = Local::now().to_rfc3339();
        let dias_json = serde_json::to_string(&horario.dias).unwrap_or_default();

        self.conn.execute(
            "INSERT INTO horarios (id, nombre, tipo, hora_inicio, hora_fin, dias, activo, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![&id, &horario.nombre, &horario.tipo, &horario.hora_inicio, &horario.hora_fin, &dias_json, true, &now, &now]
        )?;

        Ok(Horario {
            id,
            nombre: horario.nombre,
            tipo: horario.tipo,
            hora_inicio: horario.hora_inicio,
            hora_fin: horario.hora_fin,
            dias: horario.dias,
            activo: true,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn update_horario(&self, id: &str, mut horario: Horario) -> Result<Horario> {
        let now = Local::now().to_rfc3339();
        let dias_json = serde_json::to_string(&horario.dias).unwrap_or_default();

        self.conn.execute(
            "UPDATE horarios SET nombre = ?1, tipo = ?2, hora_inicio = ?3, hora_fin = ?4, dias = ?5, activo = ?6, updated_at = ?7 WHERE id = ?8",
            params![&horario.nombre, &horario.tipo, &horario.hora_inicio, &horario.hora_fin, &dias_json, horario.activo, &now, id]
        )?;

        horario.updated_at = now;
        Ok(horario)
    }

    pub fn delete_horario(&self, id: &str) -> Result<bool> {
        let rows = self
            .conn
            .execute("DELETE FROM horarios WHERE id = ?1", params![id])?;
        Ok(rows > 0)
    }

    pub fn toggle_horario(&self, id: &str) -> Result<Horario> {
        let now = Local::now().to_rfc3339();

        self.conn.execute(
            "UPDATE horarios SET activo = NOT activo, updated_at = ?1 WHERE id = ?2",
            params![&now, id],
        )?;

        let mut stmt = self.conn.prepare(
            "SELECT id, nombre, tipo, hora_inicio, hora_fin, dias, activo, created_at, updated_at FROM horarios WHERE id = ?1"
        )?;

        stmt.query_row(params![id], |row| {
            let dias_str: String = row.get(5)?;
            let dias: Vec<String> = serde_json::from_str(&dias_str).unwrap_or_default();

            Ok(Horario {
                id: row.get(0)?,
                nombre: row.get(1)?,
                tipo: row.get(2)?,
                hora_inicio: row.get(3)?,
                hora_fin: row.get(4)?,
                dias,
                activo: row.get::<_, i32>(6)? == 1,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })
    }

    pub fn get_apps_bloqueadas(&self) -> Result<Vec<AppBloqueada>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, nombre, ruta_ejecutable, icono, hash_sha256, categoria, ultima_ejecucion, veces_ejecutado, bloqueado, creado_en FROM apps_bloqueadas ORDER BY nombre"
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(AppBloqueada {
                id: row.get(0)?,
                nombre: row.get(1)?,
                ruta_ejecutable: row.get(2)?,
                icono: row.get(3)?,
                hash_sha256: row.get(4)?,
                categoria: row.get(5)?,
                ultima_ejecucion: row.get(6)?,
                veces_ejecutado: row.get(7)?,
                bloqueado: row.get::<_, i32>(8)? == 1,
                creado_en: row.get(9)?,
            })
        })?;

        rows.collect()
    }

    pub fn add_app_bloqueada(
        &self,
        app: NuevaApp,
        hash: Option<String>,
        icono: Option<String>,
    ) -> Result<AppBloqueada> {
        let id = Uuid::new_v4().to_string();
        let now = Local::now().to_rfc3339();

        self.conn.execute(
            "INSERT INTO apps_bloqueadas (id, nombre, ruta_ejecutable, icono, hash_sha256, categoria, ultima_ejecucion, veces_ejecutado, bloqueado, creado_en) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![&id, &app.nombre, &app.ruta_ejecutable, &icono, &hash, &app.categoria, Option::<String>::None, 0, true, &now]
        )?;

        Ok(AppBloqueada {
            id,
            nombre: app.nombre,
            ruta_ejecutable: app.ruta_ejecutable,
            icono,
            hash_sha256: hash,
            categoria: app.categoria,
            ultima_ejecucion: None,
            veces_ejecutado: 0,
            bloqueado: true,
            creado_en: now,
        })
    }

    pub fn remove_app_bloqueada(&self, id: &str) -> Result<bool> {
        let rows = self
            .conn
            .execute("DELETE FROM apps_bloqueadas WHERE id = ?1", params![id])?;
        Ok(rows > 0)
    }

    pub fn toggle_app_bloqueada(&self, id: &str) -> Result<AppBloqueada> {
        self.conn.execute(
            "UPDATE apps_bloqueadas SET bloqueado = NOT bloqueado WHERE id = ?1",
            params![id],
        )?;

        let mut stmt = self.conn.prepare(
            "SELECT id, nombre, ruta_ejecutable, icono, hash_sha256, categoria, ultima_ejecucion, veces_ejecutado, bloqueado, creado_en FROM apps_bloqueadas WHERE id = ?1"
        )?;

        stmt.query_row(params![id], |row| {
            Ok(AppBloqueada {
                id: row.get(0)?,
                nombre: row.get(1)?,
                ruta_ejecutable: row.get(2)?,
                icono: row.get(3)?,
                hash_sha256: row.get(4)?,
                categoria: row.get(5)?,
                ultima_ejecucion: row.get(6)?,
                veces_ejecutado: row.get(7)?,
                bloqueado: row.get::<_, i32>(8)? == 1,
                creado_en: row.get(9)?,
            })
        })
    }

    pub fn record_event(
        &self,
        app_id: &str,
        tipo_evento: &str,
        modo_bloqueo: &str,
        duracion_ms: i64,
    ) -> Result<()> {
        let id = Uuid::new_v4().to_string();
        let now = Local::now().to_rfc3339();

        let app_nombre: String = self
            .conn
            .query_row(
                "SELECT nombre FROM apps_bloqueadas WHERE id = ?1",
                params![app_id],
                |row| row.get(0),
            )
            .unwrap_or_else(|_| "Unknown".to_string());

        self.conn.execute(
            "INSERT INTO historial (id, app_id, app_nombre, tipo_evento, timestamp, modo_bloqueo, duracion_proceso_ms, detalles) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![&id, app_id, &app_nombre, tipo_evento, &now, modo_bloqueo, duracion_ms, "{}"]
        )?;

        Ok(())
    }

    pub fn get_estadisticas(&self) -> Result<Estadisticas> {
        let today = Local::now().format("%Y-%m-%d").to_string();
        let today_start = format!("{} 00:00:00", today);

        let bloqueos_hoy: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM historial WHERE tipo_evento = 'BLOQUEO' AND timestamp >= ?1",
            params![&today_start],
            |row| row.get(0),
        )?;

        let week_start = (Local::now() - Duration::days(7))
            .format("%Y-%m-%d 00:00:00")
            .to_string();
        let bloqueos_semana: i32 = self.conn.query_row(
            "SELECT COUNT(*) FROM historial WHERE tipo_evento = 'BLOQUEO' AND timestamp >= ?1",
            params![&week_start],
            |row| row.get(0),
        )?;

        let app_mas_tentacion: Option<AppMasTentacion> = self.conn.query_row(
            "SELECT app_id, app_nombre, COUNT(*) as cantidad FROM historial WHERE tipo_evento = 'BLOQUEO' AND timestamp >= ?1 GROUP BY app_id ORDER BY cantidad DESC LIMIT 1",
            params![&week_start],
            |row| {
                Ok(AppMasTentacion {
                    id: row.get(0)?,
                    nombre: row.get(1)?,
                    cantidad: row.get(2)?,
                })
            }
        ).ok();

        Ok(Estadisticas {
            bloqueos_hoy,
            bloqueos_semana,
            racha_dias: 0,
            app_mas_tentacion,
        })
    }

    pub fn get_historial(&self, limite: usize) -> Result<Vec<EventoHistorial>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, app_id, app_nombre, tipo_evento, timestamp, modo_bloqueo, duracion_proceso_ms, detalles FROM historial ORDER BY timestamp DESC LIMIT ?1"
        )?;

        let rows = stmt.query_map(params![limite as i32], |row| {
            Ok(EventoHistorial {
                id: row.get(0)?,
                app_id: row.get(1)?,
                app_nombre: row.get(2)?,
                tipo_evento: row.get(3)?,
                timestamp: row.get(4)?,
                modo_bloqueo: row.get(5)?,
                duracion_proceso_ms: row.get(6)?,
                detalles: row.get(7)?,
            })
        })?;

        rows.collect()
    }

    pub fn get_grupos_horarios(&self) -> Result<Vec<GrupoHorario>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, nombre, horarios_ids, apps_ids, activo, created_at, updated_at FROM grupos_horarios"
        )?;

        let rows = stmt.query_map([], |row| {
            let horarios_ids_str: String = row.get(2)?;
            let apps_ids_str: String = row.get(3)?;
            let horarios_ids: Vec<String> =
                serde_json::from_str(&horarios_ids_str).unwrap_or_default();
            let apps_ids: Vec<String> = serde_json::from_str(&apps_ids_str).unwrap_or_default();

            Ok(GrupoHorario {
                id: row.get(0)?,
                nombre: row.get(1)?,
                horarios_ids,
                apps_ids,
                activo: row.get::<_, i32>(4)? == 1,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })?;

        rows.collect()
    }

    pub fn create_grupo_horario(&self, grupo: NuevoGrupoHorario) -> Result<GrupoHorario> {
        let id = Uuid::new_v4().to_string();
        let now = Local::now().to_rfc3339();
        let horarios_json = serde_json::to_string(&grupo.horarios_ids).unwrap_or_default();
        let apps_json = serde_json::to_string(&grupo.apps_ids).unwrap_or_default();

        self.conn.execute(
            "INSERT INTO grupos_horarios (id, nombre, horarios_ids, apps_ids, activo, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![&id, &grupo.nombre, &horarios_json, &apps_json, true, &now, &now]
        )?;

        for app_id in &grupo.apps_ids {
            self.conn.execute(
                "INSERT OR IGNORE INTO app_grupo_horario (app_id, grupo_id) VALUES (?1, ?2)",
                params![app_id, &id],
            )?;
        }

        Ok(GrupoHorario {
            id,
            nombre: grupo.nombre,
            horarios_ids: grupo.horarios_ids,
            apps_ids: grupo.apps_ids,
            activo: true,
            created_at: now.clone(),
            updated_at: now,
        })
    }

    pub fn update_grupo_horario(&self, id: &str, mut grupo: GrupoHorario) -> Result<GrupoHorario> {
        let now = Local::now().to_rfc3339();
        let horarios_json = serde_json::to_string(&grupo.horarios_ids).unwrap_or_default();
        let apps_json = serde_json::to_string(&grupo.apps_ids).unwrap_or_default();

        self.conn.execute(
            "UPDATE grupos_horarios SET nombre = ?1, horarios_ids = ?2, apps_ids = ?3, activo = ?4, updated_at = ?5 WHERE id = ?6",
            params![&grupo.nombre, &horarios_json, &apps_json, grupo.activo, &now, id]
        )?;

        self.conn.execute(
            "DELETE FROM app_grupo_horario WHERE grupo_id = ?1",
            params![id],
        )?;
        for app_id in &grupo.apps_ids {
            self.conn.execute(
                "INSERT OR IGNORE INTO app_grupo_horario (app_id, grupo_id) VALUES (?1, ?2)",
                params![app_id, id],
            )?;
        }

        grupo.updated_at = now;
        Ok(grupo)
    }

    pub fn delete_grupo_horario(&self, id: &str) -> Result<bool> {
        self.conn.execute(
            "DELETE FROM app_grupo_horario WHERE grupo_id = ?1",
            params![id],
        )?;
        let rows = self
            .conn
            .execute("DELETE FROM grupos_horarios WHERE id = ?1", params![id])?;
        Ok(rows > 0)
    }

    pub fn toggle_grupo_horario(&self, id: &str) -> Result<GrupoHorario> {
        let now = Local::now().to_rfc3339();

        self.conn.execute(
            "UPDATE grupos_horarios SET activo = NOT activo, updated_at = ?1 WHERE id = ?2",
            params![&now, id],
        )?;

        let mut stmt = self.conn.prepare(
            "SELECT id, nombre, horarios_ids, apps_ids, activo, created_at, updated_at FROM grupos_horarios WHERE id = ?1"
        )?;

        stmt.query_row(params![id], |row| {
            let horarios_ids_str: String = row.get(2)?;
            let apps_ids_str: String = row.get(3)?;
            let horarios_ids: Vec<String> =
                serde_json::from_str(&horarios_ids_str).unwrap_or_default();
            let apps_ids: Vec<String> = serde_json::from_str(&apps_ids_str).unwrap_or_default();

            Ok(GrupoHorario {
                id: row.get(0)?,
                nombre: row.get(1)?,
                horarios_ids,
                apps_ids,
                activo: row.get::<_, i32>(4)? == 1,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
    }

    pub fn assign_app_to_grupo(&self, app_id: &str, grupo_id: &str) -> Result<()> {
        self.conn.execute(
            "INSERT OR IGNORE INTO app_grupo_horario (app_id, grupo_id) VALUES (?1, ?2)",
            params![app_id, grupo_id],
        )?;
        Ok(())
    }

    pub fn remove_app_from_grupo(&self, app_id: &str, grupo_id: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM app_grupo_horario WHERE app_id = ?1 AND grupo_id = ?2",
            params![app_id, grupo_id],
        )?;
        Ok(())
    }

    pub fn get_apps_with_grupos(&self) -> Result<Vec<AppConHorarios>> {
        let apps = self.get_apps_bloqueadas()?;
        let grupos = self.get_grupos_horarios()?;

        let mut result = Vec::new();
        for app in apps {
            let app_grupos: Vec<GrupoHorario> = grupos
                .iter()
                .filter(|g| g.apps_ids.contains(&app.id))
                .cloned()
                .collect();
            result.push(AppConHorarios {
                app,
                grupos: app_grupos,
            });
        }
        Ok(result)
    }

    pub fn get_app_horarios_for_blocking(&self, app_id: &str) -> Result<Vec<Horario>> {
        let grupos = self.get_grupos_horarios()?;
        let horarios = self.get_horarios()?;
        let app_id_str = app_id.to_string();

        let mut app_horarios_ids = Vec::new();
        for grupo in grupos {
            if grupo.apps_ids.contains(&app_id_str) && grupo.activo {
                app_horarios_ids.extend(grupo.horarios_ids.clone());
            }
        }

        let mut result = Vec::new();
        for horario in horarios {
            if app_horarios_ids.contains(&horario.id) {
                result.push(horario);
            }
        }
        Ok(result)
    }
}

fn get_db_path() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("CuidaTuFocus")
        .join("cuidatufocus.db")
}

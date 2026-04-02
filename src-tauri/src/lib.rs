use chrono::{Datelike, Duration, Local, Weekday};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use sysinfo::System;
use tauri::State;
use uuid::Uuid;

mod db;
use db::Database;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Horario {
    pub id: String,
    pub nombre: String,
    pub tipo: String,
    pub hora_inicio: String,
    pub hora_fin: String,
    pub dias: Vec<String>,
    pub activo: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppBloqueada {
    pub id: String,
    pub nombre: String,
    pub ruta_ejecutable: String,
    pub icono: Option<String>,
    pub categoria: String,
    pub ultima_ejecucion: Option<String>,
    pub veces_ejecutado: i32,
    pub bloqueado: bool,
    pub creado_en: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EventoHistorial {
    pub id: String,
    pub app_id: String,
    pub app_nombre: String,
    pub tipo_evento: String,
    pub timestamp: String,
    pub modo_bloqueo: String,
    pub duracion_proceso_ms: i64,
    pub detalles: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EstadoProteccion {
    pub activa: bool,
    pub modo_bloqueo: String,
    pub desde: Option<String>,
    pub hasta: Option<String>,
    pub focus_extremo: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Estadisticas {
    pub bloqueos_hoy: i32,
    pub bloqueos_semana: i32,
    pub racha_dias: i32,
    pub app_mas_tentacion: Option<AppMasTentacion>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppMasTentacion {
    pub id: String,
    pub nombre: String,
    pub cantidad: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessInfo {
    pub pid: u32,
    pub nombre: String,
    pub ruta: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NuevoHorario {
    pub nombre: String,
    pub tipo: String,
    pub hora_inicio: String,
    pub hora_fin: String,
    pub dias: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NuevaApp {
    pub nombre: String,
    pub ruta_ejecutable: String,
    pub categoria: String,
}

pub struct AppState {
    pub db: Mutex<Database>,
    pub proteccion_activa: Mutex<bool>,
    pub modo_bloqueo: Mutex<String>,
    pub password_hash: Mutex<Option<String>>,
}

#[tauri::command]
fn get_horarios(state: State<AppState>) -> Result<Vec<Horario>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_horarios().map_err(|e| e.to_string())
}

#[tauri::command]
fn create_horario(state: State<AppState>, horario: NuevoHorario) -> Result<Horario, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.create_horario(horario).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_horario(state: State<AppState>, id: String, horario: Horario) -> Result<Horario, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_horario(&id, horario).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_horario(state: State<AppState>, id: String) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_horario(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_horario(state: State<AppState>, id: String) -> Result<Horario, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.toggle_horario(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_apps_bloqueadas(state: State<AppState>) -> Result<Vec<AppBloqueada>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_apps_bloqueadas().map_err(|e| e.to_string())
}

#[tauri::command]
fn add_app_bloqueada(state: State<AppState>, app: NuevaApp) -> Result<AppBloqueada, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.add_app_bloqueada(app).map_err(|e| e.to_string())
}

#[tauri::command]
fn remove_app_bloqueada(state: State<AppState>, id: String) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.remove_app_bloqueada(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_app_bloqueada(state: State<AppState>, id: String) -> Result<AppBloqueada, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.toggle_app_bloqueada(&id).map_err(|e| e.to_string())
}

#[tauri::command]
fn detect_steam_games() -> Result<Vec<AppBloqueada>, String> {
    let mut games = Vec::new();

    if let Some(local_app_data) = dirs::data_local_dir() {
        let steam_path = local_app_data.join("Steam");

        if steam_path.exists() {
            let library_folders = steam_path.join("steamapps");

            if library_folders.exists() {
                if let Ok(entries) = std::fs::read_dir(&library_folders) {
                    for entry in entries.flatten() {
                        let path = entry.path();
                        if path.extension().map_or(false, |e| e == "acf") {
                            if let Ok(content) = std::fs::read_to_string(&path) {
                                let nombre = extract_steam_field(&content, "name")
                                    .unwrap_or_else(|| "Unknown Game".to_string());
                                let install_dir =
                                    extract_steam_field(&content, "installDir").unwrap_or_default();

                                let common_path = library_folders
                                    .parent()
                                    .unwrap_or(&library_folders)
                                    .join("common")
                                    .join(&install_dir);

                                let exe_path = common_path.join(format!("{}.exe", &install_dir));

                                if exe_path.exists() {
                                    games.push(AppBloqueada {
                                        id: Uuid::new_v4().to_string(),
                                        nombre,
                                        ruta_ejecutable: exe_path.to_string_lossy().to_string(),
                                        icono: None,
                                        categoria: "STEAM".to_string(),
                                        ultima_ejecucion: None,
                                        veces_ejecutado: 0,
                                        bloqueado: true,
                                        creado_en: Local::now().to_rfc3339(),
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(games)
}

fn extract_steam_field(content: &str, field: &str) -> Option<String> {
    for line in content.lines() {
        let line = line.trim();
        if line.starts_with(&format!("\"{}\"", field)) {
            if let Some(start) = line.find('"') {
                let after_first = &line[start + 1..];
                if let Some(end) = after_first.find('"') {
                    return Some(after_first[..end].to_string());
                }
            }
        }
    }
    None
}

#[tauri::command]
fn get_running_processes() -> Result<Vec<ProcessInfo>, String> {
    let mut system = System::new();
    system.refresh_all();

    let mut processes = Vec::new();

    for (pid, process) in system.processes() {
        if let Some(name) = process.name().to_str() {
            if name.to_lowercase().ends_with(".exe") {
                processes.push(ProcessInfo {
                    pid: pid.as_u32(),
                    nombre: name.to_string(),
                    ruta: process
                        .exe()
                        .map(|p| p.to_string_lossy().to_string())
                        .unwrap_or_default(),
                });
            }
        }
    }

    Ok(processes)
}

#[tauri::command]
fn get_estado_proteccion(state: State<AppState>) -> Result<EstadoProteccion, String> {
    let proteccion_activa = state.proteccion_activa.lock().map_err(|e| e.to_string())?;
    let modo_bloqueo = state.modo_bloqueo.lock().map_err(|e| e.to_string())?;

    Ok(EstadoProteccion {
        activa: *proteccion_activa,
        modo_bloqueo: modo_bloqueo.clone(),
        desde: None,
        hasta: None,
        focus_extremo: false,
    })
}

#[tauri::command]
fn toggle_proteccion(state: State<AppState>, password: String) -> Result<bool, String> {
    let password_hash = state.password_hash.lock().map_err(|e| e.to_string())?;

    if let Some(ref stored_hash) = *password_hash {
        if verify_password(&password, stored_hash) {
            let mut proteccion_activa =
                state.proteccion_activa.lock().map_err(|e| e.to_string())?;
            *proteccion_activa = !*proteccion_activa;
            return Ok(true);
        }
    } else {
        let mut proteccion_activa = state.proteccion_activa.lock().map_err(|e| e.to_string())?;
        *proteccion_activa = !*proteccion_activa;
        return Ok(true);
    }

    Ok(false)
}

#[tauri::command]
fn set_modo_bloqueo(state: State<AppState>, modo: String) -> Result<bool, String> {
    let mut modo_bloqueo = state.modo_bloqueo.lock().map_err(|e| e.to_string())?;
    *modo_bloqueo = modo;
    Ok(true)
}

#[tauri::command]
fn pause_proteccion(
    state: State<AppState>,
    minutes: u32,
    password: String,
) -> Result<bool, String> {
    let password_hash = state.password_hash.lock().map_err(|e| e.to_string())?;

    if let Some(ref stored_hash) = *password_hash {
        if verify_password(&password, stored_hash) {
            return Ok(true);
        }
    }

    Ok(false)
}

#[tauri::command]
fn get_estadisticas(state: State<AppState>) -> Result<Estadisticas, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_estadisticas().map_err(|e| e.to_string())
}

#[tauri::command]
fn get_historial(state: State<AppState>, limite: usize) -> Result<Vec<EventoHistorial>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_historial(limite).map_err(|e| e.to_string())
}

#[tauri::command]
fn set_autostart(enabled: bool) -> Result<bool, String> {
    #[cfg(windows)]
    {
        use std::process::Command;

        let exe_path = std::env::current_exe()
            .map_err(|e| e.to_string())?
            .to_string_lossy()
            .to_string();

        let key_path = r"Software\Microsoft\Windows\CurrentVersion\Run";

        if enabled {
            let output = Command::new("reg")
                .args(&[
                    "add",
                    &format!(r"HKCU\{}", key_path),
                    "/v",
                    "CuidaTuFocus",
                    "/t",
                    "REG_SZ",
                    "/d",
                    &exe_path,
                    "/f",
                ])
                .output();

            if output.is_err() {
                return Err("Failed to set autostart".to_string());
            }
        } else {
            let output = Command::new("reg")
                .args(&[
                    "delete",
                    &format!(r"HKCU\{}", key_path),
                    "/v",
                    "CuidaTuFocus",
                    "/f",
                ])
                .output();
        }
    }

    Ok(true)
}

fn verify_password(password: &str, hash: &str) -> bool {
    bcrypt::verify(password, hash).unwrap_or(false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db = Database::new().expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            db: Mutex::new(db),
            proteccion_activa: Mutex::new(true),
            modo_bloqueo: Mutex::new("MEDIUM".to_string()),
            password_hash: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            get_horarios,
            create_horario,
            update_horario,
            delete_horario,
            toggle_horario,
            get_apps_bloqueadas,
            add_app_bloqueada,
            remove_app_bloqueada,
            toggle_app_bloqueada,
            detect_steam_games,
            get_running_processes,
            get_estado_proteccion,
            toggle_proteccion,
            set_modo_bloqueo,
            pause_proteccion,
            get_estadisticas,
            get_historial,
            set_autostart,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

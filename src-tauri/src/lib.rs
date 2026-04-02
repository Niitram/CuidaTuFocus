use chrono::{Local, NaiveTime, Datelike};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use sysinfo::System;
use tauri::{AppHandle, Manager, State};
use tokio::time::interval;
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
    pub hash_sha256: Option<String>,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NotificationPayload {
    pub title: String,
    pub body: String,
    pub app_nombre: String,
    pub modo: String,
}

pub struct AppState {
    pub db: Mutex<Database>,
    pub proteccion_activa: Mutex<bool>,
    pub modo_bloqueo: Mutex<String>,
    pub password_hash: Mutex<Option<String>>,
    pub paused_until: Mutex<Option<String>>,
    pub intento_cooldown: Mutex<HashMap<String, (u32, std::time::Instant)>>,
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
    
    let hash = compute_file_hash(&app.ruta_ejecutable).ok();
    
    db.add_app_bloqueada(app, hash).map_err(|e| e.to_string())
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
                                    let hash = compute_file_hash(&exe_path.to_string_lossy()).ok();
                                    
                                    games.push(AppBloqueada {
                                        id: Uuid::new_v4().to_string(),
                                        nombre,
                                        ruta_ejecutable: exe_path.to_string_lossy().to_string(),
                                        icono: None,
                                        hash_sha256: hash,
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

fn compute_file_hash(path: &str) -> Result<String, String> {
    let data = std::fs::read(path).map_err(|e| e.to_string())?;
    let mut hasher = Sha256::new();
    hasher.update(&data);
    let result = hasher.finalize();
    Ok(format!("{:x}", result))
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
    let paused_until = state.paused_until.lock().map_err(|e| e.to_string())?;

    Ok(EstadoProteccion {
        activa: *proteccion_activa,
        modo_bloqueo: modo_bloqueo.clone(),
        desde: None,
        hasta: paused_until.clone(),
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
            let mut paused_until = state.paused_until.lock().map_err(|e| e.to_string())?;
            let until = Local::now() + chrono::Duration::minutes(minutes as i64);
            *paused_until = Some(until.to_rfc3339());
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
            let _output = Command::new("reg")
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

#[tauri::command]
fn minimize_to_tray(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn quit_app(app: AppHandle) -> Result<(), String> {
    app.exit(0);
    Ok(())
}

fn verify_password(password: &str, hash: &str) -> bool {
    bcrypt::verify(password, hash).unwrap_or(false)
}

fn should_block_now(state: &State<AppState>) -> bool {
    let proteccion_activa = state.proteccion_activa.lock().unwrap();
    if !*proteccion_activa {
        return false;
    }
    
    if let Ok(paused_until) = state.paused_until.lock() {
        if let Some(until_str) = paused_until.as_ref() {
            if let Ok(until) = chrono::DateTime::parse_from_rfc3339(until_str) {
                if until > chrono::Local::now() {
                    return false;
                }
            }
        }
    }
    
    true
}

fn get_current_horario_tipo(state: &State<AppState>) -> Option<String> {
    let db = match state.db.lock() {
        Ok(db) => db,
        Err(_) => return None,
    };
    
    let horarios = match db.get_horarios() {
        Ok(h) => h,
        Err(_) => return None,
    };
    
    let now = Local::now();
    let current_time = NaiveTime::from_hms_opt(now.hour() as u32, now.minute() as u32, 0)?;
    let dias_semana = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
    let dia_actual = dias_semana[now.weekday().num_days_from_sunday() as usize];
    
    for horario in horarios {
        if !horario.activo {
            continue;
        }
        if !horario.dias.contains(&dia_actual.to_string()) {
            continue;
        }
        
        let inicio = NaiveTime::parse_from_str(&horario.hora_inicio, "%H:%M").ok()?;
        let fin = NaiveTime::parse_from_str(&horario.hora_fin, "%H:%M").ok()?;
        
        if horario.hora_inicio <= horario.hora_fin {
            if current_time >= inicio && current_time < fin {
                return Some(horario.tipo);
            }
        } else {
            if current_time >= inicio || current_time < fin {
                return Some(horario.tipo);
            }
        }
    }
    
    None
}

fn check_and_block_processes(app: &AppHandle, state: &State<AppState>) {
    if !should_block_now(state) {
        return;
    }
    
    let horario_tipo = match get_current_horario_tipo(state) {
        Some(t) => t,
        None => return,
    };
    
    if horario_tipo != "BLOQUEADO" {
        return;
    }
    
    let modo = match state.modo_bloqueo.lock() {
        Ok(m) => m.clone(),
        Err(_) => return,
    };
    
    let db = match state.db.lock() {
        Ok(db) => db,
        Err(_) => return,
    };
    
    let apps = match db.get_apps_bloqueadas() {
        Ok(apps) => apps,
        Err(_) => return,
    };
    
    let mut system = System::new();
    system.refresh_processes(sysinfo::ProcessesToUpdate::All, true);
    
    for (pid, process) in system.processes() {
        let Some(exe_path) = process.exe() else { continue; };
        let exe_name = process.name();
        let exe_name_str = exe_name.to_string_lossy().to_lowercase();
        let exe_path_str = exe_path.to_string_lossy().to_lowercase();
        
        for app_blocked in &apps {
            if !app_blocked.bloqueado {
                continue;
            }
            
            let blocked_name = app_blocked.nombre.to_lowercase();
            let blocked_path = app_blocked.ruta_ejecutable.to_lowercase();
            
            let matches = exe_name_str.contains(&blocked_name) 
                || exe_path_str.contains(&blocked_name)
                || exe_path_str == blocked_path
                || exe_path_str.contains(&blocked_path.replace("\\", "/"));
            
            if matches {
                let app_nombre = app_blocked.nombre.clone();
                let app_id = app_blocked.id.clone();
                let pid_u32 = pid.as_u32();
                
                match modo.as_str() {
                    "SOFT" => {
                        let _ = terminate_process(pid_u32);
                        let _ = db.record_event(&app_id, "BLOQUEO", "SOFT", 0);
                        log::info!("Bloqueado (SOFT): {} (PID: {})", app_nombre, pid_u32);
                    }
                    "MEDIUM" => {
                        let _ = terminate_process(pid_u32);
                        let _ = db.record_event(&app_id, "BLOQUEO", "MEDIUM", 0);
                        let _ = send_notification(app, "¡Espera!", &format!("No podés abrir {} ahora. Se cerrará en 5 segundos.", app_nombre), &app_nombre, "MEDIUM");
                        log::info!("Bloqueado (MEDIUM): {} (PID: {})", app_nombre, pid_u32);
                    }
                    "STRICT" => {
                        let mut cooldown = match state.intento_cooldown.lock() {
                            Ok(c) => c,
                            Err(_) => continue,
                        };
                        
                        let entry = cooldown.entry(app_id.clone()).or_insert((0, std::time::Instant::now()));
                        
                        if entry.1.elapsed() > std::time::Duration::from_secs(60) {
                            *entry = (0, std::time::Instant::now());
                        }
                        
                        entry.0 += 1;
                        
                        let _ = terminate_process(pid_u32);
                        let _ = db.record_event(&app_id, "INTENTO_BLOQUEO", "STRICT", 0);
                        
                        if entry.0 >= 3 {
                            let _ = send_notification(app, "Bloqueado", &format!("Demasiados intentos con {}. Bloqueado por 5 minutos.", app_nombre), &app_nombre, "STRICT");
                            log::info!("Cooldown activado para: {}", app_nombre);
                        } else {
                            let _ = send_notification(app, "Bloqueado", &format!("No podés abrir {} ahora.", app_nombre), &app_nombre, "STRICT");
                        }
                        log::info!("Bloqueado (STRICT): {} (PID: {}), intentos: {}", app_nombre, pid_u32, entry.0);
                    }
                    _ => {}
                }
            }
        }
    }
}

#[cfg(windows)]
fn terminate_process(pid: u32) -> Result<(), String> {
    use windows::Win32::Foundation::CloseHandle;
    use windows::Win32::System::Threading::{OpenProcess, TerminateProcess, PROCESS_TERMINATE};
    
    unsafe {
        let handle = OpenProcess(PROCESS_TERMINATE, false, pid).map_err(|e| e.to_string())?;
        let _ = TerminateProcess(handle, 1);
        let _ = CloseHandle(handle);
    }
    Ok(())
}

#[cfg(not(windows))]
fn terminate_process(_pid: u32) -> Result<(), String> {
    Ok(())
}

fn send_notification(app: &AppHandle, title: &str, body: &str, app_nombre: &str, modo: &str) -> Result<(), String> {
    let payload = NotificationPayload {
        title: title.to_string(),
        body: body.to_string(),
        app_nombre: app_nombre.to_string(),
        modo: modo.to_string(),
    };
    
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("bloqueo-event", payload);
    }
    
    Ok(())
}

fn start_monitor(app: AppHandle, state: State<AppState>) {
    std::thread::spawn(move || {
        let rt = tokio::runtime::Runtime::new().unwrap();
        rt.block_on(async {
            let mut timer = interval(Duration::from_secs(2));
            loop {
                timer.tick().await;
                check_and_block_processes(&app, &state);
            }
        });
    });
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::init();
    
    let db = Database::new().expect("Failed to initialize database");
    
    let state = AppState {
        db: Mutex::new(db),
        proteccion_activa: Mutex::new(true),
        modo_bloqueo: Mutex::new("MEDIUM".to_string()),
        password_hash: Mutex::new(None),
        paused_until: Mutex::new(None),
        intento_cooldown: Mutex::new(HashMap::new()),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(state)
        .setup(|app| {
            let state = app.state::<AppState>();
            start_monitor(app.handle().clone(), state);
            Ok(())
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
            minimize_to_tray,
            quit_app,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

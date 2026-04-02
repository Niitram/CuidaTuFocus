use chrono::{Local, NaiveTime, Datelike};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Duration;
use sysinfo::System;
use tauri::{
    AppHandle, Manager, State, 
    menu::{Menu, MenuItem},
    tray::{TrayIcon, TrayIconBuilder, MouseButton, MouseButtonState},
    image::Image,
};
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
    let icono = extract_icon_as_base64(&app.ruta_ejecutable);
    
    db.add_app_bloqueada(app, hash, icono).map_err(|e| e.to_string())
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
fn detect_all_games() -> Result<Vec<AppBloqueada>, String> {
    let mut games = Vec::new();
    
    games.extend(detect_steam_games_internal());
    games.extend(detect_epic_games_internal());
    games.extend(detect_gog_games_internal());
    
    Ok(games)
}

fn detect_steam_games_internal() -> Vec<AppBloqueada> {
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
                                    let icono = extract_icon_as_base64(&exe_path.to_string_lossy());
                                    
                                    games.push(AppBloqueada {
                                        id: Uuid::new_v4().to_string(),
                                        nombre,
                                        ruta_ejecutable: exe_path.to_string_lossy().to_string(),
                                        icono,
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

    games
}

fn detect_epic_games_internal() -> Vec<AppBloqueada> {
    let mut games = Vec::new();
    
    if let Some(program_data) = std::env::var_os("ProgramData") {
        let epic_path = PathBuf::from(program_data).join("Epic");
        let manifest_path = epic_path.join("EpicGamesLauncher").join("Data").join("Manifests");
        
        if manifest_path.exists() {
            if let Ok(entries) = std::fs::read_dir(&manifest_path) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.extension().map_or(false, |e| e == "item") {
                        if let Ok(content) = std::fs::read_to_string(&path) {
                            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                                let nombre = json.get("DisplayName")
                                    .or_else(|| json.get("AppName"))
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("Unknown Game")
                                    .to_string();
                                
                                let install_location = json.get("InstallLocation")
                                    .and_then(|v| v.as_str())
                                    .unwrap_or("");
                                
                                let exe_path = PathBuf::from(install_location);
                                
                                if exe_path.exists() {
                                    if let Ok(dir_entries) = std::fs::read_dir(&exe_path) {
                                        for dir_entry in dir_entries.flatten() {
                                            let entry_path = dir_entry.path();
                                            if entry_path.extension().map_or(false, |e| e == "exe") {
                                                let exe_name = entry_path.file_name()
                                                    .and_then(|n| n.to_str())
                                                    .unwrap_or("")
                                                    .to_string();
                                                
                                                if !exe_name.to_lowercase().contains("epicgameslauncher")
                                                    && !exe_name.to_lowercase().contains("unrealengine") {
                                                    let hash = compute_file_hash(&entry_path.to_string_lossy()).ok();
                                                    let icono = extract_icon_as_base64(&entry_path.to_string_lossy());
                                                    
                                                    games.push(AppBloqueada {
                                                        id: Uuid::new_v4().to_string(),
                                                        nombre,
                                                        ruta_ejecutable: entry_path.to_string_lossy().to_string(),
                                                        icono,
                                                        hash_sha256: hash,
                                                        categoria: "EPIC".to_string(),
                                                        ultima_ejecucion: None,
                                                        veces_ejecutado: 0,
                                                        bloqueado: true,
                                                        creado_en: Local::now().to_rfc3339(),
                                                    });
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    games
}

fn detect_gog_games_internal() -> Vec<AppBloqueada> {
    let mut games = Vec::new();
    
    if let Some(local_app_data) = dirs::data_local_dir() {
        let gog_path = local_app_data.join("GOG.com").join("Games");
        
        if gog_path.exists() {
            if let Ok(entries) = std::fs::read_dir(&gog_path) {
                for entry in entries.flatten() {
                    let game_path = entry.path();
                    if game_path.is_dir() {
                        let ini_path = game_path.join("goggame.dll");
                        let exe_path = game_path.join(format!("{}.exe", game_path.file_name().and_then(|n| n.to_str()).unwrap_or("")));
                        
                        if !exe_path.exists() {
                            if let Ok(dir_entries) = std::fs::read_dir(&game_path) {
                                for dir_entry in dir_entries.flatten() {
                                    let file_name = dir_entry.file_name();
                                    let file_str = file_name.to_string_lossy().to_lowercase();
                                    if file_str.ends_with(".exe") 
                                        && !file_str.contains("unins")
                                        && !file_str.contains("setup") {
                                        let exe_path = dir_entry.path();
                                        let hash = compute_file_hash(&exe_path.to_string_lossy()).ok();
                                        let icono = extract_icon_as_base64(&exe_path.to_string_lossy());
                                        let nombre = game_path.file_name()
                                            .and_then(|n| n.to_str())
                                            .unwrap_or("Unknown Game")
                                            .to_string();
                                        
                                        games.push(AppBloqueada {
                                            id: Uuid::new_v4().to_string(),
                                            nombre,
                                            ruta_ejecutable: exe_path.to_string_lossy().to_string(),
                                            icono,
                                            hash_sha256: hash,
                                            categoria: "GOG".to_string(),
                                            ultima_ejecucion: None,
                                            veces_ejecutado: 0,
                                            bloqueado: true,
                                            creado_en: Local::now().to_rfc3339(),
                                        });
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    games
}

#[tauri::command]
fn detect_steam_games() -> Result<Vec<AppBloqueada>, String> {
    Ok(detect_steam_games_internal())
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

#[cfg(windows)]
fn extract_icon_as_base64(exe_path: &str) -> Option<String> {
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;
    use base64::Engine;
    
    let path_wide: Vec<u16> = OsStr::new(exe_path)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();
    
    let mut file_info: windows::Win32::UI::Shell::SHFILEINFOW = unsafe { std::mem::zeroed() };
    
    let result = unsafe { 
        windows::Win32::UI::Shell::SHGetFileInfoW(
            path_wide.as_ptr(),
            0,
            &mut file_info,
            std::mem::size_of::<windows::Win32::UI::Shell::SHFILEINFOW>() as u32,
            windows::Win32::UI::Shell::SHGFI_ICON | windows::Win32::UI::Shell::SHGFI_SMALLICON | windows::Win32::UI::Shell::SHGFI_PIDL,
        )
    };
    
    if result.1 == 0 {
        return None;
    }
    
    let h_icon = file_info.hIcon;
    
    if h_icon.0.is_null() {
        return None;
    }
    
    let icon_info = unsafe {
        let mut info: windows::Win32::UI::WindowsAndMessaging::ICONINFO = std::mem::zeroed();
        if windows::Win32::UI::WindowsAndMessaging::GetIconInfo(h_icon, &mut info) {
            Some(info)
        } else {
            None
        }
    };
    
    let bitmap_bits = if let Some(info) = icon_info {
        if !info.hbmColor.is_null() {
            let bits = get_icon_bits(info.hbmColor);
            unsafe {
                let _ = windows::Win32::Graphics::Gdi::DeleteObject(windows::Win32::Graphics::Gdi::HGDIOBJ(info.hbmColor.0));
                if !info.hbmMask.is_null() {
                    let _ = windows::Win32::Graphics::Gdi::DeleteObject(windows::Win32::Graphics::Gdi::HGDIOBJ(info.hbmMask.0));
                }
            }
            bits
        } else {
            None
        }
    } else {
        None
    };
    
    unsafe {
        let _ = windows::Win32::UI::WindowsAndMessaging::DestroyIcon(h_icon);
    }
    
    bitmap_bits.map(|bits| base64::engine::general_purpose::STANDARD.encode(&bits))
}

#[cfg(windows)]
fn get_icon_bits(h_bitmap: windows::Win32::Graphics::Gdi::HBITMAP) -> Option<Vec<u8>> {
    use windows::Win32::Graphics::Gdi::{GetObjectW, GetDIBits, BITMAP, BITMAPINFO, BITMAPINFOHEADER, DIB_RGB_COLORS};
    use windows::Win32::Foundation::BITMAPINFOHEADER;
    
    let mut bm: BITMAP = unsafe { std::mem::zeroed() };
    
    let size = unsafe { GetObjectW(h_bitmap, std::mem::size_of::<BITMAP>() as i32, &mut bm as *mut _ as *mut std::ffi::c_void) };
    
    if size == 0 {
        return None;
    }
    
    let width = bm.bmWidth as usize;
    let height = bm.bmHeight as usize;
    let planes = bm.bmPlanes as usize;
    let bits_per_pixel = bm.bmBitsPixel as usize;
    
    let mut bmi: BITMAPINFO = unsafe { std::mem::zeroed() };
    bmi.bmiHeader.biSize = std::mem::size_of::<BITMAPINFOHEADER>() as u32;
    bmi.bmiHeader.biWidth = bm.bmWidth;
    bmi.bmiHeader.biHeight = -bm.bmHeight as i32;
    bmi.bmiHeader.biPlanes = bm.bmPlanes;
    bmi.bmiHeader.biBitCount = bm.bmBitsPixel;
    bmi.bmiHeader.biCompression = windows::Win32::Graphics::Gdi::BI_RGB.0 as u32;
    
    let mut buffer: Vec<u8> = vec![0u8; width * height * 4];
    
    let lines = unsafe {
        GetDIBits(
            None,
            h_bitmap,
            0,
            height as u32,
            Some(buffer.as_mut_ptr() as *mut std::ffi::c_void),
            &mut bmi,
            DIB_RGB_COLORS,
        )
    };
    
    if lines == 0 {
        return None;
    }
    
    let mut rgba_buffer = Vec::with_capacity(width * height * 4);
    
    for i in 0..(width * height) {
        let b = buffer[i * 3];
        let g = buffer[i * 3 + 1];
        let r = buffer[i * 3 + 2];
        rgba_buffer.push(r);
        rgba_buffer.push(g);
        rgba_buffer.push(b);
        rgba_buffer.push(255);
    }
    
    Some(rgba_buffer)
}

#[cfg(not(windows))]
fn extract_icon_as_base64(_exe_path: &str) -> Option<String> {
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

        let task_name = "CuidaTuFocus_AutoStart";
        
        if enabled {
            let task_xml = format!(
                r#"<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <Triggers>
    <LogonTrigger>
      <Enabled>true</Enabled>
    </LogonTrigger>
  </Triggers>
  <Actions>
    <Exec>
      <Command>{}</Command>
      <Arguments>--minimized</Arguments>
    </Exec>
  </Actions>
  <Settings>
    <Hidden>true</Hidden>
    <RunOnlyIfNetworkAvailable>false</RunOnlyIfNetworkAvailable>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>true</StartWhenAvailable>
    <ExecutionTimeLimit>PT0S</ExecutionTimeLimit>
  </Settings>
</Task>"#,
                exe_path.replace("\\", "\\\\")
            );
            
            let temp_file = std::env::temp_dir().join("cuidatufocus_task.xml");
            std::fs::write(&temp_file, task_xml).map_err(|e| e.to_string())?;
            
            let output = Command::new("schtasks")
                .args(&["/Create", "/TN", task_name, "/XML", &temp_file.to_string_lossy(), "/F"])
                .output();

            let _ = std::fs::remove_file(temp_file);
            
            if output.is_err() {
                return Err("Failed to create scheduled task".to_string());
            }
            
            if let Ok(out) = output {
                if !out.status.success() {
                    return Err(format!("Failed to create scheduled task: {:?}", String::from_utf8_lossy(&out.stderr)));
                }
            }
        } else {
            let output = Command::new("schtasks")
                .args(&["/Delete", "/TN", task_name, "/F"])
                .output();
                
            if let Ok(out) = output {
                log::info!("Delete task result: {:?}", String::from_utf8_lossy(&out.stdout));
            }
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

#[tauri::command]
fn show_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
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
                            let _ = send_notification(app, "Bloqueado", &format!("No podés abrir {}.", app_nombre), &app_nombre, "STRICT");
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

fn setup_tray(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let open_item = MenuItem::with_id(app, "open", "Abrir CuidaTuFocus", true, None::<&str>)?;
    let pause_15_item = MenuItem::with_id(app, "pause_15", "Pausar 15 min", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Salir", true, None::<&str>)?;
    
    let menu = Menu::with_items(app, &[&open_item, &pause_15_item, &quit_item])?;
    
    let _tray = TrayIconBuilder::new()
        .icon(app.default_window_icon().unwrap().clone())
        .menu(&menu)
        .tooltip("CuidaTuFocus - Protegido")
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "open" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "pause_15" => {
                    let state = app.state::<AppState>();
                    if let Ok(mut paused_until) = state.paused_until.lock() {
                        let until = Local::now() + chrono::Duration::minutes(15);
                        *paused_until = Some(until.to_rfc3339());
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let tauri::tray::TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;
    
    Ok(())
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
            
            if let Err(e) = setup_tray(app.handle()) {
                log::error!("Failed to setup tray: {}", e);
            }
            
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
            detect_all_games,
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
            show_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

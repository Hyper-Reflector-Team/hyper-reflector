// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod proxy;

use proxy::{ProxyManager, start_proxy, stop_proxy, kill_emulator_only};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

//Just for testing
#[tauri::command]
async fn run_custom_process() -> Result<String, String> {
    #[cfg(target_os = "windows")]
    let args = ["-n", "1", "example.com"];
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    let args = ["-c", "1", "example.com"];

    let output = std::process::Command::new("ping")
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;

    println!("Hello, world!");
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            run_custom_process,
            start_proxy,
            stop_proxy,
            kill_emulator_only
      ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


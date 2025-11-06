// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::{AppHandle, Emitter, EventTarget, State, Manager};
use std::sync::{Arc, Mutex};
use tauri_plugin_shell::ShellExt;

mod proxy;
use proxy::{kill_emulator_only, start_proxy, stop_proxy, ProxyManager};

// This saves the child process
#[derive(Default)]
struct ProcState {
    child: Option<tauri_plugin_shell::process::CommandChild>,
}

#[derive(Default)]
struct AudioState {
    sink: Mutex<Option<Arc<rodio::Sink>>>,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// small helpers so we never fight the borrow checker again
fn take_sink(app: &tauri::AppHandle) -> Option<Arc<rodio::Sink>> {
    let audio = app.state::<AudioState>();
    let mut guard = audio.sink.lock().unwrap();
    guard.take() // guard drops here
}

fn set_sink(app: &tauri::AppHandle, new_sink: Option<Arc<rodio::Sink>>) {
    let audio = app.state::<AudioState>();
    let mut guard = audio.sink.lock().unwrap();
    *guard = new_sink; // guard drops here
}

#[tauri::command]
fn stop_sound(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(sink) = take_sink(&app) {
        sink.stop();
    }
    Ok(())
}


#[tauri::command]
fn play_sound(app: tauri::AppHandle, path: String) -> Result<(), String> {
    // Quick check so we error fast
    std::fs::File::open(&path).map_err(|e| format!("open failed: {e}"))?;

    // Stop anything already playing
    if let Some(old) = take_sink(&app) {
        old.stop();
    }

    // Worker thread to keep OutputStream alive while playing
    std::thread::spawn(move || {
        let stream = match rodio::OutputStreamBuilder::open_default_stream() {
            Ok(s) => s,
            Err(e) => { eprintln!("audio: open stream failed: {e}"); return; }
        };

        let sink = Arc::new(rodio::Sink::connect_new(&stream.mixer()));

        // publish handle (drop guard inside helper)
        set_sink(&app, Some(sink.clone()));

        // open & decode
        let file = match std::fs::File::open(&path) {
            Ok(f) => f,
            Err(e) => {
                eprintln!("audio: open file failed: {e}");
                set_sink(&app, None);
                return;
            }
        };
        let source = match rodio::Decoder::try_from(file) {
            Ok(s) => s,
            Err(e) => {
                eprintln!("audio: decode failed: {e}");
                set_sink(&app, None);
                return;
            }
        };

        sink.append(source);
        sink.sleep_until_end();

        // clear the handle if it's still this sink
        let current = take_sink(&app);
        if let Some(cur) = current {
            if !Arc::ptr_eq(&cur, &sink) {
                // someone else started a new sound; put it back
                set_sink(&app, Some(cur));
            }
        }
    });

    Ok(())
}

#[tauri::command]
async fn start_training_mode(
    app: tauri::AppHandle,
    proc: State<'_, Arc<Mutex<ProcState>>>,
    use_sidecar: bool,
    exe_path: Option<String>,
    args: Vec<String>,
) -> Result<(), String> {
    let cmd_builder = if use_sidecar {
        app.shell().sidecar("emulator").map_err(|e| e.to_string())?
    } else {
        // need to set up sidecar code later
        let path = exe_path.ok_or("exe_path required when use_sidecar=false")?;
        app.shell().command(path)
    };
    let cmd = cmd_builder.args(args);
    let (mut rx, child) = cmd.spawn().map_err(|e| e.to_string())?;
    {
        let mut guard = proc.lock().unwrap();
        guard.child = Some(child);
    }

    tauri::async_runtime::spawn({
        let app = app.clone();
        async move {
            use tauri_plugin_shell::process::CommandEvent;
            // while let Some(event) = rx.recv().await {
            //     match event {
            //         CommandEvent::Stdout(bytes) => {
            //             let line = String::from_utf8_lossy(&bytes).to_string();
            //             let _ = app.emit("emulator:stdout", line);
            //         }
            //         CommandEvent::Stderr(bytes) => {
            //             let line = String::from_utf8_lossy(&bytes).to_string();
            //             let _ = app.emit("emulator:stderr", line);
            //         }
            //         CommandEvent::Terminated(payload) => {
            //             let _ = app.emit("emulator:exit", payload);
            //         }
            //         _ => {}
            //     }
            // }
        }
    });

    Ok(())
}

#[tauri::command]
async fn launch_emulator(app: tauri::AppHandle, exe_path: String, args: Vec<String>) -> Result<(), String> {
    let command = app.shell().command(exe_path).args(args);
    let (_rx, _child) = command.spawn().map_err(|e| e.to_string())?;
    Ok(())
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
        .plugin(tauri_plugin_prevent_default::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .manage(Arc::new(Mutex::new(ProcState::default())))
        .manage(AudioState::default())
        .invoke_handler(tauri::generate_handler![
            play_sound,
            stop_sound,
            greet,
            start_training_mode,
            launch_emulator,
            run_custom_process,
            start_proxy,
            stop_proxy,
            kill_emulator_only
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

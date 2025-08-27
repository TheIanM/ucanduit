use std::path::Path;
use std::fs;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AudioFile {
    pub name: String,
    pub path: String,
    pub size: u64,
    pub extension: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DirectoryContents {
    pub directory: String,
    pub files: Vec<AudioFile>,
    pub count: usize,
}

// Audio file extensions we support
const SUPPORTED_AUDIO_EXTENSIONS: &[&str] = &["mp3", "wav", "ogg", "m4a", "aac", "flac", "wma"];

#[tauri::command]
async fn scan_audio_directory(directory_path: String) -> Result<DirectoryContents, String> {
    println!("🔍 Scanning audio directory: {}", directory_path);
    
    // Resolve relative paths relative to the app's resource directory
    let resolved_path = if directory_path.starts_with("./") {
        // Remove the "./" prefix and resolve relative to app resources
        let relative_part = &directory_path[2..];
        let app_dir = std::env::current_exe()
            .map(|exe_path| exe_path.parent().unwrap().to_path_buf())
            .unwrap_or_else(|_| std::env::current_dir().unwrap());
        
        println!("🔍 App directory: {:?}", app_dir);
        println!("🔍 Current directory: {:?}", std::env::current_dir());
        
        // Try different possible locations for the audio folder
        let possible_paths = vec![
            app_dir.join(relative_part),                    // Same dir as executable
            app_dir.join("dist").join(relative_part),       // dist subfolder
            app_dir.parent().unwrap().join("dist").join(relative_part), // parent/dist
            app_dir.parent().unwrap().join(relative_part),  // parent directory
            std::env::current_dir().unwrap().join("dist").join(relative_part), // current/dist
            std::env::current_dir().unwrap().join(relative_part), // current directory
            std::env::current_dir().unwrap().parent().unwrap().join(relative_part), // current parent
        ];
        
        let mut found_path = None;
        for candidate in possible_paths {
            println!("🔍 Checking path: {:?}", candidate);
            if candidate.exists() {
                println!("✅ Found audio directory at: {:?}", candidate);
                found_path = Some(candidate);
                break;
            }
        }
        
        found_path.unwrap_or_else(|| Path::new(&directory_path).to_path_buf())
    } else {
        Path::new(&directory_path).to_path_buf()
    };
    
    let path = &resolved_path;
    if !path.exists() {
        return Err(format!("Directory does not exist: {} (resolved to: {:?})", directory_path, resolved_path));
    }
    
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {} (resolved to: {:?})", directory_path, resolved_path));
    }
    
    let mut audio_files = Vec::new();
    
    match fs::read_dir(path) {
        Ok(entries) => {
            for entry in entries {
                match entry {
                    Ok(dir_entry) => {
                        let file_path = dir_entry.path();
                        if file_path.is_file() {
                            if let Some(extension) = file_path.extension() {
                                if let Some(ext_str) = extension.to_str() {
                                    let ext_lower = ext_str.to_lowercase();
                                    if SUPPORTED_AUDIO_EXTENSIONS.contains(&ext_lower.as_str()) {
                                        if let Some(file_name) = file_path.file_name() {
                                            if let Some(name_str) = file_name.to_str() {
                                                let metadata = fs::metadata(&file_path);
                                                let size = metadata.map(|m| m.len()).unwrap_or(0);
                                                
                                                audio_files.push(AudioFile {
                                                    name: name_str.to_string(),
                                                    path: file_path.to_string_lossy().to_string(),
                                                    size,
                                                    extension: ext_lower,
                                                });
                                                
                                                println!("  ✅ Found: {}", name_str);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    Err(e) => {
                        println!("  ⚠️ Error reading directory entry: {}", e);
                    }
                }
            }
        }
        Err(e) => {
            return Err(format!("Failed to read directory: {}", e));
        }
    }
    
    let count = audio_files.len();
    println!("📁 Found {} audio files in {}", count, directory_path);
    
    Ok(DirectoryContents {
        directory: directory_path,
        files: audio_files,
        count,
    })
}

#[tauri::command]
async fn get_supported_audio_formats() -> Vec<String> {
    SUPPORTED_AUDIO_EXTENSIONS.iter().map(|&s| s.to_string()).collect()
}

#[tauri::command]
async fn check_directory_exists(directory_path: String) -> bool {
    Path::new(&directory_path).exists()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      scan_audio_directory,
      get_supported_audio_formats,
      check_directory_exists
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

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
    
    let path = Path::new(&directory_path);
    if !path.exists() {
        return Err(format!("Directory does not exist: {}", directory_path));
    }
    
    if !path.is_dir() {
        return Err(format!("Path is not a directory: {}", directory_path));
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

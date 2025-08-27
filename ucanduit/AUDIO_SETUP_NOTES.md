# Audio Directory Setup - Troubleshooting Notes

## Problem
- Audio files placed in `public/audio/` directory
- Tauri Rust code couldn't find the audio files
- Error: "public/audio directory does not exist"

## Root Cause
- Running `cargo tauri dev` from project root: `/ucanduit/`
- But Tauri's Rust process actually runs from: `/ucanduit/src-tauri/`
- So `std::env::current_dir()` returns `/ucanduit/src-tauri/`
- Looking for `public/audio/` from there finds `/ucanduit/src-tauri/public/audio/` (doesn't exist)
- But actual files are at `/ucanduit/public/audio/`

## Solution
Modified Rust code in `src-tauri/src/lib.rs`:

```rust
// BEFORE (broken):
let current_dir = std::env::current_dir()?;
let audio_path = current_dir.join("public").join("audio");

// AFTER (working):
let current_dir = std::env::current_dir()?;
let project_root = current_dir.parent().ok_or("Cannot find project root")?;
let audio_path = project_root.join("public").join("audio");
```

Applied this fix to both functions:
- `scan_audio_directories()`
- `scan_audio_directory()`

## File Structure
```
ucanduit/                    ← Project root
├── public/audio/           ← Audio files go here
│   ├── cafe/
│   ├── thunderstorm/
│   └── newdir/
├── src-tauri/              ← Tauri runs from here
│   ├── src/lib.rs         ← Fixed path resolution here
│   └── target/debug/app   ← Actual executable location
└── dist/
```

## Key Commands
- Run from project root: `cargo tauri dev` (from `/ucanduit/`)
- Not from: `/ucanduit/src-tauri/`

## Debug Method
Added debug prints to see what directory Rust is actually using:
```rust
let current_dir = std::env::current_dir()?;
println!("🔍 Rust current_dir: {:?}", current_dir);
```

This showed `/ucanduit/src-tauri/` instead of expected `/ucanduit/`.

## Future Audio Addition
1. Create folder in `public/audio/` (e.g., `public/audio/ocean/`)
2. Add `.ogg`, `.mp3`, `.wav` files to the folder
3. Restart app - new directory auto-discovered
4. Folder name becomes display name (e.g., "ocean" → "Ocean")
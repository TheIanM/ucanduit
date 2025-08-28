# Audio Playback Investigation Findings

## Problem Statement
Need reliable audio playback for ambient sounds in ucanduit Tauri app. Files are stored in `public/audio/` directory and need to work cross-platform.

## Approaches Tested

### 1. Web Audio API + Tauri Asset Serving (FAILED)
**Implementation:** 
- Used Web Audio API's `decodeAudioData()`
- Fetched files via HTTP from Tauri's built-in web server
- Files served at `localhost:1420/audio/...`

**Issues:**
- "EncodingError: Decoding failed" on all files (MP3, OGG, M4A)
- Web Audio API very strict about file formats
- Even valid Bandcamp files rejected

**Status:** Abandoned - too many format compatibility issues

### 2. HTML5 Audio + HTTP Range Requests (PARTIALLY WORKING)
**Implementation:**
- HTML5 Audio elements loading files directly
- Files served via `localhost:1420/audio/...`
- Browser makes HTTP range requests for efficient streaming

**Issues:**
- "Format not supported" errors despite valid files
- HTTP range requests (byte-range 0-1, 0-1445) not handled properly by Tauri's web server
- Files load with wrong byte counts suggesting server issues

**Status:** Partially working but unreliable

### 3. HTML5 Audio + convertFileSrc() (CURRENT - TIMING OUT)
**Implementation:**
- Use Tauri's `convertFileSrc()` to convert file paths to `asset://` URLs
- Enable asset protocol in `tauri.conf.json`
- HTML5 Audio loads from asset protocol instead of HTTP

**Configuration Added:**
```json
"assetProtocol": {
  "enable": true, 
  "scope": ["$RESOURCE/**", "/Users/devian/Documents/productivity/ucanduit/public/**"]
}
```

**Progress:**
✅ No more "format not supported" errors  
✅ No more HTTP range request issues  
✅ Asset URLs generated correctly: `asset://localhost/%2FUsers%2F...`  
❌ "Audio load timeout" errors - files not actually loading  

**Issues:**
- Asset protocol enabled but files still timeout after 10 seconds
- URLs look correct but don't resolve within Tauri app
- Scope configuration may need adjustment

**Status:** Close but not working

## Research from Other Projects

### DEMO Project (music-player-app)
**Approach:** Dedicated HTTP server + fetch + blob URLs
- Spawns `tiny_http` server on port 8000
- Serves files directly with CORS headers  
- Frontend: `fetch()` → `blob()` → `URL.createObjectURL()` → HTML5 Audio
- **Result:** Proven to work perfectly

**Security Concern:** Opens local port, potential attack surface

### DEMO-2 Project (Modern Tauri Music Player)
**Approach:** Direct file reading + blob URLs
- Rust command: `load_file_bytes()` reads files directly
- Frontend: bytes → `Blob()` → `URL.createObjectURL()` → HTML5 Audio
- Uses filesystem plugin for secure file access
- **Result:** Proven to work, no network exposure

**Benefits:** Secure, no HTTP server needed, lazy loading

## Current Status
- Asset protocol approach almost working but timing out
- Need to debug why asset:// URLs aren't resolving
- Ready to fall back to DEMO-2 blob approach if needed

## Next Steps
1. Debug asset protocol scope/path issues
2. If asset protocol fails, implement DEMO-2 blob approach
3. Optimize loading strategy (lazy load, batching)
4. Add proper error handling and fallbacks

## Resource Management Issues Identified
- Current code loads ALL files for ALL sliders upfront (wasteful)
- Need lazy loading: only load files when slider is moved
- Need batching: don't load 20+ files simultaneously
- Consider caching strategy for frequently used files

## Recommended Approach
**Primary:** DEMO-2 blob method (secure, proven, efficient)  
**Fallback:** Dedicated HTTP server (if blob method has issues)  
**Not Recommended:** Asset protocol (too many configuration complications)
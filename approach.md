# Audio Playback Approaches for ucanduit

## Current Situation
We have ambient audio files that need to play reliably across platforms. Currently experiencing "format not supported" errors and HTTP range request issues with Tauri's default asset serving.

## Approach 1: Current HTML5 Audio + Tauri Asset Serving

**How it works:**
- Audio files in `public/audio/` served via Tauri's built-in web server
- HTML5 Audio elements load files directly via HTTP paths (e.g., `/audio/thunderstorm/file.mp3`)
- Browser makes range requests for efficient streaming

**Pros:**
✅ Simple implementation - no additional dependencies
✅ Uses standard web technologies
✅ Automatic format detection by browser
✅ Low memory usage (streaming)

**Cons:**
❌ Tauri's web server doesn't handle HTTP range requests properly
❌ "Format not supported" errors despite valid files
❌ Browser compatibility issues with range requests
❌ No control over HTTP headers/CORS
❌ Dependent on Tauri's asset serving implementation

**Current Status:** Partially working but unreliable

---

## Approach 2: Tauri Filesystem Plugin + Blob URLs

**How it works:**
- Use Tauri filesystem plugin to read files directly as bytes
- Convert file data to JavaScript blobs
- Create blob URLs for HTML5 Audio elements
- No HTTP requests - pure filesystem access

**Pros:**
✅ No HTTP/network issues
✅ Direct file access - no serving complexity
✅ Follows Tauri's security model with permissions
✅ Works with any file format browser supports
✅ Complete control over file loading

**Cons:**
❌ Requires additional setup (filesystem plugin, permissions)
❌ Higher memory usage (full files loaded into memory)
❌ More complex implementation
❌ Need to implement our own caching strategy
❌ Potential performance impact for large files

**Current Status:** Not implemented, but should work reliably

---

## Approach 3: Dedicated HTTP Server (DEMO Pattern)

**How it works:**
- Spawn separate HTTP server (e.g., `tiny_http` on port 8000)
- Server directly serves audio files from filesystem
- Frontend fetches files, converts to blobs, plays via HTML5 Audio
- Completely independent of Tauri's asset system

**Pros:**
✅ **Proven to work** - DEMO project shows this works perfectly
✅ Full control over HTTP serving (headers, CORS, etc.)
✅ No range request issues - serves complete files
✅ Works with any audio format
✅ Simple, reliable implementation
✅ Can add custom endpoints for metadata, etc.

**Cons:**
❌ Additional port/server to manage
❌ Extra dependency (`tiny_http`)
❌ Higher memory usage (full file loading)
❌ Need to handle server lifecycle
❌ Potential port conflicts

**Current Status:** Not implemented, but pattern is proven

---

## Approach 4: Web Audio API + AudioContext (Previous Attempt)

**How it works:**
- Fetch audio files as ArrayBuffers
- Decode using `AudioContext.decodeAudioData()`
- Play using Web Audio API buffer sources

**Pros:**
✅ Precise audio control (volume, effects, etc.)
✅ Low-level audio manipulation capabilities
✅ Good for complex audio processing

**Cons:**
❌ **Very strict format requirements** - failed with our files
❌ Complex implementation
❌ Higher CPU usage for decoding
❌ "EncodingError" issues with valid audio files
❌ Browser compatibility variations

**Current Status:** Failed due to decoding errors

---

## Recommendation

**Primary Choice: Approach 3 (Dedicated HTTP Server)**

**Reasoning:**
1. **Proven to work** - DEMO project demonstrates this pattern works reliably
2. **Solves all current issues** - no range requests, format support, etc.
3. **Relatively simple** - just add `tiny_http` dependency and spawn server
4. **Full control** - we can customize serving behavior as needed
5. **Future-proof** - can extend for metadata, playlists, etc.

**Implementation Plan:**
1. Add `tiny_http` dependency to `Cargo.toml`
2. Spawn HTTP server on startup (port 8001 to avoid conflicts)
3. Serve files from `public/audio` directory with proper CORS headers
4. Update frontend to use fetch + blob pattern like DEMO
5. Keep existing directory scanning commands for file discovery

**Fallback: Approach 2 (Filesystem Plugin)**
If HTTP server approach has issues, filesystem plugin + blobs should work reliably but with higher memory usage.
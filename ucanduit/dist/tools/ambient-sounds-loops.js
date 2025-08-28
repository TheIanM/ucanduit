/**
 * Ambient Sounds Tool - ES6 Module
 * Handles real ambient sound loops for relaxation and atmosphere
 */

export class AmbientSoundsTool {
    constructor(container) {
        this.container = container;
        this.audioContext = null;
        this.masterGain = null;
        this.sounds = {};
        this.isInitialized = false;
        this.directoryCache = new Map(); // Cache discovered files
        
        // Audio loop configurations - will be dynamically populated by scanning directories
        this.soundConfigs = {};
        
        // Supported audio formats
        this.supportedFormats = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
        
        // Test audio format support at startup (async)
        this.checkAudioSupport().catch(console.error);
        
        // Discover audio directories and initialize
        this.initializeAsync();
    }
    
    // Async initialization that discovers directories first, then renders
    async initializeAsync() {
        try {
            // First discover the audio directories
            await this.discoverAudioDirectories();
            
            // Then render the UI with discovered configurations
            this.render();
            this.bindEvents();
        } catch (error) {
            console.error('❌ Failed to initialize AmbientSoundsTool:', error);
            // Still render empty UI so the container doesn't break
            this.render();
            this.bindEvents();
        }
    }
    
    // Check audio format support using both Tauri and browser capabilities
    async checkAudioSupport() {
        // Wait for Tauri to be available
        await this.waitForTauri();
        
        try {
            // Get Tauri's supported formats using correct API
            const { core } = window.__TAURI__;
            console.log('🦀 Calling get_supported_audio_formats...');
            const tauriFormats = await core.invoke('get_supported_audio_formats');
            console.log('🦀 Tauri supported formats:', tauriFormats);
            
            // Also check browser support for web audio playback
            const audio = new Audio();
            const supportMap = {
                mp3: audio.canPlayType('audio/mpeg'),
                wav: audio.canPlayType('audio/wav'),
                ogg: audio.canPlayType('audio/ogg; codecs="vorbis"'),
                m4a: audio.canPlayType('audio/mp4; codecs="mp4a.40.2"'),
                aac: audio.canPlayType('audio/aac'),
                flac: audio.canPlayType('audio/flac'),
                wma: audio.canPlayType('audio/x-ms-wma')
            };
            
            console.log('🎧 Browser audio format support:');
            for (const [format, support] of Object.entries(supportMap)) {
                console.log(`  ${format}: ${support || 'not supported'}`);
            }
            
            // Use intersection of Tauri supported formats and browser supported formats
            this.supportedFormats = tauriFormats.filter(format => 
                supportMap[format] && supportMap[format] !== ''
            );
            
            console.log(`📋 Will use formats: ${this.supportedFormats.join(', ')}`);
        } catch (error) {
            console.warn('⚠️ Failed to get Tauri audio support, using defaults:', error);
            // Fallback to basic supported formats
            this.supportedFormats = ['mp3', 'wav', 'ogg'];
        }
    }
    
    // Wait for Tauri API to be available
    async waitForTauri() {
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max
        
        while (attempts < maxAttempts) {
            if (window.__TAURI__ && window.__TAURI__.core) {
                console.log('🦀 Tauri API is ready');
                console.log('🔍 Available Tauri APIs:', Object.keys(window.__TAURI__));
                return;
            }
            console.log(`⏳ Waiting for Tauri API... (${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('Tauri API did not become available within timeout');
    }
    
    // Automatically discover audio directories and build sound configurations
    async discoverAudioDirectories() {
        try {
            await this.waitForTauri();
            
            const { core } = window.__TAURI__;
            const audioDirectories = await core.invoke('scan_audio_directories');
            console.log('directory list:',audioDirectories);
            
            // Build sound configurations from discovered directories
            this.soundConfigs = {};
            for (const dir of audioDirectories) {
                const key = dir.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                
                // Create display name from directory name
                const displayName = dir.name
                    .split(/[-_\s]+/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                
                // Set base gain based on sound type
                let baseGain = 0.5;
                const lowerDirName = dir.name.toLowerCase();
                if (lowerDirName.includes('rain') || lowerDirName.includes('storm')) {
                    baseGain = 0.6;
                } else if (lowerDirName.includes('cafe') || lowerDirName.includes('coffee')) {
                    baseGain = 0.3;
                } else if (lowerDirName.includes('thunder')) {
                    baseGain = 0.4;
                }
                
                this.soundConfigs[key] = {
                    directory: dir.path, // Already formatted as /audio/{name}
                    baseGain: baseGain,
                    displayName: displayName,
                    fileCount: dir.file_count
                };
            }
            return true;
            
        } catch (error) {
            console.error('Failed to discover audio directories:', error);
            this.soundConfigs = {};
            return false;
        }
    }
    
    // Scan directory for audio files 
    
    
    async scanDirectory(directory, forceRefresh = false) {
        console.log('🔍 About to scan directory:', directory);
        console.log('🔍 Directory type:', typeof directory);
        const cacheKey = directory;
        if (!forceRefresh && this.directoryCache.has(cacheKey)) {
            console.log('🔍 Using cached result for:', directory);
            return this.directoryCache.get(cacheKey);
        }
        
        try {
            await this.waitForTauri();
            
            const { core } = window.__TAURI__;
            
            const result = await core.invoke('scan_audio_directory', { 
                directoryPath: directory 
            });
            
            // Convert to simple web paths
            const fileUrls = result.files.map(file => file.path);
            
            this.directoryCache.set(cacheKey, fileUrls);
            return fileUrls;
            
        } catch (error) {
            console.error(`Failed to scan directory ${directory}:`, error);
            return [];
        }
    }
    
    // Select random file from available files
    selectRandomFile(files) {
        if (!files || files.length === 0) return null;
        return files[Math.floor(Math.random() * files.length)];
    }
    
    render() {
        // Check if we have any sound configurations discovered yet
        const hasConfigs = Object.keys(this.soundConfigs).length > 0;
        
        let soundItems = '';
        if (hasConfigs) {
            soundItems = Object.entries(this.soundConfigs).map(([key, config]) => `
                <div class="sound-item" style="
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    padding: 8px 0;
                ">
                    <div class="sound-label" style="
                        font-size: 16px;
                        font-weight: 600;
                        color: #2a2d34;
                        text-align: center;
                    ">${config.displayName}</div>
                    <input type="range" class="volume-slider" data-sound="${key}" min="0" max="100" value="0" 
                           style="
                        -webkit-appearance: none;
                        appearance: none;
                        width: 100%;
                        height: 12px;
                        border-radius: 8px;
                        background: #F5F5F5;
                        border: 2px solid #2a2d34;
                        outline: none;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        --thumb-scale: 1;
                    ">
                </div>
            `).join('');
        } else {
            // Show loading state while discovering directories
            soundItems = `
                <div style="
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 40px;
                    color: #666;
                    font-style: italic;
                ">
                    Discovering audio directories...
                </div>
            `;
        }

        this.container.innerHTML = `
            <div class="sound-controls" style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                gap: 20px;
                margin: 10px 0 20px 0;
                padding: 10px 0;
            ">
                ${soundItems}
            </div>
            
            <div class="audio-status" style="
                text-align: center;
                padding: 10px;
                margin: 10px 0;
                background: #f8f9fa;
                border-radius: 8px;
                font-size: 12px;
                color: #666;
                display: none;
            " id="audio-status">
                Loading audio files...
            </div>
            
            
            <style>
                .volume-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: white;
                    border: 3px solid #2a2d34;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    transform: scale(var(--thumb-scale));
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }

                .volume-slider::-moz-range-thumb {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: white;
                    border: 3px solid #2a2d34;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    transform: scale(var(--thumb-scale));
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                
                /* Responsive styles */
                @media (max-height: 250px) {
                    .sound-controls { 
                        display: flex !important;
                        flex-direction: row !important;
                        gap: 12px !important;
                        margin: 6px 0 !important;
                        padding: 0 !important;
                        flex-wrap: nowrap !important;
                        overflow-x: auto !important;
                    }
                    .sound-item { 
                        display: flex !important;
                        flex-direction: column !important;
                        gap: 4px !important;
                        min-width: 70px !important;
                        flex-shrink: 0 !important;
                    }
                    .sound-label { 
                        font-size: 9px !important; 
                        text-align: center !important;
                        white-space: nowrap !important;
                    }
                    .volume-slider { 
                        height: 6px !important;
                        width: 100% !important;
                    }
                    .volume-slider::-webkit-slider-thumb {
                        width: 16px !important;
                        height: 16px !important;
                    }
                    .volume-slider::-moz-range-thumb {
                        width: 16px !important;
                        height: 16px !important;
                    }
                }

                @media (max-width: 250px) {
                    .sound-controls { 
                        grid-template-columns: 1fr !important; 
                        gap: 6px !important;
                    }
                    .sound-label { font-size: 10px !important; }
                    .volume-slider { height: 4px !important; }
                }
            </style>
        `;
    }
    
    bindEvents() {
        const sliders = this.container.querySelectorAll('.volume-slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const soundName = e.target.getAttribute('data-sound');
                const volume = parseInt(e.target.value);
                this.updateSoundVolume(soundName, volume);
            });
        });
        
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        const statusEl = this.container.querySelector('#audio-status');
        if (statusEl) {
            statusEl.style.display = 'block';
        }
        
        try {
            // Ensure Tauri is ready before loading audio files
            await this.waitForTauri();
            console.log('Initializing HTML5 Audio system...');
            
            // Initialize sound placeholders (no file loading yet)
            Object.entries(this.soundConfigs).forEach(([name, config]) => {
                this.sounds[name] = {
                    audioElements: [],
                    availableFiles: [],
                    currentIndex: 0,
                    isPlaying: false,
                    config: config,
                    loaded: false,
                    volume: 0,
                    rotationTimeout: null
                };
            });
            
            this.isInitialized = true;
            if (statusEl) {
                statusEl.textContent = 'Ambient sounds ready';
                setTimeout(() => {
                    statusEl.style.display = 'none';
                }, 2000);
            }
            
            console.log('HTML5 ambient sounds system initialized');
            
            // Expose to parent for OssC integration
            if (window.childAmbientNoise !== this) {
                window.childAmbientNoise = this;
            }
            
        } catch (error) {
            console.error('Failed to initialize ambient sounds system:', error);
            if (statusEl) {
                statusEl.textContent = 'Failed to load audio files';
                statusEl.style.color = '#e74c3c';
            }
        }
    }
    
    async createAmbientSound(config, forceRefresh = false) {
        const sound = {
            audioElements: [],  // Changed from audioBuffers to audioElements
            availableFiles: [],
            currentIndex: 0,
            isPlaying: false,
            config: config,
            loaded: false,
            volume: 0,
            rotationTimeout: null
        };
        
        try {
            sound.availableFiles = await this.scanDirectory(config.directory, forceRefresh);
            
            if (sound.availableFiles.length > 0) {
                // Filter files by format preference (MP3 first, then OGG)
                const mp3Files = sound.availableFiles.filter(file => file.toLowerCase().endsWith('.mp3'));
                const oggFiles = sound.availableFiles.filter(file => file.toLowerCase().endsWith('.ogg'));
                
                // Use MP3 files if available, otherwise use OGG
                const filesToUse = mp3Files.length > 0 ? mp3Files : oggFiles;
                
                const loadPromises = filesToUse.map(async (file) => {
                    try {
                        console.log(`Loading HTML5 audio: ${file}`);
                        
                        const audio = new Audio();
                        audio.crossOrigin = 'anonymous';
                        audio.preload = 'none';
                        audio.loop = true;
                        audio.volume = 0; // Start muted
                        
                        // Follow Tauri docs pattern for asset loading
                        const { convertFileSrc } = window.__TAURI__.core;
                        
                        // Use the absolute file path directly (it's already correct from Rust)
                        const assetUrl = convertFileSrc(file);
                        
                        console.log(`Original path: ${file}`);
                        console.log(`Asset URL: ${assetUrl}`);
                        
                        // Set type based on file extension
                        const ext = file.toLowerCase().split('.').pop();
                        if (ext === 'mp3') audio.type = 'audio/mpeg';
                        else if (ext === 'ogg') audio.type = 'audio/ogg';
                        else if (ext === 'm4a') audio.type = 'audio/mp4';
                        
                        audio.src = assetUrl;
                        audio.load(); // Explicit load call as per Tauri docs
                        
                        // Wait for the audio to be ready
                        await new Promise((resolve, reject) => {
                            audio.addEventListener('canplaythrough', resolve);
                            audio.addEventListener('error', (e) => {
                                const error = audio.error;
                                let errorMessage = 'Unknown audio error';
                                if (error) {
                                    switch(error.code) {
                                        case error.MEDIA_ERR_ABORTED:
                                            errorMessage = 'Audio loading aborted';
                                            break;
                                        case error.MEDIA_ERR_NETWORK:
                                            errorMessage = 'Network error while loading audio';
                                            break;
                                        case error.MEDIA_ERR_DECODE:
                                            errorMessage = 'Audio decoding error';
                                            break;
                                        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                                            errorMessage = 'Audio format not supported';
                                            break;
                                    }
                                }
                                reject(new Error(`${errorMessage} (code: ${error?.code})`));
                            });
                            
                            // Timeout after 10 seconds
                            setTimeout(() => reject(new Error('Audio load timeout')), 10000);
                        });
                        
                        console.log(`Successfully loaded ${file}`);
                        return { file, audio };
                    } catch (error) {
                        console.error(`Failed to load ${file}:`, error.message);
                        return null;
                    }
                });
                
                const results = await Promise.all(loadPromises);
                sound.audioElements = results.filter(result => result !== null);
                sound.loaded = sound.audioElements.length > 0;
            }
        } catch (error) {
            console.warn(`Failed to load sounds for ${config.displayName}:`, error);
        }
        
        return sound;
    }
    
    startSound(soundName) {
        console.log(`🔊 Starting sound: ${soundName}`);
        
        if (!this.sounds[soundName]) {
            console.log(`❌ Sound ${soundName} not found`);
            return;
        }
        
        const sound = this.sounds[soundName];
        
        if (sound.isPlaying) {
            console.log(`⚠️ Sound ${soundName} already playing`);
            return;
        }
        
        if (!sound.loaded) {
            console.log(`❌ Sound ${soundName} not loaded`);
            return;
        }
        
        if (sound.audioElements.length === 0) {
            console.log(`❌ No audio elements available for ${soundName}`);
            return;
        }
        
        // Select random audio element from available options
        const randomIndex = Math.floor(Math.random() * sound.audioElements.length);
        const selectedElement = sound.audioElements[randomIndex];
        
        console.log(`🎵 Playing ${soundName} file ${randomIndex}: ${selectedElement.file}`);
        
        selectedElement.audio.currentTime = 0;
        selectedElement.audio.volume = sound.volume;
        selectedElement.audio.play();
        
        // Set up rotation to next file after a random duration (3-8 minutes)
        const rotationTime = (3 + Math.random() * 5) * 60 * 1000; // 3-8 minutes
        sound.rotationTimeout = setTimeout(() => {
            if (sound.isPlaying) {
                this.rotateSound(soundName);
            }
        }, rotationTime);
        
        sound.isPlaying = true;
        sound.currentIndex = randomIndex;
    }
    
    rotateSound(soundName) {
        const sound = this.sounds[soundName];
        if (!sound.isPlaying || sound.audioElements.length <= 1) return;
        
        const currentElement = sound.audioElements[sound.currentIndex];
        const currentVolume = sound.volume;
        
        // Fade out current sound
        const fadeOutInterval = setInterval(() => {
            if (currentElement.audio.volume > 0.1) {
                currentElement.audio.volume -= 0.1;
            } else {
                clearInterval(fadeOutInterval);
                currentElement.audio.pause();
                currentElement.audio.currentTime = 0;
                
                // Start new random sound
                const availableIndices = sound.audioElements
                    .map((_, index) => index)
                    .filter(index => index !== sound.currentIndex);
                
                if (availableIndices.length > 0) {
                    const nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                    const nextElement = sound.audioElements[nextIndex];
                    
                    sound.currentIndex = nextIndex;
                    nextElement.audio.volume = 0;
                    nextElement.audio.currentTime = 0;
                    nextElement.audio.play();
                    
                    // Fade in new sound
                    const fadeInInterval = setInterval(() => {
                        if (nextElement.audio.volume < currentVolume) {
                            nextElement.audio.volume = Math.min(currentVolume, nextElement.audio.volume + 0.1);
                        } else {
                            clearInterval(fadeInInterval);
                        }
                    }, 200);
                    
                    // Set up next rotation
                    const rotationTime = (3 + Math.random() * 5) * 60 * 1000;
                    sound.rotationTimeout = setTimeout(() => {
                        if (sound.isPlaying) {
                            this.rotateSound(soundName);
                        }
                    }, rotationTime);
                }
            }
        }, 200);
    }
    
    stopSound(soundName) {
        if (!this.sounds[soundName]) return;
        
        const sound = this.sounds[soundName];
        if (sound.isPlaying) {
            // Stop current playing audio element
            if (sound.audioElements[sound.currentIndex]) {
                sound.audioElements[sound.currentIndex].audio.pause();
                sound.audioElements[sound.currentIndex].audio.currentTime = 0;
            }
            sound.isPlaying = false;
        }
        
        // Clear rotation timeout
        if (sound.rotationTimeout) {
            clearTimeout(sound.rotationTimeout);
            sound.rotationTimeout = null;
        }
    }
    
    async setVolume(soundName, volume) {
        if (!this.sounds[soundName]) return;
        
        const sound = this.sounds[soundName];
        const normalizedVolume = (volume / 100) * sound.config.baseGain;
        sound.volume = normalizedVolume;
        
        // Lazy load audio files only when volume > 0 and not loaded yet
        if (volume > 0 && !sound.loaded) {
            console.log(`Lazy loading audio for ${soundName}...`);
            try {
                const loadedSound = await this.createAmbientSound(sound.config);
                // Copy loaded data back to existing sound object
                sound.audioElements = loadedSound.audioElements;
                sound.availableFiles = loadedSound.availableFiles;
                sound.loaded = loadedSound.loaded;
            } catch (error) {
                console.error(`Failed to lazy load ${soundName}:`, error);
                return;
            }
        }
        
        if (volume > 0 && !sound.isPlaying && sound.loaded) {
            this.startSound(soundName);
        }
        
        // Apply volume to currently playing audio element
        if (sound.isPlaying && sound.audioElements[sound.currentIndex]) {
            sound.audioElements[sound.currentIndex].audio.volume = normalizedVolume;
        }
        
        if (volume === 0 && sound.isPlaying) {
            this.stopSound(soundName);
        }
    }
    
    async updateSoundVolume(soundName, volume) {
        if (!this.isInitialized) {
            // Only initialize the audio context, not reload sounds
            await this.initialize();
        }
        await this.setVolume(soundName, volume);
        
        const slider = this.container.querySelector(`[data-sound="${soundName}"]`);
        if (slider) {
            const scale = 1 + (volume / 100) * 0.5;
            slider.style.setProperty('--thumb-scale', scale);
        }
    }
    
    // Initialize just the audio context (separate from full initialization)
    // NOTE: HTML5 Audio doesn't need Web Audio Context, but keeping for compatibility
    async initializeAudioContext() {
        console.log('HTML5 Audio - no audio context needed');
        // HTML5 Audio elements manage their own audio context
        return;
    }
    
    // Refresh audio cache - rescan all directories
    async refreshAudioCache() {
        try {
            Object.keys(this.sounds).forEach(soundName => {
                this.stopSound(soundName);
            });
            
            this.directoryCache.clear();
            await this.discoverAudioDirectories();
            this.render();
            this.bindEvents();
            
            const soundPromises = Object.entries(this.soundConfigs).map(async ([name, config]) => {
                this.sounds[name] = await this.createAmbientSound(config, true);
            });
            
            await Promise.all(soundPromises);
        } catch (error) {
            console.error('Failed to refresh audio cache:', error);
        }
    }
    
    // Get combined audio data for oscilloscope visualization
    getCombinedAudioData() {
        const combinedData = new Uint8Array(256);
        let hasActiveSound = false;
        const time = Date.now() * 0.001;
        
        for (const [name, sound] of Object.entries(this.sounds)) {
            if (sound.isPlaying && sound.gainNode.gain.value > 0) {
                hasActiveSound = true;
                const volume = sound.gainNode.gain.value * 255;
                
                // Generate visualization data based on playing ambient sounds
                for (let i = 0; i < combinedData.length; i++) {
                    const freq = (i / combinedData.length) * 10;
                    // Create smooth, ambient-like waveforms
                    const amplitude = volume * (0.6 + 0.4 * Math.sin(freq * 2 + time * 0.8)) * 
                                    (0.8 + 0.3 * Math.sin(freq * 0.5 + time * 0.3));
                    
                    combinedData[i] = Math.min(255, combinedData[i] + amplitude * (0.7 + 0.3 * Math.random()));
                }
            }
        }
        
        return hasActiveSound ? combinedData : null;
    }
    
    // Cleanup method for when tool is unloaded
    destroy() {
        // Stop all sounds and clear timeouts
        Object.keys(this.sounds).forEach(soundName => {
            this.stopSound(soundName);
        });
        
        // Close audio context if we created it
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        // Clear DOM
        this.container.innerHTML = '';
        
        // Remove from parent reference
        if (window.childAmbientNoise === this) {
            window.childAmbientNoise = null;
        }
    }
}
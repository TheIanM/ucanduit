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
        const cacheKey = directory;
        if (!forceRefresh && this.directoryCache.has(cacheKey)) {
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
        statusEl.style.display = 'block';
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            
            // Pre-load all audio files
            const soundPromises = Object.entries(this.soundConfigs).map(async ([name, config]) => {
                this.sounds[name] = await this.createAmbientSound(config);
            });
            
            await Promise.all(soundPromises);
            
            this.isInitialized = true;
            statusEl.textContent = 'Ambient sounds ready';
            setTimeout(() => {
                statusEl.style.display = 'none';
            }, 2000);
            
            console.log('Ambient sounds system initialized');
            
            // Expose to parent for OssC integration
            if (window.childAmbientNoise !== this) {
                window.childAmbientNoise = this;
            }
            
        } catch (error) {
            console.error('Failed to initialize ambient sounds system:', error);
            statusEl.textContent = 'Failed to load audio files';
            statusEl.style.color = '#e74c3c';
        }
    }
    
    async createAmbientSound(config, forceRefresh = false) {
        const sound = {
            source: null,
            audioBuffers: [],
            availableFiles: [],
            currentBufferIndex: 0,
            gainNode: null,
            isPlaying: false,
            config: config,
            loaded: false
        };
        
        try {
            sound.availableFiles = await this.scanDirectory(config.directory, forceRefresh);
            
            if (sound.availableFiles.length > 0) {
                const loadPromises = sound.availableFiles.map(async (file) => {
                    try {
                        console.log(`Loading audio file: ${file}`);
                        const response = await fetch(file, {
                            headers: {
                                'Accept': 'audio/*,*/*'
                            }
                        });
                        
                        if (response.ok) {
                            const contentType = response.headers.get('content-type');
                            console.log(`Content-Type for ${file}: ${contentType}`);
                            
                            const arrayBuffer = await response.arrayBuffer();
                            console.log(`ArrayBuffer size for ${file}: ${arrayBuffer.byteLength} bytes`);
                            
                            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                            console.log(`Successfully decoded ${file}`);
                            return { file, audioBuffer };
                        } else {
                            console.error(`HTTP error for ${file}: ${response.status} ${response.statusText}`);
                        }
                        return null;
                    } catch (error) {
                        console.error(`Failed to load ${file}:`, error.name, error.message);
                        return null;
                    }
                });
                
                const results = await Promise.all(loadPromises);
                sound.audioBuffers = results.filter(result => result !== null);
                sound.loaded = sound.audioBuffers.length > 0;
            }
        } catch (error) {
            console.warn(`Failed to load sounds for ${config.displayName}:`, error);
        }
        
        sound.gainNode = this.audioContext.createGain();
        sound.gainNode.gain.value = 0;
        sound.gainNode.connect(this.masterGain);
        
        return sound;
    }
    
    startSound(soundName) {
        console.log(`🔊 Starting sound: ${soundName}`);
        
        if (!this.isInitialized) {
            console.log(`❌ Audio context not initialized for ${soundName}`);
            return;
        }
        
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
        
        if (sound.audioBuffers.length === 0) {
            console.log(`❌ No audio buffers available for ${soundName}`);
            return;
        }
        
        // Select random audio buffer from available options
        const randomIndex = Math.floor(Math.random() * sound.audioBuffers.length);
        const selectedBuffer = sound.audioBuffers[randomIndex].audioBuffer;
        
        console.log(`🎵 Playing ${soundName} buffer ${randomIndex}: ${sound.audioBuffers[randomIndex].file}`);
        
        sound.source = this.audioContext.createBufferSource();
        sound.source.buffer = selectedBuffer;
        sound.source.loop = true;
        sound.source.connect(sound.gainNode);
        
        // Set up rotation to next file when this one would naturally end
        // But since it's looping, we'll rotate after a random duration (3-8 minutes)
        const rotationTime = (3 + Math.random() * 5) * 60 * 1000; // 3-8 minutes
        sound.rotationTimeout = setTimeout(() => {
            if (sound.isPlaying) {
                this.rotateSound(soundName);
            }
        }, rotationTime);
        
        sound.source.start();
        sound.isPlaying = true;
        sound.currentBufferIndex = randomIndex;
    }
    
    rotateSound(soundName) {
        const sound = this.sounds[soundName];
        if (!sound.isPlaying || sound.audioBuffers.length <= 1) return;
        
        const currentVolume = sound.gainNode.gain.value;
        
        // Fade out current sound
        sound.gainNode.gain.setValueAtTime(currentVolume, this.audioContext.currentTime);
        sound.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
        
        // Stop current sound after fade
        setTimeout(() => {
            if (sound.source) {
                sound.source.stop();
                sound.source = null;
            }
            
            // Start new random sound
            const availableIndices = sound.audioBuffers
                .map((_, index) => index)
                .filter(index => index !== sound.currentBufferIndex);
            
            if (availableIndices.length > 0) {
                const nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                const nextBuffer = sound.audioBuffers[nextIndex].audioBuffer;
                
                sound.source = this.audioContext.createBufferSource();
                sound.source.buffer = nextBuffer;
                sound.source.loop = true;
                sound.source.connect(sound.gainNode);
                sound.source.start();
                sound.currentBufferIndex = nextIndex;
                
                // Fade in new sound
                sound.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                sound.gainNode.gain.linearRampToValueAtTime(currentVolume, this.audioContext.currentTime + 2);
                
                // Set up next rotation
                const rotationTime = (3 + Math.random() * 5) * 60 * 1000;
                sound.rotationTimeout = setTimeout(() => {
                    if (sound.isPlaying) {
                        this.rotateSound(soundName);
                    }
                }, rotationTime);
            }
        }, 2000);
    }
    
    stopSound(soundName) {
        if (!this.sounds[soundName]) return;
        
        const sound = this.sounds[soundName];
        if (sound.source && sound.isPlaying) {
            sound.source.stop();
            sound.source = null;
            sound.isPlaying = false;
        }
        
        // Clear rotation timeout
        if (sound.rotationTimeout) {
            clearTimeout(sound.rotationTimeout);
            sound.rotationTimeout = null;
        }
    }
    
    setVolume(soundName, volume) {
        if (!this.sounds[soundName]) return;
        
        const sound = this.sounds[soundName];
        const normalizedVolume = (volume / 100) * sound.config.baseGain;
        
        if (volume > 0 && !sound.isPlaying && sound.loaded) {
            this.startSound(soundName);
        }
        
        if (sound.gainNode) {
            sound.gainNode.gain.setValueAtTime(normalizedVolume, this.audioContext.currentTime);
        }
        
        if (volume === 0 && sound.isPlaying) {
            this.stopSound(soundName);
        }
    }
    
    async updateSoundVolume(soundName, volume) {
        if (!this.isInitialized) {
            // Only initialize the audio context, not reload sounds
            await this.initializeAudioContext();
        }
        this.setVolume(soundName, volume);
        
        const slider = this.container.querySelector(`[data-sound="${soundName}"]`);
        if (slider) {
            const scale = 1 + (volume / 100) * 0.5;
            slider.style.setProperty('--thumb-scale', scale);
        }
    }
    
    // Initialize just the audio context (separate from full initialization)
    async initializeAudioContext() {
        if (this.audioContext) return; // Already initialized
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            
            console.log('Audio context initialized');
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
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
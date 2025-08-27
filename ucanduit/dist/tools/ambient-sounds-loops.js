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
        
        // Audio loop configurations - you can add your audio files here
        this.soundConfigs = {
            rain: { 
                file: 'audio/rain.mp3', 
                baseGain: 0.6,
                displayName: 'Rain'
            },
            ocean: { 
                file: 'audio/ocean.mp3', 
                baseGain: 0.5,
                displayName: 'Ocean Waves'
            },
            forest: { 
                file: 'audio/forest.mp3', 
                baseGain: 0.4,
                displayName: 'Forest'
            },
            cafe: { 
                file: 'audio/cafe.mp3', 
                baseGain: 0.3,
                displayName: 'Coffee Shop'
            },
            fireplace: { 
                file: 'audio/fireplace.mp3', 
                baseGain: 0.5,
                displayName: 'Fireplace'
            },
            thunderstorm: { 
                file: 'audio/thunderstorm.mp3', 
                baseGain: 0.4,
                displayName: 'Thunderstorm'
            }
        };
        
        this.render();
        this.bindEvents();
    }
    
    render() {
        const soundItems = Object.entries(this.soundConfigs).map(([key, config]) => `
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
            
        } catch (error) {
            console.error('Failed to initialize ambient sounds system:', error);
            statusEl.textContent = 'Failed to load audio files';
            statusEl.style.color = '#e74c3c';
        }
    }
    
    async createAmbientSound(config) {
        const sound = {
            source: null,
            audioBuffer: null,
            gainNode: null,
            isPlaying: false,
            config: config,
            loaded: false
        };
        
        try {
            const response = await fetch(config.file);
            if (response.ok) {
                const arrayBuffer = await response.arrayBuffer();
                sound.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                sound.loaded = true;
                console.log(`Loaded audio file: ${config.file}`);
            } else {
                console.warn(`Audio file not found: ${config.file}`);
            }
        } catch (error) {
            console.warn(`Failed to load ${config.file}:`, error.message);
        }
        
        sound.gainNode = this.audioContext.createGain();
        sound.gainNode.gain.value = 0;
        sound.gainNode.connect(this.masterGain);
        
        return sound;
    }
    
    startSound(soundName) {
        if (!this.isInitialized || !this.sounds[soundName]) return;
        
        const sound = this.sounds[soundName];
        if (sound.isPlaying || !sound.loaded) return;
        
        sound.source = this.audioContext.createBufferSource();
        sound.source.buffer = sound.audioBuffer;
        sound.source.loop = true;
        sound.source.connect(sound.gainNode);
        sound.source.start();
        sound.isPlaying = true;
    }
    
    stopSound(soundName) {
        if (!this.sounds[soundName]) return;
        
        const sound = this.sounds[soundName];
        if (sound.source && sound.isPlaying) {
            sound.source.stop();
            sound.source = null;
            sound.isPlaying = false;
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
            await this.initialize();
        }
        this.setVolume(soundName, volume);
        
        const slider = this.container.querySelector(`[data-sound="${soundName}"]`);
        if (slider) {
            const scale = 1 + (volume / 100) * 0.5;
            slider.style.setProperty('--thumb-scale', scale);
        }
    }
    
    // Cleanup method for when tool is unloaded
    destroy() {
        // Stop all sounds
        Object.keys(this.sounds).forEach(soundName => {
            this.stopSound(soundName);
        });
        
        // Close audio context if we created it
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        
        // Clear DOM
        this.container.innerHTML = '';
    }
}
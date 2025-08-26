/**
 * Timer Tool - ES6 Module
 * Handles countdown timer functionality with visual feedback
 */

export class TimerTool {
    constructor(container) {
        this.container = container;
        this.totalSeconds = 25 * 60; // Default 25 minutes
        this.remainingSeconds = this.totalSeconds;
        this.isRunning = false;
        this.intervalId = null;
        this.displayElement = null;
        
        this.render();
        this.bindEvents();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="timer-controls" style="text-align: center;">
                <div class="timer-display" id="timer-display-${this.id}" style="
                    font-size: 24px;
                    font-weight: 700;
                    color: #2a2d34;
                    margin-bottom: 10px;
                    font-family: 'Quicksand', monospace;
                ">${this.formatTime(this.remainingSeconds)}</div>
                <div class="timer-buttons" style="
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    justify-content: center;
                    flex-wrap: wrap;
                ">
                    <button class="timer-start-btn" style="
                        background: white;
                        color: #2a2d34;
                        border: 3px solid #2a2d34;
                        padding: 10px 20px;
                        border-radius: 20px;
                        margin: 5px;
                        cursor: pointer;
                        font-weight: 700;
                        font-family: 'Quicksand', sans-serif;
                        transition: all 0.2s ease;
                    ">Start</button>
                    <button class="timer-pause-btn" style="
                        background: white;
                        color: #2a2d34;
                        border: 3px solid #2a2d34;
                        padding: 10px 20px;
                        border-radius: 20px;
                        margin: 5px;
                        cursor: pointer;
                        font-weight: 700;
                        font-family: 'Quicksand', sans-serif;
                        transition: all 0.2s ease;
                    ">Pause</button>
                    <button class="timer-reset-btn" style="
                        background: white;
                        color: #2a2d34;
                        border: 3px solid #2a2d34;
                        padding: 10px 20px;
                        border-radius: 20px;
                        margin: 5px;
                        cursor: pointer;
                        font-weight: 700;
                        font-family: 'Quicksand', sans-serif;
                        transition: all 0.2s ease;
                    ">Reset</button>
                    <input type="number" class="timer-minutes-input" min="1" max="120" value="25" 
                           placeholder="min" style="
                        width: 60px;
                        padding: 5px;
                        border: 2px solid #2a2d34;
                        border-radius: 8px;
                        background: #F5F5F5;
                        font-family: 'Quicksand', sans-serif;
                        font-weight: 600;
                        text-align: center;
                    ">
                </div>
            </div>
            
            <style>
                .timer-controls button:hover {
                    background: #2a2d34 !important;
                    color: white !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }
                
                /* Responsive styles for compact mode */
                @media (max-height: 250px) {
                    .timer-controls {
                        display: flex !important;
                        align-items: center !important;
                        gap: 10px !important;
                    }
                    .timer-display { 
                        font-size: 12px !important; 
                        margin: 0 !important;
                        min-width: 50px !important;
                        flex-shrink: 0 !important;
                    }
                    .timer-buttons { 
                        display: flex !important;
                        flex-direction: row !important;
                        gap: 4px !important; 
                        flex-wrap: wrap !important;
                        align-items: center !important;
                    }
                    .timer-buttons button { 
                        padding: 3px 6px !important; 
                        font-size: 9px !important; 
                        white-space: nowrap !important;
                    }
                    .timer-minutes-input { 
                        width: 45px !important; 
                        font-size: 9px !important; 
                        padding: 2px !important; 
                    }
                }
                
                @media (max-width: 250px) {
                    .timer-display { font-size: 12px !important; margin-bottom: 3px !important; }
                    .timer-buttons { flex-direction: column !important; gap: 2px !important; }
                    .timer-buttons button { width: 95% !important; margin: 1px auto !important; padding: 4px !important; font-size: 10px !important; }
                    .timer-minutes-input { width: 95% !important; margin: 1px auto !important; font-size: 10px !important; padding: 2px !important; }
                }
            </style>
        `;
        
        this.displayElement = this.container.querySelector('.timer-display');
        this.id = Math.random().toString(36).substr(2, 9); // Unique ID for this instance
    }
    
    bindEvents() {
        const startBtn = this.container.querySelector('.timer-start-btn');
        const pauseBtn = this.container.querySelector('.timer-pause-btn');
        const resetBtn = this.container.querySelector('.timer-reset-btn');
        const minutesInput = this.container.querySelector('.timer-minutes-input');
        
        startBtn.addEventListener('click', () => this.start());
        pauseBtn.addEventListener('click', () => this.pause());
        resetBtn.addEventListener('click', () => this.reset());
        minutesInput.addEventListener('change', (e) => this.setDuration(parseInt(e.target.value)));
    }
    
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    updateDisplay() {
        if (this.displayElement) {
            this.displayElement.textContent = this.formatTime(this.remainingSeconds);
        }
        
        // Notify parent window of timer updates for OssC integration
        if (window.timerUpdate) {
            const progress = 1 - (this.remainingSeconds / this.totalSeconds);
            window.timerUpdate(progress, this.isRunning);
        }
    }
    
    start() {
        if (this.isRunning || this.remainingSeconds === 0) return;
        
        this.isRunning = true;
        this.intervalId = setInterval(() => {
            this.remainingSeconds--;
            this.updateDisplay();
            
            if (this.remainingSeconds === 0) {
                this.complete();
            }
        }, 1000);
        
        // Update parent status
        if (window.updateStatus) {
            window.updateStatus('Timer Running', 'warning');
        }
    }
    
    pause() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // Update parent status
        if (window.updateStatus) {
            window.updateStatus('Timer Paused', 'accent');
        }
    }
    
    reset() {
        this.pause();
        this.remainingSeconds = this.totalSeconds;
        this.updateDisplay();
        
        // Update parent status
        if (window.updateStatus) {
            window.updateStatus('Timer Ready', 'success');
        }
    }
    
    setDuration(minutes) {
        const mins = Math.max(1, Math.min(120, minutes || 25));
        this.pause();
        this.totalSeconds = mins * 60;
        this.remainingSeconds = this.totalSeconds;
        this.updateDisplay();
        
        // Update the input field to reflect the clamped value
        const input = this.container.querySelector('.timer-minutes-input');
        if (input) {
            input.value = mins;
        }
    }
    
    complete() {
        this.isRunning = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        // Update parent status
        if (window.updateStatus) {
            window.updateStatus('Timer Complete!', 'success');
        }
        
        // Play completion sound
        this.playCompletionSound();
        
        // Notify parent of completion for OssC animation
        if (window.timerComplete) {
            window.timerComplete();
        }
        
        // Auto-reset after a few seconds
        setTimeout(() => {
            this.reset();
        }, 3000);
    }
    
    playCompletionSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Could not play completion sound:', error);
        }
    }
    
    // Cleanup method for when tool is unloaded
    destroy() {
        this.pause(); // Stop any running timers
        this.container.innerHTML = ''; // Clear DOM
        
        // Reset parent status
        if (window.updateStatus) {
            window.updateStatus('Assistant Ready', 'success');
        }
    }
}
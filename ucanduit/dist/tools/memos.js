/**
 * Memos Tool - ES6 Module
 * Handles note-taking with rich text formatting and link detection
 * Future: Will include clipboard history functionality
 */

import { ToolBase } from './tool-base.js';

export class MemosTool extends ToolBase {
    constructor(container) {
        super(container);
        
        this.memos = {}; // Store multiple memos
        this.currentMemoId = null; // Currently active memo
        this.autoSaveTimeout = null;
        this.autoSaveDelay = 1000; // 1 second auto-save delay
        
        // Load memo-specific CSS
        this.loadMemosCSS();
    }
    
    // Override base class init to load memos before rendering
    async init() {
        await this.loadFromStorage();
        await super.init(); // This will call render() and bindEvents()
    }
    
    loadMemosCSS() {
        if (!document.querySelector('link[href*="memos.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = './tools/memos.css';
            document.head.appendChild(link);
        }
    }
    
    // Storage methods adapted from todo list pattern
    async loadFromStorage() {
        try {
            // First try to load from external file using Tauri
            if (window.__TAURI__ && window.__TAURI__.core) {
                const fileData = await window.__TAURI__.core.invoke('read_json_file', {
                    filename: 'ucanduit-memos.json'
                });
                if (fileData) {
                    this.memos = fileData;
                    console.log('✅ Memos loaded from external file');
                    return;
                }
            }
        } catch (error) {
            console.log('📁 No external memos file found, checking localStorage...');
        }
        
        try {
            // Fallback to localStorage
            const storedMemos = localStorage.getItem('ucanduit_memostool_memos');
            if (storedMemos) {
                this.memos = JSON.parse(storedMemos);
                console.log('✅ Memos loaded from localStorage');
                
                // If we have Tauri, migrate to external file
                if (window.__TAURI__ && window.__TAURI__.core) {
                    await this.saveToStorage();
                    console.log('🔄 Migrated memos from localStorage to external file');
                }
            } else {
                // Check old single memo storage for migration
                const oldMemo = localStorage.getItem('ucanduit_memostool_memoContent');
                if (oldMemo) {
                    const content = JSON.parse(oldMemo);
                    if (content.trim()) {
                        // Migrate old memo
                        const memoId = this.generateId();
                        this.memos[memoId] = this.createMemo('Migrated Note', content);
                        await this.saveToStorage();
                        localStorage.removeItem('ucanduit_memostool_memoContent');
                        console.log('🔄 Migrated old memo to new format');
                    }
                }
            }
        } catch (error) {
            console.error('❌ Failed to load memos:', error);
            this.memos = {};
        }
    }
    
    async saveToStorage() {
        try {
            // First try to save to external file using Tauri
            if (window.__TAURI__ && window.__TAURI__.core) {
                await window.__TAURI__.core.invoke('write_json_file', {
                    filename: 'ucanduit-memos.json',
                    data: this.memos
                });
                console.log('✅ Memos saved to external file');
            } else {
                // Fallback to localStorage if Tauri not available
                localStorage.setItem('ucanduit_memostool_memos', JSON.stringify(this.memos));
                console.log('✅ Memos saved to localStorage');
            }
        } catch (error) {
            console.error('❌ Failed to save memos:', error);
        }
    }
    
    generateId() {
        return 'memo_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    }
    
    createMemo(title, content) {
        const now = new Date();
        return {
            id: this.generateId(),
            title: title || this.generateTitle(content),
            content: content,
            preview: this.generatePreview(content),
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
            date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        };
    }
    
    generateTitle(content) {
        if (!content || !content.trim()) return 'Untitled Note';
        
        // Try to use first line as title
        const firstLine = content.trim().split('\n')[0];
        if (firstLine.length > 0) {
            // Remove markdown formatting for title
            let title = firstLine.replace(/[*_`#]/g, '').trim();
            if (title.length > 50) {
                title = title.substring(0, 50) + '...';
            }
            return title || 'Untitled Note';
        }
        
        // Fallback to first few words
        const words = content.trim().split(/\s+/);
        return words.slice(0, 8).join(' ') + (words.length > 8 ? '...' : '');
    }
    
    generatePreview(content) {
        if (!content || !content.trim()) return '';
        
        // Remove markdown formatting and get preview
        const cleaned = content.replace(/[*_`#]/g, '').replace(/\n/g, ' ').trim();
        return cleaned.substring(0, 80) + (cleaned.length > 80 ? '...' : '');
    }
    
    getRecentMemos(limit = 3) {
        if (!this.memos) return [];
        return Object.values(this.memos)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, limit);
    }

    async render() {
        // Get recent memos for display
        const recentMemos = this.getRecentMemos(3);
        
        this.container.innerHTML = `
            <div class="tool-container">
                <div class="tool-content">
                    <!-- Quick input for new note -->
                    <div class="memo-quick-input" style="margin-bottom: 12px;">
                        <input type="text" 
                               class="tool-input" 
                               id="quick-note-input-${this.id}"
                               placeholder="Quick note... (press Enter to save)"
                               style="font-size: 12px; padding: 6px 8px;">
                    </div>
                    
                    <!-- Recent notes -->
                    <div class="recent-notes" style="margin-bottom: 12px;">
                        ${recentMemos.length > 0 ? `
                            <div style="font-size: 10px; color: #666; margin-bottom: 6px; font-weight: 600;">
                                RECENT NOTES:
                            </div>
                            ${recentMemos.map(memo => `
                                <div class="recent-note-item" 
                                     data-memo-id="${memo.id}"
                                     style="
                                    background: rgba(42, 45, 52, 0.03);
                                    border-radius: 4px;
                                    padding: 6px 8px;
                                    margin-bottom: 4px;
                                    border-left: 2px solid #4ecf9d;
                                    cursor: pointer;
                                    font-size: 11px;
                                    line-height: 1.3;
                                    transition: background-color 0.2s ease;
                                " onmouseover="this.style.backgroundColor='rgba(42, 45, 52, 0.08)'" 
                                   onmouseout="this.style.backgroundColor='rgba(42, 45, 52, 0.03)'">
                                    <div style="font-weight: 600; color: #333;">${this.escapeHtml(memo.title)}</div>
                                    <div style="color: #666; font-size: 10px;">${memo.date} • ${this.escapeHtml(memo.preview)}</div>
                                </div>
                            `).join('')}
                        ` : `
                            <div style="
                                font-size: 11px;
                                color: #888;
                                font-style: italic;
                                text-align: center;
                                padding: 8px;
                            ">
                                No recent notes yet
                            </div>
                        `}
                    </div>
                    
                    <!-- Compact launch button -->
                    <button class="tool-btn secondary" id="open-memo-window-${this.id}" style="
                        font-size: 11px;
                        padding: 5px 10px;
                        width: 100%;
                    ">
                        🪟 Open Writing Window
                    </button>
                </div>
            </div>
        `;
    }
    
    bindEvents() {
        const openWindowBtn = this.find(`#open-memo-window-${this.id}`);
        const quickInput = this.find(`#quick-note-input-${this.id}`);
        const recentNoteItems = this.findAll('.recent-note-item');
        
        // Bind memo window launcher
        if (openWindowBtn) {
            openWindowBtn.addEventListener('click', () => {
                this.openMemoWindow();
            });
        }
        
        // Bind quick note input
        if (quickInput) {
            quickInput.addEventListener('keypress', async (e) => {
                if (e.key === 'Enter' && quickInput.value.trim()) {
                    await this.createQuickNote(quickInput.value.trim());
                    quickInput.value = '';
                    this.render(); // Refresh to show new note
                }
            });
        }
        
        // Bind recent note clicks
        recentNoteItems.forEach(item => {
            item.addEventListener('click', () => {
                const memoId = item.getAttribute('data-memo-id');
                this.loadMemoToWindow(memoId);
            });
        });
    }
    
    async openMemoWindow() {
        try {
            if (!window.__TAURI__) {
                // Browser fallback - open in new tab
                window.open('./memo-window.html', '_blank', 'width=600,height=500');
                this.updateStatus('Opened memo window (browser mode)', 'primary', 2000);
                return;
            }

            // Use the same pattern as splash.html
            if (window.__TAURI__.webview && window.__TAURI__.webviewWindow) {
                const { webviewWindow } = window.__TAURI__;
                
                // Check if memo window already exists (simplified - just try to create it)
                // If it exists, Tauri will handle focusing it
                
                // Create memo window using the same pattern as splash.html
                const memoWindow = new webviewWindow.WebviewWindow('memo-window', {
                    url: 'memo-window.html',
                    title: 'Quick Memos - ucanduit',
                    width: 600,
                    height: 500,
                    alwaysOnTop: false,
                    decorations: true,
                    transparent: false
                });

                // Handle window events (same as splash.html)
                memoWindow.once('tauri://created', () => {
                    console.log('Memo window created successfully');
                    this.updateStatus('Memo window opened', 'success', 2000);
                });

                memoWindow.once('tauri://error', (error) => {
                    console.error('Memo window creation error:', error);
                    this.updateStatus('Failed to open memo window', 'danger', 3000);
                });
                
            } else {
                throw new Error('webviewWindow API not available');
            }

        } catch (error) {
            console.error('Error opening memo window:', error);
            this.updateStatus('Error: ' + error.message, 'danger', 3000);
            
            // Fallback: open in browser tab
            window.open('./memo-window.html', '_blank', 'width=600,height=500');
        }
    }
    
    async createQuickNote(content) {
        const memoId = this.generateId();
        this.memos[memoId] = this.createMemo(null, content);
        await this.saveToStorage();
        this.updateStatus(`Quick note saved: "${this.memos[memoId].title}"`, 'success', 2000);
    }
    
    loadMemoToWindow(memoId) {
        // Set current memo and open window
        this.currentMemoId = memoId;
        this.openMemoWindow();
        this.updateStatus(`Loading: "${this.memos[memoId].title}"`, 'primary', 1500);
    }
    
    // Method to get current memo content for the window
    getCurrentMemoContent() {
        if (this.currentMemoId && this.memos[this.currentMemoId]) {
            return this.memos[this.currentMemoId].content;
        }
        return '';
    }
    
    // Method to update memo content from the window
    async updateMemoContent(content) {
        if (this.currentMemoId && this.memos[this.currentMemoId]) {
            // Update existing memo
            this.memos[this.currentMemoId].content = content;
            this.memos[this.currentMemoId].title = this.generateTitle(content);
            this.memos[this.currentMemoId].preview = this.generatePreview(content);
            this.memos[this.currentMemoId].updatedAt = new Date().toISOString();
        } else {
            // Create new memo
            const memoId = this.generateId();
            this.currentMemoId = memoId;
            this.memos[memoId] = this.createMemo(null, content);
        }
        await this.saveToStorage();
    }
    
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    onInitialized() {
        super.onInitialized();
        // Memo launcher is ready to use
    }
    
    destroy() {
        // Clean up any references
        super.destroy();
    }
}
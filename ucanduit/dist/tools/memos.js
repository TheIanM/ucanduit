/**
 * Memos Tool - ES6 Module
 * Handles note-taking with rich text formatting and link detection
 * Future: Will include clipboard history functionality
 */

import { ToolBase } from './tool-base.js';

export class MemosTool extends ToolBase {
    constructor(container) {
        super(container);
        
        this.memoContent = '';
        this.autoSaveTimeout = null;
        this.autoSaveDelay = 1000; // 1 second auto-save delay
        
        // Load memo-specific CSS
        this.loadMemosCSS();
    }
    
    loadMemosCSS() {
        if (!document.querySelector('link[href*="memos.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = './tools/memos.css';
            document.head.appendChild(link);
        }
    }
    
    async render() {
        // Load saved memo content
        this.memoContent = this.loadFromStorage('memoContent', '');
        
        this.container.innerHTML = `
            <div class="tool-container">
                <div class="tool-header">
                    <h3 class="tool-title">📝 Quick Memos</h3>
                </div>
                
                <div class="memos-container">
                    <div class="memo-pane">
                        <div class="memo-toolbar">
                            <button class="memo-format-btn" data-format="bold" title="Bold (Ctrl+B)">
                                <strong>B</strong>
                            </button>
                            <button class="memo-format-btn" data-format="italic" title="Italic (Ctrl+I)">
                                <em>I</em>
                            </button>
                            <button class="memo-format-btn" data-format="clear" title="Clear Formatting">
                                Clear
                            </button>
                            <button class="tool-btn danger" id="clear-memo-btn" title="Clear All Content">
                                🗑️ Clear All
                            </button>
                        </div>
                        
                        <textarea 
                            class="memo-editor" 
                            id="memo-editor-${this.id}"
                            placeholder="Start typing your notes here... 

Keyboard shortcuts:
• Ctrl+B for **bold**
• Ctrl+I for *italic* 
• Type URLs and they'll become clickable links
• Everything auto-saves as you type"
                            spellcheck="true"
                        >${this.escapeHtml(this.memoContent)}</textarea>
                        
                        <div class="memo-status" id="memo-status-${this.id}">
                            Ready
                        </div>
                        
                        <div class="memo-shortcuts">
                            <strong>💡 Tips:</strong> Type URLs (like google.com) and click to open them • Use Ctrl+B/I for formatting • Auto-saves every second
                        </div>
                    </div>
                    
                    <!-- Placeholder for future clipboard history -->
                    <div class="clipboard-pane" style="display: none;">
                        <h4>📋 Clipboard History</h4>
                        <div class="clipboard-history">
                            <div style="text-align: center; color: #888; padding: 20px;">
                                Coming soon...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    bindEvents() {
        const editor = this.find(`#memo-editor-${this.id}`);
        const clearBtn = this.find('#clear-memo-btn');
        const formatBtns = this.findAll('.memo-format-btn[data-format]');
        
        if (!editor) return;
        
        // Auto-save on content change
        editor.addEventListener('input', () => {
            this.scheduleAutoSave();
            this.processLinks();
        });
        
        // Handle clicks for link detection  
        editor.addEventListener('click', (e) => {
            this.handleLinkClick(e);
        });
        
        // Show link preview on hover/mouse move
        editor.addEventListener('mousemove', (e) => {
            this.handleLinkHover(e);
        });
        
        // Keyboard shortcuts
        editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.toggleFormat('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.toggleFormat('italic');
                        break;
                }
            }
        });
        
        // Format buttons
        formatBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const format = btn.getAttribute('data-format');
                if (format === 'clear') {
                    this.clearFormatting();
                } else {
                    this.toggleFormat(format);
                }
            });
        });
        
        // Clear all button
        clearBtn?.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all memo content? This cannot be undone.')) {
                this.clearAllContent();
            }
        });
        
        // Process existing links on load
        this.processLinks();
        
        // Update status
        this.updateMemoStatus('Loaded ' + this.formatContentLength());
    }
    
    scheduleAutoSave() {
        // Clear existing timeout
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        // Schedule new auto-save
        this.autoSaveTimeout = setTimeout(() => {
            this.autoSave();
        }, this.autoSaveDelay);
        
        // Update status immediately
        this.updateMemoStatus('Typing...');
    }
    
    autoSave() {
        const editor = this.find(`#memo-editor-${this.id}`);
        if (!editor) return;
        
        const content = editor.value;
        this.memoContent = content;
        
        // Save to localStorage
        const saved = this.saveToStorage('memoContent', content);
        
        if (saved) {
            this.updateMemoStatus('Saved ' + this.formatContentLength());
            
            // Update main app status briefly
            this.updateStatus('Memo saved', 'success', 1500);
        } else {
            this.updateMemoStatus('Save failed!');
        }
    }
    
    formatContentLength() {
        const wordCount = this.memoContent.trim().split(/\s+/).filter(w => w.length > 0).length;
        const charCount = this.memoContent.length;
        
        if (charCount === 0) return '(empty)';
        return `(${wordCount} words, ${charCount} chars)`;
    }
    
    updateMemoStatus(message) {
        const statusEl = this.find(`#memo-status-${this.id}`);
        if (statusEl) {
            statusEl.textContent = message;
        }
    }
    
    toggleFormat(formatType) {
        const editor = this.find(`#memo-editor-${this.id}`);
        if (!editor) return;
        
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const selectedText = editor.value.substring(start, end);
        
        if (selectedText.length === 0) {
            // No selection - show feedback
            this.updateMemoStatus(`Select text first to apply ${formatType} formatting`);
            return;
        }
        
        let formattedText;
        let markers;
        
        switch (formatType) {
            case 'bold':
                markers = '**';
                break;
            case 'italic':
                markers = '*';
                break;
            default:
                return;
        }
        
        // Check if text is already formatted
        const beforeText = editor.value.substring(start - markers.length, start);
        const afterText = editor.value.substring(end, end + markers.length);
        
        if (beforeText === markers && afterText === markers) {
            // Remove formatting
            formattedText = selectedText;
            editor.value = editor.value.substring(0, start - markers.length) + 
                          formattedText + 
                          editor.value.substring(end + markers.length);
            editor.setSelectionRange(start - markers.length, start - markers.length + formattedText.length);
        } else {
            // Add formatting
            formattedText = markers + selectedText + markers;
            editor.value = editor.value.substring(0, start) + 
                          formattedText + 
                          editor.value.substring(end);
            editor.setSelectionRange(start, start + formattedText.length);
        }
        
        // Focus back to editor and trigger auto-save
        editor.focus();
        this.scheduleAutoSave();
        this.processLinks();
        
        this.updateMemoStatus(`Applied ${formatType} formatting`);
    }
    
    clearFormatting() {
        const editor = this.find(`#memo-editor-${this.id}`);
        if (!editor) return;
        
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const selectedText = editor.value.substring(start, end);
        
        if (selectedText.length === 0) {
            this.updateMemoStatus('Select text first to clear formatting');
            return;
        }
        
        // Remove markdown formatting
        const cleanText = selectedText
            .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove bold
            .replace(/\*(.*?)\*/g, '$1');     // Remove italic
        
        editor.value = editor.value.substring(0, start) + 
                      cleanText + 
                      editor.value.substring(end);
                      
        editor.setSelectionRange(start, start + cleanText.length);
        editor.focus();
        
        this.scheduleAutoSave();
        this.processLinks();
        this.updateMemoStatus('Formatting cleared');
    }
    
    clearAllContent() {
        const editor = this.find(`#memo-editor-${this.id}`);
        if (!editor) return;
        
        editor.value = '';
        this.memoContent = '';
        this.saveToStorage('memoContent', '');
        this.updateMemoStatus('Content cleared');
        this.updateStatus('Memo cleared', 'secondary', 2000);
        editor.focus();
    }
    
    processLinks() {
        const editor = this.find(`#memo-editor-${this.id}`);
        if (!editor) return;
        
        const content = editor.value;
        // Enhanced URL regex to catch more patterns
        const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?|\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b)/g;
        const matches = [];
        let match;
        
        // Find all URL matches with their positions
        while ((match = urlRegex.exec(content)) !== null) {
            matches.push({
                url: match[0],
                start: match.index,
                end: match.index + match[0].length,
                isEmail: match[0].includes('@') && !match[0].startsWith('http')
            });
        }
        
        // Store detected URLs for click handling
        this.detectedUrls = matches;
        
        if (matches.length > 0) {
            console.log(`Detected ${matches.length} links:`, matches.map(m => m.url));
        }
    }
    
    handleLinkClick(event) {
        if (!this.detectedUrls || this.detectedUrls.length === 0) return;
        
        const editor = this.find(`#memo-editor-${this.id}`);
        if (!editor) return;
        
        const cursorPosition = editor.selectionStart;
        
        // Check if click position is within a detected URL
        const clickedUrl = this.detectedUrls.find(urlMatch => 
            cursorPosition >= urlMatch.start && cursorPosition <= urlMatch.end
        );
        
        if (clickedUrl) {
            event.preventDefault();
            this.openUrl(clickedUrl.url, clickedUrl.isEmail);
        }
    }
    
    openUrl(url, isEmail = false) {
        try {
            let finalUrl = url;
            
            if (isEmail) {
                finalUrl = `mailto:${url}`;
            } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
                // Add protocol for URLs that don't have it
                finalUrl = `https://${url}`;
            }
            
            // In Tauri, we should use the shell API to open URLs safely
            if (window.__TAURI__) {
                window.__TAURI__.shell.open(finalUrl).catch(error => {
                    console.error('Error opening URL:', error);
                    this.updateMemoStatus(`Failed to open: ${url}`);
                });
            } else {
                // Fallback for browser testing
                window.open(finalUrl, '_blank', 'noopener,noreferrer');
            }
            
            this.updateMemoStatus(`Opening: ${url}`);
            this.updateStatus(`Opened link: ${url}`, 'primary', 3000);
            
        } catch (error) {
            console.error('Error opening URL:', error);
            this.updateMemoStatus(`Error opening: ${url}`);
        }
    }
    
    handleLinkHover(event) {
        if (!this.detectedUrls || this.detectedUrls.length === 0) return;
        
        const editor = this.find(`#memo-editor-${this.id}`);
        if (!editor) return;
        
        const cursorPosition = this.getTextPositionFromMouseEvent(event, editor);
        if (cursorPosition === -1) return;
        
        // Check if hover position is within a detected URL
        const hoveredUrl = this.detectedUrls.find(urlMatch => 
            cursorPosition >= urlMatch.start && cursorPosition <= urlMatch.end
        );
        
        if (hoveredUrl) {
            // Change cursor to pointer when over a link
            editor.style.cursor = 'pointer';
            
            // Update status to show it's clickable
            this.updateMemoStatus(`Click to open: ${hoveredUrl.url}`);
        } else {
            // Reset cursor and status
            editor.style.cursor = 'text';
        }
    }
    
    getTextPositionFromMouseEvent(event, textarea) {
        // This is a simplified approach - in a real implementation,
        // you might want to use more sophisticated text position detection
        // For now, we'll use the selection position
        return textarea.selectionStart;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    onInitialized() {
        super.onInitialized();
        
        // Focus the editor for immediate use
        setTimeout(() => {
            const editor = this.find(`#memo-editor-${this.id}`);
            if (editor && !editor.value.trim()) {
                editor.focus();
            }
        }, 100);
    }
    
    destroy() {
        // Save before destroying
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
            this.autoSave();
        }
        
        super.destroy();
    }
}
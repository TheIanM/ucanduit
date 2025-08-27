/**
 * Todo List Tool - ES6 Module
 * Supports multiple lists with add/complete functionality and local storage persistence
 * Updated: Dark mode support with CSS variables
 */

export class TodoListTool {
    constructor(container) {
        this.container = container;
        this.lists = {};
        this.activeListId = null;
        this.currentView = 'lists'; // 'lists' or 'items'
        
        this.initialize();
    }
    
    async initialize() {
        await this.loadFromStorage();
        this.render();
        this.bindEvents();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="todo-container" style="
                font-family: 'Quicksand', sans-serif;
                padding: 10px;
            ">
                <div class="todo-header" style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 15px;
                ">
                    <div class="todo-breadcrumb" style="
                        font-size: 14px;
                        font-weight: 600;
                        color: var(--text-primary);
                    "></div>
                    <button class="add-button">+ Add</button>
                </div>
                
                <div class="todo-content" style="
                    max-height: 400px;
                    overflow-y: auto;
                ">
                    <!-- Dynamic content will be rendered here -->
                </div>
                
                <!-- Add item input (hidden by default) -->
                <div class="add-item-input" style="
                    display: none;
                    margin-top: 10px;
                    border-top: 2px solid #f0f0f0;
                    padding-top: 10px;
                ">
                    <input type="text" class="new-item-text" placeholder="What needs to be done?" style="
                        width: 100%;
                        padding: 8px 12px;
                        border: 2px solid var(--text-primary);
                        border-radius: 8px;
                        font-family: 'Quicksand', sans-serif;
                        font-size: 14px;
                        outline: none;
                        background: var(--not-white);
                        color: var(--text-primary);
                    ">
                    <div style="margin-top: 8px; text-align: right;">
                        <button class="cancel-add">Cancel</button>
                        <button class="confirm-add">Add</button>
                    </div>
                </div>
            </div>
            
            <style>
                .add-button {
                    background: var(--translucent-bg) !important;
                    color: var(--text-primary) !important;
                    border: 3px solid var(--text-primary) !important;
                    border-radius: 20px !important;
                    padding: 6px 12px !important;
                    font-size: 12px !important;
                    font-weight: 700 !important;
                    cursor: pointer !important;
                    transition: all 0.2s ease !important;
                    font-family: 'Quicksand', sans-serif !important;
                    backdrop-filter: blur(10px) !important;
                    -webkit-backdrop-filter: blur(10px) !important;
                }
                
                .cancel-add, .confirm-add {
                    background: var(--translucent-bg) !important;
                    color: var(--text-primary) !important;
                    border: 3px solid var(--text-primary) !important;
                    border-radius: 20px !important;
                    padding: 6px 12px !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    cursor: pointer !important;
                    font-family: 'Quicksand', sans-serif !important;
                    transition: all 0.2s ease !important;
                    backdrop-filter: blur(10px) !important;
                    -webkit-backdrop-filter: blur(10px) !important;
                }
                
                .cancel-add {
                    margin-right: 5px;
                }
                
                .todo-list-item, .todo-item {
                    background: var(--translucent-bg);
                    border: 2px solid var(--text-primary);
                    border-radius: 12px;
                    margin-bottom: 8px;
                    padding: 12px 15px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: 600;
                    position: relative;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    color: var(--text-primary);
                }
                
                .todo-list-item:hover, .todo-item:hover {
                    background: var(--text-primary) !important;
                    color: var(--not-white) !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }
                
                .todo-list-item:hover .todo-list-meta {
                    color: #e0e0e0 !important;
                }
                
                .todo-item.completed {
                    text-decoration: line-through;
                    opacity: 0.7;
                    background: #f0f8f0;
                    border-color: #4ecf9d;
                }
                
                .todo-item.completed::before {
                    content: "✓";
                    position: absolute;
                    left: 8px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #4ecf9d;
                    font-weight: bold;
                    font-size: 16px;
                }
                
                .todo-item.completed:hover::before {
                    color: #4ecf9d !important;
                }
                
                .todo-item.completed {
                    padding-left: 30px;
                }
                
                .todo-list-meta {
                    font-size: 12px;
                    color: var(--text-secondary);
                    font-weight: 500;
                    margin-top: 4px;
                }
                
                .back-button {
                    background: var(--translucent-bg);
                    color: var(--text-primary);
                    border: 3px solid var(--text-primary);
                    border-radius: 20px;
                    padding: 6px 12px;
                    font-size: 11px;
                    font-weight: 700;
                    cursor: pointer;
                    margin-right: 10px;
                    font-family: 'Quicksand', sans-serif;
                    transition: all 0.2s ease;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                }
                
                .back-button:hover, .add-button:hover, .cancel-add:hover, .confirm-add:hover {
                    background: var(--text-primary) !important;
                    color: var(--not-white) !important;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }
                
                /* Responsive adjustments */
                @media (max-height: 250px) {
                    .todo-container { padding: 4px !important; }
                    .todo-header { margin-bottom: 8px !important; }
                    .todo-content { max-height: 120px !important; }
                    .todo-list-item, .todo-item { 
                        padding: 6px 8px !important; 
                        margin-bottom: 4px !important; 
                        font-size: 11px !important;
                    }
                    .todo-breadcrumb { font-size: 10px !important; }
                    .add-button { padding: 3px 8px !important; font-size: 10px !important; }
                }
                
                @media (max-width: 250px) {
                    .todo-header { flex-direction: column !important; gap: 5px !important; }
                    .todo-list-item, .todo-item { font-size: 12px !important; }
                }
            </style>
        `;
        
        this.updateView();
    }
    
    bindEvents() {
        const addButton = this.container.querySelector('.add-button');
        const confirmAdd = this.container.querySelector('.confirm-add');
        const cancelAdd = this.container.querySelector('.cancel-add');
        const newItemInput = this.container.querySelector('.new-item-text');
        
        addButton.addEventListener('click', () => this.showAddInput());
        confirmAdd.addEventListener('click', async () => await this.handleAdd());
        cancelAdd.addEventListener('click', () => this.hideAddInput());
        
        newItemInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') await this.handleAdd();
            if (e.key === 'Escape') this.hideAddInput();
        });
    }
    
    updateView() {
        const content = this.container.querySelector('.todo-content');
        const breadcrumb = this.container.querySelector('.todo-breadcrumb');
        
        if (this.currentView === 'lists') {
            breadcrumb.innerHTML = '📝 Todo Lists';
            content.innerHTML = this.renderLists();
            this.bindContentEvents(); // Fix: Rebind events after rendering lists
        } else if (this.currentView === 'items') {
            const activeList = this.lists[this.activeListId];
            breadcrumb.innerHTML = `
                <button class="back-button">← Back</button>
                📋 ${activeList.name}
            `;
            content.innerHTML = this.renderItems();
            
            // Bind back button
            const backButton = breadcrumb.querySelector('.back-button');
            backButton.addEventListener('click', () => this.showLists());
            
            this.bindContentEvents(); // Fix: Rebind events after rendering items
        }
    }
    
    renderLists() {
        const listIds = Object.keys(this.lists);
        
        if (listIds.length === 0) {
            return `
                <div style="text-align: center; color: #6c757d; padding: 40px 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📝</div>
                    <div style="font-weight: 600; margin-bottom: 5px;">No lists yet</div>
                    <div style="font-size: 14px;">Click "+ Add" to create your first todo list</div>
                </div>
            `;
        }
        
        return listIds.map(listId => {
            const list = this.lists[listId];
            const totalItems = list.items.length;
            const completedItems = list.items.filter(item => item.completed).length;
            
            return `
                <div class="todo-list-item" data-list-id="${listId}">
                    <div>${list.name}</div>
                    <div class="todo-list-meta">
                        ${completedItems}/${totalItems} completed
                        ${totalItems === 0 ? '' : `• ${Math.round((completedItems/totalItems) * 100)}%`}
                    </div>
                </div>
            `;
        }).join('');
    }
    
    renderItems() {
        const activeList = this.lists[this.activeListId];
        
        if (!activeList || activeList.items.length === 0) {
            return `
                <div style="text-align: center; color: #6c757d; padding: 40px 20px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
                    <div style="font-weight: 600; margin-bottom: 5px;">No items yet</div>
                    <div style="font-size: 14px;">Click "+ Add" to add your first todo item</div>
                </div>
            `;
        }
        
        // Sort items: incomplete first, then completed
        const sortedItems = [...activeList.items].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            return a.createdAt - b.createdAt;
        });
        
        return sortedItems.map(item => `
            <div class="todo-item ${item.completed ? 'completed' : ''}" data-item-id="${item.id}">
                ${item.text}
            </div>
        `).join('');
    }
    
    showAddInput() {
        const addInput = this.container.querySelector('.add-item-input');
        const textInput = this.container.querySelector('.new-item-text');
        
        addInput.style.display = 'block';
        textInput.focus();
        textInput.value = '';
        
        if (this.currentView === 'lists') {
            textInput.placeholder = 'List name (e.g., "Work Tasks", "Shopping")';
        } else {
            textInput.placeholder = 'What needs to be done?';
        }
    }
    
    hideAddInput() {
        const addInput = this.container.querySelector('.add-item-input');
        addInput.style.display = 'none';
    }
    
    async handleAdd() {
        const textInput = this.container.querySelector('.new-item-text');
        const text = textInput.value.trim();
        
        if (!text) return;
        
        if (this.currentView === 'lists') {
            this.createList(text);
        } else {
            this.createItem(text);
        }
        
        this.hideAddInput();
        this.updateView();
        await this.saveToStorage();
    }
    
    createList(name) {
        const listId = this.generateId();
        this.lists[listId] = {
            id: listId,
            name: name,
            items: [],
            createdAt: Date.now()
        };
        
        // Track list creation for analytics
        if (window.usageAnalytics) {
            window.usageAnalytics.trackTodoCreated(false); // false = list, not item
        }
    }
    
    createItem(text) {
        if (!this.activeListId || !this.lists[this.activeListId]) return;
        
        const itemId = this.generateId();
        this.lists[this.activeListId].items.push({
            id: itemId,
            text: text,
            completed: false,
            createdAt: Date.now(),
            completedAt: null
        });
        
        // Track item creation for analytics
        if (window.usageAnalytics) {
            window.usageAnalytics.trackTodoCreated(true); // true = item
        }
    }
    
    showLists() {
        this.currentView = 'lists';
        this.activeListId = null;
        this.updateView();
    }
    
    showItems(listId) {
        this.currentView = 'items';
        this.activeListId = listId;
        this.updateView();
    }
    
    async toggleItem(itemId) {
        if (!this.activeListId || !this.lists[this.activeListId]) return;
        
        const item = this.lists[this.activeListId].items.find(i => i.id === itemId);
        if (item) {
            const wasCompleted = item.completed;
            item.completed = !item.completed;
            item.completedAt = item.completed ? Date.now() : null;
            
            // Track completion for analytics (only when marking as completed)
            if (!wasCompleted && item.completed && window.usageAnalytics) {
                window.usageAnalytics.trackTodoCompleted();
            }
            
            this.updateView();
            await this.saveToStorage();
        }
    }
    
    bindContentEvents() {
        // Bind list clicks
        const listItems = this.container.querySelectorAll('.todo-list-item');
        listItems.forEach(item => {
            item.addEventListener('click', () => {
                const listId = item.getAttribute('data-list-id');
                this.showItems(listId);
            });
        });
        
        // Bind item clicks
        const todoItems = this.container.querySelectorAll('.todo-item');
        todoItems.forEach(item => {
            item.addEventListener('click', async () => {
                const itemId = item.getAttribute('data-item-id');
                await this.toggleItem(itemId);
            });
        });
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    async saveToStorage() {
        try {
            // First try to save to external file using Tauri
            if (window.__TAURI__ && window.__TAURI__.core) {
                await window.__TAURI__.core.invoke('write_json_file', {
                    filename: 'ucanduit-todos.json',
                    data: this.lists
                });
                console.log('✅ Todos saved to external file');
            } else {
                // Fallback to localStorage if Tauri not available
                localStorage.setItem('ucanduit-todos', JSON.stringify(this.lists));
                console.log('📱 Todos saved to localStorage (fallback)');
            }
        } catch (error) {
            console.error('❌ Failed to save todos to file, using localStorage fallback:', error);
            try {
                localStorage.setItem('ucanduit-todos', JSON.stringify(this.lists));
            } catch (localError) {
                console.error('❌ Failed to save todos to localStorage:', localError);
            }
        }
    }
    
    async loadFromStorage() {
        try {
            // First try to load from external file using Tauri
            if (window.__TAURI__ && window.__TAURI__.core) {
                const fileData = await window.__TAURI__.core.invoke('read_json_file', {
                    filename: 'ucanduit-todos.json'
                });
                if (fileData) {
                    this.lists = fileData;
                    console.log('✅ Todos loaded from external file');
                    return;
                }
            }
        } catch (error) {
            console.log('📄 No external todos file found or Tauri unavailable, checking localStorage');
        }
        
        // Fallback to localStorage
        try {
            const saved = localStorage.getItem('ucanduit-todos');
            if (saved) {
                this.lists = JSON.parse(saved);
                console.log('📱 Todos loaded from localStorage');
                
                // Migrate from localStorage to file if Tauri is available
                if (window.__TAURI__ && window.__TAURI__.core) {
                    await this.saveToStorage();
                    console.log('🔄 Migrated todos from localStorage to external file');
                }
            }
        } catch (error) {
            console.error('❌ Failed to load todos from localStorage:', error);
            this.lists = {};
        }
    }
    
    // Cleanup method for when tool is unloaded
    async destroy() {
        await this.saveToStorage(); // Save before destroying
        this.container.innerHTML = '';
    }
}
/**
 * Todo List Tool - ES6 Module
 * Supports multiple lists with add/complete functionality and local storage persistence
 */

export class TodoListTool {
    constructor(container) {
        this.container = container;
        this.lists = {};
        this.activeListId = null;
        this.currentView = 'lists'; // 'lists' or 'items'
        
        this.loadFromStorage();
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
                        color: #2a2d34;
                    "></div>
                    <button class="add-button" style="
                        background: white;
                        color: #2a2d34;
                        border: 3px solid #2a2d34;
                        border-radius: 20px;
                        padding: 6px 12px;
                        font-size: 12px;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.2s ease;
                        font-family: 'Quicksand', sans-serif;
                    ">+ Add</button>
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
                        border: 2px solid #2a2d34;
                        border-radius: 8px;
                        font-family: 'Quicksand', sans-serif;
                        font-size: 14px;
                        outline: none;
                    ">
                    <div style="margin-top: 8px; text-align: right;">
                        <button class="cancel-add" style="
                            background: white;
                            color: #2a2d34;
                            border: 3px solid #2a2d34;
                            border-radius: 20px;
                            padding: 6px 12px;
                            font-size: 11px;
                            font-weight: 700;
                            cursor: pointer;
                            margin-right: 5px;
                            font-family: 'Quicksand', sans-serif;
                            transition: all 0.2s ease;
                        ">Cancel</button>
                        <button class="confirm-add" style="
                            background: white;
                            color: #2a2d34;
                            border: 3px solid #2a2d34;
                            border-radius: 20px;
                            padding: 6px 12px;
                            font-size: 11px;
                            font-weight: 700;
                            cursor: pointer;
                            font-family: 'Quicksand', sans-serif;
                            transition: all 0.2s ease;
                        ">Add</button>
                    </div>
                </div>
            </div>
            
            <style>
                .todo-list-item, .todo-item {
                    background: white;
                    border: 2px solid #2a2d34;
                    border-radius: 12px;
                    margin-bottom: 8px;
                    padding: 12px 15px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: 600;
                    position: relative;
                }
                
                .todo-list-item:hover, .todo-item:hover {
                    background: #2a2d34 !important;
                    color: white !important;
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
                    color: #6c757d;
                    font-weight: 500;
                    margin-top: 4px;
                }
                
                .back-button {
                    background: white;
                    color: #2a2d34;
                    border: 3px solid #2a2d34;
                    border-radius: 20px;
                    padding: 6px 12px;
                    font-size: 11px;
                    font-weight: 700;
                    cursor: pointer;
                    margin-right: 10px;
                    font-family: 'Quicksand', sans-serif;
                    transition: all 0.2s ease;
                }
                
                .back-button:hover, .add-button:hover, .cancel-add:hover, .confirm-add:hover {
                    background: #2a2d34 !important;
                    color: white !important;
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
        confirmAdd.addEventListener('click', () => this.handleAdd());
        cancelAdd.addEventListener('click', () => this.hideAddInput());
        
        newItemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAdd();
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
    
    handleAdd() {
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
        this.saveToStorage();
    }
    
    createList(name) {
        const listId = this.generateId();
        this.lists[listId] = {
            id: listId,
            name: name,
            items: [],
            createdAt: Date.now()
        };
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
    
    toggleItem(itemId) {
        if (!this.activeListId || !this.lists[this.activeListId]) return;
        
        const item = this.lists[this.activeListId].items.find(i => i.id === itemId);
        if (item) {
            item.completed = !item.completed;
            item.completedAt = item.completed ? Date.now() : null;
            this.updateView();
            this.saveToStorage();
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
            item.addEventListener('click', () => {
                const itemId = item.getAttribute('data-item-id');
                this.toggleItem(itemId);
            });
        });
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    saveToStorage() {
        try {
            localStorage.setItem('ucanduit-todos', JSON.stringify(this.lists));
        } catch (error) {
            console.error('Failed to save todos to localStorage:', error);
        }
    }
    
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('ucanduit-todos');
            if (saved) {
                this.lists = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Failed to load todos from localStorage:', error);
            this.lists = {};
        }
    }
    
    // Cleanup method for when tool is unloaded
    destroy() {
        this.saveToStorage(); // Save before destroying
        this.container.innerHTML = '';
    }
}
let draggedElement = null;
let sourceContainer = null;
let activeFilters = new Set();

const todoContainer = document.getElementById('todoContainer');
const doneContainer = document.getElementById('doneContainer');
const addCardBtn = document.getElementById('addCardBtn');
const moveAllBtn = document.getElementById('moveAllBtn');
const filterButtons = document.getElementById('filterButtons');
const allContainers = [todoContainer, doneContainer];

// Modal elements
const editModal = document.getElementById('editModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');
const editTitle = document.getElementById('editTitle');
const editContent = document.getElementById('editContent');
const editTag = document.getElementById('editTag');
const editDate = document.getElementById('editDate');

let currentEditingCard = null;

// LocalStorage functions
function saveState() {
    const state = {
        todo: [],
        done: []
    };

    // Save todo cards
    todoContainer.querySelectorAll('.card').forEach(card => {
        state.todo.push({
            title: card.querySelector('.card-title').textContent,
            content: card.querySelector('.card-content').textContent,
            tag: card.querySelector('.card-tag').textContent,
            date: card.querySelector('.card-date').textContent
        });
    });

    // Save done cards
    doneContainer.querySelectorAll('.card').forEach(card => {
        state.done.push({
            title: card.querySelector('.card-title').textContent,
            content: card.querySelector('.card-content').textContent,
            tag: card.querySelector('.card-tag').textContent,
            date: card.querySelector('.card-date').textContent
        });
    });

    localStorage.setItem('cardState', JSON.stringify(state));
}

function loadState() {
    const savedState = localStorage.getItem('cardState');
    if (!savedState) return;

    const state = JSON.parse(savedState);

    // Clear existing cards
    todoContainer.innerHTML = '';
    doneContainer.innerHTML = '';

    // Load todo cards
    state.todo.forEach(cardData => {
        const card = createCardElement(cardData);
        todoContainer.appendChild(card);
    });

    // Load done cards
    state.done.forEach(cardData => {
        const card = createCardElement(cardData);
        doneContainer.appendChild(card);
    });
}

function createCardElement(cardData) {
    const card = document.createElement('div');
    card.className = 'card';
    card.draggable = true;
    card.innerHTML = `
        <div class="card-title">${cardData.title}</div>
        <div class="card-content">
            ${cardData.content}
        </div>
        <div class="card-footer">
            <span class="card-tag">${cardData.tag}</span>
            <span class="card-date">${cardData.date}</span>
        </div>
    `;
    return card;
}

// Get all unique tags from cards
function getAllTags() {
    const tags = new Set();
    document.querySelectorAll('.card-tag').forEach(tagElement => {
        tags.add(tagElement.textContent);
    });
    return Array.from(tags).sort();
}

// Render filter buttons
function renderFilterButtons() {
    const tags = getAllTags();
    filterButtons.innerHTML = '';

    tags.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn active';
        btn.textContent = tag;
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            if (btn.classList.contains('active')) {
                activeFilters.delete(tag);
            } else {
                activeFilters.add(tag);
            }
            applyFilters();
        });
        filterButtons.appendChild(btn);
    });
}

// Apply filters to hide/show cards
function applyFilters() {
    document.querySelectorAll('.card').forEach(card => {
        const tag = card.querySelector('.card-tag').textContent;
        if (activeFilters.has(tag)) {
            card.classList.add('hidden');
        } else {
            card.classList.remove('hidden');
        }
    });
}

// Open edit modal
function openEditModal(card) {
    currentEditingCard = card;
    editTitle.value = card.querySelector('.card-title').textContent;
    editContent.value = card.querySelector('.card-content').textContent;
    editTag.value = card.querySelector('.card-tag').textContent;
    editDate.value = card.querySelector('.card-date').textContent;
    editModal.classList.add('active');
    editTitle.focus();
}

// Close edit modal
function closeEditModalFunc() {
    editModal.classList.remove('active');
    currentEditingCard = null;
}

// Save card changes
function saveCardChanges() {
    if (!currentEditingCard) return;

    currentEditingCard.querySelector('.card-title').textContent = editTitle.value;
    currentEditingCard.querySelector('.card-content').textContent = editContent.value;
    currentEditingCard.querySelector('.card-tag').textContent = editTag.value;
    currentEditingCard.querySelector('.card-date').textContent = editDate.value;

    closeEditModalFunc();
    renderFilterButtons();
    applyFilters();
    saveState();
}

// Delete card
function deleteCard() {
    if (!currentEditingCard) return;
    if (confirm('Are you sure you want to delete this card?')) {
        currentEditingCard.remove();
        closeEditModalFunc();
        renderFilterButtons();
        applyFilters();
        saveState();
    }
}

// Handle drag start
function handleDragStart(e) {
    draggedElement = this;
    sourceContainer = this.parentElement;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

// Handle drag over
function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

// Handle drag enter
function handleDragEnter(e) {
    if (this.classList.contains('card')) {
        this.style.opacity = '0.8';
    } else if (this.classList.contains('cards-container')) {
        this.classList.add('drag-over');
    }
}

// Handle drag leave
function handleDragLeave(e) {
    if (this.classList.contains('card')) {
        this.style.opacity = '1';
    } else if (this.classList.contains('cards-container')) {
        this.classList.remove('drag-over');
    }
}

// Handle drop
function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }

    // Remove drag-over class from all containers
    allContainers.forEach(container => {
        container.classList.remove('drag-over');
    });

    // If dropped on a card, reorder within the same container
    if (draggedElement !== this && this.classList.contains('card')) {
        const parentContainer = this.parentElement;
        const allCards = Array.from(parentContainer.querySelectorAll('.card'));
        const draggedIndex = allCards.indexOf(draggedElement);
        const targetIndex = allCards.indexOf(this);

        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedElement, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedElement, this);
        }
    }
    // If dropped on a container, add to that container
    else if (this.classList.contains('cards-container') && draggedElement) {
        this.appendChild(draggedElement);
    }

    this.style.opacity = '1';
    return false;
}

// Handle drag end
function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Reset all cards and containers
    const allCards = document.querySelectorAll('.card');
    allCards.forEach(card => {
        card.style.opacity = '1';
    });
    
    allContainers.forEach(container => {
        container.classList.remove('drag-over');
    });

    // Save state after drag operation
    saveState();
}

// Attach drag event listeners to cards
function attachCardListeners() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.removeEventListener('dragstart', handleDragStart);
        card.removeEventListener('dragenter', handleDragEnter);
        card.removeEventListener('dragover', handleDragOver);
        card.removeEventListener('dragleave', handleDragLeave);
        card.removeEventListener('drop', handleDrop);
        card.removeEventListener('dragend', handleDragEnd);
        card.removeEventListener('click', handleCardClick);

        card.addEventListener('dragstart', handleDragStart, false);
        card.addEventListener('dragenter', handleDragEnter, false);
        card.addEventListener('dragover', handleDragOver, false);
        card.addEventListener('dragleave', handleDragLeave, false);
        card.addEventListener('drop', handleDrop, false);
        card.addEventListener('dragend', handleDragEnd, false);
        card.addEventListener('click', handleCardClick, false);
    });
}

// Handle card click to open edit modal
function handleCardClick(e) {
    if (e.target.closest('.card-title, .card-content, .card-tag, .card-date, .card-footer')) {
        openEditModal(this);
    }
}

// Attach drag event listeners to containers
function attachContainerListeners() {
    allContainers.forEach(container => {
        container.removeEventListener('dragover', handleDragOver);
        container.removeEventListener('dragenter', handleDragEnter);
        container.removeEventListener('dragleave', handleDragLeave);
        container.removeEventListener('drop', handleDrop);

        container.addEventListener('dragover', handleDragOver, false);
        container.addEventListener('dragenter', handleDragEnter, false);
        container.addEventListener('dragleave', handleDragLeave, false);
        container.addEventListener('drop', handleDrop, false);
    });
}

// Create a new card
function createNewCard() {
    const newCard = document.createElement('div');
    newCard.className = 'card';
    newCard.draggable = true;
    newCard.innerHTML = `
        <div class="card-title">📝 New Card</div>
        <div class="card-content">
            Edit this card with your content. Add your own text, links, and information here.
        </div>
        <div class="card-footer">
            <span class="card-tag">New</span>
            <span class="card-date">Mar 3, 2026</span>
        </div>
    `;

    todoContainer.appendChild(newCard);
    attachCardListeners();
    renderFilterButtons();
    applyFilters();
    saveState();
}

// Add click event to add card button
addCardBtn.addEventListener('click', createNewCard);

// Modal event listeners
closeModal.addEventListener('click', closeEditModalFunc);
cancelBtn.addEventListener('click', closeEditModalFunc);
saveBtn.addEventListener('click', saveCardChanges);
deleteBtn.addEventListener('click', deleteCard);

// Close modal when clicking outside
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModalFunc();
    }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEditModalFunc();
    }
});

// Move all cards to todo button
moveAllBtn.addEventListener('click', function() {
    const allCards = Array.from(doneContainer.querySelectorAll('.card'));
    allCards.forEach(card => {
        todoContainer.appendChild(card);
    });
    attachCardListeners();
    saveState();
});

// Load state from localStorage on page load
loadState();

// Initialize listeners and filters on page load
attachCardListeners();
attachContainerListeners();
renderFilterButtons();
applyFilters();

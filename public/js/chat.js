// ==================== MOBILE NAVIGATION FIX ====================
// Add this to the TOP of your chat.js file, BEFORE any other code

// Detect if mobile
const isMobile = () => window.innerWidth <= 768;

// Override the openChat function for mobile compatibility
window.openChat = function(id, name, isOnline, isGroup) {
    console.log('📱 Opening chat:', name, 'Mobile:', isMobile());
    
    // Set active chat
    activeChat = { id, name, isGroup };
    
    // Get elements
    const welcomeScreen = document.getElementById('welcomeScreen');
    const chatScreen = document.getElementById('chatScreen');
    const chatUserName = document.getElementById('chatUserName');
    
    // Hide welcome, show chat
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (chatScreen) {
        chatScreen.style.display = 'flex';
        chatScreen.classList.add('active-chat');
    }
    
    // Update chat header
    if (chatUserName) {
        chatUserName.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <span>${name}</span>
                ${isGroup ? `
                    <div class="group-controls">
                        <button class="btn-add" onclick="openAddMemberModal('${id}')">Add Member</button>
                        <button class="btn-delete" onclick="deleteGroup('${id}')">Delete Group</button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Update status
    const chatUserStatus = document.getElementById('chatUserStatus');
    if (chatUserStatus && !isGroup) {
        chatUserStatus.textContent = isOnline ? 'Online' : 'Offline';
        chatUserStatus.className = isOnline ? 'status-online' : 'status-offline';
    }
    
    // Mobile-specific actions
    if (isMobile()) {
        console.log('📱 Activating mobile chat mode');
        document.body.classList.add('mobile-chat-active');
        
        // Show back button
        const backBtn = document.getElementById('mobileBackBtn');
        if (backBtn) {
            backBtn.style.display = 'inline-flex';
        }
    }
    
    // Remove welcome state
    document.body.classList.remove('welcome-active');
    
    // Join group room if applicable
    if (isGroup && typeof socket !== 'undefined') {
        socket.emit('join_group', id);
    }
    
    // Load messages
    loadMessages(id, isGroup);
};

// Back button handler
window.closeMobileChat = function() {
    console.log('📱 Closing mobile chat, returning to list');
    
    if (isMobile()) {
        // Remove mobile chat mode
        document.body.classList.remove('mobile-chat-active');
        
        // Hide back button
        const backBtn = document.getElementById('mobileBackBtn');
        if (backBtn) {
            backBtn.style.display = 'none';
        }
        
        // Reset chat state
        activeChat = null;
        
        // Clear chat content (optional, like WhatsApp)
        const chatUserName = document.getElementById('chatUserName');
        const messagesContainer = document.getElementById('messagesContainer');
        if (chatUserName) chatUserName.textContent = '';
        if (messagesContainer) messagesContainer.innerHTML = '';
    }
};

// Setup when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Mobile navigation initialized');
    
    // Create or find back button
    let backBtn = document.getElementById('mobileBackBtn');
    if (!backBtn) {
        const chatHeader = document.querySelector('.chat-header');
        if (chatHeader) {
            backBtn = document.createElement('button');
            backBtn.id = 'mobileBackBtn';
            backBtn.innerHTML = '← Back';
            backBtn.style.cssText = `
                display: none;
                background: none;
                border: none;
                font-size: 16px;
                font-weight: 600;
                color: #075e54;
                cursor: pointer;
                padding: 5px 10px;
                margin-right: 10px;
            `;
            chatHeader.insertBefore(backBtn, chatHeader.firstChild);
        }
    }
    
    // Attach back button handler
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeMobileChat();
        });
    }
    
    // Initial state: show sidebar on mobile
    if (isMobile()) {
        document.body.classList.remove('mobile-chat-active');
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) welcomeScreen.style.display = 'none';
    }
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (!isMobile()) {
            // Desktop: remove mobile classes
            document.body.classList.remove('mobile-chat-active');
        }
    });
    
    // Prevent zoom on input focus (iOS fix)
    document.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('focus', () => {
            if (isMobile()) {
                input.style.fontSize = '16px';
            }
        });
    });
});



// Make functions globally accessible
window.isMobile = isMobile;

console.log('✅ Mobile navigation script loaded');

const API_URL = window.location.origin + '/api';
const AI_BOT_ID = "677d9c66e765432101234567"; 

const token = localStorage.getItem('token');
const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

let activeChat = null; 

if (!token || !currentUser.id) { 
    window.location.href = '/login.html'; 
}

const socket = io();
socket.emit('user_connected', currentUser.id);

console.log('Chat.js loaded successfully');

// ==================== FORCE INPUT BOX TO SHOW ON MOBILE ====================
// Add this to your chat.js or in a <script> tag

// Function to force show input on mobile
function forceShowInputOnMobile() {
    if (window.innerWidth <= 768) {
        const inputWrapper = document.querySelector('.message-input-wrapper');
        const inputContainer = document.querySelector('.input-container');
        const messageInput = document.getElementById('messageInput');
        const imageBtn = document.getElementById('imageBtn');
        const emojiBtn = document.getElementById('emojiBtn');
        const sendBtn = document.getElementById('sendBtn');
        
        console.log('🔧 Forcing input elements to show...');
        
        if (inputWrapper) {
            inputWrapper.style.display = 'flex';
            inputWrapper.style.visibility = 'visible';
            inputWrapper.style.opacity = '1';
            console.log('✅ Input wrapper forced visible');
        }
        
        if (inputContainer) {
            inputContainer.style.display = 'flex';
            console.log('✅ Input container forced visible');
        }
        
        if (messageInput) {
            messageInput.style.display = 'block';
            messageInput.style.visibility = 'visible';
            console.log('✅ Message input forced visible');
        }
        
        if (imageBtn) {
            imageBtn.style.display = 'inline-flex';
            imageBtn.style.visibility = 'visible';
            console.log('✅ Image button forced visible');
        }
        
        if (emojiBtn) {
            emojiBtn.style.display = 'inline-flex';
            emojiBtn.style.visibility = 'visible';
            console.log('✅ Emoji button forced visible');
        }
        
        if (sendBtn) {
            sendBtn.style.display = 'inline-block';
            sendBtn.style.visibility = 'visible';
            console.log('✅ Send button forced visible');
        }
    }
}

// Update your openChat function to call this
const originalOpenChat = window.openChat;

window.openChat = function(id, name, isOnline, isGroup) {
    console.log('📱 Opening chat:', name);
    
    // Set active chat
    activeChat = { id, name, isGroup };
    
    // Hide welcome, show chat
    const welcomeScreen = document.getElementById('welcomeScreen');
    const chatScreen = document.getElementById('chatScreen');
    const chatUserName = document.getElementById('chatUserName');
    
    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (chatScreen) {
        chatScreen.style.display = 'flex';
        chatScreen.classList.add('active-chat');
    }
    
    // Update header
    if (chatUserName) {
        chatUserName.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                <span>${name}</span>
                ${isGroup ? `
                    <div class="group-controls">
                        <button class="btn-add" onclick="openAddMemberModal('${id}')">Add Member</button>
                        <button class="btn-delete" onclick="deleteGroup('${id}')">Delete Group</button>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // Update status
    const chatUserStatus = document.getElementById('chatUserStatus');
    if (chatUserStatus && !isGroup) {
        chatUserStatus.textContent = isOnline ? 'Online' : 'Offline';
        chatUserStatus.className = isOnline ? 'status-online' : 'status-offline';
    }
    
    // ✅ MOBILE ACTIVATION
    if (window.innerWidth <= 768) {
        console.log('📱 Activating mobile chat mode');
        
        // Add mobile class
        document.body.classList.add('mobile-chat-active');
        document.body.classList.remove('welcome-active');
        
        // Show back button
        const backBtn = document.getElementById('mobileBackBtn');
        if (backBtn) {
            backBtn.style.display = 'inline-flex';
            console.log('✅ Back button shown');
        }
        
        // ✅ FORCE INPUT TO SHOW
        setTimeout(() => {
            forceShowInputOnMobile();
        }, 100);
    }
    
    // Join group if needed
    if (isGroup && typeof socket !== 'undefined') {
        socket.emit('join_group', id);
    }
    
    // Load messages
    if (typeof loadMessages === 'function') {
        loadMessages(id, isGroup);
    }
};

// Call on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Page loaded - setting up mobile input');
    
    // If already in a chat on mobile, force show input
    if (window.innerWidth <= 768 && document.body.classList.contains('mobile-chat-active')) {
        forceShowInputOnMobile();
    }
});

// Also call on resize
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768 && document.body.classList.contains('mobile-chat-active')) {
        forceShowInputOnMobile();
    }
});

// --- INITIALIZATION ---
async function loadInitialData() {
    await loadUsers();
    await loadGroups();
}

// --- LOADING USERS & GROUPS ---
async function loadUsers() {
    try {
        const res = await fetch(`${API_URL}/auth/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const allUsers = Array.isArray(data) ? data : (data.users || []);
        renderUsers(allUsers);
    } catch (err) {
        console.error("User load error:", err);
    }
}

async function loadGroups() {
    const groupsList = document.getElementById('groupsList');
    if (!groupsList) {
        console.error('groupsList element not found!');
        return;
    }
    
    try {
        console.log('Loading groups...');
        const res = await fetch(`${API_URL}/groups/my-groups`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
            console.error('Groups fetch failed:', res.status);
            const errorData = await res.json();
            console.error('Error details:', errorData);
            return;
        }
        
        const groups = await res.json();
        console.log('Loaded groups:', groups);
        
        groupsList.innerHTML = '';
        
        if (!Array.isArray(groups) || groups.length === 0) {
            groupsList.innerHTML = '<p class="no-groups" style="padding: 10px; text-align: center; color: #999;">No groups yet</p>';
            return;
        }
        
        groups.forEach(group => {
            const memberCount = group.members?.length || group.memberCount || 0;
            groupsList.innerHTML += `
                <div class="user-item" onclick="openChat('${group._id}', '${group.name}', true, true)">
                    <div class="avatar group-avatar">#</div>
                    <div class="user-details">
                        <h4>${group.name}</h4>
                        <p>${memberCount} Members</p>
                    </div>
                </div>`;
        });
        
        console.log(`✅ Displayed ${groups.length} groups`);
    } catch (err) {
        console.error("Groups load error:", err);
        groupsList.innerHTML = '<p style="padding: 10px; color: red;">Error loading groups</p>';
    }
}


// --- SIDEBAR (HIDES YOURSELF) ---
function renderUsers(usersData) {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    usersList.innerHTML = '';

    // 1. Show AI Bot
    usersList.insertAdjacentHTML('beforeend', `
        <div class="user-item" data-user-id="${AI_BOT_ID}" onclick="openChat('${AI_BOT_ID}', 'MUL Chat Bot', true, false)">
            <div class="avatar mul-avatar">🤖</div>
            <div class="user-details">
                <h4>MUL Chat Bot <span class="bot-badge">AI</span></h4>
                <p class="status-online">● Online</p>
            </div>
        </div>`);

    // 2. Filter to hide current user
    const myId = (currentUser.id || currentUser._id).toString();
    
    usersData.forEach(user => {
        const userId = (user._id || user.id).toString();
        if (userId !== myId && userId !== AI_BOT_ID) {
            const isOnline = user.isOnline || false;
            const statusClass = isOnline ? 'status-online' : 'status-offline';
            const statusText = isOnline ? '● Online' : 'Offline';
            
            usersList.innerHTML += `
                <div class="user-item" data-user-id="${userId}" onclick="openChat('${userId}', '${user.name}', ${isOnline}, false)">
                    <div class="avatar">${(user.name || 'U').charAt(0).toUpperCase()}</div>
                    <div class="user-details">
                        <h4>${user.name}</h4>
                        <p class="${statusClass}">${statusText}</p>
                    </div>
                </div>`;
        }
    });
    
    console.log(`✅ Rendered ${usersData.length} users (${usersData.filter(u => u.isOnline).length} online)`);
}

// --- CHAT LOGIC ---
// Global variable to keep track of all users for the selection list
let cachedUsers = [];

// Modify your loadUsers to save users to the cache
async function loadUsers() {
    try {
        const res = await fetch(`${API_URL}/auth/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        cachedUsers = Array.isArray(data) ? data : (data.users || []);
        renderUsers(cachedUsers);
    } catch (err) { console.error(err); }
}

function openChat(id, name, isOnline, isGroup) {
    activeChat = { id, name, isGroup };
    
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('chatScreen').style.display = 'flex';
    
    // Update Header UI
    const nameDisplay = document.getElementById('chatUserName');
    nameDisplay.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <span>${name}</span>
            ${isGroup ? `
                <div class="group-controls">
                    <button class="btn-add" onclick="openAddMemberModal('${id}')">Add Member</button>
                    <button class="btn-delete" onclick="deleteGroup('${id}')">Delete Group</button>
                </div>
            ` : ''}
        </div>
    `;
    if (isGroup) {
        // ✅ IMPORTANT: Tell the server we are joining this group's room
        socket.emit('join_group', id);
    }

    loadMessages(id, isGroup);
}

// --- NEW MODAL LOGIC ---
function openAddMemberModal(groupId) {
    const modal = document.getElementById('addMemberModal');
    const listContainer = document.getElementById('addMemberList');
    listContainer.innerHTML = '';

    // Filter out current user and AI Bot
    const myId = (currentUser.id || currentUser._id).toString();
    const selectableUsers = cachedUsers.filter(u => u._id !== myId && u._id !== AI_BOT_ID);

    selectableUsers.forEach(user => {
        listContainer.innerHTML += `
            <div class="member-selection-item">
                <div class="avatar" style="width:30px; height:30px; font-size:12px;">${user.name.charAt(0)}</div>
                <label for="chk-${user._id}">${user.name}</label>
                <input type="checkbox" id="chk-${user._id}" value="${user._id}" class="member-checkbox">
            </div>
        `;
    });

    modal.style.display = 'flex';

    // Set up the confirm button for this specific group
    document.getElementById('confirmAddMembers').onclick = () => submitAddMembers(groupId);
}

async function submitAddMembers(groupId) {
    const checkboxes = document.querySelectorAll('.member-checkbox:checked');
    const userIds = Array.from(checkboxes).map(cb => cb.value);

    if (userIds.length === 0) {
        alert("Please select at least one person.");
        return;
    }

    // We loop through the selected users and add them
    for (const userId of userIds) {
        await fetch(`${API_URL}/groups/${groupId}/add-member`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
    }

    alert("✅ Members added!");
    closeAddMemberModal();
    loadGroups(); // Refresh member count in sidebar
}

function closeAddMemberModal() {
    document.getElementById('addMemberModal').style.display = 'none';
}

async function deleteGroup(groupId) {
    if (!confirm("Are you sure you want to delete this group?")) return;

    const res = await fetch(`${API_URL}/groups/${groupId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
        alert("Group deleted.");
        window.location.reload();
    } else {
        alert("Only the creator can delete this group.");
    }
}

// Make global
window.openAddMemberModal = openAddMemberModal;
window.closeAddMemberModal = closeAddMemberModal;

async function loadMessages(id, isGroup) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    container.innerHTML = '<div class="loading">Loading messages...</div>';
    
    try {
        const endpoint = isGroup 
            ? `${API_URL}/messages/group/${id}`           
            : `${API_URL}/messages/conversation/${id}`;
        
        console.log('📥 Loading messages from:', endpoint);
        
        const res = await fetch(endpoint, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('📦 Received data:', data);
        
        // ✅ Handle both response formats
        const messages = Array.isArray(data) ? data : (data.messages || []);
        
        console.log(`✅ Loaded ${messages.length} messages for ${isGroup ? 'group' : 'user'} ${id}`);
        
        container.innerHTML = ''; 
        
        if (messages.length === 0) {
            container.innerHTML = '<div class="no-messages">No messages yet. Start the conversation!</div>';
        } else {
            messages.forEach(msg => {
                console.log('📝 Appending message:', msg.content?.substring(0, 50));
                appendMessage(msg);
            });
            console.log(`✅ Displayed all ${messages.length} messages`);
        }
        
    } catch (err) {
        console.error('❌ Error loading messages:', err);
        container.innerHTML = `
            <div class="error-msg">
                <p>Error loading history</p>
                <p style="font-size: 12px; color: #999;">${err.message}</p>
                <button onclick="loadMessages('${id}', ${isGroup})" class="retry-btn">Retry</button>
            </div>`;
    }
}

async function addCurrentContactToGroup(groupId) {
    // If you are currently in a DM with someone, activeChat will be their ID
    if (!activeChat || activeChat === AI_BOT_ID) {
        alert("Select a person first!");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/groups/${groupId}/add-member`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: activeChat })
        });

        if (res.ok) {
            alert("User added to group!");
            loadInitialData(); // Refresh sidebar
        } else {
            const err = await res.json();
            alert(err.error);
        }
    } catch (err) {
        console.error("Add member error:", err);
    }
}

// --- SENDING ---
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    if (!content || !activeChat) return;

    const messageData = {
        senderId: currentUser.id || currentUser._id,
        content: content,
        messageType: activeChat.isGroup ? 'group' : 'direct' // Logic fix here
    };

    if (activeChat.isGroup) {
        messageData.groupId = activeChat.id;
    } else {
        // Send both to be safe
        messageData.receiverId = activeChat.id;
        messageData.recipient = activeChat.id;
    }

    console.log('Sending message:', messageData);
    socket.emit('send_message', messageData);
    input.value = '';
}

// --- IMAGE UPLOAD SUPPORT ---
async function sendImage() {
    const fileInput = document.getElementById('imageInput');
    const file = fileInput?.files?.[0];
    
    if (!file || !activeChat) return;
    
    console.log('Uploading image:', file.name);
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        const base64Image = e.target.result;
        
        const messageData = {
            senderId: currentUser.id || currentUser._id,
            content: '[Image]',
            messageType: 'image',
            imageUrl: base64Image
        };
        
        if (activeChat.isGroup) {
            messageData.groupId = activeChat.id;
        } else {
            messageData.receiverId = activeChat.id;
        }
        
        console.log('Sending image message');
        socket.emit('send_message', messageData);
        fileInput.value = '';
    };
    
    reader.readAsDataURL(file);
}

// ✅ NEW: Emoji Support Functions
function insertEmoji(emoji) {
    const input = document.getElementById('messageInput');
    if (input) {
        input.value += emoji;
        input.focus();
        console.log('Inserted emoji:', emoji);
    }
}

function toggleEmojiPicker() {
    const picker = document.getElementById('emojiPicker');
    if (picker) {
        const isHidden = picker.style.display === 'none';
        picker.style.display = isHidden ? 'block' : 'none';
        console.log('Emoji picker toggled:', isHidden ? 'open' : 'closed');
    }
}

// Close emoji picker when clicking outside
document.addEventListener('click', function(e) {
    const picker = document.getElementById('emojiPicker');
    const emojiBtn = document.getElementById('emojiBtn');
    
    if (picker && emojiBtn && 
        !picker.contains(e.target) && 
        !emojiBtn.contains(e.target) &&
        picker.style.display === 'block') {
        picker.style.display = 'none';
    }
});

// Add this to make sure the modal actually shows
function openCreateGroupModal() {
    const modal = document.getElementById('createGroupModal');
    if (modal) {
        // Force display flex and a high z-index
        modal.style.display = 'flex'; 
        modal.style.zIndex = '10000'; 
        console.log("✅ Group Modal Opened");
    } else {
        console.error("❌ Modal element not found");
    }
}
window.openCreateGroupModal = openCreateGroupModal;

// --- CREATE GROUP ---
async function createNewGroup() {
    const groupNameInput = document.getElementById('newGroupName');
    const name = groupNameInput.value.trim();
    
    if (!name) {
        alert("Please enter a group name");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/groups/create`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name }) // Simplified payload
        });

        if (res.ok) {
            const modal = document.getElementById('createGroupModal');
            if (modal) modal.style.display = 'none'; // Ensure this matches your CSS
            groupNameInput.value = '';
            
            // REFRESH DATA
            await loadGroups(); 
            alert("Group created!");
        } else {
            const err = await res.json();
            alert(err.error || "Failed to create group");
        }
    } catch (err) {
        console.error("Group creation error:", err);
    }
}

// --- SOCKET EVENT HANDLERS ---
socket.on('receive_message', (msg) => {
    console.log('Incoming message:', msg);
    if (!activeChat) return;

    const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
    const myId = (currentUser.id || currentUser._id).toString();

    let isForCurrentChat = false;

    if (activeChat.isGroup) {
        if (msg.group === activeChat.id) isForCurrentChat = true;
    } else {
        // Match by Sender OR Receiver
        const isFromPartner = (senderId === activeChat.id);
        const isToPartner = (msg.receiver === activeChat.id || msg.recipient === activeChat.id);
        
        if (isFromPartner || (senderId === myId && isToPartner)) {
            isForCurrentChat = true;
        }
    }

    if (isForCurrentChat) {
        appendMessage(msg);
        const container = document.getElementById('messagesContainer');
        container.scrollTop = container.scrollHeight;
    }
});

socket.on('message_sent', (msg) => {
    console.log('Message sent confirmation:', msg);
    appendMessage(msg);
});

socket.on('ai_typing', (data) => {
    console.log('AI typing:', data.isTyping);
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    const typingIndicator = container.querySelector('.typing-indicator');
    
    if (data.isTyping && !typingIndicator) {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <div class="message received">
                <div class="message-bubble">
                    <div class="typing-dots">
                        <span></span><span></span><span></span>
                    </div>
                </div>
            </div>`;
        container.appendChild(indicator);
        container.scrollTop = container.scrollHeight;
    } else if (!data.isTyping && typingIndicator) {
        typingIndicator.remove();
    }
});

socket.on('message_error', (error) => {
    console.error('Socket message error:', error);
    alert(error.error || 'Failed to send message');
});

socket.on('connect', () => {
    console.log('Socket connected successfully');
});

socket.on('disconnect', () => {
    console.log('Socket disconnected');
});

// ✅ Listen for user status changes
socket.on('user_status_changed', (data) => {
    console.log('User status changed:', data);
    const { userId, isOnline } = data;
    
    // Update UI for this user
    const userElement = document.querySelector(`[data-user-id="${userId}"]`);
    if (userElement) {
        const statusElement = userElement.querySelector('.status-online, .status-offline');
        if (statusElement) {
            statusElement.className = isOnline ? 'status-online' : 'status-offline';
            statusElement.textContent = isOnline ? '● Online' : 'Offline';
        }
    }
});

// --- APPEND MESSAGE TO UI ---
function appendMessage(msg) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;
    
    // Remove placeholders
    const placeholder = container.querySelector('.loading, .no-messages, .error-msg');
    if (placeholder) placeholder.remove();

    const senderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
    const senderName = typeof msg.sender === 'object' ? msg.sender.name : 'User';
    const isSent = senderId === (currentUser.id || currentUser._id);
    
    // Handle images
    let contentHTML = '';
    if (msg.imageUrl) {
        contentHTML = `<img src="${msg.imageUrl}" class="message-image" onclick="openImageModal('${msg.imageUrl}')" alt="Image">`;
    }
    if (msg.content && msg.content !== '[Image]') {
        contentHTML += `<p>${escapeHtml(msg.content)}</p>`;
    }
    
    const timestamp = msg.timestamp || msg.createdAt || Date.now();
    const timeStr = new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    const msgHTML = `
        <div class="message ${isSent ? 'sent' : 'received'}">
            <div class="message-bubble">
                ${!isSent && activeChat?.isGroup ? `<small style="display:block; font-weight:bold; color:#007bff; margin-bottom:4px;">${senderName}</small>` : ''}
                ${contentHTML}
                <span class="message-time">${timeStr}</span>
            </div>
        </div>`;
    
    container.insertAdjacentHTML('beforeend', msgHTML);
    container.scrollTop = container.scrollHeight;
}

// --- HELPER FUNCTIONS ---
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openImageModal(imageUrl) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="image-modal-content">
            <span class="close-modal" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <img src="${imageUrl}" alt="Full size image">
        </div>
    `;
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    document.body.appendChild(modal);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// --- EVENT LISTENERS ---
document.getElementById('messageInput')?.addEventListener('keypress', (e) => { 
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

document.getElementById('sendBtn')?.addEventListener('click', sendMessage);
document.getElementById('confirmCreateGroup')?.addEventListener('click', createNewGroup);
document.getElementById('imageInput')?.addEventListener('change', sendImage);
document.getElementById('emojiBtn')?.addEventListener('click', toggleEmojiPicker);

// --- AUTO-LOAD ---
loadInitialData();

// --- MAKE FUNCTIONS GLOBAL ---
window.openChat = openChat;
window.loadMessages = loadMessages;
window.sendMessage = sendMessage;
window.sendImage = sendImage;
window.createNewGroup = createNewGroup;
window.openImageModal = openImageModal;
window.insertEmoji = insertEmoji;
window.toggleEmojiPicker = toggleEmojiPicker;
window.logout = logout;


console.log('All functions loaded and ready!');

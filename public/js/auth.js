const API_URL = window.location.origin + '/api';

// ==================== LOGIN HANDLER ====================
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const loginBtn = document.getElementById('loginBtn');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Validate
        if (!email || !password) {
            showError('Please fill in all fields');
            return;
        }
        
        // Show loading state
        setLoading(true);
        hideError();
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            console.log('Login response:', data);
            
            if (response.ok) {
                // ✅ CRITICAL: Save token and user to localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                console.log('Login successful! Token saved:', data.token);
                
                // Redirect to chat
                window.location.href = '/index.html';
            } else {
                // Show error from server
                showError(data.error || 'Login failed. Please try again.');
                setLoading(false);
            }
            
        } catch (error) {
            console.error('Login error:', error);
            showError('Network error. Please check your connection.');
            setLoading(false);
        }
    });
}

// ==================== REGISTER HANDLER ====================
const registerForm = document.getElementById('registerForm');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        
        // Validate
        if (!name || !email || !password) {
            showError('Please fill in all fields');
            return;
        }
        
        if (password.length < 6) {
            showError('Password must be at least 6 characters long');
            return;
        }
        
        if (confirmPassword && password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }
        
        // Show loading state
        setLoading(true);
        hideError();
        
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });
            
            const data = await response.json();
            console.log('Register response:', data);
            
            if (response.ok) {
                // ✅ Save token and user
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                
                console.log('Registration successful! Token saved:', data.token);
                
                // Redirect to chat
                window.location.href = '/index.html';
            } else {
                // Show error from server
                showError(data.error || 'Registration failed. Please try again.');
                setLoading(false);
            }
            
        } catch (error) {
            console.error('Register error:', error);
            showError('Network error. Please check your connection.');
            setLoading(false);
        }
    });
}

// ==================== HELPER FUNCTIONS ====================
function showError(message) {
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }
}

function hideError() {
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

function setLoading(loading) {
    if (loginBtn || registerForm) {
        const btn = loginBtn || document.querySelector('.btn-primary');
        const text = btnText || document.querySelector('.btn-text');
        const loader = btnLoader || document.querySelector('.btn-loader');
        
        if (btn) btn.disabled = loading;
        if (text) text.style.display = loading ? 'none' : 'inline';
        if (loader) loader.style.display = loading ? 'inline' : 'none';
    }
}

// ==================== CHECK IF ALREADY LOGGED IN ====================
// Redirect to chat if already logged in
const currentPath = window.location.pathname;
if ((currentPath === '/login.html' || currentPath === '/register.html')) {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        console.log('Already logged in, redirecting to chat...');
        window.location.href = '/index.html';
    }
}


console.log('Auth.js loaded successfully');

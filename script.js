
// DOM Element References
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreElement = document.getElementById('finalScore');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const leaderboardList = document.getElementById('leaderboardList');
const personalScoresList = document.getElementById('personalScoresList');
const currentGameName = document.getElementById('currentGameName');
const personalGameName = document.getElementById('personalGameName');
const welcomeMessage = document.getElementById('welcomeMessage');
const leaderboardSearch = document.getElementById('leaderboardSearch');

// UI Elements
const copyrightIcon = document.getElementById('copyrightIcon');
const popupMessage = document.getElementById('popupMessage');
const closePopup = document.getElementById('closePopup');

// Game State
let username = localStorage.getItem('username') || null;
let paddleHeight = 10;
let paddleWidth = 75;
let paddleX;
let ballRadius = 10;
let ballX;
let ballY;
let ballDx = 2;
let ballDy = 2;
let score = 0;
let speedIncreaseFactor = 1.1;
let isDragging = false;
let highScore = localStorage.getItem('highScore') || 0;
let currentLeaderboardGame = 'catch-the-ball';
let currentView = 'global';
let currentSearchQuery = '';
let personalScoresCache = [];

// Initialize Canvas
canvas.width = canvas.offsetWidth;
canvas.height = 320;

// Event Listeners
copyrightIcon.addEventListener('click', () => popupMessage.classList.remove('hidden'));
closePopup.addEventListener('click', () => popupMessage.classList.add('hidden'));

// Username Handling
function initializeUsername() {
    if (!username || username === "null") {
        username = "Player";
        localStorage.setItem('username', username);
    }
    displayUsername();
    highScoreDisplay.textContent = highScore;
}

function renameUsername() {
    const modal = document.getElementById('usernameEditModal');
    const input = document.getElementById('newUsernameInput');
    input.value = username;
    modal.classList.remove('hidden');
    input.focus();
}

function saveNewUsername() {
    const input = document.getElementById('newUsernameInput');
    const newUsername = input.value.trim();
    
    if (newUsername && newUsername !== username) {
        username = newUsername;
        localStorage.setItem('username', username);
        displayUsername();
        
        if (!document.getElementById('leaderboardModal').classList.contains('hidden')) {
            fetchLeaderboard();
        }
    }
    closeUsernameEditModal();
}

function closeUsernameEditModal() {
    document.getElementById('usernameEditModal').classList.add('hidden');
}

document.getElementById('newUsernameInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') saveNewUsername();
});

document.getElementById('usernameEditModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('usernameEditModal')) {
        closeUsernameEditModal();
    }
});

function displayUsername() {
    document.getElementById('usernameText').textContent = username;
}

// Game Logic
function initGame() {
    paddleX = (canvas.width - paddleWidth) / 2;
    ballX = canvas.width / 2;
    ballY = ballRadius;
    ballDx = 2;
    ballDy = 2;
    score = 0;
    isDragging = false;
    
    gameOverModal.classList.add('hidden');
    document.getElementById('leaderboardModal').classList.add('hidden');
    draw();
}

function gameOver() {
    finalScoreElement.textContent = score;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreDisplay.textContent = highScore;
        highScoreMessage.textContent = "🎉 New High Score! 🎉";
    } else {
        highScoreMessage.textContent = `Current High Score: ${highScore}`;
    }

    saveScore();
    gameOverModal.classList.remove('hidden');
}

// Drawing Functions
function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText(`Score: ${score}`, 8, 20);
    ctx.fillText(`High Score: ${highScore}`, canvas.width - 120, 20);
}

function moveBall() {
    ballX += ballDx;
    ballY += ballDy;

    // Wall collisions
    if (ballX + ballDx > canvas.width - ballRadius || ballX + ballDx < ballRadius) {
        ballDx = -ballDx;
    }

    // Paddle collision
    if (ballY + ballDy > canvas.height - ballRadius) {
        if (ballX > paddleX && ballX < paddleX + paddleWidth) {
            ballDy = -ballDy;
            score++;
            ballDx *= speedIncreaseFactor;
            ballDy *= speedIncreaseFactor;
        } else {
            gameOver();
        }
    } else if (ballY + ballDy < ballRadius) {
        ballDy = -ballDy;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
    drawPaddle();
    drawScore();
    moveBall();

    if (ballY + ballDy <= canvas.height - ballRadius || 
       (ballX > paddleX && ballX < paddleX + paddleWidth)) {
        requestAnimationFrame(draw);
    }
}

// Leaderboard Functions
function saveScore() {
    fetch('http://localhost:8000/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username,
            score,
            game: 'catch-the-ball'
        })
    }).then(fetchLeaderboard);
}

function updateLeaderboard() {
    currentLeaderboardGame = document.getElementById('gameSelector').value;
    if (currentView === 'global') {
        fetchLeaderboard();
    } else {
        fetchPersonalScores();
    }
}

function handleLeaderboardSearch(e) {
    currentSearchQuery = e.target.value.trim().toLowerCase();
    showWelcomeIfCurrentUser();
    
    if (currentView === 'global') {
        fetchLeaderboard();
    } else {
        filterPersonalScores();
    }
}

function showWelcomeIfCurrentUser() {
    if (currentSearchQuery === username.toLowerCase()) {
        welcomeMessage.classList.remove('hidden');
        welcomeMessage.innerHTML = `🎮 Welcome ${username}! Here are your results:`;
    } else {
        welcomeMessage.classList.add('hidden');
    }
}

function fetchLeaderboard() {
    const url = currentSearchQuery 
        ? `http://localhost:8000/search?game=${currentLeaderboardGame}&username=${currentSearchQuery}`
        : `http://localhost:8000/leaderboard?game=${currentLeaderboardGame}`;

    leaderboardList.innerHTML = '<li class="loading">Loading...</li>';
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            currentGameName.textContent = data.game;
            leaderboardList.innerHTML = data.scores.map((entry, index) => `
                <li class="leaderboard-entry">
                    <span class="rank-badge">${index + 1}.</span>
                    <span class="username">${entry.username || 'Anonymous'}</span>
                    <span class="score-value">${entry.score}</span>
                </li>
            `).join('');
        })
        .catch(() => {
            leaderboardList.innerHTML = '<li class="error">Failed to load leaderboard</li>';
        });
}

function fetchPersonalScores() {
    fetch(`http://localhost:8000/scores/${username}?game=${currentLeaderboardGame}`)
        .then(response => response.json())
        .then(data => {
            personalScoresCache = data.scores;
            filterPersonalScores();
        })
        .catch(console.error);
}

// Updated filterPersonalScores function
function filterPersonalScores() {
    const filtered = personalScoresCache.filter(score => {
        const searchTerm = currentSearchQuery.toLowerCase().trim();
        const scoreUsername = score.username?.toLowerCase().trim() || '';
        return scoreUsername.includes(searchTerm);
    });
    
    personalScoresList.innerHTML = filtered.map(score => `
        <li class="personal-entry">
            <span class="score-date">${new Date(score.date).toLocaleDateString()}</span>
            <span class="score-game">${score.game}</span>
            <span class="score-value">${score.score}</span>
        </li>
    `).join('');

    // Show message if no results
    if (filtered.length === 0) {
        personalScoresList.innerHTML = `
            <li class="no-results">
                No scores found for "${currentSearchQuery}"
            </li>
        `;
    }
}

// Modified toggle function
function toggleLeaderboardView(viewType) {
    currentView = viewType;
    currentSearchQuery = ''; // Reset search on view change
    leaderboardSearch.value = ''; // Clear input field
    
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase() === viewType);
    });

    document.getElementById('globalLeaderboard').classList.toggle('hidden', viewType !== 'global');
    document.getElementById('personalLeaderboard').classList.toggle('hidden', viewType !== 'personal');

    if (viewType === 'personal') {
        personalGameName.textContent = document.getElementById('gameSelector').value.replace(/-/g, ' ');
        fetchPersonalScores();
    } else {
        fetchLeaderboard();
    }
}
// Enhanced search handler
function handleLeaderboardSearch(e) {
    currentSearchQuery = e.target.value.trim();
    showWelcomeIfCurrentUser();
    
    // Debounce search to prevent rapid API calls
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        if (currentView === 'global') {
            fetchLeaderboard();
        } else {
            filterPersonalScores();
        }
    }, 300);
}

// Improved game switching
function updateLeaderboard() {
    currentLeaderboardGame = document.getElementById('gameSelector').value;
    currentSearchQuery = '';
    leaderboardSearch.value = '';
    
    if (currentView === 'global') {
        fetchLeaderboard();
    } else {
        personalGameName.textContent = 
            document.getElementById('gameSelector').value.replace(/-/g, ' ');
        fetchPersonalScores();
    }
}
function closeLeaderboardModal() {
    document.getElementById('leaderboardModal').classList.add('hidden');
}

function viewLeaderboard() {
    const modal = document.getElementById('leaderboardModal');
    modal.classList.remove('hidden');
    fetchLeaderboard();
}

function restartGame() {
    gameOverModal.classList.add('hidden');
    initGame();
}

// Input Handlers
canvas.addEventListener("touchstart", (e) => {
    const relativeX = e.touches[0].clientX - canvas.offsetLeft;
    isDragging = (relativeX > paddleX && relativeX < paddleX + paddleWidth);
});

canvas.addEventListener("touchmove", (e) => {
    if (isDragging) {
        const relativeX = e.touches[0].clientX - canvas.offsetLeft;
        paddleX = Math.max(0, Math.min(relativeX - paddleWidth/2, canvas.width - paddleWidth));
    }
});

canvas.addEventListener("touchend", () => (isDragging = false));

canvas.addEventListener("mousemove", (e) => {
    const relativeX = e.clientX - canvas.offsetLeft;
    paddleX = Math.max(0, Math.min(relativeX - paddleWidth/2, canvas.width - paddleWidth));
});

// Initialize Game
initializeUsername();
initGame();
fetchLeaderboard();
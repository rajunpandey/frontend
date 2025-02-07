const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreElement = document.getElementById('finalScore');
const highScoreDisplay = document.getElementById('highScoreDisplay');
const leaderboardList = document.getElementById('leaderboardList');
const highScoreMessage = document.getElementById('highScoreMessage');
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
let ballDx;
let ballDy;
let score;
let speedIncreaseFactor = 1.1;
let isDragging = false;
let highScore = localStorage.getItem('highScore') || 0;

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
}

function renameUsername() {
    const newUsername = prompt('Enter new username:', username);
    if (newUsername !== null && newUsername.trim() !== '') {
        username = newUsername.trim();
        localStorage.setItem('username', username);
        displayUsername();
        if (!document.getElementById('leaderboardModal').classList.contains('hidden')) {
            fetchLeaderboard();
        }
    }
}

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
    highScoreDisplay.textContent = highScore;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
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
        body: JSON.stringify({ username, score })
    })
    .then(response => response.json())
    .then(fetchLeaderboard)
    .catch(console.error);
}

// Update fetchLeaderboard function
function fetchLeaderboard() {
    leaderboardList.innerHTML = '<li>Loading...</li>';
    
    fetch('http://localhost:8000/leaderboard')
        .then(response => {
            if (!response.ok) throw new Error('Server error');
            return response.json();
        })
        .then(data => {
            console.log('Leaderboard data:', data); // Debugging: Log the data
            leaderboardList.innerHTML = '';

            // Handle empty leaderboard
            if (data.message) {
                leaderboardList.innerHTML = `<li>${data.message}</li>`;
                return;
            }

            // Display top 10 scores
            data.forEach((entry, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${index + 1}.</span>
                    <span>${entry.username}</span>
                    <span>${entry.score}</span>
                `;
                leaderboardList.appendChild(li);
            });
        })
        .catch(error => {
            console.error(error);
            leaderboardList.innerHTML = '<li>Error loading leaderboard</li>';
        });
}
// Add close function
function closeLeaderboardModal() {
    document.getElementById('leaderboardModal').classList.add('hidden');
}
// Modal Controls
function viewLeaderboard() {
    const modal = document.getElementById('leaderboardModal');
    modal.classList.remove('hidden');
    fetchLeaderboard();
}

function closeLeaderboardModal() {
    document.getElementById('leaderboardModal').classList.add('hidden');
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
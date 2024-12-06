// DOM Elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverMessage = document.getElementById('gameOverMessage');
const finalScoreElement = document.getElementById('finalScore');
const highScoreMessage = document.getElementById('highScoreMessage');
const restartBtn = document.getElementById('restartBtn');

const popupMessage = document.getElementById('submitScorePopup');
const playerNameInput = document.getElementById('playerName');
const playerEmailInput = document.getElementById('playerEmail');
const submitScoreBtn = document.getElementById('submitScoreBtn');

// Set canvas size
canvas.width = canvas.offsetWidth;
canvas.height = 320;

// Game variables
const paddleHeight = 10;
const paddleWidth = 75;
let paddleX;
const ballRadius = 10;
let ballX;
let ballY;
let ballDx;
let ballDy;
let score;
let isGameRunning = true;
let highScore = localStorage.getItem('highScore') || 0;
const gameId = "your-game-id"; // Replace with your actual game ID

// Initialize the game
function initGame() {
    paddleX = (canvas.width - paddleWidth) / 2;
    ballX = canvas.width / 2;
    ballY = ballRadius;
    ballDx = 2;
    ballDy = 2;
    score = 0;
    isGameRunning = true;

    popupMessage.classList.add('hidden');
    gameOverMessage.classList.remove('show');
    restartBtn.style.display = "none";

    draw(); // Start the game loop
}

// Draw the ball
function drawBall() {
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

// Draw the paddle
function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
}

// Draw the score
function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText(`Score: ${score}`, 8, 20);
    ctx.fillText(`High Score: ${highScore}`, canvas.width - 140, 20);
}

// Move the ball and handle collisions
function moveBall() {
    if (!isGameRunning) return;

    ballX += ballDx;
    ballY += ballDy;

    // Ball collision with walls
    if (ballX + ballDx > canvas.width - ballRadius || ballX + ballDx < ballRadius) {
        ballDx = -ballDx;
    }
    if (ballY + ballDy < ballRadius) {
        ballDy = -ballDy;
    } else if (ballY + ballDy > canvas.height - ballRadius) {
        // Ball hits paddle or game over
        if (ballX > paddleX && ballX < paddleX + paddleWidth) {
            ballDy = -ballDy;
            score++;
        } else {
            gameOver();
        }
    }
}

// Handle game over
function gameOver() {
    isGameRunning = false;
    finalScoreElement.textContent = score;

    popupMessage.classList.remove('hidden');
    submitScoreBtn.onclick = async () => {
        const playerName = playerNameInput.value.trim();
        const playerEmail = playerEmailInput.value.trim();

        if (!playerName || !playerEmail) {
            alert("Name and email are required to save your score.");
            return;
        }

        try {
            const userId = await createUser(playerName, playerEmail);  // Create user first
            await saveScore(userId, gameId, score);  // Save the score after user is created

            if (score > highScore) {
                highScore = score;
                localStorage.setItem('highScore', highScore);
                highScoreMessage.textContent = "Congratulations! You set a new high score!";
            } else {
                highScoreMessage.textContent = "";
            }

            popupMessage.classList.add('hidden');
            gameOverMessage.classList.add('show');
            restartBtn.style.display = "block";
        } catch (error) {
            alert('Failed to save your score. Please try again.');
        }
    };
}

// Create a user
async function createUser(name, email) {
    const response = await fetch('http://localhost:6000/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),  // Fixed JSON structure
    });

    if (!response.ok) throw new Error(`Failed to create user: ${response.status}`);
    const data = await response.json();
    return data._id;  // Return the user ID from the response
}

// Save the score
async function saveScore(userId, gameId, score) {
    const response = await fetch('http://localhost:6000/scores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userid: userId, gameid: gameId, score })
    });

    if (!response.ok) throw new Error(`Failed to save score: ${response.status}`);
}

// Restart the game
function restartGame() {
    popupMessage.classList.add('hidden');
    gameOverMessage.classList.remove('show');
    restartBtn.style.display = "none";
    initGame();
}

// Main draw loop
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBall();
    drawPaddle();
    drawScore();
    moveBall();

    if (isGameRunning) {
        requestAnimationFrame(draw);
    }
}

// Handle mouse movement for paddle
canvas.addEventListener("mousemove", (e) => {
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
    }
});

// Handle touch movement for paddle
canvas.addEventListener("touchstart", (e) => {
    const relativeX = e.touches[0].clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = relativeX - paddleWidth / 2;
    }
});

// Start the game on page load
initGame();

// Restart button listener
restartBtn.addEventListener('click', restartGame);

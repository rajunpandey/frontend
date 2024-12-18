
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
canvas.width = canvas.clientWidth || 800;
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
let username;
let userId;
let gameId = "defaultGame"; 

// Backend URL
const backendURL = 'http://localhost:8000';

// Check if user data exists in localStorage
const userData = JSON.parse(localStorage.getItem('userData'));
if (userData && userData.username && userData.userId) {
    username = userData.username;
    userId = userData.userId;
    console.log('User found:', userData);
    initGame();
} else {
    console.log('No user data found. Showing username form.'); 
    showUsernameForm(); // Show form to input username if data not found
}

// Display username form to capture name and user ID
function showUsernameForm() {
    const usernameForm = document.createElement('div');
    usernameForm.classList.add('form-container');
    
    usernameForm.innerHTML = `
        <label for="playerName">Enter Username: </label>
        <input type="text" id="playerName" required>
        <button id="submitUsernameBtn">Start Game</button>
    `;

    document.body.appendChild(usernameForm);

    const submitUsernameBtn = document.getElementById('submitUsernameBtn');
    submitUsernameBtn.addEventListener('click', async () => {
        const name = document.getElementById('playerName').value.trim();

        if (name) {
            console.log('Submitting username:', name); 
            try {
                const response = await fetch(`${backendURL}/users`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: name }),
                });

                if (!response.ok) {
                    console.error('Error submitting username:', response.statusText);
                    alert('Failed to create user. Please try again.');
                    return;
                }

                const data = await response.json();
                console.log('Backend response:', data); 

                username = data.username;
                userId = data.userId;
                
                // Save to localStorage
                localStorage.setItem('userData', JSON.stringify({ username, userId }));

                usernameForm.remove(); 
                initGame();  // Initialize the game after username submission
            } catch (error) {
                console.error('Error creating user:', error.message);
                alert('Error creating user. Please try again.');
            }
        } else {
            alert('Please enter a username.');
        }
    });
}

// Initialize the game
function initGame() {
    console.log('Initializing game for user:', { username, userId }); 

    paddleX = (canvas.width - paddleWidth) / 2;
    ballX = canvas.width / 2;
    ballY = canvas.height - 30;
    ballDx = 2;
    ballDy = -2;
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
    console.log('Game over. Final score:', score); 
    isGameRunning = false;
    finalScoreElement.textContent = score;

    popupMessage.classList.remove('hidden');
    submitScoreBtn.onclick = async () => {
        const playerEmail = playerEmailInput.value.trim();

        if (!playerEmail) {
            alert("Email is required to save your score.");
            return;
        }

        try {
            await saveScore(username, playerEmail, gameId, score);

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
            console.error('Error saving score:', error);
            alert(`Failed to save score: ${error.message}`);
        }
    };
}

// Save score to backend
async function saveScore(name, email, gameId, score) {
    try {
        const response = await fetch(`${backendURL}/scores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, gameId, score }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to save score: ${response.status}`);
        }
    } catch (error) {
        throw error;
    }
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

// Paddle movement: Mouse
canvas.addEventListener("mousemove", (e) => {
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = Math.max(0, Math.min(relativeX - paddleWidth / 2, canvas.width - paddleWidth));
    }
});

// Paddle movement: Touch
canvas.addEventListener("touchmove", (e) => {
    const relativeX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    if (relativeX > 0 && relativeX < canvas.width) {
        paddleX = Math.max(0, Math.min(relativeX - paddleWidth / 2, canvas.width - paddleWidth));
    }
});

// Restart button listener
restartBtn.addEventListener('click', restartGame);

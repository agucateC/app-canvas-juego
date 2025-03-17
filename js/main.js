const canvas = document.getElementById("canvas");
const startButton = document.getElementById("startButton");
const startGameButton = document.getElementById("startGame");
const restartButton = document.createElement("button");

// Configuración del botón de reinicio
restartButton.textContent = "Reiniciar";
restartButton.style.display = "none";
restartButton.style.position = "absolute";
restartButton.style.top = "350px";
restartButton.style.left = "50%";
restartButton.style.transform = "translateX(-50%)";
document.body.appendChild(restartButton);

let ctx = canvas.getContext("2d");

const window_height = 300;
const window_width = 500;

canvas.height = window_height;
canvas.width = window_width;
canvas.style.background = "#ff8";

const scoreDisplay = document.getElementById("scoreDisplay");
const numImages = 10;
const images = [];
const imageSize = 50;
let fixedSpeed = 2;

let score = 0;
let highScore = 0;
let level = 1;
let gameOver = false;
let playerName = "";
let scoreHistory = [];

let cursor = { x: window_width / 2, y: window_height / 2, visible: true, follow: false };

const imageSrc = "https://png.pngtree.com/png-clipart/20231018/original/pngtree-floating-fire-ball-png-image_13354973.png";
const cursorSrc = "https://images.wikidexcdn.net/mwuploads/esssbwiki/7/7b/latest/20220510010814/Arte_oficial_del_Bob-omb_SSBU.png";
const loadedImages = [];

function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
    });
}

class MovingImage {
    constructor() {
        this.size = imageSize;
        this.speed = fixedSpeed;
        this.resetPosition();
    }

    resetPosition() {
        let side = Math.floor(Math.random() * 4);
        switch (side) {
            case 0:
                this.posX = Math.random() * (window_width - this.size);
                this.posY = -this.size;
                this.dy = this.speed;
                this.dx = 0;
                break;
            case 1:
                this.posX = window_width + this.size;
                this.posY = Math.random() * (window_height - this.size);
                this.dx = -this.speed;
                this.dy = 0;
                break;
            case 2:
                this.posX = Math.random() * (window_width - this.size);
                this.posY = window_height + this.size;
                this.dy = -this.speed;
                this.dx = 0;
                break;
            case 3:
                this.posX = -this.size;
                this.posY = Math.random() * (window_height - this.size);
                this.dx = this.speed;
                this.dy = 0;
                break;
        }
    }

    draw(context) {
        context.drawImage(loadedImages[0], this.posX, this.posY, this.size, this.size);
    }

    update(context) {
        this.posX += this.dx;
        this.posY += this.dy;

        if (
            this.posX < -this.size ||
            this.posX > window_width + this.size ||
            this.posY < -this.size ||
            this.posY > window_height + this.size
        ) {
            this.resetPosition();
            score++;
            updateScoreDisplay();
            if (score % 10 === 0) {
                level++;
                fixedSpeed += 0.5;
                images.forEach(image => image.speed = fixedSpeed);
            }
        }

        this.draw(context);
    }
}

function initImages() {
    images.length = 0; // Vaciar el array
    for (let i = 0; i < numImages; i++) {
        let image = new MovingImage();
        images.push(image);
    }
}

function drawCursor() {
    if (!cursor.visible) return;
    ctx.drawImage(loadedImages[1], cursor.x - imageSize / 2, cursor.y - imageSize / 2, imageSize, imageSize);
}

function checkCollision() {
    images.forEach(image => {
        let dx = cursor.x - (image.posX + imageSize / 2);
        let dy = cursor.y - (image.posY + imageSize / 2);
        let distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < imageSize / 2) {
            gameOver = true;
            saveScore();
            restartButton.style.display = "block";
        }
    });
}

function drawGameOverMessage() {
    ctx.fillStyle = "red";
    ctx.font = "30px Arial";
    ctx.fillText("GAME OVER", window_width / 2 - 70, window_height / 2);
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `Jugador: ${playerName} | Score: ${score} | High Score: ${highScore} | Level: ${level}`;
}

function saveScore() {
    scoreHistory.push({ name: playerName, score: score });
    console.log("Historial de puntajes:", scoreHistory);
}

function resetGame() {
    score = 0;
    level = 1;
    fixedSpeed = 2;
    cursor.visible = true;
    cursor.x = window_width / 2;
    cursor.y = window_height / 2;
    gameOver = false;
    restartButton.style.display = "none"; // Ocultar el botón de reinicio

    initImages(); // Reiniciar las imágenes con nuevas posiciones
    updateScoreDisplay();
    updateGame();
}

function updateGame() {
    if (gameOver) {
        ctx.clearRect(0, 0, window_width, window_height);
        drawGameOverMessage();
        return;
    }

    requestAnimationFrame(updateGame);
    ctx.clearRect(0, 0, window_width, window_height);
    images.forEach(image => image.update(ctx));
    checkCollision();
    drawCursor();
}

canvas.addEventListener("mousemove", (event) => {
    if (cursor.follow) {
        const rect = canvas.getBoundingClientRect();
        cursor.x = event.clientX - rect.left;
        cursor.y = event.clientY - rect.top;
    }
});

canvas.addEventListener("mousedown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    let dx = clickX - cursor.x;
    let dy = clickY - cursor.y;
    let distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < imageSize / 2) {
        cursor.follow = true;
    }
});

canvas.addEventListener("mouseup", () => {
    cursor.follow = false;
});

const nameModal = document.getElementById("nameModal");
const playerNameInput = document.getElementById("playerNameInput");
const saveNameButton = document.getElementById("saveNameButton");

// Mostrar el modal al hacer clic en "Comenzar"
startGameButton.addEventListener("click", function () {
    document.getElementById("welcomeScreen").style.display = "none";
    nameModal.style.display = "flex"; // Mostrar el modal
});

// Guardar el nombre y cerrar el modal al hacer clic en "Aceptar"
saveNameButton.addEventListener("click", function () {
    playerName = playerNameInput.value.trim();
    if (!playerName) playerName = "Jugador anónimo"; // Si está vacío, usar un nombre genérico

    updateScoreDisplay();
    nameModal.style.display = "none"; // Ocultar el modal
});

// El botón "Iniciar" ahora solo inicia el juego
startButton.addEventListener("click", async () => {
    cursor.visible = true;
    cursor.follow = false;
    cursor.x = window_width / 2;
    cursor.y = window_height / 2;
    
    loadedImages[0] = await loadImage(imageSrc);
    loadedImages[1] = await loadImage(cursorSrc);
    
    initImages(); // Inicializar las imágenes correctamente al inicio
    updateGame();
    updateScoreDisplay();
});

restartButton.addEventListener("click", resetGame);

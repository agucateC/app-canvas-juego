const canvas = document.getElementById("canvas");
const startButton = document.getElementById("startButton");
const startGameButton = document.getElementById("startGame");
const restartButton = document.getElementById("restartButton");
const nameModal = document.getElementById("nameModal");
const playerNameInput = document.getElementById("playerNameInput");
const saveNameButton = document.getElementById("saveNameButton");
const collisionSound = new Audio("sonido/explosion.mp3");
const backgroundMusic = new Audio("sonido/fondo.mp3");

backgroundMusic.loop = true;
backgroundMusic.volume = 0.5; // Ajusta el volumen si es necesario
// Configuración del botón de reinicio
/*restartButton.textContent = "Reiniciar";
restartButton.style.display = "none";
restartButton.style.position = "absolute";
restartButton.style.top = "350px";
restartButton.style.left = "50%";
restartButton.style.transform = "translateX(-50%)";
document.body.appendChild(restartButton);*/
// Crear el botón "Quit"
const quitButton = document.createElement("button");
quitButton.textContent = "Quit";
quitButton.classList.add("quit-button");
document.body.appendChild(quitButton);
quitButton.style.display = "none"; // Oculto al inicio

const instructions = document.getElementById("instructions");

// Ocultar las instrucciones al hacer clic
instructions.addEventListener("click", () => {
    instructions.style.display = "none";
});

const welcomeScreen = document.getElementById("welcomeScreen");


let ctx = canvas.getContext("2d");

const window_height = 400;
const window_width = 700;

canvas.height = window_height;
canvas.width = window_width;
canvas.style.background = "#3e4349c8";

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
let particles = [];

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = Math.random() * 4 + 2;
        this.color = color;
        this.velocity = {
            x: (Math.random() - 0.5) * 5,
            y: (Math.random() - 0.5) * 5
        };
        this.alpha -= 0.005;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.02;
    }
}

function createExplosion(x, y) {
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y, `hsl(${Math.random() * 50}, 100%, 50%)`));
    }
}

function checkCollision() {
    images.forEach(image => {
        let dx = cursor.x - (image.posX + imageSize / 2);
        let dy = cursor.y - (image.posY + imageSize / 2);
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < imageSize / 2 + 5) {
            cursor.visible = false; // 🚀 Ocultar el cursor
            createExplosion(cursor.x, cursor.y); // 💥 Explosión en la posición del cursor
            collisionSound.play();

            setTimeout(() => {
                gameOver = true;
                saveScore();
                restartButton.style.display = "block";
            }, 500); 
        }
    });
}


function drawGameOverMessage() {
    ctx.fillStyle = "red";
    ctx.font = "30px Honk";
    ctx.fillText("GAME OVER", window_width / 2 - 70, window_height / 2);
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `Jugador: ${playerName} | Score: ${score} | High Score: ${highScore} | Level: ${level}`;
}

function saveScore() {
    let scoreHistory = JSON.parse(localStorage.getItem("scoreHistory")) || [];

    // Buscar si el jugador ya tiene un puntaje registrado
    let existingPlayer = scoreHistory.find(entry => entry.name === playerName);

    if (existingPlayer) {
        // Si el nuevo puntaje es mayor, actualizarlo
        if (score > existingPlayer.score) {
            existingPlayer.score = score;
        }
    } else {
        // Si es la primera vez que juega, añadirlo
        scoreHistory.push({ name: playerName, score: score });
    }

    // Guardar en localStorage
    localStorage.setItem("scoreHistory", JSON.stringify(scoreHistory));

    // Actualizar el highScore mostrado
    highScore = Math.max(highScore, score);
}

function loadHighScore() {
    let scoreHistory = JSON.parse(localStorage.getItem("scoreHistory")) || [];
    let playerRecord = scoreHistory.find(entry => entry.name === playerName);
    highScore = playerRecord ? playerRecord.score : 0;
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `Jugador: ${playerName} | Score: ${score} | High Score: ${highScore} | Level: ${level}`;
}

// Cargar el high score del jugador al iniciar sesión
saveNameButton.addEventListener("click", function () {
    playerName = playerNameInput.value.trim() || "Jugador anónimo";
    loadHighScore(); // Cargar el puntaje más alto registrado del jugador
    updateScoreDisplay();
    nameModal.style.display = "none"; // Ocultar el modal
});



function resetGame() {
    score = 0;
    level = 1;
    fixedSpeed = 2;
    cursor.visible = true; // ✅ Hacer que el cursor reaparezca
    cursor.x = window_width / 2;
    cursor.y = window_height / 2;
    gameOver = false;
    restartButton.style.display = "none";

    initImages();
    updateScoreDisplay();
    updateGame();
}


function updateGame() {
    ctx.clearRect(0, 0, window_width, window_height);

    if (gameOver) {
        drawGameOverMessage();
        return;
    }

    // Dibujar partículas de explosión
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
        }
    }

    images.forEach(image => image.update(ctx));
    checkCollision();
    drawCursor();

    requestAnimationFrame(updateGame); // Asegurar que la animación no se detenga
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



// Mostrar el modal al hacer clic en "Comenzar"
startGameButton.addEventListener("click", function () {
    document.getElementById("welcomeScreen").style.display = "none";
    nameModal.style.display = "flex"; // Mostrar el modal
});


// Guardar el nombre y cerrar el modal al hacer clic en "Aceptar"
saveNameButton.addEventListener("click", function () {
    playerName = playerNameInput.value.trim();
    if (!playerName) playerName = "Jugador anónimo"; // Si está vacío, usar un nombre genérico
    quitButton.style.display = "block"; // ✅ Mostrar el botón "Quit"


    updateScoreDisplay();
    nameModal.style.display = "none"; // Ocultar el modal
});

function startBackgroundMusic() {
    backgroundMusic.play();
}
startBackgroundMusic(); 
// El botón "Iniciar" ahora solo inicia el juego
startButton.addEventListener("click", async () => {
    gameOver = false; // Asegurar que el juego inicie correctamente
    cursor.visible = true;
    cursor.follow = false;
    cursor.x = window_width / 2;
    cursor.y = window_height / 2;

    loadedImages[0] = await loadImage(imageSrc);
    loadedImages[1] = await loadImage(cursorSrc);

    images.length = 0; // Asegurar que no haya imágenes viejas
    initImages(); // Inicializar las imágenes correctamente al inicio

    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar canvas antes de iniciar
    updateGame();
    updateScoreDisplay();
});


restartButton.addEventListener("click", resetGame);
quitButton.addEventListener("click", function () {
    gameOver = true; // Detener el juego
    welcomeScreen.style.display = "flex"; // Mostrar pantalla de inicio
    quitButton.style.display = "none"; // Ocultar el botón "Quit"

    // Resetear variables del juego
    score = 0;
    level = 1;
    fixedSpeed = 2;
    cursor.visible = true;
    cursor.x = window_width / 2;
    cursor.y = window_height / 2;
    gameOver = false; // Evitar que el juego siga en estado de "Game Over"

    // Limpiar el array de imágenes
    images.length = 0;

    // Limpiar el nombre del jugador y la entrada del modal
    playerName = "";
    playerNameInput.value = "";

    // Limpiar el canvas para evitar que queden elementos visibles
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    restartButton.style.display = "none"; // Ocultar botón de reinicio si estaba visible
    updateScoreDisplay();
});

document.addEventListener('DOMContentLoaded', () => {

    function getRandomColor() {
        const minLightness = 30; // Минимальная светлота (0-100)
        const maxLightness = 100; // Максимальная светлота (0-100)

        // Генерируем случайные значения для красного, зеленого и синего цветов
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);

        // Преобразуем цвет в формат HSL (оттенок, насыщенность, светлота)
        const hslColor = `hsl(${r}, ${g}%, ${b}%)`;

        // Проверяем, соответствует ли цвет заданным критериям светлоты
        const lightness = getLightness(hslColor);
        if (lightness >= minLightness && lightness <= maxLightness) {
            return hslColor; // Возвращаем цвет, если он удовлетворяет условиям
        } else {
            // Если цвет слишком темный, повторяем процесс генерации
            return getRandomColor();
        }
    }
    // Функция для получения светлоты цвета
    function getLightness(color) {
        // Извлекаем светлоту из строки HSL цвета
        const match = color.match(/hsl\(\s*\d+\s*,\s*\d+\%\s*,\s*(\d+)\%\s*\)/);
        if (match && match[1]) {
            return parseInt(match[1]); // Возвращаем светлоту в виде числа
        } else {
            return 0; // Возвращаем 0, если не удалось получить светлоту
        }
    }
    class Snake {
        constructor(gameBoard) {
            this.gameBoard = gameBoard;
            this.reset();
        }

        reset() {
            this.body = [{ x: 10, y: 10 }];
            this.newSegments = 0;
            this.direction = { x: 1, y: 0 };
            this.nextDirection = { x: 1, y: 0 };
        }

        draw() {
            this.body.forEach(segment => {
                const snakeElement = document.createElement('div');
                snakeElement.style.gridRowStart = segment.y;
                snakeElement.style.gridColumnStart = segment.x;
                snakeElement.classList.add('snake');
                this.gameBoard.appendChild(snakeElement);
            });
        }

        update() {
            this.addSegments();
            const head = { x: this.body[0].x + this.nextDirection.x, y: this.body[0].y + this.nextDirection.y };
            this.body.unshift(head);
            this.body.pop();
            this.direction = this.nextDirection;
        }

        changeDirection(newDirection) {
            const oppositeDirection = this.direction.x === -newDirection.x && this.direction.y === -newDirection.y;
            if (!oppositeDirection) {
                this.nextDirection = newDirection;
            }
        }

        onSnake(position, { ignoreHead = false } = {}) {
            return this.body.some((segment, index) => {
                if (ignoreHead && index === 0) return false;
                return equalPositions(segment, position);
            });
        }

        getSnakeHead() {
            return this.body[0];
        }

        snakeIntersection() {
            return this.onSnake(this.body[0], { ignoreHead: true });
        }

        expandSnake(amount) {
            this.newSegments += amount;
        }

        addSegments() {
            for (let i = 0; i < this.newSegments; i++) {
                this.body.push({ ...this.body[this.body.length - 1] });
            }
            this.newSegments = 0;
        }
    }

    class Food {
        constructor(gameBoard) {
            this.gameBoard = gameBoard;
            this.position = this.getRandomFoodPosition();
            this.color = getRandomColor(); // Генерируем случайный цвет
        }

        draw() {
            const foodElement = document.createElement('div');
            foodElement.style.gridRowStart = this.position.y;
            foodElement.style.gridColumnStart = this.position.x;
            foodElement.classList.add('food');
            foodElement.style.backgroundColor = this.color; // Устанавливаем цвет элемента
            this.gameBoard.appendChild(foodElement);
        }

        update() {
            if (snake.onSnake(this.position)) {
                snake.expandSnake(1);
                this.position = this.getRandomFoodPosition();
                this.color = getRandomColor(); // Генерируем новый цвет для новой еды
                game.updateScore(1);
            }
        }

        getRandomFoodPosition() {
            let newFoodPosition;
            while (!newFoodPosition || snake.onSnake(newFoodPosition)) {
                newFoodPosition = { x: Math.floor(Math.random() * 20) + 1, y: Math.floor(Math.random() * 20) + 1 };
            }
            return newFoodPosition;
        }
    }

    let lastRenderTime = 0;
    let isPaused = false;
    const gameSpeed = 5;
    const gameBoard = document.getElementById('gameArea');
    const snake = new Snake(gameBoard);
    const food = new Food(gameBoard);
    let gameWidth = 20;
    let gameHeight = 20;

    function main(currentTime) {
        window.requestAnimationFrame(main);
        const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
        if (secondsSinceLastRender < 1 / gameSpeed) return;

        lastRenderTime = currentTime;

        update();
        draw();
    }

    window.requestAnimationFrame(main);

    function update() {
        snake.update();
        food.update();
        checkDeath();
    }

    function draw() {
        gameBoard.innerHTML = '';
        snake.draw();
        food.draw();
    }

    function checkDeath() {
        const hitWall =
            snake.getSnakeHead().x < 1 ||
            snake.getSnakeHead().x > gameWidth ||
            snake.getSnakeHead().y < 1 ||
            snake.getSnakeHead().y > gameHeight;
        if (hitWall || snake.snakeIntersection()) {
            console.log("Snake Died");
            isPaused = true;
            alert("Game Over! Press OK to restart.");
            window.location.reload();
        }
    }

    window.addEventListener('keydown', e => {
        switch (e.key) {
            case 'ArrowUp':
                snake.changeDirection({ x: 0, y: -1 });
                break;
            case 'ArrowDown':
                snake.changeDirection({ x: 0, y: 1 });
                break;
            case 'ArrowLeft':
                snake.changeDirection({ x: -1, y: 0 });
                break;
            case 'ArrowRight':
                snake.changeDirection({ x: 1, y: 0 });
                break;
        }
    });

    function equalPositions(pos1, pos2) {
        return pos1.x === pos2.x && pos1.y === pos2.y;
    }

    class Game {
        constructor() {
            this.score = 0;
            this.initializeBestScore();
        }

        updateScore(points) {
            this.score += points;
            document.getElementById('score').innerText = this.score;
            this.updateBestScore();
        }

        updateBestScore() {
            const bestScore = localStorage.getItem('bestScore') || 0;
            if (this.score > bestScore) {
                localStorage.setItem('bestScore', this.score);
                document.getElementById('bestScore').innerText = this.score;
            }
        }

        initializeBestScore() {
            const bestScore = localStorage.getItem('bestScore') || 0;
            document.getElementById('bestScore').innerText = bestScore;
        }

        resetGame() {
            this.score = 0;
            const scoreElement = document.getElementById('score');
            if (scoreElement) scoreElement.innerText = this.score;
            snake.reset();
            food.position = food.getRandomFoodPosition();
        }
    }

    const game = new Game();

    document.getElementById('pauseBtn').addEventListener('click', function () {
        isPaused = !isPaused;
        this.textContent = isPaused ? "Resume" : "Pause";
    });

    function main(currentTime) {
        if (!isPaused) {
            window.requestAnimationFrame(main);
            const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000;
            if (secondsSinceLastRender < 1 / gameSpeed) return;

            lastRenderTime = currentTime;

            update();
            draw();
        } else {
            window.requestAnimationFrame(main);
        }
    }

    window.requestAnimationFrame(main);

    document.getElementById('startBtn').addEventListener('click', function () {
        const gridSize = parseInt(document.getElementById('gridSize').value);
        gameWidth = gridSize;
        gameHeight = gridSize;
        setupGameArea(gridSize);
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameArea').style.display = 'block';
        startGame();
    });

    function setupGameArea(gridSize) {
        const gameArea = document.getElementById('gameArea');
        gameArea.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        gameArea.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
    }

    function startGame() {
        game.resetGame();
        isPaused = false;
        document.getElementById('pauseBtn').textContent = "Pause";
        window.requestAnimationFrame(main);
    }

});
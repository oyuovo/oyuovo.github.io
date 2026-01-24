"use strict";
class DinoGame {
    constructor() {
        this.dinoX = 100;
        this.dinoY = 900;
        this.dinoWidth = 80;
        this.dinoHeight = 100;
        this.dinoJumping = false;
        this.jumpVelocity = 0;
        this.gravity = 0.6;
        this.groundY = 900;
        this.obstacles = [];
        this.score = 0;
        this.gameSpeed = 10;
        this.gameRunning = true;
        this.frameCount = 0;
        this.dinoImgs = [];
        this.currentDinoFrame = 0;
        this.frameCounter = 0;
        this.totalFrames = 5;
        this.framesPerAnimation = 10;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.gameOverElement = document.getElementById('gameOver');
        this.restartBtn = document.getElementById('restartBtn');
        this.loadDinoFrames();
        this.obstacleImg = new Image();
        this.obstacleImg.src = 'xianren1.png';
        this.obstacleImg2 = new Image();
        this.obstacleImg2.src = 'xianren2_1.png';
        this.bindEvents();
        Promise.all([
            this.allImagesLoaded(this.dinoImgs),
            this.imageLoaded(this.obstacleImg),
            this.imageLoaded(this.obstacleImg2)
        ]).then(() => {
            this.gameLoop();
        });
    }
    loadDinoFrames() {
        const dinoFramePaths = [
            'konglong a.png',
            'konglong a_1.png',
            'konglong a_2.png',
            'konglong a_3.png',
            'konglong a_4.png'
        ];
        for (const path of dinoFramePaths) {
            const img = new Image();
            img.src = path;
            this.dinoImgs.push(img);
        }
    }
    allImagesLoaded(images) {
        const promises = images.map(img => this.imageLoaded(img));
        return Promise.all(promises);
    }
    imageLoaded(img) {
        return new Promise((resolve) => {
            if (img.complete) {
                resolve();
            }
            else {
                img.onload = () => resolve();
            }
        });
    }
    bindEvents() {
        document.addEventListener('keydown', (e) => {
            if ((e.code === 'Space' || e.key === 'ArrowUp') && !this.dinoJumping) {
                this.jump();
            }
            if (e.code === 'Enter' && !this.gameRunning) {
                this.restart();
            }
        });
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.dinoJumping) {
                this.jump();
            }
        });
        this.canvas.addEventListener('click', (e) => {
            if (!this.dinoJumping) {
                this.jump();
            }
        });
        this.restartBtn.addEventListener('click', () => {
            this.restart();
        });
        this.restartBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.restart();
        });
    }
    jump() {
        if (!this.dinoJumping) {
            this.dinoJumping = true;
            this.jumpVelocity = -14;
        }
    }
    updateDino() {
        if (this.dinoJumping) {
            this.dinoY += this.jumpVelocity;
            this.jumpVelocity += this.gravity;
            if (this.dinoY >= this.groundY) {
                this.dinoY = this.groundY;
                this.dinoJumping = false;
                this.jumpVelocity = 0;
            }
        }
        else {
            this.frameCounter++;
            if (this.frameCounter >= this.framesPerAnimation) {
                this.currentDinoFrame = (this.currentDinoFrame + 1) % this.totalFrames;
                this.frameCounter = 0;
            }
        }
    }
    generateObstacle() {
        const minDistance = 700;
        for (const obstacle of this.obstacles) {
            if (obstacle.x > this.canvas.width - minDistance) {
                return;
            }
        }
        const obstacleType = Math.random();
        const singleProbability = 1 / 3;
        const doubleProbability = 2 / 3;
        if (obstacleType < singleProbability) {
            this.generateSingleObstacle();
        }
        else if (obstacleType < doubleProbability) {
            this.generateMultipleObstacles(2);
        }
        else {
            this.generateMultipleObstacles(3);
        }
    }
    generateSingleObstacle() {
        const shouldGenerate = Math.random() < 0.04;
        if (shouldGenerate) {
            const imageType = Math.floor(Math.random() * 2);
            const minHeight = 50;
            const maxHeight = 100;
            const height = minHeight + Math.random() * (maxHeight - minHeight);
            const width = 50 + Math.random() * 30;
            this.obstacles.push({
                x: this.canvas.width,
                y: this.canvas.height - height,
                width: width,
                height: height,
                speed: this.gameSpeed,
                isPartOfMultiple: false,
                imageType: imageType
            });
        }
    }
    generateMultipleObstacles(numObstacles) {
        const gapBetweenObstacles = 0;
        const minHeight = 50;
        const maxHeight = 90;
        const height = minHeight + Math.random() * (maxHeight - minHeight);
        const width = 40 + Math.random() * 20;
        let currentX = this.canvas.width;
        const groupId = Date.now();
        for (let i = 0; i < numObstacles; i++) {
            let adjustedHeight = height;
            if (i === 0) {
                adjustedHeight = minHeight + Math.random() * (height - minHeight);
            }
            else {
                adjustedHeight = minHeight + Math.random() * (height - minHeight);
            }
            const imageType = Math.floor(Math.random() * 2);
            const obstacle = {
                x: currentX,
                y: this.canvas.height - adjustedHeight,
                width: width,
                height: adjustedHeight,
                speed: this.gameSpeed,
                isPartOfMultiple: true,
                groupId: groupId,
                imageType: imageType
            };
            this.obstacles.push(obstacle);
            currentX += width + gapBetweenObstacles;
        }
    }
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= obstacle.speed;
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 1;
                this.scoreElement.textContent = this.score.toString();
            }
        }
        this.gameSpeed = 10 + Math.floor(this.score / 50);
    }
    checkCollisions() {
        const dinoRect = {
            x: this.dinoX + 20,
            y: this.dinoY + 20,
            width: this.dinoWidth - 40,
            height: this.dinoHeight - 40
        };
        const multiObstacleGroups = new Map();
        for (const obstacle of this.obstacles) {
            if (obstacle.isPartOfMultiple && obstacle.groupId) {
                if (!multiObstacleGroups.has(obstacle.groupId)) {
                    multiObstacleGroups.set(obstacle.groupId, []);
                }
                multiObstacleGroups.get(obstacle.groupId).push(obstacle);
            }
        }
        for (const obstacle of this.obstacles) {
            if (obstacle.isPartOfMultiple)
                continue;
            const obstacleRect = {
                x: obstacle.x + 12,
                y: obstacle.y + 20,
                width: obstacle.width - 24,
                height: obstacle.height - 32
            };
            if (dinoRect.x < obstacleRect.x + obstacleRect.width &&
                dinoRect.x + dinoRect.width > obstacleRect.x &&
                dinoRect.y < obstacleRect.y + obstacleRect.height &&
                dinoRect.y + dinoRect.height > obstacleRect.y) {
                this.gameOver();
            }
        }
        for (const [groupId, group] of multiObstacleGroups) {
            const leftmost = Math.min(...group.map(obs => obs.x));
            const rightmost = Math.max(...group.map(obs => obs.x + obs.width));
            const topmost = Math.min(...group.map(obs => obs.y));
            const bottommost = Math.max(...group.map(obs => obs.y + obs.height));
            const combinedObstacleRect = {
                x: leftmost + 16,
                y: topmost + 24,
                width: rightmost - leftmost - 32,
                height: bottommost - topmost - 40
            };
            if (dinoRect.x < combinedObstacleRect.x + combinedObstacleRect.width &&
                dinoRect.x + dinoRect.width > combinedObstacleRect.x &&
                dinoRect.y < combinedObstacleRect.y + combinedObstacleRect.height &&
                dinoRect.y + dinoRect.height > combinedObstacleRect.y) {
                this.gameOver();
            }
        }
    }
    gameOver() {
        this.gameRunning = false;
        this.gameOverElement.style.display = 'block';
    }
    restart() {
        this.obstacles = [];
        this.score = 0;
        this.dinoY = this.groundY;
        this.dinoJumping = false;
        this.gameSpeed = 10;
        this.gameRunning = true;
        this.gameOverElement.style.display = 'none';
        this.scoreElement.textContent = '0';
        this.restartBtn.blur();
    }
    drawDino() {
        if (this.dinoImgs.length > 0) {
            let frameIndex = this.currentDinoFrame;
            if (this.dinoJumping) {
                frameIndex = 0;
            }
            this.ctx.drawImage(this.dinoImgs[frameIndex], this.dinoX, this.dinoY, this.dinoWidth, this.dinoHeight);
        }
    }
    drawObstacles() {
        for (const obstacle of this.obstacles) {
            if (obstacle.imageType === 1) {
                this.ctx.drawImage(this.obstacleImg2, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
            else {
                this.ctx.drawImage(this.obstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        }
    }
    drawGround() {
    }
    gameLoop() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.gameRunning) {
            this.frameCount++;
            this.updateDino();
            this.generateObstacle();
            this.updateObstacles();
            this.checkCollisions();
        }
        this.drawDino();
        this.drawObstacles();
        requestAnimationFrame(() => this.gameLoop());
    }
}
// 游戏初始化
window.onload = () => {
    new DinoGame();
};

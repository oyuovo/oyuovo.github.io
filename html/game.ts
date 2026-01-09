interface IObstacle {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
}

class DinoGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private dinoX: number = 50;
    private dinoY: number = 440;
    private dinoWidth: number = 30;
    private dinoHeight: number = 60;
    private dinoJumping: boolean = false;
    private jumpVelocity: number = 0;
    private gravity: number = 1.2;
    private groundY: number = 440; // 相应调整
    private obstacles: IObstacle[] = [];
    private score: number = 0;
    private gameSpeed: number = 5;
    private gameRunning: boolean = true;
    private frameCount: number = 0;

    private scoreElement: HTMLElement;
    private gameOverElement: HTMLElement;
    private restartBtn: HTMLButtonElement;

    // 添加图像资源
    private dinoImg: HTMLImageElement;
    private obstacleImg: HTMLImageElement;

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.scoreElement = document.getElementById('score')!;
        this.gameOverElement = document.getElementById('gameOver')!;
        this.restartBtn = document.getElementById('restartBtn') as HTMLButtonElement;

        // 初始化图像资源
        this.dinoImg = new Image();
        this.dinoImg.src = 'player.png';

        this.obstacleImg = new Image();
        this.obstacleImg.src = 'xianren1.png';

        this.bindEvents();

        // 等待图像加载完成后再开始游戏循环
        Promise.all([
            this.imageLoaded(this.dinoImg),
            this.imageLoaded(this.obstacleImg)
        ]).then(() => {
            this.gameLoop();
        });
    }

    private imageLoaded(img: HTMLImageElement): Promise<void> {
        return new Promise((resolve) => {
            if (img.complete) {
                resolve();
            } else {
                img.onload = () => resolve();
            }
        });
    }

    private bindEvents(): void {
        document.addEventListener('keydown', (e) => {
            if ((e.code === 'Space' || e.key === 'ArrowUp') && !this.dinoJumping) {
                this.jump();
            }

            // 如果游戏结束，按空格重新开始
            if (e.code === 'Space' && !this.gameRunning) {
                this.restart();
            }
        });

        this.restartBtn.addEventListener('click', () => {
            this.restart();
        });
    }

    public jump(): void {
        if (!this.dinoJumping) {
            this.dinoJumping = true;
            this.jumpVelocity = -20; // 减小初速度，配合减小的重力，形成更可控的跳跃弧线
        }
    }

    private updateDino(): void {
        if (this.dinoJumping) {
            this.dinoY += this.jumpVelocity;
            this.jumpVelocity += this.gravity;

            // 检查是否落地
            if (this.dinoY >= this.groundY) {
                this.dinoY = this.groundY;
                this.dinoJumping = false;
            }
        }
    }

    private generateObstacle(): void {
        // 检查最近的障碍物距离，避免过密生成
        const minDistance = 200; // 设置最小距离，确保可以跳跃通过
        
        // 如果最近有障碍物，不生成新障碍物
        for (const obstacle of this.obstacles) {
            if (obstacle.x > this.canvas.width - minDistance) {
                return; // 如果最近的障碍物距离不够，不生成新障碍物
            }
        }
        
        // 障碍物生成概率随时间增加，但受最小间距限制
        const shouldGenerate = Math.random() < 0.005 * (this.gameSpeed / 5);

        if (shouldGenerate) {
            // 随机选择仙人掌图像
            const cactusImages = ['xianren1.png', 'xianren2_1.png'];
            const selectedImage = new Image();
            selectedImage.src = cactusImages[Math.floor(Math.random() * cactusImages.length)];

            // 随机生成障碍物高度，限制在合理范围内
            const minHeight = 30;
            const maxHeight = 60; // 限制最大高度，确保可以跳跃通过
            const height = minHeight + Math.random() * (maxHeight - minHeight);
            const width = 25 + Math.random() * 15;

            // 将障碍物放在画布底部
            this.obstacles.push({
                x: this.canvas.width,
                y: this.canvas.height - height,  // 放在画布底部
                width: width,
                height: height,
                speed: this.gameSpeed
            });
        }
    }

    private updateObstacles(): void {
        // 更新障碍物位置
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            obstacle.x -= obstacle.speed;

            // 移除屏幕外的障碍物并增加分数
            if (obstacle.x + obstacle.width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 1;
                this.scoreElement.textContent = this.score.toString();
            }
        }

        // 优化游戏加速曲线，使难度提升更平缓
        this.gameSpeed = 5 + Math.floor(this.score / 100);
    }

    private checkCollisions(): void {
        // 计算恐龙碰撞箱，减小碰撞箱尺寸使游戏更容易
        const dinoRect = {
            x: this.dinoX + 5,        // 左侧缩小5像素
            y: this.dinoY + 10,       // 顶部缩小10像素
            width: this.dinoWidth - 10,   // 宽度减少10像素
            height: this.dinoHeight - 15  // 高度减少15像素
        };

        for (const obstacle of this.obstacles) {
            // 计算障碍物碰撞箱，减小碰撞箱尺寸使游戏更容易
            const obstacleRect = {
                x: obstacle.x + 3,        // 左侧缩小3像素
                y: obstacle.y + 5,        // 顶部缩小5像素
                width: obstacle.width - 6,  // 宽度减少6像素
                height: obstacle.height - 8 // 高度减少8像素
            };

            if (
                dinoRect.x < obstacleRect.x + obstacleRect.width &&
                dinoRect.x + dinoRect.width > obstacleRect.x &&
                dinoRect.y < obstacleRect.y + obstacleRect.height &&
                dinoRect.y + dinoRect.height > obstacleRect.y
            ) {
                this.gameOver();
            }
        }
    }

    private gameOver(): void {
        this.gameRunning = false;
        this.gameOverElement.style.display = 'block';
    }

    private restart(): void {
        this.obstacles = [];
        this.score = 0;
        this.dinoY = this.groundY;
        this.dinoJumping = false;
        this.gameSpeed = 5;
        this.gameRunning = true;
        this.gameOverElement.style.display = 'none';
        this.scoreElement.textContent = '0';
    }

    private drawDino(): void {
        // 绘制小恐龙图像
        this.ctx.drawImage(this.dinoImg, this.dinoX, this.dinoY, this.dinoWidth, this.dinoHeight);
    }

    private drawObstacles(): void {
        for (const obstacle of this.obstacles) {
            // 使用统一的障碍物图像绘制
            this.ctx.drawImage(this.obstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    }

    private drawGround(): void {
        // 地面不再绘制，此方法为空
    }

    private gameLoop(): void {
        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        if (this.gameRunning) {
            this.frameCount++;

            // 更新游戏对象
            this.updateDino();
            this.generateObstacle();
            this.updateObstacles();
            this.checkCollisions();
        }

        // 绘制游戏元素（不再绘制地面）
        this.drawDino();
        this.drawObstacles();

        // 继续游戏循环
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 游戏初始化
window.onload = () => {
    new DinoGame();
};
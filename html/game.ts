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
    private dinoY: number = 440; // 恢复为440（画布高度500 - 恐龙高度60 = 440）
    private dinoWidth: number = 50;
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
        // 障碍物生成概率随时间增加
        const shouldGenerate = Math.random() < 0.005 * (this.gameSpeed / 5);

        if (shouldGenerate) {
            // 随机生成障碍物高度
            const height = 50 + Math.random() * 50;
            const width = 25 + Math.random() * 15;

            // 将障碍物放在画布底部，Y坐标为画布高度减去障碍物高度
            // 确保与恐龙在同一水平线 (groundY)
            this.obstacles.push({
                x: this.canvas.width,
                y: this.groundY + (60 - height), // 调整Y坐标使其底部对齐到地面线
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
        // 计算恐龙碰撞箱（考虑到图像的实际位置）
        const dinoRect = {
            x: this.dinoX,
            y: this.dinoY,
            width: this.dinoWidth,
            height: this.dinoHeight
        };

        for (const obstacle of this.obstacles) {
            // 计算障碍物碰撞箱
            const obstacleRect = {
                x: obstacle.x,
                y: obstacle.y,  // 障碍物顶部的Y坐标
                width: obstacle.width,
                height: obstacle.height
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
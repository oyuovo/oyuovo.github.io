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
    private dinoWidth: number = 40;  // 增加恐龙的显示宽度
    private dinoHeight: number = 60;
    private dinoJumping: boolean = false;
    private jumpVelocity: number = 0;
    private gravity: number = 0.8;  // 进一步降低重力以减慢下落速度
    private groundY: number = 440; // 相应调整
    private obstacles: IObstacle[] = [];
    private score: number = 0;
    private gameSpeed: number = 5;
    private gameRunning: boolean = true;
    private frameCount: number = 0;

    private scoreElement: HTMLElement;
    private gameOverElement: HTMLElement;
    private restartBtn: HTMLButtonElement;

    // 修改图像资源，支持恐龙动画
    private dinoImgs: HTMLImageElement[] = []; // 存储所有恐龙帧的数组
    private currentDinoFrame: number = 0;     // 当前显示的帧
    private frameCounter: number = 0;         // 动画帧计数器
    private totalFrames: number = 5;          // 总共有多少帧动画
    private framesPerAnimation: number = 10;  // 每个动画帧持续多少帧
    
    private obstacleImg: HTMLImageElement;

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.scoreElement = document.getElementById('score')!;
        this.gameOverElement = document.getElementById('gameOver')!;
        this.restartBtn = document.getElementById('restartBtn') as HTMLButtonElement;

        // 初始化恐龙动画帧
        this.loadDinoFrames();

        this.obstacleImg = new Image();
        this.obstacleImg.src = 'xianren1.png';

        this.bindEvents();

        // 等待图像加载完成后再开始游戏循环
        Promise.all([
            this.allImagesLoaded(this.dinoImgs),
            this.imageLoaded(this.obstacleImg)
        ]).then(() => {
            this.gameLoop();
        });
    }

    private loadDinoFrames(): void {
        // 定义恐龙动画帧的图片路径
        const dinoFramePaths = [
            'konglong a.png',
            'konglong a_1.png', 
            'konglong a_2.png',
            'konglong a_3.png',
            'konglong a_4.png'
        ];
        
        // 为每张图片创建Image对象并存储
        for (const path of dinoFramePaths) {
            const img = new Image();
            img.src = path;
            this.dinoImgs.push(img);
        }
    }

    private allImagesLoaded(images: HTMLImageElement[]): Promise<void[]> {
        const promises = images.map(img => this.imageLoaded(img));
        return Promise.all(promises);
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

            // 如果游戏结束，按回车重新开始（按照规范使用回车键）
            if (e.code === 'Enter' && !this.gameRunning) {
                this.restart();
            }
        });

        // 添加移动端触摸事件支持
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 阻止默认的触摸行为
            if(!this.dinoJumping) {
                this.jump();
            }
        });
        
        // 添加移动端点击事件支持（对于非触摸设备的备用方案）
        this.canvas.addEventListener('click', (e) => {
            if(!this.dinoJumping) {
                this.jump();
            }
        });

        this.restartBtn.addEventListener('click', () => {
            this.restart();
        });
        
        // 添加对重启按钮的触摸支持
        this.restartBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.restart();
        });
    }

    public jump(): void {
        if (!this.dinoJumping) {
            this.dinoJumping = true;
            this.jumpVelocity = -12; // 进一步降低跳跃初速度，减慢上升速度
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
                this.jumpVelocity = 0; // 重置速度
            }
        } else {
            // 更新动画帧，只在恐龙没有跳跃时播放动画
            this.frameCounter++;
            if (this.frameCounter >= this.framesPerAnimation) {
                this.currentDinoFrame = (this.currentDinoFrame + 1) % this.totalFrames;
                this.frameCounter = 0;
            }
        }
    }

    private generateObstacle(): void {
        // 检查最近的障碍物距离，避免过密生成
        const minDistance = 350; // 调整最小距离以平衡游戏难度
        
        // 如果最近有障碍物，不生成新障碍物
        for (const obstacle of this.obstacles) {
            if (obstacle.x > this.canvas.width - minDistance) {
                return; // 如果最近的障碍物距离不够，不生成新障碍物
            }
        }
        
        // 决定生成单个障碍物还是双重障碍物
        const isMultiple = Math.random() < 0.35; // 35% 概率生成双重障碍物，65% 概率生成单个障碍物
        
        if (isMultiple) {
            // 生成双重障碍物
            const numObstacles = 2; // 固定为两个，确保游戏可玩性
            const gapBetweenObstacles = 25 + Math.random() * 15; // 障碍物之间的间隔，稍微增大以确保可通过
            const minHeight = 25;
            const maxHeight = 45; // 降低最大高度，更容易通过
            const height = minHeight + Math.random() * (maxHeight - minHeight);
            const width = 20 + Math.random() * 10; // 障碍物宽度
            
            // 生成第一个障碍物
            let currentX = this.canvas.width;
            
            for (let i = 0; i < numObstacles; i++) {
                // 为了让两个障碍物略有不同，稍微调整高度
                let adjustedHeight = height;
                if (i === 0) {
                    // 第一个障碍物高度稍微随机变化
                    adjustedHeight = minHeight + Math.random() * (height - minHeight);
                } else {
                    // 第二个障碍物也可能有略微不同的高度
                    adjustedHeight = minHeight + Math.random() * (height - minHeight);
                }
                
                const obstacle = {
                    x: currentX,
                    y: this.canvas.height - adjustedHeight,
                    width: width,
                    height: adjustedHeight,
                    speed: this.gameSpeed
                };
                
                this.obstacles.push(obstacle);
                
                // 更新下一个障碍物的位置
                currentX += width + gapBetweenObstacles;
            }
        } else {
            // 生成单个障碍物
            const shouldGenerate = Math.random() < 0.02; // 使用固定的生成概率，不需要再乘以gameSpeed因子

            if (shouldGenerate) {
                // 随机选择仙人掌图像
                const cactusImages = ['xianren1.png', 'xianren2_1.png'];
                const selectedImage = new Image();
                selectedImage.src = cactusImages[Math.floor(Math.random() * cactusImages.length)];

                // 随机生成障碍物高度，限制在合理范围内
                // 随机生成障碍物高度，限制在合理范围内
                const minHeight = 25;
                const maxHeight = 50; // 限制最大高度，确保可以跳跃通过
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
            width: this.dinoWidth - 10,   // 宽度减少10像素 (原来是30-10=20，现在是40-10=30)
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
        // 绘制小恐龙图像，根据当前帧绘制对应图片
        if (this.dinoImgs.length > 0) {
            // 根据跳跃状态决定是否播放动画
            let frameIndex = this.currentDinoFrame;
            
            // 如果在跳跃，使用第一帧（站立姿态）
            if (this.dinoJumping) {
                frameIndex = 0;
            }
            
            this.ctx.drawImage(
                this.dinoImgs[frameIndex], 
                this.dinoX, 
                this.dinoY, 
                this.dinoWidth,  // 使用新的宽度
                this.dinoHeight
            );
        }
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
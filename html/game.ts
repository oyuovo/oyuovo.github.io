interface IObstacle {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    // 添加属性区分是单个障碍物还是多重障碍物的一部分
    isPartOfMultiple?: boolean;
    groupId?: number; // 用于标识属于同一组多重障碍物
    imageType?: number; // 用于标识使用哪种图像 (0 for xianren1, 1 for xianren2_1)
}

class DinoGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private dinoX: number = 50;
    private dinoY: number = 450;  // 调整初始y坐标，因为高度变小了
    private dinoWidth: number = 40;  
    private dinoHeight: number = 50;  // 将恐龙高度从60改为50，使其更矮
    private dinoJumping: boolean = false;
    private jumpVelocity: number = 0;
    private gravity: number = 0.6;  // 增加重力值，让跳跃和下落更自然
    private groundY: number = 450; // 相应调整地面位置，与新高度匹配
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
    private obstacleImg2: HTMLImageElement; // 新增第二个障碍物图像

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
        
        // 加载第二个障碍物图像
        this.obstacleImg2 = new Image();
        this.obstacleImg2.src = 'xianren2_1.png';

        this.bindEvents();

        // 等待图像加载完成后再开始游戏循环
        Promise.all([
            this.allImagesLoaded(this.dinoImgs),
            this.imageLoaded(this.obstacleImg),
            this.imageLoaded(this.obstacleImg2)
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
            this.jumpVelocity = -10; // 增加跳跃初速度，使跳跃更高但速度更自然
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
        
        // 按照等概率生成单个、双重和三重障碍物
        const obstacleType = Math.random();
        const singleProbability = 1/3;  // 约33.33%
        const doubleProbability = 2/3;  // 约66.66%
        
        if (obstacleType < singleProbability) {
            // 生成单个障碍物
            this.generateSingleObstacle();
        } else if (obstacleType < doubleProbability) {
            // 生成双重障碍物
            this.generateMultipleObstacles(2);
        } else {
            // 生成三重障碍物
            this.generateMultipleObstacles(3);
        }
    }
    
    private generateSingleObstacle(): void {
        const shouldGenerate = Math.random() < 0.04; // 单个障碍物生成概率

        if (shouldGenerate) {
            // 对于单个障碍物，随机选择图像
            const imageType = Math.floor(Math.random() * 2);
            const selectedImage = new Image();
            selectedImage.src = imageType === 1 ? 'xianren2_1.png' : 'xianren1.png';

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
                speed: this.gameSpeed,
                isPartOfMultiple: false,
                imageType: imageType
            });
        }
    }
    
    private generateMultipleObstacles(numObstacles: number): void {
        const gapBetweenObstacles = 0; // 设置为0，让障碍物完全贴在一起
        const minHeight = 25;
        const maxHeight = 45; // 降低最大高度，更容易通过
        const height = minHeight + Math.random() * (maxHeight - minHeight);
        const width = 20 + Math.random() * 10; // 障碍物宽度
        
        // 生成第一个障碍物
        let currentX = this.canvas.width;
        const groupId = Date.now(); // 使用时间戳作为唯一ID
        
        for (let i = 0; i < numObstacles; i++) {
            // 为了让多个障碍物略有不同，稍微调整高度
            let adjustedHeight = height;
            if (i === 0) {
                // 第一个障碍物高度稍微随机变化
                adjustedHeight = minHeight + Math.random() * (height - minHeight);
            } else {
                // 后续障碍物也可能有略微不同的高度
                adjustedHeight = minHeight + Math.random() * (height - minHeight);
            }
            
            // 为每个障碍物单独随机选择图像类型 (0 for xianren1, 1 for xianren2_1)
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
            
            // 更新下一个障碍物的位置
            currentX += width + gapBetweenObstacles;
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

        // 加快游戏速度提升，每得50分增加1的速度（原来是每100分）
        this.gameSpeed = 5 + Math.floor(this.score / 50);
    }

    private checkCollisions(): void {
        // 计算恐龙碰撞箱，进一步减小碰撞箱尺寸使游戏更容易
        const dinoRect = {
            x: this.dinoX + 10,        // 左侧缩小更多像素
            y: this.dinoY + 10,       // 由于高度变小，相应调整顶部
            width: this.dinoWidth - 20,   // 宽度进一步减少 (40-20=20)
            height: this.dinoHeight - 20  // 高度进一步减少 (50-20=30)
        };

        // 创建一个包含所有多重障碍物组的映射
        const multiObstacleGroups = new Map<number, IObstacle[]>();
        
        // 按组整理多重障碍物
        for (const obstacle of this.obstacles) {
            if (obstacle.isPartOfMultiple && obstacle.groupId) {
                if (!multiObstacleGroups.has(obstacle.groupId)) {
                    multiObstacleGroups.set(obstacle.groupId, []);
                }
                multiObstacleGroups.get(obstacle.groupId)!.push(obstacle);
            }
        }

        // 检查单个障碍物碰撞
        for (const obstacle of this.obstacles) {
            // 跳过多重障碍物，稍后一起处理
            if (obstacle.isPartOfMultiple) continue;

            // 计算障碍物碰撞箱，进一步减小碰撞箱尺寸使游戏更容易
            const obstacleRect = {
                x: obstacle.x + 6,        // 左侧缩小更多像素
                y: obstacle.y + 10,        // 顶部缩小更多像素
                width: obstacle.width - 12,  // 宽度进一步减少
                height: obstacle.height - 16 // 高度进一步减少
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

        // 检查多重障碍物组碰撞（作为一个整体）
        for (const [groupId, group] of multiObstacleGroups) {
            // 计算整个组的边界框
            const leftmost = Math.min(...group.map(obs => obs.x));
            const rightmost = Math.max(...group.map(obs => obs.x + obs.width));
            const topmost = Math.min(...group.map(obs => obs.y));
            const bottommost = Math.max(...group.map(obs => obs.y + obs.height));

            // 计算组合障碍物碰撞箱，进一步减小碰撞箱体积
            const combinedObstacleRect = {
                x: leftmost + 8,        // 左侧缩小更多像素
                y: topmost + 12,         // 顶部缩小更多像素
                width: rightmost - leftmost - 16,  // 宽度减少更多像素
                height: bottommost - topmost - 20  // 高度减少更多像素
            };

            if (
                dinoRect.x < combinedObstacleRect.x + combinedObstacleRect.width &&
                dinoRect.x + dinoRect.width > combinedObstacleRect.x &&
                dinoRect.y < combinedObstacleRect.y + combinedObstacleRect.height &&
                dinoRect.y + dinoRect.height > combinedObstacleRect.y
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
        this.dinoY = this.groundY;  // 确保重启时恐龙位置正确
        this.dinoJumping = false;
        this.gameSpeed = 5;
        this.gameRunning = true;
        this.gameOverElement.style.display = 'none';
        this.scoreElement.textContent = '0';
        
        // 添加以下行，让重新开始按钮失去焦点，避免空格键触发按钮点击
        this.restartBtn.blur();
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
                this.dinoHeight  // 使用新的高度
            );
        }
    }

    private drawObstacles(): void {
        for (const obstacle of this.obstacles) {
            // 根据imageType选择要绘制的图像
            if (obstacle.imageType === 1) {
                // 使用xianren2_1图像
                this.ctx.drawImage(this.obstacleImg2, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            } else {
                // 使用xianren1图像 (默认值)
                this.ctx.drawImage(this.obstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
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
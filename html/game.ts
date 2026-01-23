interface IObstacle {
    x: number;
    y: number;
    width: number;
    height: number;
    speed: number;
    isPartOfMultiple?: boolean;
    groupId?: number;
    imageType?: number;
}

class DinoGame {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private dinoX: number = 100;
    private dinoY: number = 900;
    private dinoWidth: number = 80;
    private dinoHeight: number = 100;
    private dinoJumping: boolean = false;
    private jumpVelocity: number = 0;
    private gravity: number = 0.6;
    private groundY: number = 900;
    private obstacles: IObstacle[] = [];
    private score: number = 0;
    private gameSpeed: number = 10;
    private gameRunning: boolean = true;
    private frameCount: number = 0;

    private scoreElement: HTMLElement;
    private gameOverElement: HTMLElement;
    private restartBtn: HTMLButtonElement;

    private dinoImgs: HTMLImageElement[] = [];
    private currentDinoFrame: number = 0;
    private frameCounter: number = 0;
    private totalFrames: number = 5;
    private framesPerAnimation: number = 10;
    
    private obstacleImg: HTMLImageElement;
    private obstacleImg2: HTMLImageElement;

    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
        this.scoreElement = document.getElementById('score')!;
        this.gameOverElement = document.getElementById('gameOver')!;
        this.restartBtn = document.getElementById('restartBtn') as HTMLButtonElement;

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

    private loadDinoFrames(): void {
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

            if (e.code === 'Enter' && !this.gameRunning) {
                this.restart();
            }
        });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if(!this.dinoJumping) {
                this.jump();
            }
        });
        
        this.canvas.addEventListener('click', (e) => {
            if(!this.dinoJumping) {
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

    public jump(): void {
        if (!this.dinoJumping) {
            this.dinoJumping = true;
            this.jumpVelocity = -20;
        }
    }

    private updateDino(): void {
        if (this.dinoJumping) {
            this.dinoY += this.jumpVelocity;
            this.jumpVelocity += this.gravity;

            if (this.dinoY >= this.groundY) {
                this.dinoY = this.groundY;
                this.dinoJumping = false;
                this.jumpVelocity = 0;
            }
        } else {
            this.frameCounter++;
            if (this.frameCounter >= this.framesPerAnimation) {
                this.currentDinoFrame = (this.currentDinoFrame + 1) % this.totalFrames;
                this.frameCounter = 0;
            }
        }
    }

    private generateObstacle(): void {
        const minDistance = 700;
        
        for (const obstacle of this.obstacles) {
            if (obstacle.x > this.canvas.width - minDistance) {
                return;
            }
        }
        
        const obstacleType = Math.random();
        const singleProbability = 1/3;
        const doubleProbability = 2/3;
        
        if (obstacleType < singleProbability) {
            this.generateSingleObstacle();
        } else if (obstacleType < doubleProbability) {
            this.generateMultipleObstacles(2);
        } else {
            this.generateMultipleObstacles(3);
        }
    }
    
    private generateSingleObstacle(): void {
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
    
    private generateMultipleObstacles(numObstacles: number): void {
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
            } else {
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

    private updateObstacles(): void {
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

    private checkCollisions(): void {
        const dinoRect = {
            x: this.dinoX + 20,
            y: this.dinoY + 20,
            width: this.dinoWidth - 40,
            height: this.dinoHeight - 40
        };

        const multiObstacleGroups = new Map<number, IObstacle[]>();
        
        for (const obstacle of this.obstacles) {
            if (obstacle.isPartOfMultiple && obstacle.groupId) {
                if (!multiObstacleGroups.has(obstacle.groupId)) {
                    multiObstacleGroups.set(obstacle.groupId, []);
                }
                multiObstacleGroups.get(obstacle.groupId)!.push(obstacle);
            }
        }

        for (const obstacle of this.obstacles) {
            if (obstacle.isPartOfMultiple) continue;

            const obstacleRect = {
                x: obstacle.x + 12,
                y: obstacle.y + 20,
                width: obstacle.width - 24,
                height: obstacle.height - 32
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
        this.dinoY = this.groundY;
        this.dinoJumping = false;
        this.gameSpeed = 10;
        this.gameRunning = true;
        this.gameOverElement.style.display = 'none';
        this.scoreElement.textContent = '0';
        
        this.restartBtn.blur();
    }

    private drawDino(): void {
        if (this.dinoImgs.length > 0) {
            let frameIndex = this.currentDinoFrame;
            
            if (this.dinoJumping) {
                frameIndex = 0;
            }
            
            this.ctx.drawImage(
                this.dinoImgs[frameIndex], 
                this.dinoX, 
                this.dinoY, 
                this.dinoWidth,
                this.dinoHeight
            );
        }
    }

    private drawObstacles(): void {
        for (const obstacle of this.obstacles) {
            if (obstacle.imageType === 1) {
                this.ctx.drawImage(this.obstacleImg2, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            } else {
                this.ctx.drawImage(this.obstacleImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            }
        }
    }

    private drawGround(): void {
        
    }

    private gameLoop(): void {
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
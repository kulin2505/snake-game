class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.tileCount = 20;
        this.canvas.width = this.canvas.height = this.gridSize * this.tileCount;
        
        this.snake = [{x: 10, y: 10}];
        this.food = this.generateFood();
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.gameLoop = null;
        this.playerName = '';
        this.leaderboard = [];
        this.gameSpeed = 150; // 降低游戏速度（数值越大越慢）
        
        this.setupEventListeners();
        this.fetchLeaderboard();
    }

    setupEventListeners() {
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        document.getElementById('startGameBtn').addEventListener('click', () => this.startGame());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.resetGame());
        
        document.getElementById('playerName').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startGame();
            }
        });
    }

    startGame() {
        const nameInput = document.getElementById('playerName');
        const inputName = nameInput.value.trim();
        
        // 如果输入框为空，使用之前的名字
        if (!inputName) {
            if (!this.playerName) {
                nameInput.classList.add('error');
                return;
            }
        } else {
            this.playerName = inputName;
        }
        
        nameInput.classList.remove('error');
        document.getElementById('startScreen').classList.add('hidden');
        document.getElementById('countdownScreen').classList.remove('hidden');
        
        // 开始倒计时
        let countdown = 3;
        const countdownElement = document.getElementById('countdownNumber');
        countdownElement.textContent = countdown;
        
        const countdownInterval = setInterval(() => {
            countdown--;
            countdownElement.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                document.getElementById('countdownScreen').classList.add('hidden');
                document.getElementById('gameScreen').classList.remove('hidden');
                document.getElementById('currentPlayerName').textContent = this.playerName;
                
                this.snake = [{x: 10, y: 10}];
                this.direction = 'right';
                this.nextDirection = 'right';
                this.score = 0;
                this.food = this.generateFood();
                document.getElementById('currentScore').textContent = '0';

                if (this.gameLoop) {
                    clearInterval(this.gameLoop);
                }

                this.gameLoop = setInterval(() => {
                    this.update();
                    this.draw();
                }, this.gameSpeed);
            }
        }, 1000);
    }

    handleKeyPress(event) {
        const key = event.key.toLowerCase();
        const directions = {
            'arrowup': 'up', 'w': 'up',
            'arrowdown': 'down', 's': 'down',
            'arrowleft': 'left', 'a': 'left',
            'arrowright': 'right', 'd': 'right'
        };

        if (directions[key]) {
            const newDirection = directions[key];
            const opposites = {
                'up': 'down',
                'down': 'up',
                'left': 'right',
                'right': 'left'
            };

            if (this.direction !== opposites[newDirection]) {
                this.nextDirection = newDirection;
            }
        }
    }

    update() {
        this.direction = this.nextDirection;
        const head = {...this.snake[0]};

        switch(this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }

        if (this.checkCollision(head)) {
            this.gameOver();
            return;
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10;
            document.getElementById('currentScore').textContent = this.score;
            this.food = this.generateFood();
        } else {
            this.snake.pop();
        }
    }

    draw() {
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制网格
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= this.tileCount; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.gridSize, 0);
            this.ctx.lineTo(i * this.gridSize, this.canvas.height);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.gridSize);
            this.ctx.lineTo(this.canvas.width, i * this.gridSize);
            this.ctx.stroke();
        }

        // 绘制蛇
        this.snake.forEach((segment, index) => {
            this.ctx.fillStyle = index === 0 ? '#4CAF50' : '#45a049';
            this.ctx.fillRect(
                segment.x * this.gridSize + 1,
                segment.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2
            );
        });

        // 绘制食物
        this.ctx.fillStyle = '#f1c40f';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize/2,
            this.food.y * this.gridSize + this.gridSize/2,
            this.gridSize/2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
    }

    checkCollision(head) {
        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            return true;
        }

        return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    }

    gameOver() {
        clearInterval(this.gameLoop);
        
        // 更新服务器上的积分榜
        this.updateLeaderboardData(this.playerName, this.score);
        
        // 显示游戏结束界面
        document.getElementById('gameScreen').classList.add('hidden');
        document.getElementById('gameOverScreen').classList.remove('hidden');
        
        // 找到当前玩家的排名
        const playerRank = this.leaderboard.findIndex(entry => 
            entry.name === this.playerName && entry.score === this.score
        ) + 1;
        
        // 显示最终得分和排名
        document.getElementById('finalScore').innerHTML = `
            <div class="final-score-info">
                <p>最终得分: ${this.score}</p>
                <p>当前排名: #${playerRank}</p>
            </div>
            <div class="all-scores">
                <h3>积分榜</h3>
                ${this.leaderboard.map((entry, index) => `
                    <div class="score-item ${entry.name === this.playerName && entry.score === this.score ? 'current-player' : ''}">
                        <span class="rank">#${index + 1}</span>
                        <span class="name">${entry.name}</span>
                        <span class="score">${entry.score}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    updateLeaderboard() {
        const leaderboardList = document.getElementById('leaderboardList');
        leaderboardList.innerHTML = this.leaderboard.map((entry, index) => `
            <div class="leaderboard-item">
                <span class="leaderboard-rank">#${index + 1}</span>
                <span class="leaderboard-name">${entry.name}</span>
                <span class="leaderboard-score">${entry.score}</span>
            </div>
        `).join('');
    }

    resetGame() {
        document.getElementById('gameOverScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden');
        // 不再清空玩家名字输入框
        // document.getElementById('playerName').value = '';
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(segment => segment.x === food.x && segment.y === food.y));
        return food;
    }

    // 获取积分榜数据
    async fetchLeaderboard() {
        try {
            const response = await fetch('/api/leaderboard');
            if (!response.ok) {
                throw new Error('Failed to fetch leaderboard');
            }
            this.leaderboard = await response.json();
            this.updateLeaderboard();
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        }
    }

    // 更新积分榜数据
    async updateLeaderboardData(name, score) {
        try {
            const response = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name, score })
            });
            
            if (!response.ok) {
                throw new Error('Failed to update leaderboard');
            }
            
            this.leaderboard = await response.json();
            this.updateLeaderboard();
        } catch (error) {
            console.error('Error updating leaderboard:', error);
        }
    }
}

window.addEventListener('load', () => {
    new SnakeGame();
}); 
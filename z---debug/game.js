class Bomb {
    static EXPLOSION_RADIUS = 50;

    constructor(x, y, onExplode) {
        this.pos = { x, y };
        this.onExplode = onExplode;
        this.body = document.body;
        this.count = 2;
        this.drop();
    }

    drop() {
        this.bomb = document.createElement("div");
        this.bomb.innerHTML = this.count;
        this.body.appendChild(this.bomb);
        
        const sizeInVmin = 10;
        const size = `calc(${sizeInVmin}vmin)`;
        const sizePx = (Math.min(window.innerWidth, window.innerHeight) * sizeInVmin) / 100;
        
        Object.assign(this.bomb.style, {
            zIndex: "11000",
            fontFamily: "verdana, sans-serif",
            width: size,
            height: size,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: size,
            fontSize: `calc(${sizeInVmin * 0.5}vmin)`,
            color: '#fff',
            background: '#FF1493',
            border: '2px solid #fff',
            position: 'absolute',
            top: `${this.pos.y - sizePx / 2}px`,
            left: `${this.pos.x - sizePx / 2}px`,
            textAlign: "center",
            userSelect: 'none',
            fontWeight: 700,
            pointerEvents: 'none',
        });

        setTimeout(() => this.countDown(), 1000);
    }

    countDown() {
        this.count--;
        this.bomb.innerHTML = this.count > 0 ? this.count : '🌸';
        if (this.count > 0) {
            setTimeout(() => this.countDown(), 1000);
        } else {
            setTimeout(() => this.explode(), 300);
        }
    }

    explode() {
        this.bomb.remove();
        if (this.onExplode) {
            this.onExplode(this);
        }
    }
}

const GAME_DURATION = 60;
const HIGH_SCORE_KEY = 'parkingGameHighScore';

const SCORE_CRACK = 25;
const SCORE_DESTROY_CAR = 150;
const SCORE_DESTROY_SPACE = 75;
const SCORE_DESTROY_SHATTER = 10;
const MAX_INTERACTIVE_PIECES = 40;
const MAX_SCORCH_MARKS = 300; // 画面に残す花のクラスターの最大数
const FRAGMENT_POOL_SIZE = 60; // オブジェクトプーリング用の破片の数

const Game = {
    isActive: false,
    draggables: null,
    parkingArea: null,
    exitButton: null,
    score: 0,
    highScore: 0,
    highScoreElement: null,
    maxScore: 1500000,
    scoreElement: null,
    bombsActive: 0,
    comboCount: 0,
    maxCombo: 0,
    comboResetTimer: null,
    comboDisplayElement: null,
    comboCountElement: null,
    shatterPieces: [],
    scorchMarks: [],
    timerId: null,
    timeRemaining: 0,
    timerElement: null,
    isGameOverTransition: false,

    canvas: null,
    ctx: null,
    particles: [],
    fragmentPool: [],

    init() {
        this.draggables = document.querySelectorAll('.draggable');
        this.parkingArea = document.getElementById('parking-area');
        this.exitButton = document.getElementById('exit-game-button');
        this.scoreElement = document.getElementById('score-layer');
        this.comboDisplayElement = document.getElementById('combo-display');
        this.comboCountElement = document.getElementById('combo-count');
        this.timerElement = document.getElementById('game-timer');
        this.highScoreElement = document.getElementById('high-score-layer');
        const savedHighScore = localStorage.getItem(HIGH_SCORE_KEY) || 0;
        this.highScore = parseInt(savedHighScore, 10);
        this.highScoreElement.textContent = `ハイスコア ${this.highScore}点`;

        this.canvas = document.getElementById('particle-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.initPools();
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this));

        this.gameLoop = this.gameLoop.bind(this);
        this.gameLoop();
    },

    initPools() {
        for (let i = 0; i < FRAGMENT_POOL_SIZE; i++) {
            const fragment = document.createElement('div');
            fragment.className = 'fragment-debris';
            fragment.style.opacity = '0';
            this.parkingArea.appendChild(fragment);
            this.fragmentPool.push(fragment);
        }
    },

    resizeCanvas() {
        this.canvas.width = this.parkingArea.clientWidth;
        this.canvas.height = this.parkingArea.clientHeight;
    },

    gameLoop() {
        if (this.isActive) {
            this.updateParticles();
            this.drawParticles();
        }
        requestAnimationFrame(this.gameLoop);
    },

    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    },

    drawParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.particles.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.font = `${p.size}px sans-serif`;
            this.ctx.fillStyle = '#fff';
            this.ctx.shadowColor = 'rgba(0,0,0,0.7)';
            this.ctx.shadowBlur = 3;
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation);
            this.ctx.fillText(p.text, 0, 0);
            this.ctx.restore();
        });
    },

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.score = 0;
        this.bombsActive = 0;
        this.maxCombo = 0;
        if (this.exitButton) this.exitButton.disabled = false;
        this.resetCombo();
        this.updateScore(0);
        this.highScoreElement.textContent = `ハイスコア ${this.highScore}点`;
        document.body.classList.add('game-mode');
        this.parkingArea.addEventListener('click', this.handleAreaClick);
        
        this.draggables.forEach(el => {
            el.dataset.hitsRequired = Math.floor(Math.random() * 3) + 2; 
            el.dataset.currentHits = 0;
        });

        if (typeof gtag === 'function') {
            gtag('event', 'start_game', {
                'event_category': 'Game',
                'event_label': 'Flower Game Start'
            });
        }

        this.timeRemaining = GAME_DURATION;
        this.timerElement.textContent = `タイム ${String(Math.floor(this.timeRemaining / 60)).padStart(2, '0')}:${String(this.timeRemaining % 60).padStart(2, '0')}`;
        
        this.timerId = setInterval(() => {
            this.timeRemaining--;
            this.timerElement.textContent = `タイム ${String(Math.floor(this.timeRemaining / 60)).padStart(2, '0')}:${String(this.timeRemaining % 60).padStart(2, '0')}`;
            if (this.timeRemaining <= 0) {
                this.end();
            }
        }, 1000);
        
        customAlert('【ゲームモード】\n駐車場エリアをタップして桜を咲かせよう！');
    },

    stop() {
        if (this.isActive) {
            if (typeof gtag === 'function') {
                gtag('event', 'end_game', {
                    'event_category': 'Game',
                    'event_label': 'Manual Exit',
                    'value': this.score
                });
            }
        }
        
        this.isActive = false;
        this.bombsActive = 0;
        this.resetCombo();
        if (this.exitButton) this.exitButton.disabled = false;
        
        clearInterval(this.timerId);
        this.timerId = null;
        if(this.timerElement) this.timerElement.textContent = '';

        document.body.classList.remove('game-mode');
        this.parkingArea.removeEventListener('click', this.handleAreaClick);
        this.resetElements();
    },

    end() {
        if (!this.isActive) return;
        this.isActive = false;

        if (typeof gtag === 'function') {
            gtag('event', 'end_game', {
                'event_category': 'Game',
                'event_label': 'Time Up',
                'value': this.score,
                'max_combo': this.maxCombo
            });
        }

        clearInterval(this.timerId);
        this.timerId = null;
        this.parkingArea.removeEventListener('click', this.handleAreaClick);
        
        document.body.classList.remove('game-mode');

        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem(HIGH_SCORE_KEY, this.highScore);
        }
        
        const gameOverScreen = document.getElementById('game-over-screen');
        const finalScoreElement = document.getElementById('final-score');
        const maxComboElement = document.getElementById('max-combo-display');
        
        finalScoreElement.textContent = `${this.score}点`;
        maxComboElement.textContent = `最高COMBO数 ${this.maxCombo}`;

        gameOverScreen.classList.remove('hidden');
        gameOverScreen.classList.add('show');
        
        this.isGameOverTransition = true;
        setTimeout(() => {
            this.isGameOverTransition = false;
        }, 2000);
    },

    updateScore(points) {
        if (!this.isActive) return;
        this.score += points;
        if (this.score > this.maxScore) {
            this.score = this.maxScore;
        }
        this.scoreElement.textContent = `お花スコア　${this.score}点`;
    },
    
    resetElements() {
        document.querySelectorAll('.scorch-mark').forEach(s => s.remove());
        document.querySelectorAll('.shatter-piece').forEach(p => p.remove());
        this.shatterPieces = [];
        this.scorchMarks = [];
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.draggables.forEach(el => {
            el.style.visibility = 'visible';
            el.style.pointerEvents = 'auto';
            el.classList.remove('cracked', 'cracked-1', 'cracked-2', 'cracked-3');
        });
    },

    resetCombo() {
        this.comboCount = 0;
        clearTimeout(this.comboResetTimer);
        this.comboResetTimer = null;
        if (this.comboDisplayElement) {
            this.comboDisplayElement.classList.remove('show');
        }
    },

    handleAreaClick: (e) => {
        if (!Game.isActive) return;
        Game.bombsActive++;
        if (Game.exitButton) Game.exitButton.disabled = true;
        new Bomb(e.clientX, e.clientY, Game.handleExplosion);
    },

    handleExplosion: (bomb) => {
        clearTimeout(Game.comboResetTimer);
        Game.comboCount++;
        if (Game.comboCount > Game.maxCombo) {
            Game.maxCombo = Game.comboCount;
        }

        if (Game.comboCount >= 2) {
            Game.comboCountElement.textContent = Game.comboCount;
            Game.updateScore(Game.comboCount * 10);
            const comboEl = Game.comboDisplayElement;
            comboEl.classList.remove('show');
            requestAnimationFrame(() => comboEl.classList.add('show'));
        }
        Game.comboResetTimer = setTimeout(() => { Game.resetCombo(); }, 2000);

        document.getElementById('main-content').classList.add('screen-shake');
        setTimeout(() => document.getElementById('main-content').classList.remove('screen-shake'), 500);

        const explosionEffect = document.createElement('div');
        explosionEffect.className = 'explosion-effect';
        Object.assign(explosionEffect.style, {
            left: `${bomb.pos.x}px`, top: `${bomb.pos.y}px`,
            width: `${Bomb.EXPLOSION_RADIUS * 2}px`, height: `${Bomb.EXPLOSION_RADIUS * 2}px`,
            marginLeft: `-${Bomb.EXPLOSION_RADIUS}px`, marginTop: `-${Bomb.EXPLOSION_RADIUS}px`,
        });
        document.body.appendChild(explosionEffect);
        setTimeout(() => explosionEffect.remove(), 400);

        const parkRect = Game.parkingArea.getBoundingClientRect();
        const scorch = document.createElement('div');
        scorch.className = 'scorch-mark';
        
        Object.assign(scorch.style, {
            left: `${bomb.pos.x - parkRect.left}px`,
            top: `${bomb.pos.y - parkRect.top}px`,
            width: '1px',
            height: '1px'
        });

        const flowerCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < flowerCount; i++) {
            const emojiObject = document.createElement('span');
            // ▼▼▼ この行を変更 ▼▼▼
            emojiObject.textContent = ['🍃', '🌸'][Math.floor(Math.random() * 2)];
            // ▲▲▲ ここまで変更 ▲▲▲
            
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * (Bomb.EXPLOSION_RADIUS / 2);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            Object.assign(emojiObject.style, {
                left: `${x}px`,
                top: `${y}px`,
                fontSize: `${15 + Math.random() * 10}px`,
                transform: `rotate(${Math.random() * 360}deg)`
            });
            scorch.appendChild(emojiObject);
        }
        
        Game.parkingArea.appendChild(scorch);
        Game.scorchMarks.push(scorch);
        if (Game.scorchMarks.length > MAX_SCORCH_MARKS) {
            const oldestScorch = Game.scorchMarks.shift();
            oldestScorch.classList.add('fading-out');
            oldestScorch.addEventListener('transitionend', () => {
                oldestScorch.remove();
            }, { once: true });
        }

        let scoreFromThisBomb = 0;
        let itemsHitThisBomb = 0;

        Game.draggables.forEach(el => {
            if (el.style.visibility === 'hidden') return;
            const elRect = el.getBoundingClientRect();
            const elCenter = { x: elRect.left + elRect.width / 2, y: elRect.top + elRect.height / 2 };
            const distance = Math.sqrt(Math.pow(elCenter.x - bomb.pos.x, 2) + Math.pow(elCenter.y - bomb.pos.y, 2));

            if (distance < Bomb.EXPLOSION_RADIUS) {
                itemsHitThisBomb++;
                let currentHits = parseInt(el.dataset.currentHits || '0');
                const hitsRequired = parseInt(el.dataset.hitsRequired || '2');
                currentHits++;
                el.dataset.currentHits = currentHits;

                if (currentHits >= hitsRequired) {
                    el.style.visibility = 'hidden';
                    el.style.pointerEvents = 'none';
                    Game.createShatterEffect(el);
                    scoreFromThisBomb += el.classList.contains('car') ? SCORE_DESTROY_CAR : SCORE_DESTROY_SPACE;
                } else {
                    el.classList.add('cracked', `cracked-${currentHits}`);
                    Game.createFragmentDebris(el);
                    scoreFromThisBomb += SCORE_CRACK;
                }
            }
        });

        for (let i = Game.shatterPieces.length - 1; i >= 0; i--) {
            const piece = Game.shatterPieces[i];
            const pieceRect = piece.getBoundingClientRect();
            const pieceCenter = { x: pieceRect.left + pieceRect.width / 2, y: pieceRect.top + pieceRect.height / 2 };
            const distance = Math.sqrt(Math.pow(pieceCenter.x - bomb.pos.x, 2) + Math.pow(pieceCenter.y - bomb.pos.y, 2));
            
            if (distance < Bomb.EXPLOSION_RADIUS) {
                itemsHitThisBomb++;
                Game.createDebris(piece, 1);
                piece.remove();
                Game.shatterPieces.splice(i, 1);
                scoreFromThisBomb += SCORE_DESTROY_SHATTER;
            }
        }

        const backgroundScore = Math.floor(Math.random() * 91) + 10;
        scoreFromThisBomb += backgroundScore;

        if (itemsHitThisBomb > 1) {
            scoreFromThisBomb *= itemsHitThisBomb;
        }

        Game.updateScore(scoreFromThisBomb);
        
        setTimeout(() => {
            Game.bombsActive--;
            if (Game.isActive && Game.exitButton && Game.bombsActive === 0) {
                Game.exitButton.disabled = false;
            }
        }, 1100);
    },

    createShatterEffect: (sourceElement) => {
        const rect = sourceElement.getBoundingClientRect();
        const parkRect = Game.parkingArea.getBoundingClientRect();
        const count = 2 + Math.floor(Math.random() * 2);
        const sourceColor = window.getComputedStyle(sourceElement).backgroundColor;

        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            piece.className = 'shatter-piece';
            
            const pieceWidth = sourceElement.offsetWidth / (Math.random() * 2 + 2);
            const pieceHeight = sourceElement.offsetHeight / (Math.random() * 2 + 2);
            const startX = rect.left - parkRect.left + (Math.random() * sourceElement.offsetWidth);
            const startY = rect.top - parkRect.top + (Math.random() * sourceElement.offsetHeight);

            Object.assign(piece.style, {
                left: `${startX}px`, top: `${startY}px`,
                width: `${pieceWidth}px`, height: `${pieceHeight}px`,
                backgroundColor: sourceColor,
            });
            
            Game.parkingArea.appendChild(piece);
            
            if (Game.shatterPieces.length < MAX_INTERACTIVE_PIECES) {
                Game.shatterPieces.push(piece);
            }
            
            requestAnimationFrame(() => {
                const angle = Math.random() * Math.PI * 2;
                const force = 40 + Math.random() * 50;
                const endX = Math.cos(angle) * force;
                const endY = Math.sin(angle) * force;
                const rotation = Math.random() * 720 - 360;
                piece.style.transform = `translate(${endX}px, ${endY}px) rotate(${rotation}deg)`;
            });
        }
    },
    
    createFragmentDebris: (sourceElement) => {
        if (Game.fragmentPool.length === 0) return;

        const fragment = Game.fragmentPool.pop();
        const rect = sourceElement.getBoundingClientRect();
        const parkRect = Game.parkingArea.getBoundingClientRect();
        
        Object.assign(fragment.style, {
            backgroundColor: window.getComputedStyle(sourceElement).backgroundColor,
            left: `${rect.left - parkRect.left + Math.random() * rect.width}px`,
            top: `${rect.top - parkRect.top + Math.random() * rect.height}px`,
            transform: `scale(${Math.random() * 0.5 + 0.5})`,
            opacity: '1'
        });

        requestAnimationFrame(() => {
            const angle = Math.random() * Math.PI * 2;
            const force = 30 + Math.random() * 40;
            fragment.style.transform = `translate(${Math.cos(angle) * force}px, ${Math.sin(angle) * force}px) rotate(${Math.random() * 720 - 360}deg) scale(0)`;
            fragment.style.opacity = '0';
        });
        
        setTimeout(() => {
            Game.fragmentPool.push(fragment);
        }, 1000);
    },
    
    createDebris: (sourceElement, level) => {
        const rect = sourceElement.getBoundingClientRect();
        const parkRect = Game.parkingArea.getBoundingClientRect();
        const count = 2;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const force = 0.5 + Math.random() * 1.5;
            const particle = {
                x: rect.left - parkRect.left + rect.width / 2,
                y: rect.top - parkRect.top + rect.height / 2,
                vx: Math.cos(angle) * force,
                vy: Math.sin(angle) * force,
                alpha: 1,
                decay: 0.02 + Math.random() * 0.01,
                size: 12 + Math.random() * 8,
                rotation: Math.random() * Math.PI * 2,
                text: ['🍃', '🌸'][Math.floor(Math.random() * 2)]
            };
            Game.particles.push(particle);
        }
    }
};

Game.init();
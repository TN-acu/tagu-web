class Bomb {
    static EXPLOSION_RADIUS = 80;

    constructor(x, y, onExplode) {
        this.pos = { x, y };
        this.onExplode = onExplode;
        this.body = document.body;
        this.count = 2; // ▼【修正】カウントを2秒に変更
        this.drop();
    }

   // ▼▼▼ この drop 関数をすべて置き換え ▼▼▼
    drop() {
        this.bomb = document.createElement("div");
        this.bomb.innerHTML = this.count;
        this.body.appendChild(this.bomb);
        
        // 画面サイズに合わせて大きさを変更
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
            pointerEvents: 'none', // クリックイベントが貫通するようにして置きやすくする
        });

        setTimeout(() => this.countDown(), 1000);
    }
    // ▲▲▲ ここまで置き換え ▲▲▲

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

const Game = {
    isActive: false,
    draggables: null,
    parkingArea: null,
    exitButton: null,
    score: 0,
    maxScore: 500000,
    scoreElement: null,
    bombsActive: 0,
    comboCount: 0,
    comboResetTimer: null,
    comboDisplayElement: null,
    comboCountElement: null,
    
    init() {
        this.draggables = document.querySelectorAll('.draggable');
        this.parkingArea = document.getElementById('parking-area');
        this.exitButton = document.getElementById('exit-game-button');
        this.scoreElement = document.getElementById('score-layer');
        this.comboDisplayElement = document.getElementById('combo-display');
        this.comboCountElement = document.getElementById('combo-count');
    },

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.score = 0;
        this.bombsActive = 0;
        if (this.exitButton) this.exitButton.disabled = false;
        this.resetCombo();
        this.updateScore(0);
        document.body.classList.add('game-mode');
        this.parkingArea.addEventListener('click', this.handleAreaClick);
        customAlert('【ゲームモード】\n駐車場エリアをタップして桜を咲かせよう！');
    },

    stop() {
        if (!this.isActive) return;
        this.isActive = false;
        this.bombsActive = 0;
        this.resetCombo();
        if (this.exitButton) this.exitButton.disabled = false;
        document.body.classList.remove('game-mode');
        this.parkingArea.removeEventListener('click', this.handleAreaClick);
        this.resetElements();
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
        document.querySelectorAll('.debris').forEach(d => d.remove());
        document.querySelectorAll('.scorch-mark').forEach(s => s.remove());
        this.draggables.forEach(el => {
            el.style.visibility = 'visible';
            el.style.pointerEvents = 'auto';
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

        if (Game.comboCount >= 2) {
            Game.comboCountElement.textContent = Game.comboCount;
            const comboBonus = Game.comboCount * 10;
            Game.updateScore(comboBonus);

            const comboEl = Game.comboDisplayElement;
            comboEl.classList.remove('show');
            setTimeout(() => {
                comboEl.classList.add('show');
            }, 10);
        }

        Game.comboResetTimer = setTimeout(() => {
            Game.resetCombo();
        }, 2000);

        // ▼▼▼ ここから2行を変更 ▼▼▼
        document.getElementById('main-content').classList.add('screen-shake');
        setTimeout(() => document.getElementById('main-content').classList.remove('screen-shake'), 500);
        // ▲▲▲ ここまで2行を変更 ▲▲▲

        const explosionEffect = document.createElement('div');
        explosionEffect.className = 'explosion-effect';
        Object.assign(explosionEffect.style, {
            left: `${bomb.pos.x}px`,
            top: `${bomb.pos.y}px`,
            width: `${Bomb.EXPLOSION_RADIUS * 2}px`,
            height: `${Bomb.EXPLOSION_RADIUS * 2}px`,
            marginLeft: `-${Bomb.EXPLOSION_RADIUS}px`,
            marginTop: `-${Bomb.EXPLOSION_RADIUS}px`,
        });
        document.body.appendChild(explosionEffect);
        setTimeout(() => explosionEffect.remove(), 400);

        const parkRect = Game.parkingArea.getBoundingClientRect();
        const scorch = document.createElement('div');
        scorch.className = 'scorch-mark';
        Object.assign(scorch.style, {
            left: `${bomb.pos.x - parkRect.left - Bomb.EXPLOSION_RADIUS / 2}px`,
            top: `${bomb.pos.y - parkRect.top - Bomb.EXPLOSION_RADIUS / 2}px`,
            width: `${Bomb.EXPLOSION_RADIUS}px`,
            height: `${Bomb.EXPLOSION_RADIUS}px`,
        });

        const flowerCount = 10 + Math.floor(Math.random() * 5);
        for (let i = 0; i < flowerCount; i++) {
            const flower = document.createElement('span');
            flower.textContent = '🌸';
            Object.assign(flower.style, {
                left: `${Math.random() * 90}%`,
                top: `${Math.random() * 90}%`,
                fontSize: `${15 + Math.random() * 10}px`,
                transform: `rotate(${Math.random() * 360}deg)`
            });
            scorch.appendChild(flower);
        }
        Game.parkingArea.appendChild(scorch);
        
        const backgroundScore = Math.floor(Math.random() * 91) + 10;
        Game.updateScore(backgroundScore);

        document.querySelectorAll('.debris').forEach(debris => {
            const elRect = debris.getBoundingClientRect();
            const elCenter = { x: elRect.left + elRect.width / 2, y: elRect.top + elRect.height / 2 };
            const distance = Math.sqrt(Math.pow(elCenter.x - bomb.pos.x, 2) + Math.pow(elCenter.y - bomb.pos.y, 2));
            
            const level = parseInt(debris.dataset.level || '1');
            if (distance < Bomb.EXPLOSION_RADIUS && level < 2) {
                Game.createDebris(debris, level + 1);
                debris.remove();
                Game.updateScore(10);
            }
        });

        Game.draggables.forEach(el => {
            if (el.style.visibility === 'hidden') return;
            const elRect = el.getBoundingClientRect();
            const elCenter = { x: elRect.left + elRect.width / 2, y: elRect.top + elRect.height / 2 };
            const distance = Math.sqrt(Math.pow(elCenter.x - bomb.pos.x, 2) + Math.pow(elCenter.y - bomb.pos.y, 2));

            if (distance < Bomb.EXPLOSION_RADIUS) {
                el.style.visibility = 'hidden';
                el.style.pointerEvents = 'none';
                Game.createDebris(el, 1);

                if (el.classList.contains('car')) {
                    Game.updateScore(100);
                } else if (el.classList.contains('space')) {
                    Game.updateScore(50);
                }
            }
        });

        setTimeout(() => {
            Game.bombsActive--;
            if (Game.isActive && Game.exitButton && Game.bombsActive === 0) {
                Game.exitButton.disabled = false;
            }
        }, 1100);
    },

        // ▼▼▼ この createDebris 関数をすべて置き換え ▼▼▼
    createDebris: (sourceElement, level) => {
        const rect = sourceElement.getBoundingClientRect();
        // 部品の数をさらに半分に変更
        const count = level === 1 ? 3 : 1;
        // 画面サイズに合わせて大きさを変更
        const baseSizeVmin = 4;
        const size = `calc(${level === 1 ? baseSizeVmin : baseSizeVmin / 1.5}vmin)`;

        for (let i = 0; i < count; i++) {
            const debris = document.createElement('div');
            debris.className = 'debris';
            debris.dataset.level = level;
            
            // 部品を「🌸」と「🍃」のランダムに変更
            const petals = ['🍃', '🌸'];
            debris.textContent = petals[Math.floor(Math.random() * petals.length)];
            
            const startX = rect.left + Math.random() * rect.width;
            const startY = rect.top + Math.random() * rect.height;

            Object.assign(debris.style, {
                left: `${startX}px`,
                top: `${startY}px`,
                zIndex: '5', // 図形より後ろに表示
                fontSize: size
            });
            
            document.body.appendChild(debris);

            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const force = 50 + Math.random() * 50;
                const endX = Math.cos(angle) * force;
                const endY = Math.sin(angle) * force;
                const rotation = Math.random() * 720 - 360;

                debris.style.transform = `translate(${endX}px, ${endY}px) rotate(${rotation}deg)`;
            }, 10);
        }
    }
    // ▲▲▲ ここまで置き換え ▲▲▲
};

Game.init = Game.init.bind(Game);
Game.start = Game.start.bind(Game);
Game.stop = Game.stop.bind(Game);
Game.resetElements = Game.resetElements.bind(Game);
Game.init();
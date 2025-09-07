document.addEventListener('DOMContentLoaded', () => {
    // --- 要素取得 ---
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreValueElement = document.getElementById('score-value');
    const targetNameElement = document.getElementById('target-name');
    const startScreen = document.getElementById('start-screen');
    const startButton = document.getElementById('start-button');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');
    const btnShoot = document.getElementById('btn-shoot');

    // --- ゲーム設定 ---
    let canvasWidth, canvasHeight;
    let score = 0;
    let gameActive = false;
    let player, bullets, targets;
    let currentTargetAcupoint = null;

    // レーン設定 (0: 2寸, 1: 4寸, 2: 6寸)
    const lanes = [0.25, 0.5, 0.75]; // キャンバス幅に対する割合

    // --- 経穴データ ---
    // 資料に基づき、経穴名と所属レーン（0: 2寸, 1: 4寸, 2: 6寸）を定義
    const acupointData = [
        // 2寸レーン (lane: 0)
        { name: "気戸", lane: 0 }, { name: "庫房", lane: 0 }, { name: "屋翳", lane: 0 },
        { name: "膺窓", lane: 0 }, { name: "乳中", lane: 0 }, { name: "乳根", lane: 0 },
        { name: "関門", lane: 0 }, { name: "天枢", lane: 0 }, { name: "帰来", lane: 0 },
        { name: "気衝", lane: 0 },
        // 4寸レーン (lane: 1)
        { name: "周栄", lane: 1 }, { name: "胸郷", lane: 1 }, { name: "天渓", lane: 1 },
        { name: "食荳", lane: 1 }, { name: "腹哀", lane: 1 }, { name: "大横", lane: 1 },
        { name: "府舎", lane: 1 }, { name: "衝門", lane: 1 },
        // 6寸レーン (lane: 2)
        { name: "中府", lane: 2 }
    ];

    // --- 初期化処理 ---
    function initGame() {
        resizeCanvas();
        score = 0;
        updateScoreDisplay();
        player = new Player();
        bullets = [];
        targets = [];
        gameActive = true;
        nextQuestion();
        gameLoop();
        setInterval(spawnTarget, 1500); // 1.5秒ごとに新しいターゲットを生成
    }

    function resizeCanvas() {
        canvasWidth = canvas.clientWidth;
        canvasHeight = canvas.clientHeight;
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
    }

    // --- プレイヤーオブジェクト ---
    class Player {
        constructor() {
            this.laneIndex = 1; // 初期レーン (中央の4寸)
            this.width = 40;
            this.height = 20;
            this.color = '#007bff';
        }

        draw() {
            const x = lanes[this.laneIndex] * canvasWidth - this.width / 2;
            const y = canvasHeight - this.height - 10;
            ctx.fillStyle = this.color;
            ctx.fillRect(x, y, this.width, this.height);
        }

        moveLeft() {
            if (this.laneIndex > 0) {
                this.laneIndex--;
            }
        }

        moveRight() {
            if (this.laneIndex < lanes.length - 1) {
                this.laneIndex++;
            }
        }

        shoot() {
            bullets.push(new Bullet(this.laneIndex));
        }
    }

    // --- 弾オブジェクト ---
    class Bullet {
        constructor(laneIndex) {
            this.laneIndex = laneIndex;
            this.x = lanes[laneIndex] * canvasWidth;
            this.y = canvasHeight - 30;
            this.radius = 5;
            this.speed = 8;
            this.color = '#ffc107';
        }

        update() {
            this.y -= this.speed;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    // --- ターゲットオブジェクト ---
    class Target {
        constructor(acupoint) {
            this.acupoint = acupoint;
            this.x = lanes[acupoint.lane] * canvasWidth;
            this.y = 0;
            this.radius = 15;
            this.speed = 1.5 + Math.random() * 1.5; // 速度にランダム性を持たせる
            this.isCorrectTarget = (this.acupoint.name === currentTargetAcupoint.name);
        }

        update() {
            this.y += this.speed;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            // 色分け: 正解ターゲットは目立つ色に、他は通常色に
            ctx.fillStyle = this.isCorrectTarget ? '#d9534f' : '#cccccc';
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.acupoint.name, this.x, this.y + 4);
        }
    }

    // --- ゲームロジック ---
    function spawnTarget() {
        if (!gameActive) return;
        // ランダムに経穴を選ぶ
        const randomAcupoint = acupointData[Math.floor(Math.random() * acupointData.length)];
        targets.push(new Target(randomAcupoint));
    }

    function nextQuestion() {
        currentTargetAcupoint = acupointData[Math.floor(Math.random() * acupointData.length)];
        targetNameElement.textContent = currentTargetAcupoint.name;
    }

    function updateScoreDisplay() {
        scoreValueElement.textContent = score;
    }

    function updateGameObjects() {
        // 弾の更新と画面外除去
        bullets.forEach((bullet, index) => {
            bullet.update();
            if (bullet.y < 0) {
                bullets.splice(index, 1);
            }
        });

        // ターゲットの更新と画面外除去
        targets.forEach((target, index) => {
            target.update();
            if (target.y > canvasHeight + target.radius) {
                targets.splice(index, 1);
            }
        });
    }

    function checkCollisions() {
        bullets.forEach((bullet, bIndex) => {
            targets.forEach((target, tIndex) => {
                // 簡易的な衝突判定
                const dist = Math.hypot(bullet.x - target.x, bullet.y - target.y);
                if (dist < target.radius) {
                    // 衝突発生
                    bullets.splice(bIndex, 1); // 弾を消去

                    if (target.isCorrectTarget) {
                        // 正解ターゲットを撃った場合
                        score += 10;
                        targets.splice(tIndex, 1); // ターゲットを消去
                        showFeedback("ヒット！ +10", target.x, target.y, true);
                        nextQuestion();
                    } else {
                        // 間違いターゲットを撃った場合
                        score -= 5;
                        showFeedback("お手つき！ -5", target.x, target.y, false);
                    }
                    updateScoreDisplay();
                }
            });
        });
    }

    // 画面にフィードバックテキストを表示する（簡易版）
    function showFeedback(text, x, y, positive) {
        const feedbackElement = document.createElement('div');
        feedbackElement.textContent = text;
        feedbackElement.style.position = 'absolute';
        feedbackElement.style.left = `${x}px`;
        feedbackElement.style.top = `${y}px`;
        feedbackElement.style.color = positive ? 'lime' : 'red';
        feedbackElement.style.fontSize = '16px';
        feedbackElement.style.fontWeight = 'bold';
        feedbackElement.style.transition = 'opacity 1s, transform 1s';
        feedbackElement.style.transform = 'translate(-50%, -50%)'; // 中央揃え
        document.getElementById('game-container').appendChild(feedbackElement);

        setTimeout(() => {
            feedbackElement.style.opacity = '0';
            feedbackElement.style.transform = 'translate(-50%, -100px)';
        }, 0);
        setTimeout(() => feedbackElement.remove(), 1000);
    }

    function drawLanes() {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        lanes.forEach(laneX => {
            ctx.beginPath();
            ctx.moveTo(laneX * canvasWidth, 0);
            ctx.lineTo(laneX * canvasWidth, canvasHeight);
            ctx.stroke();
        });
    }

    function drawGame() {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        drawLanes();
        player.draw();
        targets.forEach(target => target.draw());
        bullets.forEach(bullet => bullet.draw());
    }

    // --- メインループ ---
    function gameLoop() {
        if (!gameActive) return;
        updateGameObjects();
        checkCollisions();
        drawGame();
        requestAnimationFrame(gameLoop);
    }

    // --- イベントリスナー設定 ---
    startButton.addEventListener('click', () => {
        startScreen.style.display = 'none';
        initGame();
    });

    // キーボード操作
    window.addEventListener('keydown', (e) => {
        if (!gameActive) return;
        if (e.key === 'ArrowLeft') player.moveLeft();
        if (e.key === 'ArrowRight') player.moveRight();
        if (e.key === ' ') player.shoot();
    });

    // タッチボタン操作
    btnLeft.addEventListener('click', () => player.moveLeft());
    btnRight.addEventListener('click', () => player.moveRight());
    btnShoot.addEventListener('click', () => player.shoot());

    // ウィンドウリサイズ対応
    window.addEventListener('resize', resizeCanvas);
});

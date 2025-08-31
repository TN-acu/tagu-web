<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>タイマーアプリ</title>
    <style>
        body {
            font-family: sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #f0f0f0;
            margin: 0;
            padding: 20px; /* 全体の余白 */
            box-sizing: border-box; /* paddingを含めてwidth/heightを計算 */
        }
        
        /* 全体コンテナ */
        .main-container {
            display: flex; /* 子要素を横並びにする */
            gap: 20px; /* セクション間の隙間 */
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 6px 10px rgba(0,0,0,0.1);
            max-width: 1200px; /* 全体の最大幅 */
            width: 100%;
        }

        /* タイマーセクション */
        .timer-section {
            flex: 1; /* 利用可能なスペースを均等に使う */
            min-width: 450px; /* タイマーセクションの最小幅 */
            text-align: center;
        }

        /* 右側追加コントロール・画像セクション */
        .extra-controls-section {
            flex: 1; /* 利用可能なスペースを均等に使う */
            min-width: 450px; /* 追加コントロールセクションの最小幅 */
            display: flex;
            flex-direction: column; /* 子要素を縦並びにする */
            align-items: center; /* 中央揃え */
            gap: 20px;
        }

        h1 {
            font-size: 2.5em;
            color: #333;
            margin-top: 0;
            margin-bottom: 20px;
        }

        #timer-display {
            font-size: 8em;
            margin: 30px 0;
            font-family: monospace;
            color: #333;
            background-color: #e9ecef;
            padding: 10px 20px;
            border-radius: 8px;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.2);
        }
        .controls, .inputs {
            margin-bottom: 30px;
        }
        .inputs span {
            font-size: 4em;
            vertical-align: middle;
            color: #555;
            margin: 0 5px;
        }
        input[type="number"] {
            width: 160px;
            font-size: 4.2em;
            text-align: center;
            border: 2px solid #ccc;
            border-radius: 5px;
            padding: 5px 10px;
            -moz-appearance: textfield; /* Firefox の矢印を非表示 */
        }
        /* Chrome, Safari, Edge の矢印を非表示 */
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }

        button {
            font-size: 3.2em;
            padding: 10px 20px;
            margin: 0 10px; /* ボタン間の左右余白 */
            cursor: pointer;
            border-radius: 5px;
            border: none;
            background-color: #007bff;
            color: white;
            transition: background-color 0.3s, transform 0.1s;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        button:hover {
            background-color: #0056b3;
            transform: translateY(-1px);
        }
        button:active {
            transform: translateY(1px);
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        #stop-btn { background-color: #dc3545; }
        #stop-btn:hover { background-color: #c82333; }
        #reset-btn { background-color: #6c757d; }
        #reset-btn:hover { background-color: #5a6268; }

        /* 新しいプリセットボタンのスタイル */
        .preset-buttons {
            display: flex;
            flex-direction: column; /* 縦に並べる */
            gap: 15px; /* ボタン間の縦の隙間 */
            width: 100%;
            max-width: 400px; /* プリセットボタンの最大幅 */
            margin-top: 20px;
        }
        .preset-buttons button {
            width: 100%;
            margin: 0; /* 親のFlexboxで隙間を制御するためマージンをリセット */
            font-size: 2.5em; /* フォントサイズ調整 */
            padding: 15px 20px;
            background-color: #28a745; /* 緑色 */
        }
        .preset-buttons button:hover {
            background-color: #218838;
        }

        /* 画像スタイル */
        .image-container {
            margin-top: 30px;
            text-align: center;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 8px;
            background-color: #fff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .image-container img {
            max-width: 100%;
            height: auto;
            display: block; /* 余分な下マージンを削除 */
            margin: 0 auto; /* 中央揃え */
        }
    </style>
</head>
<body>

<div class="main-container">
    
    <div class="timer-section">
        <h1>タイマー</h1>
        <div class="inputs">
            <input type="number" id="minutes-input" placeholder="分" min="0" value="2">
            <span>:</span>
            <input type="number" id="seconds-input" placeholder="秒" min="0" max="59" value="30">
        </div>
        <div id="timer-display">02:30</div>
        <div class="controls">
            <button id="start-btn">スタート</button>
            <button id="stop-btn">ストップ</button>
            <button id="reset-btn">リセット</button>
        </div>
    </div>

    <div class="extra-controls-section">
        <h1>プリセット & 参照</h1>
        <div class="preset-buttons">
            <button id="preset-okyu-btn">お灸（5分）</button>
            <button id="preset-shashi-btn">斜刺（2分30秒）</button>
            <button id="preset-suiheishi-btn">水平刺（2分30秒）</button>
        </div>
        <div class="image-container">
            <img id="needle-angle-img" src="needle_angles.png" alt="鍼の刺入角度">
        </div>
    </div>

</div>

<script>
    // --- JavaScriptコード ---
    const minutesInput = document.getElementById('minutes-input');
    const secondsInput = document.getElementById('seconds-input');
    const timerDisplay = document.getElementById('timer-display');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const resetBtn = document.getElementById('reset-btn');

    // 新しいプリセットボタンの取得
    const presetOkyuBtn = document.getElementById('preset-okyu-btn');
    const presetShashiBtn = document.getElementById('preset-shashi-btn');
    const presetSuiheishiBtn = document.getElementById('preset-suiheishi-btn');

    // ローカルの音声ファイルを指定 (HTMLファイルと同じフォルダに置く)
    const alarmSound = new Audio('alarm.mp3');

    let timerId = null;
    let remainingTime = 0;

    function updateInitialDisplay() {
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function updateDisplay() {
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // 残り時間が0になったら、タイマー表示を赤くするなどの視覚的なフィードバックも可能
        if (remainingTime <= 0) {
            timerDisplay.style.color = '#dc3545'; // 赤色
        } else {
            timerDisplay.style.color = '#333'; // 通常の色に戻す
        }
    }

    function startTimer() {
        if (timerId !== null) { return; } // 既にタイマーが動作中なら何もしない

        // remainingTimeが0以下の場合は、入力欄から時間を設定
        if (remainingTime <= 0) {
            const minutes = parseInt(minutesInput.value) || 0;
            const seconds = parseInt(secondsInput.value) || 0;
            remainingTime = minutes * 60 + seconds;
        }
        
        if (remainingTime <= 0) {
            alert('時間を設定してください。');
            return;
        }

        updateDisplay(); // 即座に表示を更新
        timerDisplay.style.color = '#333'; // タイマー開始時に色をリセット

        timerId = setInterval(() => {
            remainingTime--;
            updateDisplay();
            if (remainingTime <= 0) {
                stopTimer();
                alarmSound.play().catch(e => console.error("音声の再生に失敗しました:", e));
                alert('時間です！');
            }
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerId);
        timerId = null;
    }

    function resetTimer() {
        stopTimer();
        remainingTime = 0;
        updateInitialDisplay(); // 入力値に基づいて表示をリセット
        timerDisplay.style.color = '#333'; // 色をリセット
    }

    // プリセットボタンの処理
    function setPresetAndStart(minutes, seconds) {
        stopTimer(); // まず現在のタイマーを停止
        minutesInput.value = minutes;
        secondsInput.value = seconds;
        updateInitialDisplay(); // 表示をプリセット値に更新
        remainingTime = minutes * 60 + seconds; // remainingTimeも更新
        startTimer(); // タイマーを開始
    }

    // イベントリスナーの設定
    startBtn.addEventListener('click', startTimer);
    stopBtn.addEventListener('click', stopTimer);
    resetBtn.addEventListener('click', resetTimer);
    minutesInput.addEventListener('input', updateInitialDisplay);
    secondsInput.addEventListener('input', updateInitialDisplay);

    // プリセットボタンのイベントリスナー
    presetOkyuBtn.addEventListener('click', () => setPresetAndStart(5, 0));
    presetShashiBtn.addEventListener('click', () => setPresetAndStart(2, 30));
    presetSuiheishiBtn.addEventListener('click', () => setPresetAndStart(2, 30));

    // ページ読み込み時に一度表示を更新する
    updateInitialDisplay();
    // --- JavaScriptコードここまで ---
</script>

</body>
</html>
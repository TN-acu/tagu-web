window.addEventListener('DOMContentLoaded', () => {
    // ボタン要素
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');

    // スライダーと値表示の要素
    const delaySlider = document.getElementById('delaySlider');
    const delayValueSpan = document.getElementById('delayValue');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValueSpan = document.getElementById('volumeValue');

    // Web Audio API と MediaStream のオブジェクト
    let audioContext = null;
    let mediaStream = null;
    let sourceNode = null;
    let delayNode = null; 
    let gainNode = null; 

    // --- ▼▼▼【 1. 保存機能の追加 】▼▼▼ ---

    // localStorageに保存するための「キー」を定義
    const DELAY_KEY = 'naokioku_delay_setting';
    const VOLUME_KEY = 'naokioku_volume_setting';

    // 読み込み処理（ページロード時に実行）
    function loadSettings() {
        const savedDelay = localStorage.getItem(DELAY_KEY);
        const savedVolume = localStorage.getItem(VOLUME_KEY);

        // 保存された値があれば、スライダーのデフォルト値として設定
        if (savedDelay !== null) {
            delaySlider.value = savedDelay;
        }
        if (savedVolume !== null) {
            volumeSlider.value = savedVolume;
        }
    }

    // --- ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ ---


    // --- 2. スライダーの初期値設定とイベントリスナー ---
    
    // ★(変更) 読み込み処理を実行
    loadSettings();

    // ★(変更) ページ読み込み時のスパン反映（保存値が反映された後の現在値を使う）
    delayValueSpan.textContent = `${Number(delaySlider.value).toFixed(1)} 秒`;
    volumeValueSpan.textContent = `${volumeSlider.value} %`;

    // 遅延スライダーのイベント (inputイベントでリアルタイムに反応)
    delaySlider.addEventListener('input', (e) => {
        const delaySec = Number(e.target.value);
        delayValueSpan.textContent = `${delaySec.toFixed(1)} 秒`;
        
        // ★(追加) localStorage に値を保存
        localStorage.setItem(DELAY_KEY, delaySec);

        if (delayNode) {
            delayNode.delayTime.setValueAtTime(delaySec, audioContext.currentTime);
        }
    });

    // 音量スライダーのイベント
    volumeSlider.addEventListener('input', (e) => {
        const volumePercent = e.target.value;
        volumeValueSpan.textContent = `${volumePercent} %`;
        
        // ★(追加) localStorage に値を保存
        localStorage.setItem(VOLUME_KEY, volumePercent);

        const gainValue = volumePercent / 100.0;
        
        if (gainNode) {
            gainNode.gain.setValueAtTime(gainValue, audioContext.currentTime);
        }
    });


    // --- 3. スタート/ストップ処理 (※このセクションに変更なし) ---

    // スタートボタンの処理
    startButton.addEventListener('click', async () => {
        try {
            // AudioContextの準備
            if (!audioContext || audioContext.state === 'closed') {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            // マイクストリームの取得
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: { echoCancellation: true } 
            });

            // 3. Audioノードの作成
            sourceNode = audioContext.createMediaStreamSource(mediaStream);
            delayNode = audioContext.createDelay(4.0); 
            gainNode = audioContext.createGain(); 

            // 4. スライダーの現在値を取得してノードに初期設定
            const currentDelay = Number(delaySlider.value);
            const currentGain = Number(volumeSlider.value) / 100.0;

            delayNode.delayTime.value = currentDelay;
            gainNode.gain.value = currentGain;

            // 5. ノードの接続グラフを変更
            sourceNode.connect(delayNode);
            delayNode.connect(gainNode);      
            gainNode.connect(audioContext.destination);

            // ボタン状態の更新
            startButton.disabled = true;
            stopButton.disabled = false;

        } catch (err) {
            console.error('オーディオの開始に失敗しました:', err);
            alert('マイクへのアクセスが許可されなかったか、エラーが発生しました。');
        }
    });

    // 停止ボタンの処理
    stopButton.addEventListener('click', () => {
        if (!mediaStream) return;

        mediaStream.getTracks().forEach(track => {
            track.stop();
        });

        if (sourceNode) {
            sourceNode.disconnect();
            sourceNode = null;
        }
        if (delayNode) {
            delayNode.disconnect();
            delayNode = null;
        }
        if (gainNode) { 
            gainNode.disconnect();
            gainNode = null;
        }
        
        if (audioContext && audioContext.state === 'running') {
            audioContext.suspend();
        }

        mediaStream = null;
        
        startButton.disabled = false;
        stopButton.disabled = true;
    });
});
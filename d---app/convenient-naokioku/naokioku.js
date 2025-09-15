window.addEventListener('DOMContentLoaded', () => {
    // ボタン要素
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');

    // スライダー要素
    const delaySlider = document.getElementById('delaySlider');
    const delayValueSpan = document.getElementById('delayValue');
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValueSpan = document.getElementById('volumeValue');

    // チェックボックス要素
    const compressorToggle = document.getElementById('compressorToggle');
    const compressorSpan = document.getElementById('compressorStatus');
    const noiseToggle = document.getElementById('noiseToggle');
    const noiseToggleSpan = document.getElementById('noiseToggleStatus');
    const highCutToggle = document.getElementById('highCutToggle'); // ★高音カット チェックボックス
    const highCutSpan = document.getElementById('highCutStatus'); // ★高音カット スパン

    // Web Audio API オブジェクト
    let audioContext = null;
    let mediaStream = null; 
    let sourceNode = null;
    let delayNode = null; 
    let gainNode = null; 
    let compressorNode = null;
    let biquadFilterNode = null; // ★高音カット用フィルターノード

    // --- 1. localStorage と設定 ---

    const DELAY_KEY = 'naokioku_delay_setting';
    const VOLUME_KEY = 'naokioku_volume_setting';
    const COMPRESSOR_KEY = 'naokioku_compressor_setting';
    const NOISE_KEY = 'naokioku_noise_setting';
    const HIGH_CUT_KEY = 'naokioku_highcut_setting'; // ★高音カット設定キー

    function loadSettings() {
        const savedDelay = localStorage.getItem(DELAY_KEY);
        const savedVolume = localStorage.getItem(VOLUME_KEY);
        const savedCompressor = localStorage.getItem(COMPRESSOR_KEY);
        const savedNoise = localStorage.getItem(NOISE_KEY);
        const savedHighCut = localStorage.getItem(HIGH_CUT_KEY); // ★読み込み

        if (savedDelay !== null) delaySlider.value = savedDelay;
        if (savedVolume !== null) volumeSlider.value = savedVolume;
        
        // "false" (文字列) の場合にのみチェックを外す
        compressorToggle.checked = (savedCompressor !== 'false');
        noiseToggle.checked = (savedNoise !== 'false');
        highCutToggle.checked = (savedHighCut !== 'false'); // ★反映
    }

    // --- 2. スライダーとチェックボックスのリスナー ---
    
    loadSettings();

    // スパン表示の初期化
    delayValueSpan.textContent = `${Number(delaySlider.value).toFixed(1)} 秒`;
    volumeValueSpan.textContent = `${volumeSlider.value} %`;
    updateCompressorSpan();
    updateNoiseSpan();
    updateHighCutSpan(); // ★高音カットスパン初期化

    // 遅延スライダー
    delaySlider.addEventListener('input', (e) => {
        const delaySec = Number(e.target.value);
        delayValueSpan.textContent = `${delaySec.toFixed(1)} 秒`;
        localStorage.setItem(DELAY_KEY, delaySec);
        if (delayNode) delayNode.delayTime.setValueAtTime(delaySec, audioContext.currentTime);
    });

    // 音量スライダー
    volumeSlider.addEventListener('input', (e) => {
        const volumePercent = e.target.value;
        volumeValueSpan.textContent = `${volumePercent} %`;
        localStorage.setItem(VOLUME_KEY, volumePercent);
        const gainValue = volumePercent / 100.0;
        if (gainNode) gainNode.gain.setValueAtTime(gainValue, audioContext.currentTime);
    });

    // ハウリング抑制 (コンプレッサー)
    compressorToggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        localStorage.setItem(COMPRESSOR_KEY, isEnabled);
        updateCompressorState(); 
        updateCompressorSpan(); 
    });

    // ノイズ防止
    noiseToggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        localStorage.setItem(NOISE_KEY, isEnabled);
        updateNoiseSpan();
        applyAudioConstraints(); 
    });

    // ★高音カットフィルター
    highCutToggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        localStorage.setItem(HIGH_CUT_KEY, isEnabled);
        updateFilterState(); // ★フィルター状態を更新
        updateHighCutSpan();
    });


    // --- 3. 補助関数 ---

    function updateCompressorSpan() {
        compressorSpan.textContent = compressorToggle.checked ? '(リミッターON)' : '(OFF - 危険)';
    }
    function updateNoiseSpan() {
        noiseToggleSpan.textContent = noiseToggle.checked ? '(ブラウザ機能 ON)' : '(OFF)';
    }
    // ★高音カットスパン更新
    function updateHighCutSpan() {
        highCutSpan.textContent = highCutToggle.checked ? '(3000Hz以上をカット)' : '(OFF)';
    }

    // コンプレッサー状態更新
    function updateCompressorState() {
        if (!compressorNode) return;
        const isEnabled = compressorToggle.checked;
        const now = audioContext.currentTime;
        if (isEnabled) {
            compressorNode.threshold.setValueAtTime(-50, now);
            compressorNode.knee.setValueAtTime(40, now);
            compressorNode.ratio.setValueAtTime(12, now);
            compressorNode.attack.setValueAtTime(0, now);
            compressorNode.release.setValueAtTime(0.25, now);
        } else {
            compressorNode.threshold.setValueAtTime(0, now);
            compressorNode.knee.setValueAtTime(0, now);
            compressorNode.ratio.setValueAtTime(1, now);
            compressorNode.attack.setValueAtTime(0, now);
        }
    }
    
    // ★高音カットフィルター状態更新
    function updateFilterState() {
        if (!biquadFilterNode) return;

        const isEnabled = highCutToggle.checked;
        const now = audioContext.currentTime;
        // フィルタータイプは常にローパスに設定
        biquadFilterNode.type = 'lowpass';
        
        if (isEnabled) {
            // ON: 3000Hz (ハウリングが起きやすい高音域) 以上をカット
            biquadFilterNode.frequency.setValueAtTime(3000, now);
            biquadFilterNode.Q.setValueAtTime(1, now); // 標準的な品質
        } else {
            // OFF: フィルターをバイパス（実質的に無効化）
            // 可聴域の上限を超える周波数（ナイキスト周波数、通常22050Hzなど）に設定
            biquadFilterNode.frequency.setValueAtTime(22050, now);
        }
    }

    // マイク制約の適用
    function applyAudioConstraints() {
        if (!mediaStream) return; 
        const isNoiseSuppressionOn = noiseToggle.checked;
        const constraints = { noiseSuppression: isNoiseSuppressionOn };
        const audioTrack = mediaStream.getAudioTracks()[0];
        if (audioTrack && audioTrack.applyConstraints) {
            audioTrack.applyConstraints(constraints)
                .catch(e => console.warn("制約の適用に失敗:", e));
        }
    }

    // --- 4. スタート/ストップ処理 ---

    // スタートボタン
    startButton.addEventListener('click', async () => {
        try {
            if (!audioContext || audioContext.state === 'closed') {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            const audioConstraints = {
                echoCancellation: true,
                noiseSuppression: noiseToggle.checked 
            };
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });

            // 3. Audioノード作成
            sourceNode = audioContext.createMediaStreamSource(mediaStream);
            delayNode = audioContext.createDelay(4.0); 
            gainNode = audioContext.createGain(); 
            biquadFilterNode = audioContext.createBiquadFilter(); // ★フィルターノード作成
            compressorNode = audioContext.createDynamicsCompressor(); 

            // 4. 初期値設定
            delayNode.delayTime.value = Number(delaySlider.value);
            gainNode.gain.value = Number(volumeSlider.value) / 100.0;
            updateCompressorState(); // コンプレッサー初期化
            updateFilterState();     // ★フィルター初期化

            // 5. ★ノード接続 (Gain -> Filter -> Compressor)
            sourceNode.connect(delayNode);
            delayNode.connect(gainNode);      
            gainNode.connect(biquadFilterNode);      // Gain を Filter へ
            biquadFilterNode.connect(compressorNode); // Filter を Compressor へ
            compressorNode.connect(audioContext.destination); // Compressor をスピーカーへ

            startButton.disabled = true;
            stopButton.disabled = false;

        } catch (err) {
            console.error('オーディオの開始に失敗しました:', err);
            alert('マイクへのアクセスが許可されなかったか、エラーが発生しました。');
        }
    });

    // 停止ボタン
    stopButton.addEventListener('click', () => {
        if (!mediaStream) return;

        mediaStream.getTracks().forEach(track => track.stop());

        // ★すべてのノードを切断
        if (sourceNode) sourceNode.disconnect();
        if (delayNode) delayNode.disconnect();
        if (gainNode) gainNode.disconnect();
        if (biquadFilterNode) biquadFilterNode.disconnect(); // ★フィルター切断
        if (compressorNode) compressorNode.disconnect();

        // ノード参照を破棄
        sourceNode = null;
        delayNode = null;
        gainNode = null;
        compressorNode = null;
        biquadFilterNode = null; // ★参照破棄
        mediaStream = null;
        
        if (audioContext && audioContext.state === 'running') {
            audioContext.suspend();
        }
        
        startButton.disabled = false;
        stopButton.disabled = true;
    });
});
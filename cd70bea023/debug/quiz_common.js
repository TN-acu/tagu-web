// HTML要素の取得
const scoreText = document.getElementById('score-text');
const quizBody = document.getElementById('quiz-body');
const finishBtn = document.getElementById('finish-btn');
const fontIncreaseBtn = document.getElementById('font-increase-btn');
const fontDecreaseBtn = document.getElementById('font-decrease-btn');
const pdfBtn = document.getElementById('pdf-btn');
const jumpMenu = document.getElementById('jump-menu');

let quizzes = [];
let userAnswers = {};
let currentFontScale = 1.0;
let isReadyForPrint = false;

// ▼▼▼ 追加: スクロール位置保存用 ▼▼▼
let scrollSaveTimer = null;
const SAVE_SCROLL_DEBOUNCE_MS = 500; // 500ms スクロールが止まったら保存
let currentDataFileKey = ''; // 保存用キー (例: quizLastPosition_data_file.txt)
// ▲▲▲ 追加ここまで ▲▲▲

// デバイスがモバイル（iOS/Android）かどうかを判定する
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Fisher-Yatesアルゴリズムを使って配列をシャッフルする関数
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// テキストファイルからクイズデータを読み込んで表示する
// ▼▼▼ 修正: setupQuizがメタ情報(TITLE, INTERVAL)をTXTから読み込むように変更 ▼▼▼
async function setupQuiz(dataTxtFile) {
    
    // ▼▼▼ 修正: 二重読み込み防止のため、quizzes配列をリセット ▼▼▼
    quizzes = [];
    userAnswers = {};
    quizBody.innerHTML = ''; // 既存のクイズ内容をクリア
    // ▲▲▲ 修正ここまで ▲▲▲

    // ▼▼▼ 追加: スクロール位置保存用のキーを設定 ▼▼▼
    currentDataFileKey = 'quizLastPosition_' + dataTxtFile;
    // ▲▲▲ 追加ここまで ▲▲▲

    try {
        if (isMobileDevice()) {
            pdfBtn.style.display = 'none';
        }

        const response = await fetch(dataTxtFile);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const lines = text.split('\n');

        // メタ情報（タイトル、間隔）を格納する変数
        let quizTitle = "クイズ"; // デフォルトタイトル
        let pdfInterval = 6;     // デフォルト間隔 (※ ユーザー指摘によりジャンプメニューにも流用)

        // 1行目からメタ情報を読み取る
        if (lines.length > 0 && lines[0].startsWith('#!')) {
            const metaLine = lines[0].substring(3).trim(); // '#! ' を除去
            const parts = metaLine.split(',');
            parts.forEach(part => {
                const keyValue = part.split(':');
                if (keyValue.length === 2) {
                    const key = keyValue[0].trim().toUpperCase();
                    const value = keyValue[1].trim();
                    if (key === 'TITLE') {
                        quizTitle = value;
                    } else if (key === 'INTERVAL') {
                        const intervalNum = parseInt(value, 10);
                        if (!isNaN(intervalNum) && intervalNum > 0) {
                            pdfInterval = intervalNum;
                        }
                    }
                }
            });
            lines.shift(); // メタ情報行を削除
        }

        // ▼▼▼ 修正: 読み取ったタイトルをHTMLに設定 ▼▼▼
        document.title = quizTitle; // ブラウザタブのタイトル
        document.getElementById('quiz-title-main').textContent = quizTitle; // ページ内のh1タイトル
        // ▲▲▲ 修正ここまで ▲▲▲

        let currentQuiz = {};
        
        lines.forEach((line, index) => {
            line = line.trim();
            if (line.startsWith('?')) {
                if (Object.keys(currentQuiz).length > 0) {
                    quizzes.push(currentQuiz);
                }
                currentQuiz = {
                    // ▼▼▼ 変更: 問題文から行頭の「1. 」などを削除する正規表現を追加 ▼▼▼
                    question: line.substring(1).trim().replace(/^\d+\s*[.．]\s*/, ''),
                    // ▲▲▲ 変更ここまで ▲▲▲
                    choices: [],
                    correctAnswer: null,
                    explanation: ""
                };
            } else if (line.startsWith('*')) {
                const choice = line.substring(1).trim();
                // ▼▼▼ 追加: 選択肢が「-」のみの場合は除外 ▼▼▼
                if (choice !== '-') {
                    currentQuiz.choices.push(choice);
                    currentQuiz.correctAnswer = choice;
                }
                // ▲▲▲ 追加ここまで ▲▲▲
            } else if (line.startsWith('@')) {
                currentQuiz.explanation = line.substring(1).trim().replace(/\\n/g, '\n');
            } else if (line.length > 0) {
                // ▼▼▼ 追加: 選択肢が「-」のみの場合は除外 ▼▼▼
                if (line !== '-') {
                    currentQuiz.choices.push(line);
                }
                // ▲▲▲ 追加ここまで ▲▲▲
            }
        });
        
        if (Object.keys(currentQuiz).length > 0) {
            quizzes.push(currentQuiz);
        }
        
        quizzes.forEach((quiz, index) => {
            userAnswers[index] = null;
            
            const quizItem = document.createElement('div');
            quizItem.className = 'quiz-item';
            quizItem.id = `quiz-${index}`;
            
            const questionContent = document.createElement('div');
            questionContent.className = 'question-content';

            const questionText = document.createElement('div');
            questionText.className = 'question-text';
            
            // ▼▼▼ 修正: 「問題 N:」 の部分を <strong> タグで囲み太字にする ▼▼▼
            questionText.innerHTML = `<strong>問題 ${index + 1}:</strong> ${quiz.question.replace(/\\n/g, '<br>')}`;
            // ▲▲▲ 修正ここまで ▲▲▲
            
            questionContent.appendChild(questionText);
            
            const choicesContainer = document.createElement('div');
            choicesContainer.className = 'choices-container';
            
            const shuffledChoices = [...quiz.choices];
            shuffleArray(shuffledChoices);
            
            shuffledChoices.forEach(choice => {
                const choiceBtn = document.createElement('button');
                choiceBtn.className = 'choice-btn';
                
                // ▼▼▼ 変更: 回答比較を data- 属性経由に変更 ▼▼▼
                choiceBtn.innerHTML = choice.replace(/\\n/g, '<br>');
                choiceBtn.dataset.choiceValue = choice; // data-choice-value 属性に生の値を保存
                choiceBtn.onclick = () => selectAnswer(index, choiceBtn); // btnElement のみ渡す
                // ▲▲▲ 変更ここまで ▲▲▲
                
                choicesContainer.appendChild(choiceBtn);
            });
            
            questionContent.appendChild(choicesContainer);
            
            const feedbackText = document.createElement('div');
            feedbackText.className = 'feedback-text';
            questionContent.appendChild(feedbackText);
            
            quizItem.appendChild(questionContent);
            
            const answerDisplay = document.createElement('div');
            answerDisplay.className = 'answer-display';
            answerDisplay.id = `answer-display-${index}`;
            // ▼▼▼ 変更: PDF化（画像参照）のため、ここに正解の全文をセット ▼▼▼
            answerDisplay.textContent = quiz.correctAnswer;
            // ▲▲▲ 変更ここまで ▲▲▲
            quizItem.appendChild(answerDisplay);
            
            quizBody.appendChild(quizItem);
        });

        // ▼▼▼ 修正: INTERVAL による page-break-after: always を削除 ▼▼▼
        /*
        if (pdfInterval > 0) {
            const styleId = 'dynamic-pdf-style';
            let styleElement = document.getElementById(styleId);
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = styleId;
                document.head.appendChild(styleElement);
            }
            // 既存の :nth-child(6n) ルールを上書き
            styleElement.textContent = `
                @media print {
                    .quiz-item:nth-child(${pdfInterval}n):not(:last-child) {
                        page-break-after: always !important; 
                    }
                }
            `;
        }
        */
        // ▲▲▲ 修正ここまで ▲▲▲

        // ▼▼▼ 修正: ジャンプメニュー生成時に間隔(pdfInterval)を渡す ▼▼▼
        populateJumpMenu(quizzes.length, pdfInterval);
        // ▲▲▲ 修正ここまで ▲▲▲
        updateScore();

        // ▼▼▼ 追加: 親フレームにクイズロード完了と問題数を通知 ▼▼▼
        if (window.parent && window.parent.postMessage) {
            window.parent.postMessage({
                type: 'quizLoaded',
                quizCount: quizzes.length,
                dataFile: dataTxtFile // どのファイルのロードが完了したか
            }, '*'); // file:// 環境も考慮して '*'
        }
        // ▲▲▲ 追加ここまで ▲▲▲

    } catch (error) {
        console.error('クイズの読み込みに失敗しました:', error);
        quizBody.innerHTML = `<p style="color: red;">クイズの読み込みに失敗しました: ${error.message}</p>`;
    }

    // ▼▼▼ 追加: スクロール位置の復元処理 ▼▼▼
    try {
        const savedY = localStorage.getItem(currentDataFileKey);
        if (savedY) {
            const y = parseInt(savedY, 10);
            if (!isNaN(y) && y > 0) {
                
                // スクロール復元 (DOM描画が完了するのを待つため少し遅延させる)
                setTimeout(() => {
                    window.scrollTo({ top: y, behavior: 'auto' });
                    
                    // 親フレームにトースト表示を依頼
                    if (window.parent && window.parent.postMessage) {
                        // '*' オリジンはセキュリティ上推奨されないが、
                        // file:// 環境やローカル開発環境での利便性を優先
                        window.parent.postMessage('quizPositionRestored', '*');
                    }
                }, 100); // 100ms待機
            }
        }
    } catch (e) {
        console.warn('Failed to restore scroll position:', e);
    }
    // ▲▲▲ 追加ここまで ▲▲▲
}
// ▲▲▲ 修正ここまで ▲▲▲

// ▼▼▼ 変更: リアルタイムでフィードバックを表示するよう修正 ▼▼▼
function selectAnswer(quizIndex, btnElement) {
    if (isReadyForPrint) return; 
    // ▼▼▼ 修正: 採点後は選択できないようにする ▼▼▼
    if (isFinished) return; 
    // ▲▲▲ 修正ここまで ▲▲▲

    const choice = btnElement.dataset.choiceValue; // data属性から生の回答を取得
    userAnswers[quizIndex] = choice;
    
    const quizItem = document.getElementById(`quiz-${quizIndex}`);
    const choiceButtons = quizItem.querySelectorAll('.choice-btn');
    // ▼▼▼ 追加: feedback-text を取得 ▼▼▼
    const feedbackText = quizItem.querySelector('.feedback-text'); 
    
    const quiz = quizzes[quizIndex];
    const isCorrect = (choice === quiz.correctAnswer);

    // 他の選択肢の 'selected' を解除
    choiceButtons.forEach(btn => {
        btn.classList.remove('selected');
    });
    
    // 選択したボタンに 'selected' を設定
    btnElement.classList.add('selected');

    // ▼▼▼ 変更: リアルタイムでフィードバックを表示 (フォーマット変更) ▼▼▼
    if (isCorrect) {
        feedbackText.textContent = `正解！ ${quiz.explanation}`;
        feedbackText.style.color = 'green';
    } else {
        feedbackText.textContent = `不正解... 正解は「${quiz.correctAnswer}」 ${quiz.explanation}`;
        feedbackText.style.color = 'red';
    }
    // ▲▲▲ 変更ここまで ▲▲▲
    
    updateScore();
}
// ▲▲▲ 変更ここまで ▲▲▲

function updateScore() {
    let score = 0;
    let answeredCount = 0;
    quizzes.forEach((quiz, index) => {
        if (userAnswers[index] === quiz.correctAnswer) {
            score++;
        }
        // ▼▼▼ 修正: undefined も null と同様に「未回答」として扱う ▼▼▼
        if (userAnswers[index] !== null && userAnswers[index] !== undefined) {
        // ▲▲▲ 修正ここまで ▲▲▲
            answeredCount++;
        }
    });
    // ▼▼▼ 修正: (回答済: ...) の表示を削除 ▼▼▼
    scoreText.textContent = `正解数: ${score} / ${quizzes.length}`;
    // ▲▲▲ 修正ここまで ▲▲▲
}

// ▼▼▼ 修正: 採点(finishQuiz)をクイズ終了(isFinished)状態と分離 ▼▼▼
let isFinished = false; // クイズが終了状態（採点済み）かを示すフラグ

// ▼▼▼ 変更: ボタンのイベントリスナーを関数として定義 ▼▼▼
function handleFinishClick() {
    finishQuiz(true);
    
    // ▼▼▼ 追加: 採点完了時にPDFボタンのステータスを変更 (touyouigakugairon...js のロジック) ▼▼▼
    isReadyForPrint = true;
    pdfBtn.textContent = '印刷プレビューを開く';
    pdfBtn.classList.add('ready'); // (quiz_style.css に .ready スタイルあり)
    // ▲▲▲ 追加ここまで ▲▲▲
}
function handleResetClick() {
    resetQuiz();
}
// ▲▲▲ 変更ここまで ▲▲▲

function finishQuiz(scrollToTop = true) {
    // ▼▼▼ 修正: isFinished チェックを先頭に移動 ▼▼▼
    if (isFinished) return; // 既に採点済みの場合は何もしない
    isFinished = true; // 採点済みフラグを立てる
    // ▲▲▲ 修正ここまで ▲▲▲

    let score = 0;
    
    quizzes.forEach((quiz, index) => {
        const quizItem = document.getElementById(`quiz-${index}`);
        const choiceButtons = quizItem.querySelectorAll('.choice-btn');
        const feedbackText = quizItem.querySelector('.feedback-text'); // 取得
        
        let userAnswer = userAnswers[index];
        let isCorrect = (userAnswer === quiz.correctAnswer);
        
        if (isCorrect) {
            score++;
        }
        
        // ▼▼▼ 変更: 回答比較を data- 属性経由に変更 ▼▼▼
        choiceButtons.forEach(btn => {
            const btnChoice = btn.dataset.choiceValue; // data属性から生の回答を取得
            
            // 色付けロジック (正解/不正解) は selectAnswer が担当
            // finishQuiz では、*正解の選択肢* を 'correct' にする
            if (btnChoice === quiz.correctAnswer) {
                btn.classList.add('correct');
            } 
            // ユーザーが選んだものが不正解だった場合
            else if (btnChoice === userAnswer && !isCorrect) {
                btn.classList.add('incorrect');
            }
            btn.disabled = true; // ボタンを無効化
        });
        // ▲▲▲ 変更ここまで ▲▲▲
        
        // ▼▼▼ 変更: selectAnswer がフィードバックを処理
        //         ここでは未回答 (null/undefined) の場合のみフィードバックをセット (フォーマット変更)
        if (userAnswer === null || userAnswer === undefined) {
            feedbackText.textContent = `正解は「${quiz.correctAnswer}」 ${quiz.explanation}`;
            feedbackText.style.color = 'blue';
        }
        // ▲▲▲ 変更ここまで ▲▲▲
    });
    
    updateScore(); // 最終スコアをヘッダーに反映
    
    // ▼▼▼ 追加: ボタンを「もう一度挑戦する」に変更 ▼▼▼
    finishBtn.textContent = 'もう一度挑戦する';
    finishBtn.removeEventListener('click', handleFinishClick);
    finishBtn.addEventListener('click', handleResetClick);
    // ▲▲▲ 追加ここまで ▲▲▲

    if (scrollToTop) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
// ▲▲▲ 修正ここまで ▲▲▲

// ▼▼▼ 新規追加: リセット機能（オートスクロールOFF/戻るボタン用） ▼▼▼
function resetQuiz() {
    isFinished = false; // 採点フラグをリセット
    userAnswers = {}; // 回答履歴をクリア

    quizzes.forEach((quiz, index) => {
        // ▼▼▼ 追加: userAnswers を null で再初期化 ▼▼▼
        userAnswers[index] = null;
        // ▲▲▲ 追加ここまで ▲▲▲

        const quizItem = document.getElementById(`quiz-${index}`);
        const choiceButtons = quizItem.querySelectorAll('.choice-btn');
        const feedbackText = quizItem.querySelector('.feedback-text');
        
        // ボタンのスタイルと状態をリセット
        choiceButtons.forEach(btn => {
            btn.classList.remove('selected', 'correct', 'incorrect');
            btn.disabled = false;
        });
        
        // フィードバックテキストをクリア
        if (feedbackText) {
            feedbackText.textContent = '';
            // ▼▼▼ 追加: 色もリセット ▼▼▼
            feedbackText.style.color = ''; 
            // ▲▲▲ 追加ここまで ▲▲▲
        }
    });

    // ▼▼▼ 追加: ボタンを「採点する」に戻す ▼▼▼
    finishBtn.textContent = '採点する';
    finishBtn.removeEventListener('click', handleResetClick);
    finishBtn.addEventListener('click', handleFinishClick);
    // ▲▲▲ 追加ここまで ▲▲▲
    
    // ▼▼▼ 追加: PDFボタンの状態をリセット (touyouigakugairon...js のロジック) ▼▼▼
    isReadyForPrint = false;
    pdfBtn.textContent = '正答PDF化';
    pdfBtn.classList.remove('ready');
    // ▲▲▲ 追加ここまで ▲▲▲

    updateScore(); // スコア表示をリセット
    window.scrollTo({ top: 0, behavior: 'auto' }); // トップに即時スクロール
}
// ▲▲▲ 新規追加ここまで ▲▲▲


// ▼▼▼ 変更: changeFontSize が body のフォントサイズを変更するように修正 ▼▼▼
function changeFontSize(scale) {
    currentFontScale = scale;
    // body のフォントサイズを変更することで、CSSで指定された
    // 相対的な em サイズ (1.8em, 1.2em など) が一括でスケーリングされる
    document.body.style.fontSize = `${scale}em`;
}
// ▲▲▲ 変更ここまで ▲▲▲

// ▼▼▼ 修正: PDFボタンのロジックを quiz-touyouigakugairon2025zenki-kimatu.js のロジックに合わせる ▼▼▼
function handlePdfButtonClick() {
    // 既に採点済み (isFinished = true) の場合は、パスワードなしで即実行
    if (isFinished) {
        prepareForPrint();
        return;
    }

    // ユーザー指摘の「パスワード機能」を quiz-touyouigakugairon...js に合わせる
    const password = prompt("パスワードを入力してください:", "");
    
    if (password === "89") { // パスワードを "89" に変更
        // 確認ダイアログを追加
        const isConfirmed = confirm('PDF化をするとクイズが終了します。よろしいですか？');
        if (isConfirmed) {
            prepareForPrint();
        }
    } else if (password !== null) { // キャンセル (null) 以外の場合
        alert("パスワードが違います。");
    }
}
// ▲▲▲ 修正ここまで ▲▲▲

// ▼▼▼ 修正: prepareForPrint を quiz-touyouigakugairon2025zenki-kimatu.js のロジック (handlePdfPrint) に置き換える ▼▼▼
function prepareForPrint() {
    // 1. 採点状態にする（トップにスクロール）
    finishQuiz(true); 
    isReadyForPrint = true; // 採点状態になったことを示す (handleFinishClick と重複するが念のため)

    // 2. 最終更新日時を取得
    const lastModified = new Date(document.lastModified);
    const year = lastModified.getFullYear();
    const month = String(lastModified.getMonth() + 1).padStart(2, '0');
    const day = String(lastModified.getDate()).padStart(2, '0');
    const hours = String(lastModified.getHours()).padStart(2, '0');
    const minutes = String(lastModified.getMinutes()).padStart(2, '0');
    const seconds = String(lastModified.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day} ${hours}:${minutes}:${seconds}`;

    // ▼▼▼ 追加: クイズタイトルをDOMから取得 ▼▼▼
    let quizTitle = "クイズ"; // デフォルト
    try {
        const titleElement = document.getElementById('quiz-title-main');
        if (titleElement) {
            quizTitle = titleElement.textContent;
        }
    } catch (e) {
        console.warn("Failed to get quiz title for printing:", e);
    }
    // ▲▲▲ 追加ここまで ▲▲▲

    // 3. 動的な印刷スタイル（@page と 教科書体フォント）を生成
    const styleId = 'dynamic-print-style';
    let printStyle = document.getElementById(styleId);
    if (printStyle) {
        printStyle.remove(); // 既存のスタイルがあれば削除
    }
    
    printStyle = document.createElement('style');
    printStyle.id = styleId;
    
    // quiz-touyouigakugairon2025zenki-kimatu.js のスタイル定義を流用
    // ▼▼▼ 修正: @top-right にタイトルを追加、@page-break-inside を avoid に変更 ▼▼▼
    printStyle.innerHTML = `
        @page {
            size: A4;
            margin: 2cm; /* 左右 2cm (画像と一致) */
            
            @top-left { content: ""; }
            @top-center { content: ""; }
            
            /* ▼▼▼ 修正: 右上にクイズタイトルを設定 ▼▼▼ */
            @top-right {
                content: "${quizTitle.replace(/"/g, '\\"')}"; /* CSSエスケープ */
                font-family: 'Hirino KyoKaSho', 'ヒラギノ教科書体', 'IPAex教科書体', serif;
                font-size: 10pt;
                color: #666;
            }
            /* ▲▲▲ 修正ここまで ▲▲▲ */

            @bottom-left {
                content: "last update ${timestamp}";
                font-family: 'Hirino KyoKaSho', 'ヒラギノ教科書体', 'IPAex教科書体', serif;
                font-size: 10pt;
                color: #666;
            }
            @bottom-right {
                content: counter(page) " / " counter(pages);
                font-family: 'Hirino KyoKaSho', 'ヒラギノ教科書体', 'IPAex教科書体', serif;
                font-size: 10pt;
                color: #666;
            }
        }

        /* quiz_style.css の @media print スタイルを上書き・補強 */
        @media print {
            /* 教科書体フォントを全体に適用 */
            body {
                font-family: 'Hirino KyoKaSho', 'ヒラギノ教科書体', 'IPAex教科書体', serif !important;
            }
            /* 選択肢や問題文のフォントサイズ (CSS側で定義済み) */
            .question-text {
                font-size: 11pt !important;
                line-height: 1.2 !important;
                margin-bottom: 5px !important;
            }
            .choice-btn {
                font-size: 10pt !important;
                padding: 2px 4px !important;
                border: none !important;
                border-radius: 0 !important;
                /* 採点状態の色をリセット (CSS側で定義済み) */
                background-color: transparent !important;
                border: none !important;
                font-weight: normal !important;
                color: #000 !important; /* JSが色を変えていても黒に戻す */
            }
            /* 選択肢コンテナ (CSS側で display:flex になっていないため) */
            .choices-container {
                display: flex !important;
                flex-direction: column !important;
                gap: 1px !important;
            }
            /* 正解表示 (CSS側で grid-column を使って右側に配置される) */
            .answer-display {
                display: flex !important; 
                align-items: center !important;
                justify-content: center !important;
                border-left: 1px solid #666 !important; 
                font-size: 10pt !important;
                font-weight: bold !important;
                padding: 0 8px !important;
                text-align: left !important;
                color: #000 !important; /* JSが色を変えていても黒に戻す */
            }
            /* UI非表示 (CSS側で定義済み) */
            #quiz-header, #finish-btn, .update-info, h1, .feedback-text, mark.search-highlight {
                display: none !important;
            }
            .quiz-item {
                /* CSS側の定義 (grid, gap, border) をそのまま使う */
                /* ▼▼▼ 修正: アイテムの途中で改ページされないよう 'avoid' に変更 ▼▼▼ */
                page-break-inside: avoid !important;
                /* ▲▲▲ 修正ここまで ▲▲▲ */
            }
            /* ▼▼▼ 修正: アイテム間の余計な改ページ(空白)を削除するため 'auto' を維持 ▼▼▼ */
            .quiz-item:nth-child(6n):not(:last-child) {
                page-break-after: auto !important;
            }
            /* ▲▲▲ 修正ここまで ▲▲▲ */
        }
    `;
    // ▲▲▲ 修正ここまで ▲▲▲

    document.head.appendChild(printStyle);

    // 4. 印刷ダイアログの呼び出し
    setTimeout(() => {
        window.print();
    }, 500); // スタイル適用と採点状態のレンダリングを待つ

    // 5. 印刷ダイアログが閉じた後（またはキャンセル時）に元に戻す
    setTimeout(() => {
        // スタイルシートを削除
        if (document.getElementById(styleId)) {
            document.getElementById(styleId).remove();
        }
        // リロード (元のJSの挙動)
        location.reload(); 
    }, 1000);
}
// ▲▲▲ 修正ここまで ▲▲▲


// ▼▼▼ 修正: ジャンプメニューを INTERVAL 値 (interval) に応じて生成 ▼▼▼
function populateJumpMenu(quizCount, interval) {
    // 修正: 二重読み込み防止のため、プルダウンの中身をリセット
    jumpMenu.innerHTML = '<option value="">問題を選択</option>';

    if (interval > 1) {
        // ▼▼▼ 修正: INTERVAL が設定されている場合 (例: 20ごと) のフォーマットを変更 ▼▼▼
        for (let i = 0; i < quizCount; i += interval) {
            const option = document.createElement('option');
            option.value = i; // ジャンプ先のインデックス (0, 20, 40...)
            const startNum = i + 1;
            const endNum = Math.min(i + interval, quizCount);
            option.textContent = `問 ${startNum} - ${endNum}`; // 例: 問 1 - 20
            jumpMenu.appendChild(option);
        }
        // ▲▲▲ 修正ここまで ▲▲▲
    } else {
        // INTERVAL が未指定または 1 の場合 (従来通りすべて表示)
        for (let i = 0; i < quizCount; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `問題 ${i + 1}`;
            jumpMenu.appendChild(option);
        }
    }
    
    // ▼▼▼ 修正: イベントリスナーが重複しないよう、一度削除して再登録する ▼▼▼
    // (より安全な方法は関数スコープ外で一度だけ登録することだが、
    //  quizCount が動的なため、ここでは簡易的に付け外しする)
    const jumpMenuHandler = (e) => {
        const quizIndex = e.target.value;
        if (quizIndex !== "") {
            const targetQuiz = document.getElementById(`quiz-${quizIndex}`);
            if (targetQuiz) {
                const headerOffset = document.getElementById('quiz-header').offsetHeight + 10;
                const elementPosition = targetQuiz.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
            e.target.value = ""; 
        }
    };
    
    // 既存のリスナーを（もしあれば）削除
    jumpMenu.removeEventListener('change', jumpMenu.lastChangeHandler); 
    // 新しいリスナーを登録
    jumpMenu.addEventListener('change', jumpMenuHandler);
    // 登録したリスナーを後で削除できるように保持
    jumpMenu.lastChangeHandler = jumpMenuHandler;
    // ▲▲▲ 修正ここまで ▲▲▲
}
// ▲▲▲ 修正ここまで ▲▲▲


// イベントリスナーの登録
document.addEventListener('DOMContentLoaded', () => {
    // 1. URLからクイズデータファイル名を取得
    const urlParams = new URLSearchParams(window.location.search);
    const dataFile = urlParams.get('data');

    if (dataFile) {
        // 2. 共通クイズセットアップを呼び出す
        // (タイトルや間隔は setupQuiz が .txt ファイルから読み取る)
        setupQuiz(dataFile);
    } else {
        document.title = "エラー";
        document.getElementById('quiz-title-main').textContent = "クイズデータが指定されていません";
        document.getElementById('quiz-body').innerHTML = '<p style="color: red; font-weight: bold;">URLに ?data=... の形式でクイズデータを指定してください。</p>';
    }

    // 3. (既存の機能) 最終更新日時を表示する
    const lastModified = new Date(document.lastModified);
    const year = lastModified.getFullYear();
    const month = String(lastModified.getMonth() + 1).padStart(2, '0');
    const day = String(lastModified.getDate()).padStart(2, '0');
    const hours = String(lastModified.getHours()).padStart(2, '0');
    const minutes = String(lastModified.getMinutes()).padStart(2, '0');
    const seconds = String(lastModified.getSeconds()).padStart(2, '0');
    const formattedDate = `${year}${month}${day} ${hours}:${minutes}:${seconds}`;
    const updateElement = document.getElementById('last-updated');
    if (updateElement) {
        updateElement.innerHTML = `last update ${formattedDate}`;
    }

    // 4. (既存の機能) UIボタンのイベントリスナー
    // ▼▼▼ 変更: 匿名関数ではなく、名前付き関数 handleFinishClick を登録 ▼▼▼
    finishBtn.addEventListener('click', handleFinishClick); 
    // ▲▲▲ 変更ここまで ▲▲▲
    fontIncreaseBtn.addEventListener('click', () => changeFontSize(currentFontScale + 0.1));
    fontDecreaseBtn.addEventListener('click', () => changeFontSize(currentFontScale - 0.1));
    
    // ▼▼▼ 変更: PDFボタンのリスナーをパスワード要求関数に変更 ▼▼▼
    pdfBtn.addEventListener('click', handlePdfButtonClick);
    // ▲▲▲ 変更ここまで ▲▲▲
});

// ▼▼▼ 追加: スクロール位置の保存処理 (debounce) ▼▼▼
window.addEventListener('scroll', () => {
    if (!currentDataFileKey) return; // キーが未設定なら何もしない (クイズ読み込み前など)

    clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(() => {
        try {
            const scrollY = window.scrollY;
            // 0 以下の場合は保存しない（リセット時など）
            if (scrollY > 0) { 
                localStorage.setItem(currentDataFileKey, scrollY);
            }
        } catch (e) {
            console.warn('Failed to save scroll position:', e);
        }
    }, SAVE_SCROLL_DEBOUNCE_MS);
});
// ▲▲▲ 追加ここまで ▲▲▲


// --- 検索機能 ---

// 検索状態を保持するグローバルオブジェクト
const searchState = {
    term: '',
    elements: [],
    currentIndex: -1,
    originalNodes: new Map() // ハイライト解除用に元のDOMノードを保持
};

/**
 * ハイライトをすべてクリアし、DOMを元に戻す
 */
function clearHighlights() {
    // <span> タグ (ハイライト) を解除
    searchState.originalNodes.forEach((originalNode, parent) => {
        parent.replaceWith(originalNode);
    });

    // .active クラスを削除 (念のため)
    searchState.elements.forEach(el => el.classList.remove('active'));

    // 状態をリセット
    searchState.term = '';
    searchState.elements = [];
    searchState.currentIndex = -1;
    searchState.originalNodes.clear();
}

/**
 * 検索を実行し、DOMをハイライトする
 * @param {string} term - 検索キーワード
 */
function performHighlight(term) {
    clearHighlights();
    if (!term) return;

    searchState.term = term;
    const regex = new RegExp(escapeRegExp(term), 'gi');
    
    // 検索対象のノード (質問文と選択肢)
    const nodesToSearch = document.querySelectorAll('.question-text, .choice-btn');

    nodesToSearch.forEach(node => {
        // 子ノードを走査してテキストノードを見つける
        findAndReplaceText(node, regex, term);
    });

    // ハイライトされた <span> 要素をすべて取得
    searchState.elements = Array.from(document.querySelectorAll('mark.search-highlight'));
}

/**
 * (ヘルパー) 正規表現の特殊文字をエスケープする
 */
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
}

/**
 * (ヘルパー) DOMノードを再帰的に走査し、テキストノード内の文字列を置換する
 */
function findAndReplaceText(node, regex, term) {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const matches = [...text.matchAll(regex)];
        
        if (matches.length > 0) {
            // 親ノードを保存 (ハイライト解除用)
            const parent = node.parentNode;
            if (parent && !searchState.originalNodes.has(parent)) {
                searchState.originalNodes.set(parent, parent.cloneNode(true));
            }

            const fragment = document.createDocumentFragment();
            let lastIndex = 0;

            matches.forEach(match => {
                const foundText = match[0];
                const index = match.index;
                
                // マッチ前のテキスト
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, index)));
                
                // マッチしたテキスト (ハイライト)
                const mark = document.createElement('mark');
                mark.className = 'search-highlight';
                mark.textContent = foundText;
                fragment.appendChild(mark);
                
                lastIndex = index + foundText.length;
            });
            
            // マッチ後の残りテキスト
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            node.parentNode.replaceChild(fragment, node);
        }
    } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'MARK') {
        // 子ノードを再帰的に処理
        // NodeListをArrayに変換してからループ (DOM操作でNodeListが変化するため)
        Array.from(node.childNodes).forEach(child => {
            findAndReplaceText(child, regex, term);
        });
    }
}


/**
 * 次または前のハイライトに移動する
 * @param {string} direction - 'next' または 'prev'
 */
function navigateToHighlight(direction) {
    if (searchState.elements.length === 0) return;

    if (searchState.currentIndex >= 0 && searchState.elements[searchState.currentIndex]) {
        searchState.elements[searchState.currentIndex].classList.remove('active');
    }

    if (direction === 'next') {
        searchState.currentIndex++;
        if (searchState.currentIndex >= searchState.elements.length) {
            searchState.currentIndex = 0; 
        }
    } else if (direction === 'prev') {
        searchState.currentIndex--;
        if (searchState.currentIndex < 0) {
            searchState.currentIndex = searchState.elements.length - 1; 
        }
    }

    const currentElement = searchState.elements[searchState.currentIndex];
    if (currentElement) {
        currentElement.classList.add('active');
        
        // ▼▼▼ 修正: ヘッダーオフセットを考慮したスクロール ▼▼▼
        const headerOffset = document.getElementById('quiz-header').offsetHeight + 10;
        const elementRect = currentElement.getBoundingClientRect();
        const elementTop = elementRect.top + window.pageYOffset;
        const offsetPosition = elementTop - headerOffset - (window.innerHeight / 4); // ヘッダー分+画面1/4上に来るように調整

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
        // ▲▲▲ 修正ここまで ▲▲▲
    }
}

/**
 * 親フレームから呼び出される検索ハンドラ
 * @param {string} term - 検索キーワード
 * @param {string} direction - 'next' または 'prev'
 */
function handleSearch(term, direction) {
    if (term !== searchState.term) {
        // 新しい検索語
        performHighlight(term);
        searchState.currentIndex = -1; // インデックスをリセット
        navigateToHighlight('next'); // 最初の要素に移動
    } else if (term) {
        // 同じ検索語で次へ/前へ
        navigateToHighlight(direction);
    } else {
        // 検索語が空 = クリア
        clearHighlights();
    }
}

// ▼▼▼ 新規追加: ダークモード切り替え (親フレームから呼び出される) ▼▼▼
/**
 * 親フレーム (main.js) から呼び出され、ダークモードを切り替える
 * @param {boolean} isDarkMode - ダークモードにするかどうか
 */
function toggleDarkMode(isDarkMode) {
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}
// ▲▲▲ 新規追加ここまで ▲▲▲
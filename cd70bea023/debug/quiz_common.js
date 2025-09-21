// HTML要素の取得
const scoreText = document.getElementById('score-text');
const quizBody = document.getElementById('quiz-body');
const finishBtn = document.getElementById('finish-btn');
const fontIncreaseBtn = document.getElementById('font-increase-btn');
const fontDecreaseBtn = document.getElementById('font-decrease-btn');
const pdfBtn = document.getElementById('pdf-btn');
const jumpMenu = document.getElementById('jump-menu');
// ▼▼▼ 修正: 欠落していた変数宣言をここに追加 ▼▼▼
const pdfRangeContainer = document.getElementById('pdf-range-container');
const pdfRangeStart = document.getElementById('pdf-range-start');
const pdfRangeEnd = document.getElementById('pdf-range-end');
// ▲▲▲ 修正ここまで ▲▲▲

// ▼▼▼ 追加 ▼▼▼
const pdfOptionsToggle = document.getElementById('pdf-options-toggle');
const pdfControlsWrapper = document.getElementById('pdf-controls-wrapper');
// ▲▲▲ 追加ここまで ▲▲▲

let quizzes = [];
let userAnswers = {};
let currentFontScale = 1.0;
let isReadyForPrint = false;

// ▼▼▼ 追加: PDF範囲保存用キー ▼▼▼
let currentPdfRangeKey = '';
// ▲▲▲ 追加ここまで ▲▲▲

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
async function setupQuiz(dataTxtFile) {
    
    quizzes = [];
    userAnswers = {};
    quizBody.innerHTML = ''; 

    currentDataFileKey = 'quizLastPosition_' + dataTxtFile;

    currentPdfRangeKey = 'pdfPrintRange_' + dataTxtFile;

    try {
        if (isMobileDevice()) {
            pdfBtn.style.display = 'none';
            pdfRangeContainer.style.display = 'none';
            // ▼▼▼ 追加 ▼▼▼
            pdfOptionsToggle.style.display = 'none';
            // ▲▲▲ 追加ここまで ▲▲▲
        } else {
            pdfRangeContainer.style.display = 'flex';
        }
        const response = await fetch(dataTxtFile);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        const lines = text.split('\n');

        let quizTitle = "クイズ"; 
        let pdfInterval = 6;     

        if (lines.length > 0 && lines[0].startsWith('#!')) {
            const metaLine = lines[0].substring(3).trim(); 
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
            lines.shift(); 
        }

        document.title = quizTitle; 
        document.getElementById('quiz-title-main').textContent = quizTitle; 
        
        if (window.parent && window.parent.postMessage) {
            window.parent.postMessage({ type: 'iframeTitleUpdated', title: quizTitle }, '*');
        }
        
        let currentQuiz = {};
        
        lines.forEach((line, index) => {
            line = line.trim();
            if (line.startsWith('?')) {
                if (Object.keys(currentQuiz).length > 0) {
                    quizzes.push(currentQuiz);
                }
                currentQuiz = {
                    question: line.substring(1).trim().replace(/^\d+\s*[.．]\s*/, ''),
                    choices: [],
                    correctAnswer: null,
                    explanation: ""
                };
            } else if (line.startsWith('*')) {
                const choice = line.substring(1).trim();
                if (choice !== '-') {
                    currentQuiz.choices.push(choice);
                    currentQuiz.correctAnswer = choice;
                }
            } else if (line.startsWith('@')) {
                currentQuiz.explanation = line.substring(1).trim().replace(/\\n/g, '\n');
            } else if (line.length > 0) {
                if (line !== '-') {
                    currentQuiz.choices.push(line);
                }
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
            
            questionText.innerHTML = `<strong>問題 ${index + 1}:</strong> ${quiz.question.replace(/\\n/g, '<br>')}`;
            
            questionContent.appendChild(questionText);
            
            const choicesContainer = document.createElement('div');
            choicesContainer.className = 'choices-container';
            
            const shuffledChoices = [...quiz.choices];
            shuffleArray(shuffledChoices);
            
            shuffledChoices.forEach(choice => {
                const choiceBtn = document.createElement('button');
                choiceBtn.className = 'choice-btn';
                
                choiceBtn.innerHTML = choice.replace(/\\n/g, '<br>');
                choiceBtn.dataset.choiceValue = choice; 
                
                // ▼▼▼ 変更: クリックイベントの登録方法をonclickからaddEventListenerに変更 ▼▼▼
                choiceBtn.addEventListener('click', () => selectAnswer(index, choiceBtn)); 
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
            answerDisplay.textContent = quiz.correctAnswer;
            quizItem.appendChild(answerDisplay);
            
            quizBody.appendChild(quizItem);
        });

        populateJumpMenu(quizzes.length, pdfInterval);
        
        if (!isMobileDevice()) {
            populatePdfRangeControls(quizzes.length);
        }
        updateScore();

        if (window.parent && window.parent.postMessage) {
            window.parent.postMessage({
                type: 'quizLoaded',
                quizCount: quizzes.length,
                dataFile: dataTxtFile
            }, '*');
        }

    } catch (error) {
        console.error('クイズの読み込みに失敗しました:', error);
        quizBody.innerHTML = `<p style="color: red;">クイズの読み込みに失敗しました: ${error.message}</p>`;
    }

    try {
        const savedY = localStorage.getItem(currentDataFileKey);
        if (savedY) {
            const y = parseInt(savedY, 10);
            if (!isNaN(y) && y > 0) {
                
                setTimeout(() => {
                    window.scrollTo({ top: y, behavior: 'auto' });
                    
                    if (window.parent && window.parent.postMessage) {
                        window.parent.postMessage('quizPositionRestored', '*');
                    }
                }, 100);
            }
        }
    } catch (e) {
        console.warn('Failed to restore scroll position:', e);
    }
}

// ▼▼▼ 新規追加: PDF範囲指定プルダウンの生成とイベント設定 ▼▼▼
function populatePdfRangeControls(totalQuestions) {
    pdfRangeStart.innerHTML = '';
    pdfRangeEnd.innerHTML = '';

    for (let i = 1; i <= totalQuestions; i++) {
        const optionStart = document.createElement('option');
        optionStart.value = i;
        optionStart.textContent = `問題 ${i}`;
        pdfRangeStart.appendChild(optionStart);

        const optionEnd = document.createElement('option');
        optionEnd.value = i;
        optionEnd.textContent = `問題 ${i}`;
        pdfRangeEnd.appendChild(optionEnd);
    }

    // 保存された範囲を読み込む
    const savedRange = JSON.parse(localStorage.getItem(currentPdfRangeKey));
    
    // デフォルト値を設定
    let defaultStart = 1;
    let defaultEnd = totalQuestions;

    if (savedRange && savedRange.start && savedRange.end) {
        // 保存された値が現在の問題数範囲内かチェック
        if (savedRange.start >= 1 && savedRange.end <= totalQuestions && savedRange.start <= savedRange.end) {
            defaultStart = savedRange.start;
            defaultEnd = savedRange.end;
        }
    }
    
    pdfRangeStart.value = defaultStart;
    pdfRangeEnd.value = defaultEnd;

    // イベントリスナーをセット
    pdfRangeStart.addEventListener('change', handlePdfRangeChange);
    pdfRangeEnd.addEventListener('change', handlePdfRangeChange);
}
// ▲▲▲ 追加ここまで ▲▲▲


// ▼▼▼ 新規追加: PDF範囲変更時の処理（localStorageへの保存） ▼▼▼
function handlePdfRangeChange() {
    let start = parseInt(pdfRangeStart.value, 10);
    let end = parseInt(pdfRangeEnd.value, 10);

    // 開始が終了より大きい場合は、終了を開始に合わせる
    if (start > end) {
        end = start;
        pdfRangeEnd.value = end;
    }

    // 選択範囲を保存
    const rangeToSave = { start: start, end: end };
    localStorage.setItem(currentPdfRangeKey, JSON.stringify(rangeToSave));
}
// ▲▲▲ 追加ここまで ▲▲▲

function selectAnswer(quizIndex, btnElement) {
    if (isReadyForPrint || isFinished) return; 

    const choice = btnElement.dataset.choiceValue;
    userAnswers[quizIndex] = choice;
    
    const quizItem = document.getElementById(`quiz-${quizIndex}`);
    const choiceButtons = quizItem.querySelectorAll('.choice-btn');
    const feedbackText = quizItem.querySelector('.feedback-text'); 
    
    const quiz = quizzes[quizIndex];
    const isCorrect = (choice === quiz.correctAnswer);

    choiceButtons.forEach(btn => {
        btn.classList.remove('selected');
    });
    
    btnElement.classList.add('selected');

    if (isCorrect) {
        feedbackText.textContent = `正解！ ${quiz.explanation}`;
        feedbackText.style.color = 'green';
    } else {
        feedbackText.textContent = `不正解... 正解は「${quiz.correctAnswer}」 ${quiz.explanation}`;
        feedbackText.style.color = 'red';
    }
    
    updateScore();
}

function updateScore() {
    let score = 0;
    let answeredCount = 0;
    quizzes.forEach((quiz, index) => {
        if (userAnswers[index] === quiz.correctAnswer) {
            score++;
        }
        if (userAnswers[index] !== null && userAnswers[index] !== undefined) {
            answeredCount++;
        }
    });
    scoreText.textContent = `正解数: ${score} / ${quizzes.length}`;
}

let isFinished = false;

function handleFinishClick() {
    finishQuiz(true);
    
    isReadyForPrint = true;
    pdfBtn.textContent = '印刷プレビューを開く';
    pdfBtn.classList.add('ready');
}
function handleResetClick() {
    resetQuiz();
}

function finishQuiz(scrollToTop = true) {
    if (isFinished) return;
    isFinished = true;

    let score = 0;
    
    quizzes.forEach((quiz, index) => {
        const quizItem = document.getElementById(`quiz-${index}`);
        const choiceButtons = quizItem.querySelectorAll('.choice-btn');
        const feedbackText = quizItem.querySelector('.feedback-text');
        
        let userAnswer = userAnswers[index];
        let isCorrect = (userAnswer === quiz.correctAnswer);
        
        if (isCorrect) {
            score++;
        }
        
        choiceButtons.forEach(btn => {
            const btnChoice = btn.dataset.choiceValue;
            
            if (btnChoice === quiz.correctAnswer) {
                btn.classList.add('correct');
            } 
            else if (btnChoice === userAnswer && !isCorrect) {
                btn.classList.add('incorrect');
            }
            btn.disabled = true;
        });
        
        if (userAnswer === null || userAnswer === undefined) {
            feedbackText.textContent = `正解は「${quiz.correctAnswer}」 ${quiz.explanation}`;
            feedbackText.style.color = 'blue';
        }
    });
    
    updateScore();
    
    const percentage = quizzes.length > 0 ? (score / quizzes.length) * 100 : 0;
    scoreText.innerHTML = `最終結果: ${score} / ${quizzes.length} 正解<br>正解率: ${percentage.toFixed(1)}%`;

    finishBtn.textContent = 'もう一度挑戦する';
    finishBtn.removeEventListener('click', handleFinishClick);
    finishBtn.addEventListener('click', handleResetClick);

    if (scrollToTop) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function resetQuiz() {
    isFinished = false;
    userAnswers = {};

    quizzes.forEach((quiz, index) => {
        userAnswers[index] = null;

        const quizItem = document.getElementById(`quiz-${index}`);
        const choiceButtons = quizItem.querySelectorAll('.choice-btn');
        const feedbackText = quizItem.querySelector('.feedback-text');
        
        choiceButtons.forEach(btn => {
            btn.classList.remove('selected', 'correct', 'incorrect');
            btn.disabled = false;
        });
        
        if (feedbackText) {
            feedbackText.textContent = '';
            feedbackText.style.color = ''; 
        }
    });

    finishBtn.textContent = '採点する';
    finishBtn.removeEventListener('click', handleResetClick);
    finishBtn.addEventListener('click', handleFinishClick);
    
    isReadyForPrint = false;
    pdfBtn.textContent = '正答PDF化';
    pdfBtn.classList.remove('ready');

    updateScore();
    window.scrollTo({ top: 0, behavior: 'auto' });
}


function changeFontSize(scale) {
    currentFontScale = scale;
    document.body.style.fontSize = `${scale}em`;
}

function handlePdfButtonClick() {
    if (isFinished) {
        prepareForPrint();
        return;
    }

    const password = prompt("パスワードを入力してください:", "");
    
    if (password === "89") {
        const isConfirmed = confirm('PDF化をするとクイズが終了します。よろしいですか？');
        if (isConfirmed) {
            prepareForPrint();
        }
    } else if (password !== null) {
        alert("パスワードが違います。");
    }
}

function prepareForPrint() {
    finishQuiz(true);
    isReadyForPrint = true;
    const lastModified = new Date(document.lastModified);
    const year = lastModified.getFullYear();
    const month = String(lastModified.getMonth() + 1).padStart(2, '0');
    const day = String(lastModified.getDate()).padStart(2, '0');
    const hours = String(lastModified.getHours()).padStart(2, '0');
    const minutes = String(lastModified.getMinutes()).padStart(2, '0');
    const seconds = String(lastModified.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day} ${hours}:${minutes}:${seconds}`;
    let quizTitle = "クイズ";
    try {
        const titleElement = document.getElementById('quiz-title-main');
        if (titleElement) {
            quizTitle = titleElement.textContent;
        }
    } catch (e) {
        console.warn("Failed to get quiz title for printing:", e);
    }
    const startNum = parseInt(pdfRangeStart.value, 10);
    const endNum = parseInt(pdfRangeEnd.value, 10);
    let newQuestionCounter = 1;
    if (!isMobileDevice() && startNum && endNum) {
        quizzes.forEach((_, index) => {
            const quizItem = document.getElementById(`quiz-${index}`);
            if (index >= startNum - 1 && index <= endNum - 1) {
                const questionTextElement = quizItem.querySelector('.question-text > strong');
                if (questionTextElement) {
                    questionTextElement.textContent = `問題 ${newQuestionCounter}:`;
                }
                
                const questionBodyElement = quizItem.querySelector('.question-text');
                if (questionBodyElement) {
                    let html = questionBodyElement.innerHTML;
                    if (html.includes('★')) {
                        html = html.replace(/(★[\s\S]*)/, '<span class="source-info">$1</span>');
                        questionBodyElement.innerHTML = html;
                    }
                }

                newQuestionCounter++;
            } else {
                quizItem.classList.add('print-hidden');
            }
        });
    }
    const styleId = 'dynamic-print-style';
    let printStyle = document.getElementById(styleId);
    if (printStyle) {
        printStyle.remove();
    }
    printStyle = document.createElement('style');
    printStyle.id = styleId;
    printStyle.innerHTML = `
        @page {
            size: A4;
            margin: 2cm;
            @top-left { content: ""; }
            @top-center { content: ""; }
            @top-right {
                content: "${quizTitle.replace(/"/g, '\\"')}";
                font-family: 'Hirino KyoKaSho', 'ヒラギノ教科書体', 'IPAex教科書体', serif;
                font-size: 12pt;
                color: #666;
            }
            @bottom-left {
                content: "last update ${timestamp}";
                font-family: 'Hirino KyoKaSho', 'ヒラギノ教科書体', 'IPAex教科書体', serif;
                font-size: 12pt;
                color: #666;
            }
            @bottom-right {
                content: counter(page) " / " counter(pages);
                font-family: 'Hirino KyoKaSho', 'ヒラギノ教科書体', 'IPAex教科書体', serif;
                font-size: 12pt;
                color: #666;
            }
        }
        @media print {
            .print-hidden {
                display: none !important;
            }
            body {
                font-family: 'Hirino KyoKaSho', 'ヒラギノ教科書体', 'IPAex教科書体', serif !important;
            }
            .question-text {
                font-size: 11pt !important;
                line-height: 1.2 !important;
                margin-bottom: 5px !important;
                font-weight: bold !important;
            }
            .source-info {
                font-weight: normal !important;
                font-size: 9pt !important;
            }
            .choice-btn {
                font-size: 11pt !important;
                padding: 2px 4px !important;
                border: none !important;
                border-radius: 0 !important;
                background-color: transparent !important;
                font-weight: normal !important;
            }
            /* ▼▼▼ 修正: :disabledセレクタを追加して優先順位を上げる ▼▼▼ */
            .choice-btn, .choice-btn:disabled {
                color: #000 !important; /* 文字色を黒に */
            }
            /* ▲▲▲ 修正ここまで ▲▲▲ */
            .choices-container {
                display: flex !important;
                flex-direction: column !important;
                gap: 0 !important;
            }
            .answer-display {
                display: flex !important; 
                align-items: center !important;
                justify-content: center !important;
                border-left: 1px solid #666 !important; 
                font-size: 12pt !important;
                font-weight: bold !important;
                padding: 0 8px !important;
                text-align: left !important;
                color: #000 !important;
            }
            #quiz-header, #finish-btn, .update-info, h1, .feedback-text, mark.search-highlight {
                display: none !important;
            }
            .quiz-item {
                page-break-inside: avoid !important;
            }
            .quiz-item:nth-child(6n):not(:last-child) {
                page-break-after: auto !important;
            }
        }
    `;
    document.head.appendChild(printStyle);
    setTimeout(() => {
        window.print();
    }, 500);
    setTimeout(() => {
        if (document.getElementById(styleId)) {
            document.getElementById(styleId).remove();
        }
        location.reload();
    }, 1000);
}


function populateJumpMenu(quizCount, interval) {
    jumpMenu.innerHTML = '<option value="">問題を選択</option>';

    if (interval > 1) {
        for (let i = 0; i < quizCount; i += interval) {
            const option = document.createElement('option');
            option.value = i;
            const startNum = i + 1;
            const endNum = Math.min(i + interval, quizCount);
            option.textContent = `問 ${startNum} - ${endNum}`;
            jumpMenu.appendChild(option);
        }
    } else {
        for (let i = 0; i < quizCount; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `問題 ${i + 1}`;
            jumpMenu.appendChild(option);
        }
    }
    
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
    
    jumpMenu.removeEventListener('change', jumpMenu.lastChangeHandler); 
    jumpMenu.addEventListener('change', jumpMenuHandler);
    jumpMenu.lastChangeHandler = jumpMenuHandler;
}


document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const dataFile = urlParams.get('data');

    if (dataFile) {
        setupQuiz(dataFile);
    } else {
        document.title = "エラー";
        document.getElementById('quiz-title-main').textContent = "クイズデータが指定されていません";
        document.getElementById('quiz-body').innerHTML = '<p style="color: red; font-weight: bold;">URLに ?data=... の形式でクイズデータを指定してください。</p>';
    }

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

    finishBtn.addEventListener('click', handleFinishClick); 
    fontIncreaseBtn.addEventListener('click', () => changeFontSize(currentFontScale + 0.1));
    fontDecreaseBtn.addEventListener('click', () => changeFontSize(currentFontScale - 0.1));
    
    pdfBtn.addEventListener('click', handlePdfButtonClick);

        // ▼▼▼ 追加: PDF設定ボタンのクリックイベント ▼▼▼
    if (pdfOptionsToggle) {
        pdfOptionsToggle.addEventListener('click', () => {
            pdfControlsWrapper.classList.toggle('collapsed');
        });
    }
    // ▲▲▲ 追加ここまで ▲▲▲
});

window.addEventListener('scroll', () => {
    if (!currentDataFileKey) return;

    clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(() => {
        try {
            const scrollY = window.scrollY;
            if (scrollY > 0) { 
                localStorage.setItem(currentDataFileKey, scrollY);
            }
        } catch (e) {
            console.warn('Failed to save scroll position:', e);
        }
    }, SAVE_SCROLL_DEBOUNCE_MS);
});


// --- 検索機能 ---

// 検索状態を保持するグローバルオブジェクト
const searchState = {
    term: '',
    elements: [],
    currentIndex: -1,
    originalNodes: new Map() // ハイライト解除用に元のDOMノードを保持
};

// ▼▼▼ 追加: 検索結果を親フレームに通知するヘルパー関数 ▼▼▼
function postSearchResults() {
    if (window.parent && window.parent.postMessage) {
        window.parent.postMessage({
            type: 'searchResultUpdate',
            currentIndex: searchState.currentIndex,
            totalHits: searchState.elements.length,
            term: searchState.term
        }, '*');
    }
}
// ▲▲▲ 追加ここまで ▲▲▲

/**
 * ハイライトをすべてクリアし、DOMを元に戻す
 */
function clearHighlights() {
    // ▼▼▼ 変更: イベントリスナーを破壊しないように、要素自体ではなくその子ノードのみを元に戻す ▼▼▼
    searchState.originalNodes.forEach((originalNode, parent) => {
        // 現在の要素（parent）の子ノードをすべて削除
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild);
        }
        // 保存しておいた元のノード（originalNode）の子ノードをすべて移動して復元
        while (originalNode.firstChild) {
            parent.appendChild(originalNode.firstChild);
        }
    });
    // ▲▲▲ 変更ここまで ▲▲▲

    // .active クラスを削除 (念のため)
    searchState.elements.forEach(el => el.classList.remove('active'));

    // 状態をリセット
    searchState.term = '';
    searchState.elements = [];
    searchState.currentIndex = -1;
    searchState.originalNodes.clear();
    
    // ▼▼▼ 追加: 親フレームにクリアを通知 ▼▼▼
    postSearchResults();
    // ▲▲▲ 追加ここまで ▲▲▲
}

/**
 * 検索を実行し、DOMをハイライトする
 * @param {string} term - 検索キーワード
 * @param {number|string|null} stopQuestionNumber - 検索を終了する問題番号
 */
function performHighlight(term, stopQuestionNumber) {
    clearHighlights();
    if (!term) return;

    searchState.term = term;
    const regex = new RegExp(escapeRegExp(term), 'gi');
    
    // ▼▼▼ 変更: 検索対象ノードを範囲指定で取得 ▼▼▼
    let nodesToSearch = [];
    // stopQuestionNumber が未定義または不正な値の場合は、全問題を対象とする
    const endQuestionIndex = (stopQuestionNumber && !isNaN(parseInt(stopQuestionNumber, 10))) 
        ? parseInt(stopQuestionNumber, 10) - 1 
        : quizzes.length - 1;

    for (let i = 0; i <= endQuestionIndex; i++) {
        const quizItem = document.getElementById(`quiz-${i}`);
        if (quizItem) {
            // .question-text と .choice-btn の両方を取得
            nodesToSearch.push(...quizItem.querySelectorAll('.question-text, .choice-btn'));
        }
    }
    // ▲▲▲ 変更ここまで ▲▲▲

    nodesToSearch.forEach(node => {
        // 子ノードを走査してテキストノードを見つける
        findAndReplaceText(node, regex, term);
    });

    // ハイライトされた <mark> 要素をすべて取得
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
 * @param {boolean} [isNewSearch=false] - これが新しい検索の最初のナビゲーションか
 */
function navigateToHighlight(direction, isNewSearch = false) {
    if (searchState.elements.length === 0) {
        postSearchResults(); 
        return;
    }

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
        
        // ▼▼▼ 変更: 要素がすでに表示されている場合はスクロールしないロジックを追加 ▼▼▼
        const headerOffset = document.getElementById('quiz-header').offsetHeight + 10;
        const elementRect = currentElement.getBoundingClientRect();
        
        // 要素がヘッダーの下から画面の下端までの間に完全に表示されているかチェック
        const isVisible = (
            elementRect.top >= headerOffset &&
            elementRect.bottom <= window.innerHeight
        );

        // 新規検索で、最初のターゲットがすでに見えている場合はスクロールしない
        if (isNewSearch && isVisible) {
            // スクロールしない
        } else {
            // それ以外の場合はスクロールする
            const elementTop = elementRect.top + window.pageYOffset;
            
            // ▼▼▼ 変更: スマホのキーボード表示を考慮し、表示領域の中央にスクロールするよう計算式を修正 ▼▼▼
            // ヘッダーを除いた可視領域の中央に要素の上端が来るようにスクロール位置を計算
            const offsetPosition = elementTop - headerOffset - ((window.innerHeight - headerOffset) / 2);
            // ▲▲▲ 変更ここまで ▲▲▲

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
        // ▲▲▲ 修正ここまで ▲▲▲
    }
    
    postSearchResults();
}

/**
 * 親フレームから呼び出される検索ハンドラ
 * @param {string} term - 検索キーワード
 * @param {string} direction - 'next' または 'prev'
 * @param {number|string|null} stopQuestionNumber - 検索範囲の終点となる問題番号
 */
function handleSearch(term, direction, stopQuestionNumber) {
    if (term !== searchState.term) {
        // 新しい検索語
        performHighlight(term, stopQuestionNumber);

        if (searchState.elements.length > 0) {
            // ▼▼▼ 追加: 現在の画面表示位置から検索を開始するロジック ▼▼▼
            let startIndex = 0;
            // 固定ヘッダーの高さを取得し、それより下にある最初の要素を探す
            const headerOffset = document.getElementById('quiz-header').offsetHeight;

            for (let i = 0; i < searchState.elements.length; i++) {
                const rect = searchState.elements[i].getBoundingClientRect();
                // 要素の上端がヘッダーの下端より下に来た最初のものを開始点とする
                if (rect.top >= headerOffset) {
                    startIndex = i;
                    break;
                }
            }
            
            // currentIndexをstartIndexの直前に設定し、次に'next'を呼ぶとstartIndexが選択されるようにする
            searchState.currentIndex = startIndex - 1; 
            
            // isNewSearchフラグを立てて、不要な初回スクロールを抑制する
            navigateToHighlight('next', true); 
            // ▲▲▲ 追加ここまで ▲▲▲
        } else {
            // ヒットがなかった場合も親フレームに通知を送る
            postSearchResults();
        }

    } else if (term) {
        // 同じ検索語で次へ/前へ（通常ナビゲーション）
        navigateToHighlight(direction, false);
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
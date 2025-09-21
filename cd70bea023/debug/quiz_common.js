// HTML要素の取得
const scoreText = document.getElementById('score-text');
const quizBody = document.getElementById('quiz-body');
const finishBtn = document.getElementById('finish-btn');
const fontIncreaseBtn = document.getElementById('font-increase-btn');
const fontDecreaseBtn = document.getElementById('font-decrease-btn');
const pdfBtn = document.getElementById('pdf-btn');
const jumpMenu = document.getElementById('jump-menu');
const pdfRangeContainer = document.getElementById('pdf-range-container');
const pdfRangeStart = document.getElementById('pdf-range-start');
const pdfRangeEnd = document.getElementById('pdf-range-end');
const pdfOptionsToggle = document.getElementById('pdf-options-toggle');
const pdfControlsWrapper = document.getElementById('pdf-controls-wrapper');

let quizzes = [];
let userAnswers = {};
let currentFontScale = 1.0;
let isReadyForPrint = false;
let currentPdfRangeKey = '';
let scrollSaveTimer = null;
const SAVE_SCROLL_DEBOUNCE_MS = 500;
let currentDataFileKey = '';

let rubyDictionary = {};

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

// ▼▼▼ 変更: ルビの重複を防ぐロジックに修正 ▼▼▼
function applyRuby(text) {
    if (Object.keys(rubyDictionary).length === 0 || !text) {
        return text;
    }

    // 辞書のキーを文字数の長い順にソートし、正規表現の|で連結
    const sortedKeys = Object.keys(rubyDictionary).sort((a, b) => b.length - a.length);
    const pattern = sortedKeys.map(key => escapeRegExp(key)).join('|');
    const regex = new RegExp(pattern, 'g');

    // マッチした部分（辞書にある単語）だけを<ruby>タグに置換する
    return text.replace(regex, (match) => {
        const reading = rubyDictionary[match];
        return `<ruby>${match}<rt>${reading}</rt></ruby>`;
    });
}
// ▲▲▲ 変更ここまで ▲▲▲


// テキストファイルからクイズデータを読み込んで表示する
async function setupQuiz(dataTxtFile) {
    
    quizzes = [];
    userAnswers = {};
    quizBody.innerHTML = ''; 

    currentDataFileKey = 'quizLastPosition_' + dataTxtFile;
    currentPdfRangeKey = 'pdfPrintRange_' + dataTxtFile;

    try {
        const [quizResponse, rubyResponse] = await Promise.all([
            fetch(dataTxtFile),
            fetch('ruby_dictionary.json').catch(e => {
                console.log("ルビ辞書は任意です。読み込みに失敗しました:", e);
                return null;
            })
        ]);

        if (rubyResponse && rubyResponse.ok) {
            rubyDictionary = await rubyResponse.json();
        }

        if (!quizResponse.ok) {
            throw new Error(`HTTP error! status: ${quizResponse.status}`);
        }
        const text = await quizResponse.text();

        if (isMobileDevice()) {
            pdfBtn.style.display = 'none';
            pdfRangeContainer.style.display = 'none';
            pdfOptionsToggle.style.display = 'none';
        } else {
            pdfRangeContainer.style.display = 'flex';
        }

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
            
            const questionWithRuby = applyRuby(quiz.question);
            questionText.innerHTML = `<strong>問題 ${index + 1}:</strong> ${questionWithRuby.replace(/\\n/g, '<br>')}`;
            
            questionContent.appendChild(questionText);
            
            const choicesContainer = document.createElement('div');
            choicesContainer.className = 'choices-container';
            
            const shuffledChoices = [...quiz.choices];
            shuffleArray(shuffledChoices);
            
            shuffledChoices.forEach(choice => {
                const choiceBtn = document.createElement('button');
                choiceBtn.className = 'choice-btn';
                
                const choiceWithRuby = applyRuby(choice);
                choiceBtn.innerHTML = choiceWithRuby.replace(/\\n/g, '<br>');
                
                choiceBtn.dataset.choiceValue = choice;
                choiceBtn.dataset.quizIndex = index;
                
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
            answerDisplay.innerHTML = applyRuby(quiz.correctAnswer);
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
    const savedRange = JSON.parse(localStorage.getItem(currentPdfRangeKey));
    let defaultStart = 1;
    let defaultEnd = totalQuestions;
    if (savedRange && savedRange.start && savedRange.end) {
        if (savedRange.start >= 1 && savedRange.end <= totalQuestions && savedRange.start <= savedRange.end) {
            defaultStart = savedRange.start;
            defaultEnd = savedRange.end;
        }
    }
    pdfRangeStart.value = defaultStart;
    pdfRangeEnd.value = defaultEnd;
    pdfRangeStart.addEventListener('change', handlePdfRangeChange);
    pdfRangeEnd.addEventListener('change', handlePdfRangeChange);
}

function handlePdfRangeChange() {
    let start = parseInt(pdfRangeStart.value, 10);
    let end = parseInt(pdfRangeEnd.value, 10);
    if (start > end) {
        end = start;
        pdfRangeEnd.value = end;
    }
    const rangeToSave = { start: start, end: end };
    localStorage.setItem(currentPdfRangeKey, JSON.stringify(rangeToSave));
}

function selectAnswer(quizIndex, btnElement) {
    if (isReadyForPrint || isFinished) return; 
    const choice = btnElement.dataset.choiceValue;
    userAnswers[quizIndex] = choice;
    const quizItem = document.getElementById(`quiz-${quizIndex}`);
    const choiceButtons = quizItem.querySelectorAll('.choice-btn');
    const feedbackText = quizItem.querySelector('.feedback-text'); 
    const quiz = quizzes[quizIndex];
    const isCorrect = (choice === quiz.correctAnswer);
    choiceButtons.forEach(btn => { btn.classList.remove('selected'); });
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
        if (isCorrect) { score++; }
        choiceButtons.forEach(btn => {
            const btnChoice = btn.dataset.choiceValue;
            if (btnChoice === quiz.correctAnswer) { btn.classList.add('correct'); } 
            else if (btnChoice === userAnswer && !isCorrect) { btn.classList.add('incorrect'); }
            btn.disabled = true;
        });
        if (userAnswer === null || userAnswer === undefined) {
            feedbackText.innerHTML = `正解は「${applyRuby(quiz.correctAnswer)}」 ${applyRuby(quiz.explanation)}`;
            feedbackText.style.color = 'blue';
        }
    });
    updateScore();
    const percentage = quizzes.length > 0 ? (score / quizzes.length) * 100 : 0;
    scoreText.innerHTML = `最終結果: ${score} / ${quizzes.length} 正解<br>正解率: ${percentage.toFixed(1)}%`;
    finishBtn.textContent = 'もう一度挑戦する';
    finishBtn.removeEventListener('click', handleFinishClick);
    finishBtn.addEventListener('click', handleResetClick);
    if (scrollToTop) { window.scrollTo({ top: 0, behavior: 'smooth' }); }
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
    if (isFinished) { prepareForPrint(); return; }
    const password = prompt("パスワードを入力してください:", "");
    if (password === "89") {
        const isConfirmed = confirm('PDF化をするとクイズが終了します。よろしいですか？');
        if (isConfirmed) { prepareForPrint(); }
    } else if (password !== null) { alert("パスワードが違います。"); }
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
        if (titleElement) { quizTitle = titleElement.textContent; }
    } catch (e) { console.warn("Failed to get quiz title for printing:", e); }
    const startNum = parseInt(pdfRangeStart.value, 10);
    const endNum = parseInt(pdfRangeEnd.value, 10);
    let newQuestionCounter = 1;
    if (!isMobileDevice() && startNum && endNum) {
        quizzes.forEach((_, index) => {
            const quizItem = document.getElementById(`quiz-${index}`);
            if (index >= startNum - 1 && index <= endNum - 1) {
                const questionTextElement = quizItem.querySelector('.question-text > strong');
                if (questionTextElement) { questionTextElement.textContent = `問題 ${newQuestionCounter}:`; }
                const questionBodyElement = quizItem.querySelector('.question-text');
                if (questionBodyElement) {
                    let html = questionBodyElement.innerHTML;
                    if (html.includes('★')) {
                        html = html.replace(/(★[\s\S]*)/, '<span class="source-info">$1</span>');
                        questionBodyElement.innerHTML = html;
                    }
                }
                newQuestionCounter++;
            } else { quizItem.classList.add('print-hidden'); }
        });
    }
    const styleId = 'dynamic-print-style';
    let printStyle = document.getElementById(styleId);
    if (printStyle) { printStyle.remove(); }
    printStyle = document.createElement('style');
    printStyle.id = styleId;
    printStyle.innerHTML = `
        @page { size: A4; margin: 2cm; @top-left { content: ""; } @top-center { content: ""; } @top-right { content: "${quizTitle.replace(/"/g, '\\"')}"; font-family: 'Hirino KyoKaSho', serif; font-size: 12pt; color: #666; } @bottom-left { content: "last update ${timestamp}"; font-family: 'Hirino KyoKaSho', serif; font-size: 12pt; color: #666; } @bottom-right { content: counter(page) " / " counter(pages); font-family: 'Hirino KyoKaSho', serif; font-size: 12pt; color: #666; } }
        @media print { .print-hidden { display: none !important; } body { font-family: 'Hirino KyoKaSho', serif !important; } .question-text { font-size: 11pt !important; line-height: 1.2 !important; margin-bottom: 5px !important; font-weight: bold !important; } .source-info { font-weight: normal !important; font-size: 9pt !important; } .choice-btn { font-size: 11pt !important; padding: 2px 4px !important; border: none !important; border-radius: 0 !important; background-color: transparent !important; font-weight: normal !important; } .choice-btn, .choice-btn:disabled { color: #000 !important; } .choices-container { display: flex !important; flex-direction: column !important; gap: 0 !important; } .answer-display { display: flex !important; align-items: center !important; justify-content: center !important; border-left: 1px solid #666 !important; font-size: 12pt !important; font-weight: bold !important; padding: 0 8px !important; text-align: left !important; color: #000 !important; } #quiz-header, #finish-btn, .update-info, h1, .feedback-text, mark.search-highlight { display: none !important; } .quiz-item { page-break-inside: avoid !important; } .quiz-item:nth-child(6n):not(:last-child) { page-break-after: auto !important; } rt { display: none !important; } }`;
    document.head.appendChild(printStyle);
    setTimeout(() => { window.print(); }, 500);
    setTimeout(() => { if (document.getElementById(styleId)) { document.getElementById(styleId).remove(); } location.reload(); }, 1000);
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
                window.scrollTo({ top: offsetPosition, behavior: "smooth" });
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
    if (dataFile) { setupQuiz(dataFile); }
    else {
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
    if (updateElement) { updateElement.innerHTML = `last update ${formattedDate}`; }
    finishBtn.addEventListener('click', handleFinishClick); 
    fontIncreaseBtn.addEventListener('click', () => changeFontSize(currentFontScale + 0.1));
    fontDecreaseBtn.addEventListener('click', () => changeFontSize(currentFontScale - 0.1));
    pdfBtn.addEventListener('click', handlePdfButtonClick);
    if (pdfOptionsToggle) { pdfOptionsToggle.addEventListener('click', () => { pdfControlsWrapper.classList.toggle('collapsed'); }); }
    
    quizBody.addEventListener('click', (event) => {
        const clickedButton = event.target.closest('.choice-btn');
        if (clickedButton && clickedButton.dataset.quizIndex) {
            const quizIndex = parseInt(clickedButton.dataset.quizIndex, 10);
            selectAnswer(quizIndex, clickedButton);
        }
    });
});

window.addEventListener('scroll', () => {
    if (!currentDataFileKey) return;
    clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(() => {
        try {
            const scrollY = window.scrollY;
            if (scrollY > 0) { localStorage.setItem(currentDataFileKey, scrollY); }
        } catch (e) { console.warn('Failed to save scroll position:', e); }
    }, SAVE_SCROLL_DEBOUNCE_MS);
});

// --- 検索機能 ---
const searchState = { term: '', elements: [], currentIndex: -1, originalNodes: new Map() };

function postSearchResults() {
    if (window.parent && window.parent.postMessage) {
        window.parent.postMessage({ type: 'searchResultUpdate', currentIndex: searchState.currentIndex, totalHits: searchState.elements.length, term: searchState.term }, '*');
    }
}
function clearHighlights() {
    searchState.originalNodes.forEach((originalNode, parent) => {
        while (parent.firstChild) { parent.removeChild(parent.firstChild); }
        while (originalNode.firstChild) { parent.appendChild(originalNode.firstChild); }
    });
    searchState.elements.forEach(el => el.classList.remove('active'));
    searchState.term = '';
    searchState.elements = [];
    searchState.currentIndex = -1;
    searchState.originalNodes.clear();
    postSearchResults();
}
function performHighlight(term, stopQuestionNumber) {
    clearHighlights();
    if (!term) return;
    searchState.term = term;
    const regex = new RegExp(escapeRegExp(term), 'gi');
    let nodesToSearch = [];
    const endQuestionIndex = (stopQuestionNumber && !isNaN(parseInt(stopQuestionNumber, 10))) ? parseInt(stopQuestionNumber, 10) - 1 : quizzes.length - 1;
    for (let i = 0; i <= endQuestionIndex; i++) {
        const quizItem = document.getElementById(`quiz-${i}`);
        if (quizItem) { nodesToSearch.push(...quizItem.querySelectorAll('.question-text, .choice-btn')); }
    }
    nodesToSearch.forEach(node => { findAndReplaceText(node, regex, term); });
    searchState.elements = Array.from(document.querySelectorAll('mark.search-highlight'));
}
function escapeRegExp(string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function findAndReplaceText(node, regex, term) {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        const matches = [...text.matchAll(regex)];
        if (matches.length > 0) {
            const parent = node.parentNode;
            if (parent && !searchState.originalNodes.has(parent)) {
                searchState.originalNodes.set(parent, parent.cloneNode(true));
            }
            const fragment = document.createDocumentFragment();
            let lastIndex = 0;
            matches.forEach(match => {
                const foundText = match[0];
                const index = match.index;
                fragment.appendChild(document.createTextNode(text.substring(lastIndex, index)));
                const mark = document.createElement('mark');
                mark.className = 'search-highlight';
                mark.textContent = foundText;
                fragment.appendChild(mark);
                lastIndex = index + foundText.length;
            });
            fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
            node.parentNode.replaceChild(fragment, node);
        }
    } else if (node.nodeType === Node.ELEMENT_NODE && !['MARK', 'RT', 'RP'].includes(node.nodeName)) {
        Array.from(node.childNodes).forEach(child => { findAndReplaceText(child, regex, term); });
    }
}
function navigateToHighlight(direction, isNewSearch = false) {
    if (searchState.elements.length === 0) { postSearchResults(); return; }
    if (searchState.currentIndex >= 0 && searchState.elements[searchState.currentIndex]) {
        searchState.elements[searchState.currentIndex].classList.remove('active');
    }
    if (direction === 'next') {
        searchState.currentIndex++;
        if (searchState.currentIndex >= searchState.elements.length) { searchState.currentIndex = 0; }
    } else if (direction === 'prev') {
        searchState.currentIndex--;
        if (searchState.currentIndex < 0) { searchState.currentIndex = searchState.elements.length - 1; }
    }
    const currentElement = searchState.elements[searchState.currentIndex];
    if (currentElement) {
        currentElement.classList.add('active');
        const headerOffset = document.getElementById('quiz-header').offsetHeight + 10;
        const elementRect = currentElement.getBoundingClientRect();
        const isVisible = (elementRect.top >= headerOffset && elementRect.bottom <= window.innerHeight);
        if (isNewSearch && isVisible) {
            // no scroll
        } else {
            const elementTop = elementRect.top + window.pageYOffset;
            const offsetPosition = elementTop - headerOffset - ((window.innerHeight - headerOffset) / 2);
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    }
    postSearchResults();
}
function handleSearch(term, direction, stopQuestionNumber) {
    if (term !== searchState.term) {
        performHighlight(term, stopQuestionNumber);
        if (searchState.elements.length > 0) {
            let startIndex = 0;
            const headerOffset = document.getElementById('quiz-header').offsetHeight;
            for (let i = 0; i < searchState.elements.length; i++) {
                const rect = searchState.elements[i].getBoundingClientRect();
                if (rect.top >= headerOffset) { startIndex = i; break; }
            }
            searchState.currentIndex = startIndex - 1; 
            navigateToHighlight('next', true); 
        } else { postSearchResults(); }
    } else if (term) {
        navigateToHighlight(direction, false);
    } else { clearHighlights(); }
}
function toggleDarkMode(isDarkMode) {
    if (isDarkMode) { document.body.classList.add('dark-mode'); }
    else { document.body.classList.remove('dark-mode'); }
}

window.addEventListener('message', (event) => {
    if (event.source !== window.parent) return;
    if (event.data && event.data.type === 'setRubyState') {
        if (event.data.state) {
            document.body.classList.add('ruby-visible');
        } else {
            document.body.classList.remove('ruby-visible');
        }
    }
});
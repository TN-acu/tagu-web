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
async function setupQuiz() {
    try {
        if (isMobileDevice()) {
            pdfBtn.style.display = 'none';
        }

        const response = await fetch('quiz_data_seirigaku2025zenki_kimatu.txt');
        if (!response.ok) throw new Error('クイズデータの読み込みに失敗しました。');
        
        let textData = await response.text();
        // BOMが含まれていれば削除
        if (textData.charCodeAt(0) === 0xFEFF) {
            textData = textData.slice(1);
        }

        const lines = textData.split('\n').filter(line => line.trim() !== '');

        let currentQuizData = null;

        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('?')) {
                if (currentQuizData) {
                    quizzes.push(currentQuizData);
                }
                const questionMatch = trimmedLine.match(/^\?\d*\.?\s*(.*)/);
                currentQuizData = {
                    question: questionMatch ? questionMatch[1].trim() : '',
                    choices: [],
                    answer: ''
                };
            } else if (currentQuizData) {
                if (trimmedLine.startsWith('*')) {
                    const choice = trimmedLine.substring(1).trim();
                    if (choice !== '-') {
                        currentQuizData.choices.push(choice);
                        currentQuizData.answer = choice;
                    }
                } else {
                    const choice = trimmedLine;
                     if (choice !== '-') {
                        currentQuizData.choices.push(choice);
                    }
                }
            }
        });
        if (currentQuizData) {
            quizzes.push(currentQuizData);
        }
        
        // 選択肢をシャッフル
        quizzes.forEach(quiz => {
            shuffleArray(quiz.choices);
        });

        renderAllQuizzes();
        updateScore();
        populateJumpMenu();

    } catch (error) {
        quizBody.innerHTML = `<p style="color: red; font-weight: bold;">${error.message}</p>`;
        console.error(error);
    }
}


// ジャンプメニューを作成する関数
function populateJumpMenu() {
    const jumpInterval = 20;
    for (let i = 0; i < quizzes.length; i += jumpInterval) {
        const startNum = i + 1;
        const endNum = Math.min(i + jumpInterval, quizzes.length);
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `問 ${startNum} - ${endNum}`;
        jumpMenu.appendChild(option);
    }

    jumpMenu.addEventListener('change', (event) => {
        const quizIndex = event.target.value;
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
        }
    });
}


// 全てのクイズをHTMLとして描画する関数
function renderAllQuizzes() {
    let quizHTML = '';
    quizzes.forEach((quiz, index) => {
        let choicesHTML = '';
        quiz.choices.forEach((choice, choiceIndex) => {
            if (choice.trim() !== '-') {
                choicesHTML += `<button class="choice-btn" onclick="selectChoice(${index}, ${choiceIndex})">${choice}</button>`;
            }
        });

        quizHTML += `
            <div class="quiz-item" id="quiz-${index}">
                <div class="question-content">
                    <p class="question-text"><strong>問題 ${index + 1}:</strong> ${quiz.question}</p>
                    <div class="choices-container">
                        ${choicesHTML}
                    </div>
                    <p class="feedback-text"></p>
                </div>
                <div class="answer-display">${quiz.answer}</div>
            </div>
        `;
    });
    quizBody.innerHTML = quizHTML;
}


// 選択肢をクリックしたときの処理
function selectChoice(quizIndex, choiceIndex) {
    const quizItem = document.getElementById(`quiz-${quizIndex}`);
    const choiceButtons = quizItem.querySelectorAll('.choice-btn');
    const feedbackText = quizItem.querySelector('.feedback-text');
    
    // ▼▼▼ 修正 ▼▼▼ 空白を除去して比較するための改善
    const expectedChoiceText = quizzes[quizIndex].choices[choiceIndex];
    const selectedBtn = Array.from(choiceButtons).find(btn => btn.textContent.trim() === expectedChoiceText);

    if (!selectedBtn) return;

    choiceButtons.forEach(btn => btn.classList.remove('selected'));
    selectedBtn.classList.add('selected');

    // ▼▼▼ 修正 ▼▼▼ 選択されたテキストは元のデータから取得する
    const selectedChoice = expectedChoiceText;
    const currentQuiz = quizzes[quizIndex];
    
    userAnswers[quizIndex] = selectedChoice;

    if (selectedChoice === currentQuiz.answer) {
        feedbackText.textContent = '正解！';
        feedbackText.style.color = 'green';
    } else {
        feedbackText.textContent = `不正解... 正解は「${currentQuiz.answer}」`;
        feedbackText.style.color = 'red';
    }

    updateScore();
}

// スコアを計算して表示する関数
function updateScore() {
    let score = 0;
    for (const quizIndex in userAnswers) {
        if (userAnswers[quizIndex] === quizzes[quizIndex].answer) {
            score++;
        }
    }
    scoreText.textContent = `正解数: ${score} / ${quizzes.length}`;
}

// 「クイズ終了」ボタンを押したときの処理
// ▼▼▼ 修正: 引数(scrollToTop) を追加 ▼▼▼
function finishQuiz(scrollToTop = true) {
    let score = 0;
    
    quizzes.forEach((quiz, index) => {
        const quizItem = document.getElementById(`quiz-${index}`);
        const choiceButtons = quizItem.querySelectorAll('.choice-btn');
        const feedbackText = quizItem.querySelector('.feedback-text');
        
        choiceButtons.forEach(btn => btn.disabled = true);
        
        const userAnswer = userAnswers[index];

        if (userAnswer) { 
            if (userAnswer === quiz.answer) {
                score++;
                choiceButtons.forEach(btn => {
                    // ▼▼▼ 修正 ▼▼▼ 空白を除去して比較
                    if (btn.textContent.trim() === userAnswer) btn.classList.add('correct');
                });
            } else {
                choiceButtons.forEach(btn => {
                    // ▼▼▼ 修正 ▼▼▼ 空白を除去して比較
                    if (btn.textContent.trim() === userAnswer) btn.classList.add('incorrect');
                    if (btn.textContent.trim() === quiz.answer) btn.classList.add('correct');
                });
            }
        } else { 
            choiceButtons.forEach(btn => {
                // ▼▼▼ 修正 ▼▼▼ 空白を除去して比較
                if (btn.textContent.trim() === quiz.answer) {
                    btn.classList.add('correct');
                }
            });
            feedbackText.textContent = ` 正解は「${quiz.answer}」`;
            feedbackText.style.color = 'blue';
        }
    });

    const percentage = quizzes.length > 0 ? (score / quizzes.length) * 100 : 0;
    scoreText.innerHTML = `
        最終結果: ${score} / ${quizzes.length} 正解<br>
        正解率: ${percentage.toFixed(1)}%
    `;
    
    finishBtn.textContent = 'もう一度挑戦する';
    finishBtn.onclick = () => location.reload();
    
    // ▼▼▼ 修正: 引数に応じてスクロールを制御 ▼▼▼
    if (scrollToTop) {
        window.scrollTo(0, 0);
    }
}
// ▲▲▲ 修正ここまで ▲▲▲

// PDF印刷のメインロジック
function handlePdfPrint() {
    finishQuiz(true); // PDF化の際は必ずトップにスクロール

    const lastModified = new Date(document.lastModified);
    const year = lastModified.getFullYear();
    const month = String(lastModified.getMonth() + 1).padStart(2, '0');
    const day = String(lastModified.getDate()).padStart(2, '0');
    const hours = String(lastModified.getHours()).padStart(2, '0');
    const minutes = String(lastModified.getMinutes()).padStart(2, '0');
    const seconds = String(lastModified.getSeconds()).padStart(2, '0');
    const timestamp = `${year}${month}${day} ${hours}:${minutes}:${seconds}`;

    const printStyle = document.createElement('style');
    printStyle.id = 'dynamic-print-style';
    printStyle.innerHTML = `
        @page {
            size: A4;
            margin: 2cm;
            @bottom-left {
                content: "last update ${timestamp}";
                font-family: 'Hiragino KyoKaSho', 'ヒラギノ教科書体', 'IPAex教科書体', serif;
                font-size: 10pt;
                color: #666;
            }
            @bottom-right {
                content: counter(page) " / " counter(pages);
                font-family: 'Hiragino KyoKaSho', 'ヒラギノ教科書体', 'IPAex教科書体', serif;
                font-size: 10pt;
                color: #666;
            }
        }
    `;

    document.head.appendChild(printStyle);
    window.print();
    document.head.removeChild(printStyle);
}

// イベントリスナーを設定
finishBtn.addEventListener('click', () => {
    // ▼▼▼ 修正: finishQuiz() 呼び出し時に true を渡す ▼▼▼
    finishQuiz(true);
    // ▲▲▲ 修正ここまで ▲▲▲
    isReadyForPrint = true;
    pdfBtn.textContent = '印刷プレビューを開く';
    pdfBtn.classList.add('ready');
});

fontIncreaseBtn.addEventListener('click', () => {
    currentFontScale += 0.1;
    document.body.style.fontSize = `${currentFontScale * 100}%`;
});

fontDecreaseBtn.addEventListener('click', () => {
    if (currentFontScale > 0.7) {
        currentFontScale -= 0.1;
        document.body.style.fontSize = `${currentFontScale * 100}%`;
    }
});

pdfBtn.addEventListener('click', () => {
    if (isReadyForPrint) {
        handlePdfPrint();
        return;
    }

    const enteredPassword = prompt('パスワードを入力してください:');
    if (enteredPassword === '89') {
        const isConfirmed = confirm('PDF化をするとクイズが終了します。よろしいですか？');
        if (isConfirmed) {
            handlePdfPrint();
        }
    } else if (enteredPassword !== null) {
        alert('パスワードが違います。');
    }
});

// 最初にクイズをセットアップ
setupQuiz();


// ▼▼▼ 追加: クイズリセット機能（リロードなし） ▼▼▼
/**
 * ページをリロードせずにクイズの状態のみをリセットする
 * (オートスクロールOFF時、または親フレームの「戻る」ボタン押下時に呼び出される)
 */
function resetQuiz() {
    userAnswers = {};
    updateScore(); // スコア表示をリセット

    quizzes.forEach((quiz, index) => {
        const quizItem = document.getElementById(`quiz-${index}`);
        if (!quizItem) return;

        const choiceButtons = quizItem.querySelectorAll('.choice-btn');
        const feedbackText = quizItem.querySelector('.feedback-text');
        
        // ボタンの状態をリセット
        choiceButtons.forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('selected', 'correct', 'incorrect');
        });
        
        // フィードバックテキストを消去
        if (feedbackText) {
            feedbackText.textContent = '';
        }
    });

    // 終了ボタンを元の状態に戻す
    finishBtn.textContent = 'クイズ終了';
    finishBtn.onclick = null; // location.reload() の onclick を削除 (addEventListener が再度有効になる)

    // PDFボタンの状態をリセット
    isReadyForPrint = false;
    pdfBtn.textContent = '正答PDF化';
    pdfBtn.classList.remove('ready');
}
// ▲▲▲ 追加ここまで ▲▲▲


// --- カスタム検索機能 (追加) ---

let searchState = {
    term: "",
    elements: [],
    currentIndex: -1
};

/**
 * 以前のハイライトをクリアする
 */
function clearHighlights() {
    const searchArea = document.getElementById('quiz-body');
    if (!searchArea) return; // quiz-bodyが存在しない場合は何もしない
    const highlights = searchArea.querySelectorAll('mark.search-highlight');
    highlights.forEach(mark => {
        const parent = mark.parentNode;
        if (parent) {
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize(); // 隣接するテキストノードを結合する
        }
    });
    searchState.elements = [];
    searchState.currentIndex = -1;
}

/**
 * テキストノードを探索し、検索語に一致する部分を<mark>タグで囲む
 * @param {string} term - 検索キーワード
 */
function performHighlight(term) {
    if (!term) return;

    const searchArea = document.getElementById('quiz-body');
    if (!searchArea) return;

    // 正規表現のエスケープ処理
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedTerm, 'gi'); // 大文字小文字を区別せず、グローバル検索

    const walker = document.createTreeWalker(searchArea, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        // スクリプトタグやスタイルタグ内のテキストは除外
        const parentTag = node.parentElement.tagName.toUpperCase();
        if (parentTag !== 'SCRIPT' && parentTag !== 'STYLE') {
             if (regex.test(node.textContent)) {
                 textNodes.push(node);
             }
        }
    }

    textNodes.forEach(textNode => {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        textNode.textContent.replace(regex, (match, offset) => {
            // マッチ前のテキストを追加
            fragment.appendChild(document.createTextNode(textNode.textContent.substring(lastIndex, offset)));
            // マッチした部分を<mark>タグで囲んで追加
            const mark = document.createElement('mark');
            mark.className = 'search-highlight';
            mark.textContent = match;
            fragment.appendChild(mark);
            searchState.elements.push(mark); // ハイライト要素を保存
            lastIndex = offset + match.length;
        });
        // マッチ後の残りのテキストを追加
        fragment.appendChild(document.createTextNode(textNode.textContent.substring(lastIndex)));
        textNode.parentNode.replaceChild(fragment, textNode);
    });
}

/**
 * 次または前のハイライトに移動する
 * @param {string} direction - 'next' または 'prev'
 */
function navigateToHighlight(direction) {
    if (searchState.elements.length === 0) return;

    // 現在のハイライトから active クラスを削除
    if (searchState.currentIndex >= 0 && searchState.elements[searchState.currentIndex]) {
        searchState.elements[searchState.currentIndex].classList.remove('active');
    }

    // インデックスを更新
    if (direction === 'next') {
        searchState.currentIndex++;
        if (searchState.currentIndex >= searchState.elements.length) {
            searchState.currentIndex = 0; // 最後まで行ったら最初に戻る
        }
    } else if (direction === 'prev') {
        searchState.currentIndex--;
        if (searchState.currentIndex < 0) {
            searchState.currentIndex = searchState.elements.length - 1; // 最初より前に行ったら最後に戻る
        }
    }

    // 新しいハイライトに active クラスを追加し、画面中央にスクロール
    const currentElement = searchState.elements[searchState.currentIndex];
    if (currentElement) {
        currentElement.classList.add('active');
        currentElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
}

/**
 * 親フレームから呼び出される検索ハンドラ
 * @param {string} term - 検索キーワード
 * @param {string} direction - 'next' または 'prev'
 */
window.handleSearch = function(term, direction) {
    // 検索語が変わった場合はハイライトを再生成する
    if (term !== searchState.term) {
        clearHighlights();
        searchState.term = term;
        performHighlight(term);
    }
    navigateToHighlight(direction);
};
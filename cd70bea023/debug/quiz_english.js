// --- DOM要素の取得 ---
const cardStackContainer = document.getElementById('card-stack-container');
const correctBtn = document.getElementById('correct-btn');
const incorrectBtn = document.getElementById('incorrect-btn');
const cardCounter = document.getElementById('card-counter');
const scoreDisplay = document.getElementById('score');
const resultContainer = document.getElementById('result-container');
const finalScore = document.getElementById('final-score');
const resultDetails = document.getElementById('result-details');
const retryBtn = document.getElementById('retry-btn');
const controls = document.getElementById('controls');
const feedbackCorrect = document.getElementById('feedback-correct');
const feedbackIncorrect = document.getElementById('feedback-incorrect');

// --- クイズデータ（全36問のマスターデータ） ---
const quizData = [
    // --- 正しいペア ---
    { image: 'pic_quiz_data_english2025zenki_kimatu/a_Move your right hand down your right side..png', text: 'Move your right hand down your right side.', isCorrectPair: true },
    { image: 'pic_quiz_data_english2025zenki_kimatu/b_Turn your shoulders around to the right..png', text: 'Turn your shoulders around to the right.', isCorrectPair: true },
    { image: 'pic_quiz_data_english2025zenki_kimatu/c_Lean backwards (carefully!).png', text: 'Lean backwards (carefully!).', isCorrectPair: true },
    { image: 'pic_quiz_data_english2025zenki_kimatu/d_Move your left hand down your left side.png', text: 'Move your left hand down your left side.', isCorrectPair: true },
    { image: 'pic_quiz_data_english2025zenki_kimatu/e_Bend down. Try to touch your toes..png', text: 'Bend down. Try to touch your toes.', isCorrectPair: true },
    { image: 'pic_quiz_data_english2025zenki_kimatu/f_Turn your shoulders around to the left..png', text: 'Turn your shoulders around to the left.', isCorrectPair: true },

    // --- 間違ったペア（ひっかけ問題）---
    // イラスト a
    { image: 'pic_quiz_data_english2025zenki_kimatu/a_Move your right hand down your right side..png', text: 'Turn your shoulders around to the right.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/a_Move your right hand down your right side..png', text: 'Lean backwards (carefully!).', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/a_Move your right hand down your right side..png', text: 'Move your left hand down your left side.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/a_Move your right hand down your right side..png', text: 'Bend down. Try to touch your toes.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/a_Move your right hand down your right side..png', text: 'Turn your shoulders around to the left.', isCorrectPair: false },
    // イラスト b
    { image: 'pic_quiz_data_english2025zenki_kimatu/b_Turn your shoulders around to the right..png', text: 'Move your right hand down your right side.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/b_Turn your shoulders around to the right..png', text: 'Lean backwards (carefully!).', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/b_Turn your shoulders around to the right..png', text: 'Move your left hand down your left side.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/b_Turn your shoulders around to the right..png', text: 'Bend down. Try to touch your toes.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/b_Turn your shoulders around to the right..png', text: 'Turn your shoulders around to the left.', isCorrectPair: false },
    // イラスト c
    { image: 'pic_quiz_data_english2025zenki_kimatu/c_Lean backwards (carefully!).png', text: 'Move your right hand down your right side.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/c_Lean backwards (carefully!).png', text: 'Turn your shoulders around to the right.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/c_Lean backwards (carefully!).png', text: 'Move your left hand down your left side.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/c_Lean backwards (carefully!).png', text: 'Bend down. Try to touch your toes.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/c_Lean backwards (carefully!).png', text: 'Turn your shoulders around to the left.', isCorrectPair: false },
    // イラスト d
    { image: 'pic_quiz_data_english2025zenki_kimatu/d_Move your left hand down your left side.png', text: 'Move your right hand down your right side.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/d_Move your left hand down your left side.png', text: 'Turn your shoulders around to the right.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/d_Move your left hand down your left side.png', text: 'Lean backwards (carefully!).', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/d_Move your left hand down your left side.png', text: 'Bend down. Try to touch your toes.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/d_Move your left hand down your left side.png', text: 'Turn your shoulders around to the left.', isCorrectPair: false },
    // イラスト e
    { image: 'pic_quiz_data_english2025zenki_kimatu/e_Bend down. Try to touch your toes..png', text: 'Move your right hand down your right side.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/e_Bend down. Try to touch your toes..png', text: 'Turn your shoulders around to the right.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/e_Bend down. Try to touch your toes..png', text: 'Lean backwards (carefully!).', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/e_Bend down. Try to touch your toes..png', text: 'Move your left hand down your left side.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/e_Bend down. Try to touch your toes..png', text: 'Turn your shoulders around to the left.', isCorrectPair: false },
    // イラスト f
    { image: 'pic_quiz_data_english2025zenki_kimatu/f_Turn your shoulders around to the left..png', text: 'Move your right hand down your right side.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/f_Turn your shoulders around to the left..png', text: 'Turn your shoulders around to the right.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/f_Turn your shoulders around to the left..png', text: 'Lean backwards (carefully!).', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/f_Turn your shoulders around to the left..png', text: 'Move your left hand down your left side.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/f_Turn your shoulders around to the left..png', text: 'Bend down. Try to touch your toes.', isCorrectPair: false }
];

// --- グローバル変数 ---
let currentCardIndex = 0;
let score = 0;
let userAnswers = [];
let isAnimating = false;
let currentQuizSet = [];
let allCards = [];

// --- 初期化 ---
function initializeQuiz() {
    currentCardIndex = 0;
    score = 0;
    userAnswers = [];
    isAnimating = false;
    
    const correctPairs = quizData.filter(item => item.isCorrectPair);
    const incorrectPairs = quizData.filter(item => !item.isCorrectPair);

    shuffleArray(incorrectPairs);
    const selectedIncorrectPairs = incorrectPairs.slice(0, 4);

    currentQuizSet = [...correctPairs, ...selectedIncorrectPairs];
    shuffleArray(currentQuizSet);

    resultContainer.classList.add('hidden');
    controls.classList.remove('hidden');
    cardStackContainer.innerHTML = '';
    createCards();
    updateStatus();
    attachEventListeners();
    
    history.replaceState({ index: 0 }, '', '');

    if (allCards.length > 0) {
        const firstCard = allCards[0];
        firstCard.classList.add('swipe-hint-animation');
        firstCard.addEventListener('animationend', () => {
            firstCard.classList.remove('swipe-hint-animation');
        }, { once: true });
    }
}

// --- カードの生成 ---
function createCards() {
    allCards = [];
    currentQuizSet.forEach((item, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = `
            <img src="${item.image}" alt="Quiz Image" class="quiz-image">
            <p class="quiz-text"><b>${item.text}</b></p>
        `;
        card.style.zIndex = currentQuizSet.length - index;
        cardStackContainer.appendChild(card);
        allCards.push(card);
    });
    // 最初のカードにだけイベントリスナーを設定
    if (allCards.length > 0) {
        setupCardEventListeners(allCards[0]);
    }
}

// --- イベントリスナーの設定 ---
function attachEventListeners() {
    correctBtn.onclick = () => handleAnswer(true);
    incorrectBtn.onclick = () => handleAnswer(false);
    retryBtn.onclick = (e) => {
        e.preventDefault();
        initializeQuiz();
    };
    window.addEventListener('popstate', handlePopState);
}

// ★★★ 全カードに適用されるようリスナー管理を修正 ★★★
function setupCardEventListeners(card) {
    let isDragging = false;
    let startX = 0;
    let diffX = 0;

    const onDragStart = (e) => {
        if (isAnimating) return;
        isDragging = true;
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        card.classList.add('dragging');
        
        // ドラッグ開始時にmoveとendのリスナーを追加
        document.addEventListener('mousemove', onDragMove);
        document.addEventListener('mouseup', onDragEnd);
        document.addEventListener('touchmove', onDragMove, { passive: false });
        document.addEventListener('touchend', onDragEnd);
        
        e.preventDefault();
    };

    const onDragMove = (e) => {
        if (!isDragging || isAnimating) return;
        const currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        diffX = currentX - startX;
        const rotation = diffX / 15;

        card.style.transform = `translateX(${diffX}px) rotate(${rotation}deg)`;

        const opacity = Math.min(Math.abs(diffX) / 100, 1);
        if (diffX > 0) {
            feedbackCorrect.style.opacity = opacity;
            feedbackIncorrect.style.opacity = 0;
        } else {
            feedbackIncorrect.style.opacity = opacity;
            feedbackCorrect.style.opacity = 0;
        }
    };

    const onDragEnd = () => {
        if (!isDragging || isAnimating) return;
        isDragging = false;
        card.classList.remove('dragging');

        // ドラッグ終了時にmoveとendのリスナーを削除
        document.removeEventListener('mousemove', onDragMove);
        document.removeEventListener('mouseup', onDragEnd);
        document.removeEventListener('touchmove', onDragMove);
        document.removeEventListener('touchend', onDragEnd);

        const swipeThreshold = 100;

        if (Math.abs(diffX) > swipeThreshold) {
            handleAnswer(diffX > 0, diffX > 0 ? 'right' : 'left');
        } else {
            card.style.transform = '';
        }
        feedbackCorrect.style.opacity = 0;
        feedbackIncorrect.style.opacity = 0;
    };

    card.addEventListener('mousedown', onDragStart);
    card.addEventListener('touchstart', onDragStart, { passive: false });
}

// --- 回答処理 ---
function handleAnswer(userChoice, direction = null) {
    if (currentCardIndex >= currentQuizSet.length || isAnimating) return;
    isAnimating = true;

    const quizItem = currentQuizSet[currentCardIndex];
    const card = allCards[currentCardIndex];
    const wasCorrect = (userChoice === quizItem.isCorrectPair);

    userAnswers.push({ quizItem, userChoice, wasCorrect });

    if (wasCorrect) {
        score++;
        showFeedback(true);
    } else {
        showFeedback(false);
    }
    
    const rotation = direction === 'left' ? -30 : (direction === 'right' ? 30 : (userChoice ? 30 : -30));
    card.style.transform = `translateX(${rotation * 15}px) rotate(${rotation}deg)`;
    card.style.opacity = '0';
    card.classList.add('removing');

    setTimeout(() => {
        currentCardIndex++;
        updateStatus();
        isAnimating = false;
        if (currentCardIndex < currentQuizSet.length) {
            // 次のカードにイベントリスナーを設定
            setupCardEventListeners(allCards[currentCardIndex]);
            history.pushState({ index: currentCardIndex }, '', '');
        } else {
            showResult();
            history.pushState({ index: currentCardIndex }, '', '');
        }
    }, 500);
}

// --- 正解・不正解のフィードバック表示 ---
function showFeedback(isCorrect) {
    if (isCorrect) {
        feedbackCorrect.style.opacity = '1';
    } else {
        feedbackIncorrect.style.opacity = '1';
    }
    setTimeout(() => {
        feedbackCorrect.style.opacity = '0';
        feedbackIncorrect.style.opacity = '0';
    }, 500);
}

// --- ステータス更新 ---
function updateStatus() {
    cardCounter.textContent = `${currentCardIndex} / ${currentQuizSet.length}（回答数/問題数）`;
    scoreDisplay.textContent = `正解数: ${score}`;
}

// --- 結果表示 ---
function showResult() {
    finalScore.textContent = `あなたの点数　${score} / ${currentQuizSet.length}`;
    resultDetails.innerHTML = '';
    userAnswers.forEach(({ quizItem, userChoice, wasCorrect }) => {
        const resultItem = document.createElement('div');
        resultItem.classList.add('result-item', wasCorrect ? 'correct' : 'incorrect');
        const userAnswerText = userChoice ? '<span class="user-choice-correct">〇正しい</span>' : '<span class="user-choice-incorrect">✖間違い</span>';
        const correctAnswerText = quizItem.isCorrectPair ? '〇正しい' : '✖間違い';
        resultItem.innerHTML = `
            <img src="${quizItem.image}" alt="Result Image" class="result-image">
            <div class="result-item-text">
                <p>${quizItem.text}</p>
                <small>あなたの回答: ${userAnswerText} | 正解: ${correctAnswerText}</small>
            </div>
        `;
        resultDetails.appendChild(resultItem);
    });
    controls.classList.add('hidden');
    resultContainer.classList.remove('hidden');
}

// --- 戻るボタンが押された時の処理 ---
function handlePopState(event) {
    if (!event.state) return;
    const targetIndex = event.state.index;

    if (targetIndex === undefined || targetIndex === currentCardIndex) return;

    while (currentCardIndex > targetIndex) {
        undoLastAnswer();
    }
}

// --- 直前の回答を１つ取り消す関数 ---
function undoLastAnswer() {
    if (currentCardIndex === 0) return;

    if (currentCardIndex === currentQuizSet.length) {
        resultContainer.classList.add('hidden');
        controls.classList.remove('hidden');
    }

    currentCardIndex--;

    const lastAnswer = userAnswers.pop();
    if (lastAnswer && lastAnswer.wasCorrect) {
        score--;
    }

    const cardToRestore = allCards[currentCardIndex];
    if (cardToRestore) {
        cardToRestore.classList.remove('removing');
        cardToRestore.style.transform = '';
        cardToRestore.style.opacity = '1';
        setupCardEventListeners(cardToRestore);
    }

    updateStatus();
}


// --- ヘルパー関数 ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- 親フレームからのダークモード切り替えに対応 ---
function toggleDarkMode(isDarkMode) {
    document.body.classList.toggle('dark-mode', isDarkMode);
}

// --- 初期化実行 ---
document.addEventListener('DOMContentLoaded', initializeQuiz);
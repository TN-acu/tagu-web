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

// --- クイズデータ ---
const quizData = [
    { image: 'pic_quiz_data_english2025zenki_kimatu/a_Move your right hand down your right side..png', text: 'Move your right hand down your right side.', isCorrectPair: true },
    { image: 'pic_quiz_data_english2025zenki_kimatu/d_Move your left hand down your left side.png', text: 'Move your left hand down your left side.', isCorrectPair: true },
    { image: 'pic_quiz_data_english2025zenki_kimatu/c_Lean backwards (carefully!).png', text: 'Lean backwards (carefully!).', isCorrectPair: true },
    { image: 'pic_quiz_data_english2025zenki_kimatu/e_Bend down. Try to touch your toes..png', text: 'Bend down. Try to touch your toes.', isCorrectPair: true },
    { image: 'pic_quiz_data_english2025zenki_kimatu/b_Turn your shoulders around to the right..png', text: 'Turn your shoulders around to the right.', isCorrectPair: true },
    { image: 'pic_quiz_data_english2025zenki_kimatu/f_Turn your shoulders around to the left..png', text: 'Turn your shoulders around to the left.', isCorrectPair: true },
    { image: 'pic_quiz_data_english2025zenki_kimatu/a_Move your right hand down your right side..png', text: 'Bend down. Try to touch your toes.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/c_Lean backwards (carefully!).png', text: 'Move your left hand down your left side.', isCorrectPair: false },
    { image: 'pic_quiz_data_english2025zenki_kimatu/e_Bend down. Try to touch your toes..png', text: 'Turn your shoulders around to the right.', isCorrectPair: false }
];

let currentCardIndex = 0;
let userAnswers = [];
let score = 0;
// ▼▼▼ 追加: スワイプの重複を防ぐためのフラグ ▼▼▼
let isCardAnimating = false;
// ▲▲▲ 追加ここまで ▲▲▲

// --- 初期化処理 ---
function init() {
    currentCardIndex = 0;
    userAnswers = [];
    score = 0;
    cardStackContainer.innerHTML = '';
    resultContainer.classList.add('hidden');
    controls.classList.remove('hidden');
    shuffleArray(quizData);
    createCardStack();
    updateStatus();
    correctBtn.onclick = () => handleUserInput(true);
    incorrectBtn.onclick = () => handleUserInput(false);
    
    // ▼▼▼ 修正: aタグになったため、イベントリスナーで処理する ▼▼▼
    retryBtn.addEventListener('click', (e) => {
        e.preventDefault(); // リンクのデフォルト動作を防ぐ
        location.reload();
    });
    // ▲▲▲ 修正ここまで ▲▲▲

    history.replaceState({index: 0}, '');
    try {
        const isParentDark = window.parent.document.body.classList.contains('dark-mode');
        document.body.classList.toggle('dark-mode', isParentDark);
    } catch (e) {}
}

// --- カードスタック生成 ---
function createCardStack() {
    cardStackContainer.innerHTML = `
        <div class="feedback" id="feedback-correct">✔ 正解</div>
        <div class="feedback" id="feedback-incorrect">✖ 不正解</div>
    `;
    quizData.forEach((data, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.zIndex = quizData.length - index;
        card.innerHTML = `
            <img src="${data.image}" alt="Posture image" class="card-image">
            <p class="card-text">${data.text}</p>
        `;
        cardStackContainer.appendChild(card);
    });
    const firstCard = document.querySelector(`.card:nth-last-child(${quizData.length})`);
    setupCardEventListeners(firstCard);
}

// --- カードのイベントリスナー設定 ---
function setupCardEventListeners(card) {
    if (!card) return;
    let startX = 0;
    let isDragging = false;
    const onPointerMove = (e) => {
        if (!isDragging) return;
        const currentX = e.clientX || e.touches[0].clientX;
        const diffX = currentX - startX;
        const rotation = diffX / 20;
        card.style.transform = `translateX(${diffX}px) rotate(${rotation}deg)`;
        if (diffX > 50) {
            feedbackCorrect.style.opacity = '1';
            feedbackIncorrect.style.opacity = '0';
        } else if (diffX < -50) {
            feedbackIncorrect.style.opacity = '1';
            feedbackCorrect.style.opacity = '0';
        } else {
            feedbackCorrect.style.opacity = '0';
            feedbackIncorrect.style.opacity = '0';
        }
    };
    const onPointerUp = (e) => {
        if (!isDragging) return;
        isDragging = false;
        card.classList.remove('dragging');
        document.removeEventListener('mousemove', onPointerMove);
        document.removeEventListener('mouseup', onPointerUp);
        document.removeEventListener('touchmove', onPointerMove);
        document.removeEventListener('touchend', onPointerUp);
        const diffX = (e.clientX || e.changedTouches[0].clientX) - startX;
        if (Math.abs(diffX) > 100) {
            const direction = diffX > 0 ? 'correct' : 'incorrect';
            handleUserInput(direction === 'correct');
        } else {
            card.style.transform = 'translateX(0) rotate(0)';
        }
        feedbackCorrect.style.opacity = '0';
        feedbackIncorrect.style.opacity = '0';
    };
    const onPointerDown = (e) => {
        if (currentCardIndex >= quizData.length) return;
        isDragging = true;
        startX = e.clientX || e.touches[0].clientX;
        card.classList.add('dragging');
        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('mouseup', onPointerUp);
        document.addEventListener('touchmove', onPointerMove, { passive: true });
        document.addEventListener('touchend', onPointerUp);
    };
    card.addEventListener('mousedown', onPointerDown);
    card.addEventListener('touchstart', onPointerDown, { passive: true });
}

// --- ユーザーの入力を処理 ---
function handleUserInput(userChoice) {
    // ▼▼▼ 修正: アニメーション中は処理を重複させない ▼▼▼
    if (currentCardIndex >= quizData.length || isCardAnimating) return;
    isCardAnimating = true;
    // ▲▲▲ 修正ここまで ▲▲▲

    const currentQuiz = quizData[currentCardIndex];
    const isCorrect = (userChoice === currentQuiz.isCorrectPair);
    if (isCorrect) score++;
    userAnswers.push({ ...currentQuiz, userChoice: userChoice, wasCorrect: isCorrect });
    const topCard = document.querySelector(`.card:nth-last-child(${quizData.length - currentCardIndex})`);
    if (topCard) {
        const direction = userChoice ? 1 : -1;
        topCard.style.transform = `translateX(${direction * 500}px) rotate(${direction * 30}deg)`;
        topCard.style.opacity = '0';
    }
    currentCardIndex++;
    history.pushState({index: currentCardIndex}, '');
    updateStatus();
    if (currentCardIndex < quizData.length) {
        const nextCard = document.querySelector(`.card:nth-last-child(${quizData.length - currentCardIndex})`);
        setupCardEventListeners(nextCard);
    } else {
        setTimeout(showResult, 300);
    }

    // ▼▼▼ 追加: アニメーションが終わる頃にフラグを解除 ▼▼▼
    setTimeout(() => {
        isCardAnimating = false;
    }, 300); // CSSのtransition時間と合わせる
    // ▲▲▲ 追加ここまで ▲▲▲
}

// --- ステータス表示を更新 ---
function updateStatus() {
    if (currentCardIndex < quizData.length) {
        cardCounter.textContent = `${currentCardIndex} / ${quizData.length}（回答数/問題数）`;
    } else {
        cardCounter.textContent = `クイズ終了`;
    }
    scoreDisplay.textContent = `正解数: ${score}`;
}

// --- 結果を表示 ---
function showResult() {
    controls.classList.add('hidden');
    finalScore.textContent = `あなたの点数　${score} / ${quizData.length}`;
    resultDetails.innerHTML = '';
    userAnswers.forEach(answer => {
        const item = document.createElement('div');
        item.className = `result-item ${answer.wasCorrect ? 'correct' : 'incorrect'}`;
        const userChoiceSymbol = answer.userChoice ? '<span style="color: red; font-weight: bold;">〇</span>' : '<span style="color: blue; font-weight: bold;">✖</span>';
        const actualAnswerText = answer.isCorrectPair ? '<span style="color: red; font-weight: bold;">〇</span> 正しいペア' : '<span style="color: blue; font-weight: bold;">✖</span> 間違いペア';
        item.innerHTML = `
            <img src="${answer.image}" alt="問題の図" class="result-image">
            <div class="result-text-content">
                <p>"${answer.text}"</p>
                <p>
                    <strong>あなたの回答:</strong> ${userChoiceSymbol} | 
                    <strong>正解:</strong> ${actualAnswerText}
                </p>
            </div>
        `;
        resultDetails.appendChild(item);
    });
    resultContainer.classList.remove('hidden');
}

// --- 1つ前の回答を取り消す関数 ---
function undoLastAnswer() {
    if (currentCardIndex === 0) return;
    if (currentCardIndex === quizData.length) {
        resultContainer.classList.add('hidden');
        controls.classList.remove('hidden');
    }
    currentCardIndex--;
    const lastAnswer = userAnswers.pop();
    if (lastAnswer && lastAnswer.wasCorrect) {
        score--;
    }
    const cardToRestore = document.querySelector(`.card:nth-last-child(${quizData.length - currentCardIndex})`);
    if (cardToRestore) {
        const newCard = cardToRestore.cloneNode(true);
        cardToRestore.parentNode.replaceChild(newCard, cardToRestore);
        newCard.style.transform = '';
        newCard.style.opacity = '';
        setupCardEventListeners(newCard);
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
document.addEventListener('DOMContentLoaded', init); 

// --- ブラウザの戻るボタンが押された時の処理 ---
window.addEventListener('popstate', (event) => {
    if (!event.state || event.state.index === undefined) return;
    const targetIndex = event.state.index;
    if (targetIndex < currentCardIndex) {
        undoLastAnswer();
    }
});
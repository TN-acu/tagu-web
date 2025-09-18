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
// 提供された画像データに基づいて作成
const quizData = [
    // --- 正解のペア (6組) ---
    { 
        image: 'pic_quiz_data_english2025zenki_kimatu/a_Move your right hand down your right side..png',
        text: 'Move your right hand down your right side.',
        isCorrectPair: true 
    },
    { 
        image: 'pic_quiz_data_english2025zenki_kimatu/d_Move your left hand down your left side.png',
        text: 'Move your left hand down your left side.',
        isCorrectPair: true 
    },
    { 
        image: 'pic_quiz_data_english2025zenki_kimatu/c_Lean backwards (carefully!).png',
        text: 'Lean backwards (carefully!).',
        isCorrectPair: true 
    },
    { 
        image: 'pic_quiz_data_english2025zenki_kimatu/e_Bend down. Try to touch your toes..png',
        text: 'Bend down. Try to touch your toes.',
        isCorrectPair: true 
    },
    { 
        image: 'pic_quiz_data_english2025zenki_kimatu/b_Turn your shoulders around to the right..png',
        text: 'Turn your shoulders around to the right.',
        isCorrectPair: true 
    },
    { 
        image: 'pic_quiz_data_english2025zenki_kimatu/f_Turn your shoulders around to the left..png',
        text: 'Turn your shoulders around to the left.',
        isCorrectPair: true 
    },
    // --- 不正解のペア (3組) ---
    { 
        image: 'pic_quiz_data_english2025zenki_kimatu/a_Move your right hand down your right side..png',
        text: 'Bend down. Try to touch your toes.', // 図a と テキストe を組み合わせ
        isCorrectPair: false 
    },
    { 
        image: 'pic_quiz_data_english2025zenki_kimatu/c_Lean backwards (carefully!).png',
        text: 'Move your left hand down your left side.', // 図c と テキストd を組み合わせ
        isCorrectPair: false 
    },
    { 
        image: 'pic_quiz_data_english2025zenki_kimatu/e_Bend down. Try to touch your toes..png',
        text: 'Turn your shoulders around to the right.', // 図e と テキストb を組み合わせ
        isCorrectPair: false 
    }
];

let currentCardIndex = 0;
let userAnswers = [];
let score = 0;

// --- 初期化処理 ---
function init() {
    // 状態リセット
    currentCardIndex = 0;
    userAnswers = [];
    score = 0;
    cardStackContainer.innerHTML = '';
    resultContainer.classList.add('hidden');
    controls.classList.remove('hidden');

    // クイズデータをシャッフル
    shuffleArray(quizData);

    // カードを生成
    createCardStack();
    updateStatus();

    // イベントリスナーを再設定
    correctBtn.onclick = () => handleUserInput(true);
    incorrectBtn.onclick = () => handleUserInput(false);
    retryBtn.onclick = () => {
        // 「もう一度やる」時は履歴のスタックをリセットするためリロードする
        location.reload();
    };

    // ▼▼▼ 修正: 戻るボタンのための履歴管理を初期化 ▼▼▼
    // 現在の履歴をクイズの開始地点として設定
    history.replaceState({index: 0}, '');
    // ▲▲▲ 修正ここまで ▲▲▲
}

// --- カードスタック生成 ---
function createCardStack() {
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
    setupCardEventListeners();
}

// --- カードのイベントリスナー設定 ---
function setupCardEventListeners() {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        if (index !== 0) return; // 一番上のカードのみ操作可能

        let startX, startY, isDragging = false;

        const onPointerDown = (e) => {
            if (currentCardIndex >= quizData.length) return;
            isDragging = true;
            startX = e.clientX || e.touches[0].clientX;
            card.classList.add('dragging');
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            const currentX = e.clientX || e.touches[0].clientX;
            const diffX = currentX - startX;
            const rotation = diffX / 20;

            card.style.transform = `translateX(${diffX}px) rotate(${rotation}deg)`;
            
            // フィードバック表示
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
            const diffX = (e.clientX || e.changedTouches[0].clientX) - startX;

            if (Math.abs(diffX) > 100) { // スワイプ成功の閾値
                const direction = diffX > 0 ? 'correct' : 'incorrect';
                handleUserInput(direction === 'correct');
            } else { // 元の位置に戻る
                card.style.transform = 'translateX(0) rotate(0)';
            }
            feedbackCorrect.style.opacity = '0';
            feedbackIncorrect.style.opacity = '0';
        };

        card.addEventListener('mousedown', onPointerDown);
        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('mouseup', onPointerUp);

        card.addEventListener('touchstart', onPointerDown, { passive: true });
        document.addEventListener('touchmove', onPointerMove, { passive: true });
        document.addEventListener('touchend', onPointerUp);
    });
}

// --- ユーザーの入力を処理 ---
function handleUserInput(userChoice) { // userChoice: true for "Correct", false for "Incorrect"
    if (currentCardIndex >= quizData.length) return;

    const currentQuiz = quizData[currentCardIndex];
    const isCorrect = (userChoice === currentQuiz.isCorrectPair);
    if (isCorrect) score++;

    userAnswers.push({
        ...currentQuiz,
        userChoice: userChoice,
        wasCorrect: isCorrect
    });
    
    // カードを画面外に飛ばすアニメーション
    const topCard = document.querySelector(`.card:nth-last-child(${quizData.length - currentCardIndex})`);
    if (topCard) {
        const direction = userChoice ? 1 : -1;
        topCard.style.transform = `translateX(${direction * 500}px) rotate(${direction * 30}deg)`;
        topCard.style.opacity = '0';
    }

    currentCardIndex++;

    // ▼▼▼ 修正: 次の問題に進んだ履歴を追加 ▼▼▼
    history.pushState({index: currentCardIndex}, '');
    // ▲▲▲ 修正ここまで ▲▲▲
    
    updateStatus();

    if (currentCardIndex < quizData.length) {
        setupCardEventListeners(); // 次のカードにリスナーを設定
    } else {
        setTimeout(showResult, 300); // 結果表示
    }
}

// --- ステータス表示を更新 ---
function updateStatus() {
    if (currentCardIndex < quizData.length) {
        cardCounter.textContent = `${currentCardIndex + 1} / ${quizData.length}（回答数/問題数）`;
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

        const userChoiceSymbol = answer.userChoice 
            ? '<span style="color: red; font-weight: bold;">〇</span>' 
            : '<span style="color: blue; font-weight: bold;">✖</span>';

        const actualAnswerText = answer.isCorrectPair 
            ? '<span style="color: red; font-weight: bold;">〇</span> 正しいペア' 
            : '<span style="color: blue; font-weight: bold;">✖</span> 間違いペア';

        // 表示するHTMLに画像を追加
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
    // 最初の問題より前には戻れない
    if (currentCardIndex === 0) return;

    // もし結果表示画面なら、問題表示に戻す
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
        cardToRestore.style.transform = '';
        cardToRestore.style.opacity = '';
    }

    setupCardEventListeners();
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
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

// --- 初期化実行 ---
document.addEventListener('DOMContentLoaded', init);

// ▼▼▼ 修正: ブラウザの戻るボタンが押された時の処理を全面的に見直し ▼▼▼
window.addEventListener('popstate', (event) => {
    // 履歴に状態オブジェクトがない、またはインデックスがない場合は何もしない
    if (!event.state || event.state.index === undefined) {
        return;
    }

    const targetIndex = event.state.index;

    // 戻るボタンが押され、現在の問題番号より履歴の番号が小さい場合
    // (例: 3問目(index=2)から2問目(index=1)に戻る時)
    if (targetIndex < currentCardIndex) {
        undoLastAnswer();
    }
});
// ▲▲▲ 修正ここまで ▲▲▲
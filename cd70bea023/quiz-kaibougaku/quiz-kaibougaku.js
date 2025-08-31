// HTML要素の取得
const progressText = document.getElementById('progress-text');
const scoreText = document.getElementById('score-text');
const questionText = document.getElementById('question-text');
const choiceButtons = document.querySelectorAll('.choice-btn');
const feedbackText = document.getElementById('feedback-text');
const nextBtn = document.getElementById('next-btn');
const quizBody = document.getElementById('quiz-body');

let quizzes = []; // クイズデータを格納する配列
let currentQuizIndex = 0;
let score = 0;

// テキストファイルからクイズデータを読み込む
async function loadQuizzes() {
    try {
        const response = await fetch('quiz_data_kaibougaku.txt');
        if (!response.ok) {
            throw new Error('クイズデータの読み込みに失敗しました。');
        }
        const textData = await response.text();
        
        // テキストを行ごとに分割し、空行を除外
        const lines = textData.split('\n').filter(line => line.trim() !== '');
        
        // 6行で1セットのクイズデータとして解析
        for (let i = 0; i < lines.length; i += 6) {
            const quizData = {
                question: lines[i],
                choices: [lines[i + 1], lines[i + 2], lines[i + 3], lines[i + 4]],
                answer: lines[i + 5]
            };
            quizzes.push(quizData);
        }
        
        // 最初のクイズを表示
        showQuiz();

    } catch (error) {
        questionText.textContent = error.message;
    }
}

// クイズを表示する関数
function showQuiz() {
    // フィードバックと次の問題ボタンをリセット
    feedbackText.textContent = '';
    nextBtn.style.display = 'none';

    // 選択肢ボタンを有効化し、スタイルをリセット
    choiceButtons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('correct', 'incorrect');
    });

    const currentQuiz = quizzes[currentQuizIndex];
    questionText.textContent = currentQuiz.question;
    
    // 選択肢を表示
    choiceButtons.forEach((btn, index) => {
        btn.textContent = currentQuiz.choices[index];
    });

    // 進捗を更新
    progressText.textContent = `問題 ${currentQuizIndex + 1} / ${quizzes.length}`;
}

// 回答を選択したときの処理
function selectChoice(event) {
    const selectedBtn = event.target;
    const selectedChoice = selectedBtn.textContent;
    const currentQuiz = quizzes[currentQuizIndex];

    // 全てのボタンを無効化
    choiceButtons.forEach(btn => {
        btn.disabled = true;
    });

    // 正誤判定
    if (selectedChoice === currentQuiz.answer) {
        selectedBtn.classList.add('correct');
        feedbackText.textContent = '正解！';
        feedbackText.style.color = 'green';
        score++;
    } else {
        selectedBtn.classList.add('incorrect');
        feedbackText.textContent = `不正解... 正解は「${currentQuiz.answer}」`;
        feedbackText.style.color = 'red';
        // 正解の選択肢もハイライト
        choiceButtons.forEach(btn => {
            if (btn.textContent === currentQuiz.answer) {
                btn.classList.add('correct');
            }
        });
    }

    // スコアを更新
    scoreText.textContent = `正解数: ${score} / ${currentQuizIndex + 1}`;

    // 次の問題があるか確認
    if (currentQuizIndex < quizzes.length - 1) {
        nextBtn.style.display = 'block'; // 次の問題へボタンを表示
    } else {
        // クイズ終了
        setTimeout(showResults, 1500); // 1.5秒後に結果表示
    }
}

// 次の問題へ進む処理
function goToNextQuiz() {
    currentQuizIndex++;
    showQuiz();
}

// 最終結果を表示する関数
function showResults() {
    const percentage = quizzes.length > 0 ? (score / quizzes.length) * 100 : 0;
    quizBody.innerHTML = `
        <div class="quiz-end-container">
            <h2>クイズ終了！</h2>
            <p>あなたの最終スコア</p>
            <p style="font-size: 2.5em; font-weight: bold; margin: 20px 0;">${score} / ${quizzes.length}</p>
            <p style="font-size: 1.5em;">正解率: ${percentage.toFixed(1)}%</p>
            <button onclick="location.reload()" style="padding: 15px; font-size: 1.2em; margin-top: 20px; cursor: pointer;">もう一度挑戦する</button>
        </div>
    `;
}

// イベントリスナーを設定
choiceButtons.forEach(btn => {
    btn.addEventListener('click', selectChoice);
});
nextBtn.addEventListener('click', goToNextQuiz);

// 最初にクイズデータを読み込む
loadQuizzes();
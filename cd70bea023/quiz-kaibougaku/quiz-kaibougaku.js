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
        
        const lines = textData.split('\n').filter(line => line.trim() !== '');
        
        // ★★ここから変更★★ 5行1セットで、マークを元に解析
        for (let i = 0; i < lines.length; i += 5) {
            const quizBlock = lines.slice(i, i + 5);
            if (quizBlock.length < 5) continue; // 5行未満のブロックはスキップ

            let question = '';
            const choicesRaw = [];

            // 5行のブロックから問題文(?)と選択肢を振り分ける
            quizBlock.forEach(line => {
                if (line.startsWith('?')) {
                    question = line.substring(1).trim();
                } else {
                    choicesRaw.push(line.trim());
                }
            });

            let correctAnswer = '';
            const finalChoices = [];

            // 4つの選択肢の中から正解(*)を探す
            choicesRaw.forEach(choice => {
                if (choice.startsWith('*')) {
                    const cleanChoice = choice.substring(1).trim();
                    correctAnswer = cleanChoice;
                    finalChoices.push(cleanChoice);
                } else {
                    finalChoices.push(choice);
                }
            });

            // データが不正な場合はスキップ
            if (question === '' || correctAnswer === '' || finalChoices.length !== 4) {
                console.warn(`問題ブロック( ${i + 1}行目〜 )の形式が不正です。スキップします。`);
                continue;
            }

            quizzes.push({
                question: question,
                choices: finalChoices,
                answer: correctAnswer
            });
        }
        // ★★ここまで変更★★
        
        showQuiz();

    } catch (error) {
        questionText.textContent = error.message;
    }
}

// クイズを表示する関数
function showQuiz() {
    feedbackText.textContent = '';
    nextBtn.style.display = 'none';

    choiceButtons.forEach(btn => {
        btn.disabled = false;
        btn.classList.remove('correct', 'incorrect');
    });

    const currentQuiz = quizzes[currentQuizIndex];
    questionText.textContent = currentQuiz.question;
    
    choiceButtons.forEach((btn, index) => {
        btn.textContent = currentQuiz.choices[index];
    });

    progressText.textContent = `問題 ${currentQuizIndex + 1} / ${quizzes.length}`;
}

// 回答を選択したときの処理
function selectChoice(event) {
    const selectedBtn = event.target;
    const selectedChoice = selectedBtn.textContent;
    const currentQuiz = quizzes[currentQuizIndex];

    choiceButtons.forEach(btn => {
        btn.disabled = true;
    });

    if (selectedChoice === currentQuiz.answer) {
        selectedBtn.classList.add('correct');
        feedbackText.textContent = '正解！';
        feedbackText.style.color = 'green';
        score++;
    } else {
        selectedBtn.classList.add('incorrect');
        feedbackText.textContent = `不正解... 正解は「${currentQuiz.answer}」`;
        feedbackText.style.color = 'red';
        choiceButtons.forEach(btn => {
            if (btn.textContent === currentQuiz.answer) {
                btn.classList.add('correct');
            }
        });
    }

    scoreText.textContent = `正解数: ${score} / ${currentQuizIndex + 1}`;

    if (currentQuizIndex < quizzes.length - 1) {
        nextBtn.style.display = 'block';
    } else {
        setTimeout(showResults, 1500);
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
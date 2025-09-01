// HTML要素の取得
const scoreText = document.getElementById('score-text');
const quizBody = document.getElementById('quiz-body');
const finishBtn = document.getElementById('finish-btn');
const fontIncreaseBtn = document.getElementById('font-increase-btn');
const fontDecreaseBtn = document.getElementById('font-decrease-btn');

let quizzes = [];
let userAnswers = {};
let currentFontScale = 1.0;

// Fisher-Yatesアルゴリズムを使って配列をシャッフルする関数
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // 要素を入れ替え
    }
}

// テキストファイルからクイズデータを読み込んで表示する
async function setupQuiz() {
    try {
        const response = await fetch('quiz_data_kaibougaku.txt');
        if (!response.ok) throw new Error('クイズデータの読み込みに失敗しました。');
        
        const textData = await response.text();
        const lines = textData.split('\n').filter(line => line.trim() !== '');

        for (let i = 0; i < lines.length; i += 5) {
            const quizBlock = lines.slice(i, i + 5);
            if (quizBlock.length < 5) continue;
            let question = '';
            const choicesRaw = [];
            quizBlock.forEach(line => {
                if (line.startsWith('?')) {
                    let tempQuestion = line.trim();
                    const match = tempQuestion.match(/^\?\d+\.\s*(.*)/);
                    if (match && match[1]) {
                        question = match[1].trim();
                    } else {
                        question = tempQuestion.substring(1).trim();
                    }
                } else {
                    choicesRaw.push(line.trim());
                }
            });
            let correctAnswer = '';
            const finalChoices = [];
            choicesRaw.forEach(choice => {
                if (choice.startsWith('*')) {
                    const cleanChoice = choice.substring(1).trim();
                    correctAnswer = cleanChoice;
                    finalChoices.push(cleanChoice);
                } else {
                    finalChoices.push(choice);
                }
            });

            // 選択肢の配列をシャッフル
            shuffleArray(finalChoices);

            if (question === '' || correctAnswer === '' || finalChoices.length !== 4) {
                console.warn(`問題ブロック( ${i + 1}行目〜 )の形式が不正です。スキップします。`);
                continue;
            }
            quizzes.push({
                question: question,
                choices: finalChoices, // シャッフルされた選択肢
                answer: correctAnswer
            });
        }
        
        renderAllQuizzes();
        updateScore();

    } catch (error) {
        quizBody.innerHTML = `<p style="color: red; font-weight: bold;">${error.message}</p>`;
    }
}

// 全てのクイズをHTMLとして描画する関数
function renderAllQuizzes() {
    let quizHTML = '';
    quizzes.forEach((quiz, index) => {
        quizHTML += `
            <div class="quiz-item" id="quiz-${index}">
                <p class="question-text"><strong>問題 ${index + 1}:</strong> ${quiz.question}</p>
                <div class="choices-container">
                    <button class="choice-btn" onclick="selectChoice(${index}, 0)">${quiz.choices[0]}</button>
                    <button class="choice-btn" onclick="selectChoice(${index}, 1)">${quiz.choices[1]}</button>
                    <button class="choice-btn" onclick="selectChoice(${index}, 2)">${quiz.choices[2]}</button>
                    <button class="choice-btn" onclick="selectChoice(${index}, 3)">${quiz.choices[3]}</button>
                </div>
                <p class="feedback-text"></p>
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
    const selectedBtn = choiceButtons[choiceIndex];
    
    choiceButtons.forEach(btn => btn.classList.remove('selected'));
    selectedBtn.classList.add('selected');

    const selectedChoice = selectedBtn.textContent;
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
function finishQuiz() {
    let score = 0;
    
    quizzes.forEach((quiz, index) => {
        const quizItem = document.getElementById(`quiz-${index}`);
        const choiceButtons = quizItem.querySelectorAll('.choice-btn');
        const selectedBtn = quizItem.querySelector('.choice-btn.selected');
        
        choiceButtons.forEach(btn => btn.disabled = true);
        
        // ★★ここから変更★★
        if (selectedBtn) {
            // 回答済の問題の処理
            const selectedChoice = selectedBtn.textContent;
            if (selectedChoice === quiz.answer) {
                score++;
                selectedBtn.classList.add('correct');
            } else {
                selectedBtn.classList.add('incorrect');
                // 間違っていた場合は、正解の選択肢もハイライトする
                choiceButtons.forEach(btn => {
                    if (btn.textContent === quiz.answer) {
                        btn.classList.add('correct');
                    }
                });
            }
        } else {
            // 未回答の問題の処理
            // 正解の選択肢をハイライトするだけ
            choiceButtons.forEach(btn => {
                if (btn.textContent === quiz.answer) {
                    btn.classList.add('correct');
                }
            });
        }
        // ★★ここまで変更★★
    });

    const percentage = quizzes.length > 0 ? (score / quizzes.length) * 100 : 0;
    scoreText.innerHTML = `
        最終結果: ${score} / ${quizzes.length} 正解<br>
        正解率: ${percentage.toFixed(1)}%
    `;
    
    finishBtn.textContent = 'もう一度挑戦する';
    finishBtn.onclick = () => location.reload();
    
    window.scrollTo(0, 0);
}

// イベントリスナーを設定
finishBtn.addEventListener('click', finishQuiz);

fontIncreaseBtn.addEventListener('click', () => {
    currentFontScale += 0.1;
    quizBody.style.fontSize = `${currentFontScale}em`;
});

fontDecreaseBtn.addEventListener('click', () => {
    if (currentFontScale > 0.7) {
        currentFontScale -= 0.1;
        quizBody.style.fontSize = `${currentFontScale}em`;
    }
});

// 最初にクイズをセットアップ
setupQuiz();
// HTML要素の取得
const scoreText = document.getElementById('score-text');
const quizBody = document.getElementById('quiz-body');
const finishBtn = document.getElementById('finish-btn');

let quizzes = []; // クイズデータを格納する配列

// テキストファイルからクイズデータを読み込んで表示する
async function setupQuiz() {
    try {
        const response = await fetch('quiz_data_kaibougaku.txt');
        if (!response.ok) throw new Error('クイズデータの読み込みに失敗しました。');
        
        const textData = await response.text();
        const lines = textData.split('\n').filter(line => line.trim() !== '');

        // クイズデータを解析
        for (let i = 0; i < lines.length; i += 6) {
            quizzes.push({
                question: lines[i],
                choices: [lines[i + 1], lines[i + 2], lines[i + 3], lines[i + 4]],
                answer: lines[i + 5]
            });
        }
        
        // クイズのHTMLを生成して表示
        renderAllQuizzes();

    } catch (error) {
        quizBody.innerHTML = `<p>${error.message}</p>`;
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
    
    // 他の選択肢の選択状態を解除
    choiceButtons.forEach(btn => btn.classList.remove('selected'));
    // クリックしたボタンを選択状態にする
    selectedBtn.classList.add('selected');

    const selectedChoice = selectedBtn.textContent;
    const currentQuiz = quizzes[quizIndex];

    // 正誤判定
    if (selectedChoice === currentQuiz.answer) {
        feedbackText.textContent = '正解！';
        feedbackText.style.color = 'green';
    } else {
        feedbackText.textContent = `不正解... 正解は「${currentQuiz.answer}」`;
        feedbackText.style.color = 'red';
    }
}

// 「クイズ終了」ボタンを押したときの処理
function finishQuiz() {
    let score = 0;
    
    quizzes.forEach((quiz, index) => {
        const quizItem = document.getElementById(`quiz-${index}`);
        const choiceButtons = quizItem.querySelectorAll('.choice-btn');
        const selectedBtn = quizItem.querySelector('.choice-btn.selected');
        
        // 全てのボタンを無効化
        choiceButtons.forEach(btn => btn.disabled = true);
        
        if (selectedBtn) {
            const selectedChoice = selectedBtn.textContent;
            if (selectedChoice === quiz.answer) {
                score++;
                selectedBtn.classList.add('correct');
            } else {
                selectedBtn.classList.add('incorrect');
                // 正解の選択肢もハイライト
                choiceButtons.forEach(btn => {
                    if (btn.textContent === quiz.answer) {
                        btn.classList.add('correct');
                    }
                });
            }
        }
    });

    // 最終スコアを表示
    const percentage = quizzes.length > 0 ? (score / quizzes.length) * 100 : 0;
    scoreText.innerHTML = `
        正解数: ${score} / ${quizzes.length} <br>
        正解率: ${percentage.toFixed(1)}%
    `;
    
    // 「もう一度」ボタンに変更
    finishBtn.textContent = 'もう一度挑戦する';
    finishBtn.onclick = () => location.reload();
    
    // ページトップにスクロール
    window.scrollTo(0, 0);
}

// イベントリスナーを設定
finishBtn.addEventListener('click', finishQuiz);

// 最初にクイズをセットアップ
setupQuiz();
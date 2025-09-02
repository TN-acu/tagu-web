// HTML要素の取得
const scoreText = document.getElementById('score-text');
const quizBody = document.getElementById('quiz-body');
const finishBtn = document.getElementById('finish-btn');
const fontIncreaseBtn = document.getElementById('font-increase-btn');
const fontDecreaseBtn = document.getElementById('font-decrease-btn');
const pdfBtn = document.getElementById('pdf-btn');

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
        [array[i], array[j]] = [array[j], array[i]]; // 要素を入れ替え
    }
}

// テキストファイルからクイズデータを読み込んで表示する
async function setupQuiz() {
    try {
        if (isMobileDevice()) {
            pdfBtn.style.display = 'none';
        }

        // ★★★ 読み込むファイル名を修正 ★★★
        const response = await fetch('quiz_data_seirigaku2025zenki_kimatu.txt');
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

            shuffleArray(finalChoices);

            if (question === '' || correctAnswer === '' || finalChoices.length < 2) { 
                console.warn(`問題ブロック( ${i + 1}行目〜 )の形式が不正です。スキップします。`);
                continue;
            }
            quizzes.push({
                question: question,
                choices: finalChoices,
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
        let choicesHTML = '';
        quiz.choices.forEach((choice, choiceIndex) => {
            if (choice !== '-') { 
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
    
    const visibleChoiceButtons = Array.from(choiceButtons).filter(btn => btn.textContent !== '-');
    
    visibleChoiceButtons.forEach(btn => btn.classList.remove('selected'));
    
    let clickedButton;
    // メモ: filter(c => c !== '-') を使って、表示されている選択肢のインデックスを正しく合わせる
    const selectedChoiceText = quizzes[quizIndex].choices.filter(c => c !== '-')[choiceIndex];
    
    for(let btn of choiceButtons){
        if(btn.textContent === selectedChoiceText){
            clickedButton = btn;
            break;
        }
    }

    if(clickedButton) {
        clickedButton.classList.add('selected');
    }

    const selectedChoice = clickedButton.textContent;
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
        const feedbackText = quizItem.querySelector('.feedback-text');
        
        choiceButtons.forEach(btn => btn.disabled = true);
        
        const userAnswer = userAnswers[index];

        if (userAnswer) { 
            if (userAnswer === quiz.answer) {
                score++;
                choiceButtons.forEach(btn => {
                    if (btn.textContent === userAnswer) btn.classList.add('correct');
                });
            } else {
                choiceButtons.forEach(btn => {
                    if (btn.textContent === userAnswer) btn.classList.add('incorrect');
                    if (btn.textContent === quiz.answer) btn.classList.add('correct');
                });
            }
        } else { 
            choiceButtons.forEach(btn => {
                if (btn.textContent === quiz.answer) {
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
    
    window.scrollTo(0, 0);
}

function handlePdfPrint() {
    finishQuiz();

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
            margin: 1cm;
            @bottom-left {
                content: "last update ${timestamp}";
                font-family: 'Hiragino KyoKaSho', 'ヒラギノ教科書体', 'IPAex教科書体', serif;
                font-size: 8pt;
                color: #666;
            }
            @bottom-right {
                content: counter(page) " / " counter(pages);
                font-family: 'Hiragino KyoKaSho', 'ヒラギノ教科書体', 'IPAex教科書体', serif;
                font-size: 8pt;
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
    finishQuiz();
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
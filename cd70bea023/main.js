const iframe = document.getElementById('contentFrame');
const bodyElement = document.body;
const toastElement = document.getElementById('toast-notification');
const searchHistoryContainer = document.getElementById('search-history-container');
const searchInput = document.getElementById('search-input');
const SEARCH_HISTORY_KEY = 'quizAppSearchHistory';

// ▼▼▼ 追加: 検索UI関連のDOMを取得 ▼▼▼
const searchContainer = document.querySelector('.search-container');
const searchResultsCount = document.getElementById('search-results-count');
const searchClearBtn = document.getElementById('search-clear-btn');
// ▲▲▲ 追加ここまで ▲▲▲

// ▼▼▼ すべてのカスタムUI状態を一元管理する内部スタック ▼▼▼
let customHistoryStack = []; 

// ▼▼▼ isMobile()関数（スクリプトの先頭に移動済み） ▼▼▼
function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ▼▼▼ モバイル端末向け 閲覧抑止機能 ▼▼▼
if (isMobile()) {
    // 1. CSSフックの追加 (CSS側で選択と長押しメニューを禁止する)
    document.body.classList.add('mobile-no-select');

    // 2. JSでのコンテキストメニューの明示的な無効化（検索欄例外あり）
    window.addEventListener('contextmenu', function (e) {
         // 修正: ターゲット自身または親(closest)が検索入力かチェック
        if (e.target.closest('#search-input') === null) { 
             e.preventDefault();
        }
    }, false);

    // 3. 外部キーボードによる開発者ツールショートカットの抑止
    window.addEventListener('keydown', function (e) {
        if (
            e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
            (e.ctrlKey && e.key === 'U') ||
            (e.metaKey && e.altKey && e.key === 'I') // Mac: Cmd+Option+I (Safari/Chrome共通)
        ) {
            e.preventDefault();
        }
    });
    
    // ▼▼▼ 追加: アンチデバッグ（DevTools開いたらフリーズ） ▼▼▼
    (function() {
        function blockDevTools() {
            debugger; 
        }
        setInterval(blockDevTools, 500);
    })();
    // ▲▲▲ アンチデバッグ追加ここまで ▲▲▲
}
// ▲▲▲ 抑止機能ここまで ▲▲▲

const setAppHeight = () => {
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
};
window.addEventListener('resize', setAppHeight);
window.addEventListener('orientationchange', setAppHeight);
setAppHeight();

const displayLastUpdated = () => {
    const lastModified = new Date(document.lastModified);
    const year = lastModified.getFullYear();
    const month = String(lastModified.getMonth() + 1).padStart(2, '0');
    const day = String(lastModified.getDate()).padStart(2, '0');
    const hours = String(lastModified.getHours()).padStart(2, '0');
    const minutes = String(lastModified.getMinutes()).padStart(2, '0');
    const seconds = String(lastModified.getSeconds()).padStart(2, '0');
    const formattedDate = `${year}${month}${day} ${hours}:${minutes}:${seconds}`;
    const updateElement = document.getElementById('last-updated');
    if (updateElement) {
        updateElement.innerHTML = `last update ${formattedDate}`;
    }
};

// ▼▼▼ 追加: -quiz_list.txt からクイズ一覧を読み込む関数 ▼▼▼
const loadQuizList = async () => {
    const appList = document.getElementById('app-list');
    const closeMenuLi = document.querySelector('.close-menu-li');
    if (!appList || !closeMenuLi) return;

    try {
        // ▼▼▼ 変更: fetchするURLにキャッシュ対策のタイムスタンプを追加 ▼▼▼
        const response = await fetch(`-quiz_list.txt?v=${new Date().getTime()}`);
        // ▲▲▲ 変更ここまで ▲▲▲

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        
        // テキストを行ごとに分割し、空行を除外
        const lines = text.split('\n').filter(line => line.trim() !== '');

        lines.forEach(line => {
            // タブで URL と テキスト を分割
            const parts = line.split('\t');
            if (parts.length < 2) return; // 形式が正しくない行はスキップ

            const url = parts[0].trim();
            const title = parts[1].trim();

            // <li> と <a> 要素を作成
            const li = document.createElement('li');
            const a = document.createElement('a');
            
            a.href = url;
            a.target = 'contentFrame';
            a.textContent = title;
            
            // <a> を <li> に追加
            li.appendChild(a);
            
            // <li> を「閉じるボタン」の手前に挿入
            appList.insertBefore(li, closeMenuLi);
        });

    } catch (e) {
        console.error("クイズリストの読み込みに失敗しました:", e);
        // 失敗した場合のフォールバック表示
        const li = document.createElement('li');
        li.textContent = "クイズリストの読み込みエラー";
        li.style.color = "red";
        appList.insertBefore(li, closeMenuLi);
    }
};
// ▲▲▲ 追加ここまで ▲▲▲


const clearAllHistory = () => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    loadSearchHistory();
    searchHistoryContainer.style.display = 'none';
};

const deleteSearchTerm = (termToDelete) => {
    let history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    history = history.filter(item => item !== termToDelete);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    loadSearchHistory();
};

const loadSearchHistory = () => {
    const history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];
    searchHistoryContainer.innerHTML = '';
    if (history.length > 0) {
        const clearAllBtn = document.createElement('div');
        clearAllBtn.className = 'history-clear-all-btn';
        clearAllBtn.textContent = '【履歴をすべて消去する】';
        clearAllBtn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            clearAllHistory();
        });
        searchHistoryContainer.appendChild(clearAllBtn);

        history.forEach(term => {
            const item = document.createElement('div');
            item.className = 'history-item';
            const textSpan = document.createElement('span');
            textSpan.textContent = term;
            textSpan.style.flexGrow = '1';
            const deleteBtn = document.createElement('span');
            deleteBtn.className = 'history-delete-btn';
            deleteBtn.textContent = '×';
            
            deleteBtn.addEventListener('mousedown', (e) => {
                e.preventDefault(); 
                e.stopPropagation();
                deleteSearchTerm(term);
            });
            
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();

                try {
                    const iframeWin = iframe.contentWindow;
                    if (iframeWin && typeof iframeWin.handleSearch === 'function') {
                        iframeWin.handleSearch('', 'next'); 
                    } else if (iframeWin && typeof iframeWin.clearHighlights === 'function') {
                        iframeWin.clearHighlights();
                    }
                } catch(err) {}
                
                searchInput.value = term;
                // ▼▼▼ 変更（追加）: 履歴選択時にinputイベントを強制発火させ、クリアボタンを表示 ▼▼▼
                searchInput.dispatchEvent(new Event('input'));
                // ▲▲▲ 変更ここまで ▲▲▲

                performSearch('next');
                searchHistoryContainer.style.display = 'none';
            });

            item.appendChild(textSpan);
            item.appendChild(deleteBtn);
            searchHistoryContainer.appendChild(item);
        });
    }
};

const saveSearchTerm = (term) => {
    if (!term || term.trim() === '') return;
    let history = JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY)) || [];

    if (history.includes(term)) {
        return; 
    }

    history.push(term); 
    
    while (history.length > 10) {
        history.shift(); 
    }
    
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    loadSearchHistory(); 
};

let toastTimer;
const showToast = (message) => {
    clearTimeout(toastTimer);
    toastElement.textContent = message;
    toastElement.classList.add('show');
    
    // ▼▼▼ 変更: タイムアウトを 1000ms から 2000ms (2秒) に変更 ▼▼▼
    toastTimer = setTimeout(() => {
        toastElement.classList.remove('show');
    }, 2000); 
    // ▲▲▲ 変更ここまで ▲▲▲
};

// ▼▼▼ 変更: 検索結果更新のメッセージリスナーを追加 ▼▼▼
window.addEventListener('message', (event) => {
    // event.origin のチェックは file:// 環境などを考慮し、メッセージ内容のみで判定
    if (event.data === 'quizPositionRestored') {
        showToast("★ 新機能：前回の問題文から再開しました ★");
    }
    else if (event.data && event.data.type === 'iframeTitleUpdated') {
        const newTitle = event.data.title || '';
        const cleanTitle = newTitle.replace(/^クイズ：/, '').trim();
        const newPlaceholder = `検索..${cleanTitle}から`;
        searchInput.placeholder = newPlaceholder;
    }
    // ▼▼▼ 変更: 検索結果なしの表示とブリンクアニメーションを追加 ▼▼▼
    else if (event.data && event.data.type === 'searchResultUpdate') {
        const { currentIndex, totalHits, term } = event.data;

        if (term) {
            // 検索が実行された場合（結果の有無を問わず）
            if (totalHits > 0) {
                searchResultsCount.textContent = `${currentIndex + 1} / ${totalHits}`;
            } else {
                searchResultsCount.textContent = '０／０';
            }
            searchResultsCount.style.display = 'block';

            // ブリンクアニメーションを実行
            searchResultsCount.classList.remove('blink');
            void searchResultsCount.offsetWidth; // アニメーションを再実行するためのリフロー強制
            searchResultsCount.classList.add('blink');

        } else {
            // 検索がクリアされた場合
            searchResultsCount.textContent = '';
            searchResultsCount.style.display = 'none';
        }
    }
    // ▲▲▲ 変更ここまで ▲▲▲
});
// ▲▲▲ 変更ここまで ▲▲▲

function handleQuizChoiceMade(quizIndexStr) {
    const quizIndex = parseInt(quizIndexStr, 10);
    if (isNaN(quizIndex)) return;

    const newState = {type: 'quiz', index: quizIndex};
    const lastHistory = customHistoryStack.length > 0 ? customHistoryStack[customHistoryStack.length - 1] : null;

    if (!lastHistory || !(lastHistory.type === 'quiz' && lastHistory.index === quizIndex)) {
         history.pushState({uiState: 'quiz', quizIndex: quizIndex}, '');
         customHistoryStack.push(newState);
    }
}

function handleQuizFinished() {
    customHistoryStack = [];
}

function clearIframeChoice(quizIndex) {
    try {
        const iframeWin = iframe.contentWindow;
        const iframeDoc = iframe.contentDocument;
        if (!iframeWin || !iframeDoc) return;

        const quizItem = iframeDoc.getElementById(`quiz-${quizIndex}`);
        if (!quizItem) return;

        const choiceButtons = quizItem.querySelectorAll('.choice-btn');
        choiceButtons.forEach(btn => {
            btn.classList.remove('selected');
        });

        const feedbackText = quizItem.querySelector('.feedback-text');
        if (feedbackText) {
            feedbackText.textContent = '';
        }
        
        quizItem.scrollIntoView({ behavior: 'smooth', block: 'center' });

    } catch (e) {
        console.error("Error clearing iframe choice:", e.message);
    }
}

// ▼▼▼ 変更: フォントサイズ指定を !important から変更し、feedback-text のサイズも定義 ▼▼▼
function injectCustomStylesToIframe(iframeDoc) {
    const styleId = 'injected-custom-font-style';
    const existingStyle = iframeDoc.getElementById(styleId);
    if (existingStyle) {
        existingStyle.remove();
    }
    const styleElement = iframeDoc.createElement('style');
    styleElement.id = styleId;
    
    styleElement.textContent = `
        /* * このスタイルは quiz_common.js の changeFontSize() (フォント拡大/縮小) の
         * 基準サイズ (1.0em) として機能します。
         */
        
        /* デスクトップ: 質問と選択肢のベースサイズ */
        .question-text, .choice-btn { 
            font-size: 1.8em; 
        }
        /* デスクトップ: フィードバック (選択肢より 0.4em 小さく) */
        .feedback-text {
            /* ▼▼▼ 修正: 1.4em から 1.7em に変更 ▼▼▼ */
            font-size: 1.7em; 
            /* ▲▲▲ 修正ここまで ▲▲▲ */
        }

        @media (max-width: 768px) {
            /* モバイル: 質問のベースサイズ */
            .question-text { 
                font-size: 1.3em; 
            }
            /* モバイル: 選択肢のベースサイズ */
            .choice-btn {
                font-size: 1.2em; 
            }
            /* モバイル: フィードバック (選択肢より 0.3em 小さく) */
            .feedback-text {
                /* ▼▼▼ 修正: 0.9em から 1.2em に変更 ▼▼▼ */
                font-size: 1.3em; 
                /* ▲▲▲ 修正ここまで ▲▲▲ */
            }
        }
    `;
    
    iframeDoc.head.appendChild(styleElement);
}
// ▲▲▲ 変更ここまで ▲▲▲

const menuToggleOpenBtn = document.getElementById('menu-toggle-open');
const menuToggleCloseBtn = document.getElementById('menu-toggle-close');
const navColumn = document.getElementById('nav-column');
const appList = document.getElementById('app-list');
const pcMenuTitle = document.getElementById('pc-menu-title');

const setupMobileMenuLayout = () => {
    if (window.innerWidth <= 768) {
        pcMenuTitle.style.display = 'none';
        menuToggleOpenBtn.style.display = 'flex';
        menuToggleCloseBtn.style.display = 'none';
        navColumn.classList.remove('menu-open'); 
        appList.style.height = '0';
        appList.style.paddingTop = '0';
        appList.style.paddingBottom = '0';
    } else {
        pcMenuTitle.style.display = 'block';
        menuToggleOpenBtn.style.display = 'none';
        menuToggleCloseBtn.style.display = 'none';
        navColumn.classList.remove('menu-open');
        appList.style.height = 'auto'; 
    }
};

// ▼▼▼ 変更: toggleMenu関数をアコーディオン削除に伴いシンプル化 ▼▼▼
const toggleMenu = () => {
    if (window.innerWidth > 768) return;
    const isOpening = !navColumn.classList.contains('menu-open');
    navColumn.classList.toggle('menu-open');
    if (isOpening) {
        history.pushState({uiState: 'menu'}, ''); 
        customHistoryStack.push('menu');          
        
        menuToggleOpenBtn.style.display = 'none';
        menuToggleCloseBtn.style.display = 'flex';
        
        // シンプルなフラットリストに戻ったため、JSの高さ計算が正しく機能する
        const scrollHeight = appList.scrollHeight;
        appList.style.height = '0';
        setTimeout(() => { 
            appList.style.height = `${scrollHeight}px`; 
            appList.style.paddingTop = '10px'; 
            // padding-bottomはCSS側で制御
        }, 10);
    } else {
        if (history.state && history.state.uiState === 'menu') { 
            history.back(); 
        }
        menuToggleOpenBtn.style.display = 'flex';
        menuToggleCloseBtn.style.display = 'none';
        
        appList.style.height = `${appList.scrollHeight}px`; // 現在高さを取得
        setTimeout(() => { 
            appList.style.height = '0'; 
            appList.style.paddingTop = '0'; 
        }, 10);
        
        // サブメニューが存在しないため、リセットロジックは不要
    }
    setTimeout(setAppHeight, 300); 
};
// ▲▲▲ 変更ここまで ▲▲▲

menuToggleOpenBtn.addEventListener('click', toggleMenu);
menuToggleCloseBtn.addEventListener('click', toggleMenu);

// ▼▼▼ 変更: メニュークリック時に検索UIをリセットする処理を追加 ▼▼▼
appList.addEventListener('click', (e) => {
    // クリックされた要素が <a> タグ、または <a> タグの子要素か確認
    const link = e.target.closest('a');
    
    if (link && appList.contains(link)) {
        handleQuizFinished(); 
        
        // ▼▼▼ 追加: 新しいページに移動する際に検索UIをリセット ▼▼▼
        searchInput.value = ''; // 検索入力欄をクリア
        searchResultsCount.style.display = 'none'; // カウンターを非表示
        searchResultsCount.textContent = ''; // カウンターのテキストをクリア
        // ▲▲▲ 追加ここまで ▲▲▲

        if (navColumn.classList.contains('menu-open')) { 
            toggleMenu(); 
        }
    }
});
// ▲▲▲ 変更ここまで ▲▲▲


window.addEventListener('resize', setupMobileMenuLayout);
// setupMobileMenuLayout(); // <-- 実行タイミングをDOMReady後に移動

const darkModeButton = document.getElementById('dark-mode-toggle');

function injectBaseStyles(iframeDoc) {
    const styleId = 'injected-base-style';
    if (iframeDoc.getElementById(styleId)) return;

    const styleElement = iframeDoc.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
        .search-button-wrapper {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .search-btn {
            flex-shrink: 0;
            width: 38px;
            height: 38px;
            font-size: 1.2em;
            padding: 0;
            border-radius: 50%;
            border: 1px solid #ccc;
            background-color: #f0f0f0;
            color: #333;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .search-btn:hover {
            background-color: #e0e0e0;
        }
    `;
    iframeDoc.head.appendChild(styleElement);
}

const applyDarkModeToIframe = (enable) => {
    try {
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc) return; 
        const styleElementId = 'injected-dark-mode-style';
        let styleElement = iframeDoc.getElementById(styleElementId);
        if (enable) {
            if (!styleElement) {
                styleElement = iframeDoc.createElement('style');
                styleElement.id = styleElementId;
                iframeDoc.head.appendChild(styleElement);
            }
            // ▼▼▼ 修正: 採点後のスタイル(正解/不正解/フィードバックテキスト)を追加 ▼▼▼
            styleElement.textContent = `
                body { background-color: #212529 !important; color: #f8f9fa !important; }
                .quiz-container h1 { color: #f8f9fa !important; }
                .main-container h1, .main-container h2 { color: #000000 !important; }
                #quiz-header { background-color: #474a4d !important; }
                #score-text { color: #b8bbbf !important; }

                /* ▼▼▼ 修正: フィードバックテキストの色をインラインスタイル別に上書き ▼▼▼ */
                /* JSが color: green (正解) を指定した場合、明るい緑に */
                .feedback-text[style*="color: green"] {
                    color: #69f0ae !important;
                }
                /* JSが color: red (不正解) を指定した場合、明るい赤に */
                .feedback-text[style*="color: red"] {
                    color: #ff6e6e !important;
                }
                /* JSが color: blue (未回答・終了時) を指定した場合、白 (ユーザー要求) に */
                .feedback-text[style*="color: blue"] {
                    color: #f8f9fa !important; 
                }
                /* ▲▲▲ 修正ここまで ▲▲▲ */

                ::selection { background-color: #ffc107 !important; color: #000000 !important; }
                .quiz-container, .timer-container, div[style*="background"], section, main {
                    background-color: transparent !important; color: inherit !important;
                }
                button, input, select {
                    background-color: #343a40 !important; color: #f8f9fa !important; border-color: #495057 !important;
                }
                .search-btn { background-color: #343a40 !important; color: #f8f9fa !important; border-color: #495057 !important; }
                a { color: #66bfff !important; }
                .choice-btn.selected {
                    background-color: #5a6268 !important; 
                    border-color: #adb5bd !important;     
                    color: #ffffff !important;           
                }
                
                /* ▼▼▼ 修正: 採点後の正解/不正解ボタンを「目に優しい」コントラストに変更 ▼▼▼ */
                .choice-btn.correct {
                    background-color: #1f513f !important; /* 落ち着いた暗い緑 */
                    border-color: #286953 !important;     
                    color: #ffffff !important;           /* 白文字 (維持) */
                    font-weight: bold !important;
                }
                .choice-btn.incorrect {
                    background-color: #581e26 !important; /* 落ち着いた暗い赤 */
                    border-color: #722730 !important;     
                    color: #ffffff !important;           /* 白文字 (維持) */
                }
                /* ▲▲▲ 修正ここまで ▲▲▲ */
                    `;
            // ▲▲▲ 修正ここまで ▲▲▲
        } else {
            if (styleElement) { styleElement.remove(); }
        }
    } catch (e) {
        console.warn("Could not access iframe content for dark mode: ", e.message);
    }
};

darkModeButton.addEventListener('click', () => {
    bodyElement.classList.toggle('dark-mode');
    const isDarkModeEnabled = bodyElement.classList.contains('dark-mode');
    darkModeButton.textContent = isDarkModeEnabled ? '☀️' : '🌙';
    applyDarkModeToIframe(isDarkModeEnabled);
});

const searchPrevBtn = document.getElementById('search-prev');
const searchNextBtn = document.getElementById('search-next');

// ▼▼▼ 変更: 検索ボタンのイベントをclickに統一し、不具合を解消 ▼▼▼
searchNextBtn.addEventListener('click', () => performSearch('next'));
searchPrevBtn.addEventListener('click', () => performSearch('prev'));
// ▲▲▲ 変更ここまで ▲▲▲

const performSearch = (direction) => {
    const searchTerm = searchInput.value;
    saveSearchTerm(searchTerm);
    
    const stopQuestionNumber = stopQuestionSelect.value;
    
    try {
        const iframeWin = iframe.contentWindow;
        if (iframeWin && typeof iframeWin.handleSearch === 'function') {
            iframeWin.handleSearch(searchTerm, direction, stopQuestionNumber);
            
            setTimeout(() => {
                if (searchTerm && iframeWin.searchState && iframeWin.searchState.elements.length === 0) {
                    showToast('検索結果無し');
                }
            }, 0);

        } else if (searchTerm) {
            alert("現在のページではカスタム検索機能がサポートされていません。");
        }
    } catch (e) {
        console.error("Error calling iframe search function:", e.message);
    }
};

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        
        if (searchInput.value.toLowerCase() === 'debug') {
            toggleDebugScrollMode(); 
            searchInput.value = '';
            searchHistoryContainer.style.display = 'none';
            searchInput.blur();
            return; 
        }

        performSearch('next');
        searchHistoryContainer.style.display = 'none';
    }
});

// ▼▼▼ 追加: カスタムクリアボタンの制御ロジック ▼▼▼
searchInput.addEventListener('input', () => {
    if (searchInput.value.length > 0) {
        searchClearBtn.style.display = 'block';
    } else {
        searchClearBtn.style.display = 'none';
        // テキストが手動で空になった場合もハイライトをクリア
        try {
            const iframeWin = iframe.contentWindow;
            if (iframeWin && typeof iframeWin.clearHighlights === 'function') {
                iframeWin.clearHighlights();
            }
        } catch(e) {}
    }
});

searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    searchInput.focus();
    // iframe内のハイライトとカウンターもクリア
    try {
        const iframeWin = iframe.contentWindow;
        if (iframeWin && typeof iframeWin.clearHighlights === 'function') {
            iframeWin.clearHighlights();
        }
    } catch(e) {
        console.error("Error clearing iframe highlights:", e.message);
    }
});
// ▲▲▲ 追加ここまで ▲▲▲

const showSearchHistoryIfNeeded = () => {
    loadSearchHistory();
    if (searchHistoryContainer.children.length > 0) {
        searchHistoryContainer.style.display = 'block';
    }
};

searchInput.addEventListener('focus', () => {
    history.pushState({uiState: 'search'}, ''); 
    customHistoryStack.push('search');          
    showSearchHistoryIfNeeded();
});

searchInput.addEventListener('click', () => {
    if (searchHistoryContainer.style.display !== 'block') {
         showSearchHistoryIfNeeded();
    }
});

// ▼▼▼ 変更: blurイベントでフォーカス移動先を判定し、誤作動を防止 ▼▼▼
searchInput.addEventListener('blur', (e) => {
    // フォーカスの移動先が検索ボタンの場合は、キャンセル動作（history.back）をしない
    if (e.relatedTarget === searchNextBtn || e.relatedTarget === searchPrevBtn) {
        return;
    }

    setTimeout(() => {
        if (searchHistoryContainer.style.display === 'block') {
            if (history.state && history.state.uiState === 'search') { 
                history.back(); 
            }
            searchHistoryContainer.style.display = 'none';
        }
        if (searchInput.value.trim() === '') {
             try {
                const iframeWin = iframe.contentWindow;
                if (iframeWin && typeof iframeWin.clearHighlights === 'function') {
                    iframeWin.clearHighlights();
                }
            } catch(e) {}
            searchResultsCount.style.display = 'none';
        }
    }, 200);
});
// ▲▲▲ 変更ここまで ▲▲▲

// ▼▼▼ 変更: popstateで検索結果表示もクリアする ▼▼▼
window.addEventListener('popstate', (event) => {

    // ▼▼▼ 追加: オートスクロール作動中に「戻る」が押された場合の処理 ▼▼▼
    if (scrollInterval) {
        // スクロールを停止し、クイズをリセットする (トグルOFFと同じ動作)
        stopAutoScroll(true); // true = クイズをリセット
    }
    // ▲▲▲ 追加ここまで ▲▲▲
    
    if (customHistoryStack.length > 0) {
        const lastStateToPop = customHistoryStack.pop(); 

        if (lastStateToPop === 'menu') {
            if (navColumn.classList.contains('menu-open')) {
                navColumn.classList.remove('menu-open');
                menuToggleOpenBtn.style.display = 'flex';
                menuToggleCloseBtn.style.display = 'none';
                appList.style.height = '0'; 
                appList.style.paddingTop = '0';
            }
            return; 
        } 
        // ▼▼▼ 変更: 「戻る」ボタンで検索をキャンセルする際の動作を修正 ▼▼▼
        else if (lastStateToPop === 'search') {
            const wasSearchActive = searchInput.value !== '';
            const wasHistoryVisible = searchHistoryContainer.style.display === 'block';

            // 検索語があるか、検索履歴が表示されている場合にUIをリセットする
            if (wasSearchActive || wasHistoryVisible) {
                if (wasHistoryVisible) {
                    searchHistoryContainer.style.display = 'none';
                }
                if (wasSearchActive) {
                    searchInput.value = '';
                    // inputイベントを発火させ、関連するUI（クリアボタン、ハイライト、カウンター）をリセットする
                    searchInput.dispatchEvent(new Event('input'));
                }
                searchInput.blur();
            }
            return; // ページ遷移は行わない
        }
        // ▲▲▲ 変更ここまで ▲▲▲
        else if (lastStateToPop && lastStateToPop.type === 'quiz') {
            clearIframeChoice(lastStateToPop.index);
            return; 
        }
    }
});
// ▲▲▲ 変更ここまで ▲▲▲


// ▼▼▼ 変更: 検索ボタンのロジックを「常に同じ名前のWindow」に戻す ▼▼▼
function addSearchButtonsToIframe() {
    try {
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc || !iframeDoc.body || iframeDoc.body.classList.contains('search-buttons-added')) return;

        const createSearchButton = (targetElement) => {
            let textToSearch = "";
            const originalTextContent = targetElement.textContent;

            if (targetElement.matches('.question-text')) {
                // ▼▼▼ 修正: ここからが今回の修正箇所 ▼▼▼
                // 「★」の有無で検索クエリの生成ロジックを分岐
                if (originalTextContent.includes('★')) {
                    // 「★」がある場合: 「問題 ●●:」のみを削除し、他は全て残す
                    textToSearch = originalTextContent
                        .split('★')[0] // 「★」より前の部分を取得
                        .replace(/^問題 \d+:\s*/, '') // 「問題 ●●:」形式の接頭辞のみを削除
                        .trim();
                } else {
                    // 「★」がない場合: 従来のトリミング処理を適用
                    textToSearch = originalTextContent
                        .replace(/^問題 \d+:\s*/, '')
                        .replace(/※?【[^】]*】にも出題/g, '')
                        .replace(/（[^）]*）/g, '')
                        .replace(/\([^)]*\)/g, (match) => {
                            const content = match.slice(1, -1);
                            return /^\d+$/.test(content) ? match : '';
                        })
                        .replace(/<[^>]*>/g, '')
                        .replace(/『[^』]*』/g, '')
                        .replace(/予想問題/g, '')
                        .trim();
                }
                // ▲▲▲ 修正ここまで ▲▲▲
                
                // 選択肢の追加（共通処理）
                const choicesContainer = targetElement.closest('.question-content').querySelector('.choices-container');
                let choiceTexts = '';
                if (choicesContainer) {
                    const choiceButtons = choicesContainer.querySelectorAll('.choice-btn');
                    choiceTexts = Array.from(choiceButtons)
                        .map(btn => btn.textContent.trim())
                        .join('\n');
                }
                textToSearch = `${textToSearch}\n${choiceTexts}`;

            } else if (targetElement.matches('.choice-btn')) {
                textToSearch = originalTextContent.trim();
            }
            
            if (!textToSearch) return;

            const searchBtn = iframeDoc.createElement('button');
            searchBtn.className = 'search-btn';
            searchBtn.textContent = '🔍';
            
            searchBtn.onclick = () => {
                if (!isMobile()) {
                    navigator.clipboard.writeText(textToSearch).catch(err => {
                        console.error('クリップボードへのコピーに失敗しました: ', err);
                    });
                }

                const searchQuery = encodeURIComponent(textToSearch);
                const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
                
                if (!isMobile()) {
                     // PCの場合のロジック（常に同じ名前のウィンドウを指定）
                    const width = window.innerWidth;
                    const height = window.innerHeight;
                    const top = window.screenY;
                    const left = window.screenX + window.innerWidth;
                    const windowFeatures = `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`;
                    window.open(searchUrl, 'googleSearchWindow', windowFeatures);
                } else {
                    // モバイルの場合
                    window.open(searchUrl, '_blank');
                }
            };
            
            const wrapper = iframeDoc.createElement('div');
            wrapper.className = 'search-button-wrapper';
            
            const parent = targetElement.parentNode;
            if(parent) {
                parent.replaceChild(wrapper, targetElement);
                wrapper.appendChild(searchBtn);
                wrapper.appendChild(targetElement);
            }

            if (targetElement.matches('.choice-btn')) {
                targetElement.style.flexGrow = '1';
                targetElement.style.margin = '0';
            }
             if (targetElement.matches('.question-text')) {
                wrapper.style.marginBottom = '20px';
                targetElement.style.marginBottom = '0';
            }
        };
        
        const elementsToProcess = Array.from(iframeDoc.querySelectorAll('.question-text, .choice-btn'));
        elementsToProcess.forEach(createSearchButton);
        
        iframeDoc.body.classList.add('search-buttons-added');

    } catch (e) {
        console.warn("Could not add search buttons to iframe content: ", e.message);
    }
}

function setupIframeContent() {
    try {
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc && iframeDoc.body && (iframeDoc.querySelector('.choice-btn') || iframeDoc.querySelector('#timer-display') || iframeDoc.querySelector('#quiz-container'))) { // 変更: #quiz-container も対象に
            
            injectBaseStyles(iframeDoc);
            injectCustomStylesToIframe(iframeDoc);
            applyDarkModeToIframe(bodyElement.classList.contains('dark-mode'));
            addSearchButtonsToIframe(); 
            setAppHeight();
            
            const quizButtons = iframeDoc.querySelectorAll('.choice-btn');
            if (quizButtons.length > 0) {
                if (!iframeDoc.body.classList.contains('choice-listeners-added')) {
                    
                    quizButtons.forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            const quizItem = e.target.closest('.quiz-item');
                            if (quizItem && quizItem.id) {
                                const quizIndex = quizItem.id.split('-')[1];
                                handleQuizChoiceMade(quizIndex);
                            }
                        });
                    });
                    
                    const finishBtn = iframeDoc.getElementById('finish-btn');
                    if (finishBtn) {
                        finishBtn.addEventListener('click', handleQuizFinished);
                    }
                    
                    iframeDoc.body.classList.add('choice-listeners-added');
                }
            }

            // ▼▼▼ 追加: iframe内のスクロールを監視し、手動スクロール時に残り時間概算を更新 ▼▼▼
            if (!iframeDoc.body.classList.contains('scroll-time-listener-added')) {
                iframe.contentWindow.addEventListener('scroll', () => {
                    if (!scrollInterval) { // オートスクロール作動中「以外」の場合
                        updateCountdownDisplay();
                    }
                });
                iframeDoc.body.classList.add('scroll-time-listener-added');
            }
            
            // ▼▼▼ 変更: 停止問題プルダウンの生成と制御 (デバッグモード対応) ▼▼▼
            // isPC またはデバッグモードが有効な場合
            const isDebugScrollEnabled = localStorage.getItem(SCROLL_DEBUG_KEY) === 'true';
            if (isPC || isDebugScrollEnabled) {
                try {
                    // 1. 現在のiframeのSRCからキーを生成
                    currentIframeSrcKey = iframe.contentWindow.location.pathname + iframe.contentWindow.location.search; // ★クエリパラメータも含めるように修正
                    
                    // 2. iframe内の総問題数を取得 ( .quiz-item で判定)
                    const quizItems = iframeDoc.querySelectorAll('.quiz-item');
                    totalQuestionsInIframe = quizItems.length;

                    // ▼▼▼ 修正: 問題数が2問以上の場合のみプルダウンを表示 ▼▼▼
                    if (totalQuestionsInIframe > 1) {
                    // ▲▲▲ 修正ここまで ▲▲▲
                        // 3. 問題数が1以上なら、プルダウンとラベルを表示
                        populateStopQuestionSelect(totalQuestionsInIframe);
                        stopQuestionSelect.style.display = 'inline-block';
                        stopQuestionLabel.style.display = 'inline';
                    } else {
                        // 4. タイマーページなど、クイズ以外なら非表示
                        stopQuestionSelect.style.display = 'none';
                        stopQuestionLabel.style.display = 'none';
                    }
                } catch (e) {
                    console.warn("Failed to setup stop question select:", e);
                    stopQuestionSelect.style.display = 'none';
                    stopQuestionLabel.style.display = 'none';
                }
            } else {
                // PCでもデバッグでもない場合（＝スマホ通常時）は確実に非表示
                stopQuestionSelect.style.display = 'none';
                stopQuestionLabel.style.display = 'none';
            }
            // ▲▲▲ 変更ここまで ▲▲▲
            
            updateCountdownDisplay(); // iframeロード完了時に一度計算
            // ▲▲▲ 追加ここまで ▲▲▲

        } else {
            setTimeout(setupIframeContent, 50); 
        }
    } catch (e) {
        setTimeout(setupIframeContent, 50);
    }
}

// ▼▼▼ 追加: 検索ボックスの表示/非表示を切り替える関数 ▼▼▼
function updateFooterUIVisibility() {
    try {
        const iframeSrc = iframe.contentWindow.location.href;
        // 非表示にしたいページのファイル名を配列で指定
        const pagesToHideSearch = [
            'timer-portrait.html', 
            'timer-landscape.html', 
            'quiz_english.html'
        ];
        
        // 現在のページのファイル名が配列に含まれているかチェック
        const shouldHide = pagesToHideSearch.some(page => iframeSrc.includes(page));

        if (shouldHide) {
            searchContainer.style.display = 'none'; // 非表示
        } else {
            searchContainer.style.display = 'flex'; // 表示
        }
    } catch (e) {
        // エラーが発生した場合もデフォルトで表示しておく
        searchContainer.style.display = 'flex';
        console.warn("iframeのURL取得に失敗したため、検索ボックスの表示状態を変更できませんでした:", e.message);
    }
}
// ▲▲▲ 追加ここまで ▲▲▲


iframe.addEventListener('load', () => {
    handleQuizFinished(); 
    setupIframeContent();
    // ▼▼▼ 追加: iframeが読み込まれるたびに表示/非表示を判定 ▼▼▼
    updateFooterUIVisibility();
    // ▲▲▲ 追加ここまで ▲▲▲
});


// ▼▼▼ 追加: オートスクロール機能 ▼▼▼
const scrollControls = document.getElementById('scroll-controls');
const speedSelect = document.getElementById('scroll-speed-select');
const countdownDisplay = document.getElementById('scroll-countdown');
const toggleCheckbox = document.getElementById('scroll-toggle-checkbox');
// ▼▼▼ 追加: 停止問題プルダウンのDOM取得 ▼▼▼
const stopQuestionSelect = document.getElementById('scroll-stop-question-select');
const stopQuestionLabel = document.getElementById('scroll-stop-label');
// ▲▲▲ 追加ここまで ▲▲▲

const SCROLL_SPEED_KEY = 'quizAutoScrollSpeed';
// ▼▼▼ 追加: 停止問題保存キーのプレフィックス ▼▼▼
const STOP_QUESTION_KEY_PREFIX = 'quizAutoScrollStopQ_';
// ▲▲▲ 追加ここまで ▲▲▲
// ▼▼▼ 追加: デバッグモード保存キー ▼▼▼
const SCROLL_DEBUG_KEY = 'quizDebugScrollMode';
// ▲▲▲ 追加ここまで ▲▲▲
const SCROLL_INTERVAL_MS = 20; // スクロール更新間隔 (ミリ秒)

let scrollInterval = null;
let countdownInterval = null;
let currentScrollSpeed = 1.0; 
// ▼▼▼ 追加: 停止問題関連のグローバル変数 ▼▼▼
let currentStopQuestion = 1; // 停止する問題番号 (デフォルト)
let totalQuestionsInIframe = 0; // 現在のiframe内の総問題数
let currentIframeSrcKey = ''; // localStorage用のキー
// ▲▲▲ 追加ここまで ▲▲▲

/**
 * 0.5から5.0まで0.1刻みでプルダウンを生成し、localStorageから速度を復元
 */
function populateSpeedSelect() {
    const savedSpeed = localStorage.getItem(SCROLL_SPEED_KEY) || '1.0';
    currentScrollSpeed = parseFloat(savedSpeed); 
    for (let i = 5; i <= 50; i++) {
        const speedValue = (i / 10).toFixed(1);
        const option = document.createElement('option');
        option.value = speedValue;
        option.textContent = speedValue;
        if (speedValue === savedSpeed) {
            option.selected = true;
        }
        speedSelect.appendChild(option);
    }
}

/**
 * ▼▼▼ 新設: 停止問題プルダウンを生成 (2～totalQuestions) ▼▼▼
 */
function populateStopQuestionSelect(totalQuestions) {
    stopQuestionSelect.innerHTML = ''; // 中身をクリア

    // ▼▼▼ 修正: ループ開始を 2 に変更 ▼▼▼
    for (let i = 2; i <= totalQuestions; i++) {
    // ▲▲▲ 修正ここまで ▲▲▲
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        stopQuestionSelect.appendChild(option);
    }
    
    // localStorageから保存値を取得 (キーはiframeのSRCに基づく)
    const storageKey = STOP_QUESTION_KEY_PREFIX + currentIframeSrcKey;
    const savedStopQuestion = localStorage.getItem(storageKey);

    let defaultStopQuestion = totalQuestions; // デフォルトは最終問題

    // ▼▼▼ 修正: 1が保存されていても 2以上 になるように調整 ▼▼▼
    if (savedStopQuestion) {
        let savedNum = parseInt(savedStopQuestion, 10);
        
        // 1が保存されていたら、2にみなす (totalQuestionsが2以上ある前提)
        if (savedNum < 2) { 
            savedNum = 2; 
        }
        
        // 保存された値が現在の総問題数以下の有効な値かチェック
        if (savedNum >= 2 && savedNum <= totalQuestions) {
            defaultStopQuestion = savedNum;
        }
    }
    // ▲▲▲ 修正ここまで ▲▲▲
    
    stopQuestionSelect.value = defaultStopQuestion;
    currentStopQuestion = defaultStopQuestion; // グローバル変数も更新
}
// ▲▲▲ 新設ここまで ▲▲▲


/**
 * 秒数を「MM分SS秒」形式の文字列にフォーマット
 */
function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${String(mins).padStart(2, '0')}分${String(secs).padStart(2, '0')}秒`;
}

/**
 * iframe内の残りのスクロール可能ピクセル数と、選択中の速度に基づく残り時間を計算
 * ★修正: 終端までではなく、「停止選択問題」までの距離を計算する
 */
function getRemainingScrollData() {
    try {
        const iWin = iframe.contentWindow;
        const iDoc = iframe.contentDocument; 
        const iDocEl = iDoc.documentElement;
        
        // ▼▼▼ 修正: クイズページ以外(totalQuestions=0)なら 0 を返す ▼▼▼
        if (!iWin || !iDocEl || totalQuestionsInIframe <= 1) return { pixels: 0, seconds: 0 };
        // ▲▲▲ 修正ここまで ▲▲▲

        // 1. 停止対象の要素のY座標 (offsetTop) を取得
        let targetY = 0;
        
        // ▼▼▼ 修正: IDを (currentStopQuestion - 1) で検索 ▼▼▼
        const targetElement = iDoc.getElementById(`quiz-${currentStopQuestion - 1}`); 
        // ▲▲▲ 修正ここまで ▲▲▲

        // ▼▼▼ 修正: 目標Y座標を「要素の上端 + ヘッダーオフセット」に変更 ▼▼▼
        if (targetElement) {
            const maxScrollY = iDocEl.scrollHeight - iWin.innerHeight;
            
            // 1. ヘッダーオフセットを取得 (quiz.html内の #quiz-header)
            let headerOffset = 0;
            const headerElement = iDoc.getElementById('quiz-header');
            if (headerElement) {
                headerOffset = headerElement.offsetHeight + 10; // +10pxのオフセット
            }

            // 2. 要素の上端 (offsetTop) からオフセットを引く
            const calculatedTargetY = targetElement.offsetTop - headerOffset;
            
            // 3. 0 (上端) と maxScrollY (下端) の間に収める
            targetY = Math.max(0, Math.min(calculatedTargetY, maxScrollY));
            
        } else {
            // 要素が見つからない場合 (最終問題が選択されているなど)
            // 終端を目標とする
            targetY = iDocEl.scrollHeight - iWin.innerHeight; 
        }
        // ▲▲▲ 修正ここまで ▲▲▲
        
        // 3. 現在のY座標からの残りピクセル数を計算
        const currentY = iWin.scrollY;
        const remainingPixels = targetY - currentY;
        
        if (remainingPixels <= 0) return { pixels: 0, seconds: 0 };

        // 4. 速度に基づく残り時間を計算 (既存のロジック)
        const speedSetting = currentScrollSpeed; 
        const pixelsPerSecond = speedSetting * (1000 / SCROLL_INTERVAL_MS);
        
        const remainingSeconds = (pixelsPerSecond > 0) ? (remainingPixels / pixelsPerSecond) : 0;
        return { pixels: remainingPixels, seconds: remainingSeconds };
    } catch (e) {
        return { pixels: 0, seconds: 0 }; // エラー時
    }
}


/**
 * カウントダウン表示を更新する
 */
function updateCountdownDisplay(isStopped = false) {
    if (isStopped) {
        countdownDisplay.textContent = '00分00秒';
        return;
    }
    const data = getRemainingScrollData();
    countdownDisplay.textContent = formatTime(data.seconds);
}

/**
 * オートスクロールを開始
 */
function startAutoScroll() {
    // 実行中のインターバルがあれば停止
    clearInterval(scrollInterval);
    clearInterval(countdownInterval);
    
    // ★指示: 「クイズ終了」と同じ動作（正解表示）ただしトップに戻らない
    try {
        if (iframe.contentWindow && typeof iframe.contentWindow.finishQuiz === 'function') {
            iframe.contentWindow.finishQuiz(false); // false を渡してトップスクロールを抑制
        }
    } catch (e) {
        console.error("Failed to call iframe.finishQuiz(false):", e);
    }
    
    // ▼▼▼ 修正: finishQuiz() によるDOM変更が反映されるのを待つ (100ms) ▼▼▼
    setTimeout(() => {
        // 待機中にOFFにされた場合は、スクロールを開始しない
        if (!toggleCheckbox.checked) {
            return; 
        }

        // スクロール処理
        scrollInterval = setInterval(() => {
            try {
                const iWin = iframe.contentWindow;
                const iDoc = iframe.contentDocument; 
                const iDocEl = iDoc.documentElement;
                
                // 1. 停止目標のY座標を取得
                const iViewHeight = iWin.innerHeight;
                const maxScrollY = iDocEl.scrollHeight - iViewHeight;
                let targetY = maxScrollY; // デフォルトは終端
                let isTargetingEnd = true; // 終端が目標かどうかのフラグ

                // ▼▼▼ 修正: 停止目標Y座標を「要素の上端 + ヘッダーオフセット」に変更 ▼▼▼
                if (totalQuestionsInIframe > 1) {
                    const targetElement = iDoc.getElementById(`quiz-${currentStopQuestion - 1}`);
                    
                    if (targetElement) {
                        isTargetingEnd = false; 
                        
                        // 1. ヘッダーオフセットを取得 (quiz.html内の #quiz-header)
                        let headerOffset = 0;
                        const headerElement = iDoc.getElementById('quiz-header');
                        if (headerElement) {
                            headerOffset = headerElement.offsetHeight + 10; // +10pxのオフセット
                        }
                        
                        // 2. 要素の上端 (offsetTop) からオフセットを引く
                        const calculatedTargetY = targetElement.offsetTop - headerOffset;

                        // 3. 0 (上端) と maxScrollY (下端) の間に収める
                        targetY = Math.max(0, Math.min(calculatedTargetY, maxScrollY));
                    }
                }
                // ▲▲▲ 修正ここまで ▲▲▲

                // 2. 現在のY座標
                const currentY = iWin.scrollY;
                
                // 3. 停止判定
                
                // 3a. 終端判定 (バッファは維持)
                if ((iWin.innerHeight + currentY + 2) >= iDocEl.scrollHeight) {
                    stopAutoScroll(false); // 終端に達したら停止
                    return; // 処理終了
                }

                // 3b. 目標Y座標 判定 (終端が目標でない場合)
                if (!isTargetingEnd) {
                    // 次のステップで目標Y座標を超えるか、またはちょうど達するか
                    if ((currentY + currentScrollSpeed) >= targetY) {
                        // 目標位置に正確に停止
                        iWin.scrollTo({ top: targetY, behavior: 'auto' }); 
                        stopAutoScroll(false); // リセットせずに停止
                        return; // 処理終了
                    }
                }
                
                // 4. 停止しない場合はスクロール続行
                iWin.scrollBy(0, currentScrollSpeed); 
                
            } catch (e) {
                stopAutoScroll(false); // iframeにアクセスできない場合なども停止
            }
        }, SCROLL_INTERVAL_MS);

        // カウントダウン処理
        countdownInterval = setInterval(updateCountdownDisplay, 1000); // 1秒ごとに残り時間を更新
        updateCountdownDisplay(); // 即時実行
    }, 100); // 100ms待機
    // ▲▲▲ 修正ここまで ▲▲▲
}

/**
 * オートスクロールを停止
 */
function stopAutoScroll(shouldResetQuiz) {
    clearInterval(scrollInterval);
    scrollInterval = null;
    clearInterval(countdownInterval);
    countdownInterval = null;
    
    updateCountdownDisplay(true); // 表示を00:00にリセット
    toggleCheckbox.checked = false; // UIをOFF状態にする

    // ★指示: トグルOFF時または「戻る」ボタン時
    if (shouldResetQuiz) {
        try {
            if (iframe.contentWindow && typeof iframe.contentWindow.resetQuiz === 'function') {
                iframe.contentWindow.resetQuiz(); // クイズリセット関数を呼び出す
            }
        } catch (e) {
             console.error("Failed to call iframe.resetQuiz():", e);
        }
    }
}

/**
 * トグルスイッチのON/OFFイベントハンドラ
 */
function handleScrollToggle() {
    if (toggleCheckbox.checked) {
        // ONになった
        startAutoScroll();
    } else {
        // OFFになった
        // ▼▼▼ 修正: true (リセット) から false (リセットしない) に変更 ▼▼▼
        stopAutoScroll(false); // false = ユーザーが手動でOFFにした = クイズをリセットしない
        // ▲▲▲ 修正ここまで ▲▲▲
    }
}

// ▼▼▼ 新規追加: 速度変更イベントハンドラ（関数化） ▼▼▼
function handleSpeedChange() {
    const newSpeed = speedSelect.value;
    localStorage.setItem(SCROLL_SPEED_KEY, newSpeed); // ★指示: 速度を記憶
    currentScrollSpeed = parseFloat(newSpeed); // ★修正: グローバル変数を即時更新
    updateCountdownDisplay(); // 速度変更時に残り時間を即時再計算
}

// ▼▼▼ 新規追加: 停止問題変更イベントハンドラ（関数化） ▼▼▼
function handleStopQuestionChange() {
    const newStopQ = parseInt(stopQuestionSelect.value, 10);
    currentStopQuestion = newStopQ; // グローバル変数を更新
    
    // localStorage に保存 (キーはiframeのSRCに基づく)
    const storageKey = STOP_QUESTION_KEY_PREFIX + currentIframeSrcKey;
    localStorage.setItem(storageKey, newStopQ);

    updateCountdownDisplay(); // 停止位置変更時に残り時間を即時再計算
}


// ▼▼▼ 新規追加: デバッグモードのUI表示/非表示を切り替える関数 ▼▼▼
function updateScrollUIVisibility() {
    const isDebugScrollEnabled = localStorage.getItem(SCROLL_DEBUG_KEY) === 'true';
    const shouldShowScroll = isPC || isDebugScrollEnabled; // isPC はグローバルスコープで定義済み

    if (shouldShowScroll) {
        scrollControls.style.display = 'flex';
        // 既に初期化済みかチェック（重複登録を防ぐ）
        if (!scrollControls.dataset.initialized) { 
            populateSpeedSelect();
            speedSelect.addEventListener('change', handleSpeedChange);
            stopQuestionSelect.addEventListener('change', handleStopQuestionChange);
            toggleCheckbox.addEventListener('change', handleScrollToggle);
            scrollControls.dataset.initialized = 'true';
        }
    } else {
        scrollControls.style.display = 'none';
        // デバッグモードをOFFにした場合、もしスクロール中なら停止する
        if (scrollInterval) {
            stopAutoScroll(true); // クイズリセットして停止
        }
    }
}

// ▼▼▼ 新規追加: デバッグモードのトグル処理 ▼▼▼
function toggleDebugScrollMode() {
    const isCurrentlyEnabled = localStorage.getItem(SCROLL_DEBUG_KEY) === 'true';
    if (isCurrentlyEnabled) {
        localStorage.removeItem(SCROLL_DEBUG_KEY);
        showToast('デバッグスクロール: OFF');
    } else {
        localStorage.setItem(SCROLL_DEBUG_KEY, 'true');
        showToast('デバッグスクロール: ON');
    }
    updateScrollUIVisibility();
    
    // ▼▼▼ 修正 (要求1): デバッグモード切り替え時にiframe内のプルダウン表示を再評価 ▼▼▼
    setupIframeContent(); 
    // ▲▲▲ 修正ここまで ▲▲▲
}
// ▲▲▲ オートスクロール/デバッグ機能ここまで ▲▲▲


// --- 初期化処理 ---
const isPC = !isMobile(); // isPC はグローバルスコープで定義 (setupIframeContent や updateScrollUIVisibility で参照)

// ▼▼▼ 変更: 実行タイミングを DOMContentLoaded にまとめる ▼▼▼
document.addEventListener('DOMContentLoaded', () => {
    displayLastUpdated();
    loadQuizList(); // ★新規: クイズリストの読み込みを開始
    setupMobileMenuLayout(); 
    loadSearchHistory();
    updateScrollUIVisibility(); // ★新規: スクロールUIの表示判定を実行
});
// ▲▲▲ 変更ここまで ▲▲▲

// ▼▼▼ 変更: iframeのloadイベントでは、静的なページのタイトルのみを扱うようにする ▼▼▼
iframe.addEventListener('load', () => {
    try {
        // iframe内のJSがメッセージを送らない静的なページ（タイマーなど）の場合のフォールバック
        const iframeTitle = iframe.contentWindow.document.title;
        if (iframe.contentWindow.location.href.includes('quiz.html')) {
             // quiz.htmlの場合は何もしない（JSからのメッセージを待つ）
        } else {
            const newPlaceholder = `検索..${iframeTitle}から`;
            searchInput.placeholder = newPlaceholder;
        }
    } catch (e) {
        // クロスオリジンエラーなどでiframeのコンテンツにアクセスできない場合
        console.error("Failed to update search placeholder on load:", e);
        // デフォルトのテキストに戻す
        searchInput.placeholder = "表示画面内を検索...";
    }
});
// ▲▲▲ 変更ここまで ▲▲▲

const iframe = document.getElementById('contentFrame');
const bodyElement = document.body;
const toastElement = document.getElementById('toast-notification');
const searchHistoryContainer = document.getElementById('search-history-container');
const searchInput = document.getElementById('search-input');
const SEARCH_HISTORY_KEY = 'quizAppSearchHistory';

const searchContainer = document.querySelector('.search-container');
const searchResultsCount = document.getElementById('search-results-count');
const searchClearBtn = document.getElementById('search-clear-btn');
let blinkTimeout = null;
const rubyToggleBtn = document.getElementById('ruby-toggle-btn');

let customHistoryStack = []; 

function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

if (isMobile()) {
    document.body.classList.add('mobile-no-select');
    window.addEventListener('contextmenu', function (e) {
        if (e.target.closest('#search-input') === null) { 
             e.preventDefault();
        }
    }, false);
    window.addEventListener('keydown', function (e) {
        if ( e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'U') || (e.metaKey && e.altKey && e.key === 'I') ) {
            e.preventDefault();
        }
    });
    /* (function() {
        function blockDevTools() { debugger; }
        setInterval(blockDevTools, 500);
    })(); */
}

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

const loadQuizList = async () => {
    const appList = document.getElementById('app-list');
    const closeMenuLi = document.querySelector('.close-menu-li');
    const menuToggleOpenBtn = document.getElementById('menu-toggle-open');
    if (!appList || !closeMenuLi || !menuToggleOpenBtn) return;

    try {
        const response = await fetch(`-quiz_list.txt?v=${new Date().getTime()}`);
        if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim() !== '');
        lines.forEach(line => {
            const parts = line.split('\t');
            if (parts.length < 2) return;
            const url = parts[0].trim();
            const title = parts[1].trim();
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = url;
            a.target = 'contentFrame';
            a.textContent = title;
            li.appendChild(a);
            appList.insertBefore(li, closeMenuLi);
        });
    } catch (e) {
        console.error("クイズリストの読み込みに失敗しました:", e);
        const li = document.createElement('li');
        li.textContent = "クイズリストの読み込みエラー";
        li.style.color = "red";
        appList.insertBefore(li, closeMenuLi);
    } finally {
        if (menuToggleOpenBtn) {
            menuToggleOpenBtn.disabled = false;
        }
    }
};

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
                        iframeWin.handleSearch('', 'next', null, true); 
                    } else if (iframeWin && typeof iframeWin.clearHighlights === 'function') {
                        iframeWin.clearHighlights();
                    }
                } catch(err) {}
                searchInput.value = term;
                searchInput.dispatchEvent(new Event('input'));
                performSearch('next', true);
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
    if (history.includes(term)) { return; }
    history.push(term); 
    while (history.length > 10) { history.shift(); }
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    loadSearchHistory(); 
};

let toastTimer;
// ▼▼▼ 変更箇所(1/2) ▼▼▼
const showToast = (message) => {
    clearTimeout(toastTimer);
    // textContentからinnerHTMLに変更して、<br>タグを解釈できるようにする
    toastElement.innerHTML = message;
    toastElement.classList.add('show');
    toastTimer = setTimeout(() => {
        toastElement.classList.remove('show');
    }, 2000); 
};
// ▲▲▲ 変更ここまで ▲▲▲

// ▼▼▼ 変更箇所(2/2) ▼▼▼
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'quizPositionRestored') {
        const { title, question } = event.data;
        // 「の」の後に<br>（改行タグ）を追加
        const message = `「${title}」<br>の<br>${question}問目から再開しました`;
        showToast(message);
    }
    else if (event.data && event.data.type === 'iframeTitleUpdated') {
        const newTitle = event.data.title || '';
        const cleanTitle = newTitle.replace(/^クイズ：/, '').trim();
        const newPlaceholder = `検索..${cleanTitle}から`;
        searchInput.placeholder = newPlaceholder;
    }
    else if (event.data && event.data.type === 'searchResultUpdate') {
        const { currentIndex, totalHits, term } = event.data;
        clearTimeout(blinkTimeout);
        searchResultsCount.classList.remove('blink');
        if (term && totalHits > 0) {
            searchResultsCount.textContent = `${currentIndex + 1} / ${totalHits}`;
            searchResultsCount.style.display = 'block';
        } else if (term && totalHits === 0) {
            searchResultsCount.textContent = '該当無し';
            searchResultsCount.style.display = 'block';
            searchResultsCount.classList.add('blink');
            blinkTimeout = setTimeout(() => {
                searchResultsCount.classList.remove('blink');
            }, 1200);
        } else {
            searchResultsCount.textContent = '';
            searchResultsCount.style.display = 'none';
        }
    }
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
        choiceButtons.forEach(btn => { btn.classList.remove('selected'); });
        const feedbackText = quizItem.querySelector('.feedback-text');
        if (feedbackText) { feedbackText.textContent = ''; }
        quizItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {
        console.error("Error clearing iframe choice:", e.message);
    }
}

function injectCustomStylesToIframe(iframeDoc) {
    const styleId = 'injected-custom-font-style';
    const existingStyle = iframeDoc.getElementById(styleId);
    if (existingStyle) { existingStyle.remove(); }
    const styleElement = iframeDoc.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
        .question-text, .choice-btn { font-size: 1.8em; }
        .feedback-text { font-size: 1.7em; }
        @media (max-width: 768px) {
            .question-text { font-size: 1.3em; }
            .choice-btn { font-size: 1.2em; }
            .feedback-text { font-size: 1.3em; }
        }
    `;
    iframeDoc.head.appendChild(styleElement);
}

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

const toggleMenu = () => {
    if (window.innerWidth > 768) return;
    const isOpening = !navColumn.classList.contains('menu-open');
    navColumn.classList.toggle('menu-open');
    if (isOpening) {
        rubyToggleBtn.style.display = 'none';
        history.pushState({uiState: 'menu'}, ''); 
        customHistoryStack.push('menu');          
        menuToggleOpenBtn.style.display = 'none';
        menuToggleCloseBtn.style.display = 'flex';
        const scrollHeight = appList.scrollHeight;
        appList.style.height = '0';
        setTimeout(() => { 
            appList.style.height = `${scrollHeight}px`; 
            appList.style.paddingTop = '10px'; 
        }, 10);
    } else {
        updateRubyButtonVisibility();
        if (history.state && history.state.uiState === 'menu') { 
            history.back(); 
        }
        menuToggleOpenBtn.style.display = 'flex';
        menuToggleCloseBtn.style.display = 'none';
        appList.style.height = `${appList.scrollHeight}px`;
        setTimeout(() => { 
            appList.style.height = '0'; 
            appList.style.paddingTop = '0'; 
        }, 10);
    }
    setTimeout(setAppHeight, 300); 
};

menuToggleOpenBtn.addEventListener('click', toggleMenu);
menuToggleCloseBtn.addEventListener('click', toggleMenu);

appList.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && appList.contains(link)) {
        handleQuizFinished(); 
        searchInput.value = '';
        searchResultsCount.style.display = 'none';
        searchResultsCount.textContent = '';
        if (navColumn.classList.contains('menu-open')) { 
            toggleMenu(); 
        }
    }
});


window.addEventListener('resize', setupMobileMenuLayout);

const darkModeButton = document.getElementById('dark-mode-toggle');

function injectBaseStyles(iframeDoc) {
    const styleId = 'injected-base-style';
    if (iframeDoc.getElementById(styleId)) return;
    const styleElement = iframeDoc.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = `
        .search-button-wrapper { display: flex; align-items: center; gap: 8px; }
        .search-btn { flex-shrink: 0; width: 38px; height: 38px; font-size: 1.2em; padding: 0; border-radius: 50%; border: 1px solid #ccc; background-color: #f0f0f0; color: #333; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .search-btn:hover { background-color: #e0e0e0; }
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
            styleElement.textContent = `
                /* 基本設定 */
                body { background-color: #212529 !important; color: #f8f9fa !important; }
                ::selection { background-color: #ffc107 !important; color: #000000 !important; }
                a { color: #66bfff !important; }

                /* manual.html用のスタイルを追加 */
                .feature-section { background-color: #343a40 !important; border-color: #495057 !important; }
                h1, h2, h3 { border-bottom-color: #0056b3 !important; }

                /* クイズページ用のスタイル */
                .quiz-container h1, .main-container h1, .main-container h2 { color: #f8f9fa !important; }
                #quiz-header { background-color: #343a40 !important; }
                #score-text { color: #b8bbbf !important; }
                .feedback-text[style*="color: green"] { color: #69f0ae !important; }
                .feedback-text[style*="color: red"] { color: #ff6e6e !important; }
                .feedback-text[style*="color: blue"] { color: #f8f9fa !important; }
                .quiz-container, .timer-container, div[style*="background"], section, main { background-color: transparent !important; color: inherit !important; }
                
                /* フォーム要素とボタン全般 */
                button, input, select { background-color: #343a40 !important; color: #f8f9fa !important; border-color: #495057 !important; }
                .search-btn { background-color: #343a40 !important; color: #f8f9fa !important; border-color: #495057 !important; }

                /* クイズページの選択肢のスタイルを追加 */
                .choice-btn { background-color: #343a40 !important; color: #f8f9fa !important; border-color: #495057 !important; }
                .choice-btn.selected { background-color: #5a6268 !important; border-color: #adb5bd !important; color: #ffffff !important; }
                .choice-btn.correct { background-color: #1f513f !important; border-color: #286953 !important; color: #ffffff !important; font-weight: bold !important; }
                .choice-btn.incorrect { background-color: #581e26 !important; border-color: #722730 !important; color: #ffffff !important; }
            `;
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

searchNextBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    performSearch('next');
});
searchPrevBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    performSearch('prev');
});
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

searchInput.addEventListener('input', () => {
    const term = searchInput.value;
    if (term.length > 0) {
        searchClearBtn.style.display = 'block';
    } else {
        searchClearBtn.style.display = 'none';
    }
    // リアルタイムでハイライトのみ実行
    try {
        const iframeWin = iframe.contentWindow;
        if (iframeWin && typeof iframeWin.highlightOnly === 'function') {
            iframeWin.highlightOnly(term);
        }
    } catch(e) {
        console.error("Error calling iframe highlight function:", e.message);
    }
});

searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    searchInput.focus();
    try {
        const iframeWin = iframe.contentWindow;
        if (iframeWin && typeof iframeWin.clearHighlights === 'function') {
            iframeWin.clearHighlights();
        }
    } catch(e) {
        console.error("Error clearing iframe highlights:", e.message);
    }
});

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
searchInput.addEventListener('blur', () => {
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

window.addEventListener('popstate', (event) => {
    if (scrollInterval) {
        stopAutoScroll(true);
    }
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
        else if (lastStateToPop === 'search') {
            const wasSearchActive = searchInput.value !== '';
            const wasHistoryVisible = searchHistoryContainer.style.display === 'block';
            if (wasSearchActive || wasHistoryVisible) {
                if (wasHistoryVisible) {
                    searchHistoryContainer.style.display = 'none';
                }
                if (wasSearchActive) {
                    searchInput.value = '';
                    searchInput.dispatchEvent(new Event('input'));
                }
                searchInput.blur();
            }
            return;
        }
        else if (lastStateToPop && lastStateToPop.type === 'quiz') {
            clearIframeChoice(lastStateToPop.index);
            return; 
        }
    }
});

function addSearchButtonsToIframe() {
    try {
        const iframeDoc = iframe.contentDocument;
        if (!iframeDoc || !iframeDoc.body || iframeDoc.body.classList.contains('search-buttons-added')) return;
        const createSearchButton = (targetElement) => {
            let textToSearch = "";
            
            const clone = targetElement.cloneNode(true);
            clone.querySelectorAll('rt').forEach(rt => rt.remove());
            const originalTextContent = clone.textContent;

            if (targetElement.matches('.question-text')) {
                if (originalTextContent.includes('★')) {
                    textToSearch = originalTextContent.split('★')[0].replace(/^問題 \d+:\s*/, '').trim();
                } else {
                    textToSearch = originalTextContent.replace(/^問題 \d+:\s*/, '').replace(/※?【[^】]*】にも出題/g, '').replace(/（[^）]*）/g, '').replace(/\([^)]*\)/g, (match) => { const content = match.slice(1, -1); return /^\d+$/.test(content) ? match : ''; }).replace(/<[^>]*>/g, '').replace(/『[^』]*』/g, '').replace(/予想問題/g, '').trim();
                }
                const choicesContainer = targetElement.closest('.question-content').querySelector('.choices-container');
                let choiceTexts = '';
                if (choicesContainer) {
                    const choiceButtons = choicesContainer.querySelectorAll('.choice-btn');
                    choiceTexts = Array.from(choiceButtons).map(btn => {
                        const btnClone = btn.cloneNode(true);
                        btnClone.querySelectorAll('rt').forEach(rt => rt.remove());
                        return btnClone.textContent.trim();
                    }).join('\n');
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
                    navigator.clipboard.writeText(textToSearch).catch(err => { console.error('クリップボードへのコピーに失敗しました: ', err); });
                }
                const searchQuery = encodeURIComponent(textToSearch);
                const searchUrl = `https://www.google.com/search?q=${searchQuery}`;
                if (!isMobile()) {
                    const width = window.innerWidth;
                    const height = window.innerHeight;
                    const top = window.screenY;
                    const left = window.screenX + window.innerWidth;
                    const windowFeatures = `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`;
                    window.open(searchUrl, 'googleSearchWindow', windowFeatures);
                } else {
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

function updateRubyButtonVisibility() {
    try {
        const iframeSrc = iframe.contentWindow.location.href;
        if (iframeSrc.includes('quiz.html')) {
            rubyToggleBtn.style.display = 'flex';
        } else {
            rubyToggleBtn.style.display = 'none';
        }
    } catch (e) {
        rubyToggleBtn.style.display = 'none';
    }
}

function syncRubyButtonState() {
    const isRubyEnabled = localStorage.getItem('rubyVisible') === 'true';
    if (isRubyEnabled) {
        rubyToggleBtn.classList.add('active');
        rubyToggleBtn.innerHTML = 'ルビ<br>ON中';
    } else {
        rubyToggleBtn.classList.remove('active');
        rubyToggleBtn.innerHTML = 'ルビ<br>OFF中';
    }
    try {
        iframe.contentWindow.postMessage({ type: 'setRubyState', state: isRubyEnabled }, '*');
    } catch(e) {}
}

rubyToggleBtn.addEventListener('click', () => {
    let topVisibleQuizId = null;
    try {
        const iframeDoc = iframe.contentDocument;
        const headerHeight = iframeDoc.getElementById('quiz-header')?.offsetHeight || 70;
        const quizItems = iframeDoc.querySelectorAll('.quiz-item');
        for (const item of quizItems) {
            if (item.getBoundingClientRect().top >= headerHeight) {
                topVisibleQuizId = item.id;
                break;
            }
        }
    } catch (e) {
        console.error("記憶処理エラー:", e);
    }

    const isRubyEnabled = !(localStorage.getItem('rubyVisible') === 'true');
    localStorage.setItem('rubyVisible', isRubyEnabled);
    syncRubyButtonState();

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (topVisibleQuizId) {
                try {
                    const iframeDoc = iframe.contentDocument;
                    const iframeWin = iframe.contentWindow;
                    const headerHeight = iframeDoc.getElementById('quiz-header')?.offsetHeight || 70;
                    const elementToRestore = iframeDoc.getElementById(topVisibleQuizId);
                    if (elementToRestore) {
                        const newPosition = elementToRestore.offsetTop;
                        iframeWin.scrollTo({
                            top: newPosition - headerHeight - 10,
                            behavior: 'auto'
                        });
                    }
                } catch (e) {
                    console.error("復元処理エラー:", e);
                }
            }
        });
    });
});

function setupIframeContent() {
    try {
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc && iframeDoc.body && (iframeDoc.querySelector('.choice-btn') || iframeDoc.querySelector('#timer-display') || iframeDoc.querySelector('#quiz-container'))) {
            injectBaseStyles(iframeDoc);
            injectCustomStylesToIframe(iframeDoc);
            applyDarkModeToIframe(bodyElement.classList.contains('dark-mode'));
            addSearchButtonsToIframe(); 
            setAppHeight();
            
            updateRubyButtonVisibility();

            if (!iframeDoc.body.classList.contains('choice-listeners-added')) {
                const finishBtn = iframeDoc.getElementById('finish-btn');
                if (finishBtn) { finishBtn.addEventListener('click', handleQuizFinished); }
                iframeDoc.body.classList.add('choice-listeners-added');
            }
            if (!iframeDoc.body.classList.contains('scroll-time-listener-added')) {
                iframe.contentWindow.addEventListener('scroll', () => {
                    if (!scrollInterval) { updateCountdownDisplay(); }
                });
                iframeDoc.body.classList.add('scroll-time-listener-added');
            }
            const isDebugScrollEnabled = localStorage.getItem(SCROLL_DEBUG_KEY) === 'true';
            if (isPC || isDebugScrollEnabled) {
                try {
                    currentIframeSrcKey = iframe.contentWindow.location.pathname + iframe.contentWindow.location.search;
                    const quizItems = iframeDoc.querySelectorAll('.quiz-item');
                    totalQuestionsInIframe = quizItems.length;
                    if (totalQuestionsInIframe > 1) {
                        populateStopQuestionSelect(totalQuestionsInIframe);
                        stopQuestionSelect.style.display = 'inline-block';
                        stopQuestionLabel.style.display = 'inline';
                    } else {
                        stopQuestionSelect.style.display = 'none';
                        stopQuestionLabel.style.display = 'none';
                    }
                } catch (e) {
                    console.warn("Failed to setup stop question select:", e);
                    stopQuestionSelect.style.display = 'none';
                    stopQuestionLabel.style.display = 'none';
                }
            } else {
                stopQuestionSelect.style.display = 'none';
                stopQuestionLabel.style.display = 'none';
            }
            updateCountdownDisplay();
        } else {
            setTimeout(setupIframeContent, 50); 
        }
    } catch (e) {
        setTimeout(setupIframeContent, 50);
    }
}

function updateFooterUIVisibility() {
    try {
        const iframeSrc = iframe.contentWindow.location.href;
        const pagesToHideSearch = ['timer-portrait.html', 'timer-landscape.html', 'quiz_english.html', 'manual.html'];
        const shouldHide = pagesToHideSearch.some(page => iframeSrc.includes(page));
        if (shouldHide) {
            searchContainer.style.display = 'none';
        } else {
            searchContainer.style.display = 'flex';
        }
    } catch (e) {
        searchContainer.style.display = 'flex';
        console.warn("iframeのURL取得に失敗したため、検索ボックスの表示状態を変更できませんでした:", e.message);
    }
}

iframe.addEventListener('load', () => {
    handleQuizFinished(); 
    setupIframeContent();
    updateFooterUIVisibility();
    updateRubyButtonVisibility();
    const isRubyEnabled = localStorage.getItem('rubyVisible') === 'true';
    try {
        iframe.contentWindow.postMessage({ type: 'setRubyState', state: isRubyEnabled }, '*');
    } catch (e) {}
});

const scrollControls = document.getElementById('scroll-controls');
const speedSelect = document.getElementById('scroll-speed-select');
const countdownDisplay = document.getElementById('scroll-countdown');
const toggleCheckbox = document.getElementById('scroll-toggle-checkbox');
const stopQuestionSelect = document.getElementById('scroll-stop-question-select');
const stopQuestionLabel = document.getElementById('scroll-stop-label');
const SCROLL_SPEED_KEY = 'quizAutoScrollSpeed';
const STOP_QUESTION_KEY_PREFIX = 'quizAutoScrollStopQ_';
const SCROLL_DEBUG_KEY = 'quizDebugScrollMode';
const SCROLL_INTERVAL_MS = 20;
let scrollInterval = null;
let countdownInterval = null;
let currentScrollSpeed = 1.0; 
let currentStopQuestion = 1;
let totalQuestionsInIframe = 0;
let currentIframeSrcKey = '';

function populateSpeedSelect() {
    const savedSpeed = localStorage.getItem(SCROLL_SPEED_KEY) || '1.0';
    currentScrollSpeed = parseFloat(savedSpeed); 
    for (let i = 5; i <= 50; i++) {
        const speedValue = (i / 10).toFixed(1);
        const option = document.createElement('option');
        option.value = speedValue;
        option.textContent = speedValue;
        if (speedValue === savedSpeed) { option.selected = true; }
        speedSelect.appendChild(option);
    }
}

function populateStopQuestionSelect(totalQuestions) {
    stopQuestionSelect.innerHTML = '';
    for (let i = 2; i <= totalQuestions; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        stopQuestionSelect.appendChild(option);
    }
    const storageKey = STOP_QUESTION_KEY_PREFIX + currentIframeSrcKey;
    const savedStopQuestion = localStorage.getItem(storageKey);
    let defaultStopQuestion = totalQuestions;
    if (savedStopQuestion) {
        let savedNum = parseInt(savedStopQuestion, 10);
        if (savedNum < 2) { savedNum = 2; }
        if (savedNum >= 2 && savedNum <= totalQuestions) { defaultStopQuestion = savedNum; }
    }
    stopQuestionSelect.value = defaultStopQuestion;
    currentStopQuestion = defaultStopQuestion;
}

function formatTime(totalSeconds) {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${String(mins).padStart(2, '0')}分${String(secs).padStart(2, '0')}秒`;
}

function getRemainingScrollData() {
    try {
        const iWin = iframe.contentWindow;
        const iDoc = iframe.contentDocument; 
        const iDocEl = iDoc.documentElement;
        if (!iWin || !iDocEl || totalQuestionsInIframe <= 1) return { pixels: 0, seconds: 0 };
        let targetY = 0;
        const targetElement = iDoc.getElementById(`quiz-${currentStopQuestion - 1}`); 
        if (targetElement) {
            const maxScrollY = iDocEl.scrollHeight - iWin.innerHeight;
            let headerOffset = 0;
            const headerElement = iDoc.getElementById('quiz-header');
            if (headerElement) { headerOffset = headerElement.offsetHeight + 10; }
            const calculatedTargetY = targetElement.offsetTop - headerOffset;
            targetY = Math.max(0, Math.min(calculatedTargetY, maxScrollY));
        } else {
            targetY = iDocEl.scrollHeight - iWin.innerHeight; 
        }
        const currentY = iWin.scrollY;
        const remainingPixels = targetY - currentY;
        if (remainingPixels <= 0) return { pixels: 0, seconds: 0 };
        const speedSetting = currentScrollSpeed; 
        const pixelsPerSecond = speedSetting * (1000 / SCROLL_INTERVAL_MS);
        const remainingSeconds = (pixelsPerSecond > 0) ? (remainingPixels / pixelsPerSecond) : 0;
        return { pixels: remainingPixels, seconds: remainingSeconds };
    } catch (e) {
        return { pixels: 0, seconds: 0 };
    }
}

function updateCountdownDisplay(isStopped = false) {
    if (isStopped) { countdownDisplay.textContent = '00分00秒'; return; }
    const data = getRemainingScrollData();
    countdownDisplay.textContent = formatTime(data.seconds);
}

function startAutoScroll() {
    clearInterval(scrollInterval);
    clearInterval(countdownInterval);
    try {
        if (iframe.contentWindow && typeof iframe.contentWindow.finishQuiz === 'function') {
            iframe.contentWindow.finishQuiz(false);
        }
    } catch (e) { console.error("Failed to call iframe.finishQuiz(false):", e); }
    setTimeout(() => {
        if (!toggleCheckbox.checked) { return; }
        scrollInterval = setInterval(() => {
            try {
                const iWin = iframe.contentWindow;
                const iDoc = iframe.contentDocument; 
                const iDocEl = iDoc.documentElement;
                const iViewHeight = iWin.innerHeight;
                const maxScrollY = iDocEl.scrollHeight - iViewHeight;
                let targetY = maxScrollY;
                let isTargetingEnd = true;
                if (totalQuestionsInIframe > 1) {
                    const targetElement = iDoc.getElementById(`quiz-${currentStopQuestion - 1}`);
                    if (targetElement) {
                        isTargetingEnd = false; 
                        let headerOffset = 0;
                        const headerElement = iDoc.getElementById('quiz-header');
                        if (headerElement) { headerOffset = headerElement.offsetHeight + 10; }
                        const calculatedTargetY = targetElement.offsetTop - headerOffset;
                        targetY = Math.max(0, Math.min(calculatedTargetY, maxScrollY));
                    }
                }
                const currentY = iWin.scrollY;
                if ((iWin.innerHeight + currentY + 2) >= iDocEl.scrollHeight) {
                    stopAutoScroll(false);
                    return;
                }
                if (!isTargetingEnd) {
                    if ((currentY + currentScrollSpeed) >= targetY) {
                        iWin.scrollTo({ top: targetY, behavior: 'auto' }); 
                        stopAutoScroll(false);
                        return;
                    }
                }
                iWin.scrollBy(0, currentScrollSpeed); 
            } catch (e) { stopAutoScroll(false); }
        }, SCROLL_INTERVAL_MS);
        countdownInterval = setInterval(updateCountdownDisplay, 1000);
        updateCountdownDisplay();
    }, 100);
}

function stopAutoScroll(shouldResetQuiz) {
    clearInterval(scrollInterval);
    scrollInterval = null;
    clearInterval(countdownInterval);
    countdownInterval = null;
    updateCountdownDisplay(true);
    toggleCheckbox.checked = false;
    if (shouldResetQuiz) {
        try {
            if (iframe.contentWindow && typeof iframe.contentWindow.resetQuiz === 'function') {
                iframe.contentWindow.resetQuiz();
            }
        } catch (e) { console.error("Failed to call iframe.resetQuiz():", e); }
    }
}

function handleScrollToggle() {
    if (toggleCheckbox.checked) { startAutoScroll(); }
    else { stopAutoScroll(false); }
}

function handleSpeedChange() {
    const newSpeed = speedSelect.value;
    localStorage.setItem(SCROLL_SPEED_KEY, newSpeed);
    currentScrollSpeed = parseFloat(newSpeed);
    updateCountdownDisplay();
}

function handleStopQuestionChange() {
    const newStopQ = parseInt(stopQuestionSelect.value, 10);
    currentStopQuestion = newStopQ;
    const storageKey = STOP_QUESTION_KEY_PREFIX + currentIframeSrcKey;
    localStorage.setItem(storageKey, newStopQ);
    updateCountdownDisplay();
}

function updateScrollUIVisibility() {
    const isDebugScrollEnabled = localStorage.getItem(SCROLL_DEBUG_KEY) === 'true';
    const shouldShowScroll = isPC || isDebugScrollEnabled;
    if (shouldShowScroll) {
        scrollControls.style.display = 'flex';
        if (!scrollControls.dataset.initialized) { 
            populateSpeedSelect();
            speedSelect.addEventListener('change', handleSpeedChange);
            stopQuestionSelect.addEventListener('change', handleStopQuestionChange);
            toggleCheckbox.addEventListener('change', handleScrollToggle);
            scrollControls.dataset.initialized = 'true';
        }
    } else {
        scrollControls.style.display = 'none';
        if (scrollInterval) { stopAutoScroll(true); }
    }
}

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
    setupIframeContent(); 
}

const isPC = !isMobile();

document.addEventListener('DOMContentLoaded', () => {
    displayLastUpdated();
    loadQuizList();
    setupMobileMenuLayout(); 
    loadSearchHistory();
    updateScrollUIVisibility();
    syncRubyButtonState();
});
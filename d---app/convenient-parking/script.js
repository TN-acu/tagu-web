let isZoomed = false;
let scale = 1;
let pan = { x: 0, y: 0 };
let applyTransform;

document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    const parkingArea = document.getElementById('parking-area');
    const simulatorContainer = document.getElementById('simulator-container');
    const draggables = document.querySelectorAll('.draggable');
    const resetButton = document.getElementById('reset-button');
    const manualButton = document.getElementById('manual-button');
    const northMark = document.getElementById('north-mark');
    const saveButton = document.getElementById('save-button');
    const loadButton = document.getElementById('load-button');
    const slotSelect = document.getElementById('slot-select');
    const gameButton = document.getElementById('game-button');
    const exitGameButton = document.getElementById('exit-game-button');
    const retryButton = document.getElementById('retry-button');
    const exitAfterGameButton = document.getElementById('exit-after-game-button');
    const autoSaveStorageKey = 'parkingSimulatorLayout';
    const slotStorageKeyPrefix = 'parkingSimulatorSlot_';

    const dialogOverlay = document.getElementById('custom-dialog-overlay');
    const dialogMessage = document.getElementById('custom-dialog-message');
    const dialogButtons = document.getElementById('custom-dialog-buttons');

    let countdownTimerId = null; 

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
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
    }

    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 500);
    }, 2500);

    const showDialog = () => {
        history.pushState({ dialogOpen: true }, '', '#dialog');
        dialogOverlay.classList.remove('dialog-hidden');
    };
    const hideDialog = () => {
        dialogOverlay.classList.add('dialog-hidden');
    };

    const customAlert = (message) => {
        dialogMessage.textContent = message;
        dialogButtons.innerHTML = '<button class="dialog-btn-confirm">OK</button>';
        dialogButtons.querySelector('button').onclick = () => {
            if(history.state && history.state.dialogOpen) history.back();
            hideDialog();
        };
        showDialog();
    };

    const customConfirm = (message) => {
        return new Promise((resolve) => {
            dialogMessage.textContent = message;
            dialogButtons.innerHTML = `
                <button class="dialog-btn-cancel">キャンセル</button>
                <button class="dialog-btn-confirm">OK</button>
            `;
            dialogButtons.querySelector('.dialog-btn-confirm').onclick = () => {
                hideDialog();
                resolve(true);
            };
            dialogButtons.querySelector('.dialog-btn-cancel').onclick = () => {
                hideDialog();
                resolve(false);
            };
            dialogOverlay.classList.remove('dialog-hidden');
        });
    };

    let northClickCount = 0;
    let northClickTimer = null;
    let startPan = { x: 0, y: 0 };
    let isPanning = false;

    applyTransform = ({ withTransition = false } = {}) => {
        const containerWidth = simulatorContainer.offsetWidth;
        const containerHeight = simulatorContainer.offsetHeight;

        const maxPanX = Math.max(0, (containerWidth * scale - containerWidth) / 2);
        const maxPanY = Math.max(0, (containerHeight * scale - containerHeight) / 2);
        
        pan.x = Math.max(-maxPanX, Math.min(maxPanX, pan.x));
        pan.y = Math.max(-maxPanY, Math.min(maxPanY, pan.y));

        if (withTransition) {
            simulatorContainer.style.transition = 'transform 0.3s ease-in-out';
        } else {
            simulatorContainer.style.transition = 'none';
        }

        simulatorContainer.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})`;
    };
    
    if (localStorage.getItem('request_zoom_reset') === 'true') {
        localStorage.removeItem('request_zoom_reset');

        const handleViewportResize = () => {
            if (window.visualViewport && window.visualViewport.scale > 1) {
                scale = 1;
                pan = { x: 0, y: 0 };
                isZoomed = false;
                applyTransform({ withTransition: false });
                window.visualViewport.removeEventListener('resize', handleViewportResize);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleViewportResize);
            setTimeout(() => {
                window.visualViewport.removeEventListener('resize', handleViewportResize);
            }, 2000);
        }
    }

const presetLayout = [
        { id: 'car_3395_1',   x: 40.13, y: 29.89, rotation: 0.00, w: 8.4, h: 4.7, column: 'right' },
        { id: 'car_3395_2',   x: 40.34, y: 36.82, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_12',  x: 40.76, y: 43.99, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_13',  x: 40.76, y: 51.03, rotation: 0.00, w: 8.4, h: 4.7, column: 'right' },
        { id: 'car_3395_14',  x: 40.98, y: 58.08, rotation: 0.00, w: 8.4, h: 4.7, column: 'right' },
        { id: 'car_3395_15',  x: 41.40, y: 65.01, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_16',  x: 41.61, y: 71.93, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_17',  x: 41.40, y: 78.98, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_18',  x: 32.70, y: 13.00, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_19',  x: 32.70, y: 20.17, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3930_1',   x: 32.91, y: 35.97, rotation: 0.00, w: 8.4, h: 5.3, column: 'left' },
        { id: 'car_4350_1',   x: 79.41, y: 67.31, rotation: 0.00, w: 8.4, h: 5.9, column: 'right' },
        { id: 'car_4350_2',   x: 22.29, y: 29.65, rotation: 0.00, w: 8.4, h: 5.9, column: 'left' },
        { id: 'car_4360_1',   x: 22.29, y: 39.00, rotation: 0.00, w: 8.4, h: 5.9, column: 'left' },
        { id: 'car_4650_1',   x: 22.51, y: 48.60, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_2',   x: 22.51, y: 58.57, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_3',   x: 32.91, y: 53.22, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_4',   x: 33.76, y: 62.33, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_5',   x: 32.91, y: 43.74, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4740_2',   x: 22.93, y: 68.41, rotation: 0.00, w: 8.4, h: 6.4, column: 'left' },
        { id: 'space_1000_1',  x: 40.34, y: 77.40, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_2',  x: 77.07, y: 35.84, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_3',  x: 31.63, y: 11.54, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_4',  x: 39.92, y: 63.43, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_5',  x: 39.70, y: 56.38, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_6',  x: 76.43, y: 37.91, rotation: 0.00, w: 8.4, h: 1.3, column: 'right' },
        { id: 'space_1000_7',  x: 40.34, y: 70.35, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_8',  x: 31.63, y: 18.59, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_15', x: 39.28, y: 35.36, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_16', x: 39.92, y: 49.45, rotation: 0.00, w: 8.4, h: 1.3, column: 'right' },
        { id: 'space_1000_17', x: 31.00, y: 42.04, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_18', x: 32.48, y: 60.75, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_19', x: 38.85, y: 28.19, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_20', x: 31.63, y: 51.52, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_21', x: 39.49, y: 42.41, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1500_1',  x: 77.92, y: 52.61, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_2',  x: 78.13, y: 43.26, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_3',  x: 22.51, y: 66.10, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_4',  x: 22.08, y: 36.57, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_5',  x: 77.71, y: 49.57, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_6',  x: 77.49, y: 46.66, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_7',  x: 78.34, y: 56.62, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_8',  x: 22.29, y: 46.17, rotation: 1.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_9',  x: 22.29, y: 56.14, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
    ];

        let activeElement = null;
    let dragTarget = null;
    let longPressTimer = null;
    let initialX, initialY, offsetX, offsetY;
    let startEventX, startEventY;

    const removeHandles = () => {
        const existingHandles = document.querySelectorAll('.rotate-handle');
        existingHandles.forEach(h => h.remove());
    };

    const deactivateAll = () => {
        if (!activeElement) return;
        removeHandles();
        activeElement.classList.remove('is-active');
        activeElement = null;
    };
    
    const rotateElement = (degrees) => {
        if (!activeElement) return;
        const currentTransform = activeElement.style.transform || '';
        const currentRotation = (currentTransform.match(/rotate\(([^deg]+)deg\)/) || [, '0'])[1];
        const newAngle = parseFloat(currentRotation) + degrees;
        activeElement.style.transform = `rotate(${newAngle}deg)`;
        saveLayout();
    };

    const setActive = (element) => {
        if (activeElement === element) return;
        deactivateAll();

        activeElement = element;
        activeElement.classList.add('is-active');

        const handles = [
            { pos: 'left-handle', symbol: '↺', dir: -5 },
            { pos: 'right-handle', symbol: '↻', dir: 5 }
        ];

        handles.forEach(h => {
            const handle = document.createElement('div');
            handle.className = `rotate-handle ${h.pos}`;
            handle.textContent = h.symbol;
            handle.addEventListener('click', (e) => {
                e.stopPropagation();
                rotateElement(h.dir);
            });
            activeElement.appendChild(handle);
        });
    };
    
    const onLongPress = (element) => {
        setActive(element);
        longPressTimer = null;
    };

    const applyLayout = (layout) => {
        deactivateAll();
        draggables.forEach(elem => {
            const layoutItem = layout.find(item => item.id === elem.id);
            if (layoutItem) {
                elem.style.left = `${layoutItem.x}%`;
                elem.style.top = `${layoutItem.y}%`;
                elem.style.transform = `rotate(${layoutItem.rotation || 0}deg)`;
            }
        });
    };
    
    const getCurrentLayout = () => {
        const layout = [];
        draggables.forEach(elem => {
            const transform = elem.style.transform || '';
            const rotation = (transform.match(/rotate\(([^deg]+)deg\)/) || [, '0'])[1];
            const preset = presetLayout.find(item => item.id === elem.id);
            if (!preset) return;

            const posXPercent = (elem.offsetLeft / parkingArea.clientWidth) * 100;
            const posYPercent = (elem.offsetTop / parkingArea.clientHeight) * 100;

            layout.push({ ...preset, x: posXPercent, y: posYPercent, rotation: parseFloat(rotation) });
        });
        return layout;
    };

    const saveLayout = () => {
        const layout = getCurrentLayout();
        localStorage.setItem(autoSaveStorageKey, JSON.stringify(layout));
    };

    const loadLayout = () => {
        try {
            const savedLayout = localStorage.getItem(autoSaveStorageKey);
            if (savedLayout && savedLayout !== '[]') {
                applyLayout(JSON.parse(savedLayout));
            } else {
                applyLayout(presetLayout);
            }
        } catch(e) { console.error("ローカルストレージの読み込みに失敗:", e); applyLayout(presetLayout); }
    };

    const saveToSlot = async () => {
        history.pushState({ dialogOpen: true }, '', '#dialog');
        const userChoice = await customConfirm('現在の配置を選択中のスロットに\nセーブしますか？');
        if (!userChoice) {
            if(history.state && history.state.dialogOpen) history.back();
            return;
        }
        if(history.state && history.state.dialogOpen) history.back();
        
        const slotIndex = slotSelect.value;
        const currentLayout = getCurrentLayout();
        
        const prefixes = ['①', '②', '③'];
        const prefix = prefixes[slotIndex - 1];
        const now = new Date();
        const hour = String(now.getHours()).padStart(2, '0');
        const dateText = `${prefix} ${now.getFullYear()}年${String(now.getMonth() + 1).padStart(2, '0')}月${String(now.getDate()).padStart(2, '0')}日 ${hour}時データ`;
        
        const dataToSave = {
            layout: currentLayout,
            dateText: dateText
        };
        
        localStorage.setItem(slotStorageKeyPrefix + slotIndex, JSON.stringify(dataToSave));
        slotSelect.options[slotIndex - 1].text = dateText;
        customAlert('セーブしました');
    };

    const loadFromSlot = async () => {
        const slotIndex = slotSelect.value;
        const savedData = localStorage.getItem(slotStorageKeyPrefix + slotIndex);

        if (!savedData) {
            customAlert('このスロットには\nデータがありません');
            return;
        }

        history.pushState({ dialogOpen: true }, '', '#dialog');
        const userChoice = await customConfirm('選択中のスロットのデータを\nロードしますか？\n（現在の配置は上書きされます）');
        if (!userChoice) {
            if(history.state && history.state.dialogOpen) history.back();
            return;
        }
        if(history.state && history.state.dialogOpen) history.back();

        try {
            const parsedData = JSON.parse(savedData);
            if (parsedData && parsedData.layout) {
                applyLayout(parsedData.layout);
                saveLayout();
                customAlert('ロードしました');
            } else {
                customAlert('データが不正です');
            }
        } catch(e) {
            customAlert('データの読み込みに失敗しました');
            console.error(e);
        }
    };
    
    const initializeSlots = () => {
        const lastSelectedSlot = localStorage.getItem('lastSelectedSlot');

        for (let i = 1; i <= 3; i++) {
            const savedData = localStorage.getItem(slotStorageKeyPrefix + i);
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    if (parsedData && parsedData.dateText) {
                        slotSelect.options[i - 1].text = parsedData.dateText;
                    }
                } catch(e) { /* データが不正な場合は何もしない */ }
            }
        }
        
        if (lastSelectedSlot) {
            slotSelect.value = lastSelectedSlot;
        }
    };

    const panMove = (e) => {
        if (!isPanning) return;
        e.preventDefault();
        const event = e.touches ? e.touches[0] : e;
        pan.x = event.clientX - startPan.x;
        pan.y = event.clientY - startPan.y;
        applyTransform();
    };

    const panEnd = () => {
        isPanning = false;
        document.removeEventListener('mousemove', panMove);
        document.removeEventListener('touchmove', panMove);
        document.removeEventListener('mouseup', panEnd);
        document.removeEventListener('touchend', panEnd);
    };

    // ▼▼▼ この dragStart 関数をすべて置き換えてください ▼▼▼
    const dragStart = (e) => {
        // カウントダウン中は操作を無効化
        const countdownOverlay = document.getElementById('game-start-countdown');
        if (!countdownOverlay.classList.contains('hidden')) {
            return;
        }

        if (Game.isActive) {
            return;
        }

        if (isZoomed && e.touches && e.touches.length === 2) {
            scale = 1;
            pan = { x: 0, y: 0 };
            isZoomed = false;
            applyTransform({ withTransition: false });
            if(history.state && history.state.zoomed) history.back();
            return;
        }
        
        const event = e.touches ? e.touches[0] : e;
        const draggableTarget = event.target.closest('.draggable');

        if (isZoomed && !draggableTarget) {
            isPanning = true;
            startPan.x = event.clientX - pan.x;
            startPan.y = event.clientY - pan.y;
            document.addEventListener('mousemove', panMove);
            document.addEventListener('touchmove', panMove, { passive: false });
            document.addEventListener('mouseup', panEnd);
            document.addEventListener('touchend', panEnd);
            return;
        }
        
        if (e.touches && e.touches.length > 1) {
            dragEnd();
            deactivateAll();
            return;
        }
        if (event.target.classList.contains('rotate-handle')) {
            dragTarget = null;
            return;
        }
        dragTarget = null;
        startEventX = event.clientX;
        startEventY = event.clientY;

        if (event.target.closest('.is-active')) {
            dragTarget = event.target.closest('.is-active');
        } else if (draggableTarget) {
            clearTimeout(longPressTimer);
            longPressTimer = setTimeout(() => onLongPress(draggableTarget), 500);
        }

        if (!dragTarget) return;

        initialX = event.clientX;
        initialY = event.clientY;
        offsetX = dragTarget.offsetLeft;
        offsetY = dragTarget.offsetTop;

        document.addEventListener('mousemove', dragMove);
        document.addEventListener('touchmove', dragMove, { passive: false });
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchend', dragEnd);
    };
    // ▲▲▲ ここまで置き換え ▲▲▲

    const dragMove = (e) => {
        if (e.touches && e.touches.length > 1) {
            dragEnd();
            return;
        }
        if (longPressTimer) {
            const event = e.touches ? e.touches[0] : e;
            const moveThreshold = 10;
            const dx = event.clientX - startEventX;
            const dy = event.clientY - startEventY;
            if (Math.sqrt(dx * dx + dy * dy) > moveThreshold) {
                clearTimeout(longPressTimer);
                longPressTimer = null;
            }
        }
        if (!dragTarget) return;
        e.preventDefault();
        const event = e.touches ? e.touches[0] : e;
        const dx = event.clientX - initialX;
        const dy = event.clientY - initialY;
        
        let newLeft = offsetX + dx;
        let newTop = offsetY + dy;

        const containerWidth = parkingArea.offsetWidth;
        const containerHeight = parkingArea.offsetHeight;
        const elemWidth = dragTarget.offsetWidth;
        const elemHeight = dragTarget.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, containerWidth - elemWidth));
        newTop = Math.max(0, Math.min(newTop, containerHeight - elemHeight));

        dragTarget.style.left = `${newLeft}px`;
        dragTarget.style.top = `${newTop}px`;
    };

    const dragEnd = () => {
        clearTimeout(longPressTimer);
        longPressTimer = null;
        if (dragTarget) {
           saveLayout();
        }
        dragTarget = null;
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('touchmove', dragMove);
        document.addEventListener('touchend', dragEnd);
    };
    
    const addOrderLabels = () => {
        const customIdOrder = [
            'car_3395_1', 'car_3395_2', 'car_3395_12', 'car_3395_13', 'car_3395_14', 'car_3395_15', 'car_3395_16', 'car_3395_17', 'car_3395_18', 'car_3395_19', 
            'car_3930_1', 'car_4650_5','car_4650_3','car_4350_2','car_4360_1','car_4650_1','car_4650_2','car_4740_2','car_4650_4','car_4350_1','car_4740_1'
        ];
        customIdOrder.forEach((id, index) => {
            const car = document.getElementById(id);
            if (car) {
                const existingLabel = car.querySelector('.order-label');
                if (existingLabel) car.removeChild(existingLabel);
                const labelElement = document.createElement('span');
                labelElement.className = 'order-label';
                labelElement.textContent = index + 1;
                car.appendChild(labelElement);
            }
        });
    };

    const modify1000mmLabels = () => {
        const spaces = document.querySelectorAll('.space[data-type="1000mm"], .space[data-type="1500mm"]');
        spaces.forEach(space => {
            const span = space.querySelector('span');
            if (span && span.innerHTML.includes('<br>')) {
                span.innerHTML = span.innerHTML.replace('<br>', ' ');
            }
        });
    };

    const showCssOutput = () => {
        let cssOutput = '';
        const sortedDraggables = Array.from(draggables).sort((a, b) => a.id.localeCompare(b.id, undefined, {numeric: true}));
        
        draggables.forEach(elem => {
            const id = elem.id;
            const xPercent = (elem.offsetLeft / parkingArea.offsetWidth) * 100;
            const yPercent = (elem.offsetTop / parkingArea.offsetHeight) * 100;
            const transform = elem.style.transform || '';
            const rotation = (transform.match(/rotate\(([^deg]+)deg\)/) || [, '0'])[1];
            cssOutput += `#${id} {\n  left: ${xPercent.toFixed(2)}%;\n  top: ${yPercent.toFixed(2)}%;\n  transform: rotate(${parseFloat(rotation).toFixed(2)}deg);\n}\n\n`;
        });
        
        const outputHTML = `
            <!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><title>CSS Output</title>
            <style>
                body { font-family: monospace; background-color: #f4f4f4; margin: 20px; }
                pre { white-space: pre-wrap; word-wrap: break-word; background-color: #fff; padding: 15px; border: 1px solid #ccc; border-radius: 5px; }
                .button-container { text-align: center; margin: 15px 0; }
                .back-button { font-size: 16px; padding: 10px 20px; border-radius: 8px; border: 1px solid #ccc; background-color: #eee; cursor: pointer; }
            </style>
            </head><body>
                <div class="button-container"><button class="back-button" onclick="window.close()">前の画面に戻る</button></div>
                <pre>${cssOutput}</pre>
                <div class="button-container"><button class="back-button" onclick="window.close()">前の画面に戻る</button></div>
            </body></html>`;

        const newWindow = window.open();
        newWindow.document.write(outputHTML.replace('${cssOutput}', cssOutput));
        newWindow.document.close();
    };


    // === イベントリスナー設定 ===
    simulatorContainer.addEventListener('mousedown', dragStart);
    simulatorContainer.addEventListener('touchstart', dragStart, { passive: false });

    draggables.forEach(elem => { elem.addEventListener('contextmenu', e => e.preventDefault()); });
    parkingArea.addEventListener('click', (e) => { if(e.target === parkingArea) { deactivateAll(); } });
    
     // ▼▼▼ この dblclick イベントリスナーを置き換えてください ▼▼▼
    simulatorContainer.addEventListener('dblclick', (e) => {
        // ゲームオーバー画面表示中は操作を無効化
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen.classList.contains('show')) {
            return;
        }

        // カウントダウン中は操作を無効化
        const countdownOverlay = document.getElementById('game-start-countdown');
        if (!countdownOverlay.classList.contains('hidden')) {
            return;
        }
        
        if (e.target.classList.contains('rotate-handle')) {
            return;
        }

        if (Game.isActive) {
            return;
        }

        e.preventDefault();
        const rect = simulatorContainer.getBoundingClientRect();
        
        const clientX = e.clientX;
        const clientY = e.clientY;

        if (isZoomed) {
            scale = 1;
            pan = { x: 0, y: 0 };
            isZoomed = false;
            if(history.state && history.state.zoomed) history.back();
        } else {
            scale = 2;
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            pan.x = (rect.width / 2 - x);
            pan.y = (rect.height / 2 - y);
            isZoomed = true;
            history.pushState({ zoomed: true }, '', '#zoom');
        }
        applyTransform({ withTransition: true });
    });
    // ▲▲▲ ここまで置き換え ▲▲▲

manualButton.addEventListener('click', () => {
        const manualOverlay = document.getElementById('manual-overlay');
        const manualBody = document.getElementById('manual-body');
        const manualCloseButton = document.getElementById('manual-close-button');

        const manualHTMLContent = `
            <h3>📖操作マニュアル</h3>
            <h4>■ 駐車場シミュレーターとは？</h4>
            <p>・各自のスマホだけで簡単に学校駐車場の駐車シミュレーションができるアプリです。taguアプリと同じ方法でスマホへインストールもできますが、ブラウザ上でもそのまま使えます。
            <br>・ 閲覧・編集・保存は各自のスマホ内で完結しているので、図形を好きに動かしても他の人のデータに影響することは一切ありません。
            </p>
            <h4>■ なんで作ったの？</h4>
            <p>・学校側から与えられた駐車スペースに対して、生徒側で工夫する手段としてアプリを作りました。
            <br>・今後の降雪時、または２・３年進級時に駐車レーン変更があった時、学校側は駐車場の効率的な使い方まではシミュレーションしてくれません。
            （学校側は「利用する生徒間で話し合って」というスタンスです。なので、ハチワレルールなどは作ってくれません）
            <br>・学校側へはシミュレーション用のパワーポイントデータと４ＷＤ(降雪時の駐車車間距離)のアンケート結果を渡す予定でしたが、
            それらを根拠に逆にこちらに不利益なルール変更がされないように譲渡は一旦保留にしています。
            （例えば２０２５年６月中間テスト直前にあったような不利益変更です。また、この駐車場シミュレーターの存在も伝えません）
            <br>・駐車場をお花畑に緑地化できるゲーム<span style="display: inline-block; padding: 2px 6px; background: linear-gradient(145deg, #ffc107, #ff9800); color: white; border-radius: 4px; font-weight: bold; vertical-align: middle;">🌸</span>もついでに作りました。
            </p>
            <h4>■ 駐車場シミュレーションの基本操作</h4>
            <p>・操作画面が小さいときは指で拡大してご利用ください。
            <br>・各車両図形<span style="display: inline-block; width: 17px; height: 35px; background-color: #bcc0f8; border: 1px solid #333; border-radius: 2px; vertical-align: middle; margin: 0 2px;"></span>とスペース計測図形（<span style="display: inline-block; width: 25px; height: 10px; background-color: #99f7a8; border: 1px solid #333; vertical-align: middle; margin: 0 2px;"></span>[1,000mm]と[1,500mm]）は長押ししてからドラッグすることで自由に移動できます。それ以外の画像や図形は移動できません。
            <br>・上記図形を一度タップすると左右に回転ハンドル（<span style="display: inline-block; width: 20px; height: 32px; background-color: orange; border-radius: 80%; vertical-align: middle; margin-right: 2px;"></span>↺ ↻）が表示され、これをタップすると図形が5度ずつ回転します。
            <br>・図形以外の何もない場所をタップすると回転ハンドルは消えます。</p>
            <h4>■ 配置の自動保存について</h4>
            <p>・アプリを閉じても次回開いた時には前回の配置が復元されます。(スマホ端末内ローカルに保存されます)</p>
            <h4>■ 特定の配置を記録する（セーブ・ロード）</h4>
            <p>・自動保存とは別に特定の配置を３つまで記録しておくことができます。
            <br>・<b>セーブ：</b>「空データ」または上書きしたいスロットをプルダウンから選択し「セーブ」ボタンを押すと、現在の配置がそのスロット(スマホ端末内ローカル)に記録されます。
            <br>・<b>ロード：</b>記録したスロットをプルダウンから選択し「ロード」ボタンを押すと、その配置が復元されます。
            <span class="warning">（現在画面の配置は上書きされます）</span></p><h4>■ 配置をリセットする</h4>
            <p>・画面上部のオレンジ色の「初期配置に戻す」ボタンを押すとすべての図形が最初の位置に戻ります。
            <br><span class="warning">※一度「初期配置に戻す」と戻せませんのでご注意ください。なお、この操作でセーブデータは消えません。</span></p>
            <h4>■ 配置の共有</h4>
            <p>・気に入った駐車場配置やハチワレルールよりも良いルールができたら各自のスマートフォンのスクリーンショット機能などを使って画像を保存して、駐車場ライングループなどで共有・提案してください😄</p>
            <h4>■ お花畑ゲーム 🌸</h4>
            <p>・制限時間60秒以内に駐車場をたくさんタップしてお花畑🌸にすることで、できるだけ多くのスコアを獲得するゲームです。
            <br>・駐車場エリアをタップすると🌸が設置され、🌸が図形にヒットするたびにスコアが獲得できます。
            <br>・<b>ボーナス：</b>連続でお花畑🌸化させるとコンボボーナスが、一つの🌸で複数の図形を同時に巻き込むとスコアが倍増するボーナスがあります。
            <br>・<b>ナワバリ率（お花畑率）：</b>画面全体のどれくらいをお花畑にできたかを示す割合です。<span class="warning">タイムアップ時のスコアに、このお花畑率を掛け合わせたものが最終スコアとなります。例えばタイムアップ時のスコアが 10,000 でお花畑率が 80％ なら、最終スコアは 8,000 です。</span></p>
        `;
        
        history.pushState({ manualOpen: true }, '', '#manual');

        manualBody.innerHTML = manualHTMLContent;
        manualOverlay.classList.remove('dialog-hidden');
        
        const closeManualOnClickOutside = (e) => {
            if (e.target === manualOverlay) {
                history.back();
            }
        };
        
        manualCloseButton.addEventListener('click', () => history.back(), { once: true });
        manualOverlay.addEventListener('click', closeManualOnClickOutside);
    });
    
    resetButton.addEventListener('click', async () => {
        history.pushState({ dialogOpen: true }, '', '#dialog');
        const userChoice = await customConfirm('すべての図形を初期配置に戻します。\nこの操作は元に戻せません。\nよろしいですか？');
        if(history.state && history.state.dialogOpen) history.back();

        if (userChoice) {
            if (Game.isActive) {
                clearTimeout(countdownTimerId);
                Game.stop();
            }
            localStorage.removeItem(autoSaveStorageKey);
            loadLayout();
        }
    });

    const startGameSequence = () => {
        const countdownOverlay = document.getElementById('game-start-countdown');
        const countdownNumber = document.getElementById('countdown-number');
        if (!countdownOverlay || !countdownNumber) return;
        
        history.pushState({ gameActive: true }, '', '#game');
        
        let count = 3;

        const startCountdown = () => {
            if (count > 0) {
                countdownNumber.textContent = count;
                count--;
                countdownTimerId = setTimeout(startCountdown, 1000);
            } else {
                countdownOverlay.classList.add('hidden');
                
                if (isZoomed) {
                    scale = 1;
                    pan = { x: 0, y: 0 };
                    isZoomed = false;
                    applyTransform({ withTransition: true });
                }
                Game.start();
            }
        };

        countdownOverlay.classList.remove('hidden');
        startCountdown();
    };

    if (!isMobile) {
        northMark.addEventListener('click', () => {
            showCssOutput();
        });
    }

    gameButton.addEventListener('click', startGameSequence);

    exitGameButton.addEventListener('click', async () => {
        const userChoice = await customConfirm('ゲームを終了しますか？');
        if (userChoice) {
            Game.stop();
            if (history.state && history.state.gameActive) {
                history.back();
            }
        }
    });

    // ▼▼▼ この retryButton イベントリスナーを置き換えてください ▼▼▼
    retryButton.addEventListener('click', () => {
        // 画面移行中は処理しない
        if (Game.isGameOverTransition) return;

        const gameOverScreen = document.getElementById('game-over-screen');
        gameOverScreen.classList.remove('show');
        gameOverScreen.classList.add('hidden');
        Game.resetElements();
        startGameSequence();
    });
    // ▲▲▲ ここまで置き換え ▲▲▲
    
    // ▼▼▼ この exitAfterGameButton イベントリスナーを置き換えてください ▼▼▼
    exitAfterGameButton.addEventListener('click', () => {
        // 画面移行中は処理しない
        if (Game.isGameOverTransition) return;

        const gameOverScreen = document.getElementById('game-over-screen');
        gameOverScreen.classList.remove('show');
        gameOverScreen.classList.add('hidden');
        Game.stop();
    });
    // ▲▲▲ ここまで置き換え ▲▲▲

    saveButton.addEventListener('click', async () => {
        await saveToSlot();
    });
    loadButton.addEventListener('click', async () => {
        await loadFromSlot();
    });

    slotSelect.addEventListener('change', () => {
        localStorage.setItem('lastSelectedSlot', slotSelect.value);
    });

    const displayVersionInfo = async () => {
        const filesToTrack = [
            'index.html',
            'style.css',
            'script.js',
            'game.js',
            'auth.js'
        ];
    
        try {
            const fetchPromises = filesToTrack.map(file => 
                fetch(file, { method: 'HEAD', cache: 'no-store' })
                    .then(response => {
                        if (!response.ok) return null;
                        const lastModified = response.headers.get('Last-Modified');
                        return lastModified ? new Date(lastModified) : null;
                    })
                    .catch(() => null)
            );
    
            const dates = await Promise.all(fetchPromises);
            const validDates = dates.filter(date => date instanceof Date);
    
            if (validDates.length > 0) {
                const latestDate = new Date(Math.max.apply(null, validDates));
                
                const year = latestDate.getFullYear();
                const month = String(latestDate.getMonth() + 1).padStart(2, '0');
                const day = String(latestDate.getDate()).padStart(2, '0');
                const hours = String(latestDate.getHours()).padStart(2, '0');
                const minutes = String(latestDate.getMinutes()).padStart(2, '0');
                const seconds = String(latestDate.getSeconds()).padStart(2, '0');
    
                const formattedDate = `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
                
                const versionInfoElement = document.getElementById('version-info');
                if (versionInfoElement) {
                    versionInfoElement.textContent = `${formattedDate}`;
                }
            }
        } catch (error) {
            console.error('Failed to fetch file modification dates:', error);
        }
    };

    const handleGameExitConfirmation = async () => {
        const userChoice = await customConfirm('ゲームを終了しますか？');
        if (userChoice) {
            Game.stop();
        } else {
            history.pushState({ gameActive: true }, '', '#game');
        }
    };

    // === 初期化処理 ===
    loadLayout();
    addOrderLabels();
    modify1000mmLabels();
    initializeSlots();
    displayVersionInfo();

    history.replaceState({ page: 'simulator' }, 'Simulator', window.location.pathname);

    window.addEventListener('popstate', (event) => {
        const manualOverlay = document.getElementById('manual-overlay');
        const countdownOverlay = document.getElementById('game-start-countdown');

        if (!dialogOverlay.classList.contains('dialog-hidden')) {
            hideDialog();
            return;
        }

        if (!manualOverlay.classList.contains('dialog-hidden')) {
            manualOverlay.classList.add('dialog-hidden');
            if (splashScreen) {
                splashScreen.style.display = 'flex';
                splashScreen.classList.remove('fade-out');
                setTimeout(() => {
                    splashScreen.classList.add('fade-out');
                    setTimeout(() => {
                        splashScreen.style.display = 'none';
                    }, 500);
                }, 1000);
            }
            return;
        }
        
        if (!countdownOverlay.classList.contains('hidden')) {
            clearTimeout(countdownTimerId);
            countdownOverlay.classList.add('hidden');
            Game.stop();
            return;
        }

        if (Game.isActive) {
            handleGameExitConfirmation();
            return;
        }

        if (isZoomed) {
            scale = 1;
            pan = { x: 0, y: 0 };
            isZoomed = false;
            applyTransform({ withTransition: true });
            return;
        }
    });
});
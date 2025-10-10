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
    const autoSaveStorageKey = 'parkingSimulatorLayout';
    const slotStorageKeyPrefix = 'parkingSimulatorSlot_';

    const dialogOverlay = document.getElementById('custom-dialog-overlay');
    const dialogMessage = document.getElementById('custom-dialog-message');
    const dialogButtons = document.getElementById('custom-dialog-buttons');

    // ▼▼▼ ここから変更 ▼▼▼
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
    // ▲▲▲ ここまで変更 ▲▲▲

    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        setTimeout(() => {
            splashScreen.style.display = 'none';
        }, 500);
    }, 2500);

    const showDialog = () => {
        dialogOverlay.classList.remove('dialog-hidden');
    };
    const hideDialog = () => {
        dialogOverlay.classList.add('dialog-hidden');
    };

    const customAlert = (message) => {
        dialogMessage.textContent = message;
        dialogButtons.innerHTML = '<button class="dialog-btn-confirm">OK</button>';
        dialogButtons.querySelector('button').onclick = hideDialog;
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
            showDialog();
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
        { id: 'car_3395_1',   x: 40.04, y: 29.26, rotation: 0.00, w: 8.4, h: 4.7, column: 'right' },
        { id: 'car_3395_2',   x: 40.04, y: 36.41, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_12',  x: 40.44, y: 43.43, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_13',  x: 40.85, y: 50.81, rotation: 0.00, w: 8.4, h: 4.7, column: 'right' },
        { id: 'car_3395_14',  x: 41.05, y: 57.49, rotation: 0.00, w: 8.4, h: 4.7, column: 'right' },
        { id: 'car_3395_15',  x: 40.85, y: 64.63, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_16',  x: 40.85, y: 71.66, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_17',  x: 41.05, y: 78.80, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_18',  x: 32.80, y: 13.13, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_19',  x: 33.00, y: 20.28, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3930_1',   x: 33.20, y: 36.06, rotation: 0.00, w: 8.4, h: 5.3, column: 'left' },
        { id: 'car_4350_1',   x: 80.08, y: 67.63, rotation: 0.00, w: 8.4, h: 5.9, column: 'right' },
        { id: 'car_4350_2',   x: 22.13, y: 29.03, rotation: 0.00, w: 8.4, h: 5.9, column: 'left' },
        { id: 'car_4360_1',   x: 22.13, y: 38.25, rotation: 0.00, w: 8.4, h: 5.9, column: 'left' },
        { id: 'car_4650_1',   x: 22.74, y: 48.04, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_2',   x: 22.74, y: 57.95, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_3',   x: 33.20, y: 53.46, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_4',   x: 34.00, y: 62.67, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_5',   x: 33.20, y: 44.01, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4740_2',   x: 23.34, y: 67.63, rotation: 0.00, w: 8.4, h: 6.4, column: 'left' },
        { id: 'space_1000_1',  x: 40.04, y: 77.07, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_2',  x: 77.67, y: 35.94, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_3',  x: 30.78, y: 11.29, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_4',  x: 40.24, y: 63.02, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_5',  x: 40.24, y: 56.22, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_6',  x: 77.06, y: 38.13, rotation: 0.00, w: 8.4, h: 1.3, column: 'right' },
        { id: 'space_1000_7',  x: 40.24, y: 69.93, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_8',  x: 30.99, y: 18.66, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_15', x: 37.83, y: 35.02, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_16', x: 39.44, y: 49.08, rotation: 0.00, w: 8.4, h: 1.3, column: 'right' },
        { id: 'space_1000_17', x: 30.18, y: 42.40, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_18', x: 32.60, y: 60.94, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_19', x: 37.83, y: 27.76, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_20', x: 31.79, y: 51.73, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_21', x: 39.64, y: 41.94, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1500_1',  x: 78.47, y: 52.88, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_2',  x: 78.67, y: 43.55, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_3',  x: 21.53, y: 65.32, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_4',  x: 21.53, y: 36.06, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_5',  x: 78.27, y: 49.77, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_6',  x: 78.07, y: 46.89, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_7',  x: 78.87, y: 56.91, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_8',  x: 21.73, y: 45.51, rotation: 1.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_9',  x: 21.73, y: 55.53, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
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
        const userChoice = await customConfirm('現在の配置を選択中のスロットに\nセーブしますか？');
        if (!userChoice) {
            return;
        }
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

        const userChoice = await customConfirm('選択中のスロットのデータを\nロードしますか？\n（現在の配置は上書きされます）');
        if (!userChoice) {
            return;
        }

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
    
    // ▼▼▼ この initializeSlots 関数をすべて置き換えてください ▼▼▼
    const initializeSlots = () => {
        // 保存されている前回のスロット番号を読み込む
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
        
        // もし保存されていた番号があれば、スロットに適用する
        if (lastSelectedSlot) {
            slotSelect.value = lastSelectedSlot;
        }
    };
    // ▲▲▲ ここまで置き換え ▲▲▲

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

    const dragStart = (e) => {
        if (Game.isActive) {
            return;
        }

        if (isZoomed && e.touches && e.touches.length === 2) {
            scale = 1;
            pan = { x: 0, y: 0 };
            isZoomed = false;
            applyTransform({ withTransition: false });
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
        document.removeEventListener('mouseup', dragEnd);
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
    
    simulatorContainer.addEventListener('dblclick', (e) => {
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
        } else {
            scale = 2;
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            pan.x = (rect.width / 2 - x);
            pan.y = (rect.height / 2 - y);
            isZoomed = true;
        }
        applyTransform({ withTransition: true });
    });

manualButton.addEventListener('click', () => {
        const manualOverlay = document.getElementById('manual-overlay');
        const manualBody = document.getElementById('manual-body');
        const manualCloseButton = document.getElementById('manual-close-button');

        // 表示するHTMLコンテンツ
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
            <p>・画面上部の<span style="display: inline-block; padding: 2px 6px; background: linear-gradient(145deg, #ffc107, #ff9800); color: white; border-radius: 4px; font-weight: bold; vertical-align: middle;">🌸</span>ボタンを押すとお花畑ゲームが始まります。
            <br>・駐車場エリアをタップするとカウントダウンが始まり、３秒後に🌸が咲き乱れて車などが消失します。
            <br>・図形や背景を🌸化するとスコアが獲得できます。連続で🌸化するとコンボボーナスが入ります。しかしハイスコアを取っても何も起こりません。
            <br>・ゲームをやめるには「🌸 ゲーム終了」ボタンを押してください。</p>
        `;

        // モーダルにHTMLを挿入して表示
        manualBody.innerHTML = manualHTMLContent;
        manualOverlay.classList.remove('dialog-hidden');
        
        // 閉じるボタンのイベントリスナー
// ▼▼▼ この closeManual 関数を置き換えてください ▼▼▼
        const closeManual = () => {
            // 1. まずマニュアル画面を非表示にする
            manualOverlay.classList.add('dialog-hidden');
            manualOverlay.removeEventListener('click', closeManualOnClickOutside);

            // 2. タイトル画面（splash-screen）を取得して表示する
            const splashScreen = document.getElementById('splash-screen');
            if (splashScreen) {
                splashScreen.style.display = 'flex';
                splashScreen.classList.remove('fade-out');

                // 3. 1秒後（1000ミリ秒後）にフェードアウト処理を開始
                setTimeout(() => {
                    splashScreen.classList.add('fade-out');
                    // フェードアウトアニメーション(0.5秒)が終わった後に非表示にする
                    setTimeout(() => {
                        splashScreen.style.display = 'none';
                    }, 500);
                }, 1000);
            }
        };
        // ▲▲▲ ここまで置き換え ▲▲▲
        
        const closeManualOnClickOutside = (e) => {
            if (e.target === manualOverlay) {
                closeManual();
            }
        };

        manualCloseButton.addEventListener('click', closeManual, { once: true });
        manualOverlay.addEventListener('click', closeManualOnClickOutside);
    });
    
    resetButton.addEventListener('click', async () => {
        const userChoice = await customConfirm('すべての図形を初期配置に戻します。\nこの操作は元に戻せません。\nよろしいですか？');
        if (userChoice) {
            if (Game.isActive) {
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

        let count = 3;

        const startCountdown = () => {
            if (count > 0) {
                countdownNumber.textContent = count;
                count--;
                setTimeout(startCountdown, 1000);
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

    exitGameButton.addEventListener('click', () => Game.stop());

    retryButton.addEventListener('click', () => {
        document.getElementById('game-over-screen').classList.add('hidden');
        startGameSequence();
    });

    saveButton.addEventListener('click', async () => {
        await saveToSlot();
    });
    loadButton.addEventListener('click', async () => {
        await loadFromSlot();
    });

    // ▼▼▼ ここから追加 ▼▼▼
    // スロットが変更されたら、その番号をlocalStorageに保存
    slotSelect.addEventListener('change', () => {
        localStorage.setItem('lastSelectedSlot', slotSelect.value);
    });
    // ▲▲▲ ここまで追加 ▲▲▲

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

    // === 初期化処理 ===
    loadLayout();
    addOrderLabels();
    modify1000mmLabels();
    initializeSlots();
    displayVersionInfo();
});
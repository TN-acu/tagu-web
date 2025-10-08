document.addEventListener('DOMContentLoaded', () => {
 
    // ▼▼▼ このブロック全体を置き換えてください ▼▼▼
    // localStorageに縮小リクエストがあるかチェック
    if (localStorage.getItem('request_zoom_reset') === 'true') {
        // リクエストがあれば、すぐに削除して再実行を防ぐ
        localStorage.removeItem('request_zoom_reset');

        // 0.1秒待ってから縮小処理を実行し、ブラウザの表示復元と競合しないようにする
        setTimeout(() => {
            scale = 1;
            pan = { x: 0, y: 0 };
            isZoomed = false;
            applyTransform({ withTransition: false });
        }, 100);
    }
    // ▲▲▲ ここまで置き換え ▲▲▲
 
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
    const autoSaveStorageKey = 'parkingSimulatorLayout';
    const slotStorageKeyPrefix = 'parkingSimulatorSlot_';

    const dialogOverlay = document.getElementById('custom-dialog-overlay');
    const dialogMessage = document.getElementById('custom-dialog-message');
    const dialogButtons = document.getElementById('custom-dialog-buttons');

// ▼▼▼ このブロック全体を置き換えてください ▼▼▼
    // ページ読み込み時にブラウザが拡大表示を復元した場合、強制的に縮小表示に戻す
    if (window.visualViewport && window.visualViewport.scale > 1) {
        // 即座に縮小処理を実行
        scale = 1;
        pan = { x: 0, y: 0 };
        isZoomed = false;
        applyTransform({ withTransition: false }); // アニメーションなしで適用
    }
    // ▲▲▲ ここまで置き換え ▲▲▲

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

    let isZoomed = false;
    let scale = 1;
    let pan = { x: 0, y: 0 };
    let startPan = { x: 0, y: 0 };
    let isPanning = false;

    const applyTransform = ({ withTransition = false } = {}) => {
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


    const presetLayout = [
        { id: 'car_3395_1',   x: 39.68, y: 29.98, rotation: 0.00, w: 8.4, h: 4.7, column: 'right' },
        { id: 'car_3395_2',   x: 39.24, y: 37.19, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_12',  x: 39.68, y: 44.14, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_13',  x: 39.97, y: 51.59, rotation: 0.00, w: 8.4, h: 4.7, column: 'right' },
        { id: 'car_3395_14',  x: 39.82, y: 58.63, rotation: 0.00, w: 8.4, h: 4.7, column: 'right' },
        { id: 'car_3395_15',  x: 39.97, y: 65.83, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_16',  x: 40.26, y: 72.78, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_17',  x: 41.00, y: 79.90, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_18',  x: 32.50, y: 13.07, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_19',  x: 32.36, y: 20.60, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3930_1',   x: 31.92, y: 36.68, rotation: 0.00, w: 8.4, h: 5.3, column: 'left' },
        { id: 'car_4350_1',   x: 81.99, y: 68.59, rotation: 0.00, w: 8.4, h: 5.9, column: 'right' },
        { id: 'car_4350_2',   x: 21.96, y: 29.48, rotation: 0.00, w: 8.4, h: 5.9, column: 'left' },
        { id: 'car_4360_1',   x: 22.25, y: 38.69, rotation: 0.00, w: 8.4, h: 5.9, column: 'left' },
        { id: 'car_4650_1',   x: 22.11, y: 48.49, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_2',   x: 22.11, y: 58.71, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_3',   x: 32.21, y: 54.44, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_4',   x: 81.70, y: 59.97, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_5',   x: 31.77, y: 44.81, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4740_2',   x: 22.69, y: 68.68, rotation: 0.00, w: 8.4, h: 6.4, column: 'left' },
        { id: 'space_1000_1',  x: 39.97, y: 78.22, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_2',  x: 79.65, y: 36.43, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_3',  x: 30.89, y: 11.39, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_4',  x: 39.53, y: 64.15, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_5',  x: 39.09, y: 57.04, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_6',  x: 79.06, y: 38.69, rotation: 0.00, w: 8.4, h: 1.3, column: 'right' },
        { id: 'space_1000_7',  x: 39.53, y: 71.19, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_8',  x: 31.19, y: 18.93, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_15', x: 38.95, y: 35.51, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_16', x: 38.80, y: 49.83, rotation: 0.00, w: 8.4, h: 1.3, column: 'right' },
        { id: 'space_1000_17', x: 31.04, y: 43.13, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_18', x: 80.38, y: 41.71, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_19', x: 38.95, y: 28.22, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_20', x: 31.33, y: 52.43, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_21', x: 38.80, y: 42.46, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1500_1',  x: 80.38, y: 53.60, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_2',  x: 80.67, y: 44.22, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_3',  x: 22.11, y: 66.25, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_4',  x: 21.96, y: 36.52, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_5',  x: 80.23, y: 50.50, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_6',  x: 79.94, y: 47.57, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_7',  x: 80.97, y: 56.45, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_8',  x: 22.25, y: 46.15, rotation: 1.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_9',  x: 22.25, y: 56.28, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
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
               // ▼▼▼ ここから変更（追加）▼▼▼
                // イベントが親要素(背景)へ伝わるのを防ぎ、ダブルタップによる拡大を抑制します。
                e.stopPropagation();
                // ▲▲▲ ここまで変更（追加）▲▲▲
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

            // ▼▼▼ ここから変更 ▼▼▼
            // 枠線の幅を含まない内側のサイズを基準に計算することで、座標のずれを防ぎます。
            const posXPercent = (elem.offsetLeft / parkingArea.clientWidth) * 100;
            const posYPercent = (elem.offsetTop / parkingArea.clientHeight) * 100;
            // ▲▲▲ ここまで変更 ▲▲▲

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
    
    const initializeSlots = () => {
        for (let i = 1; i <= 3; i++) {
            const savedData = localStorage.getItem(slotStorageKeyPrefix + i);
            if (savedData) {
                try {
                    const parsedData = JSON.parse(savedData);
                    if (parsedData && parsedData.dateText) {
                        slotSelect.options[i - 1].text = parsedData.dateText;
                    } else {
                        const prefixes = ['①', '②', '③'];
                        slotSelect.options[i-1].text = `${prefixes[i-1]} 空データ`;
                    }
                } catch(e) {
                    const prefixes = ['①', '②', '③'];
                    slotSelect.options[i - 1].text = `${prefixes[i-1]} 空データ`;
                }
            } else {
                const prefixes = ['①', '②', '③'];
                slotSelect.options[i - 1].text = `${prefixes[i-1]} 空データ`;
            }
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
    const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);

    simulatorContainer.addEventListener('mousedown', dragStart);
    simulatorContainer.addEventListener('touchstart', dragStart, { passive: false });

    draggables.forEach(elem => { elem.addEventListener('contextmenu', e => e.preventDefault()); });
    parkingArea.addEventListener('click', (e) => { if(e.target === parkingArea) { deactivateAll(); } });
    
    simulatorContainer.addEventListener('dblclick', (e) => {
        // ▼▼▼ ここから変更（追加）▼▼▼
        // ダブルタップの発生源が回転ハンドルの場合は、拡大縮小を実行しない
        if (e.target.classList.contains('rotate-handle')) {
            return;
        }
        // ▲▲▲ ここまで変更（追加）▲▲▲

        // ▼【修正】ゲームモード中は拡大機能を無効化
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

 // script.js

    // ▼▼▼ このイベントリスナー全体を置き換えてください ▼▼▼
    manualButton.addEventListener('click', () => {
        location.href = 'manual.html';
    });
    // ▲▲▲ ここまで置き換え ▲▲▲
    
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

    if (!isMobile) {
        northMark.addEventListener('click', () => {
            showCssOutput();
        });
    }

    // ▼▼▼ ここから変更 ▼▼▼
    gameButton.addEventListener('click', () => {
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
                
                // 元のゲーム開始処理を実行
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
    });
    // ▲▲▲ ここまで変更 ▲▲▲

    exitGameButton.addEventListener('click', () => Game.stop());

    saveButton.addEventListener('click', async () => {
        await saveToSlot();
    });
    loadButton.addEventListener('click', async () => {
        await loadFromSlot();
    });

    // === 初期化処理 ===
    loadLayout();
    addOrderLabels();
    modify1000mmLabels();
    initializeSlots();
});
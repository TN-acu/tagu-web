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
    const autoSaveStorageKey = 'parkingSimulatorLayout';
    const slotStorageKeyPrefix = 'parkingSimulatorSlot_';

    const dialogOverlay = document.getElementById('custom-dialog-overlay');
    const dialogMessage = document.getElementById('custom-dialog-message');
    const dialogButtons = document.getElementById('custom-dialog-buttons');

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

            const posXPercent = parseFloat(elem.style.left);
            const posYPercent = parseFloat(elem.style.top);

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
        const userChoice = await customConfirm('現在の配置を選択中のスロットにセーブしますか？');
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
            customAlert('このスロットにはデータがありません');
            return;
        }

        const userChoice = await customConfirm('選択中のスロットのデータをロードしますか？\n（現在の配置は上書きされます）');
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

    manualButton.addEventListener('click', () => {
        const manualHTML = `
            <!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>操作マニュアル</title>
                <style>
                    body{font-family:sans-serif;line-height:1.6;padding:20px 20px 100px 20px;font-size:16px;}
                    h3{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #eee;padding-bottom:10px;}
                    h4{border-left:4px solid #1e90ff;padding-left:8px;}
                    p{padding-left:12px;}
                    .warning{color:red;font-weight:bold;}
                    .dev-note{font-size:0.8em;color:#555;}
                    .manual-back-button{font-size:14px;padding:6px 14px;color:#333;background-color:#eee;border:1px solid #ccc;border-radius:6px;cursor:pointer;font-weight:bold;white-space:nowrap;-webkit-tap-highlight-color:transparent;}
                    .manual-back-button:active{background-color:#ddd;}
                </style>
            </head><body>
            <h3>
                <span>📖操作マニュアル</span>
                <button class="manual-back-button" onclick="window.close()">戻る</button>
            </h3>
            <h4>■ 駐車場シミュレーターとは？</h4>
             <p>・各自のスマホだけで簡単に学校駐車場の駐車シミュレーションができるアプリです。taguアプリと同じ方法でスマホへインストールもできますが、ブラウザ上でもそのまま使えます。
             </p>
            <h4>■ なんで作ったの？</h4>
             <p>・学校側から与えられた駐車スペースに対して、生徒側で工夫する手段としてアプリを作りました。
             <br>・今後の降雪時、または２・３年進級時に駐車レーン変更があった時、学校側は駐車場の効率的な使い方まではシミュレーションしてくれません。（学校側は「利用する生徒間で話し合って」というスタンスです）
             <br>・学校側へはシミュレーション用のパワーポイントデータと４ＷＤのアンケート結果を渡す予定でしたが、それらを根拠に逆にこちらに不利益なルール変更がされないように一旦保留にしています。（例えば6月中間テスト前にあったような不利益変更）
             <br>・駐車場をお花畑に緑地化できるゲーム<span style="display: inline-block; padding: 2px 6px; background: linear-gradient(145deg, #ffc107, #ff9800); color: white; border-radius: 4px; font-weight: bold; vertical-align: middle;">🌸</span>もついでに作りました。
             </p>
             <h4>■ 駐車場シミュレーションの基本操作</h4>
             <p>・画面が小さいときは指で拡大してご利用ください。
             <br>・各車両図形<span style="display: inline-block; width: 20px; height: 12px; background-color: #bcc0f8; border: 1px solid #333; border-radius: 2px; vertical-align: middle; margin: 0 2px;"></span>とスペース計測図形（<span style="display: inline-block; width: 25px; height: 8px; background-color: #99f7a8; border: 1px solid #333; vertical-align: middle; margin: 0 2px;"></span>[1,000mm]と[1,500mm]）は長押ししてからドラッグすることで自由に移動できます。それ以外の画像や図形は移動できません。
             <br>・上記図形を一度タップすると左右に回転ハンドル（<span style="display: inline-block; width: 14px; height: 14px; background-color: orange; border-radius: 50%; vertical-align: middle; margin-right: 2px;"></span>↺ ↻）が表示され、これをタップすると図形が5度ずつ回転します。
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
             <p>・気に入った駐車場配置やルールができたら各自のスマートフォンのスクリーンショット機能などを使って画像を保存して、駐車場ライングループなどで共有してください😄</p>
                     <h4>■ お花畑ゲーム 🌸</h4>
        <p>・画面上部の<span style="display: inline-block; padding: 2px 6px; background: linear-gradient(145deg, #ffc107, #ff9800); color: white; border-radius: 4px; font-weight: bold; vertical-align: middle;">🌸</span>ボタンを押すとお花畑ゲームが始まります。
        <br>・駐車場エリアをタップするとカウントダウンが始まり、３秒後に🌸が咲き乱れて車などが消失します。
        <br>・図形や背景を🌸化するとスコアが獲得できます。連続で🌸化するとコンボボーナスが入ります。しかしハイスコアを取っても何も起こりません。
        <br>・ゲームをやめるには「🌸 ゲーム終了」ボタンを押してください。</p>
             <p style="text-align: center; margin-top: 30px;">
                 <button class="manual-back-button" onclick="window.close()" style="padding: 10px 20px; font-size: 16px;">前の画面に戻る</button>
             </p>
             
             </body></html>`;
        
        const blob = new Blob([manualHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url);
        if (newWindow) {
            newWindow.addEventListener('pagehide', () => URL.revokeObjectURL(url), { once: true });
        }
    });
    
    resetButton.addEventListener('click', async () => {
        const userChoice = await customConfirm('すべての図形を初期配置に戻します。\nこの操作は元に戻せません。よろしいですか？');
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

    // ▼【修正】ゲーム開始時に拡大をリセットする処理を追加
    gameButton.addEventListener('click', () => {
        if (isZoomed) {
            scale = 1;
            pan = { x: 0, y: 0 };
            isZoomed = false;
            applyTransform({ withTransition: true });
        }
        Game.start();
    });

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
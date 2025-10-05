document.addEventListener('DOMContentLoaded', () => {
    const splashScreen = document.getElementById('splash-screen');
    const mainContent = document.getElementById('main-content');
    const parkingArea = document.getElementById('parking-area');
    const draggables = document.querySelectorAll('.draggable');
    const resetButton = document.getElementById('reset-button');
    const manualButton = document.getElementById('manual-button');
    const northMark = document.getElementById('north-mark');
    const saveButton = document.getElementById('save-button');
    const loadButton = document.getElementById('load-button');
    const slotSelect = document.getElementById('slot-select');
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
    }, 1000);

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

    const presetLayout = [
        { id: 'car_3395_1',   x: 39.70, y: 30.25, rotation: 0.00, w: 8.4, h: 4.7, column: 'right' },
        { id: 'car_3395_2',   x: 39.85, y: 37.63, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_12',  x: 39.70, y: 44.66, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_13',  x: 39.70, y: 52.12, rotation: 0.00, w: 8.4, h: 4.7, column: 'right' },
        { id: 'car_3395_14',  x: 40.44, y: 59.24, rotation: 0.00, w: 8.4, h: 4.7, column: 'right' },
        { id: 'car_3395_15',  x: 40.59, y: 66.53, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_16',  x: 40.59, y: 73.56, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_17',  x: 40.89, y: 80.93, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_18',  x: 31.70, y: 13.22, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3395_19',  x: 31.85, y: 20.51, rotation: 0.00, w: 8.4, h: 4.7, column: 'left' },
        { id: 'car_3930_1',   x: 32.15, y: 27.63, rotation: 0.00, w: 8.4, h: 5.3, column: 'left' },
        { id: 'car_4350_1',   x: 80.59, y: 68.90, rotation: 0.00, w: 8.4, h: 5.9, column: 'right' },
        { id: 'car_4350_2',   x: 32.74, y: 61.44, rotation: 0.00, w: 8.4, h: 5.9, column: 'left' },
        { id: 'car_4360_1',   x: 22.22, y: 36.10, rotation: 0.00, w: 8.4, h: 5.9, column: 'left' },
        { id: 'car_4650_1',   x: 22.67, y: 45.85, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_2',   x: 22.67, y: 56.02, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_3',   x: 32.00, y: 52.12, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_4',   x: 80.89, y: 59.75, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4650_5',   x: 32.30, y: 43.05, rotation: 0.00, w: 8.4, h: 6.2, column: 'left' },
        { id: 'car_4740_2',   x: 23.11, y: 66.36, rotation: 0.00, w: 8.4, h: 6.4, column: 'left' },
        { id: 'space_1000_1',  x: 40.59, y: 79.07, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_2',  x: 81.04, y: 36.78, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_3',  x: 31.41, y: 11.44, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_4',  x: 40.15, y: 64.83, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_5',  x: 39.70, y: 57.63, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_6',  x: 80.44, y: 39.15, rotation: 0.00, w: 8.4, h: 1.3, column: 'right' },
        { id: 'space_1000_7',  x: 40.15, y: 71.95, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_8',  x: 31.56, y: 18.90, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_15', x: 39.56, y: 35.85, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_16', x: 39.41, y: 50.34, rotation: 0.00, w: 8.4, h: 1.3, column: 'right' },
        { id: 'space_1000_17', x: 31.56, y: 50.59, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_18', x: 31.85, y: 26.10, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_19', x: 39.56, y: 28.47, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_20', x: 32.15, y: 59.83, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1000_21', x: 39.41, y: 42.88, rotation: 0.00, w: 8.4, h: 1.3, column: 'left' },
        { id: 'space_1500_1',  x: 80.15, y: 54.49, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_2',  x: 80.00, y: 44.58, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_3',  x: 22.96, y: 63.56, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_4',  x: 80.00, y: 41.44, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_5',  x: 80.15, y: 51.44, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_6',  x: 79.70, y: 48.05, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_7',  x: 23.26, y: 74.15, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_8',  x: 22.37, y: 43.56, rotation: 1.00, w: 8.4, h: 2.0, column: 'left' },
        { id: 'space_1500_9',  x: 22.67, y: 53.56, rotation: 0.00, w: 8.4, h: 2.0, column: 'left' },
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

    const dragStart = (e) => {
        if (e.touches && e.touches.length > 1) {
            dragEnd();
            deactivateAll();
            return;
        }

        const target = e.target;
        if (target.classList.contains('rotate-handle')) {
            dragTarget = null;
            return;
        }

        dragTarget = null;
        
        const event = e.touches ? e.touches[0] : e;
        startEventX = event.clientX;
        startEventY = event.clientY;

        if (target.closest('.is-active')) {
            dragTarget = target.closest('.is-active');
        } else {
            const draggableTarget = target.closest('.draggable');
            if (draggableTarget) {
                clearTimeout(longPressTimer);
                longPressTimer = setTimeout(() => onLongPress(draggableTarget), 500);
            }
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
        dragTarget.style.left = `${offsetX + dx}px`;
        dragTarget.style.top = `${offsetY + dy}px`;
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
        
        sortedDraggables.forEach(elem => {
            const id = elem.id;
            const xPercent = (elem.offsetLeft / parkingArea.offsetWidth) * 100;
            const yPercent = (elem.offsetTop / parkingArea.offsetHeight) * 100;
            const transform = elem.style.transform || '';
            const rotation = (transform.match(/rotate\(([^deg]+)deg\)/) || [, '0'])[1];
            cssOutput += `#${id} {\n  left: ${xPercent.toFixed(2)}%;\n  top: ${yPercent.toFixed(2)}%;\n  transform: rotate(${parseFloat(rotation).toFixed(2)}deg);\n}\n\n`;
        });
        
        const newWindow = window.open();
        newWindow.document.write('<pre>' + cssOutput + '</pre>');
        newWindow.document.close();
    };


    // === イベントリスナー設定 ===
    parkingArea.addEventListener('mousedown', dragStart);
    parkingArea.addEventListener('touchstart', dragStart, { passive: false });
    draggables.forEach(elem => { elem.addEventListener('contextmenu', e => e.preventDefault()); });
    parkingArea.addEventListener('click', (e) => { if(e.target === parkingArea) { deactivateAll(); } });
    
    manualButton.addEventListener('click', () => {
        // ▼【修正】マニュアルのレイアウトとテキストを更新
        const manualHTML = `
            <!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>操作マニュアル</title>
                <style>
                    body{font-family:sans-serif;line-height:1.6;padding:20px;max-width:800px;margin:0 auto;}
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
                <span>📖操作マニュアル📖</span>
                <button class="manual-back-button" onclick="window.close()"style="padding: 10px 20px; font-size: 16px;">前の画面に戻る</button>
            </h3>
            <h4>■ 駐車場シミュレーターとは？</h4>
            <p>・パワーポイントやパソコンなどをわざわざ使わずに、各自のスマホだけで学校駐車場のシミュレーションやルール考察、話し合いを行うことを目的にアプリ化しました。</p>
            <p>・ ２・３年進級時に駐車レーン変更があった時にもそのまま活用できると思います。</p>
            <h4>■ 基本操作</h4>
            <p>・各車両図形とスペース図形（[1,000mm]と[1,500mm]）は長押ししてからドラッグすることで自由に移動できます。それ以外の画像や図形は移動できません。
            <br>・上記図形を一度タップすると左右に回転ハンドル（↺ ↻）が表示され、これをタップすると図形が5度ずつ回転します。
            <br>・図形以外の何もない場所をタップすると回転ハンドルは消えます。</p>
            <h4>■ 配置の自動保存について</h4>
            <p>・図形の配置は操作するたびに自動であなたのスマホ端末内に保存されます。アプリを閉じても次回開いた時には前回の配置が復元されます。</p>
            <h4>■ 特定の配置を記録する（セーブ・ロード）</h4>
            <p>・自動保存とは別に特定の配置を３つまで記録しておくことができます。
            <br>・<b>セーブ：</b>「空データ」または上書きしたいスロットをプルダウンから選択し「セーブ」ボタンを押すと、現在の配置がそのスロット(あなたのスマホ端末内)に記録されます。
            <br>・<b>ロード：</b>記録したスロットをプルダウンから選択し「ロード」ボタンを押すと、その配置が復元されます。
            <span class="warning">（現在画面の配置は上書きされます）</span></p><h4>■ 配置をリセットする</h4><p>・画面上部のオレンジ色の「初期配置に戻す」ボタンを押すとすべての図形が最初の位置に戻ります。
            <br><span class="warning">※一度「初期配置に戻す」と戻せませんのでご注意ください。なお、この操作でセーブデータは消えません。</span></p>
            <h4>■ 配置の共有</h4>
            <p>・気に入った駐車場配置ができたら各自のスマートフォンのスクリーンショット機能などを使って画像を保存して駐車場ライングループなどで共有してください😄</p>
            <p style="text-align: center; margin-top: 30px;">
                <button class="manual-back-button" onclick="window.close()" style="padding: 10px 20px; font-size: 16px;">前の画面に戻る</button>
            </p>
            </body></html>`;
        const newWindow = window.open();
        newWindow.document.write(manualHTML);
        newWindow.document.close();
    });
    
    resetButton.addEventListener('click', async () => {
        const userChoice = await customConfirm('すべての図形を初期配置に戻します。\nこの操作は元に戻せません。よろしいですか？');
        if (userChoice) {
            localStorage.removeItem(autoSaveStorageKey);
            loadLayout();
        }
    });

    northMark.addEventListener('click', () => {
        northClickCount++;
        clearTimeout(northClickTimer);
        if (northClickCount === 3) {
            showCssOutput();
            northClickCount = 0;
        } else {
            northClickTimer = setTimeout(() => { northClickCount = 0; }, 1000);
        }
    });

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
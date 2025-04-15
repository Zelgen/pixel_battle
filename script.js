// Константы
const CANVAS_SIZE = 100;
const COOLDOWN_TIME = 20; // в секундах

// Цвета для палитры
const COLORS = [
    { name: 'белый', hex: '#ffffff' },
    { name: 'черный', hex: '#000000' },
    { name: 'красный', hex: '#FF0000' },
    { name: 'зеленый', hex: '#00FF00' },
    { name: 'синий', hex: '#0000FF' },
    { name: 'желтый', hex: '#FFFF00' },
    { name: 'голубой', hex: '#00FFFF' },
    { name: 'пурпурный', hex: '#FF00FF' },
    { name: 'оранжевый', hex: '#FFA500' },
    { name: 'фиолетовый', hex: '#800080' },
    { name: 'коричневый', hex: '#A52A2A' },
    { name: 'розовый', hex: '#FFC0CB' },
    { name: 'лайм', hex: '#32CD32' },
    { name: 'индиго', hex: '#4B0082' },
    { name: 'серый', hex: '#808080' },
    { name: 'светло-серый', hex: '#D3D3D3' }
];

// Глобальные переменные
let selectedColor = '#000000';
let selectedColorName = 'черный';
let cooldownActive = false;
let cooldownTimeLeft = 0;
let cooldownInterval = null;
let scale = 1;
let pixelSize = 5;
let pixelHistory = []; // история изменений пикселей

// Инициализация элементов DOM
let canvas, canvasContainer, colorPicker, timerDisplay, statusMessage, selectedColorDisplay, 
    zoomInButton, zoomOutButton, resetZoomButton, actionLog;

// Создание холста
function createCanvas() {
    // Создаем контейнер для координат
    const canvasWrapper = document.createElement('div');
    canvasWrapper.className = 'canvas-wrapper';
    
    // Создаем горизонтальные координаты (A-J)
    const hCoords = document.createElement('div');
    hCoords.className = 'h-coords';
    
    for (let i = 0; i < 10; i++) {
        const coord = document.createElement('div');
        coord.className = 'coord';
        coord.textContent = String.fromCharCode(65 + i); // A, B, C...
        hCoords.appendChild(coord);
    }
    
    // Создаем вертикальные координаты (1-10)
    const vCoords = document.createElement('div');
    vCoords.className = 'v-coords';
    
    for (let i = 0; i < 10; i++) {
        const coord = document.createElement('div');
        coord.className = 'coord';
        coord.textContent = i + 1; // 1, 2, 3...
        vCoords.appendChild(coord);
    }
    
    // Создаем угловой элемент
    const cornerElement = document.createElement('div');
    cornerElement.className = 'corner-element';
    
    // Очищаем контейнер холста
    canvasContainer.innerHTML = '';
    
    // Создаем новый canvas-элемент
    canvas = document.createElement('div');
    canvas.id = 'pixel-canvas';
    
    // Собираем все элементы
    canvasWrapper.appendChild(cornerElement);
    canvasWrapper.appendChild(hCoords);
    canvasWrapper.appendChild(vCoords);
    canvasWrapper.appendChild(canvas);
    canvasContainer.appendChild(canvasWrapper);
    
    // Создаем сетку пикселей
    for (let y = 0; y < 100; y++) {
        for (let x = 0; x < 100; x++) {
            const index = y * CANVAS_SIZE + x;
            
            const pixel = document.createElement('div');
            pixel.className = 'pixel';
            pixel.dataset.index = index;
            pixel.dataset.x = x;
            pixel.dataset.y = y;
            
            // Вычисляем сектор (A1-J10)
            const sectorX = String.fromCharCode(65 + Math.floor(x/10));
            const sectorY = Math.floor(y/10) + 1;
            // Вычисляем позицию внутри сектора
            const posX = x % 10;
            const posY = y % 10;
            
            pixel.dataset.coord = `${sectorX}${sectorY}:${posX}${posY}`;
            
            pixel.addEventListener('click', handlePixelClick);
            canvas.appendChild(pixel);
        }
    }
    
    // Устанавливаем размер сетки
    canvas.style.gridTemplateColumns = `repeat(${CANVAS_SIZE}, ${pixelSize}px)`;
    canvas.style.gridTemplateRows = `repeat(${CANVAS_SIZE}, ${pixelSize}px)`;
}

// Создание палитры цветов
function createColorPicker() {
    // Очищаем палитру
    colorPicker.innerHTML = '';
    
    // Создаем элементы для каждого цвета
    COLORS.forEach(color => {
        const colorOption = document.createElement('div');
        colorOption.className = 'color-option';
        colorOption.style.backgroundColor = color.hex;
        colorOption.dataset.color = color.hex;
        colorOption.dataset.name = color.name;
        colorOption.addEventListener('click', () => {
            // Удаляем класс selected у всех опций
            document.querySelectorAll('.color-option').forEach(option => {
                option.classList.remove('selected');
            });
            
            // Добавляем класс selected к выбранной опции
            colorOption.classList.add('selected');
            
            // Устанавливаем выбранный цвет
            selectedColor = color.hex;
            selectedColorName = color.name;
            selectedColorDisplay.textContent = color.name;
        });
        
        // Устанавливаем черный как выбранный по умолчанию
        if (color.hex === '#000000') {
            colorOption.classList.add('selected');
        }
        
        colorPicker.appendChild(colorOption);
    });
}

// Обработчик клика по пикселю
function handlePixelClick(e) {
    const pixel = e.target;
    const pixelIndex = pixel.dataset.index;
    const coord = pixel.dataset.coord;
    const oldColor = pixel.style.backgroundColor || 'rgb(255, 255, 255)';
    
    if (cooldownActive) {
        statusMessage.textContent = 'Подождите перед размещением следующего пикселя!';
        return;
    }
    
    pixel.style.backgroundColor = selectedColor;
    addLogEntry(`Пиксель цвета ${selectedColorName} размещен на позиции ${coord}`);
    
    // Сохраняем историю изменений
    pixelHistory.push({
        index: pixelIndex,
        oldColor: oldColor,
        newColor: selectedColor,
        coord: coord,
        time: new Date()
    });
    
    // Запускаем таймер перезарядки
    startCooldown(COOLDOWN_TIME);
    
    statusMessage.textContent = `Вы разместили пиксель цвета "${selectedColorName}" на позиции ${coord}`;
}

// Функция запуска таймера перезарядки
function startCooldown(time) {
    cooldownActive = true;
    cooldownTimeLeft = time;
    timerDisplay.textContent = cooldownTimeLeft;
    
    clearInterval(cooldownInterval);
    cooldownInterval = setInterval(() => {
        cooldownTimeLeft--;
        timerDisplay.textContent = cooldownTimeLeft;
        
        if (cooldownTimeLeft <= 0) {
            cooldownActive = false;
            clearInterval(cooldownInterval);
            statusMessage.textContent = 'Вы можете разместить новый пиксель';
        }
    }, 1000);
}

// Добавление записи в лог действий
function addLogEntry(message, type = '') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = `${getCurrentTime()} - ${message}`;
    actionLog.prepend(entry);
    
    // Ограничиваем количество записей в логе
    const entries = actionLog.querySelectorAll('.log-entry');
    if (entries.length > 50) {
        for (let i = 50; i < entries.length; i++) {
            entries[i].remove();
        }
    }
}

// Получение текущего времени в формате ЧЧ:ММ:СС
function getCurrentTime() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
}

// Обновление масштаба
function updateZoom() {
    const newPixelSize = Math.round(pixelSize * scale);
    
    canvas.style.gridTemplateColumns = `repeat(${CANVAS_SIZE}, ${newPixelSize}px)`;
    canvas.style.gridTemplateRows = `repeat(${CANVAS_SIZE}, ${newPixelSize}px)`;
    
    document.querySelectorAll('.pixel').forEach(pixel => {
        pixel.style.width = `${newPixelSize}px`;
        pixel.style.height = `${newPixelSize}px`;
        // Корректировка размера границы в зависимости от масштаба
        const borderWidth = scale <= 1 ? 1 : Math.max(1, Math.floor(scale));
        pixel.style.borderWidth = `${borderWidth}px`;
    });
    
    statusMessage.textContent = `Масштаб: ${scale * 100}%`;
}

// Инициализация обработчиков событий
function setupEventListeners() {
    // Обработчики кнопок зума
    zoomInButton.addEventListener('click', () => {
        if (scale < 3) {
            scale += 0.5;
            updateZoom();
        }
    });
    
    zoomOutButton.addEventListener('click', () => {
        if (scale > 0.5) {
            scale -= 0.5;
            updateZoom();
        }
    });
    
    resetZoomButton.addEventListener('click', () => {
        scale = 1;
        updateZoom();
    });
}

// Инициализация приложения
function init() {
    console.log("Инициализация приложения...");
    
    // Инициализируем ссылки на DOM-элементы
    canvasContainer = document.getElementById('canvas-container');
    colorPicker = document.getElementById('color-picker');
    timerDisplay = document.getElementById('timer');
    statusMessage = document.getElementById('status-message');
    selectedColorDisplay = document.getElementById('selected-color-display');
    zoomInButton = document.getElementById('zoom-in');
    zoomOutButton = document.getElementById('zoom-out');
    resetZoomButton = document.getElementById('reset-zoom');
    actionLog = document.getElementById('action-log');
    
    console.log("DOM-элементы инициализированы");
    
    // Проверяем, существуют ли необходимые элементы
    if (!canvasContainer) console.error("Элемент canvas-container не найден");
    if (!colorPicker) console.error("Элемент color-picker не найден");
    
    // Создаем холст и палитру
    if (canvasContainer) createCanvas();
    if (colorPicker) createColorPicker();
    
    console.log("Холст и палитра созданы");
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Устанавливаем начальное сообщение
    if (statusMessage) {
        statusMessage.textContent = 'Выберите цвет и нажмите на пиксель, чтобы раскрасить его';
    }
    
    console.log("Инициализация завершена");
}

// Запускаем инициализацию после загрузки страницы
document.addEventListener('DOMContentLoaded', init);
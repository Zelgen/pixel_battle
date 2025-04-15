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
let currentRole = 'player'; // по умолчанию - игрок
let pixelHistory = []; // история изменений пикселей
let currentUsername = null;
let isAuthenticated = false;

// Инициализация элементов DOM
let canvas, colorPicker, timerDisplay, statusMessage, selectedColorDisplay, 
    clearCanvasButton, zoomInButton, zoomOutButton, resetZoomButton, actionLog,
    adminRoleBtn, moderatorRoleBtn, playerRoleBtn, roleInfo, currentRoleDisplay, 
    roleDescription, adminControls, moderatorControls;

// Создание холста
function createCanvas() {
    // Очищаем холст
    canvas.innerHTML = '';
    
    // Создаем сетку пикселей
    for (let i = 0; i < CANVAS_SIZE * CANVAS_SIZE; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.dataset.index = i;
        pixel.addEventListener('click', handlePixelClick);
        canvas.appendChild(pixel);
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
    // Проверяем, авторизован ли пользователь
    if (!isAuthenticated) {
        showLoginForm();
        return;
    }
    
    const pixel = e.target;
    const pixelIndex = pixel.dataset.index;
    const oldColor = pixel.style.backgroundColor || 'rgb(255, 255, 255)';
    
    if (currentRole === 'admin') {
        // Администратор может размещать пиксели без ограничений
        pixel.style.backgroundColor = selectedColor;
        addLogEntry(`Админ разместил ${selectedColorName} пиксель на позиции ${pixelIndex}`, 'admin');
        // Сохраняем историю изменений
        pixelHistory.push({
            index: pixelIndex,
            oldColor: oldColor,
            newColor: selectedColor,
            time: new Date(),
            role: 'admin',
            username: currentUsername
        });
    } else if (currentRole === 'moderator') {
        // Модератор имеет кулдаун, но в два раза меньше чем у игрока
        if (cooldownActive) {
            statusMessage.textContent = 'Подождите перед размещением следующего пикселя!';
            return;
        }
        
        pixel.style.backgroundColor = selectedColor;
        addLogEntry(`Модератор разместил ${selectedColorName} пиксель на позиции ${pixelIndex}`, 'moderator');
        
        // Сохраняем историю изменений
        pixelHistory.push({
            index: pixelIndex,
            oldColor: oldColor,
            newColor: selectedColor,
            time: new Date(),
            role: 'moderator',
            username: currentUsername
        });
        
        // Запускаем таймер перезарядки с половинным временем
        startCooldown(COOLDOWN_TIME / 2);
    } else {
        // Обычный игрок
        if (cooldownActive) {
            statusMessage.textContent = 'Подождите перед размещением следующего пикселя!';
            return;
        }
        
        pixel.style.backgroundColor = selectedColor;
        addLogEntry(`Игрок разместил ${selectedColorName} пиксель на позиции ${pixelIndex}`);
        
        // Сохраняем историю изменений
        pixelHistory.push({
            index: pixelIndex,
            oldColor: oldColor,
            newColor: selectedColor,
            time: new Date(),
            role: 'player',
            username: currentUsername
        });
        
        // Запускаем таймер перезарядки
        startCooldown(COOLDOWN_TIME);
    }
    
    statusMessage.textContent = `Вы разместили пиксель цвета "${selectedColorName}"`;
}

// Функция запуска таймера перезарядки
function startCooldown(time) {
    if (currentRole === 'admin') return; // У админа нет кулдауна
    
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
    
    // Формируем сообщение с именем пользователя
    let formattedMessage = message;
    if (currentUsername && message.includes('разместил')) {
        formattedMessage = message.replace('разместил', `<b>${currentUsername}</b> разместил`);
    }
    
    entry.innerHTML = `${getCurrentTime()} - ${formattedMessage}`;
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

// Функция проверки авторизации
function setupAuth() {
    // Проверяем, залогинен ли пользователь
    const storedUsername = localStorage.getItem('pixelBattle_username');
    
    if (!storedUsername) {
        // Показываем форму логина
        showLoginForm();
    } else {
        // Устанавливаем текущего пользователя
        currentUsername = storedUsername;
        isAuthenticated = true;
        const storedRole = localStorage.getItem('pixelBattle_role') || 'player';
        
        // Проверяем права на роль (admin и moderator только для определенных пользователей)
        if ((storedRole === 'admin' && !isAdmin(storedUsername)) || 
            (storedRole === 'moderator' && !isModerator(storedUsername))) {
            switchRole('player');
        } else {
            switchRole(storedRole);
        }
        
        // Добавляем инфо о пользователе в интерфейс
        updateUserInfo();
    }
}

// Функция показа формы входа
function showLoginForm() {
    // Создаем модальное окно для авторизации
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    
    const form = document.createElement('div');
    form.className = 'auth-form';
    form.innerHTML = `
        <h3>Представьтесь, пожалуйста</h3>
        <input type="text" id="username-input" placeholder="Введите ваш никнейм" />
        <button id="login-button">Войти</button>
    `;
    
    modal.appendChild(form);
    document.body.appendChild(modal);
    
    // Добавляем обработчик для авторизации
    document.getElementById('login-button').addEventListener('click', () => {
        const username = document.getElementById('username-input').value.trim();
        
        if (username) {
            currentUsername = username;
            isAuthenticated = true;
            localStorage.setItem('pixelBattle_username', username);
            
            // Проверяем, имеет ли пользователь право на админа или модератора
            let role = 'player';
            if (isAdmin(username)) {
                role = 'admin';
            } else if (isModerator(username)) {
                role = 'moderator';
            }
            
            localStorage.setItem('pixelBattle_role', role);
            
            // Удаляем модальное окно
            document.body.removeChild(modal);
            
            // Обновляем интерфейс
            updateUserInfo();
            switchRole(role);
        }
    });
    
    // Фокус на поле ввода
    setTimeout(() => {
        document.getElementById('username-input').focus();
    }, 100);
    
    // Добавляем обработчик Enter для поля ввода
    document.getElementById('username-input').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('login-button').click();
        }
    });
}

// Функция обновления информации о пользователе в интерфейсе
function updateUserInfo() {
    // Добавляем инфо о пользователе в интерфейс
    const userInfo = document.createElement('div');
    userInfo.className = 'user-info';
    userInfo.innerHTML = `
        <span>Привет, <b>${currentUsername}</b>!</span>
        <button id="logout-button">Выйти</button>
    `;
    
    const existingUserInfo = document.querySelector('.user-info');
    if (existingUserInfo) {
        existingUserInfo.parentNode.replaceChild(userInfo, existingUserInfo);
    } else {
        document.querySelector('h1').insertAdjacentElement('afterend', userInfo);
    }
    
    // Добавляем обработчик для выхода
    document.getElementById('logout-button').addEventListener('click', () => {
        localStorage.removeItem('pixelBattle_username');
        localStorage.removeItem('pixelBattle_role');
        location.reload();
    });
}

// Проверка прав администратора (в реальном приложении это будет проверка на сервере)
function isAdmin(username) {
    // Список администраторов (в реальном приложении этот список будет храниться на сервере)
    const admins = ['admin', 'zelgen'];
    return admins.includes(username.toLowerCase());
}

// Проверка прав модератора
function isModerator(username) {
    // Список модераторов
    const moderators = ['moderator', 'mod'];
    return moderators.includes(username.toLowerCase());
}

// Функции для системы ролей
// Переключение роли
function switchRole(role) {
    // Проверяем права на роль
    if (role === 'admin' && !isAdmin(currentUsername)) {
        alert('У вас нет прав администратора');
        return;
    }
    if (role === 'moderator' && !isModerator(currentUsername)) {
        alert('У вас нет прав модератора');
        return;
    }
    
    // Если проверка прошла, переключаем роль
    currentRole = role;
    localStorage.setItem('pixelBattle_role', role);
    currentRoleDisplay.textContent = getRoleName(role);
    updateRoleDescription(role);
    updateRoleButtons(role);
    updateControlPanels(role);
    
    // Сбрасываем таймер перезарядки для админа
    if (role === 'admin') {
        cooldownActive = false;
        clearInterval(cooldownInterval);
        timerDisplay.textContent = '0';
        statusMessage.textContent = 'Админ может размещать пиксели без ограничений';
    }
    
    addLogEntry(`Роль изменена на: ${getRoleName(role)}`, 'system');
}

// Получение названия роли
function getRoleName(role) {
    switch(role) {
        case 'admin': return 'Администратор';
        case 'moderator': return 'Модератор';
        case 'player': return 'Игрок';
        default: return 'Неизвестная роль';
    }
}

// Обновление описания роли
function updateRoleDescription(role) {
    switch(role) {
        case 'admin':
            roleDescription.textContent = 'Администратор имеет полный контроль над холстом. Может размещать пиксели без ограничений, менять размер холста, сбрасывать таймеры и управлять пользователями.';
            break;
        case 'moderator':
            roleDescription.textContent = 'Модератор может размещать пиксели с интервалом 10 секунд, отменять изменения пикселей и сбрасывать таймеры игроков.';
            break;
        case 'player':
            roleDescription.textContent = 'Игрок может размещать пиксели на холсте с интервалом 20 секунд.';
            break;
    }
}

// Обновление кнопок ролей
function updateRoleButtons(role) {
    adminRoleBtn.classList.remove('active');
    moderatorRoleBtn.classList.remove('active');
    playerRoleBtn.classList.remove('active');
    
    switch(role) {
        case 'admin':
            adminRoleBtn.classList.add('active');
            break;
        case 'moderator':
            moderatorRoleBtn.classList.add('active');
            break;
        case 'player':
            playerRoleBtn.classList.add('active');
            break;
    }
}

// Обновление панелей управления в зависимости от роли
function updateControlPanels(role) {
    adminControls.style.display = role === 'admin' ? 'flex' : 'none';
    moderatorControls.style.display = role === 'moderator' ? 'flex' : 'none';
}

// Инициализация обработчиков событий
function setupEventListeners() {
    // Обработчики кнопок ролей
    adminRoleBtn.addEventListener('click', () => switch
	// Обработчики кнопок ролей
    adminRoleBtn.addEventListener('click', () => switchRole('admin'));
    moderatorRoleBtn.addEventListener('click', () => switchRole('moderator'));
    playerRoleBtn.addEventListener('click', () => switchRole('player'));
    
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
    
    // Обработчик клика по кнопке очистки холста
    clearCanvasButton.addEventListener('click', () => {
        if (!isAuthenticated) {
            showLoginForm();
            return;
        }
        
        if (confirm('Вы действительно хотите очистить весь холст?')) {
            document.querySelectorAll('.pixel').forEach(pixel => {
                pixel.style.backgroundColor = '#ffffff';
            });
            addLogEntry(`Холст очищен пользователем ${currentUsername}`, currentRole);
            statusMessage.textContent = 'Холст очищен';
        }
    });
    
    // Функции для кнопок панели администратора
    document.getElementById('reset-all-cooldowns').addEventListener('click', () => {
        cooldownActive = false;
        clearInterval(cooldownInterval);
        timerDisplay.textContent = '0';
        addLogEntry('Админ сбросил все таймеры перезарядки', 'admin');
        statusMessage.textContent = 'Все таймеры перезарядки сброшены';
    });
    
    document.getElementById('change-canvas-size').addEventListener('click', () => {
        const newSize = prompt('Введите новый размер холста (10-200):', CANVAS_SIZE);
        const size = parseInt(newSize);
        
        if (size && size >= 10 && size <= 200) {
            addLogEntry(`Админ изменил размер холста с ${CANVAS_SIZE}x${CANVAS_SIZE} на ${size}x${size}`, 'admin');
            alert('Эта функция будет доступна в следующей версии. Сейчас размер холста зафиксирован на 100x100');
        } else {
            alert('Некорректный размер. Размер должен быть от 10 до 200');
        }
    });
    
    document.getElementById('ban-user').addEventListener('click', () => {
        const username = prompt('Введите имя пользователя для блокировки:');
        if (username) {
            addLogEntry(`Админ заблокировал пользователя: ${username}`, 'admin');
            alert('Эта функция будет доступна в многопользовательской версии.');
        }
    });
    
    document.getElementById('change-cooldown').addEventListener('click', () => {
        const newCooldown = prompt('Введите новое время перезарядки (в секундах):', COOLDOWN_TIME);
        const cooldown = parseInt(newCooldown);
        
        if (cooldown && cooldown >= 0) {
            addLogEntry(`Админ изменил время перезарядки с ${COOLDOWN_TIME} на ${cooldown} секунд`, 'admin');
            alert('Эта функция будет доступна в следующей версии.');
        } else {
            alert('Некорректное время перезарядки');
        }
    });
    
    document.getElementById('export-canvas').addEventListener('click', () => {
        addLogEntry('Админ экспортировал холст', 'admin');
        alert('Эта функция будет доступна в следующей версии.');
    });
    
    // Функции для кнопок панели модератора
    document.getElementById('reset-user-cooldown').addEventListener('click', () => {
        const username = prompt('Введите имя пользователя для сброса таймера:');
        if (username) {
            addLogEntry(`Модератор сбросил таймер для пользователя: ${username}`, 'moderator');
            alert('Эта функция будет доступна в многопользовательской версии.');
        }
    });
    
    document.getElementById('revert-pixel').addEventListener('click', () => {
        // Получаем последнее изменение из истории
        if (pixelHistory.length > 0) {
            const lastChange = pixelHistory.pop();
            
            // Находим пиксель по индексу
            const pixels = document.querySelectorAll('.pixel');
            const pixel = pixels[lastChange.index];
            
            if (pixel) {
                // Возвращаем старый цвет
                pixel.style.backgroundColor = lastChange.oldColor;
                addLogEntry(`Модератор отменил изменение пикселя на позиции ${lastChange.index}`, 'moderator');
            }
        } else {
            alert('История изменений пуста');
        }
    });
    
    document.getElementById('lock-area').addEventListener('click', () => {
        alert('Выберите область для блокирования (эта функция будет доступна в следующей версии)');
        addLogEntry('Модератор попытался заблокировать область', 'moderator');
    });
}

// Инициализация приложения
function init() {
    // Инициализируем ссылки на DOM-элементы
    canvas = document.getElementById('pixel-canvas');
    colorPicker = document.getElementById('color-picker');
    timerDisplay = document.getElementById('timer');
    statusMessage = document.getElementById('status-message');
    selectedColorDisplay = document.getElementById('selected-color-display');
    clearCanvasButton = document.getElementById('clear-canvas');
    zoomInButton = document.getElementById('zoom-in');
    zoomOutButton = document.getElementById('zoom-out');
    resetZoomButton = document.getElementById('reset-zoom');
    actionLog = document.getElementById('action-log');
    
    // Элементы ролей
    adminRoleBtn = document.getElementById('admin-role-btn');
    moderatorRoleBtn = document.getElementById('moderator-role-btn');
    playerRoleBtn = document.getElementById('player-role-btn');
    roleInfo = document.getElementById('role-info');
    currentRoleDisplay = document.getElementById('current-role');
    roleDescription = document.getElementById('role-description');
    adminControls = document.getElementById('admin-controls');
    moderatorControls = document.getElementById('moderator-controls');
    
    // Создаем холст и палитру
    createCanvas();
    createColorPicker();
    
    // Настраиваем обработчики событий
    setupEventListeners();
    
    // Инициализируем авторизацию
    setupAuth();
    
    // Устанавливаем начальное сообщение
    statusMessage.textContent = 'Выберите цвет и нажмите на пиксель, чтобы раскрасить его';
}

// Запускаем инициализацию после загрузки страницы
document.addEventListener('DOMContentLoaded', init);
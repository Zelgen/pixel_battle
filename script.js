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

// Инициализация элементов DOM после загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация элементов DOM
    const canvas = document.getElementById('pixel-canvas');
    const colorPicker = document.getElementById('color-picker');
    const timerDisplay = document.getElementById('timer');
    const statusMessage = document.getElementById('status-message');
    const selectedColorDisplay = document.getElementById('selected-color-display');
    const clearCanvasButton = document.getElementById('clear-canvas');
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const resetZoomButton = document.getElementById('reset-zoom');
    const actionLog = document.getElementById('action-log');
    
    // Элементы ролей
    const adminRoleBtn = document.getElementById('admin-role-btn');
    const moderatorRoleBtn = document.getElementById('moderator-role-btn');
    const playerRoleBtn = document.getElementById('player-role-btn');
    const roleInfo = document.getElementById('role-info');
    const currentRoleDisplay = document.getElementById('current-role');
    const roleDescription = document.getElementById('role-description');
    const adminControls = document.getElementById('admin-controls');
    const moderatorControls = document.getElementById('moderator-controls');
    
    // Остальной код JavaScript из прототипа...
    
    // Инициализация
    init();
});

// Все остальные функции из вашего прототипа...
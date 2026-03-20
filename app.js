// --- ТВОЙ СКРИПТ НАВИГАЦИИ ---
const switcher = document.querySelector('.switcher');
const trackPrevious = (el) => {
  const radios = el.querySelectorAll('input[type="radio"]');
  let previousValue = null;
  const initiallyChecked = el.querySelector('input[type="radio"]:checked');
  if (initiallyChecked) {
    previousValue = initiallyChecked.getAttribute("c-option");
    el.setAttribute('c-previous', previousValue);
  }
  radios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        el.setAttribute('c-previous', previousValue ?? '');
        previousValue = radio.getAttribute("c-option");
        
        // Переключение вкладок
        document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
        document.getElementById(`tab-${radio.value}`).style.display = 'flex';
      }
    });
  });
}
trackPrevious(switcher);

// --- ЛОГИКА ПРИЛОЖЕНИЯ ---
let alarmTimeStr = null;
let wakeLock = null;
let alarmInterval = null;
let currentAnswer = 0;

// Загрузка статистики
let statsCount = localStorage.getItem('tahajjud_count') || 0;
document.getElementById('stats-count').innerText = statsCount;

// Получение времени намазов для Махачкалы (API Aladhan)
async function fetchPrayerTimes() {
  try {
    const response = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Makhachkala&country=Russia&method=2');
    const data = await response.json();
    const maghribStr = data.data.timings.Maghrib;
    const fajrStr = data.data.timings.Fajr;
    
    document.getElementById('maghrib-time').innerText = `Магриб: ${maghribStr}`;
    document.getElementById('fajr-time').innerText = `Фаджр: ${fajrStr}`;

    calculateThirdNight(maghribStr, fajrStr);
  } catch (error) {
    console.error('Ошибка получения времени', error);
  }
}

// Расчет последней трети ночи
function calculateThirdNight(maghrib, fajr) {
  const [mHours, mMins] = maghrib.split(':').map(Number);
  const [fHours, fMins] = fajr.split(':').map(Number);
  
  let maghribDate = new Date();
  maghribDate.setHours(mHours, mMins, 0, 0);
  
  let fajrDate = new Date();
  fajrDate.setDate(fajrDate.getDate() + 1); // Фаджр следующего дня
  fajrDate.setHours(fHours, fMins, 0, 0);

  // Продолжительность ночи в миллисекундах
  const nightDuration = fajrDate - maghribDate;
  const thirdDuration = nightDuration / 3;
  
  // Время начала последней трети
  const thirdNightStart = new Date(fajrDate.getTime() - thirdDuration);
  
  alarmTimeStr = thirdNightStart.toTimeString().slice(0, 5); // Формат HH:MM
  document.getElementById('third-night-time').innerText = alarmTimeStr;
}

// Удержание экрана включенным (чтобы PWA не уснуло)
async function requestWakeLock() {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    console.log('Экран не погаснет');
  } catch (err) {
    console.error('Wake Lock API не поддерживается', err);
  }
}

// Логика Будильника
document.getElementById('enable-alarm-btn').addEventListener('click', () => {
  if (!alarmTimeStr) return;
  
  requestWakeLock();
  document.getElementById('alarm-status').innerText = "Будильник активирован. Оставьте приложение открытым на экране и телефон на зарядке.";
  
  // Проверяем время каждую минуту
  if(alarmInterval) clearInterval(alarmInterval);
  alarmInterval = setInterval(() => {
    const now = new Date().toTimeString().slice(0, 5);
    if (now === alarmTimeStr) {
      triggerAlarm();
    }
  }, 60000); // Раз в минуту
});

// Запуск будильника
function triggerAlarm() {
  document.getElementById('alarm-sound').play();
  generatePuzzle();
  document.getElementById('puzzle-modal').style.display = 'flex';
  clearInterval(alarmInterval);
}

// Генерация головоломки
function generatePuzzle() {
  const num1 = Math.floor(Math.random() * 50) + 10;
  const num2 = Math.floor(Math.random() * 50) + 10;
  currentAnswer = num1 + num2;
  document.getElementById('math-problem').innerText = `${num1} + ${num2} = ?`;
  document.getElementById('puzzle-error').style.display = 'none';
  document.getElementById('puzzle-answer').value = '';
}

// Проверка ответа
document.getElementById('submit-puzzle').addEventListener('click', () => {
  const userAnswer = parseInt(document.getElementById('puzzle-answer').value);
  if (userAnswer === currentAnswer) {
    document.getElementById('alarm-sound').pause();
    document.getElementById('alarm-sound').currentTime = 0;
    document.getElementById('puzzle-modal').style.display = 'none';
    
    // Обновляем статистику
    statsCount++;
    localStorage.setItem('tahajjud_count', statsCount);
    document.getElementById('stats-count').innerText = statsCount;
    document.getElementById('alarm-status').innerText = "Тахаджуд засчитан!";
    
    if (wakeLock !== null) { wakeLock.release(); wakeLock = null; }
  } else {
    document.getElementById('puzzle-error').style.display = 'block';
  }
});

// Инициализация
fetchPrayerTimes();

// Регистрация Service Worker для PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

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
        
        document.querySelectorAll('.tab-content').forEach(tab => {
          tab.style.display = 'none';
          tab.classList.remove('active');
        });
        const targetTab = document.getElementById(`tab-${radio.value}`);
        targetTab.style.display = 'flex';
        setTimeout(() => targetTab.classList.add('active'), 10);
      }
    });
  });
}
trackPrevious(switcher);

let alarmTimeStr = null;
let wakeLock = null;
let alarmInterval = null;
let currentAnswer = 0;

let statsCount = localStorage.getItem('tahajjud_count') || 0;
document.getElementById('stats-count').innerText = statsCount;

// Запрос прав на пуш-уведомления для фоновой работы
async function requestNotificationPermission() {
  if ("Notification" in window) {
    const permission = await Notification.requestPermission();
    console.log("Статус разрешений на уведомления:", permission);
  }
}

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

function calculateThirdNight(maghrib, fajr) {
  const [mHours, mMins] = maghrib.split(':').map(Number);
  const [fHours, fMins] = fajr.split(':').map(Number);
  
  let maghribDate = new Date();
  maghribDate.setHours(mHours, mMins, 0, 0);
  
  let fajrDate = new Date();
  fajrDate.setDate(fajrDate.getDate() + 1); 
  fajrDate.setHours(fHours, fMins, 0, 0);

  const nightDuration = fajrDate - maghribDate;
  const thirdDuration = nightDuration / 3;
  
  const thirdNightStart = new Date(fajrDate.getTime() - thirdDuration);
  
  alarmTimeStr = thirdNightStart.toTimeString().slice(0, 5); 
  document.getElementById('third-night-time').innerText = alarmTimeStr;
}

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Экран не погаснет (Wake Lock активен)');
    }
  } catch (err) {
    console.error('Wake Lock API ошибка', err);
  }
}

document.getElementById('enable-alarm-btn').addEventListener('click', () => {
  if (!alarmTimeStr) return;
  
  requestNotificationPermission(); // Спрашиваем при нажатии на кнопку
  requestWakeLock();
  
  document.getElementById('alarm-status').innerText = "Будильник и фоновые процессы активированы.";
  
  if(alarmInterval) clearInterval(alarmInterval);
  alarmInterval = setInterval(() => {
    const now = new Date().toTimeString().slice(0, 5);
    if (now === alarmTimeStr) {
      triggerAlarm();
    }
  }, 10000); // Проверка каждые 10 секунд
});

function triggerAlarm() {
  // Попытка системного уведомления для фона
  if (Notification.permission === "granted") {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification("Время Тахаджуда!", {
        body: "Пора вставать на ночной намаз.",
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        requireInteraction: true
      });
    });
  }

  // Запуск аудио и UI
  document.getElementById('alarm-sound').play().catch(e => console.log("Браузер заблокировал автоплей: ", e));
  generatePuzzle();
  document.getElementById('puzzle-modal').style.display = 'flex';
  clearInterval(alarmInterval);
}

function generatePuzzle() {
  const num1 = Math.floor(Math.random() * 50) + 10;
  const num2 = Math.floor(Math.random() * 50) + 10;
  currentAnswer = num1 + num2;
  document.getElementById('math-problem').innerText = `${num1} + ${num2} = ?`;
  document.getElementById('puzzle-error').style.display = 'none';
  document.getElementById('puzzle-answer').value = '';
}

document.getElementById('submit-puzzle').addEventListener('click', () => {
  const userAnswer = parseInt(document.getElementById('puzzle-answer').value);
  if (userAnswer === currentAnswer) {
    document.getElementById('alarm-sound').pause();
    document.getElementById('alarm-sound').currentTime = 0;
    document.getElementById('puzzle-modal').style.display = 'none';
    
    statsCount++;
    localStorage.setItem('tahajjud_count', statsCount);
    document.getElementById('stats-count').innerText = statsCount;
    document.getElementById('alarm-status').innerText = "Тахаджуд засчитан!";
    
    if (wakeLock !== null) { wakeLock.release(); wakeLock = null; }
  } else {
    document.getElementById('puzzle-error').style.display = 'block';
  }
});

fetchPrayerTimes();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

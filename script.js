
// ======================
// Enhanced Timer Class
// ======================
class Timer {
  constructor() {
    this.timerId = null;
    this.isPaused = false;
    this.remainingTime = 0;
    this.currentDisplay = null;
    this.currentDuration = 0;
    this.currentCircle = null;
    this.circumference = 0;
    this.audio = new Audio('https://www.soundjay.com/button/beep-07.wav');
    this.endTime = null;
  }

  initializeProgressRing(timerElement) {
    const circle = timerElement.querySelector('.progress-ring-circle');
    const radius = circle.r.baseVal.value;
    this.circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
    circle.style.strokeDashoffset = this.circumference;
    return circle;
  }

  start(seconds, timerElement) {
    this.stop();
    this.isPaused = false;
    this.remainingTime = seconds;
    this.currentDisplay = timerElement.querySelector('.timer-display');
    this.currentDuration = seconds;
    this.currentCircle = this.initializeProgressRing(timerElement);
    this.endTime = Date.now() + seconds * 1000;
    this.timerId = setInterval(() => this.update(), 1000);
    this.saveState();
  }

  update() {
    if (!this.isPaused) {
      this.remainingTime = Math.max(0, Math.floor((this.endTime - Date.now()) / 1000));
      this.updateDisplay();
      this.updateProgress();
      if (this.remainingTime <= 0) {
        this.stop();
        this.audio.play().catch(console.error);
        localStorage.removeItem('timerState');
      }
    }
    this.saveState();
  }

  updateDisplay() {
    if (!this.currentDisplay) return;
    const m = String(Math.floor(this.remainingTime / 60)).padStart(2, '0');
    const s = String(this.remainingTime % 60).padStart(2, '0');
    this.currentDisplay.textContent = `${m}:${s}`;
  }

  updateProgress() {
    if (!this.currentCircle || !this.currentDuration) return;
    const offset = this.circumference - (this.remainingTime / this.currentDuration) * this.circumference;
    this.currentCircle.style.strokeDashoffset = offset;
  }

  stop() {
    clearInterval(this.timerId);
    this.timerId = null;
  }

  reset() {
    this.remainingTime = this.currentDuration;
    this.endTime = Date.now() + this.remainingTime * 1000;
    this.updateDisplay();
    if (this.currentCircle) this.currentCircle.style.strokeDashoffset = this.circumference;
    this.saveState();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    if (!this.isPaused && this.remainingTime > 0) {
      this.endTime = Date.now() + this.remainingTime * 1000;
    }
    this.saveState();
    return this.isPaused;
  }

  saveState() {
    if (this.remainingTime > 0) {
      const state = {
        isPaused: this.isPaused,
        remainingTime: this.remainingTime,
        currentDuration: this.currentDuration,
        endTime: this.isPaused ? null : this.endTime
      };
      localStorage.setItem('timerState', JSON.stringify(state));
    }
  }

  restoreState() {
    const raw = localStorage.getItem('timerState');
    if (!raw) return false;
    const state = JSON.parse(raw);
    if (!state.remainingTime) return false;

    this.remainingTime = state.remainingTime;
    this.currentDuration = state.currentDuration;
    this.isPaused = state.isPaused;
    this.endTime = state.endTime ?? (this.isPaused ? null : Date.now() + this.remainingTime * 1000);

    const disp = document.querySelector('.timer-display');
    if (disp) {
      const parent = document.querySelector(
        this.currentDuration === 1500 ? '.timer-main' : '.timer-break'
      );
      if (parent) {
        this.currentDisplay = parent.querySelector('.timer-display');
        this.currentCircle = this.initializeProgressRing(parent);
        this.updateDisplay();
        this.updateProgress();
        if (!this.isPaused && this.remainingTime > 0) {
          this.timerId = setInterval(() => this.update(), 1000);
        }
      }
    }

    return true;
  }
}

// ======================
// Enhanced Calculator Class
// ======================
class Calculator {
  constructor() {
    this.currentInput = '0';
    this.equation = '';
    this.memory = 0;
    this.taxRate = 0;
    this.history = [];
    this.restoreState();
  }

  appendNumber(n) {
    if (this.currentInput === '0' || this.currentInput === 'Error') {
      this.currentInput = n;
    } else {
      this.currentInput += n;
    }
    this.updateDisplay();
    this.saveState();
  }

  appendDecimal() {
    if (!this.currentInput.includes('.')) {
      this.currentInput += this.currentInput === '' ? '0.' : '.';
      this.updateDisplay();
      this.saveState();
    }
  }

  appendOperator(op) {
    if (this.currentInput === 'Error') return;
    if (this.currentInput === '0' && op === '-') {
      this.currentInput = '-';
      this.updateDisplay();
      this.saveState();
      return;
    }
    const last = this.equation.slice(-2).trim();
    if (['+', '-', '×', '÷'].includes(last)) {
      this.equation = this.equation.slice(0, -3);
    }
    this.equation += `${this.currentInput} ${op} `;
    this.currentInput = '0';
    this.updateDisplay();
    this.saveState();
  }

  calculate() {
    try {
      const expr = (this.equation + this.currentInput)
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/(\d)(\(|\))/g, '$1*$2')
        .replace(/(\))(\d)/g, '$1*$2');
      const result = new Function(`return (${expr})`)();
      this.history.unshift(`${this.equation}${this.currentInput} = ${result}`);
      if (this.history.length > 10) this.history.pop();
      this.currentInput = Number.isFinite(result) ? result.toString() : 'Error';
      this.equation = '';
      this.updateDisplay();
      this.updateHistory();
      this.saveState();
    } catch {
      this.currentInput = 'Error';
      this.equation = '';
      this.updateDisplay();
      this.saveState();
    }
  }

  memoryClear() { this.memory = 0; if (id('memoryValue')) id('memoryValue').textContent = '0'; this.saveState(); }
  memoryRecall() { this.currentInput = this.memory.toString(); this.updateDisplay(); this.saveState(); }
  memoryAdd() { if (this.currentInput !== 'Error') this.memory += parseFloat(this.currentInput) || 0; if (id('memoryValue')) id('memoryValue').textContent = this.memory; this.saveState(); }
  memorySubtract() { if (this.currentInput !== 'Error') this.memory -= parseFloat(this.currentInput) || 0; if (id('memoryValue')) id('memoryValue').textContent = this.memory; this.saveState(); }

  setTaxRate() {
    const taxInput = id('taxRate');
    if (!taxInput) return;
    const val = parseFloat(taxInput.value);
    this.taxRate = isNaN(val) ? 0 : val / 100;
    this.saveState();
  }

  addTax() {
    if (this.taxRate <= 0) return alert('Please set a valid tax rate first!');
    if (this.currentInput === 'Error') return;
    const amt = parseFloat(this.currentInput) || 0;
    const tax = amt * this.taxRate;
    const result = (amt + tax).toFixed(2);
    this.currentInput = result;
    this.history.unshift(`TAX: ${amt} + ${tax.toFixed(2)} = ${result}`);
    this.updateDisplay();
    this.updateHistory();
    this.saveState();
  }

  calculatePercentage() {
    if (this.currentInput === 'Error') return;
    const val = parseFloat(this.currentInput) || 0;
    this.currentInput = (val / 100).toString();
    this.updateDisplay();
    this.saveState();
  }

  addParenthesis(paren) {
    if (this.currentInput === 'Error') return;
    this.equation += `${this.currentInput} ${paren} `;
    this.currentInput = '0';
    this.updateDisplay();
    this.saveState();
  }

  clearAll() { this.currentInput = '0'; this.equation = ''; this.updateDisplay(); this.saveState(); }
  clearEntry() { this.currentInput = '0'; this.updateDisplay(); this.saveState(); }
  clearHistory() { this.history = []; this.updateHistory(); this.saveState(); }

  updateDisplay() {
    if (id('display')) id('display').textContent = this.currentInput;
    if (id('equation')) id('equation').textContent = this.equation;
  }

  updateHistory() {
    if (!id('historyList')) return;
    id('historyList').innerHTML = this.history
      .map(item => `<div class="history-item">${item}</div>`)
      .join('');
  }

  saveState() {
    const st = {
      currentInput: this.currentInput,
      equation: this.equation,
      memory: this.memory,
      taxRate: this.taxRate,
      history: this.history
    };
    localStorage.setItem('calcState', JSON.stringify(st));
  }

  restoreState() {
    const raw = localStorage.getItem('calcState');
    if (!raw) return;
    const st = JSON.parse(raw);
    this.currentInput = st.currentInput || '0';
    this.equation = st.equation || '';
    this.memory = st.memory || 0;
    this.taxRate = st.taxRate || 0;
    this.history = st.history || [];
    this.updateDisplay();
    this.updateHistory();
    if (id('memoryValue')) id('memoryValue').textContent = this.memory;
  }
}

// ======================
// App Setup
// ======================
const app = {
  timer: new Timer(),
  calculator: new Calculator(),

  initialize() {
    this.setupThemeToggle();
    this.setupTimerControls();
    this.setupCalculatorEvents();
    this.loadTheme();
    this.timer.restoreState();
  },

  loadTheme() {
    const mode = localStorage.getItem('theme');
    if (mode === 'night') {
      document.body.classList.add('night-mode');
      if (id('themeToggle')) id('themeToggle').checked = true;
      if (id('themeLabel')) id('themeLabel').textContent = 'Night';
    }
  },

  setupThemeToggle() {
    const t = id('themeToggle');
    if (!t) return;
    t.addEventListener('change', () => {
      const night = document.body.classList.toggle('night-mode');
      if (id('themeLabel')) id('themeLabel').textContent = night ? 'Night' : 'Day';
      localStorage.setItem('theme', night ? 'night' : 'day');
    });
  },

  setupTimerControls() {
    const r = id('resetBtn');
    if (r) r.addEventListener('click', () => this.timer.reset());
    const p = id('pauseBtn');
    if (p) p.addEventListener('click', () => {
      const paused = this.timer.togglePause();
      p.innerHTML = paused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    });
    document.querySelectorAll('.timer-main, .timer-break').forEach(el =>
      el.addEventListener('click', () => {
        const sec = el.classList.contains('timer-main') ? 1500 : 300;
        this.timer.start(sec, el);
      })
    );
  },

  setupCalculatorEvents() {
    document.querySelectorAll('.number-btn').forEach(btn =>
      btn.addEventListener('click', () => this.calculator.appendNumber(btn.dataset.number))
    );
    document.querySelectorAll('.operation-btn').forEach(btn =>
      btn.addEventListener('click', () => {
        const op = btn.dataset.op;
        if (op === '%') this.calculator.calculatePercentage();
        else if (op === 'TAX+') this.calculator.addTax();
        else if (op === '(' || op === ')') this.calculator.addParenthesis(op);
        else this.calculator.appendOperator(op);
      })
    );
    if (id('clearEntry')) id('clearEntry').addEventListener('click', () => this.calculator.clearEntry());
    if (id('memoryClear')) id('memoryClear').addEventListener('click', () => this.calculator.memoryClear());
    if (id('memoryRecall')) id('memoryRecall').addEventListener('click', () => this.calculator.memoryRecall());
    if (id('memoryAdd')) id('memoryAdd').addEventListener('click', () => this.calculator.memoryAdd());
    if (id('memorySubtract')) id('memorySubtract').addEventListener('click', () => this.calculator.memorySubtract());
    if (id('calculate')) id('calculate').addEventListener('click', () => this.calculator.calculate());
    if (id('clearAll')) id('clearAll').addEventListener('click', () => this.calculator.clearAll());
    if (id('clearHistory')) id('clearHistory').addEventListener('click', () => this.calculator.clearHistory());
    if (id('setTaxBtn')) id('setTaxBtn').addEventListener('click', () => this.calculator.setTaxRate());
    if (id('decimalBtn')) id('decimalBtn').addEventListener('click', () => this.calculator.appendDecimal());
  }
};

// ======================
// Verse Fetcher + Utils
// ======================
async function fetchVerseOfTheDay() {
  const place = id('verseDisplay');
  if (!place) return;
  try {
    const resp = await fetch('https://beta.ourmanna.com/api/v1/get/?format=json');
    if (!resp.ok) throw new Error('Network not OK');
    const obj = await resp.json();
    const v = obj.verse.details;
    place.textContent = `"${v.text}" — ${v.reference}`;
  } catch {
    place.textContent = 'Failed to load verse. Please try later.';
  }
}

function id(i) { return document.getElementById(i); }

// ======================
// Calendar + Navigation Handling
// ======================
document.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    app.timer.saveState();
    app.calculator.saveState();
  })
);

window.addEventListener('beforeunload', () => {
  app.timer.saveState();
  app.calculator.saveState();
});

document.addEventListener('DOMContentLoaded', () => {
  app.initialize();
  fetchVerseOfTheDay();

  let currentMonth = (new Date()).getMonth();
  let currentYear = (new Date()).getFullYear();
  const monthYear = id('current-month-year');
  const grid = id('calendar-grid');
  const prevBtn = id('prev-month');
  const nextBtn = id('next-month');
  const modal = id('event-modal');
  const modalDate = id('modal-date');
  const eventsList = id('events-list');
  const form = id('add-event-form');
  const closeBtn = document.querySelector('.close-modal');
  let events = JSON.parse(localStorage.getItem('calendarEvents')) || {};

  function formatDate(d) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function getMonthName(n) {
    return ['January','February','March','April','May','June','July','August','September','October','November','December'][n];
  }

  function renderEvents(dateStr) {
    eventsList.innerHTML = '';
    const arr = events[dateStr] || [];
    if (!arr.length) {
      eventsList.innerHTML = '<p class="no-events">No schedules for this day</p>';
      return;
    }
    arr.forEach(e => {
      const div = document.createElement('div');
      div.className = 'event-card';
      div.innerHTML = `
        <div class="event-info">
          <h4>${e.title}</h4>
          <div class="event-time">${e.time} • ${e.duration} minutes</div>
          ${e.description ? `<p>${e.description}</p>` : ''}
        </div>
        <button class="delete-event" data-id="${e.id}"><i class="fas fa-trash"></i></button>`;
      eventsList.appendChild(div);
    });
    document.querySelectorAll('.delete-event').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const id_ = parseInt(this.dataset.id);
        events[modal.dataset.date] = events[modal.dataset.date].filter(ev => ev.id !== id_);
        if (!events[modal.dataset.date].length) delete events[modal.dataset.date];
        localStorage.setItem('calendarEvents', JSON.stringify(events));
        renderEvents(modal.dataset.date);
        renderCalendar();
        e.stopPropagation();
      });
    });
  }

  function openModal(dateStr) {
    const d = new Date(dateStr);
    modalDate.textContent = `Schedule for ${getMonthName(d.getMonth())} ${d.getDate()}, ${d.getFullYear()}`;
    modal.dataset.date = dateStr;
    renderEvents(dateStr);
    modal.style.display = 'flex';
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = id('event-title').value;
    const time = id('event-time').value;
    const duration = id('event-duration').value;
    const description = id('event-description').value;
    if (!title || !time) return;
    const dateStr = modal.dataset.date;
    events[dateStr] = events[dateStr] || [];
    if (events[dateStr].length < 5) {
      events[dateStr].push({ id: Date.now(), title, time, duration, description });
      localStorage.setItem('calendarEvents', JSON.stringify(events));
      renderEvents(dateStr);
      renderCalendar();
      form.reset();
    } else {
      alert('Maximum of 5 events per day reached!');
    }
  });

  closeBtn.addEventListener('click', () => modal.style.display = 'none');
  window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

  prevBtn.addEventListener('click', () => {
    currentMonth = currentMonth - 1 < 0 ? 11 : currentMonth - 1;
    if (currentMonth === 11) currentYear--;
    renderCalendar();
  });

  nextBtn.addEventListener('click', () => {
    currentMonth = currentMonth + 1 > 11 ? 0 : currentMonth + 1;
    if (currentMonth === 0) currentYear++;
    renderCalendar();
  });

  function renderCalendar() {
    grid.innerHTML = '';
    monthYear.textContent = `${getMonthName(currentMonth)} ${currentYear}`;
    const first = new Date(currentYear, currentMonth, 1).getDay();
    const daysIn = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevDays = new Date(currentYear, currentMonth, 0).getDate();
    const todayStr = formatDate(new Date());

    for (let i = first - 1; i >= 0; i--) {
      createDay(prevDays - i, false);
    }
    for (let d = 1; d <= daysIn; d++) {
      createDay(d, true);
    }
    const totalCells = first + daysIn;
    const nextCount = 42 - totalCells;
    for (let d = 1; d <= nextCount; d++) {
      createDay(d, false, true);
    }
  }

  function createDay(dayNum, isCurrent, isNext = false) {
    const div = document.createElement('div');
    const d = new Date(currentYear, currentMonth + (isCurrent ? 0 : isNext ? 1 : -1), dayNum);
    const ds = formatDate(d);
    const todayStr = formatDate(new Date());
    div.className = `calendar-day ${isCurrent ? 'current-month' : ''} ${ds === todayStr ? 'today' : ''}`;
    div.dataset.date = ds;
    div.innerHTML = `
      <div class="day-number">${dayNum}</div>
      <div class="day-events" id="events-${ds}"></div>
      <button class="add-event-btn"><i class="fas fa-plus"></i></button>
    `;
    const arr = events[ds] || [];
    const eventsContainer = div.querySelector('.day-events');
    arr.slice(0, 3).forEach(ev => {
      const eDiv = document.createElement('div');
      eDiv.className = 'event-item';
      eDiv.textContent = `${ev.time} ${ev.title}`;
      eventsContainer.appendChild(eDiv);
    });
    if (arr.length > 3) {
      const more = document.createElement('div');
      more.className = 'event-item';
      more.textContent = `+${arr.length - 3} more`;
      eventsContainer.appendChild(more);
    }
    div.addEventListener('click', e => {
      if (!e.target.closest('.add-event-btn')) openModal(ds);
    });
    div.querySelector('.add-event-btn').addEventListener('click', e => {
      e.stopPropagation();
      openModal(ds);
    });
    grid.appendChild(div);
  }

  renderCalendar();
});
// ======================
// Remove Study Session Event
// ======================

function removeStudySession(dateStr, eventId) {
  if (!events[dateStr]) return;

  // Find the event to remove
  const eventIndex = events[dateStr].findIndex(event => event.id === eventId);
  if (eventIndex !== -1) {
    events[dateStr].splice(eventIndex, 1); // Remove the event from the array
    if (!events[dateStr].length) {
      delete events[dateStr]; // Remove the date entry if there are no events left
    }
    localStorage.setItem('calendarEvents', JSON.stringify(events)); // Save to localStorage
    renderEvents(dateStr); // Re-render events for the day
    renderCalendar(); // Re-render calendar to reflect changes
  }
}

// Add event listener for "Remove Study Session" button on calendar events
document.querySelectorAll('.delete-study-session').forEach(btn => {
  btn.addEventListener('click', function(e) {
    const eventId = parseInt(this.dataset.id); // Get event ID from button data attribute
    const dateStr = this.closest('.event-card').dataset.date; // Get the date for the event
    removeStudySession(dateStr, eventId); // Call the function to remove the event
    e.stopPropagation();
  });
});

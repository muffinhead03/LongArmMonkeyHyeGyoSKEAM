const DAY_TASKS = [
  { time: '07:00', korean: '일어나다', japanese: 'おきる', reading: '오키루' },
  { time: '07:30', korean: '세수하다', japanese: 'かおを あらう', reading: '카오오 아라우' },
  { time: '08:00', korean: '아침을 먹다', japanese: 'あさごはんを たべる', reading: '아사고항오 타베루' },
  { time: '08:30', korean: '학교에 가다', japanese: 'がっこうへ いく', reading: '각코오에 이쿠' },
  { time: '10:00', korean: '공부하다', japanese: 'べんきょうする', reading: '벤쿄오스루' },
  { time: '12:30', korean: '점심을 먹다', japanese: 'ひるごはんを たべる', reading: '히루고항오 타베루' },
  { time: '16:00', korean: '운동하다', japanese: 'うんどうする', reading: '운도오스루' },
  { time: '18:00', korean: '집에 돌아가다', japanese: 'いえへ かえる', reading: '이에에 카에루' },
  { time: '21:00', korean: '목욕하다', japanese: 'おふろに はいる', reading: '오후로니 하이루' },
  { time: '23:00', korean: '자다', japanese: 'ねる', reading: '네루' }
];

const ROUND_TIME = 5000;
const MAX_LIVES = 3;

const startScreen = document.querySelector('#start-screen');
const gameScreen = document.querySelector('#game-screen');
const resultScreen = document.querySelector('#result-screen');
const startButton = document.querySelector('#start-button');
const restartButton = document.querySelector('#restart-button');
const dayTime = document.querySelector('#day-time');
const scoreDisplay = document.querySelector('#score');
const livesDisplay = document.querySelector('#lives');
const roundCount = document.querySelector('#round-count');
const dayProgressBar = document.querySelector('#day-progress-bar');
const question = document.querySelector('#question');
const choices = document.querySelector('#choices');
const feedback = document.querySelector('#feedback');
const timer = document.querySelector('#timer');
const timerBar = document.querySelector('#timer-bar');
const timerText = document.querySelector('#timer-text');
const resultKicker = document.querySelector('#result-kicker');
const resultTitle = document.querySelector('#result-title');
const resultMessage = document.querySelector('#result-message');
const finalScore = document.querySelector('#final-score');
const rank = document.querySelector('#rank');
const review = document.querySelector('#review');

let round = 0;
let score = 0;
let lives = MAX_LIVES;
let streak = 0;
let missedTasks = [];
let currentChoices = [];
let roundStartedAt = 0;
let animationFrame = null;
let nextRoundTimer = null;
let answerLocked = false;

function showScreen(activeScreen) {
  [startScreen, gameScreen, resultScreen].forEach((screen) => {
    screen.hidden = screen !== activeScreen;
  });
}

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function updateHud() {
  scoreDisplay.textContent = score.toLocaleString('ko-KR');
  livesDisplay.textContent = Array.from({ length: MAX_LIVES }, (_, index) => index < lives ? '♥' : '♡').join(' ');
  livesDisplay.setAttribute('aria-label', `남은 기회 ${lives}개`);
}

function startGame() {
  window.clearTimeout(nextRoundTimer);
  cancelAnimationFrame(animationFrame);
  round = 0;
  score = 0;
  lives = MAX_LIVES;
  streak = 0;
  missedTasks = [];
  updateHud();
  showScreen(gameScreen);
  showRound();
}

function makeChoices(task) {
  const alternatives = shuffled(DAY_TASKS.filter((item) => item !== task)).slice(0, 2);
  return shuffled([task, ...alternatives]);
}

function showRound() {
  if (lives <= 0 || round >= DAY_TASKS.length) {
    finishGame();
    return;
  }

  answerLocked = false;
  const task = DAY_TASKS[round];
  currentChoices = makeChoices(task);
  dayTime.textContent = task.time;
  roundCount.textContent = `${round + 1} / ${DAY_TASKS.length}`;
  dayProgressBar.style.width = `${(round / DAY_TASKS.length) * 100}%`;
  question.textContent = task.korean;
  feedback.textContent = '정답을 빠르게 골라 보세요!';
  feedback.className = 'feedback';
  timer.classList.remove('danger');
  choices.replaceChildren();

  currentChoices.forEach((choice, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice-button';
    button.dataset.key = index + 1;
    button.lang = 'ja';
    button.textContent = choice.japanese;
    button.addEventListener('click', () => answer(choice, button));
    choices.append(button);
  });

  roundStartedAt = performance.now();
  animationFrame = requestAnimationFrame(updateTimer);
  choices.querySelector('button')?.focus();
}

function updateTimer(now) {
  const elapsed = now - roundStartedAt;
  const remaining = Math.max(0, ROUND_TIME - elapsed);
  const seconds = remaining / 1000;
  timerBar.style.width = `${(remaining / ROUND_TIME) * 100}%`;
  timerText.textContent = `${seconds.toFixed(1)}초`;
  timer.setAttribute('aria-valuenow', seconds.toFixed(1));
  timer.classList.toggle('danger', remaining <= 2000);

  if (remaining <= 0) {
    answer(null, null);
    return;
  }
  animationFrame = requestAnimationFrame(updateTimer);
}

function rememberMiss(task) {
  if (!missedTasks.includes(task)) missedTasks.push(task);
}

function answer(selected, selectedButton) {
  if (answerLocked) return;
  answerLocked = true;
  cancelAnimationFrame(animationFrame);

  const task = DAY_TASKS[round];
  const remaining = Math.max(0, ROUND_TIME - (performance.now() - roundStartedAt));
  const buttons = [...choices.querySelectorAll('button')];
  const correctButton = buttons[currentChoices.indexOf(task)];
  buttons.forEach((button) => { button.disabled = true; });
  correctButton?.classList.add('correct');

  if (selected === task) {
    streak += 1;
    const speedPoints = Math.ceil(remaining / 50);
    const streakPoints = Math.min((streak - 1) * 10, 50);
    const gained = 100 + speedPoints + streakPoints;
    score += gained;
    feedback.textContent = `정답! ${task.japanese} (${task.reading})  +${gained}점`;
    feedback.className = 'feedback good';
  } else {
    lives -= 1;
    streak = 0;
    rememberMiss(task);
    selectedButton?.classList.add('wrong');
    feedback.textContent = selected
      ? `아쉬워요! 정답은 ${task.japanese} (${task.reading})`
      : `시간 종료! 정답은 ${task.japanese} (${task.reading})`;
    feedback.className = 'feedback bad';
  }

  updateHud();
  round += 1;
  dayProgressBar.style.width = `${(round / DAY_TASKS.length) * 100}%`;
  nextRoundTimer = window.setTimeout(showRound, 1100);
}

function getRank() {
  if (score >= 1750) return '번개 일본어 달인';
  if (score >= 1350) return '민첩한 학습자';
  if (score >= 900) return '꾸준한 하루 탐험가';
  return '내일은 더 민첩하게';
}

function renderReview() {
  review.replaceChildren();
  const heading = document.createElement('h3');

  if (missedTasks.length === 0) {
    heading.textContent = '완벽해요! 오늘의 표현을 모두 맞혔습니다.';
    review.append(heading);
    return;
  }

  heading.textContent = '한 번 더 볼 표현';
  const list = document.createElement('ul');
  missedTasks.forEach((task) => {
    const item = document.createElement('li');
    const word = document.createElement('strong');
    word.lang = 'ja';
    word.textContent = task.japanese;
    item.append(word, ` · ${task.korean}`);
    list.append(item);
  });
  review.append(heading, list);
}

function finishGame() {
  cancelAnimationFrame(animationFrame);
  window.clearTimeout(nextRoundTimer);
  const completed = round >= DAY_TASKS.length && lives > 0;

  resultKicker.textContent = completed ? '하루 완주!' : '오늘은 여기까지!';
  resultTitle.textContent = completed ? '민첩한 하루였어요!' : '내일 다시 도전해요!';
  resultMessage.textContent = completed
    ? '아침부터 밤까지 일본어 일과를 모두 마쳤습니다.'
    : `${round}번째 일과까지 도착했습니다. 틀린 표현을 복습해 보세요.`;
  finalScore.textContent = score.toLocaleString('ko-KR');
  rank.textContent = getRank();
  renderReview();
  showScreen(resultScreen);
  restartButton.focus();
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

document.addEventListener('keydown', (event) => {
  if (gameScreen.hidden || answerLocked || !['1', '2', '3'].includes(event.key)) return;
  event.preventDefault();
  choices.querySelectorAll('button')[Number(event.key) - 1]?.click();
});

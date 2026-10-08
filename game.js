const DAY_TASKS = [
  { time: '07:00', korean: '일어나다', kanji: '起きる', kana: 'おきる', reading: '오키루' },
  { time: '07:30', korean: '세수하다', kanji: '顔を洗う', kana: 'かおを あらう', reading: '카오오 아라우' },
  { time: '08:00', korean: '아침을 먹다', kanji: '朝ご飯を食べる', kana: 'あさごはんを たべる', reading: '아사고항오 타베루' },
  { time: '08:30', korean: '학교에 가다', kanji: '学校へ行く', kana: 'がっこうへ いく', reading: '각코오에 이쿠' },
  { time: '10:00', korean: '공부하다', kanji: '勉強する', kana: 'べんきょうする', reading: '벤쿄오스루' },
  { time: '12:30', korean: '점심을 먹다', kanji: '昼ご飯を食べる', kana: 'ひるごはんを たべる', reading: '히루고항오 타베루' },
  { time: '15:00', korean: '친구와 이야기하다', kanji: '友達と話す', kana: 'ともだちと はなす', reading: '토모다치토 하나스' },
  { time: '16:30', korean: '운동하다', kanji: '運動する', kana: 'うんどうする', reading: '운도오스루' },
  { time: '18:00', korean: '쇼핑하다', kanji: '買い物する', kana: 'かいものする', reading: '카이모노스루' },
  { time: '19:00', korean: '집에 돌아가다', kanji: '家へ帰る', kana: 'いえへ かえる', reading: '이에에 카에루' },
  { time: '21:00', korean: '목욕하다', kanji: 'お風呂に入る', kana: 'おふろに はいる', reading: '오후로니 하이루' },
  { time: '23:00', korean: '자다', kanji: '寝る', kana: 'ねる', reading: '네루' }
];

const QUESTION_MODES = [
  {
    label: '뜻 → 일본어',
    prompt: '이 행동을 일본어로 하면?',
    question: (task) => ({ main: task.korean, sub: '한자와 읽는 법을 함께 확인하세요.', lang: 'ko' }),
    choice: (task) => ({ main: task.kanji, sub: task.kana, lang: 'ja' })
  },
  {
    label: '일본어 → 뜻',
    prompt: '이 일본어의 뜻은?',
    question: (task) => ({ main: task.kanji, sub: task.kana, lang: 'ja' }),
    choice: (task) => ({ main: task.korean, sub: '', lang: 'ko' })
  },
  {
    label: '漢字 → 읽기',
    prompt: '이 한자는 어떻게 읽을까요?',
    question: (task) => ({ main: task.kanji, sub: '정확한 히라가나를 고르세요.', lang: 'ja' }),
    choice: (task) => ({ main: task.kana, sub: '', lang: 'ja' })
  },
  {
    label: '읽기 → 漢字',
    prompt: '이 읽기에 맞는 한자는?',
    question: (task) => ({ main: task.kana, sub: `뜻: ${task.korean}`, lang: 'ja' }),
    choice: (task) => ({ main: task.kanji, sub: '', lang: 'ja' })
  }
];

const NORMAL_TIME = 5200;
const QUICK_TIME = 3200;
const MAX_LIVES = 3;

const gameShell = document.querySelector('#game-shell');
const startScreen = document.querySelector('#start-screen');
const gameScreen = document.querySelector('#game-screen');
const resultScreen = document.querySelector('#result-screen');
const startButton = document.querySelector('#start-button');
const restartButton = document.querySelector('#restart-button');
const dayTime = document.querySelector('#day-time');
const scoreDisplay = document.querySelector('#score');
const comboDisplay = document.querySelector('#combo');
const livesDisplay = document.querySelector('#lives');
const roundCount = document.querySelector('#round-count');
const dayProgressBar = document.querySelector('#day-progress-bar');
const runner = document.querySelector('#runner');
const questionCard = document.querySelector('#question-card');
const missionBadge = document.querySelector('#mission-badge');
const modeLabel = document.querySelector('#mode-label');
const promptLabel = document.querySelector('#prompt-label');
const question = document.querySelector('#question');
const questionHint = document.querySelector('#question-hint');
const choices = document.querySelector('#choices');
const feedback = document.querySelector('#feedback');
const rushPanel = document.querySelector('#rush-panel');
const rushStatus = document.querySelector('#rush-status');
const rushTrack = document.querySelector('.rush-track');
const rushBar = document.querySelector('#rush-bar');
const timer = document.querySelector('#timer');
const timerBar = document.querySelector('#timer-bar');
const timerText = document.querySelector('#timer-text');
const resultKicker = document.querySelector('#result-kicker');
const resultTitle = document.querySelector('#result-title');
const resultMessage = document.querySelector('#result-message');
const finalScore = document.querySelector('#final-score');
const rank = document.querySelector('#rank');
const accuracy = document.querySelector('#accuracy');
const bestComboDisplay = document.querySelector('#best-combo');
const kanjiCount = document.querySelector('#kanji-count');
const review = document.querySelector('#review');

let round = 0;
let score = 0;
let lives = MAX_LIVES;
let streak = 0;
let bestStreak = 0;
let correctCount = 0;
let missedTasks = [];
let masteredTasks = new Set();
let modeDeck = [];
let currentChoices = [];
let currentMode = QUESTION_MODES[0];
let currentRoundTime = NORMAL_TIME;
let isQuickMission = false;
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

function makeModeDeck() {
  const deck = [];
  while (deck.length < DAY_TASKS.length) deck.push(...shuffled(QUESTION_MODES));
  return deck.slice(0, DAY_TASKS.length);
}

function getPhase() {
  if (round < 3) return 'morning';
  if (round < 8) return 'day';
  if (round < 10) return 'evening';
  return 'night';
}

function updateRush() {
  const active = streak >= 3;
  const gaugeValue = Math.min(streak, 3);
  comboDisplay.textContent = `${streak} COMBO`;
  comboDisplay.closest('.hud-item').classList.toggle('on', active);
  rushPanel.classList.toggle('active', active);
  rushBar.style.width = `${(gaugeValue / 3) * 100}%`;
  rushTrack.setAttribute('aria-valuenow', gaugeValue);
  rushStatus.textContent = active ? '疾風 MODE · 점수 ×1.5' : `${3 - gaugeValue}연속 정답 더 필요`;
}

function updateHud() {
  scoreDisplay.textContent = score.toLocaleString('ko-KR');
  livesDisplay.textContent = Array.from({ length: MAX_LIVES }, (_, index) => index < lives ? '♥' : '♡').join(' ');
  livesDisplay.setAttribute('aria-label', `남은 기회 ${lives}개`);
  updateRush();
}

function startGame() {
  window.clearTimeout(nextRoundTimer);
  cancelAnimationFrame(animationFrame);
  round = 0;
  score = 0;
  lives = MAX_LIVES;
  streak = 0;
  bestStreak = 0;
  correctCount = 0;
  missedTasks = [];
  masteredTasks = new Set();
  modeDeck = makeModeDeck();
  dayProgressBar.style.width = '0%';
  runner.style.left = '0%';
  updateHud();
  showScreen(gameScreen);
  showRound();
}

function makeChoices(task) {
  const alternatives = shuffled(DAY_TASKS.filter((item) => item !== task)).slice(0, 2);
  return shuffled([task, ...alternatives]);
}

function renderQuestion(task) {
  const questionView = currentMode.question(task);
  promptLabel.textContent = currentMode.prompt;
  question.textContent = questionView.main;
  question.lang = questionView.lang;
  questionHint.textContent = questionView.sub;
  modeLabel.textContent = currentMode.label;

  currentChoices.forEach((choice, index) => {
    const choiceView = currentMode.choice(choice);
    const button = document.createElement('button');
    const main = document.createElement('span');
    button.type = 'button';
    button.className = 'choice-button';
    button.dataset.key = index + 1;
    button.lang = choiceView.lang;
    main.className = 'choice-main';
    main.textContent = choiceView.main;
    button.append(main);

    if (choiceView.sub) {
      const sub = document.createElement('span');
      sub.className = 'choice-sub';
      sub.textContent = choiceView.sub;
      button.append(sub);
    }

    button.addEventListener('click', () => answer(choice, button));
    choices.append(button);
  });
}

function showRound() {
  if (lives <= 0 || round >= DAY_TASKS.length) {
    finishGame();
    return;
  }

  answerLocked = false;
  const task = DAY_TASKS[round];
  currentMode = modeDeck[round];
  currentChoices = makeChoices(task);
  isQuickMission = (round + 1) % 4 === 0;
  currentRoundTime = isQuickMission ? QUICK_TIME : NORMAL_TIME;

  gameShell.dataset.phase = getPhase();
  dayTime.textContent = task.time;
  roundCount.textContent = `${round + 1} / ${DAY_TASKS.length}`;
  questionCard.className = `question-card${isQuickMission ? ' quick' : ''}${streak >= 3 ? ' rush' : ''}`;
  missionBadge.textContent = isQuickMission ? '⚡ 돌발 퀵 미션 ×2' : '일상 미션';
  missionBadge.className = `mission-badge${isQuickMission ? ' quick' : ''}`;
  feedback.textContent = isQuickMission ? '3.2초! 민첩하게 고르면 점수 두 배!' : '정답을 빠르게 골라 보세요!';
  feedback.className = 'feedback';
  timer.classList.remove('danger');
  timer.setAttribute('aria-valuemax', (currentRoundTime / 1000).toFixed(1));
  choices.replaceChildren();
  renderQuestion(task);

  questionCard.classList.remove('pop');
  void questionCard.offsetWidth;
  questionCard.classList.add('pop');

  roundStartedAt = performance.now();
  animationFrame = requestAnimationFrame(updateTimer);
  choices.querySelector('button')?.focus();
}

function updateTimer(now) {
  const elapsed = now - roundStartedAt;
  const remaining = Math.max(0, currentRoundTime - elapsed);
  const seconds = remaining / 1000;
  timerBar.style.width = `${(remaining / currentRoundTime) * 100}%`;
  timerText.textContent = `${seconds.toFixed(1)}초`;
  timer.setAttribute('aria-valuenow', seconds.toFixed(1));
  timer.classList.toggle('danger', remaining <= Math.min(2000, currentRoundTime * .45));

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
  const remaining = Math.max(0, currentRoundTime - (performance.now() - roundStartedAt));
  const buttons = [...choices.querySelectorAll('button')];
  const correctButton = buttons[currentChoices.indexOf(task)];
  buttons.forEach((button) => { button.disabled = true; });
  correctButton?.classList.add('correct');

  if (selected === task) {
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);
    correctCount += 1;
    masteredTasks.add(task);
    const speedPoints = Math.ceil((remaining / currentRoundTime) * 100);
    const streakPoints = Math.min((streak - 1) * 12, 60);
    const quickMultiplier = isQuickMission ? 2 : 1;
    const rushMultiplier = streak >= 3 ? 1.5 : 1;
    const gained = Math.round((100 + speedPoints + streakPoints) * quickMultiplier * rushMultiplier);
    score += gained;
    const rushMessage = streak === 3 ? ' · 疾風 모드 발동!' : '';
    feedback.textContent = `정답! ${task.kanji}（${task.kana}） +${gained}점${rushMessage}`;
    feedback.className = 'feedback good';
  } else {
    const hadRush = streak >= 3;
    lives -= 1;
    streak = 0;
    rememberMiss(task);
    selectedButton?.classList.add('wrong');
    const resetMessage = hadRush ? ' · 질풍 게이지 리셋!' : '';
    feedback.textContent = selected
      ? `아쉬워요! 정답은 ${task.kanji}（${task.kana}）${resetMessage}`
      : `시간 종료! 정답은 ${task.kanji}（${task.kana}）${resetMessage}`;
    feedback.className = 'feedback bad';
  }

  updateHud();
  round += 1;
  const progress = (round / DAY_TASKS.length) * 100;
  dayProgressBar.style.width = `${progress}%`;
  runner.style.left = `${progress}%`;
  nextRoundTimer = window.setTimeout(showRound, 1250);
}

function getRank() {
  if (score >= 3800) return '疾風의 한자 달인';
  if (score >= 2800) return '번개 일본어 러너';
  if (score >= 1900) return '민첩한 학습자';
  if (score >= 1100) return '꾸준한 하루 탐험가';
  return '내일은 더 민첩하게';
}

function renderReview() {
  review.replaceChildren();
  const heading = document.createElement('h3');

  if (missedTasks.length === 0) {
    heading.textContent = '漢字 도감 완성! 오늘의 표현을 모두 맞혔습니다.';
    review.append(heading);
    return;
  }

  heading.textContent = '놓친 한자 다시 보기';
  const list = document.createElement('ul');
  missedTasks.forEach((task) => {
    const item = document.createElement('li');
    const word = document.createElement('strong');
    word.lang = 'ja';
    word.textContent = task.kanji;
    item.append(word, `（${task.kana}） · ${task.korean}`);
    list.append(item);
  });
  review.append(heading, list);
}

function finishGame() {
  cancelAnimationFrame(animationFrame);
  window.clearTimeout(nextRoundTimer);
  const completed = round >= DAY_TASKS.length && lives > 0;
  const answered = Math.max(round, 1);

  resultKicker.textContent = completed ? '하루 완주!' : '오늘은 여기까지!';
  resultTitle.textContent = completed ? '민첩한 하루였어요!' : '내일 다시 도전해요!';
  resultMessage.textContent = completed
    ? '네 가지 유형의 일본어 미션을 돌파하고 하루를 완주했습니다.'
    : `${round}번째 일과까지 달렸습니다. 놓친 한자를 복습해 보세요.`;
  finalScore.textContent = score.toLocaleString('ko-KR');
  rank.textContent = getRank();
  accuracy.textContent = `${Math.round((correctCount / answered) * 100)}%`;
  bestComboDisplay.textContent = bestStreak;
  kanjiCount.textContent = `${masteredTasks.size}개`;
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

const GAME_DURATION = 40;
const MAX_LIVES = 3;
const LANES = [180, 360, 540];

const OBSTACLES = [
  { stages: ['commute'], kanji: '寝坊', caption: 'OVERSLEPT', color: '#d84f47', accent: '#8d292d', width: 94, height: 62 },
  { stages: ['commute'], kanji: '満員', caption: 'CROWDED', color: '#b94e58', accent: '#752d36', width: 94, height: 64 },
  { stages: ['commute', 'route'], kanji: '雨', caption: 'RAIN', color: '#4189c7', accent: '#245981', width: 72, height: 72 },
  { stages: ['commute', 'route', 'lastTrain'], kanji: '渋滞', caption: 'TRAFFIC', color: '#b94e58', accent: '#752d36', width: 98, height: 58 },
  { stages: ['office'], kanji: '会議', caption: 'MEETING', color: '#775886', accent: '#493552', width: 94, height: 64 },
  { stages: ['office', 'lastTrain'], kanji: '締切', caption: 'DEADLINE', color: '#e8733f', accent: '#9a3d27', width: 88, height: 68 },
  { stages: ['office'], kanji: '電話', caption: 'CALL', color: '#3c7f8c', accent: '#24515a', width: 82, height: 66 },
  { stages: ['office'], kanji: '書類', caption: 'PAPERWORK', color: '#a16a46', accent: '#69432d', width: 94, height: 62 },
  { stages: ['route', 'lastTrain'], kanji: '残業', caption: 'OVERTIME', color: '#775886', accent: '#493552', width: 94, height: 64 },
  { stages: ['route'], kanji: '疲労', caption: 'FATIGUE', color: '#5e7187', accent: '#384654', width: 88, height: 66 },
  { stages: ['lastTrain'], kanji: '終電', caption: 'LAST TRAIN', color: '#d84f47', accent: '#8d292d', width: 100, height: 66 },
  { stages: ['lastTrain'], kanji: '眠気', caption: 'SLEEPY', color: '#526b91', accent: '#30405a', width: 88, height: 68 }
];

const ITEMS = [
  { kanji: '速', name: '스피드', color: '#f17b45', glow: '#ffd34e' },
  { kanji: '守', name: '방어', color: '#4189c7', glow: '#9ed9ff' },
  { kanji: '時', name: '시간', color: '#815ca7', glow: '#d6b7f1' },
  { kanji: '福', name: '행운', color: '#d99a22', glow: '#ffe08a' },
  { kanji: '磁', name: '자석', color: '#c15a92', glow: '#ffc3e4' },
  { kanji: '休', name: '휴식', color: '#359b83', glow: '#a8f0d9' }
];

const ROUTE_CHOICES = [
  { kanji: '近道', caption: '지름길', color: '#d84f47', description: '고득점 · 위험 증가' },
  { kanji: '休憩', caption: '잠깐 휴식', color: '#359b83', description: '기회 · 방어 회복' },
  { kanji: '残業', caption: '야근 도전', color: '#775886', description: '큰 점수 · 난이도 상승' }
];

const COMBO_WINDOW = 7;
const LEADERBOARD_KEY = 'ichinichi-dash-leaderboard-v1';

const PHASES = [
  { from: 0, key: 'commute', name: 'COMMUTE', kanji: '朝', top: '#78c5e1', bottom: '#f9ddb0', city: '#6c887e' },
  { from: .28, key: 'office', name: 'OFFICE', kanji: '昼', top: '#bad8cb', bottom: '#f3e7c1', city: '#5f8172' },
  { from: .62, key: 'route', name: 'CHOOSE ROUTE', kanji: '夕', top: '#ef8f66', bottom: '#f8d899', city: '#5f5d68' },
  { from: .84, key: 'lastTrain', name: 'LAST TRAIN', kanji: '夜', top: '#24365f', bottom: '#735c88', city: '#273640' }
];

const RANDOM_EVENTS = [
  { kanji: '寝坊', title: '늦잠!', description: '5초 동안 일정이 더 빠르게 몰려옵니다.', tone: 'danger', apply: () => { hardModeUntil = Math.max(hardModeUntil, elapsed + 5); } },
  { kanji: '雨', title: '갑작스러운 비!', description: '5초 동안 이동이 미끄러워집니다.', tone: 'danger', apply: () => { slipperyUntil = Math.max(slipperyUntil, elapsed + 5); } },
  { kanji: '早退', title: '뜻밖의 조기 퇴근!', description: '점수와 질풍 게이지를 획득합니다.', tone: 'bonus', apply: () => { score += 500; addRush(30); } },
  { kanji: '休憩', title: '잠깐의 휴식!', description: '기회와 방어막을 하나 회복합니다.', tone: 'bonus', apply: () => { lives = Math.min(MAX_LIVES, lives + 1); shieldCharges = Math.min(3, shieldCharges + 1); } }
];

const startScreen = document.querySelector('#start-screen');
const gameScreen = document.querySelector('#game-screen');
const resultScreen = document.querySelector('#result-screen');
const startButton = document.querySelector('#start-button');
const restartButton = document.querySelector('#restart-button');
const moveLeftButton = document.querySelector('#move-left');
const moveRightButton = document.querySelector('#move-right');
const dayTime = document.querySelector('#day-time');
const scoreDisplay = document.querySelector('#score');
const comboDisplay = document.querySelector('#combo');
const livesDisplay = document.querySelector('#lives');
const rushPanel = document.querySelector('#rush-panel');
const rushTrack = document.querySelector('#rush-track');
const rushBar = document.querySelector('#rush-bar');
const rushStatus = document.querySelector('#rush-status');
const itemChain = document.querySelector('#item-chain');
const canvasWrap = document.querySelector('#canvas-wrap');
const canvas = document.querySelector('#game-canvas');
const countdown = document.querySelector('#countdown');
const eventBanner = document.querySelector('#event-banner');
const eventTitle = document.querySelector('#event-title');
const eventDescription = document.querySelector('#event-description');
const phaseBadge = document.querySelector('#phase-badge');
const announcement = document.querySelector('#game-announcement');
const resultKicker = document.querySelector('#result-kicker');
const resultStamp = document.querySelector('#result-stamp');
const resultTitle = document.querySelector('#result-title');
const resultMessage = document.querySelector('#result-message');
const finalScore = document.querySelector('#final-score');
const rank = document.querySelector('#rank');
const distance = document.querySelector('#distance');
const dodgedDisplay = document.querySelector('#dodged');
const bestComboDisplay = document.querySelector('#best-combo');
const rankingScoreDisplay = document.querySelector('#ranking-score');
const itemResult = document.querySelector('#item-result');
const playerName = document.querySelector('#player-name');
const saveScoreButton = document.querySelector('#save-score');
const saveMessage = document.querySelector('#save-message');
const startLeaderboard = document.querySelector('#start-leaderboard');
const resultLeaderboard = document.querySelector('#result-leaderboard');
const context = canvas.getContext('2d');

let animationFrame = null;
let lastFrame = 0;
let countdownStarted = 0;
let status = 'ready';
let elapsed = 0;
let score = 0;
let lives = MAX_LIVES;
let combo = 0;
let bestCombo = 0;
let dodged = 0;
let lane = 1;
let playerX = LANES[lane];
let objects = [];
let particles = [];
let spawnAccumulator = 0;
let rushMeter = 0;
let rushUntil = 0;
let slowUntil = 0;
let shieldCharges = 0;
let magnetUntil = 0;
let hardModeUntil = 0;
let slipperyUntil = 0;
let randomEventIndex = 0;
let eventDeck = [];
let routeChoiceTriggered = false;
let choiceGateActive = false;
let eventHideTimer = null;
let invincibleUntil = 0;
let shakeUntil = 0;
let recentItem = null;
let itemComboCount = 0;
let rankingScore = 0;
let scoreSaved = false;
let itemCounts = { '速': 0, '守': 0, '時': 0, '福': 0, '磁': 0, '休': 0 };
let currentPhase = PHASES[0];

function showScreen(activeScreen) {
  [startScreen, gameScreen, resultScreen].forEach((screen) => {
    screen.hidden = screen !== activeScreen;
  });
}

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffled(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function announce(message) {
  announcement.textContent = '';
  window.setTimeout(() => { announcement.textContent = message; }, 20);
}

function startGame() {
  cancelAnimationFrame(animationFrame);
  status = 'countdown';
  elapsed = 0;
  score = 0;
  lives = MAX_LIVES;
  combo = 0;
  bestCombo = 0;
  dodged = 0;
  lane = 1;
  playerX = LANES[lane];
  objects = [];
  particles = [];
  spawnAccumulator = .35;
  rushMeter = 0;
  rushUntil = 0;
  slowUntil = 0;
  shieldCharges = 0;
  magnetUntil = 0;
  hardModeUntil = 0;
  slipperyUntil = 0;
  randomEventIndex = 0;
  eventDeck = shuffled(RANDOM_EVENTS);
  routeChoiceTriggered = false;
  choiceGateActive = false;
  window.clearTimeout(eventHideTimer);
  eventBanner.hidden = true;
  invincibleUntil = 0;
  shakeUntil = 0;
  recentItem = null;
  itemComboCount = 0;
  rankingScore = 0;
  scoreSaved = false;
  itemCounts = { '速': 0, '守': 0, '時': 0, '福': 0, '磁': 0, '休': 0 };
  saveScoreButton.disabled = false;
  saveMessage.textContent = '최고 콤보가 높을수록 랭킹 점수가 크게 올라갑니다.';
  itemChain.textContent = '아이템을 연속으로 모으면 한자 조합 발동!';
  itemChain.classList.remove('ready');
  currentPhase = PHASES[0];
  phaseBadge.innerHTML = '<span lang="ja">朝</span> COMMUTE';
  canvasWrap.classList.remove('rush');
  countdown.hidden = false;
  countdown.classList.remove('go');
  countdown.textContent = '3';
  updateHud();
  showScreen(gameScreen);
  countdownStarted = performance.now();
  lastFrame = countdownStarted;
  animationFrame = requestAnimationFrame(gameLoop);
}

function moveLane(direction) {
  if (status !== 'playing' && status !== 'countdown') return;
  const nextLane = Math.max(0, Math.min(LANES.length - 1, lane + direction));
  if (nextLane === lane) return;
  lane = nextLane;
  addParticle(playerX, 405, direction < 0 ? '←' : '→', '#ffd34e', 24);
}

function spawnObject(objectLane, type, data) {
  objects.push({
    lane: objectLane,
    x: LANES[objectLane],
    y: -65,
    type,
    data,
    width: type === 'obstacle' ? data.width : type === 'gate' ? 150 : 54,
    height: type === 'obstacle' ? data.height : type === 'gate' ? 82 : 54,
    passed: false,
    remove: false,
    spin: Math.random() * Math.PI * 2
  });
}

function getSpawnItem() {
  if (recentItem && elapsed - recentItem.time <= COMBO_WINDOW && Math.random() < .38) {
    const comboPartners = {
      '速': ['速', '時'],
      '時': ['速'],
      '守': ['守'],
      '福': ['福']
    };
    const partners = comboPartners[recentItem.kanji];
    if (partners) return randomFrom(ITEMS.filter((item) => partners.includes(item.kanji)));
  }
  return randomFrom(ITEMS);
}

function spawnWave() {
  const progress = elapsed / GAME_DURATION;
  if (Math.random() < .24) {
    spawnObject(Math.floor(Math.random() * 3), 'item', getSpawnItem());
    return;
  }

  const laneOrder = shuffled([0, 1, 2]);
  const stageObstacles = OBSTACLES.filter((obstacle) => obstacle.stages.includes(currentPhase.key));
  const pressure = currentPhase.key === 'lastTrain' || hardModeUntil > elapsed;
  const obstacleCount = pressure || (progress > .28 && Math.random() < (.18 + progress * .24)) ? 2 : 1;
  for (let index = 0; index < obstacleCount; index += 1) {
    spawnObject(laneOrder[index], 'obstacle', randomFrom(stageObstacles));
  }
}

function showRandomEvent(event) {
  eventTitle.textContent = `${event.kanji} · ${event.title}`;
  eventDescription.textContent = event.description;
  eventBanner.className = `event-banner ${event.tone}`;
  eventBanner.hidden = false;
  window.clearTimeout(eventHideTimer);
  eventHideTimer = window.setTimeout(() => { eventBanner.hidden = true; }, 2400);
  event.apply();
  addParticle(360, 105, `${event.kanji} EVENT!`, event.tone === 'bonus' ? '#ffd34e' : '#ff9a82', 24);
  announce(`${event.title} ${event.description}`);
}

function updateRandomEvents() {
  const eventTimes = [8, 18];
  if (randomEventIndex >= eventTimes.length || elapsed < eventTimes[randomEventIndex]) return;
  showRandomEvent(eventDeck[randomEventIndex]);
  randomEventIndex += 1;
}

function spawnRouteChoice() {
  routeChoiceTriggered = true;
  choiceGateActive = true;
  objects = [];
  ROUTE_CHOICES.forEach((choice, choiceLane) => spawnObject(choiceLane, 'gate', choice));
  showRandomEvent({
    kanji: '選択',
    title: '퇴근길 선택!',
    description: '원하는 경로의 레인으로 이동하세요.',
    tone: 'choice',
    apply: () => {}
  });
}

function chooseRoute(choice) {
  choiceGateActive = false;
  objects.forEach((object) => {
    if (object.type === 'gate') object.remove = true;
  });

  if (choice.kanji === '近道') {
    score += 700 * scoreMultiplier();
    hardModeUntil = Math.max(hardModeUntil, elapsed + 5);
  } else if (choice.kanji === '休憩') {
    lives = Math.min(MAX_LIVES, lives + 1);
    shieldCharges = Math.min(3, shieldCharges + 1);
  } else {
    score += 1100 * scoreMultiplier();
    hardModeUntil = Math.max(hardModeUntil, elapsed + 7);
    addRush(35);
  }
  addParticle(playerX, 340, `${choice.kanji} 선택!`, '#ffd34e', 25);
  announce(`${choice.caption} 선택! ${choice.description}`);
}

function overlaps(object) {
  const horizontal = Math.abs(playerX - object.x) < (46 + object.width) * .42;
  const vertical = Math.abs(405 - object.y) < (58 + object.height) * .4;
  return horizontal && vertical;
}

function addParticle(x, y, text, color, size = 18) {
  particles.push({ x, y, text, color, size, life: 1, velocity: 42 + Math.random() * 20 });
}

function activateRush(duration = 5, label = '疾風 MODE!') {
  rushMeter = 0;
  rushUntil = Math.max(rushUntil, elapsed + duration);
  addParticle(playerX, 350, label, '#ffd34e', 25);
  announce(`${label} 발동! ${duration}초 동안 점수가 두 배입니다.`);
}

function addRush(amount) {
  if (rushUntil > elapsed) return;
  rushMeter = Math.min(100, rushMeter + amount);
  if (rushMeter >= 100) activateRush();
}

function scoreMultiplier() {
  return rushUntil > elapsed ? 2 : 1;
}

function triggerItemCombo(first, second) {
  let comboName = '';
  if (first === '速' && second === '速') {
    comboName = '神速';
    activateRush(7, '神速 COMBO!');
    score += 500;
  } else if ((first === '時' && second === '速') || (first === '速' && second === '時')) {
    comboName = '時速';
    slowUntil = Math.max(slowUntil, elapsed + 6);
    activateRush(5, '時速 COMBO!');
    score += 350;
  } else if (first === '守' && second === '守') {
    comboName = '鉄壁';
    shieldCharges = 3;
    score += 300;
    addParticle(playerX, 350, '鉄壁 COMBO!', '#9ed9ff', 25);
    announce('철벽 조합! 충돌을 세 번 막아냅니다.');
  } else if (first === '福' && second === '福') {
    comboName = '大福';
    score += 1200 * scoreMultiplier();
    addParticle(playerX, 350, '大福 +1200!', '#ffe08a', 25);
    announce('대복 조합! 대량의 보너스 점수를 획득했습니다.');
  }

  if (!comboName) return false;
  itemComboCount += 1;
  itemChain.textContent = `${first} + ${second} = ${comboName} 발동!`;
  itemChain.classList.add('ready');
  return true;
}

function clearVisibleObstacles() {
  const targets = objects.filter((object) => object.type === 'obstacle' && !object.remove);
  for (const target of targets) {
    target.remove = true;
    addParticle(target.x, target.y, '休', '#a8f0d9', 20);
  }
  score += Math.max(100, targets.length * 90) * scoreMultiplier();
  announce(`휴식 아이템! 장애물 ${targets.length}개를 정리했습니다.`);
}

function collectItem(object) {
  object.remove = true;
  const kanji = object.data.kanji;
  itemCounts[kanji] += 1;
  addParticle(object.x, object.y, `${kanji}!`, object.data.glow, 26);

  if (kanji === '速') {
    addRush(34);
    score += 120 * scoreMultiplier();
    announce('속 아이템! 질풍 게이지가 올랐습니다.');
  } else if (kanji === '守') {
    shieldCharges = Math.min(3, shieldCharges + 1);
    announce(`수 아이템! 방어막 ${shieldCharges}개를 보유했습니다.`);
  } else if (kanji === '時') {
    slowUntil = Math.max(slowUntil, elapsed + 4);
    announce('시 아이템! 4초 동안 장애물이 느려집니다.');
  } else if (kanji === '福') {
    score += 350 * scoreMultiplier();
    announce('복 아이템! 보너스 점수를 얻었습니다.');
  } else if (kanji === '磁') {
    magnetUntil = Math.max(magnetUntil, elapsed + 6);
    announce('자석 아이템! 6초 동안 모든 아이템을 끌어당깁니다.');
  } else if (kanji === '休') {
    clearVisibleObstacles();
  }

  const comboTriggered = recentItem && elapsed - recentItem.time <= COMBO_WINDOW
    ? triggerItemCombo(recentItem.kanji, kanji)
    : false;

  if (comboTriggered) {
    recentItem = null;
  } else {
    recentItem = { kanji, time: elapsed };
    const hints = { '速': '速 또는 時', '時': '速', '守': '守', '福': '福' };
    itemChain.textContent = hints[kanji]
      ? `${kanji} 획득 · 7초 안에 ${hints[kanji]}을 모아 조합!`
      : `${kanji} 아이템 발동!`;
    itemChain.classList.add('ready');
  }
}

function hitObstacle(object) {
  object.remove = true;
  if (shieldCharges > 0) {
    shieldCharges -= 1;
    addParticle(playerX, 380, `BLOCK ×${shieldCharges}`, '#9ed9ff', 23);
    announce(`방어막으로 장애물을 막았습니다. 남은 방어막 ${shieldCharges}개.`);
    return;
  }

  if (invincibleUntil > elapsed) return;
  lives -= 1;
  combo = 0;
  invincibleUntil = elapsed + 1.15;
  shakeUntil = elapsed + .35;
  addParticle(playerX, 380, 'OUCH!', '#ffb5a7', 24);
  announce(`장애물에 부딪혔습니다. 남은 기회 ${lives}개.`);
  if (lives <= 0) finishGame(false);
}

function passObstacle(object) {
  object.passed = true;
  dodged += 1;
  combo += 1;
  bestCombo = Math.max(bestCombo, combo);
  score += (35 + Math.min(combo, 20) * 3) * scoreMultiplier();
  addRush(8);
  if (combo > 0 && combo % 10 === 0) {
    addParticle(playerX, 360, `${combo} COMBO!`, '#ffd34e', 22);
  }
}

function updateObjects(delta) {
  const progress = elapsed / GAME_DURATION;
  const baseSpeed = 185 + progress * 235;
  let speed = slowUntil > elapsed ? baseSpeed * .52 : baseSpeed;
  if (hardModeUntil > elapsed) speed *= 1.22;

  for (const object of objects) {
    object.y += speed * delta;
    if (object.type === 'item' && magnetUntil > elapsed && object.y > 120) {
      object.x += (playerX - object.x) * Math.min(1, delta * 5.5);
    }
    object.spin += delta * 2.4;

    if (!object.remove && overlaps(object)) {
      if (object.type === 'item') collectItem(object);
      else if (object.type === 'gate') chooseRoute(object.data);
      else hitObstacle(object);
    }

    if (object.type === 'gate' && choiceGateActive && !object.remove && object.y > 468 && object.lane === lane) {
      chooseRoute(object.data);
    }
    if (object.type === 'obstacle' && !object.passed && !object.remove && object.y > 470) {
      passObstacle(object);
    }
    if (object.y > 555) object.remove = true;
  }
  objects = objects.filter((object) => !object.remove);
}

function updateParticles(delta) {
  for (const particle of particles) {
    particle.y -= particle.velocity * delta;
    particle.life -= delta * 1.25;
  }
  particles = particles.filter((particle) => particle.life > 0);
}

function updatePhase() {
  const progress = elapsed / GAME_DURATION;
  const nextPhase = [...PHASES].reverse().find((phase) => progress >= phase.from) || PHASES[0];
  if (nextPhase !== currentPhase) {
    currentPhase = nextPhase;
    phaseBadge.innerHTML = `<span lang="ja">${nextPhase.kanji}</span> ${nextPhase.name}`;
    addParticle(360, 100, `${nextPhase.kanji} · ${nextPhase.name}`, '#ffffff', 25);
  }
}

function updateDayTime() {
  const startMinutes = 7 * 60;
  const endMinutes = 23 * 60;
  const totalMinutes = Math.round(startMinutes + (endMinutes - startMinutes) * Math.min(1, elapsed / GAME_DURATION));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  dayTime.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function updateHud() {
  const rushActive = rushUntil > elapsed;
  const rushRemaining = Math.max(0, rushUntil - elapsed);
  const meterValue = rushActive ? (rushRemaining / 5) * 100 : rushMeter;
  scoreDisplay.textContent = Math.floor(score).toLocaleString('ko-KR');
  comboDisplay.textContent = combo;
  livesDisplay.textContent = Array.from({ length: MAX_LIVES }, (_, index) => index < lives ? '♥' : '♡').join(' ');
  livesDisplay.setAttribute('aria-label', `남은 기회 ${lives}개`);
  rushPanel.classList.toggle('active', rushActive);
  canvasWrap.classList.toggle('rush', rushActive);
  rushBar.style.width = `${meterValue}%`;
  rushTrack.setAttribute('aria-valuenow', Math.round(meterValue));
  rushStatus.textContent = rushActive ? `疾風 MODE · ${rushRemaining.toFixed(1)}초 · 점수 ×2` : '회피하고 速을 모으세요';
  if (recentItem && elapsed - recentItem.time > COMBO_WINDOW) {
    recentItem = null;
    itemChain.textContent = '조합 시간이 끝났어요. 다음 아이템을 노려보세요!';
    itemChain.classList.remove('ready');
  }
}

function updateGame(delta) {
  elapsed = Math.min(GAME_DURATION, elapsed + delta);
  score += delta * 12 * scoreMultiplier();
  const movementSpeed = slipperyUntil > elapsed ? 6.5 : 14;
  playerX += (LANES[lane] - playerX) * Math.min(1, delta * movementSpeed);

  updatePhase();
  updateRandomEvents();
  if (!routeChoiceTriggered && elapsed >= 27) spawnRouteChoice();

  const progress = elapsed / GAME_DURATION;
  let spawnInterval = Math.max(.42, .9 - progress * .38);
  if (hardModeUntil > elapsed || currentPhase.key === 'lastTrain') spawnInterval *= .76;
  spawnAccumulator += delta;
  if (!choiceGateActive && spawnAccumulator >= spawnInterval) {
    spawnAccumulator -= spawnInterval;
    spawnWave();
  }

  updateObjects(delta);
  updateParticles(delta);
  updateDayTime();
  updateHud();

  if (elapsed >= GAME_DURATION && status === 'playing') finishGame(true);
}

function roundedRect(x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawBackground() {
  const gradient = context.createLinearGradient(0, 0, 0, 480);
  gradient.addColorStop(0, currentPhase.top);
  gradient.addColorStop(1, currentPhase.bottom);
  context.fillStyle = gradient;
  context.fillRect(0, 0, 720, 480);

  if (currentPhase.key === 'office') {
    context.fillStyle = '#f5edcf';
    context.fillRect(0, 118, 720, 72);
    context.fillStyle = '#315f55';
    context.fillRect(44, 76, 158, 12);
    context.fillRect(518, 76, 158, 12);
    context.fillStyle = '#ffffff';
    for (const x of [65, 112, 159, 539, 586, 633]) context.fillRect(x, 42, 27, 34);
    context.fillStyle = '#102f2a';
    context.beginPath();
    context.arc(360, 80, 36, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#fffdf4';
    context.beginPath();
    context.arc(360, 80, 30, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#102f2a';
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(360, 80);
    context.lineTo(360, 59);
    context.moveTo(360, 80);
    context.lineTo(376, 88);
    context.stroke();
    return;
  }

  const progress = elapsed / GAME_DURATION;
  const celestialX = 90 + progress * 540;
  const celestialY = 105 - Math.sin(progress * Math.PI) * 72;
  context.save();
  context.globalAlpha = .86;
  context.fillStyle = currentPhase.key === 'lastTrain' ? '#f3f0d4' : '#ffd34e';
  context.beginPath();
  context.arc(celestialX, celestialY, currentPhase.key === 'lastTrain' ? 22 : 29, 0, Math.PI * 2);
  context.fill();
  context.restore();

  // Solid silhouettes intentionally contain no window rectangles, preventing facade overflow.
  const buildingOffset = (elapsed * 8) % 70;
  context.fillStyle = currentPhase.city;
  for (let x = -70 - buildingOffset; x < 790; x += 70) {
    const buildingHeight = 45 + ((Math.floor((x + buildingOffset) / 70) * 29 + 60) % 70);
    const buildingTop = 185 - buildingHeight;
    context.fillRect(x, buildingTop, 52, buildingHeight);
    context.fillRect(x + 18, buildingTop - 7, 16, 7);
  }
}

function drawRoad() {
  if (currentPhase.key === 'office') {
    context.fillStyle = '#b78155';
    context.fillRect(70, 175, 580, 305);
    context.fillStyle = '#d5aa78';
    context.fillRect(84, 175, 552, 305);
    context.strokeStyle = 'rgba(72,45,29,.35)';
    context.lineWidth = 5;
    for (const divider of [270, 450]) {
      context.beginPath();
      context.moveTo(divider, 175);
      context.lineTo(divider, 480);
      context.stroke();
    }
    context.fillStyle = 'rgba(255,255,255,.12)';
    context.fillRect(102, 190, 156, 280);
    context.fillRect(282, 190, 156, 280);
    context.fillRect(462, 190, 156, 280);
    return;
  }

  context.fillStyle = '#263c3a';
  context.fillRect(90, 175, 540, 305);
  context.fillStyle = '#1b2c2a';
  context.fillRect(90, 175, 8, 305);
  context.fillRect(622, 175, 8, 305);

  const dashOffset = (elapsed * 260) % 76;
  context.fillStyle = 'rgba(255,255,255,.52)';
  for (const divider of [270, 450]) {
    for (let y = 175 - 76 + dashOffset; y < 500; y += 76) {
      context.fillRect(divider - 3, y, 6, 34);
    }
  }

  context.fillStyle = 'rgba(255,255,255,.08)';
  context.fillRect(104, 175, 152, 305);
  context.fillRect(284, 175, 152, 305);
  context.fillRect(464, 175, 152, 305);
}

function drawObstacle(object) {
  const { data } = object;
  const x = object.x - object.width / 2;
  const y = object.y - object.height / 2;
  context.save();
  context.shadowColor = 'rgba(0,0,0,.25)';
  context.shadowBlur = 8;
  context.shadowOffsetY = 5;
  roundedRect(x, y, object.width, object.height, 12);
  context.fillStyle = data.color;
  context.fill();
  context.shadowColor = 'transparent';
  context.lineWidth = 4;
  context.strokeStyle = data.accent;
  context.stroke();
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '900 25px "Noto Sans JP", sans-serif';
  context.fillText(data.kanji, object.x, object.y - 5);
  context.fillStyle = 'rgba(255,255,255,.78)';
  context.font = '700 8px "Noto Sans KR", sans-serif';
  context.fillText(data.caption, object.x, object.y + 19);
  context.restore();
}

function drawGate(object) {
  const { data } = object;
  const x = object.x - object.width / 2;
  const y = object.y - object.height / 2;
  context.save();
  context.shadowColor = 'rgba(0,0,0,.28)';
  context.shadowBlur = 10;
  context.shadowOffsetY = 5;
  roundedRect(x, y, object.width, object.height, 12);
  context.fillStyle = data.color;
  context.fill();
  context.shadowColor = 'transparent';
  context.lineWidth = 4;
  context.strokeStyle = '#fff3c4';
  context.stroke();
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '900 25px "Noto Sans JP", sans-serif';
  context.fillText(data.kanji, object.x, object.y - 14);
  context.font = '900 11px "Noto Sans KR", sans-serif';
  context.fillText(data.caption, object.x, object.y + 11);
  context.globalAlpha = .78;
  context.font = '700 8px "Noto Sans KR", sans-serif';
  context.fillText(data.description, object.x, object.y + 28);
  context.restore();
}

function drawItem(object) {
  const pulse = 1 + Math.sin(object.spin * 3) * .07;
  context.save();
  context.translate(object.x, object.y);
  context.scale(pulse, pulse);
  context.shadowColor = object.data.glow;
  context.shadowBlur = 22;
  context.fillStyle = object.data.glow;
  context.globalAlpha = .33;
  context.beginPath();
  context.arc(0, 0, 34, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
  context.fillStyle = object.data.color;
  context.beginPath();
  context.arc(0, 0, 26, 0, Math.PI * 2);
  context.fill();
  context.lineWidth = 3;
  context.strokeStyle = '#ffffff';
  context.stroke();
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '900 24px "Noto Sans JP", sans-serif';
  context.fillText(object.data.kanji, 0, 1);
  context.restore();
}

function drawOfficePlayer() {
  if (invincibleUntil > elapsed && Math.floor(elapsed * 12) % 2 === 0) return;
  context.save();
  context.fillStyle = 'rgba(0,0,0,.22)';
  context.beginPath();
  context.ellipse(playerX, 447, 38, 10, 0, 0, Math.PI * 2);
  context.fill();
  roundedRect(playerX - 38, 378, 76, 66, 13);
  context.fillStyle = rushUntil > elapsed ? '#f17b45' : '#176b50';
  context.fill();
  context.lineWidth = 5;
  context.strokeStyle = '#102f2a';
  context.stroke();
  roundedRect(playerX - 24, 354, 48, 30, 8);
  context.fillStyle = '#f4d595';
  context.fill();
  context.stroke();
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '900 20px "Noto Sans JP", sans-serif';
  context.fillText('処理', playerX, 411);
  if (shieldCharges > 0) {
    context.strokeStyle = '#9ed9ff';
    context.lineWidth = 5;
    context.beginPath();
    context.arc(playerX, 402, 51, 0, Math.PI * 2);
    context.stroke();
  }
  context.restore();
}

function drawPlayer() {
  if (currentPhase.key === 'office') {
    drawOfficePlayer();
    return;
  }
  if (invincibleUntil > elapsed && Math.floor(elapsed * 12) % 2 === 0) return;
  const run = Math.sin(elapsed * 18) * 7;
  const rushActive = rushUntil > elapsed;

  context.save();
  if (rushActive) {
    for (let trail = 3; trail > 0; trail -= 1) {
      context.globalAlpha = .1 * trail;
      context.fillStyle = '#ffd34e';
      context.beginPath();
      context.ellipse(playerX, 423 + trail * 12, 27 - trail * 2, 38, 0, 0, Math.PI * 2);
      context.fill();
    }
    context.globalAlpha = 1;
  }

  context.fillStyle = 'rgba(0,0,0,.28)';
  context.beginPath();
  context.ellipse(playerX, 448, 30, 9, 0, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = '#102f2a';
  context.lineWidth = 9;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(playerX - 7, 419);
  context.lineTo(playerX - 14 - run, 443);
  context.moveTo(playerX + 7, 419);
  context.lineTo(playerX + 14 + run, 443);
  context.stroke();

  roundedRect(playerX - 22, 374, 44, 54, 13);
  context.fillStyle = rushActive ? '#f17b45' : '#176b50';
  context.fill();
  context.lineWidth = 3;
  context.strokeStyle = '#102f2a';
  context.stroke();

  context.strokeStyle = '#102f2a';
  context.lineWidth = 8;
  context.beginPath();
  context.moveTo(playerX - 18, 390);
  context.lineTo(playerX - 31 + run * .5, 407);
  context.moveTo(playerX + 18, 390);
  context.lineTo(playerX + 31 - run * .5, 407);
  context.stroke();

  context.fillStyle = '#f2bd8f';
  context.beginPath();
  context.arc(playerX, 362, 20, 0, Math.PI * 2);
  context.fill();
  context.lineWidth = 3;
  context.strokeStyle = '#102f2a';
  context.stroke();

  context.fillStyle = '#ffd34e';
  context.fillRect(playerX - 23, 354, 46, 8);
  context.fillStyle = '#102f2a';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = '900 17px "Noto Sans JP", sans-serif';
  context.fillText('走', playerX, 400);

  if (shieldCharges > 0) {
    context.strokeStyle = '#9ed9ff';
    context.lineWidth = 5;
    context.shadowColor = '#9ed9ff';
    context.shadowBlur = 13;
    context.beginPath();
    context.arc(playerX, 398, 46, 0, Math.PI * 2);
    context.stroke();
    context.shadowColor = 'transparent';
    context.fillStyle = '#ffffff';
    context.font = '900 12px "Noto Sans JP", sans-serif';
    context.fillText(`守×${shieldCharges}`, playerX + 35, 367);
  }
  context.restore();
}

function drawParticles() {
  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  for (const particle of particles) {
    context.globalAlpha = Math.max(0, particle.life);
    context.fillStyle = particle.color;
    context.strokeStyle = 'rgba(16,47,42,.7)';
    context.lineWidth = 4;
    context.font = `900 ${particle.size}px "Noto Sans JP", "Noto Sans KR", sans-serif`;
    context.strokeText(particle.text, particle.x, particle.y);
    context.fillText(particle.text, particle.x, particle.y);
  }
  context.restore();
}

function drawScene() {
  context.save();
  if (shakeUntil > elapsed) {
    context.translate((Math.random() - .5) * 12, (Math.random() - .5) * 9);
  }
  drawBackground();
  drawRoad();
  for (const object of objects) {
    if (object.type === 'obstacle') drawObstacle(object);
    else if (object.type === 'gate') drawGate(object);
    else drawItem(object);
  }
  drawPlayer();
  drawParticles();
  context.restore();
}

function gameLoop(now) {
  const delta = Math.min(.034, Math.max(0, (now - lastFrame) / 1000));
  lastFrame = now;

  if (status === 'countdown') {
    const countElapsed = (now - countdownStarted) / 1000;
    if (countElapsed < 3) {
      countdown.textContent = Math.ceil(3 - countElapsed);
    } else if (countElapsed < 3.6) {
      countdown.textContent = 'GO!';
      countdown.classList.add('go');
    } else {
      countdown.hidden = true;
      countdown.classList.remove('go');
      status = 'playing';
      lastFrame = now;
      announce('하루 질주 시작! 왼쪽과 오른쪽으로 장애물을 피하세요.');
    }
  } else if (status === 'playing') {
    updateGame(delta);
  }

  drawScene();
  if (status === 'countdown' || status === 'playing') {
    animationFrame = requestAnimationFrame(gameLoop);
  }
}

function calculateRankingScore(completed) {
  return Math.floor(score) + bestCombo * 180 + itemComboCount * 250 + (completed ? 1000 : 0);
}

function getLeaderboard() {
  try {
    const entries = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
    if (!Array.isArray(entries)) return [];
    return entries
      .filter((entry) => entry && typeof entry.name === 'string' && Number.isFinite(entry.rankingScore))
      .sort((a, b) => b.rankingScore - a.rankingScore || b.bestCombo - a.bestCombo)
      .slice(0, 10);
  } catch {
    return [];
  }
}

function renderLeaderboard(listElement, entries = getLeaderboard()) {
  listElement.replaceChildren();
  if (entries.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = '아직 기록이 없습니다. 첫 러너가 되어 보세요!';
    listElement.append(empty);
    return;
  }

  entries.slice(0, 5).forEach((entry) => {
    const item = document.createElement('li');
    const name = document.createElement('strong');
    const points = document.createElement('b');
    const comboValue = document.createElement('em');
    name.textContent = entry.name;
    points.textContent = `${entry.rankingScore.toLocaleString('ko-KR')} P`;
    comboValue.textContent = `${entry.bestCombo} COMBO`;
    item.append(name, points, comboValue);
    listElement.append(item);
  });
}

function refreshLeaderboards() {
  const entries = getLeaderboard();
  renderLeaderboard(startLeaderboard, entries);
  renderLeaderboard(resultLeaderboard, entries);
}

function saveLeaderboardScore() {
  if (scoreSaved || status !== 'finished') return;
  const name = playerName.value.trim().slice(0, 12) || 'RUNNER';
  const entry = {
    name,
    rankingScore,
    gameScore: Math.floor(score),
    bestCombo,
    itemCombos: itemComboCount,
    createdAt: Date.now()
  };

  try {
    const entries = [...getLeaderboard(), entry]
      .sort((a, b) => b.rankingScore - a.rankingScore || b.bestCombo - a.bestCombo)
      .slice(0, 10);
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(entries));
    scoreSaved = true;
    saveScoreButton.disabled = true;
    const position = entries.findIndex((saved) => saved.createdAt === entry.createdAt) + 1;
    saveMessage.textContent = position > 0 && position <= 5
      ? `기록 완료! 로컬 리더보드 ${position}위입니다.`
      : '기록 완료! 더 높은 콤보로 TOP 5에 도전하세요.';
    refreshLeaderboards();
  } catch {
    saveMessage.textContent = '이 브라우저에서는 기록을 저장할 수 없습니다.';
  }
}

function getRank(completed) {
  if (!completed) return '내일은 더 민첩하게';
  if (rankingScore >= 9500) return '疾風의 하루 지배자';
  if (rankingScore >= 6500) return '번개 출근 마스터';
  if (rankingScore >= 4200) return '민첩한 하루 생존자';
  return '무사 완주 러너';
}

function getEnding(completed) {
  if (!completed && elapsed < GAME_DURATION * .28) {
    return { kicker: '朝 · 출근 실패', stamp: '遅刻', title: '아침부터 꼬여버렸다!', message: '출근길 장애물을 넘지 못했습니다. 다음 하루에는 더 민첩하게 움직여 보세요.' };
  }
  if (!completed) {
    return { kicker: '予定 · 일정 붕괴', stamp: '失敗', title: '하루가 너무 빨랐다!', message: '돌발 상황이 계획보다 강했습니다. 아이템 조합으로 다시 도전해 보세요.' };
  }
  if (lives === MAX_LIVES && bestCombo >= 25) {
    return { kicker: 'PERFECT ENDING', stamp: '完璧', title: '완벽한 하루!', message: '한 번도 흔들리지 않고 모든 상황을 민첩하게 처리했습니다.' };
  }
  if (itemComboCount >= 3) {
    return { kicker: 'KANJI COMBO ENDING', stamp: '連鎖', title: '조합의 달인!', message: '한자 아이템을 연쇄 조합해 정신없는 하루를 지배했습니다.' };
  }
  if (bestCombo >= 25) {
    return { kicker: 'RUSH ENDING', stamp: '疾風', title: '바람보다 빠른 하루!', message: '긴 회피 콤보로 아침부터 막차까지 단숨에 돌파했습니다.' };
  }
  if (lives === 1) {
    return { kicker: 'CLOSE CALL ENDING', stamp: '無事', title: '아슬아슬 귀가 성공!', message: '마지막 기회를 붙잡고 간신히 오늘 하루를 마쳤습니다.' };
  }
  return { kicker: 'NORMAL ENDING', stamp: '帰宅', title: '오늘도 무사 귀가!', message: '출근, 업무, 선택과 막차를 지나 평범하지만 소중한 하루를 완주했습니다.' };
}

function finishGame(completed) {
  if (status === 'finished') return;
  status = 'finished';
  cancelAnimationFrame(animationFrame);
  window.clearTimeout(eventHideTimer);
  eventBanner.hidden = true;
  const progress = Math.min(100, Math.round((elapsed / GAME_DURATION) * 100));

  const ending = getEnding(completed);
  resultKicker.textContent = ending.kicker;
  resultStamp.textContent = ending.stamp;
  resultStamp.classList.toggle('fail', !completed);
  resultTitle.textContent = ending.title;
  resultMessage.textContent = ending.message;
  rankingScore = calculateRankingScore(completed);
  finalScore.textContent = Math.floor(score).toLocaleString('ko-KR');
  rank.textContent = getRank(completed);
  distance.textContent = `${progress}%`;
  dodgedDisplay.textContent = dodged;
  bestComboDisplay.textContent = bestCombo;
  rankingScoreDisplay.textContent = rankingScore.toLocaleString('ko-KR');
  itemResult.replaceChildren();
  const label = document.createElement('strong');
  label.textContent = `아이템 조합 ${itemComboCount}회 · `;
  itemResult.append(label, `速 ${itemCounts['速']} · 守 ${itemCounts['守']} · 時 ${itemCounts['時']} · 福 ${itemCounts['福']} · 磁 ${itemCounts['磁']} · 休 ${itemCounts['休']}`);
  refreshLeaderboards();
  showScreen(resultScreen);
  restartButton.focus();
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
saveScoreButton.addEventListener('click', saveLeaderboardScore);
moveLeftButton.addEventListener('click', () => moveLane(-1));
moveRightButton.addEventListener('click', () => moveLane(1));
canvas.addEventListener('pointerdown', (event) => {
  const bounds = canvas.getBoundingClientRect();
  moveLane(event.clientX < bounds.left + bounds.width / 2 ? -1 : 1);
});

document.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'a', 'A'].includes(event.key)) {
    event.preventDefault();
    moveLane(-1);
  } else if (['ArrowRight', 'd', 'D'].includes(event.key)) {
    event.preventDefault();
    moveLane(1);
  } else if (['1', '2', '3'].includes(event.key) && (status === 'playing' || status === 'countdown')) {
    event.preventDefault();
    lane = Number(event.key) - 1;
  }
});

refreshLeaderboards();

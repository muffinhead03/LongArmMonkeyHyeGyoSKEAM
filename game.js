const GAME_DURATION = 40;
const MAX_LIVES = 3;
const LANES = [180, 360, 540];

const OBSTACLES = [
  { kanji: '会議', caption: 'MEETING', color: '#d84f47', accent: '#8d292d', width: 94, height: 62 },
  { kanji: '締切', caption: 'DEADLINE', color: '#e8733f', accent: '#9a3d27', width: 88, height: 68 },
  { kanji: '渋滞', caption: 'TRAFFIC', color: '#b94e58', accent: '#752d36', width: 98, height: 58 },
  { kanji: '雨', caption: 'RAIN', color: '#4189c7', accent: '#245981', width: 72, height: 72 },
  { kanji: '残業', caption: 'OVERTIME', color: '#775886', accent: '#493552', width: 94, height: 64 }
];

const ITEMS = [
  { kanji: '速', name: '스피드', color: '#f17b45', glow: '#ffd34e' },
  { kanji: '守', name: '방어', color: '#4189c7', glow: '#9ed9ff' },
  { kanji: '時', name: '시간', color: '#815ca7', glow: '#d6b7f1' },
  { kanji: '福', name: '행운', color: '#d99a22', glow: '#ffe08a' }
];

const PHASES = [
  { from: 0, name: 'MORNING', kanji: '朝', top: '#78c5e1', bottom: '#f9ddb0', city: '#6c887e' },
  { from: .28, name: 'DAYTIME', kanji: '昼', top: '#66b7dd', bottom: '#d9efc6', city: '#5f8172' },
  { from: .62, name: 'EVENING', kanji: '夕', top: '#ef8f66', bottom: '#f8d899', city: '#5f5d68' },
  { from: .84, name: 'NIGHT', kanji: '夜', top: '#24365f', bottom: '#735c88', city: '#273640' }
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
const canvasWrap = document.querySelector('#canvas-wrap');
const canvas = document.querySelector('#game-canvas');
const countdown = document.querySelector('#countdown');
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
const itemResult = document.querySelector('#item-result');
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
let shield = false;
let invincibleUntil = 0;
let shakeUntil = 0;
let itemCounts = { '速': 0, '守': 0, '時': 0, '福': 0 };
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
  shield = false;
  invincibleUntil = 0;
  shakeUntil = 0;
  itemCounts = { '速': 0, '守': 0, '時': 0, '福': 0 };
  currentPhase = PHASES[0];
  phaseBadge.innerHTML = '<span lang="ja">朝</span> MORNING';
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
    width: type === 'obstacle' ? data.width : 54,
    height: type === 'obstacle' ? data.height : 54,
    passed: false,
    remove: false,
    spin: Math.random() * Math.PI * 2
  });
}

function spawnWave() {
  const progress = elapsed / GAME_DURATION;
  if (Math.random() < .2) {
    spawnObject(Math.floor(Math.random() * 3), 'item', randomFrom(ITEMS));
    return;
  }

  const laneOrder = shuffled([0, 1, 2]);
  const obstacleCount = progress > .28 && Math.random() < (.18 + progress * .24) ? 2 : 1;
  for (let index = 0; index < obstacleCount; index += 1) {
    spawnObject(laneOrder[index], 'obstacle', randomFrom(OBSTACLES));
  }
}

function overlaps(object) {
  const horizontal = Math.abs(playerX - object.x) < (46 + object.width) * .42;
  const vertical = Math.abs(405 - object.y) < (58 + object.height) * .4;
  return horizontal && vertical;
}

function addParticle(x, y, text, color, size = 18) {
  particles.push({ x, y, text, color, size, life: 1, velocity: 42 + Math.random() * 20 });
}

function addRush(amount) {
  if (rushUntil > elapsed) return;
  rushMeter = Math.min(100, rushMeter + amount);
  if (rushMeter >= 100) {
    rushMeter = 0;
    rushUntil = elapsed + 5;
    addParticle(playerX, 350, '疾風 MODE!', '#ffd34e', 25);
    announce('질풍 모드 발동! 5초 동안 점수가 두 배입니다.');
  }
}

function scoreMultiplier() {
  return rushUntil > elapsed ? 2 : 1;
}

function collectItem(object) {
  object.remove = true;
  itemCounts[object.data.kanji] += 1;
  addParticle(object.x, object.y, `${object.data.kanji}!`, object.data.glow, 26);

  if (object.data.kanji === '速') {
    addRush(38);
    score += 120 * scoreMultiplier();
    announce('속 아이템! 질풍 게이지가 올랐습니다.');
  } else if (object.data.kanji === '守') {
    if (shield) score += 200 * scoreMultiplier();
    shield = true;
    announce('수 아이템! 장애물을 한 번 막아냅니다.');
  } else if (object.data.kanji === '時') {
    slowUntil = Math.max(slowUntil, elapsed + 4);
    announce('시 아이템! 4초 동안 장애물이 느려집니다.');
  } else {
    score += 350 * scoreMultiplier();
    announce('복 아이템! 보너스 점수를 얻었습니다.');
  }
}

function hitObstacle(object) {
  object.remove = true;
  if (shield) {
    shield = false;
    addParticle(playerX, 380, 'BLOCK!', '#9ed9ff', 23);
    announce('방어막으로 장애물을 막았습니다.');
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
  const speed = slowUntil > elapsed ? baseSpeed * .52 : baseSpeed;

  for (const object of objects) {
    object.y += speed * delta;
    object.spin += delta * 2.4;

    if (!object.remove && overlaps(object)) {
      if (object.type === 'item') collectItem(object);
      else hitObstacle(object);
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
}

function updateGame(delta) {
  elapsed = Math.min(GAME_DURATION, elapsed + delta);
  score += delta * 12 * scoreMultiplier();
  playerX += (LANES[lane] - playerX) * Math.min(1, delta * 14);

  const progress = elapsed / GAME_DURATION;
  const spawnInterval = Math.max(.42, .9 - progress * .38);
  spawnAccumulator += delta;
  if (spawnAccumulator >= spawnInterval) {
    spawnAccumulator -= spawnInterval;
    spawnWave();
  }

  updateObjects(delta);
  updateParticles(delta);
  updatePhase();
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

  const progress = elapsed / GAME_DURATION;
  const celestialX = 90 + progress * 540;
  const celestialY = 105 - Math.sin(progress * Math.PI) * 72;
  context.save();
  context.globalAlpha = .86;
  context.fillStyle = currentPhase.name === 'NIGHT' ? '#f3f0d4' : '#ffd34e';
  context.beginPath();
  context.arc(celestialX, celestialY, currentPhase.name === 'NIGHT' ? 22 : 29, 0, Math.PI * 2);
  context.fill();
  context.restore();

  context.fillStyle = currentPhase.city;
  const buildingOffset = (elapsed * 8) % 70;
  for (let x = -70 - buildingOffset; x < 790; x += 70) {
    const buildingHeight = 45 + ((Math.floor((x + buildingOffset) / 70) * 29 + 60) % 70);
    context.fillRect(x, 185 - buildingHeight, 52, buildingHeight);
    context.fillStyle = 'rgba(255, 224, 138, .55)';
    for (let wy = 157 - buildingHeight; wy < 170; wy += 18) {
      context.fillRect(x + 10, wy, 7, 7);
      context.fillRect(x + 30, wy, 7, 7);
    }
    context.fillStyle = currentPhase.city;
  }
}

function drawRoad() {
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

function drawPlayer() {
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

  if (shield) {
    context.strokeStyle = '#9ed9ff';
    context.lineWidth = 5;
    context.shadowColor = '#9ed9ff';
    context.shadowBlur = 13;
    context.beginPath();
    context.arc(playerX, 398, 46, 0, Math.PI * 2);
    context.stroke();
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

function getRank(completed) {
  if (!completed) return '내일은 더 민첩하게';
  if (score >= 7000) return '疾風의 하루 지배자';
  if (score >= 4800) return '번개 출근 마스터';
  if (score >= 3000) return '민첩한 하루 생존자';
  return '무사 완주 러너';
}

function finishGame(completed) {
  if (status === 'finished') return;
  status = 'finished';
  cancelAnimationFrame(animationFrame);
  const progress = Math.min(100, Math.round((elapsed / GAME_DURATION) * 100));

  resultKicker.textContent = completed ? '夜 · 하루 완주!' : '遅刻 · 질주 종료!';
  resultStamp.textContent = completed ? '完走' : '遅刻';
  resultStamp.classList.toggle('fail', !completed);
  resultTitle.textContent = completed ? '오늘도 살아남았다!' : '하루가 너무 빨랐다!';
  resultMessage.textContent = completed
    ? '쏟아지는 일정을 피하고 아침부터 밤까지 민첩하게 돌파했습니다.'
    : '장애물에 세 번 부딪혔습니다. 다음 하루에는 더 멀리 달려 보세요.';
  finalScore.textContent = Math.floor(score).toLocaleString('ko-KR');
  rank.textContent = getRank(completed);
  distance.textContent = `${progress}%`;
  dodgedDisplay.textContent = dodged;
  bestComboDisplay.textContent = bestCombo;
  itemResult.replaceChildren();
  const label = document.createElement('strong');
  label.textContent = '모은 아이템 · ';
  itemResult.append(label, `速 ${itemCounts['速']} · 守 ${itemCounts['守']} · 時 ${itemCounts['時']} · 福 ${itemCounts['福']}`);
  showScreen(resultScreen);
  restartButton.focus();
}

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
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

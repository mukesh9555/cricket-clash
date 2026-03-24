let scoreStr = localStorage.getItem('Score');
let savedTheme = localStorage.getItem('Theme') || 'dark';
let savedHistory = JSON.parse(localStorage.getItem('History') || '[]');
let score;
let audioContext;
let confettiPieces = [];
let confettiAnimationId = null;

applyTheme(savedTheme);
resetScore(scoreStr);
renderHistory();
resizeConfettiCanvas();
window.addEventListener('resize', resizeConfettiCanvas);

function resetScore(scoreStr) {
  score = scoreStr ? JSON.parse(scoreStr) : {
    win: 0,
    lost: 0,
    tie: 0,
  };

  score.displayScore = function() {
    return `Score: Won ${score.win}, Lost ${score.lost}, Tie ${score.tie}`;
  };

  showResult();
}

function clearScore() {
  localStorage.removeItem('Score');
  resetScore();
}

function clearHistory() {
  savedHistory = [];
  localStorage.removeItem('History');
  renderHistory();
}

function toggleTheme() {
  const nextTheme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(nextTheme);
  localStorage.setItem('Theme', nextTheme);
}

function applyTheme(theme) {
  document.body.dataset.theme = theme;
  document.querySelector('#theme-toggle').innerText =
    theme === 'light' ? 'Dark Mode' : 'Light Mode';
}

function playGame(userChoice) {
  const computerChoice = generateComputerChoice();
  const roundInfo = getResult(userChoice, computerChoice);
  saveHistory(userChoice, computerChoice, roundInfo);
  showResult(userChoice, computerChoice, roundInfo);
  playSound(roundInfo.mood);

  if (roundInfo.mood === 'win') {
    launchConfetti();
  }
}

function generateComputerChoice() {
  const randomNumber = Math.random() * 3;

  if (randomNumber > 0 && randomNumber <= 1) {
    return 'Bat';
  } else if (randomNumber > 1 && randomNumber <= 2) {
    return 'Ball';
  } else {
    return 'Stump';
  }
}

function getResult(userMove, computerMove) {
  if (userMove === 'Bat') {
    if (computerMove === 'Ball') {
      score.win++;
      return {
        message: 'You won this round. Bat beats Ball.',
        mood: 'win',
        emoji: '🥳',
        label: 'Win'
      };
    } else if (computerMove === 'Bat') {
      score.tie++;
      return {
        message: "It's a tie. Both picked Bat.",
        mood: 'tie',
        emoji: '🙂',
        label: 'Tie'
      };
    } else {
      score.lost++;
      return {
        message: 'Computer won this round. Stump beats Bat.',
        mood: 'loss',
        emoji: '😔',
        label: 'Loss'
      };
    }
  } else if (userMove === 'Ball') {
    if (computerMove === 'Ball') {
      score.tie++;
      return {
        message: "It's a tie. Both picked Ball.",
        mood: 'tie',
        emoji: '🙂',
        label: 'Tie'
      };
    } else if (computerMove === 'Bat') {
      score.lost++;
      return {
        message: 'Computer won this round. Bat beats Ball.',
        mood: 'loss',
        emoji: '😔',
        label: 'Loss'
      };
    } else {
      score.win++;
      return {
        message: 'You won this round. Ball beats Stump.',
        mood: 'win',
        emoji: '🥳',
        label: 'Win'
      };
    }
  } else {
    if (computerMove === 'Ball') {
      score.lost++;
      return {
        message: 'Computer won this round. Ball beats Stump.',
        mood: 'loss',
        emoji: '😔',
        label: 'Loss'
      };
    } else if (computerMove === 'Bat') {
      score.win++;
      return {
        message: 'You won this round. Stump beats Bat.',
        mood: 'win',
        emoji: '🥳',
        label: 'Win'
      };
    } else {
      score.tie++;
      return {
        message: "It's a tie. Both picked Stump.",
        mood: 'tie',
        emoji: '🙂',
        label: 'Tie'
      };
    }
  }
}

function showResult(userMove, computerMove, roundInfo) {
  localStorage.setItem('Score', JSON.stringify(score));

  const mood = roundInfo?.mood || 'neutral';
  const resultPanel = document.querySelector('#result-panel');
  const resultHeading = document.querySelector('#result-heading');
  const statusEmoji = document.querySelector('#status-emoji');

  resultPanel.className = `result-panel ${mood}`;
  resultHeading.innerText =
    mood === 'win' ? 'Victory!' :
    mood === 'loss' ? 'Tough round!' :
    mood === 'tie' ? 'Balanced match!' :
    'Ready to play?';

  statusEmoji.innerText = roundInfo?.emoji || '🎯';

  document.querySelector('#user-move').innerText =
    userMove ? userMove : 'Choose Bat, Ball, or Stump';

  document.querySelector('#computer-move').innerText =
    computerMove ? computerMove : 'Waiting...';

  document.querySelector('#result').innerText =
    roundInfo?.message || 'Start the match and see whether you can beat the computer.';

  document.querySelector('#score').innerText = score.displayScore();
  document.querySelector('#win-count').innerText = score.win;
  document.querySelector('#loss-count').innerText = score.lost;
  document.querySelector('#tie-count').innerText = score.tie;
}

function saveHistory(userMove, computerMove, roundInfo) {
  const historyItem = {
    userMove,
    computerMove,
    result: roundInfo.label,
    emoji: roundInfo.emoji,
  };

  savedHistory.unshift(historyItem);
  savedHistory = savedHistory.slice(0, 6);
  localStorage.setItem('History', JSON.stringify(savedHistory));
  renderHistory();
}

function renderHistory() {
  const historyList = document.querySelector('#history-list');

  if (!savedHistory.length) {
    historyList.innerHTML = '<p class="history-empty">No rounds played yet. Your latest matches will appear here.</p>';
    return;
  }

  historyList.innerHTML = savedHistory.map(function(item, index) {
    return `
      <article class="history-item ${item.result.toLowerCase()}">
        <div class="history-main">
          <span class="history-emoji">${item.emoji}</span>
          <div>
            <strong>Round ${savedHistory.length - index}</strong>
            <p>You: ${item.userMove} | Computer: ${item.computerMove}</p>
          </div>
        </div>
        <span class="history-result">${item.result}</span>
      </article>
    `;
  }).join('');
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  return audioContext;
}

function playTone(frequency, duration, type, volume, delay) {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const startTime = context.currentTime + delay;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

function playSound(mood) {
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume();
  }

  if (mood === 'win') {
    playTone(520, 0.18, 'triangle', 0.08, 0);
    playTone(660, 0.2, 'triangle', 0.08, 0.12);
    playTone(780, 0.24, 'triangle', 0.08, 0.24);
  } else if (mood === 'loss') {
    playTone(320, 0.25, 'sawtooth', 0.05, 0);
    playTone(220, 0.28, 'sawtooth', 0.05, 0.16);
  } else if (mood === 'tie') {
    playTone(430, 0.18, 'sine', 0.05, 0);
    playTone(430, 0.18, 'sine', 0.05, 0.16);
  }
}

function resizeConfettiCanvas() {
  const canvas = document.querySelector('#confetti-canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function launchConfetti() {
  const canvas = document.querySelector('#confetti-canvas');
  const context = canvas.getContext('2d');
  const colors = ['#57e3b1', '#3ea8ff', '#ffcf5a', '#ff7b89', '#ffffff'];

  confettiPieces = Array.from({ length: 120 }, function() {
    return {
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.4,
      size: 6 + Math.random() * 8,
      speedX: -2 + Math.random() * 4,
      speedY: 2 + Math.random() * 4,
      rotation: Math.random() * 360,
      rotationSpeed: -8 + Math.random() * 16,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  });

  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
  }

  let frameCount = 0;

  function animateConfetti() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    confettiPieces.forEach(function(piece) {
      piece.x += piece.speedX;
      piece.y += piece.speedY;
      piece.rotation += piece.rotationSpeed;

      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation * Math.PI / 180);
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size * 0.6);
      context.restore();
    });

    frameCount++;
    if (frameCount < 120) {
      confettiAnimationId = requestAnimationFrame(animateConfetti);
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
      confettiAnimationId = null;
    }
  }

  animateConfetti();
}

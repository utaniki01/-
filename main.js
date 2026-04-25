const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("score");
const gameoverText = document.getElementById("gameover");
const pauseText = document.getElementById("pause");

const ROWS = 12;
const COLS = 6;

let SIZE;

let board = [];
let score = 0;

let isGameOverFlag = false;
let isPaused = false;

let current;

// =======================
// 画面サイズ
// =======================
function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const ratio = 2;

  let width = w;
  let height = width * ratio;

  if (height > h) {
    height = h;
    width = height / ratio;
  }

  canvas.width = width;
  canvas.height = height;

  SIZE = canvas.width / COLS;
}

window.addEventListener("resize", resizeCanvas);

// =======================
// 色
// =======================
function randomColor() {
  const colors = ["#ff4d4d", "#4da6ff", "#4dff88", "#ffd24d"];
  return colors[Math.floor(Math.random() * colors.length)];
}

// =======================
// 初期化
// =======================
function createBoard() {
  board = [];
  for (let y = 0; y < ROWS; y++) {
    board[y] = Array(COLS).fill(0);
  }
}

// =======================
// 描画
// =======================
function drawBlock(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
}

function renderBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      ctx.strokeStyle = "#333";
      ctx.strokeRect(x * SIZE, y * SIZE, SIZE, SIZE);

      if (board[y][x]) {
        drawBlock(x, y, board[y][x]);
      }
    }
  }

  if (!isGameOverFlag && current) {
    drawBlock(current.x, current.y, current.color);
  }
}

// =======================
// 移動判定
// =======================
function canMove(x, y) {
  if (x < 0 || x >= COLS || y >= ROWS) return false;
  if (board[y][x]) return false;
  return true;
}

// =======================
// 上埋まりチェック
// =======================
function isTopFilled() {
  for (let x = 0; x < COLS; x++) {
    if (board[0][x] !== 0) return true;
  }
  return false;
}

// =======================
// 重力処理（重要）
// =======================
function applyGravity() {
  for (let x = 0; x < COLS; x++) {
    let stack = [];

    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y][x] !== 0) {
        stack.push(board[y][x]);
      }
    }

    for (let y = ROWS - 1; y >= 0; y--) {
      board[y][x] = stack.shift() || 0;
    }
  }
}

// =======================
// 連結消去（4つ以上）
// =======================
function processChain() {
  let visited = Array.from({ length: ROWS }, () =>
    Array(COLS).fill(false)
  );

  let removed = 0;

  function dfs(x, y, color, group) {
    if (
      x < 0 || x >= COLS ||
      y < 0 || y >= ROWS ||
      visited[y][x] ||
      board[y][x] !== color
    ) return;

    visited[y][x] = true;
    group.push([x, y]);

    dfs(x + 1, y, color, group);
    dfs(x - 1, y, color, group);
    dfs(x, y + 1, color, group);
    dfs(x, y - 1, color, group);
  }

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] && !visited[y][x]) {
        let group = [];
        dfs(x, y, board[y][x], group);

        if (group.length >= 4) {
          group.forEach(([gx, gy]) => {
            board[gy][gx] = 0;
          });

          removed += group.length;

          // ★重要：消えた後に重力
          applyGravity();
        }
      }
    }
  }

  if (removed > 0) {
    score += removed * 10;
    scoreText.textContent = score;
  }
}

// =======================
// 固定
// =======================
function fixBlock() {
  board[current.y][current.x] = current.color;

  processChain();

  if (isTopFilled()) {
    gameOver();
  }
}

// =======================
// スポーン
// =======================
function spawnBlock() {
  current = {
    x: 2,
    y: 0,
    color: randomColor()
  };
}

// =======================
// 落下
// =======================
function moveDown() {
  if (isPaused || isGameOverFlag) return;

  if (canMove(current.x, current.y + 1)) {
    current.y++;
  } else {
    fixBlock();
    spawnBlock();
  }
}

// =======================
// 入力
// =======================
document.addEventListener("keydown", (e) => {
  if (e.key === "p" || e.key === "P") {
    togglePause();
    return;
  }

  if (e.key === "r" || e.key === "R") {
    resetGame();
    return;
  }

  if (isPaused || isGameOverFlag) return;

  if (e.key === "ArrowLeft" && canMove(current.x - 1, current.y)) current.x--;
  if (e.key === "ArrowRight" && canMove(current.x + 1, current.y)) current.x++;
  if (e.key === "ArrowDown") moveDown();
});

// =======================
// タッチ
// =======================
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
  if (isPaused || isGameOverFlag) return;

  const t = e.touches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
});

canvas.addEventListener("touchend", (e) => {
  if (isPaused || isGameOverFlag) return;

  const t = e.changedTouches[0];

  let dx = t.clientX - touchStartX;
  let dy = t.clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 30 && canMove(current.x + 1, current.y)) current.x++;
    if (dx < -30 && canMove(current.x - 1, current.y)) current.x--;
  } else {
    if (dy > 30) moveDown();
  }
});

// =======================
// ポーズ
// =======================
function togglePause() {
  isPaused = !isPaused;
  pauseText.style.display = isPaused ? "block" : "none";
}

// =======================
// ゲームオーバー
// =======================
function gameOver() {
  isGameOverFlag = true;
  gameoverText.style.display = "block";
}

// =======================
// リセット
// =======================
function resetGame() {
  isGameOverFlag = false;
  isPaused = false;
  score = 0;

  gameoverText.style.display = "none";
  pauseText.style.display = "none";
  scoreText.textContent = score;

  createBoard();
  spawnBlock();
}

// =======================
// ループ
// =======================
function gameLoop() {
  if (isPaused) return;

  moveDown();
  renderBoard();
}

// =======================
// 起動
// =======================
function init() {
  resizeCanvas();
  createBoard();
  spawnBlock();
  setInterval(gameLoop, 500);
}

init();
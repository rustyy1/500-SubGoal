import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Share2, ShieldAlert, Sparkles, Trophy, Volume2, VolumeX } from 'lucide-react';
import { getPlayerUsername, saveScoreToLeaderboard } from '../lib/leaderboard';

interface GameProps {
  onScoreUp?: (score: number) => void;
  onShareClick?: (score: number) => void;
  onViewLeaderboard?: () => void;
}

export function RustyyQuestRunner({ onScoreUp, onShareClick, onViewLeaderboard }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('rustyy_runner_highscore') || 0);
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  const gameLoopRef = useRef<number | null>(null);
  const stateRef = useRef({
    gameState: 'idle' as 'idle' | 'playing' | 'gameover',
    playerY: 170,
    playerVy: 0,
    isGrounded: true,
    score: 0,
    obstacles: [] as { x: number; w: number; h: number; type: 'crystal' | 'spire' | 'drone' }[],
    subOrbs: [] as { x: number; y: number; size: number; collected: boolean }[],
    speed: 4.8,
    frame: 0,
  });

  // Sound effects synthesizer via Web Audio API
  const playFx = (type: 'jump' | 'collect' | 'hit') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'collect') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'hit') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // AudioContext may be restricted by browser policy before user interaction
    }
  };

  const jump = () => {
    const s = stateRef.current;
    if (s.gameState === 'idle' || s.gameState === 'gameover') {
      startGame();
      return;
    }
    if (s.isGrounded) {
      s.playerVy = -11.5;
      s.isGrounded = false;
      playFx('jump');
    }
  };

  const startGame = () => {
    stateRef.current = {
      gameState: 'playing',
      playerY: 170,
      playerVy: 0,
      isGrounded: true,
      score: 0,
      obstacles: [{ x: 500, w: 24, h: 36, type: 'spire' }],
      subOrbs: [{ x: 380, y: 130, size: 10, collected: false }],
      speed: 4.8,
      frame: 0,
    };
    setScore(0);
    setGameState('playing');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const GROUND_Y = 205;
    const GRAVITY = 0.65;

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cyber Grid Ground
      ctx.strokeStyle = 'rgba(228, 185, 117, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(canvas.width, GROUND_Y);
      ctx.stroke();

      // Scrolling grid lines underneath
      ctx.strokeStyle = 'rgba(228, 185, 117, 0.08)';
      const gridOffset = (s.frame * s.speed * 0.8) % 30;
      for (let x = -gridOffset; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, GROUND_Y);
        ctx.lineTo(x - 20, canvas.height);
        ctx.stroke();
      }

      // Background mountain skyline silhouette
      ctx.fillStyle = 'rgba(18, 22, 24, 0.65)';
      ctx.beginPath();
      ctx.moveTo(0, GROUND_Y);
      ctx.lineTo(60, 110);
      ctx.lineTo(130, 145);
      ctx.lineTo(210, 95);
      ctx.lineTo(310, 150);
      ctx.lineTo(420, 80);
      ctx.lineTo(510, 140);
      ctx.lineTo(600, GROUND_Y);
      ctx.fill();

      if (s.gameState === 'playing') {
        s.frame++;
        s.score += 0.2;
        s.speed = Math.min(8.5, 4.8 + s.score * 0.006);

        // Player physics
        s.playerVy += GRAVITY;
        s.playerY += s.playerVy;

        if (s.playerY >= GROUND_Y - 32) {
          s.playerY = GROUND_Y - 32;
          s.playerVy = 0;
          s.isGrounded = true;
        }

        // Spawn obstacles
        if (s.frame % Math.floor(Math.max(65, 120 - s.speed * 6)) === 0) {
          const types: ('crystal' | 'spire' | 'drone')[] = ['spire', 'crystal', 'drone'];
          const type = types[Math.floor(Math.random() * types.length)];
          const h = type === 'drone' ? 22 : type === 'crystal' ? 38 : 34;
          const w = type === 'drone' ? 28 : 22;
          s.obstacles.push({ x: canvas.width + 20, w, h, type });
        }

        // Spawn bonus YouTube subscriber badges
        if (s.frame % 160 === 0) {
          s.subOrbs.push({
            x: canvas.width + 40,
            y: 110 + Math.random() * 40,
            size: 11,
            collected: false,
          });
        }

        // Move obstacles
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const obs = s.obstacles[i];
          obs.x -= s.speed;

          // Check collision with player
          // Player bounds: x: 50, y: s.playerY, w: 28, h: 32
          const px = 50;
          const py = s.playerY;
          const pw = 26;
          const ph = 30;

          const obsY = obs.type === 'drone' ? GROUND_Y - 55 : GROUND_Y - obs.h;
          if (
            px < obs.x + obs.w &&
            px + pw > obs.x &&
            py < obsY + obs.h &&
            py + ph > obsY
          ) {
            // Collision!
            s.gameState = 'gameover';
            setGameState('gameover');
            playFx('hit');
            const finalScore = Math.floor(s.score);
            if (finalScore > highScore) {
              setHighScore(finalScore);
              localStorage.setItem('rustyy_runner_highscore', String(finalScore));
            }
            const playerName = getPlayerUsername() || 'Anonymous Legend';
            saveScoreToLeaderboard('runner', playerName, finalScore);
            if (onScoreUp) onScoreUp(finalScore);
          }

          if (obs.x < -40) {
            s.obstacles.splice(i, 1);
          }
        }

        // Move sub orbs
        for (let i = s.subOrbs.length - 1; i >= 0; i--) {
          const orb = s.subOrbs[i];
          orb.x -= s.speed;

          // Collect test
          const px = 50 + 13;
          const py = s.playerY + 15;
          const dist = Math.hypot(px - orb.x, py - orb.y);
          if (dist < 26 && !orb.collected) {
            orb.collected = true;
            s.score += 25; // Bonus!
            playFx('collect');
          }

          if (orb.x < -30 || orb.collected) {
            s.subOrbs.splice(i, 1);
          }
        }

        setScore(Math.floor(s.score));
      }

      // Draw Sub Orbs (+Subscribers)
      for (const orb of s.subOrbs) {
        ctx.save();
        ctx.fillStyle = '#ff2b2b';
        ctx.shadowColor = '#ff4d4d';
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.size, 0, Math.PI * 2);
        ctx.fill();

        // White play triangle in orb
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(orb.x - 3, orb.y - 4);
        ctx.lineTo(orb.x + 5, orb.y);
        ctx.lineTo(orb.x - 3, orb.y + 4);
        ctx.fill();
        ctx.restore();
      }

      // Draw Obstacles
      for (const obs of s.obstacles) {
        ctx.save();
        if (obs.type === 'drone') {
          // Flying sentinel drone
          const oy = GROUND_Y - 55 + Math.sin(s.frame * 0.1) * 6;
          ctx.fillStyle = '#c43b32';
          ctx.shadowColor = '#e6493e';
          ctx.shadowBlur = 10;
          ctx.fillRect(obs.x, oy, obs.w, obs.h);

          // Drone eye
          ctx.fillStyle = '#ffeeee';
          ctx.fillRect(obs.x + 6, oy + 7, 8, 8);
        } else if (obs.type === 'crystal') {
          // Sharp Elden Spire
          ctx.fillStyle = '#d49b4c';
          ctx.shadowColor = '#f5c378';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(obs.x + obs.w / 2, GROUND_Y - obs.h);
          ctx.lineTo(obs.x + obs.w, GROUND_Y);
          ctx.lineTo(obs.x, GROUND_Y);
          ctx.fill();
        } else {
          // Tactical barricade
          ctx.fillStyle = '#424a4d';
          ctx.strokeStyle = '#e4b975';
          ctx.lineWidth = 1.5;
          ctx.fillRect(obs.x, GROUND_Y - obs.h, obs.w, obs.h);
          ctx.strokeRect(obs.x, GROUND_Y - obs.h, obs.w, obs.h);
        }
        ctx.restore();
      }

      // Draw Player (Rustyy Champion with golden cyber glow)
      ctx.save();
      const px = 50;
      const py = s.playerY;

      // Glow aura
      ctx.shadowColor = '#e4b975';
      ctx.shadowBlur = 14;

      // Body (Armor)
      ctx.fillStyle = '#1c1f22';
      ctx.fillRect(px, py + 8, 22, 22);

      // Gold Chestplate
      ctx.fillStyle = '#e4b975';
      ctx.fillRect(px + 4, py + 12, 14, 12);

      // Helmet / Head
      ctx.fillStyle = '#2d3338';
      ctx.fillRect(px + 3, py - 4, 16, 12);

      // Visor Glow (Cyan / Gold)
      ctx.fillStyle = '#6ee7b7';
      ctx.shadowColor = '#6ee7b7';
      ctx.shadowBlur = 8;
      ctx.fillRect(px + 10, py - 1, 8, 4);

      // Trail particles when running
      if (s.gameState === 'playing' && s.isGrounded && s.frame % 3 === 0) {
        ctx.fillStyle = 'rgba(228, 185, 117, 0.4)';
        ctx.fillRect(px - 6 - Math.random() * 8, GROUND_Y - 4 - Math.random() * 4, 4, 3);
      }

      ctx.restore();

      gameLoopRef.current = requestAnimationFrame(render);
    };

    gameLoopRef.current = requestAnimationFrame(render);

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept Space / ArrowUp if the user is typing in form inputs
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [soundEnabled, highScore]);

  return (
    <div className="mini-game-box">
      <div className="game-header">
        <div className="game-title">
          <Sparkles size={14} className="icon-gold" />
          <span>RUSTYY 500 RUNNER</span>
          <span className="game-tag">ARCADE</span>
        </div>
        <div className="game-stats">
          <div className="stat-pill">
            <span className="stat-label">SCORE</span>
            <span className="stat-value">{score}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">HIGH</span>
            <span className="stat-value">{highScore}</span>
          </div>
          <button
            className="sound-toggle-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="Toggle game sound"
            type="button"
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
        </div>
      </div>

      <div className="canvas-wrapper" onClick={jump}>
        <canvas
          ref={canvasRef}
          width={580}
          height={240}
          className="game-canvas"
        />

        {gameState === 'idle' && (
          <div className="game-overlay">
            <button className="game-btn-primary" onClick={startGame} type="button">
              <Play size={16} fill="currentColor" />
              <span>START QUEST RUNNER</span>
            </button>
            <p className="game-instructions">Tap or press <strong>SPACE / UP</strong> to jump & collect YouTube Sub Orbs!</p>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="game-overlay game-overlay-loss">
            <div className="game-over-badge"><ShieldAlert size={16} /> QUEST INTERRUPTED</div>
            <p className="game-over-score">FINAL DISTANCE: <span>{score} PTS</span></p>
            <div className="game-over-btn-group">
              <button className="game-btn-primary" onClick={startGame} type="button">
                <RotateCcw size={15} />
                <span>RUN AGAIN</span>
              </button>
              {onViewLeaderboard && (
                <button
                  className="game-btn-secondary"
                  onClick={onViewLeaderboard}
                  type="button"
                >
                  <Trophy size={14} className="icon-gold" />
                  <span>LEADERBOARDS</span>
                </button>
              )}
              {onShareClick && (
                <button
                  className="game-btn-secondary"
                  onClick={() => onShareClick(score)}
                  type="button"
                >
                  <Share2 size={14} />
                  <span>SHARE SCORE</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="game-footer">
        <span>🎮 TIP: JUMP OVER RED DRONES & SPIRES TO EARN SUBSCRIBER XP</span>
        <button
          className="jump-tap-btn"
          onClick={jump}
          type="button"
        >
          TAP TO JUMP ⬆
        </button>
      </div>
    </div>
  );
}

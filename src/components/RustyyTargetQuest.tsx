import { useEffect, useRef, useState } from 'react';
import { Crosshair, Play, RotateCcw, Share2, Trophy, Volume2, VolumeX, Zap, Target as TargetIcon } from 'lucide-react';
import { getPlayerUsername, saveScoreToLeaderboard } from '../lib/leaderboard';

interface GameProps {
  onScoreUp?: (score: number) => void;
  onShareClick?: (score: number) => void;
  onViewLeaderboard?: () => void;
}

interface AimlabsTarget {
  id: number;
  x: number;
  y: number;
  radius: number;
  type: 'standard' | 'bonus_gold';
  spawnTime: number;
  scale: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export function RustyyTargetQuest({ onScoreUp, onShareClick, onViewLeaderboard }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('rustyy_target_highscore') || 0);
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const stateRef = useRef({
    gameState: 'idle' as 'idle' | 'playing' | 'gameover',
    score: 0,
    hits: 0,
    misses: 0,
    streak: 0,
    maxStreak: 0,
    timeLeft: 30,
    targets: [] as AimlabsTarget[],
    particles: [] as Particle[],
    mousePos: { x: -100, y: -100 },
    recoil: 0,
    nextId: 1,
  });

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  };

  const playFx = (type: 'hit' | 'bonus' | 'miss') => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'hit') {
        // High-frequency Aimlabs ding
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(1100, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'bonus') {
        // Double harmony chime
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(784, now);
        osc.frequency.exponentialRampToValueAtTime(1568, now + 0.14);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.start(now);
        osc.stop(now + 0.14);
      } else if (type === 'miss') {
        // Low thud/click for miss
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.06);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    } catch {
      // AudioContext policy
    }
  };

  // Generate a non-overlapping target position
  const createTarget = (existing: AimlabsTarget[], width = 580, height = 240): AimlabsTarget => {
    const radius = 22;
    const paddingX = 55;
    const paddingY = 45;
    let attempts = 0;
    let x = paddingX + Math.random() * (width - paddingX * 2);
    let y = paddingY + Math.random() * (height - paddingY * 2);

    // Keep distance from existing targets (at least 65px apart)
    while (attempts < 20) {
      let collides = false;
      for (const t of existing) {
        if (Math.hypot(x - t.x, y - t.y) < 65) {
          collides = true;
          break;
        }
      }
      if (!collides) break;
      x = paddingX + Math.random() * (width - paddingX * 2);
      y = paddingY + Math.random() * (height - paddingY * 2);
      attempts++;
    }

    const isBonus = Math.random() < 0.15; // 15% chance for 500 gold bonus orb

    return {
      id: stateRef.current.nextId++,
      x,
      y,
      radius,
      type: isBonus ? 'bonus_gold' : 'standard',
      spawnTime: Date.now(),
      scale: 0.1, // animate in
    };
  };

  const startGame = () => {
    const s = stateRef.current;
    s.gameState = 'playing';
    s.score = 0;
    s.hits = 0;
    s.misses = 0;
    s.streak = 0;
    s.maxStreak = 0;
    s.timeLeft = 30;
    s.particles = [];
    s.targets = [];

    // Spawn exactly 3 initial targets
    for (let i = 0; i < 3; i++) {
      s.targets.push(createTarget(s.targets));
    }

    setScore(0);
    setHits(0);
    setMisses(0);
    setStreak(0);
    setTimeLeft(30);
    setGameState('playing');
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    stateRef.current.mousePos = { x, y };
  };

  const handleCanvasMouseLeave = () => {
    stateRef.current.mousePos = { x: -100, y: -100 };
  };

  const processShot = (clickX: number, clickY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const s = stateRef.current;
    if (s.gameState !== 'playing') {
      startGame();
      return;
    }

    // Trigger crosshair recoil
    s.recoil = 6;

    let hitIndex = -1;
    for (let i = s.targets.length - 1; i >= 0; i--) {
      const t = s.targets[i];
      const dist = Math.hypot(clickX - t.x, clickY - t.y);
      if (dist <= t.radius) {
        hitIndex = i;
        break;
      }
    }

    if (hitIndex >= 0) {
      const hitTarget = s.targets[hitIndex];
      s.hits++;
      s.streak++;
      if (s.streak > s.maxStreak) s.maxStreak = s.streak;

      // Base points + streak bonus + gold bonus
      const isBonus = hitTarget.type === 'bonus_gold';
      const basePts = isBonus ? 250 : 100;
      const streakBonus = Math.min(s.streak * 10, 100);
      const totalAdd = basePts + streakBonus;

      s.score += totalAdd;

      // Spawn burst particles
      const particleColor = isBonus ? '#e4b975' : '#38bdf8';
      const altColor = isBonus ? '#fff' : '#67e8f9';
      for (let p = 0; p < 14; p++) {
        const angle = (p / 14) * Math.PI * 2 + Math.random() * 0.4;
        const speed = 2.5 + Math.random() * 4.5;
        s.particles.push({
          x: hitTarget.x,
          y: hitTarget.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: Math.random() > 0.3 ? particleColor : altColor,
          size: 2 + Math.random() * 3,
          life: 20,
          maxLife: 20,
        });
      }

      playFx(isBonus ? 'bonus' : 'hit');

      // Remove hit target and immediately spawn a new one to keep count at 3!
      s.targets.splice(hitIndex, 1);
      s.targets.push(createTarget(s.targets, canvas.width, canvas.height));

      setScore(s.score);
      setHits(s.hits);
      setStreak(s.streak);
    } else {
      // Miss!
      s.misses++;
      s.streak = 0;
      setMisses(s.misses);
      setStreak(0);
      playFx('miss');
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    processShot(clickX, clickY);
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const clickX = ((touch.clientX - rect.left) / rect.width) * canvas.width;
    const clickY = ((touch.clientY - rect.top) / rect.height) * canvas.height;
    stateRef.current.mousePos = { x: clickX, y: clickY };
    processShot(clickX, clickY);
  };

  // Timer loop & Game Over
  useEffect(() => {
    let timerInterval: number | null = null;

    if (gameState === 'playing') {
      timerInterval = window.setInterval(() => {
        const s = stateRef.current;
        if (s.gameState === 'playing') {
          s.timeLeft--;
          setTimeLeft(s.timeLeft);
          if (s.timeLeft <= 0) {
            s.gameState = 'gameover';
            setGameState('gameover');

            // Save high score locally
            if (s.score > highScore) {
              setHighScore(s.score);
              localStorage.setItem('rustyy_target_highscore', String(s.score));
            }

            // Save to unified Arcade Leaderboard
            const playerName = getPlayerUsername() || 'Anonymous Legend';
            saveScoreToLeaderboard('target', playerName, s.score);

            if (onScoreUp) onScoreUp(s.score);
          }
        }
      }, 1000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [gameState, highScore, onScoreUp]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Aimlabs Dark Tactical Hex / Grid Background
      ctx.fillStyle = '#090c0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle Grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 1;
      const gridSize = 32;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Tactical cross markers
      ctx.strokeStyle = 'rgba(228, 185, 117, 0.08)';
      for (let x = 64; x < canvas.width; x += 128) {
        for (let y = 48; y < canvas.height; y += 96) {
          ctx.beginPath();
          ctx.moveTo(x - 5, y);
          ctx.lineTo(x + 5, y);
          ctx.moveTo(x, y - 5);
          ctx.lineTo(x, y + 5);
          ctx.stroke();
        }
      }

      // Border glow
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

      // 2. Render Targets
      if (s.gameState === 'playing') {
        for (const t of s.targets) {
          if (t.scale < 1) {
            t.scale = Math.min(1, t.scale + 0.12);
          }

          ctx.save();
          const r = t.radius * t.scale;

          if (t.type === 'bonus_gold') {
            // Gold 500 Bonus Orb
            ctx.shadowBlur = 18;
            ctx.shadowColor = 'rgba(228, 185, 117, 0.9)';

            // Radial gradient
            const grad = ctx.createRadialGradient(t.x - r * 0.3, t.y - r * 0.3, 2, t.x, t.y, r);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, '#fbe09e');
            grad.addColorStop(0.8, '#d99f4a');
            grad.addColorStop(1, '#855919');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
            ctx.fill();

            // Concentric ring
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(t.x, t.y, r * 0.55, 0, Math.PI * 2);
            ctx.stroke();

            // 500 Text
            ctx.fillStyle = '#14100b';
            ctx.font = '900 11px "Barlow Condensed", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('500', t.x, t.y);
          } else {
            // Standard Aimlabs Electric Cyan Orb
            ctx.shadowBlur = 16;
            ctx.shadowColor = 'rgba(56, 189, 248, 0.85)';

            // Sphere gradient
            const grad = ctx.createRadialGradient(t.x - r * 0.3, t.y - r * 0.3, 2, t.x, t.y, r);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.25, '#7dd3fc');
            grad.addColorStop(0.7, '#0284c7');
            grad.addColorStop(1, '#034c75');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(t.x, t.y, r, 0, Math.PI * 2);
            ctx.fill();

            // Outer pulse/halo ring
            ctx.strokeStyle = 'rgba(125, 211, 252, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(t.x, t.y, r * 0.6, 0, Math.PI * 2);
            ctx.stroke();

            // Center core dot
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(t.x, t.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }

        // 3. Render Particles
        for (let i = s.particles.length - 1; i >= 0; i--) {
          const p = s.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.94;
          p.vy *= 0.94;
          p.life--;

          const alpha = p.life / p.maxLife;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (p.life <= 0) {
            s.particles.splice(i, 1);
          }
        }

        // 4. Render Aimlabs Tactical Crosshair
        if (s.mousePos.x >= 0 && s.mousePos.y >= 0) {
          const mx = s.mousePos.x;
          const my = s.mousePos.y;
          const gap = 4 + s.recoil;
          const len = 7;

          if (s.recoil > 0) s.recoil = Math.max(0, s.recoil - 0.7);

          ctx.save();
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#38bdf8';

          // Top
          ctx.beginPath();
          ctx.moveTo(mx, my - gap);
          ctx.lineTo(mx, my - gap - len);
          ctx.stroke();

          // Bottom
          ctx.beginPath();
          ctx.moveTo(mx, my + gap);
          ctx.lineTo(mx, my + gap + len);
          ctx.stroke();

          // Left
          ctx.beginPath();
          ctx.moveTo(mx - gap, my);
          ctx.lineTo(mx - gap - len, my);
          ctx.stroke();

          // Right
          ctx.beginPath();
          ctx.moveTo(mx + gap, my);
          ctx.lineTo(mx + gap + len, my);
          ctx.stroke();

          // Center micro dot
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(mx, my, 1.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  const totalShots = hits + misses;
  const accuracy = totalShots > 0 ? ((hits / totalShots) * 100).toFixed(1) : '100.0';
  const elapsed = 30 - timeLeft;
  const killsPerSec = elapsed > 0 ? (hits / elapsed).toFixed(1) : '0.0';

  // Performance Grade
  const getGrade = (pts: number, acc: number) => {
    if (pts >= 3500 && acc >= 90) return { letter: 'S', title: 'AIM GOD', color: '#e4b975' };
    if (pts >= 2400 && acc >= 80) return { letter: 'A', title: 'SHARPSHOOTER', color: '#38bdf8' };
    if (pts >= 1500 && acc >= 70) return { letter: 'B', title: 'MARKSMAN', color: '#4ade80' };
    return { letter: 'C', title: 'RECRUIT', color: '#f87171' };
  };

  const finalGrade = getGrade(score, Number(accuracy));

  return (
    <div className="mini-game-box aimlabs-box">
      {/* Tactical Header */}
      <div className="game-header">
        <div className="game-title">
          <Crosshair size={16} className="icon-gold" />
          <span>AIMLABS GRIDSHOT</span>
          <span className="game-tag aimlabs-tag">TACTICAL REFLEX</span>
        </div>

        <div className="game-stats">
          <div className="stat-pill">
            <span className="stat-label">TIME</span>
            <span className="stat-value">{timeLeft}S</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">ACCURACY</span>
            <span className="stat-value text-cyan">{accuracy}%</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">STREAK</span>
            <span className="stat-value text-gold">{streak}x</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">SCORE</span>
            <span className="stat-value">{score.toLocaleString()}</span>
          </div>
          <button
            className="sound-toggle-btn"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title="Toggle sound"
            type="button"
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="canvas-wrapper aimlabs-canvas-wrap">
        <canvas
          ref={canvasRef}
          width={580}
          height={240}
          className="game-canvas aimlabs-canvas"
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasTouchStart}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
        />

        {/* Start / Idle Overlay */}
        {gameState === 'idle' && (
          <div className="game-overlay aimlabs-overlay">
            <div className="aimlabs-intro-badge">
              <Zap size={14} className="icon-gold" />
              <span>OFFICIAL COMMUNITY AIM TRAINER</span>
            </div>
            <h3 className="aimlabs-intro-title">GRIDSHOT // 3 TARGET PROTOCOL</h3>
            <p className="game-instructions">
              Click targets instantly to vaporize them. A new target spawns on every hit.
              <br />
              <strong>Missing resets your combo streak!</strong>
            </p>
            <button className="game-btn-primary aimlabs-start-btn" onClick={startGame} type="button">
              <Play size={16} fill="currentColor" />
              <span>START 30S DRILL</span>
            </button>
          </div>
        )}

        {/* Aimlabs Performance Summary (Game Over) */}
        {gameState === 'gameover' && (
          <div className="game-overlay aimlabs-summary-overlay">
            <div className="aimlabs-grade-circle" style={{ borderColor: finalGrade.color }}>
              <span className="aimlabs-grade-letter" style={{ color: finalGrade.color }}>
                {finalGrade.letter}
              </span>
              <span className="aimlabs-grade-label">{finalGrade.title}</span>
            </div>

            <div className="aimlabs-metrics-grid">
              <div className="metric-box">
                <span className="metric-label">FINAL SCORE</span>
                <span className="metric-val text-gold">{score.toLocaleString()}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">ACCURACY</span>
                <span className="metric-val text-cyan">{accuracy}%</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">TARGETS HIT</span>
                <span className="metric-val">{hits}</span>
              </div>
              <div className="metric-box">
                <span className="metric-label">TARGETS/SEC</span>
                <span className="metric-val">{killsPerSec}</span>
              </div>
            </div>

            <div className="game-over-btn-group">
              <button className="game-btn-primary" onClick={startGame} type="button">
                <RotateCcw size={14} />
                <span>DRILL AGAIN</span>
              </button>

              {onViewLeaderboard && (
                <button
                  className="game-btn-secondary"
                  onClick={onViewLeaderboard}
                  type="button"
                >
                  <Trophy size={14} className="icon-gold" />
                  <span>VIEW LEADERBOARD</span>
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

      {/* Footer Intel */}
      <div className="game-footer">
        <span className="aimlabs-footer-tip">
          <TargetIcon size={12} className="icon-cyan" />
          <span>AIMLABS MECHANICS: 3 PERSISTENT TARGETS. INSTANT RESPAWN UPON HIT.</span>
        </span>
        <span className="game-footer-rec">PERSONAL BEST: {highScore.toLocaleString()} PTS</span>
      </div>
    </div>
  );
}
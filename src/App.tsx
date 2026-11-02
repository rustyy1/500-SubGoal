import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Lottie } from 'lottie-react';
import {
  ArrowUpRight,
  ChevronDown,
  Crosshair,
  Film,
  Flame,
  HelpCircle,
  LockKeyhole,
  Play,
  RefreshCw,
  Share2,
  Sparkles,
  Target,
  Trophy,
  User,
  Edit3,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import type { ChannelVideo, Phase, SubscriberResponse } from './lib/types';
import { RustyyQuestRunner } from './components/RustyyQuestRunner';
import { RustyyTargetQuest } from './components/RustyyTargetQuest';
import { RustyyTrivia } from './components/RustyyTrivia';
import { ArcadeLeaderboard } from './components/ArcadeLeaderboard';
import { GamerTagModal } from './components/GamerTagModal';
import { getActivePilotProfile, PilotProfile } from './lib/auth';
import { getPlayerUsername } from './lib/leaderboard';
import { ChannelVideoModal, FloatingVideoBar } from './components/VideoPlayerModal';
import { CursorParticles } from './components/CursorParticles';
import { LegendWall } from './components/LegendWall';
import { PredictionGame } from './components/PredictionGame';
import { MilestoneTrack } from './components/MilestoneTrack';
import { ShareCardModal } from './components/ShareCardModal';
import { CreatorFlashBanner, DevModeModal, useEasterEggs } from './components/EasterEggs';
import { AmbientAudioDrone } from './components/AmbientAudioDrone';

const GOAL = 500;
const CHANNEL_URL = 'https://www.youtube.com/@the_rustyy?sub_confirmation=1';
const UNLOCK_KEY = 'rustyy-500-quest-unlocked-v1';
const VISITS_KEY = 'rustyy_visit_count_v1';
const POLL_INTERVAL_MS = 120_000;

const BACKGROUNDS = [
  'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=2400&q=88',
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2400&q=88',
  'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=2400&q=88',
];

const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(value);

function readUnlockedFlag() {
  try {
    return window.localStorage.getItem(UNLOCK_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeUnlockedFlag() {
  try {
    window.localStorage.setItem(UNLOCK_KEY, 'true');
  } catch {
    // Current tab still celebrates
  }
}

function getAndIncrementVisits(): number {
  try {
    const current = Number(localStorage.getItem(VISITS_KEY) || 0) + 1;
    localStorage.setItem(VISITS_KEY, String(current));
    return current;
  } catch {
    return 1;
  }
}

function useOptionalLottie(path: string) {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(path)
      .then((response) => {
        if (!response.ok) throw new Error('Optional animation is not installed');
        return response.json();
      })
      .then(() => {
        if (active) setAvailable(true);
      })
      .catch(() => {
        // Fallback gracefully
      });
    return () => {
      active = false;
    };
  }, [path]);

  return available;
}

export default function App() {
  const query = new URLSearchParams(window.location.search);
  const preview = query.get('preview');
  const resetPreview = query.get('reset') === '1';
  const isPreview = preview === 'mission' || preview === 'celebration';

  const [visitCount] = useState<number>(getAndIncrementVisits);
  const [subscriberData, setSubscriberData] = useState<SubscriberResponse>({
    configured: false,
    subscriberCount: null,
  });
  const [phase, setPhase] = useState<Phase>(() => {
    if (resetPreview) {
      try { window.localStorage.removeItem(UNLOCK_KEY); } catch { /* ignore */ }
      return 'mission';
    }
    return readUnlockedFlag() ? 'thanks' : 'mission';
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [partyPopperSound, setPartyPopperSound] = useState<HTMLAudioElement | null>(null);
  const [soundAvailable, setSoundAvailable] = useState(false);

  const [activeVideo, setActiveVideo] = useState<ChannelVideo | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [lastGameScore, setLastGameScore] = useState<number | undefined>(undefined);
  const [activeGameTab, setActiveGameTab] = useState<'runner' | 'target' | 'trivia' | 'leaderboard'>('runner');
  const [activeProfile, setActiveProfile] = useState<PilotProfile | null>(getActivePilotProfile);
  const [isGamerTagModalOpen, setIsGamerTagModalOpen] = useState(false);
  const [playerUsername, setPlayerUsername] = useState(() => getActivePilotProfile()?.tag || getPlayerUsername() || '');
  const [brandClickCount, setBrandClickCount] = useState(0);

  // Easter eggs hook
  const { devModeOpen, setDevModeOpen, creatorFlash } = useEasterEggs();

  const partyAnimation = useOptionalLottie('/assets/party-popper.json');
  const screenConfettiAnimation = useOptionalLottie('/assets/confetti.json');

  const launchCelebration = () => {
    writeUnlockedFlag();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setPhase('thanks');
      return;
    }

    setPhase('celebration');

    const colors = ['#e8bd78', '#f6e5bc', '#c43b32', '#f4f0e8', '#9c6e3b'];
    confetti({
      particleCount: 190,
      spread: 105,
      startVelocity: 52,
      gravity: 0.86,
      ticks: 230,
      origin: { x: 0.5, y: 0.48 },
      colors,
      zIndex: 120,
    });

    let bursts = 0;
    const interval = window.setInterval(() => {
      bursts += 1;
      confetti({
        particleCount: 46,
        angle: 58,
        spread: 72,
        startVelocity: 48,
        origin: { x: 0.04, y: 0.72 },
        colors,
        zIndex: 120,
      });
      confetti({
        particleCount: 46,
        angle: 122,
        spread: 72,
        startVelocity: 48,
        origin: { x: 0.96, y: 0.72 },
        colors,
        zIndex: 120,
      });
      if (bursts >= 7) window.clearInterval(interval);
    }, 680);

    window.setTimeout(() => {
      setPhase('thanks');
    }, 10_800);
  };

  const fetchCount = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch('/api/subscribers', { cache: 'no-store' });
      const payload = (await response.json()) as SubscriberResponse;
      if (!response.ok) {
        setSubscriberData({
          configured: Boolean(payload.configured),
          subscriberCount: null,
          error: payload.error || 'Could not fetch subscriber count.',
        });
      } else {
        setSubscriberData(payload);
        // If creator went live, immediately feature the live broadcast
        if (payload.isLiveNow && payload.liveVideo) {
          setActiveVideo(payload.liveVideo);
        } else if (payload.featuredVideo && !activeVideo) {
          setActiveVideo(payload.featuredVideo);
        }
      }
      setLastChecked(new Date());
    } catch {
      setSubscriberData((current) => ({
        ...current,
        error: 'Could not reach server API.',
      }));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleProfileUpdated = (profile: PilotProfile | null) => {
    setActiveProfile(profile);
    const tag = profile ? profile.tag : '';
    setPlayerUsername(tag);
  };

  useEffect(() => {
    if (preview === 'mission') {
      setPhase('mission');
      setSubscriberData({
        configured: true,
        handle: '@the_rustyy',
        channelTitle: 'Rustyy',
        subscriberCount: 327,
        updatedAt: new Date().toISOString(),
      });
      setLastChecked(new Date());
      return;
    }
    if (preview === 'celebration') {
      setSubscriberData({
        configured: true,
        handle: '@the_rustyy',
        channelTitle: 'Rustyy',
        subscriberCount: GOAL,
        updatedAt: new Date().toISOString(),
      });
      setLastChecked(new Date());
      launchCelebration();
      return;
    }

    void fetchCount();
    const timer = window.setInterval(() => void fetchCount(), POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [preview]);

  useEffect(() => {
    if (preview) return;
    const count = subscriberData.subscriberCount;
    if (count === null) return;

    if (count >= GOAL) {
      if (readUnlockedFlag()) {
        setPhase('thanks');
      } else {
        launchCelebration();
      }
    } else if (!readUnlockedFlag()) {
      setPhase('mission');
    }
  }, [preview, subscriberData.subscriberCount]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSceneIndex((current) => (current + 1) % BACKGROUNDS.length);
    }, 13_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    fetch('/assets/party-popper.mp3', { method: 'HEAD' })
      .then((response) => {
        if (response.ok) {
          audio = new Audio('/assets/party-popper.mp3');
          audio.volume = 0.42;
          setPartyPopperSound(audio);
          setSoundAvailable(true);
        }
      })
      .catch(() => undefined);
    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
    };
  }, []);

  const handleBrandClick = () => {
    const next = brandClickCount + 1;
    setBrandClickCount(next);
    if (next === 5) {
      setBrandClickCount(0);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.1, y: 0.1 },
        colors: ['#e4b975', '#fff']
      });
    }
  };

  const count = subscriberData.subscriberCount;
  const remaining = count === null ? null : Math.max(GOAL - count, 0);
  const progress = count === null ? 0 : Math.min((count / GOAL) * 100, 100);
  const isComplete = phase !== 'mission';
  const checkedLabel = lastChecked
    ? `SYNCED ${lastChecked.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
    : 'CONNECTING...';

  const allChannelVideos = (() => {
    const list = subscriberData.videos || [];
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    return list.filter((v) => {
      const normTitle = v.title.trim().toLowerCase();
      if (seenIds.has(v.id) || seenTitles.has(normTitle)) {
        return false;
      }
      seenIds.add(v.id);
      seenTitles.add(normTitle);
      return true;
    });
  })();

  return (
    <main className={`app-shell ${isComplete ? 'is-complete' : ''}`}>
      {/* Interactive Cursor Particle Trail */}
      <CursorParticles />

      {/* Secret Easter Egg Overlays */}
      <CreatorFlashBanner active={creatorFlash} />
      <DevModeModal isOpen={devModeOpen} onClose={() => setDevModeOpen(false)} />

      {/* Cinematic Dynamic Backgrounds */}
      <div className="backdrop" style={{ backgroundImage: `url("${BACKGROUNDS[sceneIndex]}")` }} />
      <div className="backdrop-tint" />
      <div className="film-grain" />
      <div className="ambient-glow ambient-glow-one" />
      <div className="ambient-glow ambient-glow-two" />

      {/* TOPBAR NAVIGATION */}
      <header className="topbar">
        <div className="brand-wrap" onClick={handleBrandClick}>
          <a className="brand" href="https://www.youtube.com/@the_rustyy" target="_blank" rel="noreferrer" aria-label="Rustyy YouTube channel">
            <span className="brand-mark brand-mark-img">
              <img src="/rustyy-icon.png" alt="Rustyy" className="brand-avatar-img" />
            </span>
            <span className="brand-name">RUSTYY<span className="brand-period">.</span></span>
            <span className="brand-badge">THE 500 QUEST</span>
          </a>
          {visitCount > 1 && (
            <span className="visit-badge" title="Return Supporter Rank">
              VISIT #{visitCount}
            </span>
          )}
        </div>

        <div className="topbar-right">
          <AmbientAudioDrone />

          <button
            className="video-toggle-pill"
            onClick={() => setIsVideoModalOpen(true)}
            type="button"
            title="Watch latest video from Rustyy"
          >
            <Film size={14} className="icon-gold" />
            <span>CHANNEL BROADCAST</span>
            <span className="live-badge-mini">PLAY</span>
          </button>

          <button
            className="share-trigger-pill"
            onClick={() => setIsShareModalOpen(true)}
            type="button"
            title="Share with friends"
          >
            <Share2 size={13} className="icon-gold" />
            <span>RALLY CREW</span>
          </button>

          <span className={`connection-pill ${subscriberData.configured ? 'is-live' : 'is-offline'}`}>
            <span className="connection-dot" />
            {isPreview ? 'PREVIEW MODE' : subscriberData.configured ? 'LIVE API' : 'CONNECTING'}
          </span>

          <a className="top-youtube" href={CHANNEL_URL} target="_blank" rel="noreferrer" aria-label="Subscribe to Rustyy">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span>SUBSCRIBE</span> <ArrowUpRight size={14} />
          </a>
        </div>
      </header>

      {/* COMMUNITY TICKER / GUESTBOOK STRIP */}
      {phase === 'mission' && <LegendWall />}

      {/* MISSION PHASE */}
      {phase === 'mission' && (
        <section className="mission-view content-wrap">
          <div className="mission-copy">
            <div className="eyebrow">
              <span className="eyebrow-line" />
              <span>THE FIRST MILESTONE DESTINATION</span>
              <span className="eyebrow-line" />
            </div>
            <p className="chapter-label">RUSTYY ORIGINAL &nbsp; / &nbsp; CHAPTER 01</p>
            <h1 className="hero-title typewriter-hero">
              EVERY LEGEND<br />
              <span>STARTS SOMEWHERE.</span>
            </h1>
            <p className="hero-description">
              One community. One goal. One massive surprise waiting at 500.<br />
              Help me defeat the algorithm and unlock the next chapter.
            </p>

            {/* MILESTONE CARD */}
            <div className="mission-card heartbeat-card">
              <div className="card-topline">
                <div className="objective-label">
                  <Target size={14} />
                  <span>TARGET: 500 SUBSCRIBERS</span>
                </div>
                <div className="objective-status">
                  <span className="status-indicator-dot" />
                  <span className="status-indicator-text">
                    {subscriberData.configured ? 'LIVE COUNT' : 'INITIALIZING'}
                  </span>
                </div>
              </div>

              <div className="count-row">
                <div className="count-value-wrap">
                  <span className="count-number">
                    {count !== null ? formatNumber(count) : '---'}
                  </span>
                  <span className="count-caption">CURRENT LEGENDS JOINED</span>
                </div>
                <div className="goal-value-wrap">
                  <span className="goal-number">{formatNumber(GOAL)}</span>
                  <span className="goal-caption">TARGET MILESTONE</span>
                </div>
              </div>

              <div className="progress-meta">
                <span>{progress.toFixed(1)}% COMPLETED</span>
                <span>
                  <strong>{remaining !== null ? formatNumber(remaining) : '---'}</strong> SUBS REMAINING
                </span>
              </div>

              <div className="progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-fill" style={{ width: `${progress}%` }}>
                  <div className="progress-marker" />
                </div>
                <div className="progress-shine" />
              </div>

              {/* Campaign Checkpoints Track */}
              <MilestoneTrack currentCount={count} />

              <div className="card-bottomline">
                <span>MISSION PARAMETER: 500 GOAL</span>
                <span>STATUS: {count !== null && count >= GOAL ? 'ACHIEVED' : 'ENGAGED'}</span>
              </div>

              <a className="subscribe-button" href={CHANNEL_URL} target="_blank" rel="noreferrer">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span>JOIN THE MISSION (SUBSCRIBE)</span>
                <ArrowUpRight size={17} className="button-arrow" />
              </a>

              <div className="card-footnote">
                <span><LockKeyhole size={12} /> THE SURPRISE IS CLASSIFIED UNTIL 500</span>
                <span className="update-time">{isRefreshing ? 'SYNCING...' : checkedLabel}</span>
              </div>
            </div>

            <div className="hint-line">
              <Sparkles size={14} />
              <span>REACH 500. UNLOCK THE CELEBRATION &amp; SECRET CONTENT.</span>
            </div>
          </div>

          {/* SIDE COLUMN: PREDICTION GAME & INTEL BRIEFING */}
          <div className="side-column">
            {/* Interactive Prediction Game */}
            <PredictionGame currentSubs={count} />

          {/* Video preview card if available */}
          {activeVideo && (
            <div className="side-video-card" onClick={() => setIsVideoModalOpen(true)}>
              <div className="svc-header">
                <div className="svc-live-indicator">
                  <span className={`pulse-red ${activeVideo.isLive ? 'pulse-live' : ''}`} />
                  <span>{activeVideo.isLive ? '🔴 LIVE STREAM BROADCAST' : 'LATEST CHANNEL UPLOAD'}</span>
                </div>
                <span className="svc-click-hint">EXPAND</span>
              </div>
              <div className="svc-thumb-container">
                <img src={activeVideo.thumbnail} alt={activeVideo.title} className="svc-thumb" />
                <div className="svc-play-button">
                  <Play size={20} fill="currentColor" />
                </div>
              </div>
              <div className="svc-footer">
                <p className="svc-title">{activeVideo.title}</p>
              </div>
            </div>
          )}

            <div className="side-briefing">
              <div className="briefing-top">
                <span>INTEL BRIEFING</span>
                <span>001 / 500</span>
              </div>
              <div className="briefing-rule" />
              <div className="briefing-icon"><Target size={22} /></div>
              <p className="briefing-kicker">MISSION PROTOCOL</p>
              <h2>CLASSIFIED SURPRISE</h2>
              <p className="briefing-description">
                There is something waiting beyond this milestone. The special announcement video &amp; community project will be unleashed the second 500 subscribers is hit.
              </p>
              <div className="briefing-lock"><LockKeyhole size={14} /> CLASSIFIED UNTIL 500</div>
            </div>
          </div>
        </section>
      )}

      {/* INTERACTIVE COMMUNITY ARCADE / MINI-GAMES SECTION */}
      {phase === 'mission' && (
        <section className="arcade-section content-wrap">
          <div className="arcade-header">
            <div className="arcade-header-left">
              <div className="eyebrow">
                <span className="eyebrow-line" />
                <span>COMMUNITY RECREATION DECK</span>
                <span className="eyebrow-line" />
              </div>
              <h2 className="arcade-title">
                PASS THE TIME. <span>EARN SUBSCRIBER XP.</span>
              </h2>
              <p className="arcade-subtitle">
                While we rally towards 500 subscribers, test your reflexes in the Rustyy arcade, drill your precision in Aimlabs Gridshot, or test your channel lore!
              </p>

              {/* Player Identity Pill */}
              <div className="arcade-gamertag-bar">
                <div className="gamertag-bar-info">
                  {activeProfile ? (
                    <ShieldCheck size={14} className="icon-gold" />
                  ) : (
                    <User size={13} className="icon-gold" />
                  )}
                  <span className="gamertag-label">PILOT IDENTITY:</span>
                  <div className="gamertag-badge-display">
                    <span className="gamertag-name">{activeProfile?.tag || playerUsername || 'Guest Legend'}</span>
                    {activeProfile ? (
                      <span className="gamertag-verified-badge" title="Identity Verified & Locked with PIN">
                        <Lock size={10} />
                        <span>PIN LOCKED</span>
                      </span>
                    ) : (
                      <span className="gamertag-unverified-badge">UNLOCKED</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsGamerTagModalOpen(true)}
                      className="gamertag-change-btn"
                      title="Claim or switch GamerTag callsign"
                    >
                      <Edit3 size={11} />
                      <span>{activeProfile ? 'SWITCH CALLSIGN' : 'LOCK & CLAIM TAG'}</span>
                    </button>
                  </div>
                </div>
                <div className="gamertag-bar-hint">
                  <span>{activeProfile ? 'SCORES PROTECTED ON SUPABASE GLOBAL LEADERBOARD' : 'LOCK YOUR TAG WITH A PIN SO NO ONE CAN STEAL YOUR CALLSIGN'}</span>
                </div>
              </div>
            </div>

            {/* Game Selector Tabs */}
            <div className="game-tabs-nav">
              <button
                className={`game-nav-btn ${activeGameTab === 'runner' ? 'active' : ''}`}
                onClick={() => setActiveGameTab('runner')}
                type="button"
              >
                <Flame size={15} />
                <span>500 RUNNER</span>
              </button>
              <button
                className={`game-nav-btn ${activeGameTab === 'target' ? 'active' : ''}`}
                onClick={() => setActiveGameTab('target')}
                type="button"
              >
                <Crosshair size={15} />
                <span>AIMLABS GRIDSHOT</span>
              </button>
              <button
                className={`game-nav-btn ${activeGameTab === 'trivia' ? 'active' : ''}`}
                onClick={() => setActiveGameTab('trivia')}
                type="button"
              >
                <HelpCircle size={15} />
                <span>GAMING TRIVIA</span>
              </button>
              <button
                className={`game-nav-btn lb-nav-btn ${activeGameTab === 'leaderboard' ? 'active' : ''}`}
                onClick={() => setActiveGameTab('leaderboard')}
                type="button"
              >
                <Trophy size={15} className="icon-gold" />
                <span>LEADERBOARDS</span>
              </button>
            </div>
          </div>

          <div className="arcade-stage">
            {activeGameTab === 'runner' && (
              <RustyyQuestRunner
                onScoreUp={(score) => setLastGameScore(score)}
                onShareClick={(score) => {
                  setLastGameScore(score);
                  setIsShareModalOpen(true);
                }}
                onViewLeaderboard={() => setActiveGameTab('leaderboard')}
                onOpenGamerTagModal={() => setIsGamerTagModalOpen(true)}
              />
            )}
            {activeGameTab === 'target' && (
              <RustyyTargetQuest
                onScoreUp={(score) => setLastGameScore(score)}
                onShareClick={(score) => {
                  setLastGameScore(score);
                  setIsShareModalOpen(true);
                }}
                onViewLeaderboard={() => setActiveGameTab('leaderboard')}
                onOpenGamerTagModal={() => setIsGamerTagModalOpen(true)}
              />
            )}
            {activeGameTab === 'trivia' && (
              <RustyyTrivia
                onViewLeaderboard={() => setActiveGameTab('leaderboard')}
                onOpenGamerTagModal={() => setIsGamerTagModalOpen(true)}
              />
            )}
            {activeGameTab === 'leaderboard' && (
              <ArcadeLeaderboard
                onPlayGame={(game) => setActiveGameTab(game)}
                onOpenGamerTagModal={() => setIsGamerTagModalOpen(true)}
              />
            )}
          </div>
        </section>
      )}

      {/* CHANNEL RECENT ADVENTURES SHOWCASE */}
      {phase === 'mission' && allChannelVideos.length > 0 && (
        <section className="channel-showcase content-wrap">
          <div className="showcase-header">
            <div>
              <div className="eyebrow">
                <span className="eyebrow-line" />
                <span>RECENT TRANSMISSIONS</span>
                <span className="eyebrow-line" />
              </div>
              <h2 className="showcase-title">
                ADVENTURES FROM <span>THE CHANNEL</span>
              </h2>
            </div>
            <a
              href="https://www.youtube.com/@the_rustyy"
              target="_blank"
              rel="noreferrer"
              className="view-all-link"
            >
              <span>EXPLORE ALL VIDEOS</span>
              <ArrowUpRight size={15} />
            </a>
          </div>

          <div className="video-cards-grid">
            {allChannelVideos
              .filter((vid) => !activeVideo || vid.id !== activeVideo.id)
              .slice(0, 4)
              .map((vid) => (
                <div
                  key={vid.id}
                  className="channel-video-card"
                  onClick={() => {
                    setActiveVideo(vid);
                    setIsVideoModalOpen(true);
                  }}
                >
                  <div className="cv-thumb-wrap">
                    <img src={vid.thumbnail} alt={vid.title} loading="lazy" />
                    {vid.isLive && <span className="live-stream-badge">LIVE</span>}
                    <div className="cv-play-icon">
                      <Play size={18} fill="currentColor" />
                    </div>
                  </div>
                  <div className="cv-info">
                    <h4 className="cv-title">{vid.title}</h4>
                    <span className="cv-watch-btn">
                      <Film size={12} /> {vid.isLive ? 'WATCH LIVE' : 'WATCH NOW'}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* CELEBRATION PHASE */}
      {phase === 'celebration' && (
        <section className="celebration-view content-wrap" aria-live="polite">
          <div className="celebration-kicker"><Trophy size={17} /> MISSION COMPLETE</div>
          <div className="popper popper-left" aria-hidden="true">
            {partyAnimation ? <Lottie src="/assets/party-popper.json" autoplay loop /> : <span>🎉</span>}
          </div>
          <div className="popper popper-right" aria-hidden="true">
            {partyAnimation ? <Lottie src="/assets/party-popper.json" autoplay loop /> : <span>🎉</span>}
          </div>
          <div className="celebration-count">500</div>
          <div className="celebration-subs">SUBSCRIBERS</div>
          <h1>WE DID IT, LEGENDS.</h1>
          <p>THE FIRST MILESTONE IS OURS.</p>
          {screenConfettiAnimation && (
            <div className="optional-confetti-lottie" aria-hidden="true">
              <Lottie src="/assets/confetti.json" autoplay loop />
            </div>
          )}
          {soundAvailable && (
            <button
              className="sound-replay"
              onClick={() => {
                if (partyPopperSound) {
                  partyPopperSound.currentTime = 0;
                  void partyPopperSound.play().catch(() => undefined);
                }
              }}
              type="button"
            >
              REPLAY PARTY POPPER SOUND
            </button>
          )}
        </section>
      )}

      {/* THANKS PHASE */}
      {phase === 'thanks' && (
        <section className="thanks-view content-wrap" aria-live="polite">
          <div className="thanks-emblem"><Trophy size={31} /></div>
          <div className="eyebrow"><span className="eyebrow-line" /> MILESTONE UNLOCKED <span className="eyebrow-line" /></div>
          <p className="chapter-label">500 SUBSCRIBERS &nbsp; / &nbsp; COMMUNITY ACHIEVEMENT</p>
          <h1 className="thanks-title">WE DID IT.<br /><span>500 SUBSCRIBERS.</span></h1>
          <p className="thanks-highlight">THANK YOU, LEGENDS <span>♥</span></p>
          <div className="thanks-message">
            <p>Every sub, every view and every bit of support brought us here. This is just the beginning, and I couldn't have done it without you.</p>
          </div>
          <div className="thanks-divider"><span /><Sparkles size={15} /><span /></div>
          <p className="thanks-tease">BUT THIS ISN'T THE END...</p>
          <h2 className="creator-line">WAIT FOR THE CREATOR.</h2>
          <p className="signature">— RUSTYY</p>
          <div className="reveal-lock"><LockKeyhole size={13} /> THE NEXT CHAPTER WILL BE REVEALED BY THE CREATOR</div>
        </section>
      )}

      {/* FLOATING VIDEO MINI-PLAYER BAR (STICKY AT BOTTOM RIGHT) */}
      {!isVideoModalOpen && (
        <FloatingVideoBar
          video={activeVideo}
          onOpenModal={() => setIsVideoModalOpen(true)}
          onShuffle={() => {
            const list = subscriberData.videos || [];
            if (list.length > 0) {
              const randomIdx = Math.floor(Math.random() * list.length);
              setActiveVideo(list[randomIdx]);
            }
          }}
        />
      )}

      {/* GAMERTAG RESERVATION & AUTHENTICATION MODAL */}
      <GamerTagModal
        isOpen={isGamerTagModalOpen}
        onClose={() => setIsGamerTagModalOpen(false)}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* FULL CHANNEL VIDEO EMBED MODAL */}
      <ChannelVideoModal
        isOpen={isVideoModalOpen}
        video={activeVideo}
        allVideos={allChannelVideos}
        onSelectVideo={(v) => setActiveVideo(v)}
        onClose={() => setIsVideoModalOpen(false)}
      />

      {/* SOCIAL VIRAL SHARE MODAL */}
      <ShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        subCount={count}
        highScore={lastGameScore}
      />

      {/* FOOTER */}
      <footer className="footerbar">
        <div className="footer-left">
          <span className="footer-dot" />
          <span>THE RUSTYY COMMUNITY</span>
          {visitCount >= 3 && <span className="loyal-badge">LOYAL SUPPORTER</span>}
        </div>
        <span className="footer-centre">ONE GOAL. ONE COMMUNITY. ONE BIG SURPRISE.</span>
        <div className="footer-right">
          {phase === 'mission' && (
            <button
              className="refresh-button"
              onClick={() => void fetchCount()}
              disabled={isRefreshing || isPreview}
              type="button"
              title="Refresh subscriber count"
            >
              <RefreshCw size={13} className={isRefreshing ? 'spin' : ''} /> REFRESH
            </button>
          )}
          <span>EST. BY THE CREATOR</span>
        </div>
      </footer>
      <div className="scroll-cue" aria-hidden="true"><ChevronDown size={16} /></div>
    </main>
  );
}

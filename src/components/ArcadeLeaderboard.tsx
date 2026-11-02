import { useEffect, useState } from 'react';
import { Trophy, Medal, Flame, Crosshair, HelpCircle, User, Lock, Edit3, ArrowRight, RotateCcw } from 'lucide-react';
import { getLeaderboard, fetchAndSyncLeaderboard, deduplicateLeaderboard, getPlayerUsername, LeaderboardEntry } from '../lib/leaderboard';
import { getActivePilotProfile } from '../lib/auth';

interface ArcadeLeaderboardProps {
  initialGame?: 'target' | 'runner' | 'trivia';
  onPlayGame?: (game: 'target' | 'runner' | 'trivia') => void;
  onOpenGamerTagModal?: () => void;
}

export function ArcadeLeaderboard({
  initialGame = 'target',
  onPlayGame,
  onOpenGamerTagModal,
}: ArcadeLeaderboardProps) {
  const [selectedGame, setSelectedGame] = useState<'target' | 'runner' | 'trivia'>(initialGame);
  const activeProfile = getActivePilotProfile();
  const username = activeProfile?.tag || getPlayerUsername() || '';
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => getLeaderboard(initialGame));

  useEffect(() => {
    void fetchAndSyncLeaderboard(selectedGame).then((data) => {
      if (data) setEntries(data);
    });
  }, [selectedGame]);

  const refreshLeaderboard = (game: 'target' | 'runner' | 'trivia') => {
    setSelectedGame(game);
    setEntries(getLeaderboard(game));
    void fetchAndSyncLeaderboard(game).then((data) => {
      if (data) setEntries(data);
    });
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const gameTitles: Record<'target' | 'runner' | 'trivia', { name: string; tag: string; icon: typeof Crosshair }> = {
    target: { name: 'AIMLABS GRIDSHOT', tag: 'REFLEX & ACCURACY', icon: Crosshair },
    runner: { name: '500 QUEST RUNNER', tag: 'ENDLESS SURVIVAL', icon: Flame },
    trivia: { name: 'GAMING TRIVIA', tag: 'CHANNEL LORE', icon: HelpCircle },
  };

  const ActiveIcon = gameTitles[selectedGame].icon;
  const displayedEntries = deduplicateLeaderboard(entries);
  const playerEntryIndex = displayedEntries.findIndex((e) => e.isPlayer);
  const playerEntry = playerEntryIndex >= 0 ? displayedEntries[playerEntryIndex] : null;

  return (
    <div className="mini-game-box leaderboard-box">
      {/* Header */}
      <div className="game-header">
        <div className="game-title">
          <Trophy size={18} className="icon-gold" />
          <span>ARCADE HALL OF FAME</span>
          <span className="game-tag">GLOBAL RECORDS</span>
        </div>

        {/* Player Profile Badge */}
        <div className="player-profile-pill">
          <div className="profile-display">
            {activeProfile ? <Lock size={12} className="icon-gold" /> : <User size={13} className="icon-gold" />}
            <span className="profile-label">PILOT:</span>
            <span className="profile-name">{activeProfile?.tag || username || 'Guest Legend'}</span>
            <button
              type="button"
              onClick={() => {
                if (onOpenGamerTagModal) {
                  onOpenGamerTagModal();
                }
              }}
              className="profile-edit-btn"
              title="Claim or switch verified GamerTag callsign"
            >
              <Edit3 size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* Game Selector Switcher Tabs */}
      <div className="leaderboard-tabs-bar">
        <button
          type="button"
          className={`lb-tab-btn ${selectedGame === 'target' ? 'active' : ''}`}
          onClick={() => refreshLeaderboard('target')}
        >
          <Crosshair size={13} />
          <span>AIMLABS GRIDSHOT</span>
        </button>
        <button
          type="button"
          className={`lb-tab-btn ${selectedGame === 'runner' ? 'active' : ''}`}
          onClick={() => refreshLeaderboard('runner')}
        >
          <Flame size={13} />
          <span>500 RUNNER</span>
        </button>
        <button
          type="button"
          className={`lb-tab-btn ${selectedGame === 'trivia' ? 'active' : ''}`}
          onClick={() => refreshLeaderboard('trivia')}
        >
          <HelpCircle size={13} />
          <span>LORE TRIVIA</span>
        </button>
      </div>

      {/* Leaderboard Table Content */}
      <div className="leaderboard-content">
        <div className="lb-table-header">
          <span className="lb-col-rank">RANK</span>
          <span className="lb-col-pilot">PLAYER / GAMERTAG</span>
          <span className="lb-col-score">HIGH SCORE</span>
          <span className="lb-col-date">RECORDED</span>
        </div>

        <div className="lb-table-body">
          {displayedEntries.length === 0 ? (
            <div className="lb-empty">
              <p>No records found for this trial yet. Be the first to set a score!</p>
            </div>
          ) : (
            displayedEntries.map((entry, index) => {
              const rank = index + 1;
              const isTop3 = rank <= 3;
              const isCurrentPlayer = entry.isPlayer || (username && entry.name.toLowerCase() === username.toLowerCase());

              return (
                <div
                  key={entry.id || `${entry.name}_${index}`}
                  className={`lb-row ${isCurrentPlayer ? 'is-player-row' : ''} ${isTop3 ? `rank-${rank}` : ''}`}
                >
                  <div className="lb-col-rank">
                    {rank === 1 ? (
                      <span className="crown-badge gold">
                        <Medal size={14} /> #1
                      </span>
                    ) : rank === 2 ? (
                      <span className="crown-badge silver">
                        <Medal size={14} /> #2
                      </span>
                    ) : rank === 3 ? (
                      <span className="crown-badge bronze">
                        <Medal size={14} /> #3
                      </span>
                    ) : (
                      <span className="rank-num">#{rank}</span>
                    )}
                  </div>

                  <div className="lb-col-pilot">
                    <span className="pilot-name">{entry.name}</span>
                    {isCurrentPlayer && <span className="you-badge">YOU</span>}
                  </div>

                  <div className="lb-col-score">
                    <span className="score-val">{entry.score.toLocaleString()}</span>
                    <span className="score-unit">PTS</span>
                  </div>

                  <div className="lb-col-date">
                    <span>{formatTimeAgo(entry.timestamp)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Guest conversion banner */}
        {!activeProfile && onOpenGamerTagModal && (
          <div className="lb-guest-prompt" onClick={onOpenGamerTagModal} role="button" tabIndex={0}>
            <div className="lb-guest-prompt-left">
              <Lock size={13} className="icon-gold" />
              <span>Playing as <strong>{username || 'Guest'}</strong>. Claim your callsign &amp; PIN to protect your high scores from being lost!</span>
            </div>
            <span className="lb-guest-action">CLAIM CALLSIGN →</span>
          </div>
        )}

        {/* Player summary banner */}
        <div className="lb-player-summary">
          <div className="lb-summary-left">
            <ActiveIcon size={16} className="icon-gold" />
            <div>
              <p className="summary-title">{gameTitles[selectedGame].name}</p>
              <p className="summary-desc">
                {playerEntry
                  ? `Your best record: ${playerEntry.score.toLocaleString()} PTS (Rank #${playerEntryIndex + 1})`
                  : 'You have not set a recorded score for this game yet.'}
              </p>
            </div>
          </div>

          {onPlayGame && (
            <button
              type="button"
              className="game-btn-primary lb-play-btn"
              onClick={() => onPlayGame(selectedGame)}
            >
              <span>PLAY THIS CHALLENGE</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="game-footer">
        <span>🏆 TOP 10 PILOTS ARE IMMORTALIZED IN THE RUSTYY ARCHIVES</span>
        <button
          type="button"
          className="refresh-lb-btn"
          onClick={() => refreshLeaderboard(selectedGame)}
          title="Refresh standings"
        >
          <RotateCcw size={11} />
          <span>REFRESH</span>
        </button>
      </div>
    </div>
  );
}

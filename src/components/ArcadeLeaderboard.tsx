import { useEffect, useState } from 'react';
import { Trophy, Medal, Flame, Crosshair, HelpCircle, User, Check, Edit3, ArrowRight, RotateCcw } from 'lucide-react';
import { getLeaderboard, fetchAndSyncLeaderboard, getPlayerUsername, savePlayerUsername, LeaderboardEntry } from '../lib/leaderboard';

interface ArcadeLeaderboardProps {
  initialGame?: 'target' | 'runner' | 'trivia';
  onPlayGame?: (game: 'target' | 'runner' | 'trivia') => void;
  onUsernameChange?: (username: string) => void;
}

export function ArcadeLeaderboard({
  initialGame = 'target',
  onPlayGame,
  onUsernameChange,
}: ArcadeLeaderboardProps) {
  const [selectedGame, setSelectedGame] = useState<'target' | 'runner' | 'trivia'>(initialGame);
  const [username, setUsername] = useState(() => getPlayerUsername() || '');
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);
  const [entries, setEntries] = useState<LeaderboardEntry[]>(() => getLeaderboard(initialGame));

  useEffect(() => {
    void fetchAndSyncLeaderboard(selectedGame).then((data) => {
      if (data && data.length > 0) setEntries(data);
    });
  }, [selectedGame]);

  const refreshLeaderboard = (game: 'target' | 'runner' | 'trivia') => {
    setSelectedGame(game);
    setEntries(getLeaderboard(game));
    void fetchAndSyncLeaderboard(game).then((data) => {
      if (data && data.length > 0) setEntries(data);
    });
  };

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tempUsername.trim().slice(0, 18);
    if (!clean) return;
    savePlayerUsername(clean);
    setUsername(clean);
    setIsEditingUser(false);
    if (onUsernameChange) onUsernameChange(clean);
    setEntries(getLeaderboard(selectedGame));
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
  const playerEntryIndex = entries.findIndex((e) => e.isPlayer);
  const playerEntry = playerEntryIndex >= 0 ? entries[playerEntryIndex] : null;

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
          {isEditingUser ? (
            <form onSubmit={handleSaveUsername} className="profile-edit-form">
              <input
                type="text"
                value={tempUsername}
                onChange={(e) => setTempUsername(e.target.value)}
                placeholder="Enter GamerTag..."
                maxLength={18}
                className="profile-input"
                autoFocus
              />
              <button type="submit" className="profile-save-btn" title="Save GamerTag">
                <Check size={12} />
              </button>
            </form>
          ) : (
            <div className="profile-display">
              <User size={13} className="icon-gold" />
              <span className="profile-label">TAG:</span>
              <span className="profile-name">{username || 'Guest Legend'}</span>
              <button
                type="button"
                onClick={() => {
                  setTempUsername(username);
                  setIsEditingUser(true);
                }}
                className="profile-edit-btn"
                title="Change GamerTag"
              >
                <Edit3 size={11} />
              </button>
            </div>
          )}
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
          {entries.length === 0 ? (
            <div className="lb-empty">
              <p>No records found for this trial yet. Be the first to set a score!</p>
            </div>
          ) : (
            entries.map((entry, index) => {
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

import { useEffect, useRef, useState } from 'react';
import { Edit3, MessageSquare, Send, Trash2, Users, X } from 'lucide-react';

const MY_ENTRY_KEY = 'rustyy_my_legend_entry_v1';
const ALL_CUSTOM_ENTRIES_KEY = 'rustyy_all_custom_entries_v1';

interface LegendEntry {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  isPreset?: boolean;
  isMine?: boolean;
}

const PRESET_LEGENDS: LegendEntry[] = [
  { id: 'p1', name: 'ShadowBlade_X', message: "Let's get Rustyy to 500! 🔥", timestamp: Date.now() - 86400000 * 12, isPreset: true },
  { id: 'p2', name: 'EldenLord99', message: 'Elden Ring streams are elite 🗡️', timestamp: Date.now() - 86400000 * 11, isPreset: true },
  { id: 'p3', name: 'NightOwlGamer', message: 'Subscribed! This quest is happening', timestamp: Date.now() - 86400000 * 10, isPreset: true },
  { id: 'p4', name: 'CrypticWolf', message: 'One community, one mission. LFG 💪', timestamp: Date.now() - 86400000 * 9, isPreset: true },
  { id: 'p5', name: 'PixelRaider', message: '500 is just the beginning', timestamp: Date.now() - 86400000 * 8, isPreset: true },
  { id: 'p6', name: 'AstroKnight', message: 'Blair Witch playthrough was insane 😱', timestamp: Date.now() - 86400000 * 7, isPreset: true },
  { id: 'p7', name: 'ValorantAce', message: 'That Valorant session was fire', timestamp: Date.now() - 86400000 * 6, isPreset: true },
  { id: 'p8', name: 'DarkSoulsVet', message: 'Rustyy makes gaming content feel personal', timestamp: Date.now() - 86400000 * 5, isPreset: true },
  { id: 'p9', name: 'GhostRunner_', message: 'Shared with my whole Discord server!', timestamp: Date.now() - 86400000 * 4, isPreset: true },
  { id: 'p10', name: 'ChaosModeON', message: 'Watch Dogs 2 chaos had me dying 😂', timestamp: Date.now() - 86400000 * 3, isPreset: true },
  { id: 'p11', name: 'LegendaryNoob', message: 'Every legend starts somewhere. Facts.', timestamp: Date.now() - 86400000 * 2, isPreset: true },
  { id: 'p12', name: 'TacticalPanda', message: 'The surprise at 500 better be good 👀', timestamp: Date.now() - 86400000 * 1, isPreset: true },
  { id: 'p13', name: 'IndieGamer_22', message: 'Supporting from Day 1! Real ones know', timestamp: Date.now() - 43200000, isPreset: true },
  { id: 'p14', name: 'QuestHunter', message: 'This website is insane, who built this??', timestamp: Date.now() - 36000000, isPreset: true },
  { id: 'p15', name: 'StealthMode', message: 'Rustyy is the most underrated creator', timestamp: Date.now() - 21600000, isPreset: true },
  { id: 'p16', name: 'PhantomByte', message: 'Dropping a sub right now. 500 incoming!', timestamp: Date.now() - 14400000, isPreset: true },
  { id: 'p17', name: 'CyberSamurai', message: 'The catacombs exploration was peak content', timestamp: Date.now() - 7200000, isPreset: true },
  { id: 'p18', name: 'MidnightGrind', message: "Can't wait for the classified surprise", timestamp: Date.now() - 3600000, isPreset: true },
];

function getMyEntry(): LegendEntry | null {
  try {
    const raw = localStorage.getItem(MY_ENTRY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveMyEntry(entry: LegendEntry | null) {
  try {
    if (entry) {
      localStorage.setItem(MY_ENTRY_KEY, JSON.stringify(entry));
    } else {
      localStorage.removeItem(MY_ENTRY_KEY);
    }
  } catch {
    // no-op
  }
}

function getStoredCustomEntries(): LegendEntry[] {
  try {
    const raw = localStorage.getItem(ALL_CUSTOM_ENTRIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredCustomEntries(entries: LegendEntry[]) {
  try {
    localStorage.setItem(ALL_CUSTOM_ENTRIES_KEY, JSON.stringify(entries));
  } catch {
    // no-op
  }
}

export function LegendWall() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [myEntry, setMyEntry] = useState<LegendEntry | null>(getMyEntry);
  const [customEntries, setCustomEntries] = useState<LegendEntry[]>(getStoredCustomEntries);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  const isHoveredRef = useRef(false);

  // Combine custom entries and presets, marking user's entry
  const allEntries: LegendEntry[] = [
    ...(myEntry ? [{ ...myEntry, isMine: true }] : []),
    ...customEntries.filter((e) => !myEntry || e.id !== myEntry.id),
    ...PRESET_LEGENDS,
  ].sort((a, b) => b.timestamp - a.timestamp);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimName = name.trim();
    const trimMsg = message.trim();

    if (!trimName) {
      setFeedback('Please enter your gamertag');
      return;
    }
    if (!trimMsg) {
      setFeedback('Please write a message to the community');
      return;
    }
    if (trimName.length > 24) {
      setFeedback('Gamertag must be 24 characters or less');
      return;
    }
    if (trimMsg.length > 100) {
      setFeedback('Message must be 100 characters or less');
      return;
    }

    const entryId = myEntry?.id || `user_${Date.now()}`;
    const newEntry: LegendEntry = {
      id: entryId,
      name: trimName,
      message: trimMsg,
      timestamp: Date.now(),
      isMine: true,
    };

    saveMyEntry(newEntry);
    setMyEntry(newEntry);

    // Update custom entries list
    const updatedCustom = [newEntry, ...customEntries.filter((ce) => ce.id !== entryId)];
    saveStoredCustomEntries(updatedCustom);
    setCustomEntries(updatedCustom);

    setName('');
    setMessage('');
    setIsEditing(false);
    setFeedback('Entry posted to the Legend Wall! 🔥');
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleDelete = () => {
    if (!myEntry) return;
    const updatedCustom = customEntries.filter((ce) => ce.id !== myEntry.id);
    saveStoredCustomEntries(updatedCustom);
    setCustomEntries(updatedCustom);
    saveMyEntry(null);
    setMyEntry(null);
    setIsEditing(false);
    setName('');
    setMessage('');
    setFeedback('Entry removed from the wall');
    setTimeout(() => setFeedback(null), 3000);
  };

  // Continuous loop ticker
  useEffect(() => {
    const el = tickerRef.current;
    if (!el || isExpanded) return;

    let animId: number;
    let pos = el.scrollLeft;

    const scrollLoop = () => {
      if (!isHoveredRef.current && el) {
        pos += 0.5;
        // Reset when half scrolled (since items are duplicated)
        if (pos >= el.scrollWidth / 2) {
          pos = 0;
        }
        el.scrollLeft = pos;
      }
      animId = requestAnimationFrame(scrollLoop);
    };

    animId = requestAnimationFrame(scrollLoop);
    return () => cancelAnimationFrame(animId);
  }, [isExpanded, allEntries.length]);

  return (
    <>
      {/* Compact Ticker Strip */}
      {!isExpanded && (
        <div
          className="legend-ticker-strip"
          onMouseEnter={() => { isHoveredRef.current = true; }}
          onMouseLeave={() => { isHoveredRef.current = false; }}
        >
          <div
            className="ticker-label"
            onClick={() => setIsExpanded(true)}
            role="button"
            tabIndex={0}
          >
            <Users size={12} />
            <span>COMMUNITY LEGENDS ({allEntries.length})</span>
          </div>

          <div
            className="ticker-scroll"
            ref={tickerRef}
            onClick={() => setIsExpanded(true)}
          >
            <div className="ticker-inner">
              {[...allEntries, ...allEntries].map((e, i) => (
                <span
                  key={`${e.id || e.name}-${i}`}
                  className={`ticker-entry ${e.isMine ? 'ticker-entry-mine' : ''}`}
                >
                  <strong>{e.name}</strong>
                  <span>"{e.message}"</span>
                </span>
              ))}
            </div>
          </div>

          <button
            className="ticker-expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(true);
            }}
            type="button"
          >
            <MessageSquare size={13} />
            <span>{myEntry ? 'VIEW / EDIT ENTRY' : 'ADD YOUR NAME'}</span>
          </button>
        </div>
      )}

      {/* Expanded Wall Panel */}
      {isExpanded && (
        <div className="legend-wall-panel" onClick={(e) => e.stopPropagation()}>
          <div className="lw-header">
            <div className="lw-header-left">
              <Users size={18} className="icon-gold" />
              <div>
                <h3>COMMUNITY LEGEND WALL</h3>
                <span className="lw-subtitle">Leave your mark on the road to 500 subscribers</span>
              </div>
              <span className="lw-count">{allEntries.length} LEGENDS</span>
            </div>
            <button
              className="lw-close-btn"
              onClick={() => setIsExpanded(false)}
              type="button"
              aria-label="Close wall"
            >
              <X size={18} />
            </button>
          </div>

          {feedback && <div className="lw-feedback-banner">{feedback}</div>}

          {/* Add or Edit Entry Form */}
          {(!myEntry || isEditing) ? (
            <form className="lw-form" onSubmit={handleSubmit}>
              <div className="lw-form-header">
                <span className="lw-form-title">
                  {isEditing ? 'EDIT YOUR COMMUNITY TRANSMISSION' : 'SIGN THE LEGEND WALL'}
                </span>
                <span className="lw-char-hint">
                  {name.length}/24 name • {message.length}/100 msg
                </span>
              </div>

              <div className="lw-form-row">
                <input
                  type="text"
                  className="lw-input lw-input-name"
                  placeholder="Your gamertag / name..."
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 24))}
                  onKeyDown={(e) => e.stopPropagation()}
                  maxLength={24}
                  required
                  autoFocus
                />
                <input
                  type="text"
                  className="lw-input lw-input-msg"
                  placeholder="Your rally cry (e.g. 500 subs incoming! Let's go!)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 100))}
                  onKeyDown={(e) => e.stopPropagation()}
                  maxLength={100}
                  required
                />
                <button className="lw-submit-btn" type="submit">
                  <Send size={14} />
                  <span>{isEditing ? 'UPDATE ENTRY' : 'POST TO WALL'}</span>
                </button>
                {isEditing && (
                  <button
                    className="lw-cancel-btn"
                    onClick={() => {
                      setIsEditing(false);
                      setName('');
                      setMessage('');
                    }}
                    type="button"
                  >
                    CANCEL
                  </button>
                )}
              </div>
            </form>
          ) : (
            <div className="lw-my-entry-card">
              <div className="lw-my-entry-top">
                <span className="lw-your-badge">YOUR POSTED TRANSMISSION</span>
                <div className="lw-my-actions">
                  <button
                    className="lw-action-btn lw-edit-action"
                    onClick={() => {
                      setName(myEntry.name);
                      setMessage(myEntry.message);
                      setIsEditing(true);
                    }}
                    type="button"
                  >
                    <Edit3 size={13} />
                    <span>EDIT</span>
                  </button>
                  <button
                    className="lw-action-btn lw-delete-action"
                    onClick={handleDelete}
                    type="button"
                    title="Remove your message"
                  >
                    <Trash2 size={13} />
                    <span>REMOVE</span>
                  </button>
                </div>
              </div>
              <div className="lw-my-entry-body">
                <div className="lw-avatar lw-avatar-mine">{myEntry.name[0]?.toUpperCase()}</div>
                <div className="lw-my-text">
                  <strong>{myEntry.name}</strong>
                  <p>"{myEntry.message}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Entries Grid */}
          <div className="lw-entries-heading">
            <span>ALL COMMUNITY TRANSMISSIONS</span>
            <span>SORTED BY RECENT</span>
          </div>

          <div className="lw-entries">
            {allEntries.map((entry) => (
              <div
                key={entry.id || `${entry.name}-${entry.timestamp}`}
                className={`lw-entry ${entry.isMine ? 'lw-entry-highlight' : ''}`}
              >
                <div className="lw-entry-topline">
                  <div className="lw-entry-name">
                    <span className={`lw-avatar ${entry.isMine ? 'lw-avatar-mine' : ''}`}>
                      {entry.name[0]?.toUpperCase()}
                    </span>
                    <strong>{entry.name}</strong>
                  </div>
                  {entry.isMine && <span className="lw-mine-tag">YOU</span>}
                </div>
                <p className="lw-entry-msg">"{entry.message}"</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

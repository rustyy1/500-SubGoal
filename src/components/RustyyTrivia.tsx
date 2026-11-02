import { useState } from 'react';
import { CheckCircle2, ChevronRight, HelpCircle, RotateCcw, Trophy, XCircle } from 'lucide-react';
import { getPlayerUsername, saveScoreToLeaderboard } from '../lib/leaderboard';

interface Question {
  question: string;
  game: string;
  options: string[];
  answer: number;
  explanation: string;
}

const TRIVIA_QUESTIONS: Question[] = [
  {
    question: "Which mystical open-world RPG does Rustyy explore in recent catacombs episodes?",
    game: "ELDEN RING",
    options: ["The Witcher 3", "Elden Ring", "Dark Souls III", "Skyrim"],
    answer: 1,
    explanation: "Rustyy has been delving deep into the Lands Between exploring catacombs and dungeons!"
  },
  {
    question: "In Rustyy's recent chaotic play-through series, which hacker sandbox game brought pure madness?",
    game: "WATCH DOGS 2",
    options: ["Cyberpunk 2077", "Watch Dogs 2", "GTA V", "Saints Row"],
    answer: 1,
    explanation: "Rustyy declared: 'WATCH DOGS 2 IS PURE CHAOS 😭' during the first play-through!"
  },
  {
    question: "Which psychological horror title did Rustyy survive with 'The Worst Ending'?",
    game: "BLAIR WITCH",
    options: ["Outlast 2", "Blair Witch", "Resident Evil 7", "Phasmophobia"],
    answer: 1,
    explanation: "Rustyy took on the Black Hills Forest in the Blair Witch horror series!"
  },
  {
    question: "What is the ultimate target subscriber milestone for this special community quest?",
    game: "RUSTYY QUEST",
    options: ["250 Subs", "350 Subs", "500 Subs", "1,000 Subs"],
    answer: 2,
    explanation: "The entire mission is locked onto reaching 500 subscribers to unveil the classified surprise!"
  },
  {
    question: "What happens when the community unlocks the 500 subscriber milestone?",
    game: "COMMUNITY SECRET",
    options: [
      "The site shuts down",
      "Celebration poppers & 'Wait for the Creator' chapter unlock",
      "Nothing changes",
      "A paywall appears"
    ],
    answer: 1,
    explanation: "Reaching 500 triggers screen-filling confetti and unlocks the next secret chapter by the Creator!"
  }
];

interface TriviaProps {
  onViewLeaderboard?: () => void;
}

export function RustyyTrivia({ onViewLeaderboard }: TriviaProps = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentQ = TRIVIA_QUESTIONS[currentIndex];

  const handleSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (index === currentQ.answer) {
      setScore((s) => s + 100);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < TRIVIA_QUESTIONS.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
    } else {
      setCompleted(true);
      const finalScore = score;
      const playerName = getPlayerUsername() || 'Anonymous Legend';
      saveScoreToLeaderboard('trivia', playerName, finalScore);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setCompleted(false);
  };

  return (
    <div className="mini-game-box trivia-box">
      <div className="game-header">
        <div className="game-title">
          <HelpCircle size={14} className="icon-gold" />
          <span>RUSTYY GAMING TRIVIA</span>
          <span className="game-tag">{currentQ.game}</span>
        </div>
        <div className="game-stats">
          <div className="stat-pill">
            <span className="stat-label">QUESTION</span>
            <span className="stat-value">{currentIndex + 1}/{TRIVIA_QUESTIONS.length}</span>
          </div>
          <div className="stat-pill">
            <span className="stat-label">SCORE</span>
            <span className="stat-value">{score}</span>
          </div>
        </div>
      </div>

      {!completed ? (
        <div className="trivia-body">
          <h3 className="trivia-question">{currentQ.question}</h3>

          <div className="trivia-options-grid">
            {currentQ.options.map((opt, idx) => {
              let btnClass = 'trivia-option-btn';
              if (selectedAnswer !== null) {
                if (idx === currentQ.answer) {
                  btnClass += ' option-correct';
                } else if (idx === selectedAnswer) {
                  btnClass += ' option-wrong';
                } else {
                  btnClass += ' option-dimmed';
                }
              }

              return (
                <button
                  key={opt}
                  className={btnClass}
                  onClick={() => handleSelect(idx)}
                  disabled={selectedAnswer !== null}
                  type="button"
                >
                  <span className="option-index">{String.fromCharCode(65 + idx)}</span>
                  <span className="option-text">{opt}</span>
                  {selectedAnswer !== null && idx === currentQ.answer && (
                    <CheckCircle2 size={16} className="option-status-icon text-success" />
                  )}
                  {selectedAnswer !== null && idx === selectedAnswer && idx !== currentQ.answer && (
                    <XCircle size={16} className="option-status-icon text-danger" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedAnswer !== null && (
            <div className="trivia-feedback-panel">
              <p className="trivia-explanation">{currentQ.explanation}</p>
              <button className="game-btn-primary next-q-btn" onClick={handleNext} type="button">
                <span>{currentIndex + 1 < TRIVIA_QUESTIONS.length ? 'NEXT QUESTION' : 'VIEW FINAL SCORE'}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="trivia-body trivia-completed">
          <div className="trivia-trophy-badge">
            <Trophy size={36} />
          </div>
          <h2 className="trivia-complete-title">TRIVIA COMPLETE!</h2>
          <p className="trivia-complete-desc">
            You scored <strong>{score} / {TRIVIA_QUESTIONS.length * 100} PTS</strong>
          </p>
          <p className="trivia-rank-p">
            {score >= 400
              ? '👑 ELITE RUSTYY VETERAN — You know every journey inside out!'
              : score >= 200
              ? '⚔️ JOURNEYMAN GAMER — Solid lore knowledge!'
              : '🌱 RECRUIT — Time to binge watch @the_rustyy videos!'}
          </p>
          <div className="game-over-btn-group">
            <button className="game-btn-primary" onClick={restart} type="button">
              <RotateCcw size={15} />
              <span>PLAY AGAIN</span>
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
          </div>
        </div>
      )}
    </div>
  );
}

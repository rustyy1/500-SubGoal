import { useState } from 'react';
import { CheckCircle2, ChevronRight, HelpCircle, Lock, RotateCcw, Trophy, XCircle } from 'lucide-react';
import { getPlayerUsername, saveScoreToLeaderboard } from '../lib/leaderboard';
import { getActivePilotProfile } from '../lib/auth';

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
  },
  {
    question: "In Rustyy's chill tactical FPS stream, which 5v5 hero shooter does he drop into?",
    game: "VALORANT",
    options: ["Counter-Strike 2", "Valorant", "Overwatch 2", "Apex Legends"],
    answer: 1,
    explanation: "Rustyy drops into casual and clutch Valorant gaming sessions!"
  },
  {
    question: "In Rustyy's Elden Ring funny clip 'Ek ka Double kar diya', what happens?",
    game: "ELDEN RING",
    options: [
      "He loses his runes instantly",
      "Hilarious enemy duplication & combat chaos ensues",
      "The game glitches out",
      "He speedruns the entire dungeon"
    ],
    answer: 1,
    explanation: "Pure comedic madness when the fight doubles in difficulty!"
  },
  {
    question: "What is Rustyy's official YouTube channel handle on the platform?",
    game: "CHANNEL INTEL",
    options: ["@rustyy_gaming", "@the_rustyy", "@rustyy_official", "@rustyy500"],
    answer: 1,
    explanation: "The official YouTube channel is @the_rustyy!"
  },
  {
    question: "In the latest Elden Ring journey episode, what was Rustyy's mission?",
    game: "ELDEN RING",
    options: [
      "Defeating Malenia",
      "Getting Out Of This Annoyinggg Cave !!!",
      "Finding the Moonlight Greatsword",
      "Exploring Leyndell Capital"
    ],
    answer: 1,
    explanation: "Rustyy was navigating his way through an exasperating maze cave!"
  },
  {
    question: "What primary survival tool did Rustyy use to investigate clues in the Blair Witch horror series?",
    game: "BLAIR WITCH",
    options: ["Shotgun", "Camcorder & Flashlight", "Drone", "Map Compass"],
    answer: 1,
    explanation: "The iconic camcorder tape manipulation and flashlight kept Rustyy alive!"
  }
];

function pickRandomTriviaQuestions(): Question[] {
  const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5);
}

interface TriviaProps {
  onViewLeaderboard?: () => void;
  onOpenGamerTagModal?: () => void;
}

export function RustyyTrivia({ onViewLeaderboard, onOpenGamerTagModal }: TriviaProps = {}) {
  const [questions, setQuestions] = useState<Question[]>(pickRandomTriviaQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (index === currentQ.answer) {
      setScore((s) => s + 100);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
    } else {
      setCompleted(true);
      const finalScore = score + (selectedAnswer === currentQ.answer ? 0 : 0);
      const playerName = getPlayerUsername() || 'Anonymous Legend';
      saveScoreToLeaderboard('trivia', playerName, finalScore);
    }
  };

  const restart = () => {
    setQuestions(pickRandomTriviaQuestions());
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
            <span className="stat-value">{currentIndex + 1}/{questions.length}</span>
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
                <span>{currentIndex + 1 < questions.length ? 'NEXT QUESTION' : 'VIEW FINAL SCORE'}</span>
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
            You scored <strong>{score} / {questions.length * 100} PTS</strong>
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
          {onOpenGamerTagModal && !getActivePilotProfile() && (
            <button
              className="game-btn-claim-tag"
              onClick={onOpenGamerTagModal}
              type="button"
            >
              <Lock size={12} className="icon-gold" />
              <span>LOCK THIS SCORE TO YOUR CALLSIGN</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Calendar, Check, Clock, Target } from 'lucide-react';
import { submitRemotePrediction } from '../lib/supabase';
import { getPlayerUsername } from '../lib/leaderboard';

const PREDICTION_KEY = 'rustyy_500_prediction_v1';

interface Prediction {
  date: string; // YYYY-MM-DD
  madeAt: number;
}

function loadPrediction(): Prediction | null {
  try {
    const raw = localStorage.getItem(PREDICTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePrediction(pred: Prediction) {
  try {
    localStorage.setItem(PREDICTION_KEY, JSON.stringify(pred));
  } catch {
    // no-op
  }
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function PredictionGame({ currentSubs }: { currentSubs: number | null }) {
  const [prediction, setPrediction] = useState<Prediction | null>(loadPrediction);
  const [inputDate, setInputDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputDate) return;

    const pred: Prediction = {
      date: inputDate,
      madeAt: Date.now(),
    };
    savePrediction(pred);
    setPrediction(pred);

    // Sync to Supabase
    const username = getPlayerUsername() || 'Anonymous Legend';
    void submitRemotePrediction(username, inputDate);
  };

  const today = new Date().toISOString().split('T')[0];
  // Allow predictions up to 2 years out
  const maxDate = new Date(Date.now() + 730 * 86400000).toISOString().split('T')[0];

  if (prediction) {
    const daysLeft = daysUntil(prediction.date);
    const isPast = daysLeft < 0;
    const isToday = daysLeft === 0;

    return (
      <div className="prediction-card prediction-card-submitted">
        <div className="pred-header">
          <div className="pred-header-left">
            <Target size={14} className="icon-gold" />
            <span>YOUR 500 PREDICTION</span>
          </div>
          <span className="pred-badge">LOCKED IN</span>
        </div>

        <div className="pred-result">
          <div className="pred-date-display">
            <Calendar size={18} />
            <span>{formatDate(prediction.date)}</span>
          </div>

          <div className="pred-status">
            {isPast ? (
              <span className="pred-status-text pred-overdue">
                <Clock size={13} /> {Math.abs(daysLeft)} DAYS PAST YOUR PREDICTION
                {currentSubs !== null && currentSubs < 500 && ' — STILL CLIMBING!'}
              </span>
            ) : isToday ? (
              <span className="pred-status-text pred-today">
                <Check size={13} /> TODAY IS YOUR PREDICTED DAY!
                {currentSubs !== null && currentSubs >= 500 ? ' 🎯 YOU CALLED IT!' : ' LET\'S SEE...'}
              </span>
            ) : (
              <span className="pred-status-text pred-upcoming">
                <Clock size={13} /> {daysLeft} DAYS UNTIL YOUR PREDICTION
              </span>
            )}
          </div>

          {currentSubs !== null && (
            <div className="pred-current">
              <span>CURRENT: <strong>{currentSubs}</strong> / 500 SUBS</span>
              <span>• {Math.max(0, 500 - currentSubs)} TO GO</span>
            </div>
          )}
        </div>

        <p className="pred-comeback">Come back to see if your prediction was right! 🔮</p>
      </div>
    );
  }

  return (
    <div className="prediction-card">
      <div className="pred-header">
        <div className="pred-header-left">
          <Target size={14} className="icon-gold" />
          <span>PREDICT THE 500 DATE</span>
        </div>
        <span className="pred-badge pred-badge-open">OPEN</span>
      </div>

      <p className="pred-question">
        When do you think <strong>@the_rustyy</strong> will hit 500 subscribers? Lock in your prediction and come back to see if you nailed it.
      </p>

      <form className="pred-form" onSubmit={handleSubmit}>
        <div className="pred-input-row">
          <Calendar size={16} className="pred-input-icon" />
          <input
            type="date"
            className="pred-date-input"
            value={inputDate}
            onChange={(e) => setInputDate(e.target.value)}
            min={today}
            max={maxDate}
            required
          />
        </div>
        <button className="game-btn-primary pred-submit" type="submit" disabled={!inputDate}>
          <Check size={15} />
          <span>LOCK IN MY PREDICTION</span>
        </button>
      </form>
    </div>
  );
}


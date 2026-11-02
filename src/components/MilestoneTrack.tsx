import { Lock, Sparkles } from 'lucide-react';

interface MilestoneTrackProps {
  currentCount: number | null;
}

const MILESTONES = [
  { count: 150, codename: 'FIRST SPARK' },
  { count: 200, codename: 'RISING FLAME' },
  { count: 250, codename: 'HALFWAY SIEGE' },
  { count: 300, codename: 'GOLDEN BATTALION' },
  { count: 350, codename: 'VETERAN RANKS' },
  { count: 400, codename: 'ELITE FORMATION' },
  { count: 450, codename: 'FINAL PUSH' },
  { count: 500, codename: 'LEGENDARY STATUS' },
];

export function MilestoneTrack({ currentCount }: MilestoneTrackProps) {
  const count = currentCount ?? 116;

  return (
    <div className="milestone-track-container">
      <div className="mt-header">
        <span>CAMPAIGN CHECKPOINTS</span>
        <span>NEXT TARGET: {MILESTONES.find(m => m.count > count)?.count || 500} SUBS</span>
      </div>

      <div className="milestone-grid">
        {MILESTONES.map((m) => {
          const reached = count >= m.count;
          const isNext = !reached && (MILESTONES.find(item => count < item.count)?.count === m.count);

          return (
            <div
              key={m.count}
              className={`milestone-pill ${reached ? 'is-reached' : ''} ${isNext ? 'is-next' : ''}`}
            >
              <div className="mp-indicator">
                {reached ? (
                  <Sparkles size={11} className="mp-reached-icon" />
                ) : (
                  <Lock size={10} className="mp-locked-icon" />
                )}
                <span className="mp-count">{m.count}</span>
              </div>
              <span className="mp-codename">{m.codename}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}


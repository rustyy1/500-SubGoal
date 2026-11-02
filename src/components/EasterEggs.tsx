import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Award, Terminal, X } from 'lucide-react';

const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'b', 'a'
];

export function useEasterEggs() {
  const [devModeOpen, setDevModeOpen] = useState(false);
  const [creatorFlash, setCreatorFlash] = useState(false);

  useEffect(() => {
    let konamiIndex = 0;
    let typedBuffer = '';

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts or easter eggs if user is actively typing in an input/textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      // Check Konami Code
      const expectedKey = KONAMI_CODE[konamiIndex];
      if (e.key.toLowerCase() === expectedKey.toLowerCase()) {
        konamiIndex++;
        if (konamiIndex === KONAMI_CODE.length) {
          konamiIndex = 0;
          setDevModeOpen(true);
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#e4b975', '#6ee7b7', '#f43f5e']
          });
        }
      } else {
        konamiIndex = 0;
      }

      // Check typing "rustyy"
      typedBuffer = (typedBuffer + e.key.toLowerCase()).slice(-6);
      if (typedBuffer === 'rustyy') {
        typedBuffer = '';
        setCreatorFlash(true);
        setTimeout(() => setCreatorFlash(false), 3800);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { devModeOpen, setDevModeOpen, creatorFlash };
}

export function DevModeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="video-modal-backdrop" onClick={onClose}>
      <div className="devmode-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="devmode-header">
          <div className="devmode-title">
            <Terminal size={17} className="icon-gold" />
            <span>SECRET PROTOCOL UNLOCKED: DEVELOPER CONSOLE</span>
          </div>
          <button className="vm-icon-btn" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="devmode-body">
          <div className="devmode-badge"><Award size={14} /> EASTER EGG ACHIEVED: KONAMI CODE HERO</div>
          <p className="devmode-code-text">
            <code>[ACCESS GRANTED] — CHANNEL NODE: @the_rustyy</code><br />
            <code>[SERVER ENGINE] — HYPERDRIVE V8 // VITE 8.3 // REACT 19</code><br />
            <code>[STATUS] — TARGET 500 IN SIGHT. CLASSIFIED ENCRYPTION KEYS ARMED.</code>
          </p>
          <div className="devmode-quote">
            <p>"If you found this screen, you are a true gamer. Take a screenshot, send it into the community, and keep rallying the troops."</p>
            <span>— RUSTYY SYSTEM</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CreatorFlashBanner({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div className="creator-flash-overlay">
      <div className="cf-content">
        <span className="cf-tag">HIDDEN TRANSMISSION DETECTED</span>
        <h2 className="cf-title">THE CREATOR ACKNOWLEDGES YOU</h2>
        <p className="cf-sub">YOU ENTERED THE SECRET CYPHER: "RUSTYY"</p>
      </div>
    </div>
  );
}


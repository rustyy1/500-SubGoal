import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export function AmbientAudioDrone() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);

  const stopAudio = useCallback(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 1.2);
      setTimeout(() => {
        oscillatorsRef.current.forEach(osc => {
          try { osc.stop(); osc.disconnect(); } catch { /* ignore */ }
        });
        oscillatorsRef.current = [];
        try { audioCtxRef.current?.close(); } catch { /* ignore */ }
        audioCtxRef.current = null;
        gainNodeRef.current = null;
        setIsPlaying(false);
      }, 1250);
    }
  }, []);

  const startAudio = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 2.5); // Soft atmospheric volume
      masterGain.connect(ctx.destination);
      gainNodeRef.current = masterGain;

      // Dark sci-fi chord notes (D minor / Elden Grace tones)
      const freqs = [73.42, 110.00, 146.83, 220.00];
      const oscs: OscillatorNode[] = [];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        // Low pass filter for warm cinematic sub-bass
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, ctx.currentTime);

        osc.connect(filter);
        filter.connect(masterGain);
        osc.start();
        oscs.push(osc);
      });

      oscillatorsRef.current = oscs;
      setIsPlaying(true);
    } catch {
      // AudioContext policy
    }
  }, []);

  const toggleSound = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  return (
    <button
      className={`ambient-audio-pill ${isPlaying ? 'is-playing' : ''}`}
      onClick={toggleSound}
      type="button"
      title="Cinematic ambient atmosphere sound"
    >
      {isPlaying ? <Volume2 size={13} /> : <VolumeX size={13} />}
      <span>{isPlaying ? 'AMBIENCE ON' : 'ATMOSPHERE'}</span>
      {isPlaying && <span className="sound-wave-bar" />}
    </button>
  );
}


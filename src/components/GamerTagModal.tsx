import { useEffect, useState } from 'react';
import { Check, KeyRound, Lock, ShieldAlert, ShieldCheck, User, X, LogOut, ArrowRight } from 'lucide-react';
import {
  clearActivePilotProfile,
  getActivePilotProfile,
  PilotProfile,
  saveActivePilotProfile,
  validateGamerTag,
  validateSecurityPin,
} from '../lib/auth';
import {
  authenticatePlayerAccount,
  checkGamerTagAvailability,
  registerPlayerAccount,
} from '../lib/supabase';

interface GamerTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (profile: PilotProfile | null) => void;
}

export function GamerTagModal({ isOpen, onClose, onProfileUpdated }: GamerTagModalProps) {
  const [currentProfile, setCurrentProfile] = useState<PilotProfile | null>(getActivePilotProfile);
  const [tagInput, setTagInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [tagStatus, setTagStatus] = useState<'idle' | 'checking' | 'available' | 'claimed'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const active = getActivePilotProfile();
      setCurrentProfile(active);
      setTagInput(active ? active.tag : '');
      setPinInput('');
      setTagStatus('idle');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced check on GamerTag input
  useEffect(() => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmed = tagInput.trim();
    if (!trimmed) {
      setTagStatus('idle');
      return;
    }

    const checkValidation = validateGamerTag(trimmed);
    if (!checkValidation.valid) {
      setTagStatus('idle');
      return;
    }

    setTagStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const result = await checkGamerTagAvailability(trimmed);
        if (result.status === 'available') {
          setTagStatus('available');
        } else {
          setTagStatus('claimed');
        }
      } catch {
        setTagStatus('available');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [tagInput]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedTag = tagInput.trim();
    const tagVal = validateGamerTag(trimmedTag);
    if (!tagVal.valid) {
      setErrorMsg(tagVal.error || 'Invalid GamerTag.');
      return;
    }

    const pinVal = validateSecurityPin(pinInput);
    if (!pinVal.valid) {
      setErrorMsg(pinVal.error || 'Invalid PIN.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (tagStatus === 'available') {
        // Register new tag
        const res = await registerPlayerAccount(trimmedTag, pinInput);
        if (res.success && res.profile) {
          saveActivePilotProfile(res.profile);
          setCurrentProfile(res.profile);
          onProfileUpdated(res.profile);
          setSuccessMsg(`GamerTag "${res.profile.tag}" successfully locked & registered!`);
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setErrorMsg(res.error || 'Failed to register GamerTag.');
        }
      } else {
        // Authenticate existing claimed tag
        const res = await authenticatePlayerAccount(trimmedTag, pinInput);
        if (res.success && res.profile) {
          saveActivePilotProfile(res.profile);
          setCurrentProfile(res.profile);
          onProfileUpdated(res.profile);
          setSuccessMsg(`Welcome back, Pilot ${res.profile.tag}! Identity verified.`);
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setErrorMsg(res.error || 'Incorrect PIN for this claimed GamerTag.');
        }
      }
    } catch (err) {
      setErrorMsg('Network error verifying GamerTag. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    clearActivePilotProfile();
    setCurrentProfile(null);
    setTagInput('');
    setPinInput('');
    setTagStatus('idle');
    onProfileUpdated(null);
    setSuccessMsg('Logged out. You are now playing as Guest.');
  };

  return (
    <div className="gt-modal-backdrop" onClick={onClose}>
      <div className="gt-modal-panel" onClick={(e) => e.stopPropagation()}>
        <button className="gt-modal-close" onClick={onClose} type="button" aria-label="Close Modal">
          <X size={18} />
        </button>

        <div className="gt-modal-header">
          <div className="gt-modal-icon-badge">
            <Lock size={20} />
          </div>
          <div className="gt-header-text">
            <div className="gt-kicker">PILOT CALLSIGN PROTOCOL</div>
            <h2 className="gt-title">CLAIM &amp; LOCK GAMERTAG</h2>
          </div>
        </div>

        <p className="gt-desc">
          Lock your unique GamerTag with a 4-digit PIN so no one else can steal your identity or claim your scores on the global leaderboard.
        </p>

        {/* Current Active Pilot Card */}
        {currentProfile && (
          <div className="gt-active-card">
            <div className="gt-active-left">
              <ShieldCheck size={16} className="text-gold" />
              <div>
                <span className="gt-active-label">CURRENT ACTIVE CALLSIGN</span>
                <p className="gt-active-name">{currentProfile.tag}</p>
              </div>
            </div>
            <button type="button" onClick={handleLogout} className="gt-logout-btn">
              <LogOut size={12} />
              <span>LOGOUT</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="gt-form">
          {/* GamerTag Input */}
          <div className="gt-input-group">
            <label className="gt-label">
              <span>GAMERTAG / CALLSIGN</span>
              <span className="gt-label-hint">3-16 characters (letters, numbers, _)</span>
            </label>
            <div className="gt-input-wrap">
              <User size={15} className="gt-input-icon" />
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="e.g. ShadowSniper"
                maxLength={16}
                className="gt-input"
                autoFocus
              />
              {tagStatus === 'checking' && <span className="gt-status-badge checking">CHECKING...</span>}
              {tagStatus === 'available' && <span className="gt-status-badge available"><Check size={11} /> AVAILABLE</span>}
              {tagStatus === 'claimed' && <span className="gt-status-badge claimed"><Lock size={11} /> CLAIMED</span>}
            </div>
          </div>

          {/* Security PIN Input */}
          <div className="gt-input-group">
            <label className="gt-label">
              <span>{tagStatus === 'claimed' ? 'ENTER 4-DIGIT PIN TO VERIFY' : 'CREATE 4-DIGIT SECURITY PIN'}</span>
              <span className="gt-label-hint">Numeric only (0-9)</span>
            </label>
            <div className="gt-input-wrap">
              <KeyRound size={15} className="gt-input-icon" />
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="••••"
                maxLength={6}
                className="gt-input gt-pin-input"
              />
            </div>
            <p className="gt-pin-hint">
              {tagStatus === 'claimed'
                ? '🔒 This tag is already registered. Enter the owner PIN to log into this device.'
                : '🛡️ Set a 4-digit PIN to lock this tag. Only you can log into this tag on other browsers.'}
            </p>
          </div>

          {/* Error & Success Alerts */}
          {errorMsg && (
            <div className="gt-alert gt-alert-error">
              <ShieldAlert size={15} />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="gt-alert gt-alert-success">
              <ShieldCheck size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="gt-btn-row">
            <button
              type="submit"
              disabled={isSubmitting || !tagInput.trim() || pinInput.length < 4}
              className="game-btn-primary gt-submit-btn"
            >
              <span>{tagStatus === 'claimed' ? 'VERIFY & LOG IN' : 'LOCK & CLAIM TAG'}</span>
              <ArrowRight size={14} />
            </button>
            <button type="button" onClick={onClose} className="game-btn-secondary gt-cancel-btn">
              PLAY AS GUEST
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


import { useState } from 'react';
import { Check, Copy, MessageCircle, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  subCount: number | null;
  highScore?: number;
}

export function ShareCardModal({ isOpen, onClose, subCount, highScore }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentCount = subCount ?? 116;
  const remaining = Math.max(0, 500 - currentCount);

  const shareText = highScore
    ? `🔥 I just scored ${highScore} pts on the Rustyy 500 Quest arcade! Help @the_rustyy reach 500 subs (${remaining} to go) to unlock the secret creator reveal:`
    : `⚔️ Join the quest! Help @the_rustyy reach 500 YouTube subscribers (${remaining} to go) and unlock the classified reveal:`;

  const shareUrl = window.location.origin;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'RUSTYY — The 500 Quest',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // user canceled
      }
    } else {
      handleCopy();
    }
  };

  const tweetIntent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
  const whatsappIntent = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;

  return (
    <div className="video-modal-backdrop" onClick={onClose}>
      <div className="share-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="share-modal-header">
          <div className="share-modal-title">
            <Share2 size={18} className="icon-gold" />
            <span>RALLY THE COMMUNITY</span>
          </div>
          <button className="vm-icon-btn" onClick={onClose} type="button">✕</button>
        </div>

        <div className="share-preview-box">
          <div className="spb-tag">TRANSMISSION PREVIEW</div>
          <p className="spb-text">"{shareText}"</p>
          <div className="spb-meta">
            <span>TARGET: 500 SUBS</span>
            <span>STATUS: {currentCount} JOINED</span>
          </div>
        </div>

        <div className="share-actions-grid">
          <a
            href={whatsappIntent}
            target="_blank"
            rel="noreferrer"
            className="share-btn share-whatsapp"
          >
            <MessageCircle size={16} />
            <span>SHARE ON WHATSAPP</span>
          </a>

          <a
            href={tweetIntent}
            target="_blank"
            rel="noreferrer"
            className="share-btn share-twitter"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>POST ON X (TWITTER)</span>
          </a>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="share-btn share-native"
              type="button"
            >
              <Share2 size={16} />
              <span>SYSTEM SHARE</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className={`share-btn share-copy ${copied ? 'share-copied' : ''}`}
            type="button"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'LINK & TEXT COPIED!' : 'COPY INVITATION LINK'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

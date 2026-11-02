import { useEffect, useState } from 'react';
import { Check, Copy, MessageCircle, MessageSquare, Share2 } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  subCount: number | null;
  highScore?: number;
}

/**
 * Robust clipboard copy with fallback to hidden textarea for non-secure contexts
 * or browsers with restrictive permissions.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back to execCommand below
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}

export function ShareCardModal({ isOpen, onClose, subCount, highScore }: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentCount = subCount ?? 116;
  const remaining = Math.max(0, 500 - currentCount);

  // Clean, direct site invitation URL
  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`.replace(/\/+$/, '') || window.location.href
    : 'https://youtube.com/@the_rustyy';

  const shareText = highScore
    ? `🔥 I just scored ${highScore} pts on the Rustyy 500 Quest arcade! Help @the_rustyy reach 500 subs (${remaining} to go) to unlock the secret creator reveal:`
    : `⚔️ Join the quest! Help @the_rustyy reach 500 YouTube subscribers (${remaining} to go) and unlock the classified reveal:`;

  // Copies ONLY the clean invitation link URL
  const handleCopyLink = async () => {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Copies the full message + invitation URL
  const handleCopyMessage = async () => {
    const fullText = `${shareText} ${shareUrl}`;
    const ok = await copyToClipboard(fullText);
    if (ok) {
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2500);
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
      await handleCopyLink();
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

        {/* Transmission text preview */}
        <div className="share-preview-box">
          <div className="spb-tag">TRANSMISSION PREVIEW</div>
          <p className="spb-text">"{shareText}"</p>
          <div className="spb-meta">
            <span>TARGET: 500 SUBS</span>
            <span>STATUS: {currentCount} JOINED</span>
          </div>
        </div>

        {/* Explicit Visible Invitation Link */}
        <div className="share-link-input-row">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="share-link-input"
            onClick={(e) => (e.target as HTMLInputElement).select()}
            aria-label="Invitation Link URL"
          />
          <button
            type="button"
            className={`share-input-copy-btn ${copiedLink ? 'share-copied' : ''}`}
            onClick={handleCopyLink}
            title="Copy invitation link"
          >
            {copiedLink ? <Check size={13} /> : <Copy size={13} />}
            <span>{copiedLink ? 'COPIED!' : 'COPY LINK'}</span>
          </button>
        </div>

        {/* Share buttons */}
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
            onClick={handleCopyLink}
            className={`share-btn share-copy ${copiedLink ? 'share-copied' : ''}`}
            type="button"
          >
            {copiedLink ? <Check size={16} /> : <Copy size={16} />}
            <span>{copiedLink ? 'INVITATION LINK COPIED!' : 'COPY INVITATION LINK'}</span>
          </button>

          <button
            onClick={handleCopyMessage}
            className={`share-btn share-copy-msg ${copiedMsg ? 'share-copied' : ''}`}
            type="button"
          >
            {copiedMsg ? <Check size={16} /> : <MessageSquare size={16} />}
            <span>{copiedMsg ? 'MESSAGE & LINK COPIED!' : 'COPY FULL MESSAGE + LINK'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

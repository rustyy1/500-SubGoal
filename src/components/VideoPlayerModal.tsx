import { ExternalLink, Film, Maximize2, Shuffle, X } from 'lucide-react';
import type { ChannelVideo } from '../lib/types';

interface VideoPlayerModalProps {
  video: ChannelVideo | null;
  allVideos: ChannelVideo[];
  onSelectVideo: (video: ChannelVideo) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function FloatingVideoBar({
  video,
  onOpenModal,
  onShuffle,
}: {
  video: ChannelVideo | null;
  onOpenModal: () => void;
  onShuffle: () => void;
}) {
  if (!video) return null;

  return (
    <div className="floating-video-bar">
      <div className="fvb-thumbnail-wrap" onClick={onOpenModal}>
        <img src={video.thumbnail} alt={video.title} className="fvb-thumb" />
        <div className="fvb-play-overlay">
          <Film size={14} />
        </div>
      </div>
      <div className="fvb-meta" onClick={onOpenModal}>
        <div className="fvb-badge">
          <span className="live-dot" /> NOW PLAYING FROM CHANNEL
        </div>
        <p className="fvb-title" title={video.title}>{video.title}</p>
      </div>
      <div className="fvb-actions">
        <button
          className="fvb-btn"
          onClick={onShuffle}
          title="Play another random video from @the_rustyy"
          type="button"
        >
          <Shuffle size={13} />
          <span className="fvb-btn-text">SHUFFLE</span>
        </button>
        <button
          className="fvb-btn fvb-btn-gold"
          onClick={onOpenModal}
          title="Expand video player"
          type="button"
        >
          <Maximize2 size={13} />
          <span className="fvb-btn-text">EXPAND</span>
        </button>
      </div>
    </div>
  );
}

export function ChannelVideoModal({
  video,
  allVideos,
  onSelectVideo,
  isOpen,
  onClose,
}: VideoPlayerModalProps) {
  if (!isOpen || !video) return null;

  return (
    <div className="video-modal-backdrop" onClick={onClose}>
      <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="video-modal-header">
          <div className="vm-title-wrap">
            <span className="vm-tag">OFFICIAL BROADCAST</span>
            <h3 className="vm-title">{video.title}</h3>
          </div>
          <div className="vm-actions">
            <a
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noreferrer"
              className="vm-icon-btn"
              title="Open directly on YouTube"
            >
              <ExternalLink size={16} />
            </a>
            <button
              className="vm-icon-btn"
              onClick={onClose}
              title="Close player"
              type="button"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Responsive YouTube Iframe with autoplay=1 */}
        <div className="video-iframe-container">
          <iframe
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="video-iframe"
          />
        </div>

        {/* Playlist Selector Grid */}
        <div className="video-modal-playlist">
          <div className="playlist-heading">
            <span>MORE ADVENTURES FROM RUSTYY</span>
            <span className="playlist-count">
              {allVideos.filter((v) => v.id !== video.id).length} OTHER EPISODES
            </span>
          </div>
          <div className="playlist-grid">
            {allVideos
              .filter((item) => item.id !== video.id)
              .map((item) => (
                <div
                  key={item.id}
                  className="playlist-item"
                  onClick={() => onSelectVideo(item)}
                >
                  <div className="playlist-thumb-wrap">
                    <img src={item.thumbnail} alt={item.title} />
                    {item.isLive && <span className="live-stream-badge">LIVE</span>}
                  </div>
                  <p className="playlist-item-title">{item.title}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}

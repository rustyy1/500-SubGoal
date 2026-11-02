export type Phase = 'mission' | 'celebration' | 'thanks';

export interface ChannelVideo {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt?: string;
  isLive?: boolean;
}

export interface SubscriberResponse {
  configured: boolean;
  handle?: string;
  channelId?: string;
  channelTitle?: string;
  channelUrl?: string;
  subscriberCount: number | null;
  hiddenSubscriberCount?: boolean;
  updatedAt?: string;
  message?: string | null;
  error?: string;
  videos?: ChannelVideo[];
  featuredVideo?: ChannelVideo;
  isLiveNow?: boolean;
  liveVideo?: ChannelVideo | null;
}

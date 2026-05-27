export interface LyricLine {
  type?: 'section';
  label?: string;
  text?: string;
  full?: string;
  annotations?: Array<{ from: number; to: number; id: string }>;
}

export interface Annotation {
  id?: string;
  quote: string;
  body: string;
  author: string;
  avatar: string;
  upvotes: number;
  /** Character offsets into the rawLyrics string (text lines joined with \n) */
  start_idx?: number;
  end_idx?: number;
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  year: number;
  duration: string;
  cover: string;
  annotationCount: number;
  reads: string;
  lyrics?: LyricLine[];
  annotations?: Record<string, Annotation>;
}

export interface Artist {
  id: string;
  name: string;
  bio: string;
  followers: string;
  monthly: string;
  cover: string;
  topSongs: string[];
}

export interface CommunityEntry {
  author: string;
  avatar: string;
  action: string;
  song: string;
  line: string;
  time: string;
  upvotes: number;
}

const encodeMediaKey = (key: string): string => (
  key
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/')
);

export const localMusicUrl = (key: string): string => `/Data/music/${encodeMediaKey(key)}`;

export const localVideoUrl = (key: string): string => `/Data/videos/${encodeMediaKey(key)}`;

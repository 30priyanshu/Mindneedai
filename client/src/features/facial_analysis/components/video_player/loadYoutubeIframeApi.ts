import { YOUTUBE_API_LOAD_TIMEOUT_MS } from './constants';

/** Single responsibility: ensure youtube.com/iframe_api is loaded. */
export const loadYoutubeIframeApi = (): Promise<boolean> => {
  if (window.YT?.Player) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const existing = document.getElementById('youtube-iframe-api');
    if (existing && window.YT?.Player) {
      resolve(true);
      return;
    }

    if (!existing) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.id = 'youtube-iframe-api';
      tag.async = true;
      tag.onerror = () => resolve(false);
      document.body.appendChild(tag);
    }

    const timeout = window.setTimeout(() => resolve(!!window.YT?.Player), YOUTUBE_API_LOAD_TIMEOUT_MS);

    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeout);
      resolve(true);
    };
  });
};

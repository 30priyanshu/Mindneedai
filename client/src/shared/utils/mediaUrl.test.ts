import { describe, expect, it } from 'vitest';
import { localMusicUrl, localVideoUrl } from './mediaUrl';

describe('mediaUrl', () => {
  it('encodes media key segments without changing the mount path', () => {
    expect(localMusicUrl('Happy/Film(chosic.com).mp3')).toBe(
      '/Data/music/Happy/Film(chosic.com).mp3',
    );
    expect(localVideoUrl('Happy/gentle flow.mp4')).toBe(
      '/Data/videos/Happy/gentle%20flow.mp4',
    );
  });
});

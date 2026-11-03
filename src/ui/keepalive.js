import { silentWavUri } from '../shared-audio.js';

// Garde la lecture active écran verrouillé : boucle silencieuse, commandes de l'écran de verrouillage,
// et (en option) écran allumé. À démarrer depuis un clic pour que le navigateur l'autorise.
export function createKeeper() {
  let silent = null;
  let lock = null;
  let wantAwake = false;
  const ms = typeof navigator !== 'undefined' && 'mediaSession' in navigator ? navigator.mediaSession : null;

  async function requestLock() {
    if (!wantAwake || lock || !('wakeLock' in navigator)) return;
    try {
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener('release', () => { lock = null; });
    } catch { lock = null; }
  }
  const onVisible = () => { if (document.visibilityState === 'visible') requestLock(); };

  return {
    start({ awake = false, onPlay, onPause, onNext, onPrev } = {}) {
      if (!silent) {
        silent = new Audio(silentWavUri());
        silent.loop = true;
        silent.volume = 0.01;
      }
      silent.play().catch(() => {});
      if (ms) {
        const set = (a, f) => { try { ms.setActionHandler(a, f); } catch { /* action non gérée */ } };
        set('play', onPlay); set('pause', onPause); set('nexttrack', onNext); set('previoustrack', onPrev);
        ms.playbackState = 'playing';
      }
      wantAwake = awake;
      document.addEventListener('visibilitychange', onVisible);
      requestLock();
    },
    meta(title, artist) {
      if (ms && typeof MediaMetadata === 'function') ms.metadata = new MediaMetadata({ title, artist, album: 'Speak Up' });
    },
    state(playing) {
      if (ms) ms.playbackState = playing ? 'playing' : 'paused';
      if (silent) { if (playing) silent.play().catch(() => {}); else silent.pause(); }
    },
    stop() {
      if (silent) silent.pause();
      if (ms) {
        ms.playbackState = 'none';
        for (const a of ['play', 'pause', 'nexttrack', 'previoustrack']) { try { ms.setActionHandler(a, null); } catch { /* ignoré */ } }
      }
      document.removeEventListener('visibilitychange', onVisible);
      wantAwake = false;
      if (lock) { lock.release().catch(() => {}); lock = null; }
    },
  };
}

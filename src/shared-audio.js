// Un seul élément <audio> réutilisé pour tous les clips : sur téléphone, c'est lui qui garde
// la lecture vivante écran verrouillé (un nouvel Audio() lancé en arrière-plan est souvent refusé).
export function createSharedPlayer(el) {
  return function makeAudio(src) {
    const listeners = [];
    const detach = () => { for (const [t, f] of listeners.splice(0)) el.removeEventListener(t, f); };
    const proxy = {
      playbackRate: 1,
      async play() { el.src = src; el.playbackRate = proxy.playbackRate; return el.play(); },
      pause() { detach(); try { el.pause(); } catch { /* ignoré */ } },
      addEventListener(type, fn) {
        const wrapped = (e) => { detach(); fn(e); };
        listeners.push([type, wrapped]);
        el.addEventListener(type, wrapped);
      },
    };
    return proxy;
  };
}

// Une seconde de silence en WAV 8 bits, pour garder une lecture active pendant les pauses.
export function silentWavUri() {
  const rate = 8000; const n = rate;
  const b = new Uint8Array(44 + n);
  const dv = new DataView(b.buffer);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) b[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n, true); w(8, 'WAVEfmt ');
  dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true);
  w(36, 'data'); dv.setUint32(40, n, true); b.fill(128, 44);
  let s = ''; for (const x of b) s += String.fromCharCode(x);
  return `data:audio/wav;base64,${btoa(s)}`;
}

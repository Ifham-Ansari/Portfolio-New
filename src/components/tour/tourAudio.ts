/*
 * Sound for the helicopter tour — everything is synthesized live with the Web Audio API
 * (no audio files to download or license).
 *
 *  - Rotor: band-passed noise + a low thump, both "chopped" at the blade-pass rate, plus a turbine whine.
 *    Volume and chop speed follow the rotor speed every frame.
 *  - Effects: take-off, touchdown, landing chime, in-range ping, wall bump, crash, lift doors / ding / hum,
 *    footsteps (gravel or tile), screen power-on, presentation chime.
 *  - Music: a calm generative loop (pads, arpeggio, bass, soft beat). Underground it is muffled and
 *    a server-room hum fades in.
 *
 * All output goes through one master gain, so muting is a single fade.
 */

export type Sfx =
  | "takeoff" | "touchdown" | "landed" | "ping" | "bump"
  | "doorOpen" | "doorClose" | "ding" | "step" | "stepTile"
  | "screenOn" | "chime" | "click" | "crash";

export type TourAudio = {
  /** Resume the audio context (call from a user gesture — browsers block sound until then). */
  resume: () => void;
  setEnabled: (on: boolean) => void;
  /** Per-frame state: rotor speed (0–1.3), boost held, camera underground, lift moving (0–1). */
  update: (state: { rotor: number; boost: boolean; underground: boolean; lift: number }) => void;
  play: (name: Sfx) => void;
  dispose: () => void;
};

const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** A chord per bar (MIDI notes): Dm9 → B♭maj7 → Fmaj7/A → Cadd9. */
const CHORDS = [
  [50, 53, 57, 60, 64],
  [46, 50, 53, 57, 62],
  [45, 53, 57, 60, 64],
  [48, 52, 55, 62, 67],
];
const TEMPO = 76;                  // beats per minute
const EIGHTH = 60 / TEMPO / 2;     // seconds per eighth note
const ARP = [0, 2, 1, 3, 4, 3, 1, 2]; // index into the chord for each eighth of the bar

export function createTourAudio(startEnabled: boolean): TourAudio | null {
  const AudioCtor = typeof window === "undefined"
    ? undefined
    : window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  let ctx: AudioContext;
  try { ctx = new AudioCtor(); } catch { return null; }

  const now = () => ctx.currentTime;
  const ramp = (param: AudioParam, value: number, time = 0.08) => param.setTargetAtTime(value, now(), time);

  // --- Buses ---------------------------------------------------------------------------------------
  const master = ctx.createGain();
  master.gain.value = 0;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -12; limiter.ratio.value = 6; limiter.attack.value = 0.003; limiter.release.value = 0.25;
  master.connect(limiter).connect(ctx.destination);

  // Short generated room reverb, used for footsteps and lift sounds, and more of it on the music underground.
  const reverb = ctx.createConvolver();
  {
    const length = Math.floor(ctx.sampleRate * 1.8);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6);
    }
    reverb.buffer = impulse;
  }
  const reverbOut = ctx.createGain();
  reverbOut.gain.value = 0.55;
  reverb.connect(reverbOut).connect(master);

  const sfxBus = ctx.createGain();
  sfxBus.gain.value = 0.7;
  sfxBus.connect(master);
  const sfxVerb = ctx.createGain();
  sfxVerb.gain.value = 0.18;
  sfxBus.connect(sfxVerb).connect(reverb);

  const musicBus = ctx.createGain();
  musicBus.gain.value = 0;
  const musicFilter = ctx.createBiquadFilter();
  musicFilter.type = "lowpass"; musicFilter.frequency.value = 16000; musicFilter.Q.value = 0.5;
  musicBus.connect(musicFilter).connect(master);
  const musicVerb = ctx.createGain();
  musicVerb.gain.value = 0.12;
  musicFilter.connect(musicVerb).connect(reverb);

  // Shared white-noise buffer.
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  {
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const noise = (loop = false) => { const n = ctx.createBufferSource(); n.buffer = noiseBuffer; n.loop = loop; return n; };

  // --- Rotor (continuous) ------------------------------------------------------------------------------
  const rotorOut = ctx.createGain();
  rotorOut.gain.value = 0;
  const rotorTone = ctx.createBiquadFilter(); // muffles the engine when the camera is underground
  rotorTone.type = "lowpass"; rotorTone.frequency.value = 5000;
  rotorOut.connect(rotorTone).connect(master);

  const chop = ctx.createOscillator();      // blade-pass "wop wop" modulator
  chop.type = "sine"; chop.frequency.value = 2;
  const chopDepth = ctx.createGain();
  chopDepth.gain.value = 0.45;
  chop.connect(chopDepth);

  const wash = noise(true);
  const washBand = ctx.createBiquadFilter();
  washBand.type = "bandpass"; washBand.frequency.value = 420; washBand.Q.value = 0.7;
  const washGain = ctx.createGain();
  washGain.gain.value = 0.55;
  chopDepth.connect(washGain.gain);
  wash.connect(washBand).connect(washGain).connect(rotorOut);

  const thump = ctx.createOscillator();
  thump.type = "sine"; thump.frequency.value = 55;
  const thumpGain = ctx.createGain();
  thumpGain.gain.value = 0.5;
  chopDepth.connect(thumpGain.gain);
  thump.connect(thumpGain).connect(rotorOut);

  const whine = ctx.createOscillator();
  whine.type = "sawtooth"; whine.frequency.value = 600;
  const whineHp = ctx.createBiquadFilter();
  whineHp.type = "highpass"; whineHp.frequency.value = 1400;
  const whineGain = ctx.createGain();
  whineGain.gain.value = 0.0;
  whine.connect(whineHp).connect(whineGain).connect(rotorOut);

  // --- Lift hum and underground room tone (continuous) -----------------------------------------------
  const liftGain = ctx.createGain();
  liftGain.gain.value = 0;
  const liftLp = ctx.createBiquadFilter();
  liftLp.type = "lowpass"; liftLp.frequency.value = 320;
  const liftOsc = ctx.createOscillator();
  liftOsc.type = "sawtooth"; liftOsc.frequency.value = 58;
  const liftOsc2 = ctx.createOscillator();
  liftOsc2.type = "square"; liftOsc2.frequency.value = 87;
  const liftOsc2Gain = ctx.createGain();
  liftOsc2Gain.gain.value = 0.25;
  liftOsc.connect(liftLp); liftOsc2.connect(liftOsc2Gain).connect(liftLp);
  liftLp.connect(liftGain).connect(master);

  const roomGain = ctx.createGain();
  roomGain.gain.value = 0;
  const room = noise(true);
  const roomLp = ctx.createBiquadFilter();
  roomLp.type = "lowpass"; roomLp.frequency.value = 180;
  const roomHum = ctx.createOscillator();
  roomHum.type = "sine"; roomHum.frequency.value = 100;
  const roomHumGain = ctx.createGain();
  roomHumGain.gain.value = 0.05;
  room.connect(roomLp).connect(roomGain);
  roomHum.connect(roomHumGain).connect(roomGain);
  roomGain.connect(master);

  [chop, wash, thump, whine, liftOsc, liftOsc2, room, roomHum].forEach(node => node.start());

  // --- One-shot helpers ---------------------------------------------------------------------------------
  /** Oscillator with a pitch glide and an attack/decay envelope. */
  const tone = (type: OscillatorType, from: number, to: number, start: number, attack: number, decay: number, gain: number, out: AudioNode = sfxBus) => {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, start + attack + decay);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
    osc.connect(env).connect(out);
    osc.start(start);
    osc.stop(start + attack + decay + 0.05);
  };
  /** Filtered noise burst, optionally sweeping the filter frequency. */
  const burst = (type: BiquadFilterType, from: number, to: number, start: number, attack: number, decay: number, gain: number, q = 1, out: AudioNode = sfxBus) => {
    const src = noise();
    const filter = ctx.createBiquadFilter();
    filter.type = type; filter.Q.value = q;
    filter.frequency.setValueAtTime(from, start);
    if (to !== from) filter.frequency.exponentialRampToValueAtTime(to, start + attack + decay);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay);
    src.connect(filter).connect(env).connect(out);
    src.start(start, Math.random() * 1.5);
    src.stop(start + attack + decay + 0.05);
  };

  const play = (name: Sfx) => {
    if (ctx.state !== "running") return;
    const t = now() + 0.01;
    switch (name) {
      case "takeoff":
        burst("bandpass", 260, 1500, t, 0.5, 1.3, 0.22, 0.9);
        tone("sawtooth", 70, 210, t, 0.4, 1.4, 0.05);
        break;
      case "touchdown":
        tone("sine", 150, 46, t, 0.005, 0.32, 0.55);
        burst("lowpass", 700, 300, t, 0.004, 0.18, 0.3);
        tone("triangle", 330, 300, t + 0.05, 0.004, 0.12, 0.04);
        break;
      case "landed":
        tone("sine", midiToHz(76), midiToHz(76), t, 0.01, 0.8, 0.13);
        tone("triangle", midiToHz(81), midiToHz(81), t + 0.14, 0.01, 1.0, 0.11);
        break;
      case "ping":
        tone("sine", 1320, 1320, t, 0.005, 0.22, 0.07);
        tone("sine", 1980, 1980, t + 0.07, 0.005, 0.22, 0.05);
        break;
      case "bump":
        tone("sine", 110, 38, t, 0.004, 0.3, 0.5);
        burst("lowpass", 500, 200, t, 0.003, 0.15, 0.35);
        break;
      case "doorOpen":
      case "doorClose": {
        const up = name === "doorOpen";
        burst("bandpass", up ? 500 : 1300, up ? 1300 : 500, t, 0.08, 0.62, 0.12, 2.2);
        tone("sine", 75, 60, t + 0.68, 0.004, 0.16, 0.28);
        break;
      }
      case "ding":
        tone("sine", 1318.5, 1318.5, t, 0.005, 1.5, 0.12);
        tone("sine", 2637, 2637, t, 0.005, 0.7, 0.04);
        tone("sine", 1046.5, 1046.5, t + 0.32, 0.005, 1.6, 0.1);
        break;
      case "step":
        burst("bandpass", 1400 + Math.random() * 700, 900, t, 0.004, 0.09, 0.13, 0.8);
        break;
      case "stepTile":
        burst("highpass", 2200 + Math.random() * 600, 2200, t, 0.002, 0.05, 0.09, 0.7);
        tone("sine", 1900 + Math.random() * 300, 1500, t, 0.002, 0.04, 0.025);
        break;
      case "screenOn":
        tone("sine", 220, 1100, t, 0.02, 0.35, 0.08);
        [0.32, 0.38, 0.44, 0.56].forEach((d, k) => tone("square", [1760, 2349, 1976, 2637][k], [1760, 2349, 1976, 2637][k], t + d, 0.002, 0.05, 0.025));
        tone("sine", 60, 60, t, 0.05, 0.6, 0.12);
        break;
      case "chime":
        [69, 73, 76, 81].forEach((m, k) => tone("triangle", midiToHz(m), midiToHz(m), t + k * 0.11, 0.01, 0.9, 0.07));
        break;
      case "click":
        tone("square", 1800, 1200, t, 0.001, 0.03, 0.03);
        break;
      case "crash":
        // Blast (noise sweeping down), a deep thump, a metallic crunch, then debris rattling down.
        burst("lowpass", 2400, 140, t, 0.008, 1.7, 0.55, 0.7);
        tone("sine", 95, 26, t, 0.004, 1.2, 0.75);
        burst("bandpass", 3400, 700, t + 0.03, 0.003, 0.45, 0.2, 3);
        tone("square", 460, 170, t + 0.06, 0.003, 0.32, 0.045);
        tone("sawtooth", 230, 90, t + 0.1, 0.003, 0.4, 0.04);
        for (let k = 0; k < 7; k++) {
          const at = t + 0.35 + k * 0.11 + Math.random() * 0.12;
          burst("highpass", 2600 + Math.random() * 2400, 1900, at, 0.002, 0.05 + Math.random() * 0.05, 0.13 - k * 0.012, 0.9);
        }
        break;
    }
  };

  // --- Music (generative, scheduled slightly ahead with a timer) -----------------------------------------
  let underground = false;
  let step = 0;
  let nextTime = now() + 0.3;
  const voice = (midi: number, start: number, length: number, gain: number) => {
    // Soft pad: two detuned saws through a gentle low-pass.
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = underground ? 650 : 1100; lp.Q.value = 0.4;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, start);
    env.gain.exponentialRampToValueAtTime(gain, start + 0.9);
    env.gain.setValueAtTime(gain, start + length - 0.4);
    env.gain.exponentialRampToValueAtTime(0.0001, start + length + 1.2);
    lp.connect(env).connect(musicBus);
    [-7, 7].forEach(cents => {
      const osc = ctx.createOscillator();
      osc.type = "sawtooth";
      osc.frequency.value = midiToHz(midi);
      osc.detune.value = cents;
      osc.connect(lp);
      osc.start(start);
      osc.stop(start + length + 1.3);
    });
  };
  const scheduleEighth = (time: number) => {
    const bar = Math.floor(step / 8) % CHORDS.length;
    const eighth = step % 8;
    const chord = CHORDS[bar];
    if (eighth === 0) chord.slice(0, 4).forEach(m => voice(m, time, EIGHTH * 8, 0.022));
    // Arpeggio an octave up (sparser underground).
    if (!underground || eighth % 2 === 0) {
      const m = chord[ARP[eighth] % chord.length] + 12;
      tone("triangle", midiToHz(m), midiToHz(m), time, 0.004, 0.45, underground ? 0.035 : 0.05, musicBus);
    }
    if (!underground) {
      // Bass on beats 1 and 3, a soft kick on 1 and 3, and a light hat on the off-beats.
      if (eighth === 0 || eighth === 4) {
        tone("sine", midiToHz(chord[0] - 12), midiToHz(chord[0] - 12), time, 0.01, 1.1, 0.12, musicBus);
        tone("sine", 110, 42, time, 0.003, 0.22, 0.16, musicBus);
      }
      if (eighth % 2 === 1) burst("highpass", 7500, 7500, time, 0.002, 0.04, 0.018, 0.7, musicBus);
    }
    step++;
  };
  const scheduler = window.setInterval(() => {
    if (ctx.state !== "running") { nextTime = now() + 0.1; return; }
    while (nextTime < now() + 0.2) { scheduleEighth(nextTime); nextTime += EIGHTH; }
  }, 50);

  // --- Public API ----------------------------------------------------------------------------------------
  let enabled = startEnabled;
  const applyEnabled = () => {
    ramp(master.gain, enabled ? 0.9 : 0, 0.15);
    ramp(musicBus.gain, enabled ? 1 : 0, 0.8);
  };
  applyEnabled();

  return {
    resume: () => { if (ctx.state === "suspended") void ctx.resume(); },
    setEnabled: on => { enabled = on; if (on && ctx.state === "suspended") void ctx.resume(); applyEnabled(); },
    update: ({ rotor, boost, underground: below, lift }) => {
      const r = Math.max(0, Math.min(1.3, rotor));
      ramp(rotorOut.gain, below ? 0.04 * r : 0.3 * Math.pow(r, 1.3), 0.12);
      ramp(chop.frequency, 1 + r * 15 * (boost ? 1.12 : 1), 0.12);
      ramp(whine.frequency, 480 + r * 820 * (boost ? 1.1 : 1), 0.2);
      ramp(whineGain.gain, 0.012 * r, 0.2);
      ramp(washBand.frequency, 360 + r * 180, 0.2);
      ramp(liftGain.gain, 0.09 * lift, 0.15);
      ramp(liftOsc.frequency, 52 + lift * 10, 0.3);
      if (below !== underground) {
        underground = below;
        ramp(musicFilter.frequency, below ? 900 : 16000, 0.6);
        ramp(musicVerb.gain, below ? 0.45 : 0.12, 0.6);
        ramp(sfxVerb.gain, below ? 0.5 : 0.18, 0.4);
        ramp(roomGain.gain, below ? 0.12 : 0, 0.8);
        ramp(rotorTone.frequency, below ? 400 : 5000, 0.4);
      }
    },
    play,
    dispose: () => {
      window.clearInterval(scheduler);
      void ctx.close();
    },
  };
}

/* ═══════════════════════════════════════════════════════════
   Paper Sunsets — audio
   Typewriter clicks, character voice blips, and a slow ambient
   bed, all synthesized with the Web Audio API. No audio files.
   ═══════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) {
    window.PaperAudio = {
      unlock() {},
      configure() {},
      type() {},
      voice() {},
      startAmbience() {},
      stopAmbience() {},
      setPageHidden() {},
      getLevel() { return 0; },
      getState() { return { supported: false }; }
    };
    return;
  }

  /* Voices are built from a pitched saw through a few formant
     filters, which reads as a small human syllable without a
     sample library. */
  const SPEAKERS = {
    Kai:   { f0: 122, formant: 0.94, gain: 1 },
    Mira:  { f0: 212, formant: 1.12, gain: 0.92 },
    Elena: { f0: 176, formant: 1.01, gain: 0.96 },
    Jun:   { f0: 150, formant: 0.98, gain: 1 }
  };

  const PRESETS = {
    hm:   { f1: 260, f2: 980,  f3: 2200, dur: 0.34, gain: 0.05,  contour: [1.02, 0.86], noise: 0.05 },
    oh:   { f1: 470, f2: 880,  f3: 2400, dur: 0.36, gain: 0.052, contour: [1.14, 0.82], noise: 0.06 },
    ah:   { f1: 780, f2: 1200, f3: 2600, dur: 0.3,  gain: 0.044, contour: [0.96, 1.18], noise: 0.07 },
    eh:   { f1: 580, f2: 1760, f3: 2500, dur: 0.24, gain: 0.039, contour: [1.04, 1.16], noise: 0.06 },
    huh:  { f1: 650, f2: 1240, f3: 2500, dur: 0.23, gain: 0.044, contour: [0.9, 1.32],  noise: 0.06 },
    urgh: { f1: 420, f2: 850,  f3: 2000, dur: 0.48, gain: 0.052, contour: [0.9, 0.7],   noise: 0.24 },
    sigh: { f1: 500, f2: 1000, f3: 2200, dur: 0.8,  gain: 0.036, contour: [0.95, 0.7],  noise: 0.8 }
  };

  const CHORDS = [
    [53, 57, 60, 64], // Fmaj7
    [45, 52, 57, 60], // Am7
    [46, 53, 57, 62], // Bbmaj7
    [48, 55, 59, 64]  // Cmaj7
  ];
  const CHORD_SECONDS = 9;
  const CHIME_NOTES = [72, 74, 77, 79, 81, 84];

  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const midi = (note) => 440 * Math.pow(2, (note - 69) / 12);

  let ctx = null;
  let master = null;
  let analyser = null;
  let levelData = null;
  let sfxBus = null;
  let voiceBus = null;
  let ambienceBus = null;
  let padFilter = null;
  let reverb = null;
  let reverbSend = null;

  let noiseBuffer = null;
  let airNodes = null;

  let volume = 0.75;
  let muted = false;
  let voicesOn = true;
  let pageHidden = false;
  let lastClickAt = 0;
  let lastVoiceAt = 0;

  let ambienceWanted = false;
  let ambienceTimer = null;
  let nextChordAt = 0;
  let nextChimeAt = 0;
  let chordIndex = 0;

  /* ───────────── Graph ───────────── */

  function isSilent() {
    return muted || pageHidden || volume <= 0.001;
  }

  function ensure() {
    if (!AudioCtor) return null;
    if (!ctx) {
      try {
        ctx = new AudioCtor({ latencyHint: "interactive" });
      } catch {
        return null;
      }
      buildGraph();
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function buildGraph() {
    const now = ctx.currentTime;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.25;

    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    levelData = new Float32Array(analyser.fftSize);

    master = ctx.createGain();
    master.gain.setValueAtTime(isSilent() ? 0 : volume, now);

    sfxBus = ctx.createGain();
    sfxBus.gain.value = 0.9;

    voiceBus = ctx.createGain();
    voiceBus.gain.value = 1;

    ambienceBus = ctx.createGain();
    ambienceBus.gain.value = 0;

    sfxBus.connect(master);
    voiceBus.connect(master);
    ambienceBus.connect(master);
    master.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(ctx.destination);

    // A small generated hall for the pad and chimes.
    reverb = ctx.createConvolver();
    reverb.buffer = makeImpulse(2.6);

    const reverbTone = ctx.createBiquadFilter();
    reverbTone.type = "lowpass";
    reverbTone.frequency.value = 2400;

    reverbSend = ctx.createGain();
    reverbSend.gain.value = 1;
    reverbSend.connect(reverbTone);
    reverbTone.connect(reverb);

    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    reverb.connect(wet);
    wet.connect(master);

    padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 1150;
    padFilter.Q.value = 0.3;
    padFilter.connect(ambienceBus);

    const padReverb = ctx.createGain();
    padReverb.gain.value = 0.4;
    padFilter.connect(padReverb);
    padReverb.connect(reverbSend);
  }

  function makeImpulse(seconds) {
    const rate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(rate * seconds));
    const impulse = ctx.createBuffer(2, length, rate);

    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        const fade = Math.pow(1 - i / length, 2.8);
        const onset = 1 - Math.exp(-i / (rate * 0.012));
        data[i] = (Math.random() * 2 - 1) * fade * onset;
      }
    }

    return impulse;
  }

  function getNoiseBuffer() {
    if (noiseBuffer) return noiseBuffer;

    const rate = ctx.sampleRate;
    const length = Math.floor(rate * 4);
    const buffer = ctx.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);

    let smoothed = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      smoothed = smoothed * 0.96 + white * 0.04;
      data[i] = smoothed * 5.5;
    }

    noiseBuffer = buffer;
    return buffer;
  }

  function panner(value) {
    if (!ctx.createStereoPanner) return null;
    const node = ctx.createStereoPanner();
    node.pan.value = clamp(value, -1, 1);
    return node;
  }

  /* ───────────── Typewriter ───────────── */

  function typewriter(chunk) {
    if (!chunk) return;

    const c = ensure();
    if (!c || muted || pageHidden) return;

    const now = c.currentTime;
    if (now - lastClickAt < 0.048) return;
    lastClickAt = now;

    const last = chunk[chunk.length - 1];
    const punctuation = /[.,!?…—]/.test(last);
    const space = /\s/.test(last);
    const strength = punctuation ? 1.15 : space ? 0.6 : 1;

    playClick(strength, punctuation ? 0.82 : 1);
  }

  function playClick(strength, tone) {
    const c = ctx;
    const t = c.currentTime;

    const source = c.createBufferSource();
    source.buffer = getNoiseBuffer();

    const band = c.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = (1500 + Math.random() * 900) * tone;
    band.Q.value = 1.5;

    const high = c.createBiquadFilter();
    high.type = "highpass";
    high.frequency.value = 620;

    const noiseGain = c.createGain();
    noiseGain.gain.setValueAtTime(0.0001, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.11 * strength, t + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.032);

    source.connect(band);
    band.connect(high);
    high.connect(noiseGain);
    noiseGain.connect(sfxBus);

    source.start(t, Math.random() * 0.5, 0.05);

    // A quiet wooden body under the tick.
    const body = c.createOscillator();
    body.type = "triangle";
    const bodyStart = 175 + Math.random() * 55;
    body.frequency.setValueAtTime(bodyStart, t);
    body.frequency.exponentialRampToValueAtTime(bodyStart * 0.62, t + 0.035);

    const bodyGain = c.createGain();
    bodyGain.gain.setValueAtTime(0.0001, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.042 * strength, t + 0.003);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    body.connect(bodyGain);
    bodyGain.connect(sfxBus);
    body.start(t);
    body.stop(t + 0.06);
  }

  /* ───────────── Voice blips ───────────── */

  function voice(preset, speakerName) {
    const presetData = PRESETS[preset];
    if (!presetData) return;

    const c = ensure();
    if (!c || muted || pageHidden || !voicesOn) return;

    const now = c.currentTime;
    if (now - lastVoiceAt < 0.12) return;
    lastVoiceAt = now;

    const speaker = SPEAKERS[speakerName] || { f0: 160, formant: 1, gain: 0.95 };
    const p = presetData;
    const formant = speaker.formant;
    const base = speaker.f0 * (0.94 + Math.random() * 0.12);
    const dur = p.dur;
    const t = now + 0.01;

    const osc = c.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(base * p.contour[0], t);
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(55, base * p.contour[1]),
      t + dur * 0.9
    );

    const vibrato = c.createOscillator();
    vibrato.frequency.value = 5 + Math.random() * 1.4;
    const vibratoDepth = c.createGain();
    vibratoDepth.gain.value = base * (preset === "urgh" ? 0.012 : 0.018);
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(osc.frequency);

    const envelope = c.createGain();
    envelope.gain.setValueAtTime(0.0001, t);
    envelope.gain.exponentialRampToValueAtTime(p.gain * speaker.gain, t + 0.028);
    envelope.gain.setValueAtTime(p.gain * speaker.gain, t + dur * 0.58);
    envelope.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    // Fade the raw oscillator in before it reaches the high-Q formant
    // filters, so the waveform's start cannot ring them into a pop.
    const sourceGain = c.createGain();
    sourceGain.gain.setValueAtTime(0.0001, t);
    sourceGain.gain.exponentialRampToValueAtTime(1, t + 0.02);
    osc.connect(sourceGain);

    const mix = c.createGain();
    mix.gain.value = 1;

    [
      [p.f1 * formant, 5.5, 1],
      [p.f2 * formant, 7.5, 0.55],
      [p.f3 * formant, 9, 0.16]
    ].forEach(([frequency, q, level]) => {
      const band = c.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = frequency;
      band.Q.value = q;

      const gain = c.createGain();
      gain.gain.value = level;

      sourceGain.connect(band);
      band.connect(gain);
      gain.connect(mix);
    });

    // A little direct low end keeps the syllable from sounding thin.
    const body = c.createBiquadFilter();
    body.type = "lowpass";
    body.frequency.value = 520 * formant;
    const bodyGain = c.createGain();
    bodyGain.gain.value = 0.28;
    sourceGain.connect(body);
    body.connect(bodyGain);
    bodyGain.connect(mix);

    const output = panner((Math.random() - 0.5) * 0.35);
    if (output) {
      mix.connect(envelope);
      envelope.connect(output);
      output.connect(voiceBus);
    } else {
      mix.connect(envelope);
      envelope.connect(voiceBus);
    }

    osc.start(t);
    osc.stop(t + dur + 0.06);
    vibrato.start(t);
    vibrato.stop(t + dur + 0.06);

    // Breath, stronger on sighs and grunts.
    if (p.noise > 0) {
      const source = c.createBufferSource();
      source.buffer = getNoiseBuffer();

      const band = c.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 950 * formant;
      band.Q.value = 0.8;

      const noiseGain = c.createGain();
      noiseGain.gain.setValueAtTime(0.0001, t);
      noiseGain.gain.setValueAtTime(0.0001, t + 0.015);
      noiseGain.gain.exponentialRampToValueAtTime(
        p.gain * p.noise * 0.9,
        t + Math.min(0.1, dur * 0.35)
      );
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

      source.connect(band);
      band.connect(noiseGain);
      noiseGain.connect(voiceBus);

      source.start(t, Math.random() * 0.4, Math.min(dur + 0.1, 1));
    }
  }

  /* ───────────── Ambience ───────────── */

  function startAmbience() {
    const c = ensure();
    if (!c) return;

    ambienceWanted = true;

    if (!airNodes) startAir();

    ambienceBus.gain.setTargetAtTime(0.5, c.currentTime, 0.9);

    if (!muted && !pageHidden) restartScheduling();
  }

  function stopAmbience() {
    ambienceWanted = false;
    stopScheduling();
    if (ctx) ambienceBus.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
  }

  function startAir() {
    const c = ctx;

    const source = c.createBufferSource();
    source.buffer = getNoiseBuffer();
    source.loop = true;

    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.2;

    const gain = c.createGain();
    gain.gain.value = 0.02;

    // Slow breathing movement in the air layer.
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.06;
    const lfoDepth = c.createGain();
    lfoDepth.gain.value = 0.007;
    lfo.connect(lfoDepth);
    lfoDepth.connect(gain.gain);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ambienceBus);

    const airSend = c.createGain();
    airSend.gain.value = 0.18;
    gain.connect(airSend);
    airSend.connect(reverbSend);

    // A soft low drone underneath everything.
    const drone = c.createOscillator();
    drone.type = "sine";
    drone.frequency.value = midi(41); // F2

    const droneGain = c.createGain();
    droneGain.gain.value = 0.012;

    const droneLfo = c.createOscillator();
    droneLfo.frequency.value = 0.045;
    const droneDepth = c.createGain();
    droneDepth.gain.value = 0.005;
    droneLfo.connect(droneDepth);
    droneDepth.connect(droneGain.gain);

    const droneSend = c.createGain();
    droneSend.gain.value = 0.25;
    drone.connect(droneGain);
    droneGain.connect(ambienceBus);
    droneGain.connect(droneSend);
    droneSend.connect(reverbSend);

    source.start();
    lfo.start();
    drone.start();
    droneLfo.start();

    airNodes = { source, lfo, drone, droneLfo };
  }

  function restartScheduling() {
    if (!ctx || ambienceTimer || muted || pageHidden || !ambienceWanted) return;

    nextChordAt = ctx.currentTime + 0.4;
    nextChimeAt = ctx.currentTime + 6 + Math.random() * 3;
    ambienceTimer = setInterval(scheduleAmbience, 700);
    scheduleAmbience();
  }

  function stopScheduling() {
    if (ambienceTimer) {
      clearInterval(ambienceTimer);
      ambienceTimer = null;
    }
    nextChordAt = 0;
    nextChimeAt = 0;
  }

  function scheduleAmbience() {
    if (!ctx || muted || pageHidden || !ambienceWanted) return;

    const now = ctx.currentTime;

    if (!nextChordAt) nextChordAt = now + 0.4;
    let chordGuard = 0;
    while (nextChordAt < now + 4 && chordGuard < 8) {
      playChord(nextChordAt);
      nextChordAt += CHORD_SECONDS;
      chordGuard += 1;
    }

    if (!nextChimeAt) nextChimeAt = now + 7;
    let chimeGuard = 0;
    while (nextChimeAt < now + 3 && chimeGuard < 4) {
      playChime(nextChimeAt);
      nextChimeAt += 7 + Math.random() * 8;
      chimeGuard += 1;
    }
  }

  function playChord(when) {
    const c = ctx;
    const chord = CHORDS[chordIndex % CHORDS.length];
    chordIndex += 1;

    const duration = CHORD_SECONDS + 1.2;

    chord.forEach((note, index) => {
      const frequency = midi(note);
      const isBass = index === 0;
      const peak = (isBass ? 0.03 : 0.021) / Math.sqrt(chord.length);

      const envelope = c.createGain();
      envelope.gain.setValueAtTime(0.0001, when);
      envelope.gain.exponentialRampToValueAtTime(peak, when + 2.5);
      envelope.gain.setValueAtTime(peak, when + 6.8);
      envelope.gain.exponentialRampToValueAtTime(0.0001, when + duration);

      const pan = isBass ? null : panner((index / (chord.length - 1) - 0.5) * 0.5);
      if (pan) {
        envelope.connect(pan);
        pan.connect(padFilter);
      } else {
        envelope.connect(padFilter);
      }

      const voices = isBass
        ? [{ type: "sine", detune: 0, level: 1 }]
        : [
            { type: "triangle", detune: -5, level: 0.5 },
            { type: "triangle", detune: 5, level: 0.5 }
          ];

      voices.forEach(({ type, detune, level }) => {
        const osc = c.createOscillator();
        osc.type = type;
        osc.frequency.value = frequency;
        osc.detune.value = detune;

        const voiceGain = c.createGain();
        voiceGain.gain.value = level;

        osc.connect(voiceGain);
        voiceGain.connect(envelope);
        osc.start(when);
        osc.stop(when + duration + 0.1);
      });
    });
  }

  function playChime(when) {
    const c = ctx;
    const note = CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)];
    const frequency = midi(note);
    const pan = panner((Math.random() - 0.5) * 0.7);

    const output = pan || c.createGain();

    [
      { mult: 1, level: 0.014, type: "sine" },
      { mult: 2.01, level: 0.0045, type: "sine" },
      { mult: 3.02, level: 0.0018, type: "triangle" }
    ].forEach(({ mult, level, type }) => {
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.value = frequency * mult;

      const gain = c.createGain();
      gain.gain.setValueAtTime(0.0001, when);
      gain.gain.exponentialRampToValueAtTime(level, when + 0.014);
      gain.gain.exponentialRampToValueAtTime(0.0001, when + 3.4);

      osc.connect(gain);
      gain.connect(output);
      osc.start(when);
      osc.stop(when + 3.6);
    });

    output.connect(ambienceBus);

    const send = c.createGain();
    send.gain.value = 0.55;
    output.connect(send);
    send.connect(reverbSend);
  }

  /* ───────────── Public controls ───────────── */

  function configure(next = {}) {
    if (typeof next.volume === "number") {
      volume = clamp(next.volume, 0, 1);
    }
    if (typeof next.muted === "boolean") {
      muted = next.muted;
    }
    if (typeof next.voices === "boolean") {
      voicesOn = next.voices;
    }

    if (!ctx) return;

    master.gain.setTargetAtTime(isSilent() ? 0 : volume, ctx.currentTime, 0.07);

    if (muted) {
      stopScheduling();
    } else if (ambienceWanted) {
      restartScheduling();
    }
  }

  function setPageHidden(hidden) {
    pageHidden = Boolean(hidden);
    if (!ctx) return;

    master.gain.setTargetAtTime(isSilent() ? 0 : volume, ctx.currentTime, 0.08);

    if (pageHidden) {
      stopScheduling();
    } else if (ambienceWanted) {
      restartScheduling();
    }
  }

  function getLevel() {
    if (!analyser || !levelData) return 0;
    analyser.getFloatTimeDomainData(levelData);

    let sum = 0;
    for (let i = 0; i < levelData.length; i += 1) {
      sum += levelData[i] * levelData[i];
    }

    return Math.sqrt(sum / levelData.length);
  }

  function getState() {
    return {
      supported: true,
      state: ctx ? ctx.state : "idle",
      volume,
      muted,
      voices: voicesOn,
      ambience: ambienceWanted,
      level: getLevel()
    };
  }

  window.PaperAudio = {
    unlock: ensure,
    configure,
    type: typewriter,
    voice,
    startAmbience,
    stopAmbience,
    setPageHidden,
    getLevel,
    getState
  };
})();

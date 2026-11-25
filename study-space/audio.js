globalThis.studyAudio = (() => {
  let context;
  let musicGain;
  let musicInterval;
  let nextNote;
  let beat;
  const playingNotes = new Set();
  const layers = new Map();

  const eveningChords = [[48, 51, 55, 58], [44, 48, 51, 55], [46, 50, 53, 57], [43, 47, 50, 53]];
  const tracks = {
    lofi: { tempo: .43, wave: "sine", decay: .75, chords: eveningChords, melody: [0, 2, 1, 3, 2, 1, 3, 2] },
    piano: { tempo: .37, wave: "triangle", decay: .75, chords: eveningChords, melody: [0, 2, 1, 3, 2, 1, 3, 2] },
    coffee: {
      tempo: .31, swing: .22, wave: "triangle", decay: .48,
      chords: [[50, 53, 57, 60], [43, 47, 50, 53], [48, 52, 55, 59], [45, 49, 52, 55]],
      melody: [1, null, 3, 2, null, 1, 2, 3],
    },
    library: {
      tempo: .38, wave: "sine", decay: 1.25,
      chords: [[45, 48, 52, 55], [41, 45, 48, 52], [48, 52, 55, 59], [43, 47, 50, 57]],
      melody: [0, 1, 2, 3, 2, 1, 3, 2],
    },
    snow: {
      tempo: .62, wave: "sine", attack: .5, decay: 2.5,
      chords: [[50, 54, 57, 64], [47, 50, 54, 61], [43, 47, 50, 57], [45, 50, 52, 59]],
      melody: [2, null, null, 3, null, 1, null, null],
    },
  };
  const frequency = (midi) => 440 * 2 ** ((midi - 69) / 12);

  async function audioContext() {
    context ??= new AudioContext();
    await context.resume();
    return context;
  }

  function note(midi, time, strength, track) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = track.wave;
    oscillator.frequency.value = frequency(midi);
    envelope.gain.setValueAtTime(0, time);
    envelope.gain.linearRampToValueAtTime(strength, time + (track.attack ?? .045));
    envelope.gain.exponentialRampToValueAtTime(.0001, time + track.decay);
    oscillator.connect(envelope).connect(musicGain);
    oscillator.start(time);
    oscillator.stop(time + track.decay + .05);
    playingNotes.add(oscillator);
    oscillator.onended = () => {
      playingNotes.delete(oscillator);
      oscillator.disconnect();
      envelope.disconnect();
    };
  }

  function stopMusic() {
    clearInterval(musicInterval);
    for (const oscillator of playingNotes) oscillator.stop();
  }

  async function startMusic(instrument, volume) {
    await audioContext();
    stopMusic();
    if (!musicGain) musicGain = context.createGain(), musicGain.connect(context.destination);
    setMusicVolume(volume);
    const track = tracks[instrument] ?? tracks.lofi;
    beat = 0;
    nextNote = context.currentTime + .03;
    function schedule() {
      nextNote = Math.max(nextNote, context.currentTime);
      while (nextNote < context.currentTime + .12) {
        const position = beat % track.melody.length;
        const chord = track.chords[Math.floor(beat / track.melody.length) % track.chords.length];
        if (beat % 4 === 0) note(chord[0] - 12, nextNote, .13, track);
        const tone = track.melody[position];
        if (tone !== null) note(chord[tone] + 12, nextNote, .11, track);
        nextNote += track.tempo * (1 + (track.swing ?? 0) * (beat % 2 === 0 ? 1 : -1));
        beat++;
      }
    }
    schedule();
    musicInterval = setInterval(schedule, 35);
  }

  function setMusicVolume(volume) {
    musicGain?.gain.setTargetAtTime(volume / 100, context.currentTime, .04);
  }

  async function setAmbient(name, enabled, volume) {
    if (!enabled) {
      const layer = layers.get(name);
      if (layer) {
        layer.gain.gain.setTargetAtTime(0, context.currentTime, .04);
        layer.source.stop(context.currentTime + .25);
        layers.delete(name);
      }
      return;
    }
    await audioContext();
    if (!layers.has(name)) {
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      const length = context.sampleRate * 8;
      source.buffer = context.createBuffer(1, length, context.sampleRate);
      const samples = source.buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        const swell = name === "waves" ? .35 + .65 * Math.sin(Math.PI * i / length) ** 2 : 1;
        samples[i] = (Math.random() * 2 - 1) * swell;
      }
      source.loop = true;
      filter.type = "lowpass";
      filter.frequency.value = name === "waves" ? 390 : 2800;
      gain.gain.value = 0;
      source.connect(filter).connect(gain).connect(context.destination);
      source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
      source.start();
      layers.set(name, { source, gain });
    }
    layers.get(name).gain.gain.setTargetAtTime(volume / 320, context.currentTime, .08);
  }
  return { startMusic, stopMusic, setMusicVolume, setAmbient };
})();

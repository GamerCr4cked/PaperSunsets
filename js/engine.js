/* ═══════════════════════════════════════════════════════════
   Paper Sunsets — visual novel engine
   Zero dependencies. Reads window.STORY and renders the game.
   ═══════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  if (!window.STORY) {
    console.error("Paper Sunsets: story data is missing.");
    return;
  }

  /* ───────────── Asset registry ───────────── */

  const ASSETS = {
    title: "./assets/title/key-art.svg",
    bg: {
      classroom: "./assets/bg/classroom.svg",
      rooftop: "./assets/bg/rooftop.svg",
      library: "./assets/bg/library.svg",
      hallway: "./assets/bg/hallway.svg",
      gate: "./assets/bg/gate.svg"
    },
    portrait: {
      mira_neutral: "./assets/char/mira_neutral.svg",
      mira_smile: "./assets/char/mira_smile.svg",
      mira_blush: "./assets/char/mira_blush.svg",
      mira_sad: "./assets/char/mira_sad.svg"
    }
  };

  const DEFAULT_SETTINGS = {
    textSpeed: 45,
    autoDelay: 2.5,
    reduceMotion: false,
    volume: 0.75,
    muted: false,
    voiceBlips: true
  };

  const AUTOSAVE_KEY = "ps_autosave";
  const SETTINGS_KEY = "ps_settings";
  const ENDINGS_KEY = "ps_endings";
  const slotKey = (n) => `ps_slot_${n}`;
  const SAVE_VERSION = 1;

  /* ───────────── DOM ───────────── */

  const $ = (id) => document.getElementById(id);

  const el = {
    titleScreen: $("screen-title"),
    gameScreen: $("screen-game"),
    endingScreen: $("screen-ending"),

    titleBg: $("title-bg"),
    btnNew: $("btn-new"),
    btnContinue: $("btn-continue"),
    btnLoad: $("btn-load"),
    btnEndings: $("btn-endings"),
    btnSettings: $("btn-settings"),

    bgA: $("bg-layer-a"),
    bgB: $("bg-layer-b"),
    petals: $("petals"),
    chapterLabel: $("chapter-label"),
    btnLog: $("btn-log"),
    btnAuto: $("btn-auto"),
    btnSkip: $("btn-skip"),
    btnPause: $("btn-pause"),

    portraitWrap: $("portrait-wrap"),
    portraitImg: $("portrait-img"),

    dialogueWrap: $("dialogue-wrap"),
    nameplate: $("nameplate"),
    dialogueBox: $("dialogue-box"),
    dialogueText: $("dialogue-text"),
    advanceIndicator: $("advance-indicator"),

    choicesLayer: $("choices-layer"),
    choices: $("choices"),

    noteLayer: $("note-layer"),
    noteText: $("note-text"),

    chapterCard: $("chapter-card"),
    chapterDay: $("chapter-day"),
    chapterTitle: $("chapter-title"),
    chapterTime: $("chapter-time"),

    endingBg: $("ending-bg"),
    endingKicker: $("ending-kicker"),
    endingTitle: $("ending-title"),
    endingBlurb: $("ending-blurb"),
    endingCount: $("ending-count"),
    btnEndingAgain: $("btn-ending-again"),
    btnEndingGallery: $("btn-ending-gallery"),
    btnEndingTitle: $("btn-ending-title"),

    setSpeed: $("set-speed"),
    setSpeedVal: $("set-speed-val"),
    setAuto: $("set-auto"),
    setAutoVal: $("set-auto-val"),
    setVolume: $("set-volume"),
    setVolumeVal: $("set-volume-val"),
    setMuted: $("set-muted"),
    setVoice: $("set-voice"),
    setReduce: $("set-reduce"),
    btnReset: $("btn-reset"),
    btnSound: $("btn-sound"),

    galleryGrid: $("gallery-grid"),
    galleryCount: $("gallery-count"),

    backlog: $("backlog"),

    btnPauseSaves: $("btn-pause-saves"),
    btnPauseSettings: $("btn-pause-settings"),
    btnPauseTitle: $("btn-pause-title"),

    saveSlots: $("save-slots"),
    toast: $("toast")
  };

  const MODAL_IDS = [
    "modal-settings",
    "modal-gallery",
    "modal-backlog",
    "modal-pause",
    "modal-saves"
  ];

  /* ───────────── Runtime state ───────────── */

  let settings = loadSettings();
  let state = freshState();

  let currentLines = [];
  let currentBg = null;
  let currentPortrait = undefined;
  let bgFront = el.bgA;
  let bgBack = el.bgB;

  let gameActive = false;
  let endingVisible = false;
  let choicesActive = false;
  let noteActive = false;
  let chapterActive = false;

  let typing = false;
  let typeRaf = null;
  let typeFullText = "";
  let suppressHistory = false;

  let autoMode = false;
  let autoTimer = null;
  let skipMode = false;
  let skipTimer = null;

  let chapterTimer = null;
  let chapterHideTimer = null;
  let chapterCallback = null;

  let toastTimer = null;
  let voiceTimer = null;

  /* ───────────── Utilities ───────────── */

  function clamp(n, min, max) {
    return Math.min(max, Math.max(min, n));
  }

  function loadJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function storeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function loadSettings() {
    const stored = loadJSON(SETTINGS_KEY) || {};
    const storedVolume = stored.volume === undefined ? DEFAULT_SETTINGS.volume : Number(stored.volume);
    return {
      textSpeed: clamp(Number(stored.textSpeed) || DEFAULT_SETTINGS.textSpeed, 10, 100),
      autoDelay: clamp(Number(stored.autoDelay) || DEFAULT_SETTINGS.autoDelay, 1, 6),
      reduceMotion: Boolean(stored.reduceMotion),
      volume: clamp(Number.isFinite(storedVolume) ? storedVolume : DEFAULT_SETTINGS.volume, 0, 1),
      muted: Boolean(stored.muted),
      voiceBlips: stored.voiceBlips === undefined ? true : Boolean(stored.voiceBlips)
    };
  }

  function saveSettings() {
    storeJSON(SETTINGS_KEY, settings);
  }

  function freshState() {
    return {
      nodeId: null,
      lineIndex: 0,
      flags: { clues: 0 },
      history: [],
      label: ""
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(timestamp) {
    if (!timestamp) return "—";
    try {
      return new Date(timestamp).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "—";
    }
  }

  function toast(message) {
    clearTimeout(toastTimer);
    el.toast.textContent = message;
    el.toast.hidden = false;
    requestAnimationFrame(() => el.toast.classList.add("is-visible"));
    toastTimer = setTimeout(() => {
      el.toast.classList.remove("is-visible");
      setTimeout(() => {
        if (!el.toast.classList.contains("is-visible")) el.toast.hidden = true;
      }, 320);
    }, 1900);
  }

  function applySettings() {
    document.body.classList.toggle("reduce-motion", settings.reduceMotion);
    el.setSpeed.value = String(settings.textSpeed);
    el.setSpeedVal.textContent = String(settings.textSpeed);
    el.setAuto.value = String(settings.autoDelay);
    el.setAutoVal.textContent = `${settings.autoDelay.toFixed(1)}s`;
    el.setVolume.value = String(Math.round(settings.volume * 100));
    el.setVolumeVal.textContent = `${Math.round(settings.volume * 100)}%`;
    el.setMuted.checked = settings.muted;
    el.setVoice.checked = settings.voiceBlips;
    el.setReduce.checked = settings.reduceMotion;

    if (window.PaperAudio) {
      window.PaperAudio.configure({
        volume: settings.volume,
        muted: settings.muted,
        voices: settings.voiceBlips
      });
    }

    updateSoundButton();
  }

  /* ───────────── Audio controls ───────────── */

  function startAudio() {
    if (!window.PaperAudio) return;
    window.PaperAudio.unlock();
    window.PaperAudio.startAmbience();
  }

  function updateSoundButton() {
    const off = settings.muted || settings.volume <= 0.001;
    el.btnSound.classList.toggle("is-off", off);
    el.btnSound.setAttribute("aria-pressed", String(settings.muted));
    const label = settings.muted ? "Unmute sound" : "Mute sound";
    el.btnSound.title = `${label} (M)`;
    el.btnSound.setAttribute("aria-label", label);
  }

  function setMuted(value) {
    settings.muted = Boolean(value);
    if (!settings.muted && settings.volume < 0.05) {
      settings.volume = 0.6;
    }

    saveSettings();
    applySettings();

    if (!settings.muted) startAudio();

    toast(settings.muted ? "Sound muted" : "Sound on");
  }

  function toggleMute() {
    setMuted(!settings.muted);
  }

  /* ───────────── Screens ───────────── */

  function showScreen(name) {
    [el.titleScreen, el.gameScreen, el.endingScreen].forEach((screen) => {
      screen.classList.remove("is-active");
    });

    if (name === "title") {
      el.titleScreen.classList.add("is-active");
      updateTitleState();
    } else if (name === "game") {
      el.gameScreen.classList.add("is-active");
    } else if (name === "ending") {
      el.endingScreen.classList.add("is-active");
    }
  }

  function updateTitleState() {
    const save = loadJSON(AUTOSAVE_KEY);
    el.btnContinue.disabled = !save;
    el.btnContinue.title = save ? `Continue: ${save.label || "autosave"}` : "No autosave yet";
  }

  /* ───────────── Backgrounds & portraits ───────────── */

  function setBackground(key) {
    if (!key || key === currentBg) return;
    const src = ASSETS.bg[key];
    if (!src) return;

    currentBg = key;
    const incoming = bgBack;
    const outgoing = bgFront;

    incoming.style.backgroundImage = `url("${src}")`;
    requestAnimationFrame(() => incoming.classList.add("is-visible"));
    outgoing.classList.remove("is-visible");

    bgFront = incoming;
    bgBack = outgoing;
  }

  function setPortrait(key) {
    if (key === currentPortrait) return;
    currentPortrait = key;

    if (!key) {
      el.portraitWrap.classList.remove("is-visible");
      return;
    }

    const src = ASSETS.portrait[key];
    if (!src) return;

    el.portraitImg.src = src;
    el.portraitImg.alt = "Mira";
    el.portraitWrap.classList.add("is-visible");
  }

  function preloadAssets() {
    const sources = [
      ASSETS.title,
      ...Object.values(ASSETS.bg),
      ...Object.values(ASSETS.portrait)
    ];
    sources.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }

  /* ───────────── Petals ───────────── */

  function spawnPetals() {
    const count = 16;
    for (let i = 0; i < count; i += 1) {
      const petal = document.createElement("span");
      petal.className = "petal";
      petal.style.setProperty("--x", `${Math.random() * 100}%`);
      petal.style.setProperty("--dur", `${11 + Math.random() * 12}s`);
      petal.style.setProperty("--delay", `${-Math.random() * 22}s`);
      petal.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
      petal.style.setProperty("--size", `${6 + Math.random() * 8}px`);
      el.petals.appendChild(petal);
    }
  }

  /* ───────────── Voice cues ───────────── */

  const VOICE_PRESETS = new Set(["hm", "oh", "ah", "eh", "huh", "urgh", "sigh"]);

  function cancelVoice() {
    clearTimeout(voiceTimer);
    voiceTimer = null;
  }

  function voicePresetFor(line) {
    if (!line.who) return null;
    if (line.voice && VOICE_PRESETS.has(line.voice)) return line.voice;

    const text = String(line.text || "").trim();
    if (!text || text.length > 42) return null;
    if (text.split(/\s+/).length > 5) return null;

    const lower = text.toLowerCase();
    if (/^sigh\b/.test(lower)) return "sigh";
    if (/^(hm+|mhm|mm)\b/.test(lower)) return "hm";
    if (/^(oh+|ooh+)\b/.test(lower)) return "oh";
    if (/^(ah+|ahh+)\b/.test(lower)) return "ah";
    if (/^(ugh+|urgh+|ergh+)\b/.test(lower)) return "urgh";
    if (/^(eh|heh)\b/.test(lower)) return "eh";
    if (/^(huh|what)\b/.test(lower)) return "huh";
    return null;
  }

  function playLineVoice(line) {
    const preset = voicePresetFor(line);
    if (!preset) return;

    cancelVoice();
    voiceTimer = setTimeout(() => {
      voiceTimer = null;
      if (!gameActive || skipMode || choicesActive || noteActive || isModalOpen()) return;
      if (window.PaperAudio) window.PaperAudio.voice(preset, line.who);
    }, 110);
  }

  /* ───────────── Story flow ───────────── */

  function showNode(id, options = {}) {
    const node = window.STORY.nodes[id];
    if (!node) {
      console.error(`Paper Sunsets: missing story node "${id}".`);
      return;
    }

    cancelTyping();
    cancelVoice();
    cancelAutoTimer();
    hideChoices();
    hideNote();
    hideChapterCardImmediate();

    state.nodeId = id;
    state.lineIndex = Number.isInteger(options.lineIndex) ? options.lineIndex : 0;

    currentLines = (node.lines || []).filter((line) => !line.if || line.if(state));

    if (node.chapter) {
      state.label = `${node.chapter.day} — ${node.chapter.title}`;
      el.chapterLabel.textContent = `${node.chapter.day} · ${node.chapter.time}`;
    }

    if (node.bg) setBackground(node.bg);
    if (node.portrait !== undefined) setPortrait(node.portrait);

    const proceed = () => renderCurrent(node);

    if (node.chapter && !options.fromSave) {
      showChapterCard(node.chapter, proceed);
    } else {
      proceed();
    }
  }

  function renderCurrent(node) {
    const line = currentLines[state.lineIndex];

    if (line) {
      showLine(line);
      return;
    }

    if (node.choices) {
      renderChoices(node);
      return;
    }

    if (node.next) {
      showNode(node.next);
      return;
    }

    if (node.ending) {
      showEnding(node.ending);
      return;
    }

    console.warn("Paper Sunsets: dead-end node", state.nodeId);
  }

  function showLine(line) {
    if (line.bg) setBackground(line.bg);
    if (line.portrait !== undefined) setPortrait(line.portrait);

    if (line.type === "note") {
      showNote(line.text);
      return;
    }

    hideNote();
    el.dialogueWrap.classList.remove("is-hidden");

    setNameplate(line.who);
    typeText(line.text);
    playLineVoice(line);

    if (!suppressHistory) {
      pushHistory(line.who || "Narration", line.text, "line");
    }

    autosave();
  }

  function nextLine() {
    if (!gameActive) return;

    state.lineIndex += 1;

    const node = window.STORY.nodes[state.nodeId];
    if (!node) return;

    renderCurrent(node);
  }

  function advance() {
    if (!gameActive || endingVisible) return;

    if (chapterActive) {
      dismissChapter();
      return;
    }

    if (choicesActive) return;

    if (typing) {
      finishTyping();
      return;
    }

    if (noteActive) {
      hideNote();
      nextLine();
      return;
    }

    nextLine();
  }

  /* ───────────── Typewriter ───────────── */

  function typeText(text) {
    cancelTyping();

    typeFullText = text;
    el.dialogueText.textContent = "";
    el.advanceIndicator.classList.remove("is-visible");
    typing = true;

    if (settings.reduceMotion) {
      el.dialogueText.textContent = text;
      finishTyping();
      return;
    }

    const charsPerSecond = 10 + settings.textSpeed * 0.95;
    const startedAt = performance.now();
    let shownCount = 0;

    const frame = (now) => {
      const elapsed = (now - startedAt) / 1000;
      const count = Math.min(text.length, Math.floor(elapsed * charsPerSecond));
      el.dialogueText.textContent = text.slice(0, count);

      if (count > shownCount) {
        if (!skipMode && !isModalOpen() && window.PaperAudio) {
          window.PaperAudio.type(text.slice(shownCount, count));
        }
        shownCount = count;
      }

      if (count < text.length) {
        typeRaf = requestAnimationFrame(frame);
      } else {
        finishTyping();
      }
    };

    typeRaf = requestAnimationFrame(frame);
  }

  function cancelTyping() {
    if (typeRaf !== null) {
      cancelAnimationFrame(typeRaf);
      typeRaf = null;
    }
    typing = false;
    el.advanceIndicator.classList.remove("is-visible");
  }

  function finishTyping() {
    if (typeRaf !== null) {
      cancelAnimationFrame(typeRaf);
      typeRaf = null;
    }
    el.dialogueText.textContent = typeFullText;
    typing = false;
    el.advanceIndicator.classList.add("is-visible");
    scheduleAuto();
  }

  /* ───────────── Nameplate & history ───────────── */

  function setNameplate(who) {
    if (!who) {
      el.nameplate.textContent = "";
      el.nameplate.removeAttribute("data-speaker");
      el.nameplate.classList.add("is-empty");
      return;
    }

    el.nameplate.textContent = who;
    el.nameplate.dataset.speaker = who;
    el.nameplate.classList.remove("is-empty");
  }

  function pushHistory(who, text, kind) {
    state.history.push({ who, text, kind: kind || "line" });
    if (state.history.length > 150) {
      state.history.splice(0, state.history.length - 150);
    }
  }

  /* ───────────── Notes ───────────── */

  function showNote(text) {
    noteActive = true;
    el.noteText.textContent = text;
    el.noteLayer.hidden = false;
    el.dialogueWrap.classList.add("is-hidden");
    el.advanceIndicator.classList.remove("is-visible");

    if (!suppressHistory) {
      pushHistory("Note", text, "note");
    }

    autosave();

    if (autoMode) scheduleAuto(true);
  }

  function hideNote() {
    noteActive = false;
    el.noteLayer.hidden = true;
    el.dialogueWrap.classList.remove("is-hidden");
  }

  /* ───────────── Choices ───────────── */

  function renderChoices(node) {
    choicesActive = true;
    cancelAutoTimer();
    cancelTyping();
    hideNote();

    el.choices.innerHTML = "";

    const prompt = document.createElement("p");
    prompt.className = "choices-prompt";
    prompt.textContent = node.prompt || "What do you do?";
    el.choices.appendChild(prompt);

    const visibleChoices = (node.choices || []).filter(
      (choice) => !choice.condition || choice.condition(state)
    );

    visibleChoices.forEach((choice) => {
      const label = typeof choice.text === "function" ? choice.text(state) : choice.text;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice-btn";

      const text = document.createElement("span");
      text.textContent = label;

      const arrow = document.createElement("span");
      arrow.className = "choice-arrow";
      arrow.textContent = "→";
      arrow.setAttribute("aria-hidden", "true");

      button.append(text, arrow);

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        selectChoice(choice, label);
      });

      el.choices.appendChild(button);
    });

    el.choicesLayer.hidden = false;
    el.dialogueWrap.classList.add("is-hidden");
    autosave();
  }

  function selectChoice(choice, label) {
    choicesActive = false;
    el.choicesLayer.hidden = true;
    el.dialogueWrap.classList.remove("is-hidden");

    if (!suppressHistory) {
      pushHistory("You", label, "choice");
    }

    if (choice.effects) applyEffects(choice.effects);

    autosave();

    if (choice.next) {
      showNode(choice.next);
    }
  }

  function hideChoices() {
    choicesActive = false;
    el.choicesLayer.hidden = true;
    el.choices.innerHTML = "";
  }

  function applyEffects(effects) {
    Object.entries(effects).forEach(([key, value]) => {
      if (typeof value === "number") {
        state.flags[key] = (Number(state.flags[key]) || 0) + value;
      } else {
        state.flags[key] = value;
      }
    });
  }

  /* ───────────── Chapter cards ───────────── */

  function showChapterCard(info, callback) {
    clearTimeout(chapterHideTimer);
    clearTimeout(chapterTimer);

    chapterActive = true;
    chapterCallback = callback;

    el.chapterDay.textContent = info.day || "";
    el.chapterTitle.textContent = info.title || "";
    el.chapterTime.textContent = info.time || "";
    el.chapterCard.hidden = false;
    el.chapterCard.classList.remove("is-out");

    const delay = settings.reduceMotion ? 900 : 2300;
    chapterTimer = setTimeout(dismissChapter, delay);
  }

  function dismissChapter() {
    if (!chapterActive) return;
    chapterActive = false;
    clearTimeout(chapterTimer);

    el.chapterCard.classList.add("is-out");

    const delay = settings.reduceMotion ? 20 : 450;

    chapterHideTimer = setTimeout(() => {
      el.chapterCard.hidden = true;
      el.chapterCard.classList.remove("is-out");

      const callback = chapterCallback;
      chapterCallback = null;
      if (callback) callback();
    }, delay);
  }

  function hideChapterCardImmediate() {
    clearTimeout(chapterTimer);
    clearTimeout(chapterHideTimer);
    chapterActive = false;
    chapterCallback = null;
    el.chapterCard.hidden = true;
    el.chapterCard.classList.remove("is-out");
  }

  /* ───────────── Auto / skip ───────────── */

  function scheduleAuto(forceNote = false) {
    cancelAutoTimer();

    if (!autoMode || !gameActive || choicesActive || chapterActive) return;
    if (isModalOpen()) return;
    if (typing) return;
    if (!noteActive && !forceNote && !el.advanceIndicator.classList.contains("is-visible")) return;

    const delay = noteActive ? Math.max(1800, settings.autoDelay * 1500) : settings.autoDelay * 1000;
    autoTimer = setTimeout(advance, delay);
  }

  function cancelAutoTimer() {
    clearTimeout(autoTimer);
    autoTimer = null;
  }

  function toggleAuto() {
    if (skipMode) stopSkip();

    autoMode = !autoMode;
    el.btnAuto.classList.toggle("is-active", autoMode);
    el.btnAuto.setAttribute("aria-pressed", String(autoMode));

    if (autoMode) {
      scheduleAuto();
    } else {
      cancelAutoTimer();
    }
  }

  function toggleSkip() {
    if (skipMode) {
      stopSkip();
      return;
    }

    if (autoMode) {
      autoMode = false;
      el.btnAuto.classList.remove("is-active");
      el.btnAuto.setAttribute("aria-pressed", "false");
      cancelAutoTimer();
    }

    skipMode = true;
    el.btnSkip.classList.add("is-active");

    skipTimer = setInterval(() => {
      if (!gameActive || choicesActive || chapterActive) {
        stopSkip();
        return;
      }

      if (typing) {
        finishTyping();
      } else {
        advance();
      }
    }, 55);
  }

  function stopSkip() {
    skipMode = false;
    clearInterval(skipTimer);
    skipTimer = null;
    el.btnSkip.classList.remove("is-active");
  }

  /* ───────────── Saves ───────────── */

  function serialize() {
    return {
      v: SAVE_VERSION,
      nodeId: state.nodeId,
      lineIndex: state.lineIndex,
      flags: JSON.parse(JSON.stringify(state.flags || {})),
      history: (state.history || []).slice(-150),
      label: state.label || "Paper Sunsets",
      time: Date.now()
    };
  }

  function autosave() {
    if (!state.nodeId) return;
    storeJSON(AUTOSAVE_KEY, serialize());
  }

  function startNewGame(force = false) {
    if (!force && localStorage.getItem(AUTOSAVE_KEY)) {
      const confirmed = window.confirm(
        "Start a new game? Your current autosave will be replaced."
      );
      if (!confirmed) return;
    }

    closeAllModals();
    stopSkip();
    cancelAutoTimer();

    gameActive = true;
    endingVisible = false;
    state = freshState();

    currentBg = null;
    currentPortrait = undefined;
    bgFront = el.bgA;
    bgBack = el.bgB;
    el.bgA.classList.remove("is-visible");
    el.bgB.classList.remove("is-visible");
    el.bgA.style.backgroundImage = "";
    el.bgB.style.backgroundImage = "";
    el.portraitWrap.classList.remove("is-visible");
    el.portraitImg.removeAttribute("src");
    el.dialogueWrap.classList.remove("is-hidden");
    el.choicesLayer.hidden = true;
    el.noteLayer.hidden = true;
    el.advanceIndicator.classList.remove("is-visible");
    el.dialogueText.textContent = "";

    autoMode = false;
    el.btnAuto.classList.remove("is-active");
    el.btnAuto.setAttribute("aria-pressed", "false");

    startAudio();
    showScreen("game");
    showNode(window.STORY.start);
  }

  function continueGame() {
    const save = loadJSON(AUTOSAVE_KEY);
    if (!save) {
      toast("No autosave found");
      return;
    }
    loadGameData(save);
  }

  function loadGameData(data) {
    if (!data || !data.nodeId || !window.STORY.nodes[data.nodeId]) {
      toast("That save could not be loaded");
      return;
    }

    closeAllModals();
    stopSkip();
    cancelAutoTimer();

    gameActive = true;
    endingVisible = false;
    state = freshState();
    state.nodeId = data.nodeId;
    state.lineIndex = Number.isInteger(data.lineIndex) ? data.lineIndex : 0;
    state.flags = data.flags && typeof data.flags === "object" ? data.flags : { clues: 0 };
    state.history = Array.isArray(data.history) ? data.history : [];
    state.label = data.label || "";

    currentBg = null;
    currentPortrait = undefined;
    bgFront = el.bgA;
    bgBack = el.bgB;
    el.bgA.classList.remove("is-visible");
    el.bgB.classList.remove("is-visible");
    el.bgA.style.backgroundImage = "";
    el.bgB.style.backgroundImage = "";
    el.portraitWrap.classList.remove("is-visible");
    el.dialogueWrap.classList.remove("is-hidden");
    el.choicesLayer.hidden = true;
    el.noteLayer.hidden = true;
    el.chapterCard.hidden = true;
    el.dialogueText.textContent = "";

    showScreen("game");
    el.chapterLabel.textContent = state.label;

    startAudio();

    suppressHistory = true;
    showNode(data.nodeId, { lineIndex: state.lineIndex, fromSave: true });
    suppressHistory = false;

    toast("Loaded");
  }

  function saveToSlot(slot) {
    if (!gameActive) return;
    if (storeJSON(slotKey(slot), serialize())) {
      toast(`Saved to slot ${slot}`);
      renderSaves();
    } else {
      toast("Could not save");
    }
  }

  function deleteSlot(slot) {
    const confirmed = window.confirm("Delete this save?");
    if (!confirmed) return;
    localStorage.removeItem(slotKey(slot));
    renderSaves();
    toast("Save deleted");
  }

  /* ───────────── Endings ───────────── */

  function getUnlockedEndings() {
    const stored = loadJSON(ENDINGS_KEY);
    if (!Array.isArray(stored)) return [];
    const validIds = new Set(window.STORY.endings.map((ending) => ending.id));
    return stored.filter((id) => validIds.has(id));
  }

  function unlockEnding(id) {
    const unlocked = getUnlockedEndings();
    if (unlocked.includes(id)) return;
    unlocked.push(id);
    storeJSON(ENDINGS_KEY, unlocked);
    toast("New ending unlocked");
  }

  function showEnding(id) {
    const meta = window.STORY.endings.find((ending) => ending.id === id);
    if (!meta) {
      console.error(`Paper Sunsets: unknown ending "${id}".`);
      return;
    }

    unlockEnding(id);

    gameActive = false;
    endingVisible = true;
    stopSkip();
    cancelAutoTimer();
    cancelTyping();

    el.endingBg.style.backgroundImage = `url("${ASSETS.title}")`;
    el.endingKicker.textContent = `Ending ${String(meta.number).padStart(2, "0")} / ${String(window.STORY.endings.length).padStart(2, "0")}`;
    el.endingTitle.textContent = meta.title;
    el.endingBlurb.textContent = meta.blurb;
    el.endingCount.textContent = `${getUnlockedEndings().length} of ${window.STORY.endings.length} endings discovered`;

    showScreen("ending");
  }

  function renderGallery() {
    const unlocked = getUnlockedEndings();
    el.galleryGrid.innerHTML = "";

    window.STORY.endings.forEach((meta) => {
      const isUnlocked = unlocked.includes(meta.id);

      const card = document.createElement("article");
      card.className = `gallery-card${isUnlocked ? "" : " is-locked"}`;

      const num = document.createElement("span");
      num.className = "gallery-num";
      num.textContent = `Ending ${String(meta.number).padStart(2, "0")}`;

      const title = document.createElement("h3");
      title.textContent = isUnlocked ? meta.title : "???";

      const blurb = document.createElement("p");
      blurb.textContent = isUnlocked
        ? meta.blurb
        : "Keep playing to discover this ending.";

      card.append(num, title, blurb);
      el.galleryGrid.appendChild(card);
    });

    el.galleryCount.textContent = `${unlocked.length} / ${window.STORY.endings.length} discovered`;
  }

  /* ───────────── Modals & menus ───────────── */

  function openModal(id) {
    closeAllModals();
    const modal = $(id);
    if (modal) modal.hidden = false;

    // Keep the story still while a menu is open.
    stopSkip();
    cancelAutoTimer();
  }

  function closeModal(modal) {
    if (modal) modal.hidden = true;
    if (!isModalOpen()) maybeResumeAuto();
  }

  function maybeResumeAuto() {
    if (autoMode && gameActive && !isModalOpen()) {
      scheduleAuto();
    }
  }

  function closeAllModals() {
    MODAL_IDS.forEach((id) => {
      const modal = $(id);
      if (modal) modal.hidden = true;
    });
  }

  function isModalOpen() {
    return MODAL_IDS.some((id) => {
      const modal = $(id);
      return modal && !modal.hidden;
    });
  }

  function openPause() {
    if (!gameActive) return;
    openModal("modal-pause");
  }

  function openSettings() {
    applySettings();
    openModal("modal-settings");
  }

  function openBacklog() {
    el.backlog.innerHTML = "";

    if (!state.history.length) {
      const empty = document.createElement("p");
      empty.className = "backlog-empty";
      empty.textContent = "Nothing here yet. The story is waiting.";
      el.backlog.appendChild(empty);
    } else {
      state.history.forEach((entry) => {
        const item = document.createElement("div");
        item.className = "backlog-entry";
        if (entry.kind === "choice") item.classList.add("is-choice");
        if (entry.kind === "note") item.classList.add("is-note");

        const who = document.createElement("span");
        who.className = "backlog-who";
        who.textContent = entry.who || "Narration";

        const text = document.createElement("p");
        text.className = "backlog-text";
        text.textContent = entry.text;

        item.append(who, text);
        el.backlog.appendChild(item);
      });
    }

    openModal("modal-backlog");
    el.backlog.scrollTop = el.backlog.scrollHeight;
  }

  function renderSaves() {
    el.saveSlots.innerHTML = "";

    for (let slot = 1; slot <= 3; slot += 1) {
      const data = loadJSON(slotKey(slot));

      const row = document.createElement("div");
      row.className = "save-slot";

      const info = document.createElement("div");
      info.className = "save-info";

      const num = document.createElement("span");
      num.className = "save-num";
      num.textContent = `Slot ${slot}`;

      const title = document.createElement("strong");
      title.textContent = data ? data.label || "Saved game" : "Empty slot";

      const time = document.createElement("span");
      time.className = "save-time";
      time.textContent = data ? formatDate(data.time) : "—";

      info.append(num, title, time);

      const actions = document.createElement("div");
      actions.className = "save-actions";

      if (gameActive) {
        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.textContent = "Save";
        saveBtn.addEventListener("click", () => saveToSlot(slot));
        actions.appendChild(saveBtn);
      }

      if (data) {
        const loadBtn = document.createElement("button");
        loadBtn.type = "button";
        loadBtn.textContent = "Load";
        loadBtn.addEventListener("click", () => {
          loadGameData(loadJSON(slotKey(slot)));
        });
        actions.appendChild(loadBtn);

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "is-danger";
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => deleteSlot(slot));
        actions.appendChild(deleteBtn);
      }

      row.append(info, actions);
      el.saveSlots.appendChild(row);
    }
  }

  function returnToTitle() {
    if (gameActive) autosave();
    closeAllModals();
    stopSkip();
    cancelAutoTimer();
    cancelTyping();
    hideNote();
    hideChoices();
    hideChapterCardImmediate();
    gameActive = false;
    endingVisible = false;
    showScreen("title");
  }

  function resetProgress() {
    const confirmed = window.confirm(
      "Erase all progress, manual saves, and discovered endings? This cannot be undone."
    );
    if (!confirmed) return;

    Object.keys(localStorage)
      .filter((key) => key.startsWith("ps_"))
      .forEach((key) => localStorage.removeItem(key));

    settings = { ...DEFAULT_SETTINGS };
    saveSettings();
    applySettings();

    state = freshState();
    gameActive = false;
    endingVisible = false;
    closeAllModals();
    showScreen("title");
    updateTitleState();
    renderGallery();
    toast("Progress reset");
  }

  /* ───────────── Event wiring ───────────── */

  function bindEvents() {
    // Title menu
    el.btnNew.addEventListener("click", () => startNewGame(false));
    el.btnContinue.addEventListener("click", continueGame);
    el.btnLoad.addEventListener("click", () => {
      renderSaves();
      openModal("modal-saves");
    });
    el.btnEndings.addEventListener("click", () => {
      renderGallery();
      openModal("modal-gallery");
    });
    el.btnSettings.addEventListener("click", openSettings);

    // In-game top bar
    el.btnLog.addEventListener("click", openBacklog);
    el.btnAuto.addEventListener("click", toggleAuto);
    el.btnSkip.addEventListener("click", toggleSkip);
    el.btnPause.addEventListener("click", openPause);
    el.btnSound.addEventListener("click", toggleMute);

    // Pause menu
    el.btnPauseSaves.addEventListener("click", () => {
      renderSaves();
      openModal("modal-saves");
    });
    el.btnPauseSettings.addEventListener("click", openSettings);
    el.btnPauseTitle.addEventListener("click", returnToTitle);

    // Ending screen
    el.btnEndingAgain.addEventListener("click", () => startNewGame(true));
    el.btnEndingGallery.addEventListener("click", () => {
      renderGallery();
      openModal("modal-gallery");
    });
    el.btnEndingTitle.addEventListener("click", returnToTitle);

    // Settings
    el.setSpeed.addEventListener("input", () => {
      settings.textSpeed = Number(el.setSpeed.value);
      el.setSpeedVal.textContent = String(settings.textSpeed);
      saveSettings();
    });

    el.setAuto.addEventListener("input", () => {
      settings.autoDelay = Number(el.setAuto.value);
      el.setAutoVal.textContent = `${settings.autoDelay.toFixed(1)}s`;
      saveSettings();
    });

    el.setVolume.addEventListener("input", () => {
      const next = Number(el.setVolume.value) / 100;
      settings.volume = next;
      if (next > 0.001 && settings.muted) settings.muted = false;
      if (next <= 0.001) settings.muted = true;
      saveSettings();
      applySettings();
      if (!settings.muted) startAudio();
    });

    el.setMuted.addEventListener("change", () => {
      setMuted(el.setMuted.checked);
    });

    el.setVoice.addEventListener("change", () => {
      settings.voiceBlips = el.setVoice.checked;
      saveSettings();
      applySettings();
    });

    el.setReduce.addEventListener("change", () => {
      settings.reduceMotion = el.setReduce.checked;
      applySettings();
      saveSettings();
    });

    el.btnReset.addEventListener("click", resetProgress);

    // Close buttons and backdrop clicks
    document.querySelectorAll("[data-close]").forEach((button) => {
      button.addEventListener("click", () => {
        closeModal($(button.dataset.close));
      });
    });

    MODAL_IDS.forEach((id) => {
      const modal = $(id);
      if (!modal) return;
      modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal(modal);
      });
    });

    // Advance on click anywhere in the game except UI
    el.gameScreen.addEventListener("click", (event) => {
      if (event.target.closest("button, .choices-layer, .note-layer, .chapter-card, .game-topbar, .modal-layer")) {
        return;
      }
      advance();
    });

    el.noteLayer.addEventListener("click", (event) => {
      event.stopPropagation();
      advance();
    });

    el.chapterCard.addEventListener("click", (event) => {
      event.stopPropagation();
      dismissChapter();
    });

    // Keyboard
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        if (isModalOpen()) {
          closeAllModals();
          maybeResumeAuto();
          return;
        }
        if (gameActive) {
          openPause();
        }
        return;
      }

      if (isModalOpen()) return;
      if (!gameActive) return;
      if (event.target.closest("input, button, textarea, select")) return;

      const key = event.key.toLowerCase();

      if (key === " " || key === "enter" || key === "arrowright") {
        event.preventDefault();
        advance();
        return;
      }

      if (key === "l") {
        event.preventDefault();
        openBacklog();
        return;
      }

      if (key === "a") {
        event.preventDefault();
        toggleAuto();
        return;
      }

      if (key === "m") {
        event.preventDefault();
        toggleMute();
      }
    });

    // Browsers require a gesture before audio can start.
    const unlockAudio = () => {
      document.removeEventListener("pointerdown", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
      startAudio();
    };
    document.addEventListener("pointerdown", unlockAudio);
    document.addEventListener("keydown", unlockAudio);

    // Pause auto-play and sound when the tab is hidden
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        cancelAutoTimer();
        if (window.PaperAudio) window.PaperAudio.setPageHidden(true);
      } else {
        if (autoMode) scheduleAuto();
        if (window.PaperAudio) window.PaperAudio.setPageHidden(false);
      }
    });
  }

  /* ───────────── Boot ───────────── */

  function init() {
    applySettings();
    spawnPetals();
    preloadAssets();
    bindEvents();

    el.titleBg.style.backgroundImage = `url("${ASSETS.title}")`;
    el.endingBg.style.backgroundImage = `url("${ASSETS.title}")`;

    updateTitleState();
    renderGallery();
    showScreen("title");
  }

  init();

  /* Small debug helpers — handy for testing endings. */
  window.PaperSunsets = {
    goTo(nodeId) {
      if (!window.STORY.nodes[nodeId]) {
        console.warn("Unknown node:", nodeId);
        return;
      }
      closeAllModals();
      gameActive = true;
      endingVisible = false;
      startAudio();
      showScreen("game");
      showNode(nodeId);
    },
    unlockAllEndings() {
      storeJSON(ENDINGS_KEY, window.STORY.endings.map((ending) => ending.id));
      renderGallery();
      toast("All endings unlocked");
    },
    reset: resetProgress
  };
})();

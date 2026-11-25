(() => {
  const { access, readSetting, saveSetting } = studyStorage;
  const { startMusic, stopMusic, setMusicVolume, setAmbient } = studyAudio;

  const $ = (selector) => document.querySelector(selector);
  const all = (selector) => document.querySelectorAll(selector);
  const minute = 60_000;
  const defaults = { focus: 25, short: 5, long: 15 };
  const key = (name) => `study-space.${name}`;
  const get = (name, fallback) => readSetting(key(name), fallback);
  const put = (name, value) => saveSetting(key(name), value);
  const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  let durations = get("durations", defaults);
  let timer = get("timer", freshTimer("focus"));
  let sessions = [];
  let tasks = [];
  let completing = false;
  let weekOffset = 0;

  function report(error) {
    console.error(error);
    $("#status").textContent = "Không thể hoàn tất thao tác. Hãy thử lại.";
  }

  function freshTimer(mode, cycle = 0) {
    const duration = (durations?.[mode] ?? defaults[mode]) * minute;
    return { id: uid(), mode, duration, remaining: duration, end: null, started: null, cycle };
  }

  function changeTimer(next) {
    put("timer", next);
    timer = next;
    renderTimer();
  }

  function renderTimer() {
    const ms = timer.end === null ? timer.remaining : Math.max(0, timer.end - Date.now());
    const seconds = Math.ceil(ms / 1000);
    const display = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
    if ($("#clock").textContent !== display) $("#clock").textContent = display;
    $("#toggle").textContent = timer.end !== null ? "Tạm dừng" : timer.started ? "Tiếp tục" : "Bắt đầu";
    $("#session-mode").value = timer.mode;
    $("#session-progress").value = Math.round(100 * (1 - ms / timer.duration));
  }

  async function tick() {
    renderTimer();
    if (timer.end === null || timer.end > Date.now() || completing) return;
    completing = true;
    const finished = timer;
    try {
      if (finished.mode === "focus") {
        await access("sessions", "put", {
          id: finished.id, startTime: finished.started, endTime: finished.end,
          type: "focus", status: "completed", duration: finished.duration,
        });
      }
      const current = get("timer", timer);
      if (current.id === finished.id && current.end === finished.end) {
        const cycle = finished.mode === "focus" ? finished.cycle + 1 : finished.cycle;
        const next = finished.mode === "focus" ? (cycle % 4 === 0 ? "long" : "short") : "focus";
        changeTimer(freshTimer(next, cycle));
        $("#timer-message").textContent = finished.mode === "focus"
          ? "Đã hoàn thành phiên học. Đến giờ nghỉ!" : "Đã hết giờ nghỉ.";
      } else {
        timer = current;
      }
      await refreshStats();
    } catch (error) {
      report(error);
    } finally {
      completing = false;
    }
  }

  $("#toggle").onclick = () => {
    if (completing || (timer.end !== null && timer.end <= Date.now())) return;
    const now = Date.now();
    if (timer.end !== null) changeTimer({ ...timer, remaining: timer.end - now, end: null });
    else changeTimer({ ...timer, started: timer.started ?? now, end: now + timer.remaining });
    $("#timer-message").textContent = "";
  };
  $("#reset").onclick = () => {
    if (!completing) changeTimer(freshTimer(timer.mode, timer.cycle));
  };
  $("#session-mode").onchange = (event) => {
    if (completing) {
      renderTimer();
      return;
    }
    changeTimer(freshTimer(event.target.value, timer.cycle));
    $("#timer-message").textContent = "";
  };
  for (const button of all("[data-open]")) {
    button.onclick = () => {
      if (button.dataset.open === "settings") {
        for (const mode of Object.keys(defaults)) $("#settings-form").elements[mode].value = durations[mode];
      }
      document.getElementById(button.dataset.open).showModal();
    };
  }
  $("#settings-form").onsubmit = (event) => {
    event.preventDefault();
    durations = Object.fromEntries([...new FormData(event.currentTarget)].map(([mode, value]) => [mode, Number(value)]));
    put("durations", durations);
    if (!timer.started && !completing) changeTimer(freshTimer(timer.mode, timer.cycle));
    $("#settings").close();
  };
  setInterval(tick, 300);
  document.addEventListener("visibilitychange", tick);
  window.addEventListener("storage", (event) => {
    if (event.key === key("timer")) {
      timer = get("timer", freshTimer("focus"));
      void tick();
      void refreshStats().catch(report);
    }
  });

  const sceneButtons = [...all("button[data-scene]")];
  function selectScene(name) {
    const selected = sceneButtons.find((button) => button.dataset.scene === name) ?? sceneButtons[0];
    if (!selected) return;
    const scene = selected.dataset.scene;
    document.body.dataset.scene = scene;
    $("#current-scene-name").textContent = selected.querySelector(".scene-name").textContent;
    for (const button of sceneButtons) {
      button.setAttribute("aria-pressed", String(button === selected));
    }
    put("scene", scene);
  }
  for (const button of sceneButtons) button.onclick = () => selectScene(button.dataset.scene);
  selectScene(get("scene", "rain"));

  const greetingHour = new Date().getHours();
  $("#greeting").textContent = greetingHour < 11 ? "Chào buổi sáng ☀️"
    : greetingHour < 18 ? "Chào buổi chiều 🌤" : "Chào buổi tối 🌙";
  for (const button of all("[data-scenes-link]")) {
    button.onclick = () => sceneButtons.find((scene) => scene.getAttribute("aria-pressed") === "true")?.focus();
  }

  const themeButtons = [...all("[data-theme]")];
  function selectTheme(button) {
    document.documentElement.dataset.accent = button.dataset.theme;
    for (const option of themeButtons) option.setAttribute("aria-pressed", String(option === button));
    put("accent", button.dataset.theme);
  }
  for (const button of themeButtons) button.onclick = () => selectTheme(button);
  const savedTheme = themeButtons.find((button) => button.dataset.theme === get("accent", "peach")) ?? themeButtons[0];
  if (savedTheme) selectTheme(savedTheme);

  const darkMode = $("#dark-mode");
  const quoteToggle = $("#quote-toggle");
  darkMode.checked = get("dark-glass", false);
  quoteToggle.checked = get("focus-quote", true);
  function applyAppearance() {
    document.body.classList.toggle("dark-glass", darkMode.checked);
    $("#focus-quote").hidden = !quoteToggle.checked;
  }
  darkMode.onchange = () => { applyAppearance(); put("dark-glass", darkMode.checked); };
  quoteToggle.onchange = () => { applyAppearance(); put("focus-quote", quoteToggle.checked); };
  applyAppearance();

  let musicPlaying = false;
  $("#track").value = get("track", "lofi");
  $("#music-volume").value = get("music-volume", 45);
  $("#play").onclick = async () => {
    const play = $("#play");
    play.disabled = true;
    try {
      if (musicPlaying) stopMusic();
      else await startMusic($("#track").value, $("#music-volume").value);
      musicPlaying = !musicPlaying;
      if (musicPlaying) externalAudio.pause();
      play.setAttribute("aria-pressed", String(musicPlaying));
      play.setAttribute("aria-label", musicPlaying ? "Tạm dừng nhạc" : "Phát nhạc");
    } catch (error) {
      report(error);
    } finally {
      play.disabled = false;
    }
  };
  $("#track").onchange = async (event) => {
    put("track", event.target.value);
    if (musicPlaying) await startMusic(event.target.value, $("#music-volume").value).catch(report);
  };
  const trackSelect = $("#track");
  for (const [id, step] of [["#previous-track", -1], ["#next-track", 1]]) {
    $(id).onclick = () => {
      trackSelect.selectedIndex = (trackSelect.selectedIndex + step + trackSelect.options.length) % trackSelect.options.length;
      void trackSelect.onchange({ target: trackSelect });
    };
  }
  $("#music-volume").oninput = (event) => {
    put("music-volume", Number(event.target.value));
    setMusicVolume(event.target.value);
  };
  const externalAudio = $("#external-audio-player");
  const externalAudioPanel = $("#external-audio-panel");
  const externalAudioOpen = $("#external-audio-open");
  const externalAudioUrl = $("#external-audio-url");
  const externalAudioMessage = $("#external-audio-message");

  function showExternalAudio(open) {
    externalAudioPanel.hidden = !open;
    externalAudioOpen.setAttribute("aria-expanded", String(open));
    if (!open) externalAudio.pause();
    (open ? externalAudioUrl : externalAudioOpen).focus();
  }

  externalAudioOpen.onclick = () => showExternalAudio(externalAudioPanel.hidden);
  $("#external-audio-close").onclick = () => showExternalAudio(false);

  externalAudio.onplay = () => {
    stopMusic();
    musicPlaying = false;
    $("#play").setAttribute("aria-pressed", "false");
    $("#play").setAttribute("aria-label", "Phát nhạc");
    externalAudioMessage.textContent = "";
  };

  externalAudio.onerror = () => {
    externalAudioMessage.textContent = "Không tải được âm thanh. Kiểm tra link có mở trực tiếp tệp nhạc và nguồn có cho phát từ website khác.";
  };

  $("#external-audio-form").onsubmit = async (event) => {
    event.preventDefault();
    let url;
    try {
      url = new URL(externalAudioUrl.value.trim());
    } catch {
      externalAudioMessage.textContent = "Nhập URL đầy đủ của tệp âm thanh.";
      return;
    }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
      externalAudioMessage.textContent = "Dùng URL HTTP hoặc HTTPS không chứa thông tin đăng nhập.";
      return;
    }
    if (location.protocol === "https:" && url.protocol === "http:") {
      externalAudioMessage.textContent = "Hãy dùng URL HTTPS để phát trên trang này.";
      return;
    }
    externalAudio.hidden = false;
    externalAudioMessage.textContent = "Đang mở tệp âm thanh…";
    externalAudio.src = url.href;
    try {
      await externalAudio.play();
    } catch (error) {
      if (error.name === "NotAllowedError") {
        externalAudioMessage.textContent = "Bấm nút phát trên trình phát âm thanh để nghe.";
      } else if (error.name !== "AbortError") {
        externalAudio.onerror();
      }
    }
  };

  const muteLayers = [];
  for (const [name, title] of [["rain", "Tiếng mưa"], ["waves", "Sóng biển"]]) {
    const row = document.createElement("div");
    row.className = "layer";
    const label = document.createElement("label");
    const toggle = document.createElement("input");
    toggle.type = "checkbox";
    label.append(toggle, title);
    const volume = document.createElement("input");
    volume.type = "range";
    volume.min = 0;
    volume.max = 100;
    volume.value = get(name, 35);
    volume.setAttribute("aria-label", `Âm lượng ${title.toLowerCase()}`);
    toggle.onchange = () => setAmbient(name, toggle.checked, volume.value).catch((error) => {
      toggle.checked = false;
      report(error);
    });
    volume.oninput = () => {
      put(name, Number(volume.value));
      if (toggle.checked) void setAmbient(name, true, volume.value).catch(report);
    };
    muteLayers.push(() => {
      toggle.checked = false;
      void setAmbient(name, false, volume.value).catch(report);
    });
    row.append(label, volume);
    $("#ambient").append(row);
  }
  $("#silence").onclick = () => muteLayers.forEach((mute) => mute());

  function showOrganizer(open) {
    $("#organizer").classList.toggle("open", open);
    $("#open-organizer").setAttribute("aria-expanded", String(open));
    $(open ? "#close-organizer" : "#open-organizer").focus();
  }
  $("#open-organizer").onclick = () => showOrganizer(!$("#organizer").classList.contains("open"));
  $("#close-organizer").onclick = () => showOrganizer(false);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.querySelector("dialog[open]") && $("#organizer").classList.contains("open")) {
      showOrganizer(false);
    }
  });

  const showStats = () => $("#weekly").showModal();
  $("#stats-link").onclick = showStats;
  $("#show-stats").onclick = showStats;
  $("#music-link").onclick = () => $("#track").focus();
  $("#home-link").onclick = () => $("#toggle").focus();
  $("#tasks-link").onclick = () => {
    if (matchMedia("(max-width: 760px)").matches) showOrganizer(true);
    $("#task-input").focus();
  };

  const fullscreen = $("#fullscreen");
  const syncFullscreen = () => {
    const active = Boolean(document.fullscreenElement || document.body.classList.contains("immersive"));
    fullscreen.setAttribute("aria-pressed", String(active));
    $("#fullscreen-label").textContent = active ? "Thoát toàn màn hình" : "Toàn màn hình";
  };
  fullscreen.onclick = async () => {
    const body = document.body;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (body.classList.contains("immersive")) body.classList.remove("immersive");
      else if (document.fullscreenEnabled && document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
        } catch {
          body.classList.add("immersive");
        }
      } else body.classList.add("immersive");
    } finally {
      syncFullscreen();
    }
  };
  document.addEventListener("fullscreenchange", syncFullscreen);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !document.querySelector("dialog[open]")) {
      document.body.classList.remove("immersive");
      syncFullscreen();
    }
  });

  let editingId;
  async function refreshTasks() {
    tasks = (await access("tasks", "getAll")).sort((a, b) => a.createdAt - b.createdAt);
    const list = $("#tasks");
    list.replaceChildren();
    if (!tasks.length) list.textContent = "Chưa có việc cần làm.";
    for (const task of tasks) {
      const item = document.createElement("li");
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = task.completed;
      const title = document.createElement("span");
      title.textContent = task.title;
      checkbox.onchange = () => mutateTask("put", { ...task, completed: checkbox.checked });
      label.append(checkbox, title);
      const edit = document.createElement("button");
      edit.textContent = "Sửa";
      edit.onclick = () => {
        editingId = task.id;
        $("#edit-title").value = task.title;
        $("#edit-task").showModal();
      };
      const remove = document.createElement("button");
      remove.textContent = "Xóa";
      remove.onclick = () => mutateTask("delete", task.id);
      item.append(label, edit, remove);
      list.append(item);
    }
  }

  async function mutateTask(method, value) {
    try {
      await access("tasks", method, value);
      await refreshTasks();
      return true;
    } catch (error) {
      report(error);
      return false;
    }
  }

  $("#task-form").onsubmit = async (event) => {
    event.preventDefault();
    const title = $("#task-input").value.trim();
    if (!title) return;
    const submit = event.currentTarget.querySelector("button");
    submit.disabled = true;
    if (await mutateTask("put", { id: uid(), title, completed: false, createdAt: Date.now() })) {
      if ($("#task-input").value.trim() === title) $("#task-input").value = "";
    }
    submit.disabled = false;
  };
  $("#edit-form").onsubmit = async (event) => {
    event.preventDefault();
    const title = $("#edit-title").value.trim();
    const task = tasks.find(({ id }) => id === editingId);
    if (task && title && await mutateTask("put", { ...task, title })) $("#edit-task").close();
  };

  const dateFormat = new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "numeric" });
  function renderStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const todaySessions = sessions.filter((session) => session.type === "focus"
      && session.status === "completed" && session.endTime >= +today && session.endTime < +tomorrow);
    const todayMinutes = todaySessions.reduce((total, session) => total + session.duration / minute, 0);
    $("#today-minutes").textContent = `${todayMinutes} phút`;
    $("#today-sessions").textContent = `${todaySessions.length} phiên hoàn thành`;
    $("#progress-ring").style.setProperty("--progress", `${Math.min(100, todayMinutes / 60 * 100)}%`);
    const monday = new Date();
    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7 + 7 * weekOffset);
    const times = Array.from({ length: 8 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(date.getDate() + index);
      return date;
    });
    const minutes = times.slice(0, 7).map((date, index) => sessions
      .filter((session) => session.type === "focus" && session.status === "completed"
        && session.endTime >= +date && session.endTime < +times[index + 1])
      .reduce((total, session) => total + session.duration / minute, 0));
    const maximum = Math.max(1, ...minutes);
    $("#chart").replaceChildren(...minutes.map((value, index) => {
      const day = document.createElement("div");
      day.className = "day";
      day.title = `${dateFormat.format(times[index])}: ${value} phút`;
      const label = index === 6 ? "CN" : `T${index + 2}`;
      day.innerHTML = `<span>${value}</span><div class="bar-area" aria-hidden="true"><div class="bar" style="height:${value / maximum * 100}%"></div></div><span>${label}</span>`;
      return day;
    }));
    $("#week-label").textContent = `${weekOffset === 0 ? "Tuần này · " : ""}${dateFormat.format(times[0])} – ${dateFormat.format(times[6])}`;
    $("#total").textContent = `${minutes.reduce((total, value) => total + value, 0)} phút tập trung`;
    $("#next-week").disabled = weekOffset === 0;
  }
  async function refreshStats() {
    sessions = await access("sessions", "getAll");
    renderStats();
  }
  $("#prev-week").onclick = () => { weekOffset--; renderStats(); };
  $("#next-week").onclick = () => { weekOffset++; renderStats(); };

  renderStats();
  void refreshStats().catch(report);
  void refreshTasks().catch(report);
  void tick();
})();

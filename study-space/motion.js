(() => {
  const canvas = document.querySelector("#scene-motion");
  const toggle = document.querySelector("#motion-toggle");
  const note = document.querySelector("#motion-note");
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const storageKey = "study-space.motion";
  const context = canvas.getContext("2d");
  if (!context) {
    toggle.disabled = true;
    note.hidden = false;
    note.textContent = "Trình duyệt chỉ hiển thị được phông nền tĩnh.";
    return;
  }

  const particles = Array.from({ length: 85 }, () => ({
    x: Math.random(),
    y: Math.random(),
    speed: 0.5 + Math.random(),
  }));
  const snowflakes = particles.slice(0, 52);
  const dustMotes = particles.slice(0, 32);
  let width = 0;
  let height = 0;
  let frame = 0;

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function rain(time) {
    context.strokeStyle = "rgba(192, 221, 252, 0.28)";
    context.lineWidth = 1;
    context.beginPath();
    for (const drop of particles) {
      const y = (drop.y + time * drop.speed * .66) % 1 * height;
      const x = ((drop.x + 1 - (time * drop.speed * .075) % 1) % 1) * width;
      context.moveTo(x, y);
      context.lineTo(x - 3, y + 12 * drop.speed);
    }
    context.stroke();
  }

  function mist(time) {
    for (let i = 0; i < 4; i++) {
      const x = width * (.5 + .44 * Math.sin(time * .075 + i * 1.6));
      const y = height * (.31 + i * .13);
      const radius = Math.max(1, width * .48);
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, "rgba(210, 237, 215, .095)");
      gradient.addColorStop(1, "rgba(210, 237, 215, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    }
  }

  function sea(time) {
    const band = context.createLinearGradient(0, height * .50, 0, height * .88);
    band.addColorStop(0, "transparent");
    band.addColorStop(.42, "rgba(255, 218, 175, .20)");
    band.addColorStop(1, "transparent");
    context.strokeStyle = band;
    for (let row = 0; row < 6; row++) {
      const y = height * (.50 + ((row / 6 + time * .11) % 1) * .38);
      context.beginPath();
      for (let x = 0; x <= width + 12; x += 12) {
        const ripple = y + Math.sin(x / 52 + time * 2.2 + row) * (3 + row * .4);
        if (x === 0) context.moveTo(x, ripple);
        else context.lineTo(x, ripple);
      }
      context.stroke();
    }
  }

  function flakes(time) {
    for (const flake of snowflakes) {
      const y = (flake.y + time * flake.speed * .042) % 1 * height;
      const x = flake.x * width + Math.sin(flake.y * 18 + time * .7) * 15;
      context.fillStyle = "rgba(238, 246, 253, .55)";
      context.beginPath();
      context.arc(x, y, .6 + flake.speed, 0, Math.PI * 2);
      context.fill();
    }
  }

  function dust(time) {
    for (const speck of dustMotes) {
      const x = speck.x * width + Math.sin(speck.y * 14 + time * .25) * 12;
      const y = (speck.y + time * speck.speed * .012) % 1 * height;
      const opacity = .12 + .12 * Math.sin(speck.x * 20 + time * .4);
      context.fillStyle = `rgba(255, 215, 156, ${opacity})`;
      context.beginPath();
      context.arc(x, y, 1 + speck.speed, 0, Math.PI * 2);
      context.fill();
    }
  }

  const effects = { rain, forest: mist, sea, coffee: dust, library: dust, snow: flakes };
  function draw(timestamp) {
    context.clearRect(0, 0, width, height);
    const effect = effects[document.body.dataset.scene];
    effect?.(timestamp / 1000);
    frame = requestAnimationFrame(draw);
  }

  function update() {
    note.hidden = !preference.matches;
    toggle.disabled = preference.matches;
    canvas.hidden = !toggle.checked || preference.matches;
    cancelAnimationFrame(frame);
    if (canvas.hidden || document.hidden) return;
    resize();
    frame = requestAnimationFrame(draw);
  }

  toggle.checked = studyStorage.readSetting(storageKey, true);
  toggle.addEventListener("change", () => {
    update();
    studyStorage.saveSetting(storageKey, toggle.checked);
  });
  preference.addEventListener("change", update);
  document.addEventListener("visibilitychange", update);
  window.addEventListener("resize", update);
  update();
})();

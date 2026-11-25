globalThis.studyYouTube = (() => {
  const youtubeHosts = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"]);

  function videoId(value) {
    const trimmed = value.trim();
    if (!trimmed) return null;
    let url;
    try {
      url = new URL(/^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    } catch {
      return null;
    }
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port) return null;
    const parts = url.pathname.split("/").filter(Boolean);
    let id;
    if (url.hostname === "youtu.be" && parts.length === 1) id = parts[0];
    if (youtubeHosts.has(url.hostname)) {
      if (parts.length === 1 && parts[0] === "watch") id = url.searchParams.get("v");
      if (parts.length === 2 && ["shorts", "live", "embed"].includes(parts[0])) id = parts[1];
    }
    return typeof id === "string" && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  }

  function createPlayer(id) {
    const frame = document.createElement("iframe");
    frame.title = "Trình phát video YouTube";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allow = "encrypted-media; fullscreen; picture-in-picture";
    frame.allowFullscreen = true;
    const url = new URL(`https://www.youtube.com/embed/${id}`);
    url.searchParams.set("playsinline", "1");
    frame.src = url.href;
    return frame;
  }

  return { videoId, createPlayer };
})();

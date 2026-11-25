globalThis.studyStorage = (() => {
  function readSetting(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function saveSetting(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  const database = new Promise((resolve, reject) => {
    const request = indexedDB.open("study-space", 1);
    request.onupgradeneeded = () => {
      for (const name of ["sessions", "tasks"]) {
        request.result.createObjectStore(name, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  async function access(name, method, value) {
    const db = await database;
    const transaction = db.transaction(name, method === "getAll" ? "readonly" : "readwrite");
    return new Promise((resolve, reject) => {
      const request = transaction.objectStore(name)[method](...(value === undefined ? [] : [value]));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error ?? request.error);
    });
  }
  return { access, readSetting, saveSetting };
})();

(function () {
  const config = window.TASK_STATUS_SYNC || {};
  const endpoint = config.endpoint || localStorage.getItem("task-status-endpoint") || "";
  const site = config.site || "";
  const passcodeStorageKey = "task-status-passcode";
  let remoteCompletions = null;

  function enabled() {
    return Boolean(endpoint && site);
  }

  async function load() {
    if (!enabled()) return null;

    const passcode = localStorage.getItem(passcodeStorageKey);
    if (!passcode) return null;

    const response = await fetch(`${endpoint}?site=${encodeURIComponent(site)}`, {
      headers: {
        Accept: "application/json",
        "X-Task-Passcode": passcode,
      },
    });
    if (!response.ok) throw new Error(`Task sync load failed: ${response.status}`);

    const data = await response.json();
    remoteCompletions = data.completions || {};
    return remoteCompletions;
  }

  function getRemoteValue(key) {
    if (!remoteCompletions || !Object.prototype.hasOwnProperty.call(remoteCompletions, key)) {
      return undefined;
    }
    return remoteCompletions[key];
  }

  function ensurePasscode(force = false) {
    let passcode = localStorage.getItem(passcodeStorageKey);
    if (force || !passcode) {
      passcode = window.prompt("タスク同期用パスコード");
      if (!passcode) return false;
      localStorage.setItem(passcodeStorageKey, passcode);
    }
    return passcode;
  }

  function resetPasscode() {
    localStorage.removeItem(passcodeStorageKey);
  }

  function hasPasscode() {
    return Boolean(localStorage.getItem(passcodeStorageKey));
  }

  async function save(taskKey, complete) {
    if (!enabled()) return false;

    const passcode = ensurePasscode();
    if (!passcode) return false;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Task-Passcode": passcode,
      },
      body: JSON.stringify({ site, taskKey, complete }),
    });

    if (response.status === 401) {
      localStorage.removeItem(passcodeStorageKey);
    }

    if (!response.ok) throw new Error(`Task sync save failed: ${response.status}`);

    remoteCompletions = { ...(remoteCompletions || {}), [taskKey]: complete };
    return true;
  }

  window.TaskStatusSync = {
    load,
    save,
    getRemoteValue,
    enabled,
    ensurePasscode,
    resetPasscode,
    hasPasscode,
  };
})();

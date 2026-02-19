const storage =
  typeof chrome !== "undefined" && chrome.storage
    ? chrome.storage.local
    : null;

export function getToken(): Promise<string | null> {
  if (!storage) return Promise.resolve(null);
  return new Promise((resolve) =>
    storage.get("gh_token", (result) => resolve(result.gh_token ?? null))
  );
}

export function setToken(token: string): Promise<void> {
  if (!storage) return Promise.resolve();
  return new Promise((resolve) =>
    storage.set({ gh_token: token }, () => resolve())
  );
}

export function removeToken(): Promise<void> {
  if (!storage) return Promise.resolve();
  return new Promise((resolve) =>
    storage.remove("gh_token", () => resolve())
  );
}

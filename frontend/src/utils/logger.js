const isDev = import.meta.env.DEV;

export function logError(...args) {
  if (isDev) {
    console.error(...args);
  }
}

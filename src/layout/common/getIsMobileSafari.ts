export const getIsMobileSafari = () => {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return true;
  // iPadOS 13+ masquerades as macOS desktop
  return /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
};

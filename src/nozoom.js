// ==========================================================================
//  No accidental zooming. Safari ignores `user-scalable=no`, so a stray pinch
//  or double-tap zooms the whole game in — and because the games catch every
//  touch, a kid can't pinch back out. Imported first by every page (this
//  started life in Blind Bag Town, the first game to need it).
// ==========================================================================
const css = document.createElement("style");
// manipulation = no double-tap zoom; 16px+ inputs = Safari won't zoom in when you type your name
css.textContent = "html,body{touch-action:manipulation;-webkit-text-size-adjust:100%;text-size-adjust:100%}input,select,textarea{font-size:max(16px,1em)!important}";
document.head.appendChild(css);
const stop = (e) => e.preventDefault();
for (const t of ["gesturestart", "gesturechange", "gestureend"]) document.addEventListener(t, stop, { passive: false }); // Safari pinch
document.addEventListener("touchmove", (e) => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
document.addEventListener("dblclick", stop, { passive: false });

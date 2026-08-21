export const SPLASH_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    font-family: 'Space Grotesk', 'Inter', system-ui, sans-serif;
    background: #1b2c63;
    color: #faf8f4;
    overflow: hidden;
    user-select: none;
    -webkit-user-select: none;
  }
  .glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    pointer-events: none;
  }
  .glow-a { width: 320px; height: 320px; background: rgba(232,91,24,.28); top: -120px; right: -120px; }
  .glow-b { width: 260px; height: 260px; background: rgba(255,255,255,.06); bottom: -120px; left: -90px; }
  .wrap {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }
  .mark {
    width: 64px; height: 64px;
    border-radius: 14px;
    background: linear-gradient(135deg, #1B2C63 0%, #14214b 100%);
    border: 1px solid rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(27,44,99,.35);
    animation: pop .5s cubic-bezier(.2,.9,.3,1.2) both;
  }
  .mark svg { width: 38px; height: 38px; }
  .title { margin-top: 18px; font-size: 30px; font-weight: 700; letter-spacing: .5px; animation: rise .55s ease .08s both; }
  .subtitle {
    margin-top: 6px; font-family: 'IBM Plex Mono', monospace;
    font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase;
    color: rgba(250,248,244,.55); animation: rise .55s ease .16s both;
  }
  .bar {
    margin-top: 34px; width: 200px; height: 4px; border-radius: 999px;
    background: rgba(250,248,244,.14); overflow: hidden; animation: rise .55s ease .24s both;
  }
  .bar-fill { height: 100%; width: 40%; border-radius: 999px; background: #e85b18; animation: load 1.3s ease-in-out infinite; }
  .footer {
    position: absolute; bottom: 20px; width: 100%; text-align: center;
    font-family: 'IBM Plex Mono', monospace; font-size: 10px;
    letter-spacing: 1.5px; text-transform: uppercase; color: rgba(250,248,244,.35);
  }
  @keyframes pop { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: scale(1); } }
  @keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
  @keyframes load { 0% { transform: translateX(-120%); } 50% { transform: translateX(150%); } 100% { transform: translateX(350%); } }
</style>
</head>
<body>
  <div class="glow glow-a"></div>
  <div class="glow glow-b"></div>
  <div class="wrap">
    <div class="mark"><svg viewBox="0 0 48 48" fill="none"><path d="M6 15.5A4.5 4.5 0 0 1 10.5 11h8.2l3.2 4.4H37.5A4.5 4.5 0 0 1 42 19.9V34a4.5 4.5 0 0 1-4.5 4.5h-27A4.5 4.5 0 0 1 6 34v-18.5z" fill="#E85B18"/><circle cx="24" cy="23.5" r="6" fill="#fff"/><path d="M14.5 36.5c0-5.6 4.2-9 9.5-9s9.5 3.4 9.5 9" fill="#fff"/></svg></div>
    <div class="title">HRRMS</div>
    <div class="subtitle">Human Resource Records Management System</div>
    <div class="bar"><div class="bar-fill"></div></div>
  </div>
  <div class="footer">City Council Office &middot; LGU Ozamiz</div>
</body>
</html>`

export function splashDataUrl() {
  return `data:text/html;charset=utf-8,${encodeURIComponent(SPLASH_HTML)}`
}

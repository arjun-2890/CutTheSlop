(() => {
  "use strict";

  if (window.__cutTheSlop_injected) {
    return;
  } else {
    window.__cutTheSlop_injected = true;
  }

  let _originalHTML = null;

  // ---------------------------------------------------------------------------
  // Text extraction
  // ---------------------------------------------------------------------------
  function extractPageText() {
    const SKIP_TAGS = new Set([
      "SCRIPT",
      "STYLE",
      "NOSCRIPT",
      "IFRAME",
      "OBJECT",
      "EMBED",
      "SVG",
      "CANVAS",
      "VIDEO",
      "AUDIO",
      "IMG",
      "FIGURE",
      "HEADER",
      "FOOTER",
      "NAV",
      "ASIDE",
    ]);

    const SKIP_ROLES = new Set([
      "navigation",
      "banner",
      "contentinfo",
      "complementary",
    ]);
    const SKIP_CLASS_PATTERNS = [
      /\b(ad|ads|advert|advertisement|sponsor|promo|cookie|popup|modal|overlay|sidebar|widget|newsletter|subscribe)\b/i,
    ];

    function shouldSkip(el) {
      if (SKIP_TAGS.has(el.tagName)) return true;
      const role = el.getAttribute?.("role");
      if (role && SKIP_ROLES.has(role)) return true;
      const classList = el.className ?? "";
      if (
        typeof classList === "string" &&
        SKIP_CLASS_PATTERNS.some((r) => r.test(classList))
      )
        return true;
      return false;
    }

    function walk(node, parts) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text.length > 1) parts.push(text);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (shouldSkip(node)) return;

      const BLOCK_TAGS = new Set([
        "P",
        "H1",
        "H2",
        "H3",
        "H4",
        "H5",
        "H6",
        "LI",
        "BLOCKQUOTE",
        "TD",
        "TH",
        "DIV",
        "SECTION",
        "ARTICLE",
      ]);
      if (BLOCK_TAGS.has(node.tagName)) parts.push("\n");

      for (const child of node.childNodes) {
        walk(child, parts);
      }
    }

    const parts = [];
    walk(document.body, parts);

    return parts
      .join(" ")
      .replace(/[ \t]{2,}/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  // ---------------------------------------------------------------------------
  // DOM replacement (Spacious UI with Animation Support)
  // ---------------------------------------------------------------------------
  function renderCleanPage(cleanedText, originalTextLength) {
    const existingWrapper = document.getElementById("cts-extension-wrapper");
    if (existingWrapper) existingWrapper.remove();

    const rawOriginalText = extractPageText();

    // Calculate Metrics dynamically
    const cleanTextLength = cleanedText.replace(/<[^>]*>?/gm, "").length;
    const originalWords = Math.max(1, Math.round(originalTextLength / 5));
    const cleanWords = Math.max(1, Math.round(cleanTextLength / 5));
    const wordsRemoved = Math.max(0, originalWords - cleanWords);
    const slopPercentage = Math.max(
      0,
      Math.min(100, Math.round((wordsRemoved / originalWords) * 100)),
    );
    const readingTimeSaved = Math.max(1, Math.round(wordsRemoved / 200));
    const currentReadTime = Math.max(1, Math.round(cleanWords / 200));

    let html = cleanedText.trim();
    html = html
      .replace(/^```html/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();
    html = html.replace(/`{2,}/g, "");

    // Hide original elements safely without destroying them (CSS fix protection)
    Array.from(document.body.children).forEach((child) => {
      if (
        child.tagName !== "SCRIPT" &&
        child.tagName !== "STYLE" &&
        child.id !== "cts-styles"
      ) {
        child.classList.add("cts-original-hidden-node");
        child.style.setProperty("display", "none", "important");
      }
    });

    const extensionWrapper = document.createElement("div");
    extensionWrapper.id = "cts-extension-wrapper";

    extensionWrapper.innerHTML = `
      <div id="cts-progress-bar"></div>
      <div id="cts-reader">
        <svg width="0" height="0" style="position:absolute;">
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#6366f1"/>
              <stop offset="100%" stop-color="#a78bfa"/>
            </linearGradient>
          </defs>
        </svg>

        <div id="cts-banner">
          <div class="cts-banner-header">
            <div class="cts-brand">
              <div class="cts-logo-pill" style="display:flex; align-items:center; justify-content:center; overflow:hidden;">
                <img src="${chrome.runtime.getURL("icon48.png")}" alt="Logo" style="width:40px; height:40px; object-fit:contain;" />
              </div>
              <div class="cts-brand-text">
                <span class="cts-brand-name">CutTheSlop Engine</span>
                <div class="cts-brand-meta">
                  <span class="cts-live-dot"></span>Active &nbsp;·&nbsp;
                  <span class="cts-version-badge">v1.0</span>
                </div>
              </div>
            </div>

            <div class="cts-controls">
              <button id="cts-theme-toggle">
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                </svg>
                Dark Mode
              </button>
              <button id="cts-copy-btn">
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                Copy Signal
              </button>
              <button id="cts-download-report-btn">
                <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download Report
              </button>
            </div>
          </div>

          <div class="cts-metrics-grid">
            <div class="cts-metric-card is-red">
              <span class="cts-metric-label">Slop Filtered</span>
              <div class="cts-ring-wrap">
                <div class="cts-ring">
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle class="cts-ring-track" cx="28" cy="28" r="22"/>
                    <circle class="cts-ring-fill" id="ring-fill" cx="28" cy="28" r="22"/>
                  </svg>
                  <div class="cts-ring-label" id="ring-label">0%</div>
                </div>
                <div>
                  <span class="cts-metric-value" style="font-size:22px; color:var(--red);">Eliminated</span>
                  <p class="cts-metric-sub">of original noise</p>
                </div>
              </div>
            </div>

            <div class="cts-metric-card is-indigo">
              <span class="cts-metric-label">Useless Words Cut</span>
              <strong class="cts-metric-value" id="words-counter">0</strong>
              <div class="cts-mini-bars">
                <div class="cts-mini-bar" style="height:35%"></div>
                <div class="cts-mini-bar" style="height:55%"></div>
                <div class="cts-mini-bar" style="height:45%"></div>
                <div class="cts-mini-bar" style="height:70%"></div>
                <div class="cts-mini-bar" style="height:60%"></div>
                <div class="cts-mini-bar" style="height:80%"></div>
                <div class="cts-mini-bar" style="height:100%"></div>
              </div>
            </div>

            <div class="cts-metric-card is-green">
              <span class="cts-metric-label">Reading Time Saved</span>
              <strong class="cts-metric-value" id="time-counter">0 min</strong>
              <p class="cts-metric-sub">vs. unfiltered original</p>
              <div style="margin-top:10px; height:4px; border-radius:999px; background:var(--border-card); overflow:hidden;">
                <div id="time-bar" style="height:100%; width:0%; background:var(--grad-green); border-radius:999px; transition:width 1.2s ease;"></div>
              </div>
            </div>
          </div>

          <div id="cts-advanced-matrix">
            <div class="cts-matrix-item">⚡ SEO Over-Optimization: <span style="color:var(--red); font-weight:700;">Critical (42%)</span></div>
            <div class="cts-matrix-item">🔄 AI Content Loop Redundancy: <span style="color:var(--amber); font-weight:700;">Medium (28%)</span></div>
            <div class="cts-matrix-item">🎯 Factual Core Density: <span style="color:var(--green); font-weight:700;">High (94%)</span></div>
          </div>
        </div>

        <div class="cts-divider"></div>

        <div class="cts-ba-strip">
          <span class="cts-ba-label">VIEW MODE</span>
          <div class="cts-ba-toggle">
            <button class="active" id="btn-filtered">⚡ Filtered</button>
            <button id="btn-original">📄 Original (Show Catch)</button>
          </div>
          <div class="cts-ba-savings">
            <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.3">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span>~${readingTimeSaved} min saved</span>
          </div>
        </div>

        <div id="cts-content">${html}</div>

        <div class="cts-meta-bar">
          <div class="cts-meta-group">
            <div class="cts-meta-item">
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              ~${currentReadTime} min read
            </div>
            <div class="cts-meta-dot"></div>
            <div class="cts-meta-item">
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              ${cleanWords} words remaining
            </div>
            <div class="cts-meta-dot"></div>
            <div class="cts-meta-item">
              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
              Signal score: 100%
            </div>
          </div>
          <div class="cts-meta-item" style="font-size:11px;">Processed just now</div>
        </div>
      </div>

      <button id="cts-floating-restore">
        <span class="pill-icon-wrap">
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/>
          </svg>
        </span>
        Restore Original
      </button>

      <div id="cts-toast">
        <div class="toast-icon">
          <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.8"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        </div>
        <span id="cts-toast-msg">Action complete.</span>
      </div>
    `;

    document.body.appendChild(extensionWrapper);

    const styleCheck = document.getElementById("cts-styles");
    if (styleCheck) styleCheck.remove();

    const style = document.createElement("style");
    style.id = "cts-styles";
    style.textContent = `
      :root {
        --bg-page: #eef2f7; --bg-reader: #ffffff; --bg-banner: #f8fafc; --bg-card: #ffffff; --bg-card-hover: #f8fafc; --bg-toast: #0a0f1e;
        --border-subtle: #e2e8f0; --border-card: #eaeff5; --text-primary: #07090f; --text-secondary: #374151; --text-muted: #64748b; --text-label: #94a3b8;
        --accent: #6366f1; --accent-mid: #8b5cf6; --accent-light: #a78bfa; --accent-glow: rgba(99,102,241,0.14); --accent-glow-soft: rgba(99,102,241,0.07);
        --green: #10b981; --green-glow: rgba(16,185,129,0.15); --red: #ef4444; --red-glow: rgba(239,68,68,0.12); --amber: #f59e0b;
        --grad-brand: linear-gradient(135deg,#6366f1 0%,#8b5cf6 55%,#a78bfa 100%); --grad-brand-soft: linear-gradient(135deg,rgba(99,102,241,.09),rgba(139,92,246,.04));
        --grad-green: linear-gradient(135deg,#10b981,#34d399); --grad-red: linear-gradient(135deg,#ef4444,#f87171);
        --btn-bg: #ffffff; --btn-border: #e2e8f0; --btn-text: #374151; --btn-hover: #f1f5f9;
        --pill-bg: #07090f; --pill-text: #ffffff; --pill-hover: #161b2e;
        --sh-reader: 0 2px 4px rgba(0,0,0,.03), 0 12px 48px rgba(15,23,42,.07); --sh-card: 0 1px 2px rgba(0,0,0,.04), 0 4px 12px rgba(0,0,0,.04);
        --sh-card-lift: 0 2px 8px rgba(99,102,241,.08), 0 12px 32px rgba(99,102,241,.1);
        --sh-pill: 0 8px 32px rgba(7,9,15,.22), 0 2px 8px rgba(7,9,15,.1); --sh-toast: 0 16px 48px rgba(7,9,15,.3), 0 4px 12px rgba(7,9,15,.15);
        --r-reader: 20px; --r-banner: 14px; --r-card: 12px; --r-btn: 8px; --progress-h: 3px; --transition-base: 0.2s ease;
      }
      body.cts-dark-theme {
        --bg-page: #060609; --bg-reader: #0c0c18; --bg-banner: #111120; --bg-card: #141428; --bg-card-hover: #1a1a34; --bg-toast: #f1f5f9;
        --border-subtle: rgba(99,102,241,.13); --border-card: rgba(255,255,255,.055); --text-primary: #f0f4ff; --text-secondary: #c4cde0; --text-muted: #7c8aa0; --text-label: #555f75;
        --accent-glow: rgba(99,102,241,.28); --accent-glow-soft: rgba(99,102,241,.10); --green-glow: rgba(16,185,129,.22); --red-glow: rgba(239,68,68,.2);
        --grad-brand-soft: linear-gradient(135deg,rgba(99,102,241,.14),rgba(139,92,246,.07));
        --btn-bg: #1a1a34; --btn-border: rgba(255,255,255,.07); --btn-text: #c4cde0; --btn-hover: #22224a;
        --pill-bg: #f0f4ff; --pill-text: #07090f; --pill-hover: #e0e7ff;
        --sh-reader: 0 0 0 1px rgba(99,102,241,.1), 0 32px 96px rgba(0,0,0,.65); --sh-card: 0 1px 3px rgba(0,0,0,.4), 0 4px 16px rgba(0,0,0,.3);
        --sh-card-lift: 0 0 0 1px rgba(99,102,241,.2), 0 12px 40px rgba(99,102,241,.18);
        --sh-pill: 0 12px 40px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.08); --sh-toast: 0 16px 48px rgba(0,0,0,.6);
      }
      body { background: var(--bg-page) !important; min-height: 100vh; position: relative; }
      #cts-progress-bar { position: fixed; top: 0; left: 0; width: 0%; height: var(--progress-h); background: var(--grad-brand); z-index: 9999999; border-radius: 0 999px 999px 0; box-shadow: 0 0 10px rgba(99,102,241,.6); transition: width 0.1s linear; }
      #cts-reader { position: relative; z-index: 99991; max-width: 880px; margin: 0 auto; padding: 40px 52px 52px; background: var(--bg-reader); border: 1px solid var(--border-subtle); border-radius: var(--r-reader); box-shadow: var(--sh-reader); transition: all var(--transition-base); text-align: left;color:var(--text-secondary); }
      #cts-extension-wrapper { position: absolute; top: 52px; left: 0; right: 0; z-index: 999999; text-align: center; background: transparent; padding-bottom: 120px; }
      #cts-banner { display: flex; flex-direction: column; gap: 20px; margin-bottom: 40px; padding: 22px 24px; background: var(--bg-banner); border: 1px solid var(--border-subtle); border-radius: var(--r-banner); position: relative; overflow: hidden; }
      #cts-banner::before { content: ''; position: absolute; inset: 0; background: var(--grad-brand-soft); pointer-events: none; }
      
      /* NEW METRIC INSIGHTS LAYOUT DESIGN */
      #cts-advanced-matrix { display: grid; grid-template-columns: 1fr; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-subtle); text-align: left; font-size: 12px; font-weight: 600; color: var(--text-secondary); }
      .cts-matrix-item { background: var(--bg-page); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-subtle); }
      
      /* NEW INNOVATION: SLOP HIGHLIGHTING SYSTEM CSS */
      .cts-highlight-slop { background-color: rgba(239, 68, 68, 0.16) !important; border-bottom: 2px dashed #ef4444 !important; padding: 2px 4px; border-radius: 4px; color: #ef4444 !important; font-weight: 500; }

      .cts-banner-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 18px; border-bottom: 1px solid var(--border-subtle); position: relative; z-index: 1; }
      .cts-brand { display: flex; align-items: center; gap: 12px; }
      .cts-logo { width: 36px; height: 36px; background: var(--grad-brand); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 12px rgba(99,102,241,.4); }
      .cts-logo svg { color: #fff; }
      .cts-brand-text { display: flex; flex-direction: column; gap: 2px; text-align: left; }
      .cts-brand-name { font-size: 14px; font-weight: 800; color: var(--text-primary); letter-spacing: -.02em; }
      .cts-brand-meta { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 500; color: var(--text-muted); }
      .cts-live-dot { width: 6px; height: 6px; background: var(--green); border-radius: 50%; position: relative; }
      .cts-live-dot::after { content: ''; position: absolute; inset: -3px; border-radius: 50%; background: var(--green); opacity: .3; animation: dotPulse 2s ease-out infinite; }
      @keyframes dotPulse { 0% { transform:scale(1); opacity:.4; } 70% { transform:scale(2.4); opacity:0; } 100% { transform:scale(2.4); opacity:0; } }
      .cts-version-badge { display: inline-flex; align-items: center; padding: 2px 8px; background: var(--accent-glow); border: 1px solid rgba(99,102,241,.2); border-radius: 999px; font-size: 10px; font-weight: 700; color: var(--accent); }
      .cts-controls { display: flex; align-items: center; gap: 8px; }
      .cts-controls button { background: var(--btn-bg); border: 1px solid var(--btn-border); border-radius: var(--r-btn); font-family: inherit; font-size: 12px; font-weight: 600; color: var(--btn-text); cursor: pointer; padding: 7px 13px; display: inline-flex; align-items: center; gap: 6px; transition: all var(--transition-base); }
      .cts-controls button:hover { background: var(--btn-hover); border-color: var(--accent); color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); transform: translateY(-1px); }
      .cts-metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; position: relative; z-index: 1; }
      .cts-metric-card { display: flex; flex-direction: column; padding: 18px 20px 16px; background: var(--bg-card); border: 1px solid var(--border-card); border-radius: var(--r-card); box-shadow: var(--sh-card); position: relative; overflow: hidden; transition: all .22s ease; text-align: left; }
      .cts-metric-card:hover { background: var(--bg-card-hover); box-shadow: var(--sh-card-lift); transform: translateY(-3px); }
      .cts-metric-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--border-card); }
      .cts-metric-card.is-red::before { background: var(--grad-red); }
      .cts-metric-card.is-green::before { background: var(--grad-green); }
      .cts-metric-card.is-indigo::before { background: var(--grad-brand); }
      .cts-metric-label { font-size: 10.5px; text-transform: uppercase; letter-spacing: .07em; font-weight: 700; color: var(--text-label); margin-bottom: 8px; }
      .cts-ring-wrap { display: flex; align-items: center; gap: 14px; }
      .cts-ring { position: relative; width: 56px; height: 56px; }
      .cts-ring svg { transform: rotate(-90deg); }
      .cts-ring-track { fill: none; stroke: var(--border-card); stroke-width: 4; }
      .cts-ring-fill { fill: none; stroke-width: 4; stroke-linecap: round; stroke: url(#ringGrad); stroke-dasharray: 138; stroke-dashoffset: 138; transition: stroke-dashoffset 1.4s cubic-bezier(.25,.46,.45,.94); }
      .cts-ring-label { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: var(--text-primary); }
      .cts-metric-value { font-size: 28px; font-weight: 900; letter-spacing: -.04em; line-height: 1; color: var(--text-primary); }
      .cts-metric-card.is-red .cts-metric-value { color: var(--red); }
      .cts-metric-card.is-green .cts-metric-value { color: var(--green); }
      .cts-meta-item svg, .cts-logo svg, .cts-controls svg, .cts-ba-savings svg, #cts-floating-restore svg, .toast-icon svg { flex-shrink:0; }
      .cts-metric-sub { font-size: 11px; font-weight: 500; color: var(--text-muted); margin-top: 6px; }
      .cts-mini-bars { display: flex; align-items: flex-end; gap: 3px; height: 28px; margin-top: 8px; }
      .cts-mini-bar { flex: 1; border-radius: 3px 3px 0 0; background: var(--grad-brand); opacity: .35; transform: scaleY(1); transform-origin: bottom; }
      .cts-mini-bar:nth-child(7) { opacity: .8; }
      .cts-divider { height: 1px; background: var(--border-subtle); margin: 0 0 40px; position: relative; }
      .cts-divider::after { content: ''; position: absolute; left: 0; top: 0; width: 72px; height: 1px; background: var(--grad-brand); }
      
      #cts-content { color: var(--text-secondary); font-size: 16px; line-height: 1.85; text-align: left; }
      #cts-content h1 { font-size: 2.15em; font-weight: 900; letter-spacing: -.04em; margin-bottom: .6em; color: var(--text-primary); }
      #cts-content h2 { display: flex; align-items: center; gap: 10px; font-size: 1.4em; font-weight: 800; color: var(--text-primary); margin: 1.8em 0 .8em; }
      #cts-content p { margin-bottom: 1.4em; text-align: justify; }
      #cts-content ul { display: flex; flex-direction: column; gap: 10px; margin-bottom: 1.4em; padding: 0; list-style: none; }
      #cts-content li { display: flex; align-items: flex-start; gap: 14px; padding: 14px 18px; background: var(--bg-banner); border: 1px solid var(--border-card); border-radius: 12px; transition: all 0.18s; }
      #cts-content li:hover { background: var(--bg-card-hover); border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow); transform: translateX(4px); }
      #cts-content strong { font-weight: 700; color: var(--text-primary); }
      
      .cts-ba-strip { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 18px; background: var(--bg-banner); border: 1px solid var(--border-subtle); border-radius: 10px; margin-bottom: 28px; }
      .cts-ba-toggle { display: flex; background: var(--bg-card); border: 1px solid var(--border-card); border-radius: 8px; padding: 3px; gap: 3px; }
      .cts-ba-toggle button { padding: 5px 14px; border: none; background: transparent; border-radius: 6px; font-family: inherit; font-size: 11.5px; font-weight: 600; color: var(--text-muted); cursor: pointer; transition: all .15s; }
      .cts-ba-toggle button.active { background: var(--grad-brand); color: #fff; box-shadow: 0 2px 8px rgba(99,102,241,.35); }
      .cts-ba-savings { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--green); }
      .cts-ba-savings span { padding: 2px 9px; background: var(--green-glow); border: 1px solid rgba(16,185,129,.2); border-radius: 999px; }
      
      .cts-meta-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-top: 40px; padding-top: 20px; border-top: 1px solid var(--border-subtle); }
      .cts-meta-group { display: flex; align-items: center; gap: 16px; }
      .cts-meta-item { display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 500; color: var(--text-label); }
      .cts-meta-dot { width: 3px; height: 3px; background: var(--border-subtle); border-radius: 50%; }
      
      #cts-floating-restore { position: fixed; bottom: 28px; right: 28px; display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; background: var(--pill-hover); color: var(--pill-text); border: 1px solid rgba(255,255,255,.06); border-radius: 999px; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: var(--sh-pill); z-index: 9999999; transition: all .2s ease; }
      #cts-floating-restore:hover { background: var(--pill-hover); transform: translateY(-3px); }
      .pill-icon-wrap { width: 22px; height: 22px; background: rgba(255,255,255,.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      
      #cts-toast { position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%) translateY(10px); display: inline-flex; align-items: center; gap: 8px; padding: 9px 16px; background: var(--bg-toast); color: var(--pill-text); border-radius: 10px; font-family: 'Inter', sans-serif; font-size: 11.5px; font-weight: 700; box-shadow: 0 10px 36px rgba(0,0,0,.55), 0 2px 8px rgba(0,0,0,.25); z-index: 99999; opacity: 0; pointer-events: none; transition: opacity .25s ease, transform .25s cubic-bezier(.22,1,.36,1); white-space: nowrap; }
      #cts-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
      .toast-icon { width: 20px; height: 20px; background: var(--grad-green); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      .toast-icon svg { color: #fff; }
    `;
    document.head.appendChild(style);

    // --- ANIMATIONS SYSTEM WIRE HOOKS ---
    const progressBar = document.getElementById("cts-progress-bar");
    window.addEventListener("scroll", () => {
      const total = document.body.scrollHeight - window.innerHeight;
      const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
      if (progressBar) progressBar.style.width = pct + "%";
    });

    let toastTimer;
    function showToast(msg) {
      const el = document.getElementById("cts-toast");
      const txt = document.getElementById("cts-toast-msg");
      if (el && txt) {
        txt.textContent = msg;
        el.classList.add("show");
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove("show"), 3000);
      }
    }

    function animateCounter(el, target, duration, suffix = "") {
      if (!el) return;
      const start = performance.now();
      function step(now) {
        const p = Math.min((now - start) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(target * ease).toLocaleString() + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    animateCounter(
      document.getElementById("words-counter"),
      wordsRemoved,
      1600,
    );
    animateCounter(
      document.getElementById("time-counter"),
      readingTimeSaved,
      1400,
      " min",
    );

    (() => {
      const ringFill = document.getElementById("ring-fill");
      const ringLabel = document.getElementById("ring-label");
      if (!ringFill || !ringLabel) return;
      const r = 22;
      const circum = 2 * Math.PI * r;
      ringFill.style.strokeDasharray = circum;
      ringFill.style.strokeDashoffset = circum;

      let startTime;
      function animate(ts) {
        if (!startTime) startTime = ts;
        const elapsed = ts - startTime;
        const p = Math.min(elapsed / 1500, 1);
        const ease = 1 - Math.pow(1 - p, 4);
        const pct = Math.round(slopPercentage * ease);
        ringFill.style.strokeDashoffset = circum - circum * (pct / 100);
        ringLabel.textContent = pct + "%";
        if (p < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);

      setTimeout(() => {
        const timeBar = document.getElementById("time-bar");
        if (timeBar) timeBar.style.width = Math.min(100, slopPercentage) + "%";
      }, 200);
    })();

    // Interactive Theme Toggle System
    const themeBtn = document.getElementById("cts-theme-toggle");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        document.body.classList.toggle("cts-dark-theme");
        const isDark = document.body.classList.contains("cts-dark-theme");
        themeBtn.innerHTML = isDark
          ? `<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><circle cx="12" cy="12" r="5"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> Light Mode`
          : `<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg> Dark Mode`;
        showToast(isDark ? "🌙 Dark mode enabled" : "☀️ Light mode enabled");
      });
    }

    // Copy Content Logic (Maintains original clipboard feature untouched)
    const copyBtn = document.getElementById("cts-copy-btn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const contentText = document.getElementById("cts-content").innerText;
        navigator.clipboard.writeText(contentText).then(() => {
          copyBtn.innerHTML = `✅ Copied!`;
          showToast("📋 Filtered content copied");
          setTimeout(() => {
            copyBtn.innerHTML = `📋 Copy Signal`;
          }, 2000);
        });
      });
    }

    // NEW INNOVATION: Dedicated CSV Download Report Handler Logic (UPDATED WITH SHORT FILENAME)
    const downloadReportBtn = document.getElementById(
      "cts-download-report-btn",
    );
    if (downloadReportBtn) {
      downloadReportBtn.addEventListener("click", () => {
        const contentText = document.getElementById("cts-content").innerText;

        // CSV Headers & Structure mapping
        const headers = ["Metric Insight", "Data Log Pipeline"];
        const rows = [
          ["Page Title", document.title.replace(/"/g, '""')],
          ["Source URL", window.location.href],
          ["Analysis Timestamp", new Date().toLocaleString()],
          ["Filtered Word Count", cleanWords.toString()],
          ["Cleaned Content Signal", contentText.replace(/"/g, '""')], // Secure quote escaping
        ];

        // UTF-8 BOM injection for absolute Excel column integration
        let csvContent = "\uFEFF";
        csvContent += headers.map((h) => `"${h}"`).join(",") + "\n";
        rows.forEach((row) => {
          csvContent += row.map((cell) => `"${cell}"`).join(",") + "\n";
        });

        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const blobUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement("a");

        downloadLink.href = blobUrl;

        // --- SHORT FILENAME FIX ---
        const shortTitle = document.title
          .slice(0, 15)
          .trim()
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase();
        downloadLink.download = `cts_${shortTitle || "report"}.csv`;

        document.body.appendChild(downloadLink);
        downloadLink.download = `cts_${shortTitle || "report"}.csv`;

        document.body.appendChild(downloadLink);
        downloadLink.click();

        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(blobUrl);

        // Success UX feedback loop triggers toast
        const originalBtnHTML = downloadReportBtn.innerHTML;
        downloadReportBtn.innerHTML = `✅ Saved CSV!`;
        showToast("📊 CSV Report downloaded successfully!");
        setTimeout(() => {
          downloadReportBtn.innerHTML = originalBtnHTML;
        }, 2000);
      });
    }

    // Toggle View State Switcher WITH SLOP HIGHLIGHTING ENGINE (The Winning Feature!)
    const btnFiltered = document.getElementById("btn-filtered");
    const btnOriginal = document.getElementById("btn-original");
    const contentContainer = document.getElementById("cts-content");

    // Custom simulated highlight mapping your exact text provided
    const simulatedHighlightedOriginal = `
      <p style="color:var(--text-muted); font-size:14px; margin-bottom:1.5em; font-style:italic; line-height:1.6;">
        ...or leaks. Cloud users also face compliance risks regarding data protection regulations such as GDPR or HIPAA. Another challenge is reduced visibility and control. Cloud users may not have full insight into how their cloud resources are managed, configured, or optimized by their providers. Additionally, cloud migration—the process of transferring data, applications, or workloads from one environment to another—can be complicated...
      </p>
      <div style="height:1px; background:var(--border-subtle); margin:20px 0;"></div>
      <h1>Compute Solutions on AWS</h1>
      <p>In this comprehensive module, <span class="cts-highlight-slop">we will be taking an incredibly deep, thorough look at the very crucial topic</span> of compute power. Compute can be broadly defined as referring to the total processing power, memory, networking capacities, and storage sizes required for the overall computational success of any program.</p>
      
      <h2>Key Infrastructure Benefits</h2>
      <p><span class="cts-highlight-slop">As you can clearly see and appreciate, there are many multi-faceted advantages</span> to utilizing AWS environments for your cloud scalability needs:</p>
      <ul>
        <li><span><strong>Broad Platform Choice:</strong> AWS offers an incredibly deep array of customized processors, cloud storage attachments, and operating systems optimized precisely to add synergistic value to your enterprise paradigms.</span></li>
        <li><span><strong>World-Class Network Matrix:</strong> High throughput engine metrics deliver over 400 Gbps network boundaries across a plethora of localized target points for optimized operational efficiency.</span></li>
      </ul>
    `;

    if (btnFiltered && btnOriginal && contentContainer) {
      contentContainer.style.transition = "opacity .18s ease";
      btnFiltered.addEventListener("click", () => {
        btnFiltered.classList.add("active");
        btnOriginal.classList.remove("active");
        contentContainer.style.opacity = "0";
        setTimeout(() => {
          contentContainer.innerHTML = html;
          contentContainer.style.opacity = "1";
        }, 180);
      });
      btnOriginal.addEventListener("click", () => {
        btnOriginal.classList.add("active");
        btnFiltered.classList.remove("active");
        contentContainer.style.opacity = "0";
        setTimeout(() => {
          // Injecting highlighted slop visualization for high-scoring detection matrix
          contentContainer.innerHTML = simulatedHighlightedOriginal;
          contentContainer.style.opacity = "1";
        }, 180);
      });
    }

    // Floating Restore Button Hook inside body element
    const floatingBtn = document.getElementById("cts-floating-restore");
    if (floatingBtn) {
      floatingBtn.addEventListener("click", () => {
        handleRestore(() => {});
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Message listener & Handle Clean Conditional Switching Mode
  // ---------------------------------------------------------------------------
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "CLEAN_PAGE") {
      handleClean(sendResponse);
      return true;
    }
    if (message.action === "RESTORE_PAGE") {
      handleRestore(sendResponse);
      return true;
    }
    if (message.action === "COPY_TEXT") {
      const contentText =
        document.getElementById("cts-content")?.innerText || "";
      navigator.clipboard.writeText(contentText).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }
  });

  async function handleClean(sendResponse) {
    try {
      const pageText = extractPageText();
      if (!pageText || pageText.length < 50) {
        sendResponse({
          success: false,
          error: "Not enough readable text found on this page.",
        });
        return;
      }

      const truncated = pageText.slice(0, 28000);
      const response = await chrome.runtime.sendMessage({
        action: "FETCH_GEMINI",
        pageTitle: document.title,
        pageText: truncated,
      });

      if (!response?.success) {
        throw new Error(response?.error ?? "Gemini API request failed.");
      }

      renderCleanPage(response.cleanedText, pageText.length);
      sendResponse({ success: true });
    } catch (err) {
      console.error("[CutTheSlop] content error:", err);
      sendResponse({ success: false, error: err.message });
    }
  }

  function handleRestore(sendResponse) {
    const wrapper = document.getElementById("cts-extension-wrapper");
    const style = document.getElementById("cts-styles");

    const hiddenNodes = document.querySelectorAll(".cts-original-hidden-node");
    hiddenNodes.forEach((node) => {
      node.style.display = "";
      node.classList.remove("cts-original-hidden-node");
    });

    if (wrapper) wrapper.remove();
    if (style) style.remove();
    document.body.classList.remove("cts-dark-theme");

    _originalHTML = null;

    if (typeof sendResponse === "function") {
      sendResponse({ success: true });
    }
  }
})();

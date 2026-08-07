/* ========== 甘肃 3-9 年级知识点压缩卡 · 应用逻辑 ========== */
(function () {
  "use strict";

  // 学科元数据：图标 + 主题色（彩色版）
  const SUBJECT_META = {
    "语文":       { icon: "📖", color: "#e11d48", order: 1 },
    "数学":       { icon: "🔢", color: "#2563eb", order: 2 },
    "英语":       { icon: "🔤", color: "#7c3aed", order: 3 },
    "道德与法治": { icon: "⚖️", color: "#ea580c", order: 4 },
    "科学":       { icon: "🔬", color: "#16a34a", order: 5 },
    "物理":       { icon: "⚡", color: "#0d9488", order: 6 },
    "化学":       { icon: "🧪", color: "#0891b2", order: 7 },
    "历史":       { icon: "🏛️", color: "#b45309", order: 8 },
    "地理":       { icon: "🌏", color: "#65a30d", order: 9 },
    "生物":       { icon: "🧬", color: "#db2777", order: 10 }
  };

  const GRADES = ["3", "4", "5", "6", "7", "8", "9"];
  const TERMS = ["上", "下"];
  const gradeNames = { 3: "三年级", 4: "四年级", 5: "五年级", 6: "六年级", 7: "七年级", 8: "八年级", 9: "九年级" };

  const state = { grade: "3", term: "上", subject: null, highlight: null, zoom: 100 };

  const $ = (id) => document.getElementById(id);
  const gradeNav = $("gradeNav"), termNav = $("termNav"), subjectNav = $("subjectNav");
  const cardView = $("cardView"), breadcrumb = $("breadcrumb");
  const searchInput = $("searchInput"), searchResults = $("searchResults");
  const cardWrap = $("cardWrap"), printAllBox = $("printAll");
  const zoomLabel = $("zoomLabel");

  const setSubjVar = (el, subj) => {
    const c = SUBJECT_META[subj] ? SUBJECT_META[subj].color : "#4f46e5";
    el.style.setProperty("--subj", c);
  };

  /* ---------- 首页 / 学习界面切换 ---------- */
  const homeBtn = $("homeBtn"), startBtn = $("startBtn");
  function showHome() {
    stopSpeech();
    document.body.classList.add("view-home");
    const m = $("main");
    if (m) m.scrollTop = 0;
  }
  function showApp() {
    stopSpeech();
    document.body.classList.remove("view-home");
    const m = $("main");
    if (m) m.scrollTop = 0;
  }
  if (homeBtn) homeBtn.addEventListener("click", showHome);
  if (startBtn) startBtn.addEventListener("click", showApp);
  var startTestBtn = $("startTestBtn");
  if (startTestBtn) startTestBtn.addEventListener("click", function () {
    showApp();
    setTab("test");
  });

  /* 首页：学科墙（点击直接进入该学科） */
  function renderHomeSubjects() {
    const box = $("homeSubjects");
    if (!box) return;
    box.innerHTML = "";
    Object.keys(SUBJECT_META)
      .sort((a, b) => SUBJECT_META[a].order - SUBJECT_META[b].order)
      .forEach(function (s) {
        const meta = SUBJECT_META[s];
        const d = document.createElement("div");
        d.className = "home-subj";
        d.style.setProperty("--subj", meta.color);
        d.innerHTML = `<span class="hs-icon">${meta.icon}</span><span>${s}</span>`;
        d.onclick = function () {
          state.subject = s;
          renderAll();
          showApp();
        };
        box.appendChild(d);
      });
  }

  /* ---------- 移动端：抽屉菜单 ---------- */
  function closeSidebar() {
    if (window.innerWidth <= 860) document.body.classList.remove("sidebar-open");
  }
  const menuBtn = $("menuBtn"), overlay = $("overlay");
  if (menuBtn) menuBtn.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-open");
  });
  if (overlay) overlay.addEventListener("click", closeSidebar);

  /* ---------- WebView 环境适配（APK） ---------- */
  function detectWebView() {
    if (/wv/i.test(navigator.userAgent || "")) {
      const tip = document.querySelector(".tip");
      if (tip) tip.textContent = "📱 手机版：点左上角 ☰ 切换年级 / 学期 / 学科 · 支持连接打印机打印（彩色 / 黑白）";
    }
  }

  /* ---------- 导航渲染 ---------- */
  function renderGrades() {
    gradeNav.innerHTML = "";
    GRADES.forEach(g => {
      const b = document.createElement("div");
      b.className = "grade-btn" + (state.grade === g ? " active" : "");
      b.textContent = g + "年级";
      b.onclick = () => { state.grade = g; state.subject = null; renderAll(); }; // 手机端由「确认查看」关闭抽屉
      gradeNav.appendChild(b);
    });
  }

  function renderTerms() {
    termNav.innerHTML = "";
    TERMS.forEach(t => {
      const b = document.createElement("div");
      b.className = "term-btn" + (state.term === t ? " active" : "");
      b.textContent = t + "学期";
      b.onclick = () => { state.term = t; state.subject = null; renderAll(); }; // 由「确认查看」关闭抽屉
      termNav.appendChild(b);
    });
  }

  function getTermData() {
    return window.DATA[state.grade + state.term] || null;
  }

  function renderSubjects() {
    subjectNav.innerHTML = "";
    const termData = getTermData();
    if (!termData) {
      const empty = document.createElement("div");
      empty.className = "empty-tip";
      empty.innerHTML = '<div class="big">📭</div><div>本学期数据未收录</div>';
      subjectNav.appendChild(empty);
      return;
    }
    const names = Object.keys(termData).sort((a, b) =>
      (SUBJECT_META[a] ? SUBJECT_META[a].order : 99) - (SUBJECT_META[b] ? SUBJECT_META[b].order : 99)
    );
    names.forEach(n => {
      const meta = SUBJECT_META[n] || { icon: "📄", color: "#4f46e5" };
      const b = document.createElement("div");
      b.className = "subject-btn" + (state.subject === n ? " active" : "");
      b.style.setProperty("--subj", meta.color);
      b.innerHTML = `<span class="sb-icon">${meta.icon}</span><span class="sb-name">${n}</span>`;
      b.onclick = () => {
        state.subject = n;
        state.highlight = null;
        renderCard();
        if (tabView === "test") renderTest();
        updateConfirmSummary();
        // 手机端不自动关闭抽屉，等用户点「✅ 确认查看」
      };
      subjectNav.appendChild(b);
    });
    if (state.subject && names.indexOf(state.subject) === -1) state.subject = null;
    if (!state.subject && names.length) state.subject = names[0];
  }

  /* ---------- 卡片构建 ---------- */
  function inline(text) {
    return text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
  }

  function buildCardHTML(subject) {
    const termData = getTermData();
    const sub = termData ? termData[subject] : null;
    if (!sub) return null;

    const termLabel = gradeNames[state.grade] + state.term + "学期";
    const meta = SUBJECT_META[subject] || { icon: "📄", color: "#4f46e5" };

    let blocksHtml = "";
    const blks = sub.blocks || [];
    // 奇数个知识块时，最后一块自动占满整行，排布更饱满协调
    blks.forEach((bl, idx) => {
      const items = (bl.items || []).map(it => "<li>" + inline(it) + "</li>").join("");
      const lastFull = blks.length % 2 === 1 && idx === blks.length - 1;
      const cls = (bl.span2 || lastFull) ? "kblock span2" : "kblock";
      blocksHtml += `<div class="${cls}"><div class="kblock-title">${inline(bl.t)}</div><ul>${items}</ul></div>`;
    });

    const card = document.createElement("div");
    card.className = "card";
    card.style.setProperty("--subj", meta.color);
    card.innerHTML = `
      <div class="card-head">
        <div class="ch-left">
          <div class="ch-icon">${meta.icon}</div>
          <h2>${subject} · 知识点压缩卡</h2>
          <span class="ch-term">${termLabel}</span>
        </div>
        <div class="ch-right">
          <div class="ch-no"><b>甘肃 · ${gradeNames[state.grade]}</b>${state.term}学期 · 全学科精华<br>极致压缩 · 一页A4</div>
          <div class="ch-actions">
            <button class="voice-btn" type="button" title="切换语音">🎙</button>
            <button class="speech-btn" type="button">🔊 语音讲解</button>
            <button class="speech-stop-btn hidden" type="button" title="停止朗读">⏹</button>
          </div>
        </div>
      </div>
      ${sub.intro ? `<div class="card-intro">${inline(sub.intro)}</div>` : ""}
      <div class="kblocks">${blocksHtml}</div>
      <div class="card-foot">
        <div class="cf-note">${sub.note ? inline(sub.note) : "📌 加粗为易错/常考点"}</div>
        <div class="cf-brand">📚 九年义务一页通</div>
      </div>
    `;
    return card;
  }

  /* ============ 语音讲解（TTS 分段朗读 + 高亮） ============ */
  let speechState = { active: false, paused: false, unitIdx: 0, units: [], card: null };

  /* ---- 语音选择：自动挑最好音色，可手动切换 ---- */
  let ttsVoices = [];
  function loadTTSVoices() {
    if (!("speechSynthesis" in window)) return;
    ttsVoices = window.speechSynthesis.getVoices() || [];
  }
  if ("speechSynthesis" in window) {
    loadTTSVoices();
    window.speechSynthesis.onvoiceschanged = loadTTSVoices;
  }
  function zhVoices() {
    return ttsVoices.filter(v => /^zh/i.test(v.lang));
  }
  function scoreVoice(v) {
    const n = v.name;
    let s = 0;
    if (/xiaoxiao|yunxi|yunjian|xiaoyi|xiaohan|xiaochen|xiaomo/i.test(n)) s += 100; // 微软神经网络女声/男声
    if (/neural/i.test(n)) s += 60;
    if (/natural/i.test(n)) s += 40;
    if (/microsoft/i.test(n)) s += 20;
    if (/google/i.test(n)) s += 10;
    if (/huihui|kangkang|yaoyao/i.test(n)) s -= 5; // 老旧引擎音色机械
    return s;
  }
  function getSavedVoiceName() {
    try { return localStorage.getItem("yyt_voice") || ""; } catch (e) { return ""; }
  }
  function saveVoiceName(name) {
    try { localStorage.setItem("yyt_voice", name); } catch (e) { /* 忽略 */ }
  }
  function pickBestVoice() {
    const zh = zhVoices();
    if (!zh.length) return null;
    const saved = getSavedVoiceName();
    if (saved) {
      const m = zh.find(v => v.name === saved);
      if (m) return m;
    }
    return zh.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
  }
  function voiceShortName(v) {
    if (!v) return "";
    return v.name
      .replace(/^Microsoft /, "")
      .replace(/^Google /, "")
      .replace(/Online \(Natural\) - /, "")
      .replace(/ \(Natural\)/i, "")
      .replace(/Neural$/i, "")
      .replace(/[（(].*?[)）]/g, "")
      .replace(/ - /g, " ")
      .trim();
  }
  function nextVoice() {
    const zh = zhVoices();
    if (!zh.length) { alert("未检测到中文语音，请在系统设置中安装文字转语音引擎"); return; }
    const cur = pickBestVoice();
    const idx = cur ? zh.indexOf(cur) : -1;
    const next = zh[(idx + 1) % zh.length];
    saveVoiceName(next.name);
    updateVoiceBtns();
  }
  function hasNativeTTS() {
    return !!(window.AndroidTTS && window.AndroidTTS.isReady && window.AndroidTTS.isReady());
  }
  function hasAnyTTS() {
    return hasNativeTTS() || ("speechSynthesis" in window);
  }
  function updateVoiceBtns() {
    const cur = cardView.querySelector(".card");
    if (!cur) return;
    const btn = cur.querySelector(".voice-btn");
    if (!btn) return;
    if (hasNativeTTS()) {
      // 安卓原生 TTS 由系统引擎决定音色（可在系统设置-无障碍-文字转语音中更换），隐藏切换按钮
      btn.style.display = "none";
      return;
    }
    const v = pickBestVoice();
    const mobile = window.innerWidth < 860;
    btn.innerHTML = (v && !mobile) ? "🎙 " + voiceShortName(v) : "🎙";
    btn.title = v ? "当前语音：" + v.name + "（点击切换）" : "切换语音";
  }

  function cleanSpeechText(s) {
    return String(s || "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/[*_]/g, "")
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{2190}-\u{21FF}]/gu, "")
      .replace(/²/g, "平方").replace(/³/g, "立方").replace(/°C/g, "摄氏度").replace(/°/g, "度")
      .replace(/×/g, "乘").replace(/÷/g, "除以").replace(/＋/g, "加").replace(/－/g, "减")
      .replace(/＝/g, "等于").replace(/≈/g, "约等于").replace(/→/g, "得到")
      .replace(/\s+/g, " ").trim();
  }

  function collectSpeechUnits(card) {
    const units = [];
    const h2 = card.querySelector(".card-head h2");
    const term = card.querySelector(".ch-term");
    const intro = card.querySelector(".card-intro");
    const blocks = card.querySelectorAll(".kblock");
    const foot = card.querySelector(".cf-note");
    if (h2) units.push({ el: h2, text: cleanSpeechText((term ? term.textContent + "，" : "") + h2.textContent) });
    if (intro) units.push({ el: intro, text: cleanSpeechText("本册导读：" + intro.textContent) });
    blocks.forEach(b => {
      const t = b.querySelector(".kblock-title");
      const items = b.querySelectorAll("li");
      const txt = (t ? t.textContent : "") + "。" + Array.from(items).map(li => li.textContent).join("。");
      units.push({ el: b, text: cleanSpeechText(txt) });
    });
    if (foot) units.push({ el: foot, text: cleanSpeechText("提示：" + foot.textContent) });
    return units.filter(u => u.text);
  }

  function clearSpeechHighlight(card) {
    if (card) card.querySelectorAll(".speaking").forEach(e => e.classList.remove("speaking"));
  }

  function syncSpeechBtns() {
    const cur = cardView.querySelector(".card");
    if (!cur) return;
    const speak = cur.querySelector(".speech-btn");
    const stop = cur.querySelector(".speech-stop-btn");
    if (speak) {
      if (speechState.active && !speechState.paused) { speak.innerHTML = "⏸ 暂停"; speak.classList.add("playing"); }
      else if (speechState.paused) { speak.innerHTML = "▶ 继续"; speak.classList.add("playing"); }
      else { speak.innerHTML = "🔊 语音讲解"; speak.classList.remove("playing"); }
    }
    if (stop) stop.classList.toggle("hidden", !speechState.active);
  }

  function speakNextUnit() {
    if (!speechState.active) return;
    if (speechState.unitIdx >= speechState.units.length) { finishSpeech(); return; }
    const u = speechState.units[speechState.unitIdx];
    clearSpeechHighlight(speechState.card);
    if (u.el) u.el.classList.add("speaking");
    const utter = new SpeechSynthesisUtterance(u.text);
    utter.lang = "zh-CN";
    utter.rate = 0.92;
    utter.pitch = 1;
    const voice = pickBestVoice();
    if (voice) utter.voice = voice;
    utter.onend = () => { speechState.unitIdx++; speakNextUnit(); };
    utter.onerror = () => { speechState.unitIdx++; speakNextUnit(); };
    window.speechSynthesis.speak(utter);
  }

  function speakCard(card, subject) {
    const units = collectSpeechUnits(card);
    if (!units.length) return;
    if (hasNativeTTS()) {
      // 安卓原生 TTS：一次性传入分段文本，原生引擎逐段朗读并回调高亮
      speechState = { active: true, paused: false, unitIdx: 0, units, card, subj: subject, mode: "native" };
      window.AndroidTTS.speak(JSON.stringify(units.map(u => u.text)), 0);
      syncSpeechBtns();
      return;
    }
    if (!("speechSynthesis" in window)) { alert("当前设备不支持语音朗读"); return; }
    speechState = { active: true, paused: false, unitIdx: 0, units, card, subj: subject, mode: "web" };
    window.speechSynthesis.cancel();
    speakNextUnit();
    syncSpeechBtns();
  }

  function pauseSpeech() {
    if (!speechState.active) return;
    if (speechState.mode === "native") {
      // 原生 TTS 无暂停 API：停止当前朗读，记录断点，点“继续”时从断点重读
      window.AndroidTTS.stop();
      speechState.paused = true;
    } else {
      window.speechSynthesis.pause();
      speechState.paused = true;
    }
    syncSpeechBtns();
  }
  function resumeSpeech() {
    if (!speechState.active) return;
    if (speechState.mode === "native") {
      const texts = speechState.units.map(u => u.text);
      window.AndroidTTS.speak(JSON.stringify(texts), speechState.unitIdx);
      speechState.paused = false;
    } else {
      window.speechSynthesis.resume();
      speechState.paused = false;
    }
    syncSpeechBtns();
  }
  function stopSpeech() {
    const card = speechState.card;
    if (speechState.active) {
      if (speechState.mode === "native" && window.AndroidTTS) window.AndroidTTS.stop();
      else window.speechSynthesis.cancel();
    }
    speechState = { active: false, paused: false, unitIdx: 0, units: [], card: null };
    clearSpeechHighlight(card);
    syncSpeechBtns();
  }
  function finishSpeech() {
    const card = speechState.card;
    speechState = { active: false, paused: false, unitIdx: 0, units: [], card: null };
    clearSpeechHighlight(card);
    syncSpeechBtns();
  }

  /* ---- 原生 TTS 回调（安卓注入调用） ---- */
  function handleTtsEvent(type, idx) {
    if (!speechState.active || speechState.mode !== "native") return;
    if (type === "start") {
      speechState.unitIdx = idx;
      clearSpeechHighlight(speechState.card);
      const u = speechState.units[idx];
      if (u && u.el) u.el.classList.add("speaking");
    } else if (type === "end") {
      if (idx >= speechState.units.length - 1) finishSpeech();
    }
  }
  window.__ttsOnStart = function (i) { handleTtsEvent("start", i); };
  window.__ttsOnEnd = function (i) { handleTtsEvent("end", i); };
  window.__ttsReady = function () { updateVoiceBtns(); };

  function initSpeech(card) {
    const speak = card.querySelector(".speech-btn");
    const stop = card.querySelector(".speech-stop-btn");
    const voiceBtn = card.querySelector(".voice-btn");
    if (!speak) return;
    // 只有既没有安卓原生 TTS 桥、也没有 Web Speech API 时才隐藏按钮（基本不会发生）
    if (!hasAnyTTS()) {
      speak.style.display = "none";
      if (voiceBtn) voiceBtn.style.display = "none";
      return;
    }
    speak.onclick = () => {
      if (speechState.active && speechState.card === card) {
        if (speechState.paused) resumeSpeech(); else pauseSpeech();
      } else {
        speakCard(card);
      }
    };
    if (stop) stop.onclick = stopSpeech;
    if (voiceBtn) {
      voiceBtn.onclick = nextVoice;
      updateVoiceBtns();
    }
  }

  function renderCard() {
    const subj = state.subject;
    const termData = getTermData();
    const sub = termData && subj ? termData[subj] : null;

    if (!sub) {
      cardView.innerHTML = '<div class="empty-tip"><div class="big">🗂️</div><div>请在左侧选择学科</div></div>';
      breadcrumb.innerHTML = "";
      return;
    }

    const termLabel = gradeNames[state.grade] + state.term + "学期";
    breadcrumb.innerHTML = `<span class="bc-title">${termLabel} · ${subj}</span><span class="bc-sub">核心知识点压缩卡 · 一页 A4</span>`;

    cardView.innerHTML = "";
    stopSpeech(); // 切换卡片时停止朗读
    const card = buildCardHTML(subj);
    cardView.appendChild(card);
    fitCard(card);
    initCollapse(card);
    initSpeech(card);
  }

  /* ---------- 溢出自动压缩：保证内容始终排满且不超出一页 A4 ---------- */
  function fitCard(card, forcePrint) {
    // 等一帧等字体/布局就绪再度量
    requestAnimationFrame(function () {
      if (!card || !card.isConnected) return;
      card.classList.remove("compact", "compact2");
      // 手机屏幕：无固定 A4 高度，无需压缩；仅打印场景（forcePrint）按 A4 布局度量
      if (!forcePrint && window.innerWidth <= 860) return;
      // 度量时强制按打印布局（A4 双栏 + 全部展开）
      card.classList.add("measure-print");
      if (card.scrollHeight > card.clientHeight + 3) {
        card.classList.add("compact");
        if (card.scrollHeight > card.clientHeight + 3) {
          card.classList.add("compact2");
        }
      }
      card.classList.remove("measure-print");
    });
  }

  /* ---------- 手机端：知识块手风琴折叠 ---------- */
  function initCollapse(card) {
    if (window.innerWidth > 860 || !card) return;
    var blocks = card.querySelectorAll ? card.querySelectorAll(".kblock") : [];
    blocks.forEach(function (bl) {
      var title = bl.querySelector(".kblock-title");
      if (title && !title.__bound) {
        title.__bound = true;
        title.addEventListener("click", function (e) {
          e.preventDefault();
          bl.classList.toggle("open");
        });
      }
    });
  }

  /* ---------- 缩放 ---------- */
  function applyZoom() {
    cardWrap.style.zoom = state.zoom / 100;
    zoomLabel.textContent = state.zoom + "%";
  }
  $("zoomIn").addEventListener("click", () => {
    state.zoom = Math.min(160, state.zoom + 10);
    applyZoom();
  });
  $("zoomOut").addEventListener("click", () => {
    state.zoom = Math.max(50, state.zoom - 10);
    applyZoom();
  });

  /* ---------- 打印（桌面 window.print / APK AndroidBridge 原生打印） ---------- */
  function hasBridge() {
    return typeof window.AndroidBridge !== "undefined" && window.AndroidBridge;
  }

  $("printBtn").addEventListener("click", () => {
    if (hasBridge()) {
      // APK：先复位为只打印当前卡片，再调原生打印
      document.body.classList.remove("printing-all");
      printAllBox.innerHTML = "";
      window.AndroidBridge.printCurrent();
    } else {
      window.print();
    }
  });

  $("printAllBtn").addEventListener("click", () => {
    stopSpeech();
    const termData = getTermData();
    if (!termData) return;
    const names = Object.keys(termData).sort((a, b) =>
      (SUBJECT_META[a] ? SUBJECT_META[a].order : 99) - (SUBJECT_META[b] ? SUBJECT_META[b].order : 99)
    );
    printAllBox.innerHTML = "";
    const cards = [];
    names.forEach(n => {
      const card = buildCardHTML(n);
      if (card) {
        printAllBox.appendChild(card);
        cards.push(card);
      }
    });
    // 屏幕外容器已可度量，先做溢出压缩（强制按 A4 打印布局度量），再触发打印
    requestAnimationFrame(function () {
      cards.forEach(function (c) { fitCard(c, true); });
      requestAnimationFrame(function () {
        document.body.classList.add("printing-all");
        if (hasBridge()) window.AndroidBridge.printAll();
        else window.print();
      });
    });
  });

  // 桌面浏览器：打印对话框关闭后清理临时容器
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("printing-all");
    printAllBox.innerHTML = "";
  });

  /* ---------- 搜索 ---------- */
  function buildSearchIndex() {
    const idx = [];
    Object.keys(window.DATA).forEach(termKey => {
      const termData = window.DATA[termKey];
      Object.keys(termData).forEach(sub => {
        const data = termData[sub];
        (data.blocks || []).forEach(bl => {
          (bl.items || []).forEach(it => {
            idx.push({ termKey, sub, text: it });
          });
        });
      });
    });
    return idx;
  }
  const searchIndex = buildSearchIndex();

  searchInput.addEventListener("input", function () {
    const q = this.value.trim();
    if (!q) { searchResults.classList.add("hidden"); return; }
    const hits = [];
    searchIndex.forEach(e => {
      if (hits.length >= 24) return;
      if (e.text.indexOf(q) !== -1) hits.push(e);
    });
    searchResults.innerHTML = "";
    if (!hits.length) {
      searchResults.innerHTML = '<div class="sr-none">没有找到相关知识点，换个关键词试试</div>';
    } else {
      hits.forEach(h => {
        const d = document.createElement("div");
        d.className = "sr-item";
        d.innerHTML = `<span class="sr-tag">${gradeNames[h.termKey[0]]}${h.termKey[1]}·${h.sub}</span><span class="sr-text">${h.text}</span>`;
        d.onclick = () => {
          state.grade = h.termKey[0];
          state.term = h.termKey[1];
          state.subject = h.sub;
          searchResults.classList.add("hidden");
          searchInput.value = "";
          renderAll();
          $("main").scrollTop = 0;
        };
        searchResults.appendChild(d);
      });
    }
    searchResults.classList.remove("hidden");
  });

  /* ---------- 确认查看：显示当前选择摘要，点确认关闭抽屉 ---------- */
  function updateConfirmSummary() {
    const el = $("confirmSummary");
    if (!el) return;
    if (state.subject) {
      el.textContent = gradeNames[state.grade] + " · " + state.term + "学期 · " + state.subject;
    } else {
      el.textContent = "请先选择年级、学期、学科";
    }
  }

  /* ---------- 全部渲染 ---------- */
  function renderAll() {
    renderGrades();
    renderTerms();
    renderSubjects();
    renderCard();
    applyZoom();
    updateConfirmSummary();
    if (tabView === "test") renderTest();
  }

  /* ================= 试卷中心：智能组卷 ================= */
  var testState = { seed: 0 };
  var tabView = "card";

  function rnd(n) { return Math.floor(Math.random() * n); }
  function pick(arr) { return arr[rnd(arr.length)]; }
  function shuffle(arr) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function stripBold(s) { return (s || "").replace(/\*\*/g, ""); }
  // 通用：把条目中第一个 **加粗** 内容挖空作答案
  function blankQuestion(item) {
    var m = item.match(/\*\*(.+?)\*\*/);
    if (!m) return null;
    var q = item.replace(/\*\*(.+?)\*\*/, "____");
    return { q: stripBold(q), a: stripBold(m[1]) };
  }
  // 古诗解析：**《题》**作者：诗句
  function parsePoem(item) {
    var m = item.match(/《(.+?)》\*\*?([^：:]*?)[：:](.+)/);
    if (!m) return null;
    return { title: m[1], author: m[2].replace(/\*/g, ""), text: m[3].replace(/\*\*/g, "") };
  }
  function poemClauses(text) {
    return text.split(/[，。；！？、]/).filter(function (s) { return s.trim().length > 0; });
  }

  /* ---- 数学计算题（先定答案再构造题目，保证可解） ---- */
  function genMathQuestions(grade, n) {
    var g = parseInt(grade, 10), qs = [];
    function add(q, a) { qs.push({ q: q, a: String(a) }); }
    if (g <= 4) {
      for (var i = 0; i < n; i++) {
        var t = rnd(4);
        if (t === 0) { var a1 = 100 + rnd(900), b1 = 100 + rnd(900); add(a1 + " + " + b1, a1 + b1); }
        else if (t === 1) { var a2 = 200 + rnd(800), b2 = 100 + rnd(a2 - 100); add(a2 + " − " + b2, a2 - b2); }
        else if (t === 2) { var a3 = 12 + rnd(88), b3 = 3 + rnd(8); add(a3 + " × " + b3, a3 * b3); }
        else { var b4 = 2 + rnd(8), a4 = b4 * (10 + rnd(90)); add(a4 + " ÷ " + b4, a4 / b4); }
      }
    } else if (g <= 6) {
      for (var i2 = 0; i2 < n; i2++) {
        var t2 = rnd(4);
        if (t2 === 0) { var x1 = rnd(90) + 10, y1 = rnd(90) + 10; add(x1 + ".5 + " + y1 + ".5", (x1 + y1) + ".0"); }
        else if (t2 === 1) { var x2 = rnd(40) + 10, y2 = rnd(9) + 1; add(x2 + ".5 × " + y2, (x2 * y2 * 10 + y2 * 5) / 10); }
        else if (t2 === 2) { var d = 2 + rnd(8), m = 2 + rnd(9); add("(" + m + "/" + (m + d) + ") + (" + d + "/" + (m + d) + ")", "1"); }
        else { var x3 = rnd(20) + 1, k = rnd(6) + 2, c = k * x3 + rnd(30); add(k + "x + " + (c - k * x3) + " = " + c, "x = " + x3); }
      }
    } else if (g <= 8) {
      for (var i3 = 0; i3 < n; i3++) {
        var t3 = rnd(3);
        if (t3 === 0) { var x4 = rnd(20) - 10, k2 = rnd(5) + 2, c2 = k2 * x4 + rnd(20) - 10; add(k2 + "x − " + (c2 - k2 * x4) + " = " + c2, "x = " + x4); }
        else if (t3 === 1) { var x5 = rnd(10) - 5, y5 = rnd(10) - 5; add("解方程组：x+y=" + (x5 + y5) + "，x−y=" + (x5 - y5), "x=" + x5 + "，y=" + y5); }
        else { var a5 = rnd(12) - 6, b5 = rnd(12) - 6; add("计算：(−" + Math.abs(a5) + ") × " + b5 + " + " + (rnd(20) - 10), a5 * b5 + (rnd(20) - 10)); }
      }
    } else {
      for (var i4 = 0; i4 < n; i4++) {
        var t4 = rnd(3);
        if (t4 === 0) { var p = rnd(6) + 1, q2 = rnd(6) + 1; add("解方程：x² − " + (p + q2) + "x + " + (p * q2) + " = 0", "x₁=" + p + "，x₂=" + q2); }
        else if (t4 === 1) { var x6 = rnd(6) - 3, h = rnd(4) + 1; add("二次函数 y=(x−" + h + ")²+" + (x6 - h * h) + "，求顶点坐标", "(" + h + "," + (x6 - h * h) + ")"); }
        else { var x7 = rnd(10) - 5, y7 = rnd(10) - 5; add("解方程组：2x+y=" + (2 * x7 + y7) + "，x−2y=" + (x7 - 2 * y7), "x=" + x7 + "，y=" + y7); }
      }
    }
    return qs;
  }

  /* ---- 满分制：按年级 + 学科适配 ---- */
  function fullScore(grade, subj) {
    var g = parseInt(grade, 10);
    if (g <= 6) return 100;                          // 小学：全科 100 分制
    if (subj === "语文" || subj === "数学" || subj === "英语") return 120; // 初中主科 120
    if (subj === "物理") return 90;                  // 物理 90 分制
    if (subj === "化学") return 60;                  // 化学 60 分制
    return 100;                                      // 道法/历史/地理/生物 100
  }

  /* ---- 按满分 + 题型权重自动分配每题分值（总分精确 = M） ---- */
  function assignScores(sections, M) {
    if (!sections || !sections.length) return;
    var allocated = 0;
    sections.forEach(function (sec, i) {
      var ni = sec.qs.length;
      if (!ni) return;
      var part = (i === sections.length - 1) ? (M - allocated) : Math.round(M * (sec.weight || 0.5));
      var base = Math.floor(part / ni);
      var rem = part - base * ni;
      sec.qs.forEach(function (q, qi) {
        q.score = base + (qi < rem ? 1 : 0);
      });
      allocated += part;
    });
    // 校正舍入误差，保证总分恰等于 M
    var sum = 0;
    sections.forEach(function (sec) { sec.qs.forEach(function (q) { sum += q.score; }); });
    var diff = M - sum;
    if (diff !== 0) {
      var last = sections[sections.length - 1];
      if (last.qs.length) last.qs[last.qs.length - 1].score += diff;
    }
  }

  /* ---- 标准试卷模板（期中/期末 · 按年级学科适配满分） ---- */

  /* 数学应用题（先定答案再构造，答案必可解） */
  function genAppQuestions(grade, n) {
    var g = parseInt(grade, 10), qs = [];
    function add(q, a) { qs.push({ q: q, a: String(a) }); }
    for (var i = 0; i < n; i++) {
      var t = rnd(5);
      if (g <= 4) {
        if (t === 0) { var L = 5 + rnd(6), W = 3 + rnd(5); add("一个长方形长" + L + "米，宽" + W + "米，它的周长是多少米？", 2 * (L + W)); }
        else if (t === 1) { var a1 = 6 + rnd(9); add("果园有苹果树" + a1 + "棵，梨树是苹果树的3倍，梨树有多少棵？", a1 * 3); }
        else if (t === 2) { var n1 = 3 + rnd(6), p = 2 + rnd(4); add("每盒彩笔" + p + "元，买" + n1 + "盒要多少元？", n1 * p); }
        else if (t === 3) { var tot = (4 + rnd(8)) * 6; add("把" + tot + "个苹果平均分给6个小朋友，每人分几个？", tot / 6); }
        else { var L2 = 5 + rnd(6), W2 = 3 + rnd(5); add("一个长方形花坛长" + L2 + "米，宽" + W2 + "米，面积是多少平方米？", L2 * W2); }
      } else if (g <= 6) {
        if (t === 0) { var L3 = 8 + rnd(8), W3 = 4 + rnd(5); add("一块长方形菜地长" + L3 + "米，宽" + W3 + "米，面积是多少平方米？", L3 * W3); }
        else if (t === 1) { var price = 20 + rnd(60), disc = (6 + rnd(3)) / 10; add("一件衣服原价" + price + "元，打" + Math.round(disc * 10) + "折出售，现价是多少元？", Math.round(price * disc * 10) / 10); }
        else if (t === 2) { var x = 3 + rnd(8), k = 2 + rnd(5), c = k * x + rnd(10); add("解方程：" + k + "x + " + (c - k * x) + " = " + c + "，x是多少？", "x = " + x); }
        else if (t === 3) { var v = 40 + rnd(60), tt = 2 + rnd(3); add("汽车每小时行" + v + "千米，行驶" + tt + "小时，共行多少千米？", v * tt); }
        else { var tot2 = (10 + rnd(30)) * 4; add("学校买来" + tot2 + "本图书，平均分给4个班，每班分多少本？", tot2 / 4); }
      } else if (g <= 8) {
        if (t === 0) { var x2 = 2 + rnd(8), k2 = 2 + rnd(4), b2 = k2 * x2 + rnd(5); add("解方程：" + k2 + "x − " + (k2 * x2 - b2) + " = " + b2 + "，求x的值。", "x = " + x2); }
        else if (t === 1) { var sp = 40 + rnd(40), tt2 = 2 + rnd(3); add("甲、乙两地相距" + (sp * tt2) + "千米，汽车每小时行" + sp + "千米，几小时到达？", tt2); }
        else if (t === 2) { var x3 = 2 + rnd(6), y3 = 3 + rnd(5); add("某班共" + (x3 + y3) + "名学生，男生比女生多" + (x3 - y3) + "名，男生、女生各多少人？", "男生" + x3 + "人，女生" + y3 + "人"); }
        else if (t === 3) { var pr = 15 + rnd(20), cnt = 20 + rnd(30); add("某商品每件" + pr + "元，售出" + cnt + "件，总收入多少元？", pr * cnt); }
        else { var tot3 = (20 + rnd(40)) * 2; add("把" + tot3 + "米长的绳子平均分成2段，每段多少米？", tot3 / 2); }
      } else {
        if (t === 0) { var p = 2 + rnd(4), q = 3 + rnd(5); add("两个整数之积为" + (p * q) + "，之和为" + (p + q) + "，求这两个数。", p + "和" + q); }
        else if (t === 1) { var h = 4 + rnd(5), x0 = 2 + rnd(4), k = 10 + rnd(20); add("二次函数 y=(x−" + h + ")²+" + k + "，当 x=" + x0 + " 时，求 y 的值。", (x0 - h) * (x0 - h) + k); }
        else if (t === 2) { var sp2 = 60 + rnd(40), tt3 = 2 + rnd(3); add("汽车每小时行" + sp2 + "千米，行驶" + tt3 + "小时后离乙地还有50千米，甲乙两地相距多少千米？", sp2 * tt3 + 50); }
        else if (t === 3) { var n2 = 3 + rnd(6), price2 = 2 + rnd(4); add("每本练习册" + price2 + "元，买" + n2 + "本共需多少元？", n2 * price2); }
        else { var r = 2 + rnd(4); add("圆的半径是" + r + "厘米，周长是多少厘米？（π取3.14）", Math.round(2 * 3.14 * r * 100) / 100); }
      }
    }
    return qs;
  }

  /* 答案池：全部 **加粗** 内容（用于选择干扰项） */
  function answerPool(allItems) {
    var pool = [];
    allItems.forEach(function (it) {
      var re = /\*\*(.+?)\*\*/g, m;
      while ((m = re.exec(it.text))) { var v = stripBold(m[1]); if (v.length <= 12 && pool.indexOf(v) === -1) pool.push(v); }
    });
    return pool;
  }

  /* 挖空选择题：干扰项从同科答案池随机取 */
  function blankChoice(item, pool, nOpt) {
    var m = item.match(/\*\*(.+?)\*\*/);
    if (!m) return null;
    var ans = stripBold(m[1]);
    if (!ans || ans.length > 12) return null;
    var opts = shuffle(pool.filter(function (o) { return o !== ans; })).slice(0, (nOpt || 4) - 1);
    if (opts.length < (nOpt || 4) - 1) return null;
    opts = shuffle([ans].concat(opts));
    return { q: item.replace(/\*\*(.+?)\*\*/, "____"), opts: opts, a: ans };
  }

  /* 语文作文题池（按年级） */
  function chineseEssayTopic(grade) {
    var g = parseInt(grade, 10);
    var bank = g <= 4
      ? ["我的______（家人/朋友/老师）", "难忘的一天", "美丽的校园", "假如我会飞", "我的小天地", "快乐的节日"]
      : g <= 6
      ? ["那一刻，我长大了", "我的心爱之物", "家乡的风俗", "我的拿手好戏", "二十年后的家乡", "给______的一封信"]
      : ["那一次，我真______", "成长中的______", "我心中的英雄", "与______同行", "让______充满阳光", "谈诚信（议论文）"];
    return pick(bank);
  }
  /* 英语书面表达题池（按年级） */
  function englishWritingTopic(grade) {
    var g = parseInt(grade, 10);
    var bank = g <= 4
      ? ["Introduce Yourself（介绍自己：姓名、年龄、喜好）", "My Family（介绍我的家人）", "My Friend（介绍我的朋友）"]
      : g <= 6
      ? ["My Weekend（用过去时写我的周末）", "My Favourite Season（我最喜欢的季节）", "My School Day（我的一天）", "My Last Holiday（我上一次的假期）"]
      : ["My School Life（我的学校生活）", "A Letter to My Friend（给朋友写一封信）", "My Future Plan（我的未来计划）", "Protecting the Environment（保护环境）"];
    return pick(bank);
  }

  /* 英语问答对（用于情景对话配对） */
  function collectQAPairs(allItems) {
    var qa = [];
    allItems.forEach(function (it) {
      var m = it.text.match(/([^：:]*\?[^：:]*)[—–\-]{1,2}\s*(.+)/);
      if (m) qa.push({ q: stripBold(m[1]).trim(), a: stripBold(m[2]).trim() });
    });
    return qa;
  }
  /* 英语小短文阅读（True/False） */
  function englishReading(allItems) {
    var qa = collectQAPairs(allItems);
    if (qa.length < 3) return null;
    var sel = shuffle(qa).slice(0, 3);
    var passage = sel.map(function (s, i) { return (i + 1) + ") " + s.q + " " + s.a; }).join(" ");
    var qs = sel.map(function (s) {
      var wrong = s.a.replace(/(\d+)/, function (d) { return parseInt(d, 10) + (rnd(2) ? 2 : -2); });
      var isTrue = rnd(2) === 0;
      return { q: "根据短文判断正误（T/F）：" + (isTrue ? s.a : wrong), a: isTrue ? "T" : "F" };
    });
    return { passage: passage, qs: qs };
  }

  /* ---- 各科标准卷模板（sections 带 weight 权重，总分=满分） ---- */
  function buildMathTest(allItems, grade) {
    var sections = [];
    var blanks = [], i;
    shuffle(allItems).forEach(function (it) {
      var bq = blankQuestion(it.text);
      if (bq && blanks.length < 8) blanks.push(bq);
    });
    if (blanks.length) sections.push({ t: "一、填空（每空____分）", weight: 0.2, qs: blanks });

    var pool = answerPool(allItems), choices = [];
    shuffle(allItems).forEach(function (it) {
      var bc = blankChoice(it.text, pool, 4);
      if (bc && choices.length < 5) choices.push(bc);
    });
    if (choices.length) sections.push({ t: "二、选择（每题____分）", weight: 0.15, qs: choices });

    var calc = genMathQuestions(grade, 6);
    sections.push({ t: "三、计算题（每题____分）", weight: 0.3, qs: calc });

    var apps = genAppQuestions(grade, 5);
    sections.push({ t: "四、解决问题（每题____分）", weight: 0.35, qs: apps });

    return sections;
  }

  function buildChineseTest(allItems) {
    var sections = [];
    var pool = answerPool(allItems), choices = [];
    shuffle(allItems).forEach(function (it) {
      var bc = blankChoice(it.text, pool, 4);
      if (bc && choices.length < 10) choices.push(bc);
    });
    if (choices.length) sections.push({ t: "一、选择（每题____分）", weight: 0.2, qs: choices });

    var poems = [];
    shuffle(allItems).forEach(function (it) {
      var p = parsePoem(it.text);
      if (!p) return;
      var cls = poemClauses(p.text);
      if (cls.length >= 2) {
        for (var i = 0; i < cls.length - 1 && poems.length < 5; i++) {
          poems.push({ q: "《" + p.title + "》（" + p.author + "）：" + cls[i] + "，____", a: cls[i + 1] });
        }
      } else if (poems.length < 5) {
        poems.push({ q: "默写古诗《" + p.title + "》（" + p.author + "）", a: p.text });
      }
    });
    if (poems.length) sections.push({ t: "二、古诗文默写（每题____分）", weight: 0.2, qs: poems });

    var blanks = [];
    shuffle(allItems).forEach(function (it) {
      var bq = blankQuestion(it.text);
      if (bq && blanks.length < 8) blanks.push(bq);
    });
    if (blanks.length) sections.push({ t: "三、积累与运用（每空____分）", weight: 0.2, qs: blanks });

    var read = [];
    shuffle(allItems).forEach(function (it) {
      if (read.length >= 4) return;
      if (it.text.indexOf("《") >= 0 && it.text.length < 60) {
        read.push({ q: "根据课文内容作答：" + stripBold(it.text), a: "见知识点卡对应要点" });
      }
    });
    if (read.length) sections.push({ t: "四、阅读理解·课内回顾（每题____分）", weight: 0.2, qs: read });

    sections.push({ t: "五、作文（____分）", weight: 0.2, qs: [{ q: "作文题：" + chineseEssayTopic(state.grade), a: "参考知识点卡写作要点（内容具体、语句通顺、字数达标）" }] });
    return sections;
  }

  function buildEnglishTest(allItems) {
    var sections = [];
    // 词汇提取：支持 "english中文" 与 "中文（english）" 两种格式
    var vocab = [];
    allItems.forEach(function (it) {
      var re1 = /([a-zA-Z][a-zA-Z\s'-]{1,20})\s*([\u4e00-\u9fa5]{1,6})/g, m;
      while ((m = re1.exec(it.text))) vocab.push({ en: m[1].trim(), zh: m[2] });
      var re2 = /([\u4e00-\u9fa5]{1,6})[（(]([a-zA-Z][a-zA-Z\s'-]{1,20})[)）]/g;
      while ((m = re2.exec(it.text))) vocab.push({ en: m[2].trim(), zh: m[1] });
    });
    var vq = [];
    shuffle(vocab).forEach(function (v) {
      if (vq.length >= 8) return;
      var dist = shuffle(vocab.filter(function (o) { return o.zh !== v.zh; })).slice(0, 3);
      var opts = shuffle([v].concat(dist));
      if (opts.length >= 2) vq.push({ q: "选择正确释义：" + v.en, opts: opts.map(function (o) { return o.zh; }), a: v.zh });
    });
    // 词汇素材充足（≥4）才单设"词汇"大题，否则并入"单项选择"
    if (vq.length >= 4) sections.push({ t: "一、词汇（每题____分）", weight: 0.2, qs: vq });

    var pool = answerPool(allItems), choices = [];
    shuffle(allItems).forEach(function (it) {
      var bc = blankChoice(it.text, pool, 4);
      if (bc && choices.length < 8) choices.push(bc);
    });
    if (choices.length) sections.push({ t: "二、单项选择（每题____分）", weight: 0.2, qs: choices });

    var dlg = collectQAPairs(allItems);
    var dq = [];
    shuffle(dlg).forEach(function (s) {
      if (dq.length >= 4) return;
      var dist = shuffle(dlg.filter(function (o) { return o.a !== s.a; })).slice(0, 3);
      var opts = shuffle([s].concat(dist));
      if (opts.length >= 2) dq.push({ q: "选择正确的应答：" + s.q, opts: opts.map(function (o) { return o.a; }), a: s.a });
    });
    if (dq.length) sections.push({ t: "三、情景对话（每题____分）", weight: 0.1, qs: dq });

    var blanks = [];
    shuffle(allItems).forEach(function (it) {
      var bq = blankQuestion(it.text);
      if (bq && blanks.length < 8) blanks.push(bq);
    });
    if (blanks.length) sections.push({ t: "四、句型运用（每空____分）", weight: 0.2, qs: blanks });

    var rd = englishReading(allItems);
    if (rd && rd.qs.length) sections.push({ t: "五、阅读理解·判断正误（每题____分）", weight: 0.15, qs: rd.qs, passage: rd.passage });

    sections.push({ t: "六、书面表达（____分）", weight: 0.15, qs: [{ q: "Writing: " + englishWritingTopic(state.grade), a: "参考知识点卡句型与写作模板" }] });
    return sections;
  }

  function buildOtherTest(allItems) {
    var sections = [];
    var pool = answerPool(allItems), choices = [];
    shuffle(allItems).forEach(function (it) {
      var bc = blankChoice(it.text, pool, 4);
      if (bc && choices.length < 10) choices.push(bc);
    });
    if (choices.length) sections.push({ t: "一、选择（每题____分）", weight: 0.4, qs: choices });

    var blanks = [];
    shuffle(allItems).forEach(function (it) {
      var bq = blankQuestion(it.text);
      if (bq && blanks.length < 10) blanks.push(bq);
    });
    if (blanks.length) sections.push({ t: "二、填空（每空____分）", weight: 0.3, qs: blanks });

    var asks = [];
    shuffle(allItems).forEach(function (it) {
      if (asks.length >= 4) return;
      if (it.text.length < 45) asks.push({ q: "简述：" + stripBold(it.text), a: "见知识点卡对应要点" });
    });
    if (asks.length) sections.push({ t: "三、简答（每题____分）", weight: 0.3, qs: asks });

    return sections;
  }

  /* ---- 组卷入口（期中=前半范围 / 期末=全册） ---- */
  function buildTest() {
    var termData = getTermData();
    var subj = state.subject;
    var data = termData && subj ? termData[subj] : null;
    if (!data) return null;
    var blocks = data.blocks || [];
    var useBlocks = testState.mid
      ? blocks.slice(0, Math.max(3, Math.ceil(blocks.length * 0.6)))
      : blocks;
    var allItems = [];
    useBlocks.forEach(function (b) { (b.items || []).forEach(function (it) { allItems.push({ block: b.t, text: it }); }); });

    if (subj === "数学") return buildMathTest(allItems, state.grade);
    if (subj === "语文") return buildChineseTest(allItems);
    if (subj === "英语") return buildEnglishTest(allItems);
    return buildOtherTest(allItems);
  }

  /* ---- 渲染试卷 ---- */
  function renderTest() {
    var box = $("testView");
    if (!box) return;
    var termData = getTermData();
    var subj = state.subject;
    var data = termData && subj ? termData[subj] : null;
    if (!data) {
      box.innerHTML = '<div class="empty-tip"><div class="big">🗂️</div><div>请先在左侧选择学科</div></div>';
      return;
    }
    var sections = buildTest();
    if (!sections) return;
    var M = fullScore(state.grade, subj);
    assignScores(sections, M);
    var termLabel = gradeNames[state.grade] + state.term + "学期";
    var typeLabel = testState.mid ? "期中" : "期末";
    var CN = ["一", "二", "三", "四", "五", "六", "七", "八"];
    // 学年度：上=今年9月起（今年—明年第一学期）；下=今年3月起（去年—今年第二学期）
    var yr = new Date().getFullYear();
    var xueYear = state.term === "上" ? yr + "—" + (yr + 1) : (yr - 1) + "—" + yr;
    var season = state.term === "上" ? "第一学期" : "第二学期";
    var minutes = (subj === "语文" || subj === "数学" || subj === "英语") ? 90 : 60;

    var secHtml = "";
    var secHeads = [];
    sections.forEach(function (sec, si) {
      var secTotal = 0, perScore = null, perSame = true;
      sec.qs.forEach(function (q) {
        secTotal += (q.score || 0);
        if (perScore === null) perScore = q.score;
        else if (perScore !== q.score) perSame = false;
      });
      // 大题名：去掉序号前缀和旧括号（如 "一、填空（每空____分）" → "填空"）
      var nameTxt = sec.t.replace(/^[一二三四五六七八]、/, "").replace(/（.*?）$/, "");
      secHeads.push(nameTxt);
      var perTxt = perSame && perScore ? "每题" + perScore + "分，" : "";
      var headTxt = CN[si] + "、" + nameTxt + "（" + perTxt + "共" + secTotal + "分）";
      var passHtml = sec.passage ? '<div class="paper-passage"><b>短文：</b>' + sec.passage + "</div>" : "";
      var qHtml = "";
      sec.qs.forEach(function (q, qi) {
        var optsHtml = q.opts ? '<div class="opts">' + q.opts.map(function (o, oi) {
          return "<i>" + "ABCDEF"[oi] + "．" + o + "</i>";
        }).join("") + "</div>" : "";
        var hasBlank = q.q && q.q.indexOf("blank") > -1;
        var linesHtml = "";
        if (!q.opts && !hasBlank) {
          var n = 0;
          if (/作文|书面表达/.test(nameTxt)) n = 8;
          else if (/简答|论述/.test(nameTxt)) n = 4;
          else if (/计算|解决|应用/.test(nameTxt)) n = 3;
          else if (/阅读/.test(nameTxt)) n = 2;
          if (n) linesHtml = '<div class="paper-lines" style="--rows:' + n + '"></div>';
        }
        qHtml += '<div class="paper-q"><span class="qn">' + (qi + 1) + ".</span>" +
          '<span class="qq">' + q.q + (q.score ? '<span class="paper-score">（' + q.score + "分）</span>" : "") +
          optsHtml + "</span>" + linesHtml + "</div>";
      });
      secHtml += '<div class="paper-section"><h3>' + headTxt + "</h3>" + passHtml + qHtml + "</div>";
    });
    var ansHtml = "";
    sections.forEach(function (sec, si) {
      var items = sec.qs.map(function (q, qi) { return (si + 1) + "." + (qi + 1) + "　" + q.a; }).join("<br>");
      ansHtml += "<li><b>" + sec.t.replace(/^[一二三四五六七八]、/, "").replace(/（.*?）$/, "") + "</b><br>" + items + "</li>";
    });
    // 得分栏表格
    var barHtml = "<tr><th>题号</th>";
    secHeads.forEach(function (h) { barHtml += "<th>" + h + "</th>"; });
    barHtml += "<th>总分</th></tr><tr><th>得分</th>";
    secHeads.forEach(function () { barHtml += "<td></td>"; });
    barHtml += "<td></td></tr>";

    box.innerHTML =
      '<div class="res-box"><h3>📂 免费真题下载导航（无需会员）</h3><div class="res-list">' +
      '<a class="res-item" href="https://basic.smartedu.cn/" target="_blank" rel="noopener"><b>国家中小学智慧教育平台</b><span>教育部官方 · 教材同步课程与练习 · 完全免费</span></a>' +
      '<a class="res-item" href="https://www.zxxk.com/" target="_blank" rel="noopener"><b>学科网</b><span>海量试卷题库 · 部分免费，注册登录可下载</span></a>' +
      '<a class="res-item" href="https://zujuan.xkw.com/" target="_blank" rel="noopener"><b>组卷网</b><span>在线组卷 · 免费章节练习与部分试卷</span></a>' +
      '<a class="res-item" href="https://www.zxxk.com/soft/" target="_blank" rel="noopener"><b>21世纪教育网</b><span>中小学试卷教案 · 免费专区可下载</span></a>' +
      '<a class="res-item" href="https://www.gsedu.cn/" target="_blank" rel="noopener"><b>甘肃省教育厅</b><span>官方门户 · 中高考政策与部分真题公开</span></a>' +
      '<a class="res-item" href="https://www.neea.edu.cn/" target="_blank" rel="noopener"><b>中国教育考试网</b><span>全国性考试真题与大纲 · 官方免费</span></a>' +
      '</div><p class="res-tip">* 真题下载以各平台实际提供为准；本页均为公开免费渠道，不含任何付费破解内容。</p></div>' +
      '<div class="test-toolbar">' +
      '<span class="tt-info">当前：<b>' + termLabel + " · " + subj + "</b>（" + typeLabel + "卷 · 满分 " + M + " 分）</span>" +
      '<button id="midBtn" class="test-btn ' + (testState.mid ? "primary" : "outline") + '">期中卷</button>' +
      '<button id="finalBtn" class="test-btn ' + (!testState.mid ? "primary" : "outline") + '">期末卷</button>' +
      '<button id="regenBtn" class="test-btn outline">🔄 换一批题</button>' +
      '<button id="toggleAnsBtn" class="test-btn outline">👁 显示答案</button>' +
      '<button id="printTestBtn" class="test-btn outline">🖨 打印本卷</button>' +
      '<button id="exportTestBtn" class="test-btn outline">💾 导出 PDF</button>' +
      "</div>" +
      '<div class="paper">' +
      '<div class="paper-seal"><span>装订线内不要答题</span></div>' +
      '<div class="paper-idrow"><span>学校：<i class="id-line"></i></span><span>班级：<i class="id-line"></i></span><span>姓名：<i class="id-line"></i></span><span>考号：<i class="id-line"></i></span></div>' +
      '<div class="paper-title"><h2>' + xueYear + "学年度" + season + " " + gradeNames[state.grade] + " " + subj + " " + typeLabel + "测试卷</h2>" +
      '<p>（满分：' + M + "分　考试时间：" + minutes + "分钟）</p></div>" +
      '<table class="paper-scorebar">' + barHtml + "</table>" +
      secHtml +
      '<div class="paper-answer hidden" id="paperAnswer"><h4>📌 参考答案</h4><ol>' + ansHtml + "</ol></div>" +
      '<div class="paper-foot"><span class="pf-left">九年义务一页通 · 智能组卷</span><span class="pf-page"></span></div>' +
      "</div>";
    bindTestButtons();
  }

  function bindTestButtons() {
    var regen = $("regenBtn"), toggle = $("toggleAnsBtn"), printTest = $("printTestBtn");
    var mid = $("midBtn"), fin = $("finalBtn");
    if (mid) mid.onclick = function () { testState.mid = true; renderTest(); };
    if (fin) fin.onclick = function () { testState.mid = false; renderTest(); };
    if (regen) regen.onclick = function () { testState.seed++; renderTest(); };
    if (toggle) toggle.onclick = function () {
      var box = $("paperAnswer");
      if (!box) return;
      var show = box.classList.contains("hidden");
      box.classList.toggle("hidden", !show);
      toggle.textContent = show ? "🙈 隐藏答案" : "👁 显示答案";
    };
    if (printTest) printTest.onclick = function () {
      document.body.classList.add("printing-test");
      if (hasBridge()) window.AndroidBridge.printCurrent();
      else window.print();
    };
    var exportTest = $("exportTestBtn");
    if (exportTest) exportTest.onclick = function () {
      if (window.SnapshotBridge && window.SnapshotBridge.exportPdf) {
        // 安卓：试卷克隆到独立容器（视口宽、无缩放）→ 测量 → 逐页渲染
        const paper = document.querySelector("#testView .paper");
        if (!paper) { exportTest.textContent = "💾 导出 PDF"; return; }
        exportTest.textContent = "⏳ 正在导出…";
        exportBox.innerHTML = "";
        exportBox.appendChild(paper.cloneNode(true));
        document.body.classList.add("export-a4");
        setTimeout(function () {
          const dims = buildExportDims(exportBox);
          window.SnapshotBridge.exportPdf(dims);
        }, 600);
      } else {
        // 网页版：直接走打印对话框（可另存为 PDF，同样 A4 排版）
        document.body.classList.add("printing-test");
        window.print();
      }
    };
  }
  window.addEventListener("afterprint", function () {
    document.body.classList.remove("printing-test");
  });

  /* ---- 试卷/知识点 Tab 切换 ---- */
  function setTab(t) {
    stopSpeech();
    tabView = t;
    var tc = $("tabCard"), tt = $("tabTest");
    if (tc) tc.classList.toggle("active", t === "card");
    if (tt) tt.classList.toggle("active", t === "test");
    var cw = $("cardWrap"), tv = $("testView");
    if (cw) cw.classList.toggle("hidden", t !== "card");
    if (tv) tv.classList.toggle("hidden", t !== "test");
    if (t === "test") renderTest();
  }
  var tabCardEl = $("tabCard"), tabTestEl = $("tabTest");
  if (tabCardEl) tabCardEl.addEventListener("click", function () { setTab("card"); });
  if (tabTestEl) tabTestEl.addEventListener("click", function () { setTab("test"); });

  /* ---------- 确认查看按钮：选完年级/学期/学科后点确认进入 ---------- */
  const confirmBtn = $("confirmBtn");
  if (confirmBtn) confirmBtn.onclick = () => {
    if (!state.subject) {
      const tip = $("confirmSummary");
      if (tip) tip.textContent = "⚠️ 请先选择学科";
      return;
    }
    renderCard();
    if (tabView === "test") renderTest();
    closeSidebar();
  };

  /* ---------- 返回按钮：回到选择界面（手机开抽屉 / 桌面重置到默认） ---------- */
  const backBtn = $("backBtn");
  if (backBtn) backBtn.onclick = () => {
    if (window.innerWidth <= 860) {
      document.body.classList.add("sidebar-open"); // 打开抽屉回到选择界面
    } else {
      state.subject = null; // 桌面：重置为当前学期默认学科
      document.body.classList.remove("sidebar-open");
      renderAll();
    }
  };

  /* ---------- 打印连接帮助：检测打印服务 + 一键打开蓝牙设置 ---------- */
  const printHelpBtn = $("printHelpBtn"), printHelpBox = $("printHelpBox");
  if (printHelpBtn && printHelpBox) {
    printHelpBtn.onclick = () => {
      const show = printHelpBox.classList.contains("hidden");
      printHelpBox.classList.toggle("hidden", !show);
      if (show) { refreshPrintHelp(); refreshBt(); }
    };
  }
  function refreshPrintHelp() {
    const box = $("phServices");
    if (!box) return;
    if (!window.AndroidBridge || !window.AndroidBridge.getPrintServices) {
      box.textContent = "💻 网页版：浏览器直接打印即可，无需插件";
      box.className = "ph-services";
      return;
    }
    try {
      const arr = JSON.parse(window.AndroidBridge.getPrintServices() || "[]");
      if (arr.length) {
        box.textContent = "✅ 已安装打印服务：" + arr.join("、");
        box.className = "ph-services";
      } else {
        box.textContent = "⚠️ 未安装标准打印服务！若用启锐/爱印等热敏打印机，请直接使用下方「蓝牙直连打印」";
        box.className = "ph-services empty";
      }
    } catch (e) {
      box.textContent = "检测失败";
      box.className = "ph-services empty";
    }
  }
  const phBluetoothBtn = $("phBluetoothBtn");
  if (phBluetoothBtn) phBluetoothBtn.onclick = () => {
    if (window.AndroidBridge && window.AndroidBridge.openBluetoothSettings) {
      window.AndroidBridge.openBluetoothSettings();
    } else {
      phBluetoothBtn.textContent = "💻 网页版无需蓝牙设置，直接点打印";
    }
  };

  /* ---------- 蓝牙直连打印（启锐/爱印等 ESC/POS 热敏打印机） ---------- */
  let btDevices = [], btSelected = "";
  function hasBtPrint() { return !!(window.BluetoothPrint && window.BluetoothPrint.isEnabled); }
  function refreshBt() {
    const box = $("phBtStatus");
    if (!box) return;
    if (!hasBtPrint()) { box.textContent = "💻 网页版无法直连蓝牙，请用系统打印或打印机APP"; return; }
    if (!window.BluetoothPrint.isEnabled()) {
      box.textContent = "⚠️ 手机蓝牙未开启，请先到「设置→蓝牙」打开";
      box.className = "ph-services empty";
      return;
    }
    box.textContent = "✅ 蓝牙已开启，点击下方「扫描蓝牙设备」查找打印机";
    box.className = "ph-services";
    try {
      const list = JSON.parse(window.BluetoothPrint.listPaired() || "[]");
      btDevices = list;
      renderBtList("已配对设备");
    } catch (e) { /* ignore */ }
  }
  function renderBtList(tip) {
    const listBox = $("phBtList");
    if (!listBox) return;
    listBox.innerHTML = "";
    if (!btDevices.length) {
      listBox.innerHTML = '<div class="ph-bt-empty">' + (tip || "未找到设备") + '</div>';
      return;
    }
    btDevices.forEach(d => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "ph-bt-item" + (btSelected === d.address ? " active" : "");
      b.innerHTML = "🔹 " + escapeHtml(d.name) + '<span class="ph-bt-addr">' + d.address + "</span>";
      b.onclick = () => {
        btSelected = d.address;
        renderBtList(tip);
        const printBtn = $("phBtPrintBtn");
        if (printBtn) { printBtn.classList.remove("hidden"); printBtn.textContent = "🖨 打印到 " + d.name; }
      };
      listBox.appendChild(b);
    });
  }
  function escapeHtml(s) {
    return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  const phBtScanBtn = $("phBtScanBtn");
  if (phBtScanBtn) phBtScanBtn.onclick = () => {
    if (!hasBtPrint()) return;
    const box = $("phBtStatus");
    if (box) box.textContent = "🔍 扫描中…请确保打印机已开机并靠近手机";
    window.BluetoothPrint.startScan();
  };
  const phBtPrintBtn = $("phBtPrintBtn");
  if (phBtPrintBtn) phBtPrintBtn.onclick = () => {
    if (!btSelected) { toastMsg("请先选择蓝牙打印机"); return; }
    const text = buildBtText();
    if (!text) { toastMsg("当前没有可打印的知识卡"); return; }
    const paperW = parseInt($("phPaperW") ? $("phPaperW").value : "32", 10);
    const box = $("phBtStatus");
    if (box) box.textContent = "🖨 正在连接打印…请稍候";
    window.BluetoothPrint.printText(btSelected, text, paperW);
  };
  function toastMsg(m) {
    const box = $("phBtStatus");
    if (box) box.textContent = m;
  }
  // 原生扫描回调
  window.__btScanStart = function () { btDevices = []; };
  window.__btScanResult = function (arr) {
    if (arr && arr.length) {
      btDevices = arr;
      renderBtList("扫描结果（点选要打印的设备）");
    }
  };
  window.__btScanDone = function (arr) {
    if (arr && arr.length) { btDevices = arr; renderBtList("扫描结果（点选要打印的设备）"); }
    const box = $("phBtStatus");
    if (box) box.textContent = btDevices.length ? "✅ 扫描完成，点选设备后打印" : "扫描完成，未发现新设备（已配对设备见列表）";
  };
  window.__btPrintDone = function (ok, msg) {
    const box = $("phBtStatus");
    if (box) {
      box.textContent = ok
        ? "✅ " + msg
        : "❌ " + msg + "（提示：先在系统蓝牙或爱印APP里配对打印机，配对成功后重新扫描选择）";
    }
  };
  function buildBtText() {
    const termData = getTermData();
    const subj = state.subject;
    const sub = termData ? termData[subj] : null;
    if (!sub) return "";
    const lines = [];
    lines.push("=== " + gradeNames[state.grade] + state.term + "学期 · " + subj + " 知识点 ===");
    if (sub.intro) lines.push(stripMark(sub.intro));
    (sub.blocks || []).forEach(b => {
      lines.push("");
      lines.push("【" + stripMark(b.t) + "】");
      (b.items || []).forEach(it => lines.push("· " + stripMark(it)));
    });
    return lines.join("\n");
  }
  function stripMark(s) {
    return String(s || "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, "")
      .replace(/\s+/g, " ").trim();
  }

  /* ---------- 导出文件：保存为图片 / PDF（视口宽布局，内容完整不白板） ---------- */
  function hasSnapshot() { return !!(window.SnapshotBridge && window.SnapshotBridge.saveImage); }
  const exportBox = $("exportBox");
  /* 测量导出容器的尺寸（CSS 像素）：用容器 scrollWidth/scrollHeight，
     避免页面在滚动容器内（如试卷在 #main overflow 内）导致总高度测不准只截一半 */
  function buildExportDims(scope) {
    const el = scope || document.documentElement;
    return JSON.stringify({
      cssW: Math.max(el.scrollWidth, 1),
      cssH: Math.max(el.scrollHeight, 1),
      vh: Math.max(window.innerHeight, 1)
    });
  }
  /* 导出当前知识卡：布局视口能容纳 A4(210mm) 就压缩成一页，否则按屏幕宽度完整导出（长图/多页） */
  function exportCardAs(kind) {
    const box = $("phExportStatus");
    if (!hasSnapshot()) {
      if (box) box.textContent = "💻 网页版：右键卡片图片另存 / 或截屏";
      return;
    }
    const card = buildCardHTML(state.subject);
    if (!card) {
      if (box) box.textContent = "当前没有可导出的知识卡";
      return;
    }
    if (box) box.textContent = kind === "image" ? "🖼 正在排版并生成图片…" : "📄 正在排版并生成 PDF…";
    exportBox.innerHTML = "";
    exportBox.appendChild(card);
    document.body.classList.add("export-a4");
    // 等布局稳定（CSS 展开 + 页面重排）
    setTimeout(function () {
      if (window.innerWidth >= 700) {
        // A4 布局可用：210mm + fitCard 压缩到一页
        exportBox.classList.add("a4");
        fitCard(card, true);
        requestAnimationFrame(function () {
          const dims = buildExportDims(exportBox);
          if (kind === "image") window.SnapshotBridge.saveImage(dims);
          else window.SnapshotBridge.savePdf(dims);
        });
      } else {
        // 布局视口窄：按屏幕宽度完整导出（内容完整优先）
        const dims = buildExportDims(exportBox);
        if (kind === "image") window.SnapshotBridge.saveImage(dims);
        else window.SnapshotBridge.savePdf(dims);
      }
    }, 600);
  }
  const phImgBtn = $("phImgBtn");
  if (phImgBtn) phImgBtn.onclick = function () { exportCardAs("image"); };
  const phPdfBtn = $("phPdfBtn");
  if (phPdfBtn) phPdfBtn.onclick = function () { exportCardAs("pdf"); };
  window.__exportDone = function (msg, name) {
    // 所有导出（图片/PDF/试卷）完成后：恢复页面
    document.body.classList.remove("printing-test");
    document.body.classList.remove("snapshot-mode");
    document.body.classList.remove("export-a4");
    exportBox.innerHTML = "";
    exportBox.classList.remove("a4");
    const et = $("exportTestBtn");
    if (et) et.textContent = "💾 导出 PDF";
    const box = $("phExportStatus");
    if (box) box.textContent = msg;
  };

  /* ---------- 启动 ---------- */
  detectWebView();
  renderAll();
  renderHomeSubjects();
  showHome();
})();

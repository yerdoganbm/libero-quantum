/**
 * @libero/neuro-core-vanilla
 * Framework-agnostic Neuro-Core for any JS/TS app (no React/Vue/Svelte).
 * Her UI uygulamasında kendini otomatik geliştirir.
 */

(function (global) {
  var QUEUE_KEY = 'neuro_queue';
  var MAX_QUEUE = 500;
  var LIBERO_CLOUD = 'https://api.libero.dev/api';
  var apiUrl = 'http://localhost:3001/api';
  var appName = 'unknown';
  var sessionId = '';
  var autocapture = true;

  function getSessionId() {
    try {
      var s = sessionStorage.getItem('neuro_session_id');
      if (!s) {
        s = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
        sessionStorage.setItem('neuro_session_id', s);
      }
      return s;
    } catch (e) { return 'ssr'; }
  }

  function getQueue() {
    try {
      var q = localStorage.getItem(QUEUE_KEY);
      return q ? JSON.parse(q) : [];
    } catch (e) { return []; }
  }

  function setQueue(arr) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(arr.slice(-MAX_QUEUE))); } catch (e) {}
  }

  function enqueue(data) {
    var q = getQueue();
    q.push({ t: Date.now(), payload: data });
    setQueue(q);
  }

  function sendSynapse(data) {
    var payload = Object.assign({}, data, { appName: appName, sessionId: sessionId });
    if (!apiUrl) { enqueue(payload); return; }
    fetch(apiUrl + '/synapse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(function () { enqueue(payload); });
  }

  var NeuroCore = {
    init: function (config) {
      config = config || {};
      apiUrl = config.apiUrl || config.apiKey || apiUrl || LIBERO_CLOUD;
      appName = config.appName || config.app || appName;
      autocapture = config.autocapture !== false;
      sessionId = getSessionId();
      if (autocapture && typeof document !== 'undefined') {
        document.addEventListener('click', function (e) {
          var t = e.target;
          var sel = t && t.id ? '#' + t.id : (t && t.className && typeof t.className === 'string' ? '.' + (t.className.split(' ')[0] || '') : '');
          if (sel && sel.length < 80) sendSynapse({ userId: 'anon', action: 'click', screen: typeof location !== 'undefined' ? location.pathname : 'unknown', metadata: { selector: sel } });
        }, true);
      }
    },
    check: function () {
      var q = getQueue();
      return { queued: q.length, connected: !!apiUrl, appName: appName, message: apiUrl ? (q.length ? q.length + ' events in queue' : 'OK') : 'Dev mode: ' + q.length + ' events queued.' };
    },
    setApiUrl: function (url) { apiUrl = url || LIBERO_CLOUD; },
    flush: function () {
      var q = getQueue();
      if (!apiUrl || q.length === 0) return;
      setQueue([]);
      q.forEach(function (x) {
        fetch(apiUrl + '/synapse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(x.payload) }).catch(function () { enqueue(x.payload); });
      });
    },
    trackScreen: function (userId, screen, metadata) {
      sendSynapse({ userId: userId, action: 'screen_view', screen: screen, duration: 0, metadata: metadata || {} });
    },
    trackScreenExit: function (userId, screen, durationSeconds, metadata) {
      sendSynapse({ userId: userId, action: 'screen_view', screen: screen, duration: durationSeconds, metadata: metadata || {} });
    },
    trackAction: function (userId, action, screen, metadata) {
      sendSynapse({ userId: userId, action: action, screen: screen || 'unknown', duration: 0, metadata: metadata || {} });
    },
    trackHeatmapClick: function (x, y, screen) {
      fetch(apiUrl + '/heatmap/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: x, y: y, screen: screen || 'unknown', sessionId: sessionId, appName: appName })
      }).catch(function () {});
    },
    trackReplayEvent: function (type, data) {
      fetch(apiUrl + '/replay/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessionId, type: type, data: data || {}, appName: appName })
      }).catch(function () {});
    },
    getVariant: function (feature, userId) {
      return fetch(apiUrl + '/variant/' + encodeURIComponent(feature) + '?userId=' + encodeURIComponent(userId) + '&appName=' + encodeURIComponent(appName))
        .then(function (r) { return r.json(); })
        .catch(function () { return { variant: 'A', config: {} }; });
    },
    trackConversion: function (feature, variant, success, revenue) {
      fetch(apiUrl + '/ab-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature: feature, variant: variant, success: success, revenue: revenue, appName: appName })
      }).catch(function () {});
    },
    getPatches: function () {
      return fetch(apiUrl + '/evolution/patches?appName=' + encodeURIComponent(appName))
        .then(function (r) { return r.json(); })
        .then(function (d) { return d.patches || []; })
        .catch(function () { return []; });
    },
    applyPatchesToDocument: function () {
      this.getPatches().then(function (patches) {
        var style = document.getElementById('neuro-evolution-style') || (function () {
          var s = document.createElement('style');
          s.id = 'neuro-evolution-style';
          s.setAttribute('data-neuro-evolution', 'true');
          document.head.appendChild(s);
          return s;
        })();
        var css = patches
          .filter(function (p) { return p.type === 'css' && p.patch; })
          .map(function (p) {
            var sel = p.target.indexOf(' ') >= 0 || p.target.charAt(0) === '.' || p.target.charAt(0) === '#' ? p.target : '[data-neuro-screen="' + p.target + '"]';
            var rules = Object.keys(p.patch)
              .filter(function (k) { return k !== 'suggest' && k !== 'copyHint'; })
              .map(function (k) {
                var cssKey = k.replace(/([A-Z])/g, '-$1').toLowerCase();
                return cssKey + ': ' + p.patch[k];
              })
              .join('; ');
            return sel + ' { ' + rules + ' }';
          })
          .join('\n');
        style.textContent = css;
      });
    },
    runAnalyze: function () {
      return fetch(apiUrl + '/evolution/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName: appName })
      }).catch(function () {});
    },
    ready: function () {
      var c = this.check();
      if (typeof console !== 'undefined' && console.log) console.log('Neuro:', c.message);
      return c;
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NeuroCore;
  } else {
    global.NeuroCore = NeuroCore;
  }
})(typeof window !== 'undefined' ? window : this);

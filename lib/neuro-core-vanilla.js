/**
 * @libero/neuro-core-vanilla
 * Framework-agnostic Neuro-Core for any JS/TS app (no React/Vue/Svelte).
 * Her UI uygulamasında kendini otomatik geliştirir.
 */

(function (global) {
  let apiUrl = 'http://localhost:3001/api';
  let appName = 'unknown';
  let sessionId = '';

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

  function sendSynapse(data) {
    fetch(apiUrl + '/synapse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({}, data, { appName: appName, sessionId: sessionId }))
    }).catch(function () {});
  }

  var NeuroCore = {
    init: function (config) {
      apiUrl = config.apiUrl || apiUrl;
      appName = config.appName || appName;
      sessionId = getSessionId();
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
    }
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = NeuroCore;
  } else {
    global.NeuroCore = NeuroCore;
  }
})(typeof window !== 'undefined' ? window : this);

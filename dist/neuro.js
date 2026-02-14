/**
 * Libero Neuro-Core - Tek script tag ile entegrasyon
 * data-app="myapp" ile kullan; API key opsiyonel (dev modda localStorage kuyruğu)
 * Autocapture varsayılan açık.
 */
(function (global) {
  var QUEUE_KEY = 'neuro_queue';
  var MAX_QUEUE = 500;
  var LIBERO_CLOUD = 'https://api.libero.dev/api';

  var apiUrl = '';
  var appName = 'unknown';
  var sessionId = '';
  var autocapture = true;
  var lastFlush = 0;

  function getSessionId() {
    try {
      var s = sessionStorage.getItem('neuro_session_id');
      if (!s) {
        s = 's_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
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
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(arr.slice(-MAX_QUEUE)));
    } catch (e) {}
  }

  function enqueue(payload) {
    var q = getQueue();
    q.push({ t: Date.now(), payload: payload });
    setQueue(q);
    if (typeof console !== 'undefined' && console.log) {
      console.log('Neuro (dev): ' + q.length + ' event(s) in queue. Set apiUrl or use Libero Cloud.');
    }
  }

  function flushQueue() {
    if (!apiUrl) return Promise.resolve();
    var q = getQueue();
    if (q.length === 0) return Promise.resolve();
    setQueue([]);
    lastFlush = Date.now();
    q.forEach(function (x) {
      fetch(apiUrl + '/synapse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(x.payload)
      }).catch(function () { enqueue(x.payload); });
    });
    return Promise.resolve();
  }

  function sendOne(payload) {
    var p = { userId: payload.userId || 'anon', sessionId: sessionId, action: payload.action, screen: payload.screen || 'unknown', duration: payload.duration || 0, metadata: payload.metadata || {}, appName: appName };
    if (apiUrl) {
      fetch(apiUrl + '/synapse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p)
      }).catch(function () { enqueue(p); });
    } else {
      enqueue(p);
    }
  }

  function trackPageView(screen) {
    sendOne({ action: 'screen_view', screen: screen || (typeof location !== 'undefined' ? location.pathname || 'unknown' : 'unknown'), duration: 0 });
  }

  var Neuro = {
    init: function (config) {
      config = config || {};
      apiUrl = config.apiUrl || config.apiKey || apiUrl || LIBERO_CLOUD;
      appName = config.appName || config.app || appName;
      autocapture = config.autocapture !== false;
      sessionId = getSessionId();
      if (autocapture && typeof document !== 'undefined') {
        document.addEventListener('click', function (e) {
          var t = e.target;
          var sel = t && t.id ? '#' + t.id : (t && t.className && typeof t.className === 'string' ? '.' + t.className.split(' ')[0] : '');
          if (sel && sel.length < 100) sendOne({ action: 'click', screen: location.pathname || 'unknown', metadata: { selector: sel } });
        }, true);
        if (typeof location !== 'undefined') trackPageView();
      }
      return this;
    },
    track: function (action, metadata, screen) {
      sendOne({ action: action, screen: screen || (typeof location !== 'undefined' ? location.pathname : 'unknown'), metadata: metadata || {} });
      return this;
    },
    trackPageView: trackPageView,
    check: function () {
      var q = getQueue();
      return {
        queued: q.length,
        lastFlush: lastFlush || null,
        connected: !!apiUrl,
        appName: appName,
        message: apiUrl ? (q.length ? q.length + ' events in queue' : 'OK') : 'Dev mode: no apiUrl. ' + q.length + ' events queued.'
      };
    },
    setApiUrl: function (url) {
      apiUrl = url || LIBERO_CLOUD;
      return flushQueue();
    },
    flush: flushQueue,
    ready: function () {
      var c = this.check();
      if (typeof console !== 'undefined' && console.log) console.log('Neuro:', c.message);
      return c;
    }
  };

  if (typeof document !== 'undefined') {
    var script = document.currentScript;
    if (script && script.getAttribute('data-app')) {
      Neuro.init({ appName: script.getAttribute('data-app'), apiUrl: script.getAttribute('data-api') || '' });
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Neuro;
  } else {
    global.Neuro = Neuro;
  }
})(typeof window !== 'undefined' ? window : this);

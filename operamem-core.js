/**
 * OperaMem Core Engine v1.0.0
 * Lightweight persistent memory system
 * Based on claude-mem progressive disclosure design
 * License: MIT
 */

var OperaMem = {
  version: '1.0.0',
  basePath: '/sdcard/Download/Operit/memory',
  maxSummaryLength: 500,
  maxKeywords: 10,
  maxRecentItems: 100,
  TYPES: {
    DECISION: 'decision', BUGFIX: 'bugfix', INSIGHT: 'insight',
    TODO: 'todo', REFERENCE: 'reference', WARNING: 'warning'
  },
  IMPORTANCE: { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, TRIVIAL: 1 }
};

function generateId(prefix) {
  var ts = new Date().toISOString().replace(/[:.]/g, '-');
  var rnd = Math.random().toString(36).substring(2, 8);
  return (prefix || 'obs') + '_' + ts + '_' + rnd;
}

function getTimestamp() { return new Date().toISOString(); }

function timeAgo(iso) {
  var diff = Date.now() - new Date(iso).getTime();
  var m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  if (h < 24) return h + 'h ago';
  if (d < 7) return d + 'd ago';
  return iso.substring(0, 10);
}

function extractKeywords(text, maxKw) {
  maxKw = maxKw || 10;
  if (!text || typeof text !== 'string') return [];
  var cleaned = text.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]+`/g, ' ')
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ').toLowerCase();
  var words = [];
  var tokens = cleaned.split(/\s+/);
  for (var i = 0; i < tokens.length; i++) {
    var tk = tokens[i]; if (!tk) continue;
    var cn = tk.match(/[\u4e00-\u9fa5]/g);
    if (cn) words = words.concat(cn);
    if (/^[a-z]{3,}$/.test(tk)) words.push(tk);
  }
  var freq = {};
  for (var j = 0; j < words.length; j++) { var w = words[j]; freq[w] = (freq[w] || 0) + 1; }
  var sorted = Object.keys(freq).sort(function(a, b) { return freq[b] - freq[a]; });
  var stop = {'the':1,'a':1,'is':1,'to':1,'of':1,'in':1,'for':1,'on':1,'with':1,'and':1};
  var result = [];
  for (var k = 0; k < sorted.length && result.length < maxKw; k++) {
    if (!stop[sorted[k]] && sorted[k].length > 1) result.push(sorted[k]);
  }
  return result;
}

function createObservation(opts) {
  opts = opts || {};
  if (!opts.content) throw new Error('content required');
  var content = String(opts.content);
  return {
    id: generateId('obs'), created_at: getTimestamp(),
    type: opts.type || 'insight', content: content,
    summary: opts.summary || content.substring(0, 500),
    keywords: opts.keywords || extractKeywords(content),
    tags: opts.tags || [], project: opts.project || 'default',
    importance: opts.importance || 3
  };
}

function updateIndex(index, obs) {
  var add = function(map, key, id) {
    if (!map[key]) map[key] = [];
    if (map[key].indexOf(id) === -1) map[key].push(id);
  };
  for (var i = 0; i < obs.keywords.length; i++) add(index.keyword_index, obs.keywords[i], obs.id);
  for (var j = 0; j < obs.tags.length; j++) add(index.tag_index, obs.tags[j], obs.id);
  add(index.type_index, obs.type, obs.id);
  add(index.project_index, obs.project, obs.id);
  index.recent_observations.unshift(obs.id);
  index.stats.total_observations++;
  return index;
}

function search(index, observations, query) {
  query = query || {};
  var scores = {};
  var match = function(map, key, weight) {
    var ids = map[key] || [];
    for (var i = 0; i < ids.length; i++) scores[ids[i]] = (scores[ids[i]] || 0) + weight;
  };
  if (query.keywords) for (var k = 0; k < query.keywords.length; k++) match(index.keyword_index, query.keywords[k].toLowerCase(), 2);
  if (query.tags) for (var t = 0; t < query.tags.length; t++) match(index.tag_index, query.tags[t], 3);
  if (query.type) match(index.type_index, query.type, 1);
  if (query.project) match(index.project_index, query.project, 1);
  if (query.text) {
    var st = query.text.toLowerCase();
    for (var p = 0; p < observations.length; p++) {
      var o = observations[p];
      if (o.content.toLowerCase().indexOf(st) !== -1 || o.summary.toLowerCase().indexOf(st) !== -1)
        scores[o.id] = (scores[o.id] || 0) + 1;
    }
  }
  var results = [];
  var ids = Object.keys(scores);
  for (var r = 0; r < ids.length; r++) {
    for (var s = 0; s < observations.length; s++) {
      if (observations[s].id === ids[r]) { results.push({ observation: observations[s], score: scores[ids[r]] }); break; }
    }
  }
  results.sort(function(a, b) { return b.score - a.score; });
  return results.slice(0, query.limit || 10);
}

function buildContext(results) {
  var l1 = [], l2 = [], l3 = [];
  for (var i = 0; i < results.length; i++) {
    var o = results[i].observation;
    l1.push('[' + o.id + '] ' + o.summary.substring(0, 50) + '...');
    l2.push('[' + o.id + '] ' + timeAgo(o.created_at) + ' | ' + o.type + ' | ' + o.summary.substring(0, 100));
    l3.push('[' + o.id + '] ' + o.created_at + '\nType: ' + o.type + ' | Project: ' + o.project + '\n' + o.summary + '\n' + o.content.substring(0, 500));
  }
  return { layer1: l1.join('\n'), layer2: l2.join('\n\n'), layer3: l3.join('\n\n---\n\n'), totalResults: results.length };
}

if (typeof global !== 'undefined') {
  global.OperaMem = OperaMem; global.generateId = generateId;
  global.getTimestamp = getTimestamp; global.timeAgo = timeAgo;
  global.extractKeywords = extractKeywords; global.createObservation = createObservation;
  global.updateIndex = updateIndex; global.search = search; global.buildContext = buildContext;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { OperaMem: OperaMem, generateId: generateId, getTimestamp: getTimestamp,
    timeAgo: timeAgo, extractKeywords: extractKeywords, createObservation: createObservation,
    updateIndex: updateIndex, search: search, buildContext: buildContext };
}
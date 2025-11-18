const DEFAULT_FALLBACK = 'Not detected.';

function splitLines(content) {
  return (content || '')
    .split(/\r?\n/)
    .map((raw, index) => ({ raw, trimmed: raw.trim(), line: index + 1 }));
}

function detectLoops(lines) {
  const patterns = [/\bfor\b/i, /\bwhile\b/i, /\bdo\b\s*\{/i, /\.forEach\b/, /\bforeach\b/i];
  return lines
    .filter(({ trimmed }) => patterns.some((pattern) => pattern.test(trimmed)))
    .map(({ trimmed, line }) => `Line ${line}: ${trimmed}`);
}

function detectConditionals(lines) {
  const patterns = [/^if\b/i, /^else if\b/i, /^else\b/i, /\bswitch\b/i, /\bcase\b/i, /\?\s*.+:\s*/];
  return lines
    .filter(({ trimmed }) => patterns.some((pattern) => pattern.test(trimmed)))
    .map(({ trimmed, line }) => `Line ${line}: ${trimmed}`);
}

function detectRecursion(lines, functions = []) {
  const recursiveHits = [];
  const functionSet = new Set(functions);

  lines.forEach(({ trimmed, line }) => {
    functionSet.forEach((fn) => {
      const callPattern = new RegExp(`\\b${fn}\\s*\\(`);
      if (callPattern.test(trimmed) && /function|def|=>|:/.test(trimmed) === false) {
        recursiveHits.push(`Line ${line}: potential recursive call to ${fn}()`);
      }
    });
  });

  return recursiveHits;
}

function detectIO(lines) {
  const patterns = [
    /console\.log|print\s*\(|printf\s*\(/i,
    /fs\.|readFile|writeFile|open\s*\(/i,
    /System\.out|cout|cin|scanf|fprintf/i,
    /fetch\s*\(|axios\.|http\.get|requests\./i,
    /input\s*\(|prompt\s*\(/i
  ];

  return lines
    .filter(({ trimmed }) => patterns.some((pattern) => pattern.test(trimmed)))
    .map(({ trimmed, line }) => `Line ${line}: ${trimmed}`);
}

function detectEvents(lines) {
  const patterns = [/addEventListener\b/, /onClick|onSubmit|onChange|onLoad/i, /event\s*=>/, /dispatchEvent\b/, /handler\b/];
  return lines
    .filter(({ trimmed }) => patterns.some((pattern) => pattern.test(trimmed)))
    .map(({ trimmed, line }) => `Line ${line}: ${trimmed}`);
}

function detectState(lines) {
  const patterns = [/setState\b/, /useState\b/, /this\./, /state\s*=|state\s*:/i, /mutable/i];
  return lines
    .filter(({ trimmed }) => patterns.some((pattern) => pattern.test(trimmed)))
    .map(({ trimmed, line }) => `Line ${line}: ${trimmed}`);
}

function detectErrorHandling(lines) {
  const patterns = [/try\b/, /catch\b/, /finally\b/, /throw\b/, /Exception\b/];
  return lines
    .filter(({ trimmed }) => patterns.some((pattern) => pattern.test(trimmed)))
    .map(({ trimmed, line }) => `Line ${line}: ${trimmed}`);
}

function detectFunctionCalls(lines, functions = []) {
  const calls = {};
  let currentFn = 'Global scope';

  lines.forEach(({ trimmed }) => {
    const defMatch = functions.find((fn) => new RegExp(`(function|def|\b${fn}\b)\s*${fn}?\s*\\(`, 'i').test(trimmed));
    if (defMatch) {
      currentFn = defMatch;
      if (!calls[currentFn]) calls[currentFn] = new Set();
      return;
    }

    functions.forEach((fn) => {
      const callPattern = new RegExp(`\\b${fn}\\s*\\(`);
      if (callPattern.test(trimmed)) {
        if (!calls[currentFn]) calls[currentFn] = new Set();
        calls[currentFn].add(fn);
      }
    });
  });

  return Object.entries(calls).map(([caller, callees]) => {
    const unique = Array.from(callees).filter((callee) => callee !== caller);
    if (unique.length === 0) return null;
    return `${caller} calls ${unique.join(', ')}`;
  }).filter(Boolean);
}

function detectComplexityMarkers(lines) {
  const markers = [];
  const longLines = lines.filter(({ raw }) => raw.length > 100);
  if (longLines.length) {
    markers.push(`${longLines.length} long lines (over 100 characters) may reduce readability.`);
  }
  const nestingHints = lines.filter(({ trimmed }) => /\{\s*$/.test(trimmed) || /:\s*$/.test(trimmed)).length;
  if (nestingHints > 10) {
    markers.push('Many nested blocks detected; consider simplifying nested logic.');
  }
  return markers;
}

function commentStats(lines) {
  const commentLike = lines.filter(({ trimmed }) => /^(\/\/|#|<!--|\*|\/\*)/.test(trimmed)).length;
  const ratio = lines.length === 0 ? 0 : commentLike / lines.length;
  return { commentLines: commentLike, ratio };
}

function detectPseudocodeHints(loops, conditionals) {
  const hints = [];
  loops.slice(0, 3).forEach((loop) => hints.push(`Loop -> ${loop}`));
  conditionals.slice(0, 3).forEach((cond) => hints.push(`Branch -> ${cond}`));
  return hints;
}

function analyzePatterns(content, structure = {}, language = 'Unknown') {
  const lines = splitLines(content);
  const loops = detectLoops(lines);
  const conditionals = detectConditionals(lines);
  const recursion = detectRecursion(lines, structure.functions || []);
  const io = detectIO(lines);
  const events = detectEvents(lines);
  const state = detectState(lines);
  const errors = detectErrorHandling(lines);
  const relationships = detectFunctionCalls(lines, structure.functions || []);
  const complexity = detectComplexityMarkers(lines);
  const pseudocodeHints = detectPseudocodeHints(loops, conditionals);
  const comments = commentStats(lines);

  return {
    language,
    lineCount: lines.length,
    loops,
    conditionals,
    recursion,
    io,
    events,
    state,
    errors,
    relationships,
    complexity,
    pseudocodeHints,
    commentStats: comments
  };
}

function describeList(items, fallback = DEFAULT_FALLBACK, prefix = '-') {
  return items && items.length ? items.map((item) => `${prefix} ${item}`).join('\n') : fallback;
}

module.exports = {
  analyzePatterns,
  describeList
};

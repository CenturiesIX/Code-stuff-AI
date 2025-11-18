function parseLines(content) {
  return content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function extractFunctions(lines) {
  const functionPatterns = [
    /function\s+([\w$]+)/i,
    /const\s+([\w$]+)\s*=\s*\(/i,
    /([\w$]+)\s*=\s*function/i,
    /def\s+([\w$]+)/i,
    /([\w$]+)\s*:\s*function/i,
    /([\w$]+)\s*\(/
  ];

  const functions = new Set();
  lines.forEach((line) => {
    functionPatterns.forEach((pattern) => {
      const match = line.match(pattern);
      if (match && match[1]) {
        functions.add(match[1]);
      }
    });
  });
  return Array.from(functions);
}

function extractClasses(lines) {
  const classPatterns = [/class\s+([\w$]+)/i, /struct\s+([\w$]+)/i, /interface\s+([\w$]+)/i];
  const classes = new Set();
  lines.forEach((line) => {
    classPatterns.forEach((pattern) => {
      const match = line.match(pattern);
      if (match && match[1]) {
        classes.add(match[1]);
      }
    });
  });
  return Array.from(classes);
}

function extractGlobals(lines) {
  const globals = [];
  lines.forEach((line) => {
    if (/^(const|let|var)\s+[\w$]+/.test(line) || /^[\w$]+\s*=/.test(line)) {
      globals.push(line.split(/=|\s+/)[1]);
    }
  });
  return globals;
}

function extractControlFlow(lines) {
  const flowKeywords = ['if', 'else', 'switch', 'case', 'for', 'while', 'do', 'try', 'catch', 'finally'];
  return lines.filter((line) => flowKeywords.some((keyword) => line.startsWith(keyword)));
}

function parseCodeStructure(content, language) {
  if (!content || typeof content !== 'string') {
    return { functions: [], classes: [], globals: [], controlFlow: [] };
  }

  const lines = parseLines(content);
  return {
    language: language || 'Unknown',
    functions: extractFunctions(lines),
    classes: extractClasses(lines),
    globals: extractGlobals(lines),
    controlFlow: extractControlFlow(lines)
  };
}

module.exports = { parseCodeStructure };

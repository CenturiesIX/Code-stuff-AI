const path = require('path');

function buildCommentedCode(content, language) {
  const { prefix, suffix } = getCommentDelimiters(language);
  return content
    .split(/\r?\n/)
    .map((line) => `${prefix}${line}${suffix}`.trimEnd())
    .join('\n');
}

function getCommentDelimiters(language) {
  const map = {
    JavaScript: { prefix: '// ', suffix: '' },
    TypeScript: { prefix: '// ', suffix: '' },
    'C#': { prefix: '// ', suffix: '' },
    'C++': { prefix: '// ', suffix: '' },
    C: { prefix: '// ', suffix: '' },
    Java: { prefix: '// ', suffix: '' },
    Ruby: { prefix: '# ', suffix: '' },
    Python: { prefix: '# ', suffix: '' },
    Go: { prefix: '// ', suffix: '' },
    Rust: { prefix: '// ', suffix: '' },
    PHP: { prefix: '// ', suffix: '' },
    HTML: { prefix: '<!-- ', suffix: ' -->' },
    CSS: { prefix: '/* ', suffix: ' */' },
    JSON: { prefix: '// ', suffix: '' },
    'Plain Text': { prefix: '# ', suffix: '' }
  };
  return map[language] || { prefix: '# ', suffix: '' };
}

function formatList(items, fallback) {
  if (!items || items.length === 0) return fallback;
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function generateExplanation({ filePath, content, language, structure }) {
  const safePath = filePath ? path.basename(filePath) : 'Unknown file';
  const displayLanguage = language || 'Unknown';
  const fileStatus = content && content.trim().length > 0 ? 'Loaded' : 'Empty file';

  const overview = `File: ${safePath}\nLanguage: ${displayLanguage}\nStatus: ${fileStatus}`;
  const importantParts = formatList(
    [...(structure.classes || []), ...(structure.functions || []), ...(structure.globals || [])],
    'No notable functions, classes, or globals were detected.'
  );
  const controlFlow = formatList(structure.controlFlow || [], 'Control flow statements were not detected.');
  const tips = `• Look for repeated patterns to understand logic.\n• Trace input to output to follow data flow.\n• Comment confusing lines as you read.\n• Run the code only in safe, isolated environments.\n• Experiment by changing small parts to see the effect.`;
  const commentedSource = buildCommentedCode(content || '', displayLanguage);

  return [
    'Section 1. Overview',
    overview,
    '',
    'Section 2. Important parts (functions, classes, globals)',
    importantParts,
    '',
    'Section 3. Control flow',
    controlFlow,
    '',
    'Section 4. Beginner tips',
    tips,
    '',
    'Section 5. A commented version of the source code',
    commentedSource
  ].join('\n');
}

module.exports = { generateExplanation, getCommentDelimiters };

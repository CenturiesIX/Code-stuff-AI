const path = require('path');
const { analyzePatterns, describeList } = require('./patternAnalyzer');

function buildCommentedCode(content, language) {
  const { prefix, suffix } = getCommentDelimiters(language);
  return (content || '')
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

function summarizeStructure(structure = {}) {
  const functions = structure.functions || [];
  const classes = structure.classes || [];
  const globals = structure.globals || [];
  return {
    functions,
    classes,
    globals,
    summary: formatList(
      [...classes.map((c) => `Class ${c}`), ...functions.map((f) => `Function ${f}`), ...globals.map((g) => `Global ${g}`)],
      'No notable functions, classes, or globals were detected.'
    )
  };
}

function buildHigherLevelSummary(filePath, language, analysis, structure) {
  const safePath = filePath ? path.basename(filePath) : 'Unknown file';
  const mainUseHints = [];
  if ((analysis.io || []).length) mainUseHints.push('handles input/output (file, console, or network)');
  if ((analysis.events || []).length) mainUseHints.push('reacts to events or user actions');
  if ((analysis.state || []).length) mainUseHints.push('maintains internal state or configuration');
  if ((analysis.loops || []).length) mainUseHints.push('iterates over collections or ranges');
  const useLine = mainUseHints.length
    ? `Likely behavior: ${mainUseHints.join(', ')}.`
    : 'Likely behavior: general-purpose logic with minimal I/O.';

  return [
    `File: ${safePath}`,
    `Language: ${language || 'Unknown'}`,
    `Lines: ${analysis.lineCount}`,
    useLine,
    structure.classes.length ? `Classes: ${structure.classes.join(', ')}` : 'Classes: none detected',
    structure.functions.length ? `Functions: ${structure.functions.join(', ')}` : 'Functions: none detected'
  ].join('\n');
}

function buildPatternInsights(analysis) {
  return [
    'Loops:',
    describeList(analysis.loops, 'No loop constructs detected.'),
    '',
    'Conditions:',
    describeList(analysis.conditionals, 'No conditional branches detected.'),
    '',
    'Recursion hints:',
    describeList(analysis.recursion, 'No potential recursion spotted.'),
    '',
    'I/O patterns:',
    describeList(analysis.io, 'No explicit I/O found.'),
    '',
    'Events/handlers:',
    describeList(analysis.events, 'No event-driven code found.'),
    '',
    'State changes:',
    describeList(analysis.state, 'Stateful operations not highlighted.'),
    '',
    'Error handling:',
    describeList(analysis.errors, 'No explicit error handling spotted.')
  ].join('\n');
}

function buildDataFlowSection(structure, relationships) {
  const highlightedRelationships = describeList(relationships, 'No function call relationships detected.');
  const globalsHint = (structure.globals || []).length
    ? `Globals/constants used: ${structure.globals.join(', ')}`
    : 'Globals/constants used: none detected';
  return `${globalsHint}\n${highlightedRelationships}`;
}

function buildPseudocodeSection(analysis) {
  const pseudocode = analysis.pseudocodeHints.length
    ? analysis.pseudocodeHints.map((hint, idx) => `${idx + 1}. ${hint}`).join('\n')
    : 'No complex control flow found to convert to pseudocode.';
  return pseudocode;
}

function buildRiskSection(analysis) {
  const risks = [];
  if (!analysis.errors.length && (analysis.io.length || analysis.state.length)) {
    risks.push('I/O or state updates without visible try/catch may allow uncaught failures.');
  }
  if (analysis.recursion.length) {
    risks.push('Recursive calls detected; ensure base cases to avoid infinite loops.');
  }
  if (analysis.loops.length > 3) {
    risks.push('Multiple loops present; check for performance hot spots on large data.');
  }
  if (analysis.commentStats.ratio < 0.05 && analysis.lineCount > 20) {
    risks.push('Very few comments; beginners may struggle to follow intent.');
  }
  if (!analysis.loops.length && !analysis.conditionals.length && analysis.lineCount > 0) {
    risks.push('Straight-line code; ensure edge cases are handled explicitly.');
  }
  return describeList(risks, 'No obvious risks detected.', '-');
}

function buildReadabilitySection(analysis) {
  const notes = [];
  if (analysis.commentStats.ratio < 0.1) {
    notes.push('Add more inline comments to clarify decisions.');
  }
  if (analysis.complexity.length) {
    notes.push(...analysis.complexity);
  }
  if (!analysis.state.length && !analysis.events.length && !analysis.io.length && analysis.lineCount > 50) {
    notes.push('Consider splitting the file into smaller modules for clarity.');
  }
  return describeList(notes, 'Code already appears straightforward.', '-');
}

function buildBehaviorSummary(analysis) {
  const lines = [];
  if (analysis.io.length) lines.push('Handles input/output operations.');
  if (analysis.events.length) lines.push('Responds to events or callbacks.');
  if (analysis.state.length) lines.push('Maintains or mutates application state.');
  if (analysis.conditionals.length) lines.push('Makes decisions via conditionals.');
  if (analysis.loops.length) lines.push('Processes collections or repeated work in loops.');
  if (!lines.length) lines.push('General logic without obvious I/O or branching.');
  return describeList(lines, 'General logic without obvious I/O or branching.', '-');
}

function buildTipsSection() {
  return [
    '• Skim the pseudocode and pattern insights first to grasp behavior.',
    '• Trace how data enters (I/O) and where it flows between functions.',
    '• Highlight loops and conditions to see how the program reacts to inputs.',
    '• Add print/log lines in a safe sandbox if you need to observe runtime behavior.',
    '• Refactor long lines and add comments to make future changes easier.'
  ].join('\n');
}

function buildAiStyleSummary(structure, analysis) {
  const pieces = [];
  if (structure.classes.length) pieces.push(`wraps logic into ${structure.classes.length} class(es)`);
  if (structure.functions.length) pieces.push(`offers ${structure.functions.length} named function(s)`);
  if (analysis.io.length) pieces.push('touches the outside world through I/O');
  if (analysis.events.length) pieces.push('listens for events to react fluidly');
  if (analysis.loops.length || analysis.conditionals.length) pieces.push('balances iteration with branching to guide behavior');
  const base = pieces.length ? pieces.join(', ') : 'keeps the flow minimal and focused';
  return `In short, this code ${base}, suggesting a pragmatic solution that aims to stay readable while solving its task.`;
}

function generateExplanation({ filePath, content, language, structure }) {
  const displayLanguage = language || 'Unknown';
  const fileStatus = content && content.trim().length > 0 ? 'Loaded' : 'Empty file';
  const structureSummary = summarizeStructure(structure);
  const analysis = analyzePatterns(content || '', structure, displayLanguage);

  const overview = buildHigherLevelSummary(filePath, displayLanguage, analysis, structureSummary);
  const patternInsights = buildPatternInsights(analysis);
  const dataFlow = buildDataFlowSection(structureSummary, analysis.relationships);
  const behavior = buildBehaviorSummary(analysis);
  const pseudocode = buildPseudocodeSection(analysis);
  const risks = buildRiskSection(analysis);
  const readability = buildReadabilitySection(analysis);
  const commentedSource = buildCommentedCode(content || '', displayLanguage);
  const aiSummary = buildAiStyleSummary(structureSummary, analysis);

  return [
    'Section 1. Overview',
    overview,
    `Status: ${fileStatus}`,
    '',
    'Section 2. Important parts (functions, classes, globals)',
    structureSummary.summary,
    '',
    'Section 3. Control flow & patterns',
    patternInsights,
    '',
    'Section 4. Higher-level behavior & potential uses',
    behavior,
    '',
    'Section 5. Data flow and relationships',
    dataFlow,
    '',
    'Section 6. Pseudocode for complex logic',
    pseudocode,
    '',
    'Section 7. Risk and pitfalls',
    risks,
    '',
    'Section 8. Readability improvements',
    readability,
    '',
    'Section 9. Beginner tips',
    buildTipsSection(),
    '',
    'Section 10. A commented version of the source code',
    commentedSource,
    '',
    'AI-style summary',
    aiSummary
  ].join('\n');
}

module.exports = { generateExplanation, getCommentDelimiters };

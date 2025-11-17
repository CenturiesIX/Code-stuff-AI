const path = require('path');

const LANGUAGE_MAP = {
  '.js': 'JavaScript',
  '.ts': 'TypeScript',
  '.py': 'Python',
  '.java': 'Java',
  '.cs': 'C#',
  '.cpp': 'C++',
  '.c': 'C',
  '.rb': 'Ruby',
  '.go': 'Go',
  '.rs': 'Rust',
  '.php': 'PHP',
  '.html': 'HTML',
  '.css': 'CSS',
  '.json': 'JSON',
  '.txt': 'Plain Text'
};

function detectLanguage(filePath) {
  if (!filePath) return 'Unknown';
  const ext = path.extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] || `${ext.replace('.', '').toUpperCase()} (unrecognized)` || 'Unknown';
}

module.exports = { detectLanguage };

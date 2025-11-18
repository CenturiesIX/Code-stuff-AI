const fs = require('fs');
const path = require('path');

function isBinary(contentBuffer) {
  const ascii = contentBuffer.toString('ascii');
  return ascii.includes('\u0000');
}

function readFileSafe(filePath) {
  try {
    if (!filePath || typeof filePath !== 'string') {
      return { error: 'Invalid file path.' };
    }

    const normalized = path.resolve(filePath);
    const stats = fs.statSync(normalized);

    if (!stats.isFile()) {
      return { error: 'Selected path is not a file.' };
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    if (stats.size > maxSizeBytes) {
      return { error: 'File is too large to process safely (over 5MB).' };
    }

    const rawContent = fs.readFileSync(normalized);
    if (isBinary(rawContent)) {
      return { error: 'Binary files are not supported.' };
    }

    const content = rawContent.toString('utf8');
    return { content };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { error: 'File does not exist.' };
    }
    if (error.code === 'EACCES') {
      return { error: 'Permission denied when reading the file.' };
    }
    return { error: `Unable to read the file: ${error.message}` };
  }
}

module.exports = { readFileSafe };

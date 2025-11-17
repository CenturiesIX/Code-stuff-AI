const fileInfo = document.getElementById('fileInfo');
const languageInfo = document.getElementById('languageInfo');
const output = document.getElementById('output');
const openBtn = document.getElementById('openBtn');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const themeToggle = document.getElementById('themeToggle');

let currentExplanation = '';
let currentFilePath = '';
let currentLanguage = 'Unknown';
let isDark = false;

function setOutput(text) {
  output.textContent = text;
}

function updateStatus(filePath, language) {
  fileInfo.textContent = filePath ? `File: ${filePath}` : 'No file loaded';
  languageInfo.textContent = `Language: ${language || 'Unknown'}`;
}

function handleError(message) {
  const safeMessage = message || 'An unexpected error occurred.';
  setOutput(`Error: ${safeMessage}`);
  saveBtn.disabled = true;
}

async function openFile() {
  try {
    const result = await window.api.openFile();
    if (result.error) {
      handleError(result.error);
      return;
    }

    currentFilePath = result.filePath || '';
    currentLanguage = result.language || 'Unknown';
    currentExplanation = result.explanation || '';

    setOutput(currentExplanation);
    updateStatus(currentFilePath, currentLanguage);
    saveBtn.disabled = !currentExplanation;
  } catch (error) {
    handleError(error.message);
  }
}

async function saveExplanation() {
  if (!currentExplanation) return;
  try {
    const result = await window.api.saveExplanation({
      defaultPath: currentFilePath ? `${currentFilePath}.txt` : 'explanation.txt',
      content: currentExplanation
    });

    if (result.error) {
      handleError(result.error);
      return;
    }

    if (!result.canceled && result.filePath) {
      setOutput(`${currentExplanation}\n\nSaved to: ${result.filePath}`);
    }
  } catch (error) {
    handleError(error.message);
  }
}

function clearExplanation() {
  currentExplanation = '';
  currentFilePath = '';
  currentLanguage = 'Unknown';
  setOutput('Load a file to see the explanation here.');
  updateStatus('', currentLanguage);
  saveBtn.disabled = true;
}

function toggleTheme() {
  isDark = !isDark;
  document.body.className = isDark ? 'dark' : 'light';
  themeToggle.textContent = isDark ? 'Switch to Light' : 'Switch to Dark';
}

openBtn.addEventListener('click', openFile);
saveBtn.addEventListener('click', saveExplanation);
clearBtn.addEventListener('click', clearExplanation);
themeToggle.addEventListener('click', toggleTheme);

window.api.onTriggerOpenFile(openFile);
window.api.onTriggerSave(saveExplanation);

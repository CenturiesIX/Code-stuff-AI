# Code Explainer Desktop App

A Windows-friendly Electron desktop application that loads a source file and generates beginner-focused explanations with clear sections and a commented copy of the code.

## Features
- Detects language from file extensions and handles unknown formats gracefully.
- Safe file handling: rejects binary files, large files (>5MB), and surfaces helpful errors.
- Five-section explanation: overview, important parts, control flow, beginner tips, and a commented version of the source.
- Light/dark themes, toolbar for Open, Clear, and Save Explanation.
- Saves explanations as plain text without executing user code.

## Getting Started
1. Install dependencies: `npm install`
2. Start the desktop app: `npm start`

The application opens a window titled **Code Explainer**. Use the toolbar or the File menu to open code files and save generated explanations.

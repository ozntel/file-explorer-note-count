import { App } from "obsidian";

export function clearInsertedNumbers() {
  const allInsertedNumbers = document.querySelectorAll('.oz-folder-numbers');
  allInsertedNumbers.forEach((insertedNumber) => {
    insertedNumber.parentNode.removeChild(insertedNumber);
  });
}

export function updateFolderNumbers(app: App) {
  clearInsertedNumbers();

  // Get All Available Notes under Vault
  let mdNotes = app.vault.getMarkdownFiles();

  // Create Folder File Map
  const counts: { [key: string]: number } = {};
  mdNotes.forEach((mdNote) => {
    for (let folder = mdNote.parent; folder != null; folder = folder.parent) {
      counts[folder.path] = 1 + (counts[folder.path] || 0);
    }
  });

  // Loop Through File Explorer Elements
  let fileExplorers = app.workspace.getLeavesOfType('file-explorer');

  for (let fileExplorer of fileExplorers) {
    // @ts-ignore
    for (const [key, value] of Object.entries(fileExplorer.view.fileItems)) {
      if (value.titleEl.className === 'nav-folder-title') {
        // Get the Title Node
        let folderTitleNode: HTMLElement = value.titleEl;

        // Get Path of Folder Title
        let currentDataPath = folderTitleNode.getAttr('data-path');

        // No number for the Vault Main Folder
        if (currentDataPath === '/') continue;

        // Add Number of Notes
        if (counts[currentDataPath]) {
          let folderCount = folderTitleNode.createDiv({
            cls: 'oz-folder-numbers',
            text: counts[currentDataPath].toString(),
          });

          // Add Attribute if There is A Children Folder for CSS
          for (let child of value.children) {
            if (child.children) {
              folderCount.setAttr('haschild', 'true');
              break;
            }
          }
        }
      }
    }
  }
}

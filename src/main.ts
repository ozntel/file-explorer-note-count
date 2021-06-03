import { Plugin } from 'obsidian';

export default class FileExplorerNoteCount extends Plugin {

	async onload() {
		this.updateFolderNumbers();
		this.app.metadataCache.on('resolved', this.updateFolderNumbers);
		this.registerDomEvent(document, 'click', this.updateFolderNumbers);
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		this.clearInsertedNumbers();
		console.log('unloading plugin');
	}

	updateFolderNumbers = () => {

		this.clearInsertedNumbers();

		const allFolderTitleNodes = document.querySelectorAll('.nav-folder-title');

		// Get All Available Notes under Vault
		var mdNotes = this.app.vault.getMarkdownFiles();

		// Loop All Available Folder Titles
		allFolderTitleNodes.forEach(folderTitleNode => {

			// Get Path of Folder Title
			var currentDataPath = folderTitleNode.getAttr('data-path');

			// No number for the Vault Main Folder
			if (currentDataPath === '/') return;

			// Collapsed Folder Should include all notes under subfolders
			var folderPathRegex = new RegExp(currentDataPath + '/.*')
			var filteredNotes = mdNotes.filter(mdNote => {
				return mdNote.path.match(folderPathRegex)
			})
			var numberDiv = document.createElement('div');
			numberDiv.className = 'oz-folder-numbers';

			const isCollapsed = folderTitleNode.parentElement.className.includes('is-collapsed');

			// Check if has Child Ffolder
			var childRegex = new RegExp(currentDataPath + '/.*/.*')
			var hasChildFolder = mdNotes.some(mdNote => {
				return mdNote.path.match(childRegex);
			})

			if (isCollapsed || (!isCollapsed && !hasChildFolder)) {
				numberDiv.innerText = filteredNotes.length.toString();
				folderTitleNode.appendChild(numberDiv);
			}
		})
	}

	clearInsertedNumbers = () => {
		const allInsertedNumbers = document.querySelectorAll('.oz-folder-numbers');
		allInsertedNumbers.forEach(insertedNumber => {
			insertedNumber.parentNode.removeChild(insertedNumber);
		})
	}

}



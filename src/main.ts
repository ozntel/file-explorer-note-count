import { Plugin } from 'obsidian';

export default class FileExplorerNoteCount extends Plugin {

	async onload() {
		this.updateFolderNumbers();
		this.app.metadataCache.on('resolved', this.updateFolderNumbers);
		this.app.vault.on('create', this.updateFolderNumbers);
		this.app.vault.on('rename', this.updateFolderNumbers);
		this.app.vault.on('delete', this.updateFolderNumbers);
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

		// Create Folder File Map
		const counts: { [key: string]: number } = {};

		mdNotes.forEach(mdNote => {
			for (let folder = mdNote.parent; folder != null; folder = folder.parent) {
				counts[folder.path] = 1 + (counts[folder.path] || 0)
			}
		})

		// Loop All Available Folder Titles
		allFolderTitleNodes.forEach(folderTitleNode => {

			// Get Path of Folder Title
			var currentDataPath = folderTitleNode.getAttr('data-path');

			// No number for the Vault Main Folder
			if (currentDataPath === '/') return;

			const isCollapsed = folderTitleNode.parentElement.className.includes('is-collapsed');

			// Check if has Child Ffolder
			var childRegex = new RegExp(currentDataPath + '/.*/.*')
			var hasChildFolder = mdNotes.some(mdNote => {
				return mdNote.path.match(childRegex);
			})

			if (isCollapsed || (!isCollapsed && !hasChildFolder)) {
				folderTitleNode.createDiv(
					{
						cls: 'oz-folder-numbers',
						text: counts[currentDataPath].toString()
					}
				)
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
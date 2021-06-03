import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, FileExplorerNoteCountSettings, FileExplorerNoteCountSettingsTab } from './settings';
import './main.css'

export default class FileExplorerNoteCount extends Plugin {

	settings: FileExplorerNoteCountSettings;
	loadedStyles: Array<HTMLStyleElement>;

	async onload() {
		this.addSettingTab(new FileExplorerNoteCountSettingsTab(this.app, this));
		await this.loadSettings();
		if (!this.settings.showAllNumbers) this.loadStyle();
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
		this.app.vault.off('create', this.updateFolderNumbers);
		this.app.vault.off('rename', this.updateFolderNumbers);
		this.app.vault.off('delete', this.updateFolderNumbers);
		this.unloadStyle();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	updateFolderNumbers = () => {

		this.clearInsertedNumbers();

		// Get All Available Notes under Vault
		var mdNotes = this.app.vault.getMarkdownFiles();

		// Create Folder File Map
		const counts: { [key: string]: number } = {};
		mdNotes.forEach(mdNote => {
			for (let folder = mdNote.parent; folder != null; folder = folder.parent) {
				counts[folder.path] = 1 + (counts[folder.path] || 0)
			}
		})

		// Loop Through File Explorer Elements
		var fileExplorers = this.app.workspace.getLeavesOfType("file-explorer");

		for (let fileExplorer of fileExplorers) {
			// @ts-ignore
			for (const [key, value] of Object.entries(fileExplorer.view.fileItems)) {

				if (value.titleEl.className === 'nav-folder-title') {
					// Get the Title Node
					var folderTitleNode: HTMLElement = value.titleEl;

					// Get Path of Folder Title
					var currentDataPath = folderTitleNode.getAttr('data-path');

					// No number for the Vault Main Folder
					if (currentDataPath === '/') continue;

					// Add Number of Notes
					if (counts[currentDataPath]) {
						var folderCount = folderTitleNode.createDiv({ cls: 'oz-folder-numbers', text: counts[currentDataPath].toString() })

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

	clearInsertedNumbers = () => {
		const allInsertedNumbers = document.querySelectorAll('.oz-folder-numbers');
		allInsertedNumbers.forEach(insertedNumber => {
			insertedNumber.parentNode.removeChild(insertedNumber);
		})
	}

	// Style Settings

	loadStyle = () => {
		this.loadedStyles = Array<HTMLStyleElement>(0);
		var style = document.createElement("style");
		style.innerHTML = collapseStyle;
		document.head.appendChild(style);
		this.loadedStyles.push(style);
	}

	unloadStyle = () => {
		for (let style of this.loadedStyles) {
			document.head.removeChild(style);
		}
		this.loadedStyles = Array<HTMLStyleElement>(0);
	}

	handleStyleToggle = (newStyle: boolean) => {
		if (!newStyle) {
			this.loadStyle();
		} else {
			this.unloadStyle();
		}
	}

}

const collapseStyle = `
	.nav-folder:not(.is-collapsed) > .nav-folder-title > .oz-folder-numbers { 
		display: none; 
	}

	.oz-folder-numbers:not([haschild='true']){
		display: inline !important;
	}
`
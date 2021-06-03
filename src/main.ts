import { Plugin } from 'obsidian';
import { DEFAULT_SETTINGS, FileExplorerNoteCountSettings, FileExplorerNoteCountSettingsTab } from './settings';
import './main.css'
import { clearInsertedNumbers, updateFolderNumbers } from './core';

export default class FileExplorerNoteCount extends Plugin {

	settings = DEFAULT_SETTINGS;
	loadedStyles: HTMLStyleElement[] = [];

	updateFolderNumbers = () => {
    updateFolderNumbers(this.app);
  };

	async onload() {
		this.addSettingTab(new FileExplorerNoteCountSettingsTab(this.app, this));
		await this.loadSettings();
		if (!this.settings.showAllNumbers) this.loadStyle();
		this.updateFolderNumbers();
		this.registerEvent(
      this.app.metadataCache.on('resolved', this.updateFolderNumbers),
    );
		this.registerEvent(this.app.vault.on('create', this.updateFolderNumbers));
		this.registerEvent(this.app.vault.on('rename', this.updateFolderNumbers));
		this.registerEvent(this.app.vault.on('delete', this.updateFolderNumbers));
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		clearInsertedNumbers();
		console.log('unloading plugin');
		this.unloadStyle();
	}

	async loadSettings() {
		this.settings = { ...this.settings, ...(await this.loadData()) };
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	// Style Settings

	loadStyle = () => {
		this.loadedStyles.length = 0;
		let style = document.createElement("style");
		style.innerHTML = collapseStyle;
		document.head.appendChild(style);
		this.loadedStyles.push(style);
	}

	unloadStyle = () => {
		for (let style of this.loadedStyles) {
			document.head.removeChild(style);
		}
		this.loadedStyles.length = 0;
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
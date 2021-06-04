import { PluginSettingTab, App, Setting } from 'obsidian';
import FileExplorerNoteCount from './main';


export interface FileExplorerNoteCountSettings {
	showAllNumbers: boolean,
}

export const DEFAULT_SETTINGS: FileExplorerNoteCountSettings = {
	showAllNumbers: false,
}

export class FileExplorerNoteCountSettingsTab extends PluginSettingTab {
	plugin: FileExplorerNoteCount;

	constructor(app: App, plugin: FileExplorerNoteCount) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let { containerEl } = this;
		containerEl.empty();
		containerEl.createEl('h2', { text: 'File Explorer Note Count Settings' });

		new Setting(containerEl)
			.setName('Show All Numbers')
			.setDesc('Turn on this option if you want to see the number of notes even after you expand the collapsed folders')
			.addToggle((toggle) => toggle
				.setValue(this.plugin.settings.showAllNumbers)
				.onChange((value) => {
					document.body.toggleClass('oz-show-all-num', value);
					this.plugin.settings.showAllNumbers = value;
					this.plugin.saveSettings();
				})
			);
	}
}

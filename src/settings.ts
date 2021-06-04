import { PluginSettingTab, App, Setting, TAbstractFile, TFile } from 'obsidian';
import FileExplorerNoteCount from './main';

export interface FileExplorerNoteCountSettings {
    showAllNumbers: boolean;
    filterList: string[][];
}

export const DEFAULT_SETTINGS: FileExplorerNoteCountSettings = {
    showAllNumbers: false,
    filterList: [['md']],
};

export class FileExplorerNoteCountSettingsTab extends PluginSettingTab {
    plugin: FileExplorerNoteCount;

    constructor(app: App, plugin: FileExplorerNoteCount) {
        super(app, plugin);
        this.plugin = plugin;
    }

    delayTimer?: number;

    display(): void {
        let { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', {
            text: 'File Explorer Note Count Settings',
        });

        new Setting(containerEl)
            .setName('Show All Numbers')
            .setDesc(
                'Turn on this option if you want to see the number of notes even after you expand the collapsed folders',
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showAllNumbers)
                    .onChange((value) => {
                        document.body.toggleClass('oz-show-all-num', value);
                        this.plugin.settings.showAllNumbers = value;
                        this.plugin.saveSettings();
                    }),
            );
        new Setting(this.containerEl)
            .setName('Filter List')
            .setDesc(
                createFragment((descEl) => {
                    descEl.appendText(
                        'Extension list to include and exclude file during counting',
                    );
                    descEl.appendChild(document.createElement('br'));
                    descEl.appendText('Separated by line break and/or comma');
                    descEl.appendChild(document.createElement('br'));
                    descEl.appendText(
                        'enter "md" to include markdown file, "^mp4" to exclude mp4 file',
                    );
                }),
            )
            .addTextArea((text) => {
                text.setValue(
                    this.plugin.settings.filterList
                        .map((array) => array.join(','))
                        .join('\n'),
                ).onChange((value) => {
                    if (this.delayTimer) window.clearTimeout(this.delayTimer);
                    this.delayTimer = window.setTimeout(async () => {
                        const list = value
                            .split('\n')
                            .map((stringArray) =>
                                stringArray.split(',').map((key) => key.trim()),
                            );
                        this.plugin.settings.filterList = list;
                        this.plugin.reloadCount();
                        await this.plugin.saveSettings();
                    }, 500);
                });
                text.inputEl.rows = 3;
                text.inputEl.cols = 25;
            });
    }
}

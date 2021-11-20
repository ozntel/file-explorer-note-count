import { equals } from 'misc';
import { App, debounce, PluginSettingTab, Setting } from 'obsidian';

import FileExplorerNoteCount from './fec-main';

export interface FENoteCountSettings {
    showAllNumbers: boolean;
    filterList: string[];
    blacklist: boolean;
    filterFolderNote: boolean;
}

export const DEFAULT_SETTINGS: FENoteCountSettings = {
    showAllNumbers: false,
    filterList: ['md'],
    blacklist: false,
    filterFolderNote: true,
};

export class FENoteCountSettingTab extends PluginSettingTab {
    plugin: FileExplorerNoteCount;

    constructor(app: App, plugin: FileExplorerNoteCount) {
        super(app, plugin);
        this.plugin = plugin;
    }

    get showOnlyNoteValue(): boolean {
        const { settings } = this.plugin;
        return (
            settings.blacklist === DEFAULT_SETTINGS.blacklist &&
            equals(settings.filterList, DEFAULT_SETTINGS.filterList)
        );
    }

    set showOnlyNoteValue(value: boolean) {
        const { blacklist, filterList } = DEFAULT_SETTINGS;
        this.plugin.settings.blacklist = blacklist;
        if (value) {
            // do deep copy
            this.plugin.settings.filterList = Array.from(filterList);
        } else {
            this.plugin.settings.filterList.length = 0;
        }
    }

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
        new Setting(containerEl)
            .setName('Exclude Folder Note from Counts')
            .setDesc(
                createFragment((frag) => {
                    frag.appendText('Only work with');
                    frag.createEl('a', {
                        href: 'https://github.com/aidenlx/folder-note-core',
                        text: 'Folder Note Core',
                    });
                    frag.appendText(' Installed and Enabled');
                }),
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.filterFolderNote)
                    .onChange((value) => {
                        this.plugin.settings.filterFolderNote = value;
                        this.plugin.saveSettings();
                    }),
            );
        this.filterOpt();
    }

    filterOpt(): void {
        new Setting(this.containerEl)
            .setName('Show Only Markdown Notes')
            .setDesc(
                'Turn off this option to choose file that should be counted',
            )
            .addToggle((toggle) =>
                toggle.setValue(this.showOnlyNoteValue).onChange((value) => {
                    this.showOnlyNoteValue = value;
                    this.plugin.reloadCount();
                    this.plugin.saveSettings();
                    this.display();
                }),
            );
        if (!this.showOnlyNoteValue) {
            new Setting(this.containerEl)
                .setName('Filter List')
                .setDesc(
                    createFragment((descEl) => {
                        descEl.appendText(
                            'Extension list to include/exclude file during counting',
                        );
                        descEl.appendChild(document.createElement('br'));
                        descEl.appendText('Separated by comma');
                    }),
                )
                .addTextArea((text) => {
                    const onChange = async (value: string) => {
                        const list = value.split(',').map((v) => v.trim());
                        this.plugin.settings.filterList = list;
                        this.plugin.reloadCount();
                        await this.plugin.saveSettings();
                    };
                    text.setPlaceholder(
                        'Leave it empty to count all types of files',
                    );
                    text.setValue(
                        this.plugin.settings.filterList.join(', '),
                    ).onChange(debounce(onChange, 500, true));
                    text.inputEl.rows = 2;
                    text.inputEl.cols = 25;
                });
            new Setting(this.containerEl)
                .setName('Enable Blacklist')
                .setDesc(
                    'Turn on this option to use Filter List to exclude files',
                )
                .addToggle((toggle) =>
                    toggle
                        .setValue(this.plugin.settings.blacklist)
                        .onChange((value) => {
                            this.plugin.settings.blacklist = value;
                            this.plugin.reloadCount();
                            this.plugin.saveSettings();
                        }),
                );
        }
    }
}

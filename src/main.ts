import './styles/patch.css';

import { AbstractFileFilter, getParentPath, withSubfolderClass } from 'misc';
import { FileExplorer, Plugin, TAbstractFile, TFile, TFolder } from 'obsidian';
import { dirname } from 'path-browserify';

import { setupCount, updateCount } from './folder-count';
import { DEFAULT_SETTINGS, FENoteCountSettingTab } from './settings';

export default class FileExplorerNoteCount extends Plugin {
    settings = DEFAULT_SETTINGS;

    fileExplorer?: FileExplorer;

    onRename = (af: TAbstractFile, oldPath: string) => {
        // only update when file is moved to other location
        // if af is TFolder, its count will be updated when its children are renamed
        if (af instanceof TFolder && dirname(af.path) === dirname(oldPath))
            return;

        updateCount(af, this);
        const oldParent = getParentPath(oldPath);
        // when file is moved alone (not with folder)
        if (this.app.vault.getAbstractFileByPath(oldParent))
            updateCount(oldPath, this);
    };

    registerVaultEvent() {
        // attach events on new folder
        this.registerEvent(
            this.app.vault.on('create', (af) => {
                updateCount(af, this);
            }),
        );
        // include mv and rename
        this.registerEvent(this.app.vault.on('rename', this.onRename));
        this.registerEvent(
            this.app.vault.on('delete', (af) => {
                updateCount(af, this);
            }),
        );
    }

    initialize = (revert = false) => {
        const leaves = this.app.workspace.getLeavesOfType('file-explorer');
        if (leaves.length > 1) console.error('more then one file-explorer');
        else if (leaves.length < 1) console.error('file-explorer not found');
        else {
            if (!this.fileExplorer)
                this.fileExplorer = leaves[0].view as FileExplorer;
            setupCount(this, revert);
            if (!revert) this.registerVaultEvent();
            if (revert) {
                for (const el of document.getElementsByClassName(
                    withSubfolderClass,
                )) {
                    el.removeClass(withSubfolderClass);
                }
            }
            if (this.settings.showAllNumbers)
                document.body.addClass('oz-show-all-num');
        }
    };

    async onload() {
        console.log('loading FileExplorerNoteCount');
        this.addSettingTab(new FENoteCountSettingTab(this.app, this));
        await this.loadSettings();
        this.app.workspace.onLayoutReady(this.initialize);
    }

    onunload() {
        console.log('unloading FileExplorerNoteCount');
        this.initialize(true);
    }

    async loadSettings() {
        this.settings = { ...this.settings, ...(await this.loadData()) };
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    reloadCount() {
        setupCount(this);
    }

    get fileFilter(): AbstractFileFilter {
        let list = this.settings.filterList;
        return (af) => {
            if (af instanceof TFile) {
                const { extension: target } = af;
                // if list is empty, filter nothing
                if (list.length === 0) return true;
                else if (this.settings.blacklist) return !list.includes(target);
                else return list.includes(target);
            } else return false;
        };
    }
}

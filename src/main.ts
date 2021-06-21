import './styles/patch.css';

import {
    AbstractFileFilter,
    showAllNumbersClass,
    withSubfolderClass,
} from 'misc';
import { FileExplorer, Plugin, TFile } from 'obsidian';
import { VaultHandler } from 'vault-handler';

import { setupCount } from './folder-count';
import { DEFAULT_SETTINGS, FENoteCountSettingTab } from './settings';

export default class FileExplorerNoteCount extends Plugin {
    settings = DEFAULT_SETTINGS;

    fileExplorer?: FileExplorer;

    vaultHandler = new VaultHandler(this);

    initialize = (revert = false) => {
        const leaves = this.app.workspace.getLeavesOfType('file-explorer');
        if (leaves.length > 1) console.error('more then one file-explorer');
        else if (leaves.length < 1) console.error('file-explorer not found');
        else {
            if (!this.fileExplorer)
                this.fileExplorer = leaves[0].view as FileExplorer;
            setupCount(this, revert);
            if (!revert) {
                this.vaultHandler.registerVaultEvent();
                if (this.settings.showAllNumbers)
                    document.body.addClass('oz-show-all-num');
            } else {
                for (const el of document.getElementsByClassName(
                    withSubfolderClass,
                )) {
                    el.removeClass(withSubfolderClass);
                }
                document.body.removeClass(showAllNumbersClass);
            }
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

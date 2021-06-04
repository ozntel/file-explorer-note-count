import { FileExplorer, Plugin, TFile } from 'obsidian';
import { DEFAULT_SETTINGS, FENoteCountSettingTab } from './settings';
import { setupCount, updateCount } from './folder-count';
import { dirname } from 'path';
import { withSubfolderClass, AbstractFileFilter } from 'misc';
import './styles/patch.css';

export default class FileExplorerNoteCount extends Plugin {
    settings = DEFAULT_SETTINGS;

    fileExplorer?: FileExplorer;

    registerVaultEvent() {
        // attach events on new folder
        this.registerEvent(
            this.app.vault.on('create', (af) => {
                updateCount(af, this);
            }),
        );
        // include mv and rename
        this.registerEvent(
            this.app.vault.on('rename', (af, oldPath) => {
                // when file is moved
                if (dirname(af.path) !== dirname(oldPath)) {
                    updateCount(af, this);
                    updateCount(oldPath, this);
                }
            }),
        );
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
        this.addSettingTab(
            new FENoteCountSettingTab(this.app, this),
        );
        await this.loadSettings();
        if (this.app.workspace.layoutReady) this.initialize();
        else
            this.registerEvent(
                this.app.workspace.on('layout-ready', this.initialize),
            );
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
        const list = this.settings.filterList.flat();
        // return empty array directly if filterList is empty
        const blackList = list.length
            ? list.filter((ex) => ex.startsWith('^')).map((v) => v.substring(1))
            : [];
        const whiteList = list.length
            ? list.filter((ex) => !ex.startsWith('^'))
            : [];
        return (af) => {
            if (af instanceof TFile) {
                const { extension: target } = af;
                // if list is empty, filter nothing
                if (list.length === 0) return true;
                // whitelist has higher priority
                else if (whiteList.length)
                    return whiteList.findIndex((ex) => target === ex) !== -1;
                else if (blackList.length)
                    return blackList.every((ex) => target !== ex);
                else
                    throw new Error(
                        'FileFilter error: entry that should not be reached',
                    );
            } else return false;
        };
    }
}

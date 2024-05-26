import './styles/patch.css';

import { AbstractFileFilter, showAllNumbersClass, withSubfolderClass, doWithFileExplorer } from 'misc';
import { around } from 'monkey-around';
import { FileExplorer, Plugin, TFile } from 'obsidian';
import { VaultHandler } from 'vault-handler';

import { setupCount } from './folder-count';
import { DEFAULT_SETTINGS, FENoteCountSettingTab } from './settings';

export default class FileExplorerNoteCount extends Plugin {
    settings = DEFAULT_SETTINGS;
    fileExplorer?: FileExplorer;
    vaultHandler = new VaultHandler(this);
    rootFolderEl: Element | null = null;
    explorerNavHeaderSelector: string = '.workspace-leaf-content[data-type="file-explorer"] .nav-header';
    rootFolderClassName: string = 'oz-explorer-root-folder';

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

    initialize = (revert = false) => {
        let plugin = this;
        // First Check if the root folder exists
        let explorerHeaderEl = document.querySelector(`${this.explorerNavHeaderSelector} .${this.rootFolderClassName}`);
        if (explorerHeaderEl) this.rootFolderEl = explorerHeaderEl;

        const getViewHandler = (revert: boolean) => (view: FileExplorer) => {
            this.fileExplorer = view;
            setupCount(this, revert);
            this.setupRootFolder(revert);
            if (!revert) {
                this.registerEvent(this.app.workspace.on('css-change', this.setupRootFolder));
                this.vaultHandler.registerVaultEvent();
                if (this.settings.showAllNumbers) document.body.addClass('oz-show-all-num');
            } else {
                for (const el of document.getElementsByClassName(withSubfolderClass)) {
                    el.removeClass(withSubfolderClass);
                }
                document.body.removeClass(showAllNumbersClass);
            }
            if (!revert) {
                // when file explorer is closed (workspace changed)
                // try to update fehanlder with new file explorer instance
                this.register(
                    around(view, {
                        onClose: (next) =>
                            function (this: FileExplorer) {
                                setTimeout(() => doWithFileExplorer(plugin, getViewHandler(false)), 1e3);
                                return next.apply(this);
                            },
                    })
                );
            }
        };
        doWithFileExplorer(plugin, getViewHandler(revert));
    };

    setupRootFolder = (revert = false) => {
        if (!this.fileExplorer) {
            console.error('file-explorer not found');
            return;
        }
        const root = this.fileExplorer.fileItems['/'];
        if (this.rootFolderEl && !this.settings.addRootFolder) {
            this.rootFolderEl.remove();
            this.rootFolderEl = null;
        }
        // Check if root is provided by Obsidian (it shouldn't be in the new releases)
        if (!root) {
            // Get the Nav Header
            let explorerHeaderEl = document.querySelector(this.explorerNavHeaderSelector);
            if (!explorerHeaderEl) return;
            if (!this.rootFolderEl && this.settings.addRootFolder) {
                this.rootFolderEl = explorerHeaderEl.createEl('div', {
                    cls: ['tree-item', 'nav-folder', this.rootFolderClassName],
                });
                this.rootFolderEl.innerHTML = `
                <div class="oz-explorer-root-nav-folder-title" data-path="/">
                    <div class="tree-item-inner nav-folder-title-content">${this.app.vault.getName()}</div>
                </div>
                `;
            }
        }
    };

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

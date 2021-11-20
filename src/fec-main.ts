import './styles/patch.css';

import { getApi } from '@aidenlx/folder-note-core';
import {
    AbstractFileFilter,
    rootHiddenClass,
    showAllNumbersClass,
    withSubfolderClass,
} from 'misc';
import { around } from 'monkey-around';
import { FileExplorer, Plugin, TFile } from 'obsidian';
import { VaultHandler } from 'vault-handler';

import { setupCount } from './folder-count';
import { DEFAULT_SETTINGS, FENoteCountSettingTab } from './settings';

export default class FileExplorerNoteCount extends Plugin {
    settings = DEFAULT_SETTINGS;

    fileExplorer?: FileExplorer;

    vaultHandler = new VaultHandler(this);

    /** compatible with theme that hide root folder */
    doHiddenRoot = (revert = false) => {
        if (!this.fileExplorer) {
            console.error('file-explorer not found');
            return;
        }
        const root = this.fileExplorer.fileItems['/'];
        const styles = getComputedStyle(root.titleInnerEl);
        const setup = () => {
            const shouldHide =
                styles.display === 'none' ||
                styles.color === 'rgba(0, 0, 0, 0)';
            root.titleEl.toggleClass(rootHiddenClass, !revert && shouldHide);
        };
        if (styles.display !== '') setup();
        else {
            let count = 0;
            const doId = window.setInterval(() => {
                if (count > 10) {
                    console.error('%o styles empty', root.titleInnerEl);
                    window.clearInterval(doId);
                } else if (styles.display === '') {
                    count++;
                } else {
                    setup();
                    window.clearInterval(doId);
                }
            }, 100);
        }
    };

    initialize = (revert = false) => {
        const doWithFileExplorer = (callback: (view: FileExplorer) => void) => {
            let leaves,
                count = 0;
            const tryGetView = () => {
                leaves = this.app.workspace.getLeavesOfType('file-explorer');
                if (leaves.length === 0) {
                    if (count++ > 5)
                        console.error('failed to get file-explorer');
                    else {
                        console.log('file-explorer not found, retrying...');
                        setTimeout(tryGetView, 500);
                    }
                } else {
                    if (leaves.length > 1)
                        console.warn('more then one file-explorer');
                    callback(leaves[0].view as FileExplorer);
                }
            };
            tryGetView();
        };
        const getViewHandler = (revert: boolean) => (view: FileExplorer) => {
            this.fileExplorer = view;

            setupCount(this, revert);
            this.doHiddenRoot(revert);
            if (!revert) {
                this.registerEvent(
                    this.app.workspace.on('css-change', this.doHiddenRoot),
                );
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

            if (!revert) {
                // when file explorer is closed (workspace changed)
                // try to update fehanlder with new file explorer instance
                this.register(
                    around(view, {
                        onClose: (next) =>
                            function (this: FileExplorer) {
                                setTimeout(
                                    () =>
                                        doWithFileExplorer(
                                            getViewHandler(false),
                                        ),
                                    1e3,
                                );
                                return next.apply(this);
                            },
                    }),
                );
            }
        };
        doWithFileExplorer(getViewHandler(revert));
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
                let api;
                if (
                    this.settings.filterFolderNote &&
                    (api = getApi(this)) &&
                    !!api.getFolderFromNote(af)
                ) {
                    return false;
                }
                const { extension: target } = af;
                // if list is empty, filter nothing
                if (list.length === 0) return true;
                else if (this.settings.blacklist) return !list.includes(target);
                else return list.includes(target);
            } else return false;
        };
    }
}

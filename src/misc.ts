import FileExplorerNoteCount from 'main';
import { AFItem, FileExplorer, FolderItem, TAbstractFile, TFolder } from 'obsidian';
import { dirname } from 'path-browserify';

export const withSubfolderClass = 'oz-with-subfolder';
export const showAllNumbersClass = 'oz-show-all-num';
export const rootHiddenClass = 'oz-root-hidden';

export const isFolder = (item: AFItem): item is FolderItem => (item as FolderItem).file instanceof TFolder;

export const iterateItems = (items: FileExplorer['fileItems'], callback: (item: AFItem) => any): void => {
    for (const key in items) {
        if (!Object.prototype.hasOwnProperty.call(items, key)) continue;
        callback(items[key]);
    }
};

export const getParentPath = (src: string): string | null => {
    if (src === '/') return null;
    const path = dirname(src);
    if (path === '.') return '/';
    else return path;
};

export type AbstractFileFilter = (af: TAbstractFile) => boolean;

export const equals = (arr1: any, arr2: any) => {
    // if the other array is a falsy value, return
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false;

    // compare lengths - can save a lot of time
    if (arr1.length != arr2.length) return false;

    return arr1.every((v, i) => v === arr2[i]);
};

export const isParent = (parent: string, child: string): boolean => {
    if (child === parent) return false;
    if (parent === '/') parent = '';
    if (child === '/') child = '';
    const parentTokens = parent.split('/').filter((i) => i.length);
    return parentTokens.every((t, i) => child.split('/')[i] === t);
};

// Helper to play with the File Explorer (if exists)
export const doWithFileExplorer = (plugin: FileExplorerNoteCount, callback: (view: FileExplorer) => void) => {
    let leaves;
    let count = 0;
    const tryGetView = () => {
        leaves = plugin.app.workspace.getLeavesOfType('file-explorer');
        if (leaves.length === 0) {
            if (count++ > 5) console.error('failed to get file-explorer');
            else {
                console.log('file-explorer not found, retrying...');
                setTimeout(tryGetView, 500);
            }
        } else {
            if (leaves.length > 1) console.warn('more then one file-explorer');
            callback(leaves[0].view as FileExplorer);
        }
    };
    tryGetView();
};

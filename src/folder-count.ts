import './styles/folder-count.css';

import FileExplorerNoteCount from 'main';
import {
    AbstractFileFilter,
    getParentPath,
    isFolder,
    iterateItems,
    withSubfolderClass,
} from 'misc';
import { AFItem, FolderItem, TAbstractFile, TFolder } from 'obsidian';

const countFolderChildren = (folder: TFolder, filter: AbstractFileFilter) => {
    let count = 0;
    for (const af of folder.children) {
        if (filter(af)) count++;
        if (af instanceof TFolder) count += countFolderChildren(af, filter);
    }
    return count;
};

export const updateCount = (
    file: string | TAbstractFile,
    plugin: FileExplorerNoteCount,
) => {
    if (!plugin.fileExplorer) throw new Error('fileExplorer not found');
    const explorer = plugin.fileExplorer;

    const iterate = (folder: TFolder) => {
        if (!folder.isRoot()) {
            setCount(
                explorer.fileItems[folder.path] as FolderItem,
                plugin.fileFilter,
            );
            iterate(folder.parent);
        }
    };

    let parent: TFolder;
    if (typeof file === 'string' || !file.parent) {
        const filePath = typeof file === 'string' ? file : file.path;
        const parentPath = getParentPath(filePath);
        parent = plugin.app.vault.getAbstractFileByPath(parentPath) as TFolder;
        if (!parent) {
            console.error('cannot find parent: ' + parentPath);
            return;
        }
    } else parent = file.parent;

    iterate(parent);
};

export const setupCount = (plugin: FileExplorerNoteCount, revert = false) => {
    if (!plugin.fileExplorer) throw new Error('fileExplorer not found');

    iterateItems(plugin.fileExplorer.fileItems, (item: AFItem) => {
        if (!isFolder(item)) return;
        if (revert) removeCount(item);
        else setCount(item, plugin.fileFilter);
    });
};

const setCount = (item: FolderItem, filter: AbstractFileFilter) => {
    if (item.file.isRoot()) return;
    const count = countFolderChildren(item.file, filter);
    item.titleEl.dataset['count'] = count.toString();
    item.titleEl.toggleClass(
        withSubfolderClass,
        Array.isArray(item.file.children) &&
            item.file.children.findIndex((af) => af instanceof TFolder) !== -1,
    );
};

const removeCount = (item: FolderItem) => {
    if (item.titleEl.dataset['count']) delete item.titleEl.dataset['count'];
    item.titleEl.removeClass(withSubfolderClass);
};

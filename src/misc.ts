import {
    AFItem,
    FileExplorer,
    FolderItem,
    TAbstractFile,
    TFolder,
} from 'obsidian';
import { dirname } from 'path-browserify';

export const withSubfolderClass = 'oz-with-subfolder';

export const isFolder = (item: AFItem): item is FolderItem =>
    (item as FolderItem).file instanceof TFolder;

export const iterateItems = (
    items: FileExplorer['fileItems'],
    callback: (item: AFItem) => any,
): void => {
    for (const key in items) {
        if (!Object.prototype.hasOwnProperty.call(items, key)) continue;
        callback(items[key]);
    }
};

export const getParentPath = (src: string) => {
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

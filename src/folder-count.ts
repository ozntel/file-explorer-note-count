import FileExplorerNoteCount from "main";
import { isFolder, iterateItems, getParentPath, withSubfolderClass } from "misc";
import { AFItem, FolderItem, TAbstractFile, TFolder } from "obsidian";
import "./styles/folder-count.css";

export function updateCount(
  file: string | TAbstractFile,
  plugin: FileExplorerNoteCount,
) {
  if (!plugin.fileExplorer) throw new Error("fileExplorer not found");
  const explorer = plugin.fileExplorer;

  const iterate = (folder: TFolder) => {
    if (!folder.isRoot()) {
      setCount(explorer.fileItems[folder.path] as FolderItem);
      iterate(folder.parent);
    }
  };

  let parent: TFolder;
  if (typeof file === "string" || !file.parent) {
    const filePath = typeof file === "string" ? file : file.path;
    const parentPath = getParentPath(filePath);
    parent = plugin.app.vault.getAbstractFileByPath(parentPath) as TFolder;
    if (!parent) {
      console.error("cannot find parent: " + parentPath);
      return;
    }
  } else parent = file.parent;

  iterate(parent);
}

export function setupCount(plugin: FileExplorerNoteCount, revert = false) {
  if (!plugin.fileExplorer) throw new Error("fileExplorer not found");

  iterateItems(plugin.fileExplorer.fileItems, (item: AFItem) => {
    if (!isFolder(item)) return;
    if (revert) removeCount(item);
    else setCount(item);
  });
}

function setCount(item: FolderItem) {
  if (item.file.isRoot()) return;
  // @ts-ignore
  const count = item.file.getFileCount() as number;
  item.titleInnerEl.dataset["count"] = count.toString();
  item.titleInnerEl.toggleClass(
    withSubfolderClass,
    Array.isArray(item.file.children) &&
      item.file.children.findIndex((af) => af instanceof TFolder) !== -1,
  );
}

function removeCount(item: FolderItem) {
  if (item.titleInnerEl.dataset["count"])
    delete item.titleInnerEl.dataset["count"];
  item.titleInnerEl.removeClass(withSubfolderClass);
}

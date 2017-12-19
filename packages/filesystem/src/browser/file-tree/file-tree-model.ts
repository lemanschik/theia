/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject } from "inversify";
import URI from '@theia/core/lib/common/uri';
import { ICompositeTreeNode, TreeModel, TreeServices } from "@theia/core/lib/browser";
import { FileSystem, FileSystemWatcher, FileChangeType, FileChange } from "../../common";
import { FileStatNode, DirNode, FileTree } from "./file-tree";
import { LocationService } from '../location';
import { LabelProvider } from "@theia/core/lib/browser/label-provider";
import * as base64 from 'base64-js';

@injectable()
export class FileTreeServices extends TreeServices {
    @inject(FileSystem) readonly fileSystem: FileSystem;
    @inject(FileSystemWatcher) readonly watcher: FileSystemWatcher;
}

@injectable()
export class FileTreeModel extends TreeModel implements LocationService {

    protected readonly fileSystem: FileSystem;
    protected readonly watcher: FileSystemWatcher;

    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;

    constructor(
        @inject(FileTree) protected readonly tree: FileTree,
        @inject(FileTreeServices) services: FileTreeServices
    ) {
        super(tree, services);
        this.toDispose.push(this.watcher.onFilesChanged(changes => this.onFilesChanged(changes)));
    }

    get location(): URI | undefined {
        const root = this.root;
        if (FileStatNode.is(root)) {
            return root.uri;
        }
        return undefined;
    }

    set location(uri: URI | undefined) {
        if (uri) {
            this.fileSystem.getFileStat(uri.toString()).then(async fileStat => {
                const label = this.labelProvider.getName(uri);
                const icon = await this.labelProvider.getIcon(fileStat);
                const node = DirNode.createRoot(fileStat, label, icon);
                this.navigateTo(node);
            });
        } else {
            this.navigateTo(undefined);
        }
    }

    get selectedFileStatNode(): Readonly<FileStatNode> | undefined {
        const selectedNode = this.selectedNode;
        if (FileStatNode.is(selectedNode)) {
            return selectedNode;
        }
        return undefined;
    }

    protected onFilesChanged(changes: FileChange[]): void {
        const affectedNodes = this.getAffectedNodes(changes);
        if (affectedNodes.length !== 0) {
            affectedNodes.forEach(node => this.refresh(node));
        } else if (this.isRootAffected(changes)) {
            this.refresh();
        }
    }

    protected isRootAffected(changes: FileChange[]): boolean {
        const root = this.root;
        if (FileStatNode.is(root)) {
            return changes.some(change =>
                change.type < FileChangeType.DELETED && change.uri.toString() === root.uri.toString()
            );
        }
        return false;
    }

    protected getAffectedNodes(changes: FileChange[]): ICompositeTreeNode[] {
        const nodes: DirNode[] = [];
        for (const change of changes) {
            const uri = change.uri;
            const id = change.type > FileChangeType.UPDATED ? uri.parent.toString() : uri.toString();
            const node = this.getNode(id);
            if (DirNode.is(node) && node.expanded) {
                nodes.push(node);
            }
        }
        return nodes;
    }

    copy(uri: URI): boolean {
        if (uri.scheme !== 'file') {
            return false;
        }
        const node = this.selectedFileStatNode;
        if (!node) {
            return false;
        }
        const targetUri = node.uri.resolve(uri.path.base);
        this.fileSystem.copy(uri.toString(), targetUri.toString());
        return true;
    }

    upload(node: DirNode, items: DataTransferItemList): void {
        for (let i = 0; i < items.length; i++) {
            if (items[i].kind === 'file') {
                // File from outside Theia
                const entry = items[i].webkitGetAsEntry() as WebKitEntry;
                this.uploadEntry(node.uri, entry);
            } else if (items[i].kind === 'string' && items[i].type === "theia-nodeid") {
                // Files/folders to move from inside theia
                items[i].getAsString(id => {
                    const nodeToMove = this.tree.getNode(id);
                    if (nodeToMove !== undefined) {
                        const newBase = node.uri.resolve(nodeToMove.name);
                        const destination = newBase.toString();
                        this.move(id, destination);
                    }
                });
            }
        }
    }

    protected uploadEntry(base: URI, entry: WebKitEntry | null): void {
        if (!entry) {
            return;
        }
        if (entry.isDirectory) {
            this.uploadDirectoryEntry(base, entry as WebKitDirectoryEntry);
        } else {
            this.uploadFileEntry(base, entry as WebKitFileEntry);
        }
    }

    protected async uploadDirectoryEntry(base: URI, entry: WebKitDirectoryEntry): Promise<void> {
        const reader = entry.createReader();
        const newBase = base.resolve(entry.name);
        const uri = newBase.toString();
        if (!await this.fileSystem.exists(uri)) {
            await this.fileSystem.createFolder(uri);
        }
        reader.readEntries(items => this.uploadEntries(newBase, items as any));
    }

    protected uploadEntries(base: URI, entries: WebKitEntry[]): void {
        for (let i = 0; i < entries.length; i++) {
            this.uploadEntry(base, entries[i]);
        }
    }

    protected uploadFileEntry(base: URI, entry: WebKitFileEntry): void {
        entry.file(file => this.uploadFile(base, file as any));
    }

    protected uploadFile(base: URI, file: File): void {
        const reader = new FileReader();
        reader.onload = () => this.uploadFileContent(base.resolve(file.name), reader.result);
        reader.readAsArrayBuffer(file);
    }

    protected async uploadFileContent(base: URI, fileContent: Iterable<number>): Promise<void> {
        const uri = base.toString();
        const encoding = 'base64';
        const content = base64.fromByteArray(new Uint8Array(fileContent));
        if (await this.fileSystem.exists(uri)) {
            const stat = await this.fileSystem.getFileStat(uri);
            await this.fileSystem.setContent(stat, content, { encoding });
        } else {
            await this.fileSystem.createFile(uri, { content, encoding });
        }
    }

    protected move(uriToMove: string, nodeDest: string) {
        this.fileSystem.move(uriToMove, nodeDest, { overwrite: true }).then(e => this.refresh());
    }
}

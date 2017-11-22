/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { DisposableCollection, ILogger, Emitter, Event } from '@theia/core/lib/common';
import { UserStorageChangeEvent, UserStorageService } from './user-storage-service';
import { injectable, inject } from 'inversify';
import { FileSystem, FileChange } from '@theia/filesystem/lib/common';
import { FileSystemWatcher } from "@theia/filesystem/lib/common";
import URI from '@theia/core/lib/common/uri';
import { UserStorageUri } from './user-storage-uri';

const THEIA_USER_STORAGE_FOLDER = '.theia';

@injectable()
export class UserStorageServiceFilesystemImpl implements UserStorageService {

    protected readonly toDispose = new DisposableCollection();
    protected readonly onUserStorageChangedEmitter = new Emitter<UserStorageChangeEvent>();
    protected userStorageFolder: Promise<URI>;

    constructor(
        @inject(FileSystem) protected readonly fileSystem: FileSystem,
        @inject(FileSystemWatcher) protected readonly watcher: FileSystemWatcher,
        @inject(ILogger) protected readonly logger: ILogger

    ) {
        this.userStorageFolder = this.fileSystem.getCurrentUserHome().then(home => {

            const userStorageFolderUri = new URI(home.uri).resolve(THEIA_USER_STORAGE_FOLDER);
            watcher.watchFileChanges(userStorageFolderUri).then(disposable =>
                this.toDispose.push(disposable)
            );
            this.toDispose.push(this.watcher.onFilesChanged(changes => this.onDidFilesChanged(changes)));
            return new URI(home.uri).resolve(THEIA_USER_STORAGE_FOLDER);
        });
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    onDidFilesChanged(fileChanges: FileChange[]): void {
        const uris: string[] = [];
        for (const change of fileChanges) {
            uris.push(this.fromFsUri(change.uri.toString()).toString());
        }
        this.onUserStorageChangedEmitter.fire({ uris });
    }

    readContents(uri: string) {
        return this.userStorageFolder
            .then(folderUri => {
                const userStorageUri = new URI(uri);
                return this.fileSystem.resolveContent(this.toFsUri(folderUri, userStorageUri).toString());
            })
            .then(({ stat, content }) => content);
    }

    saveContents(uri: string, content: string) {

        return this.userStorageFolder.then(folderUri => {
            const fsUri = this.toFsUri(folderUri, new URI(uri));

            this.fileSystem.getFileStat(fsUri.toString()).then(fileStat => {
                this.fileSystem.setContent(fileStat, content).then(() => Promise.resolve());
            });
        });
    }

    get onUserStorageChanged(): Event<UserStorageChangeEvent> {
        return this.onUserStorageChangedEmitter.event;
    }

    /**
     * Creates a new user storage URI from the filesystem path argument.
     * @param fsPath the filesystem path.
     */
    private fromFsUri(fsPath: string) {
        const fsUri = new URI(fsPath);
        return new URI('').withScheme(UserStorageUri.SCHEME).withPath(fsUri.path.base);

    }

    private toFsUri(root: URI, userUri: URI): URI {
        return userUri.withPath(root.path.join(userUri.path.toString()));
    }
}

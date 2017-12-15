/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject } from "inversify";
import { Disposable, Event, Emitter, ILogger, DisposableCollection } from "@theia/core";
import { Git, Repository, WorkingDirectoryStatus, GitUtils } from '../common';
import { GitStatusChangeEvent } from "../common/git-watcher";

export const GitRepositoryWatcherFactory = Symbol('GitRepositoryWatcherFactory');
export type GitRepositoryWatcherFactory = (options: GitRepositoryWatcherOptions) => GitRepositoryWatcher;

@injectable()
export class GitRepositoryWatcherOptions {
    readonly repository: Repository;
}

export const GitRepositoryWatcher = Symbol('GitRepositoryWatcher');
export interface GitRepositoryWatcher {

    readonly onStatusChanged: Event<GitStatusChangeEvent>;

    sync(): Promise<void>;

    watch(): Disposable;

}

@injectable()
export class GitRepositoryWatcherImpl implements GitRepositoryWatcher {

    protected readonly onStatusChangedEmitter = new Emitter<GitStatusChangeEvent>();
    readonly onStatusChanged: Event<GitStatusChangeEvent> = this.onStatusChangedEmitter.event;

    @inject(Git)
    protected readonly git: Git;

    @inject(ILogger)
    protected readonly logger: ILogger;

    @inject(GitRepositoryWatcherOptions)
    protected readonly options: GitRepositoryWatcherOptions;

    sync(): Promise<void> {
        return new Promise<void>(resolve => {
            const toDispose = new DisposableCollection();
            toDispose.push(this.onStatusChanged(() => {
                toDispose.dispose();
                resolve();
            }));
            toDispose.push(this.watch());
        });
    }

    protected references = 0;
    watch(): Disposable {
        this.schedule(true);
        if (this.references === 0) {
            this.logger.info('Started watching the git repository:', this.options.repository.localUri);
        }
        this.references++;
        return Disposable.create(() => {
            this.references--;
            if (this.references === 0) {
                this.logger.info('Stopped watching the git repository:', this.options.repository.localUri);
                this.clear();
            }
        });
    }

    protected initial: boolean = true;
    protected watchTimer: NodeJS.Timer | undefined;
    protected schedule(initial: boolean = false): void {
        if (initial && !this.initial) {
            this.initial = true;
            this.clear();
        }
        if (this.watchTimer) {
            return;
        }
        this.watchTimer = setTimeout(async () => {
            this.watchTimer = undefined;
            const syncInitial = this.initial;
            this.initial = false;
            if (await this.syncStatus(syncInitial)) {
                this.schedule();
            }
        }, initial ? 0 : 5000);
    }
    protected clear(): void {
        if (this.watchTimer) {
            clearTimeout(this.watchTimer);
            this.watchTimer = undefined;
        }
    }

    protected status: WorkingDirectoryStatus | undefined;
    protected async syncStatus(initial: boolean = false): Promise<boolean> {
        try {
            const source = this.options.repository;
            const newStatus = await this.git.status(source);
            const oldStatus = this.status;
            if (initial || !WorkingDirectoryStatus.equals(newStatus, oldStatus)) {
                this.status = newStatus;
                this.onStatusChangedEmitter.fire({ source, status: newStatus, oldStatus });
            }
        } catch (error) {
            if (GitUtils.isRepositoryDoesNotExistError(error)) {
                return false;
            }
            const { localUri } = this.options.repository;
            this.logger.error(`Error occurred while synchronizing the status of the repository.`, localUri, error);
        }
        return true;
    }

}

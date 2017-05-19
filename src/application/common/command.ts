/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject, named } from "inversify";
import { Disposable, DisposableCollection } from "./disposable";
import { ContributionProvider } from './contribution-provider';

export interface Command {
    id: string;
    label: string;
    iconClass?: string;
}
export interface CommandHandler {
    execute(...args: any[]): any;
    isEnabled(...args: any[]): boolean;
    isVisible?(...args: any[]): boolean;
}

export const CommandContribution = Symbol("CommandContribution");

export interface CommandContribution {
    contribute(registry: CommandRegistry): void;
}

export const CommandService = Symbol("CommandService");
export interface CommandService {
    executeCommand<T>(command: string, ...args: any[]): Promise<T | undefined>;
}

@injectable()
export class CommandRegistry implements CommandService {

    private _commands: { [id: string]: Command };
    private _handlers: { [id: string]: CommandHandler[] };

    constructor( @inject(ContributionProvider) @named(CommandContribution) private contributionProvider: ContributionProvider<CommandContribution>) {
    }

    initialize(): void {
        this._commands = {};
        this._handlers = {};
        const contributions = this.contributionProvider.getContributions();
        for (const contrib of contributions) {
            contrib.contribute(this);
        }
    }

    registerCommand(command: string | Command): Disposable;
    registerCommand(command: string | Command, handler: CommandHandler): Disposable;
    registerCommand(command: string | Command, handler: (...args: any[]) => any, thisArg?: any): Disposable;
    registerCommand(commandArg: string | Command, handler?: CommandHandler | ((...args: any[]) => any), thisArg?: any): Disposable {
        const command = this.asCommand(commandArg);
        if (handler) {
            const toDispose = new DisposableCollection();
            toDispose.push(this.doRegisterCommand(command));
            toDispose.push(this.doRegisterHandler(command.id, handler, thisArg));
            return toDispose;
        }
        return this.doRegisterCommand(command);
    }

    protected asCommand(command: string | Command): Command {
        if (typeof command === 'string') {
            return {
                id: command,
                label: command // FIXME label should be optional
            }
        }
        return command;
    }

    protected doRegisterCommand(command: Command): Disposable {
        if (this._commands[command.id]) {
            throw Error(`A command ${command.id} is already registered.`);
        }
        this._commands[command.id] = command;
        return {
            dispose: () => {
                delete this._commands[command.id];
            }
        }
    }

    registerHandler(commandId: string, handler: CommandHandler): Disposable;
    registerHandler(commandId: string, handler: (...args: any[]) => any, thisArg?: any): Disposable;
    registerHandler(commandId: string, handlerArg: CommandHandler | ((...args: any[]) => any), thisArg?: any): Disposable {
        return this.doRegisterHandler(commandId, handlerArg, thisArg);
    }

    protected doRegisterHandler(commandId: string, handlerArg: CommandHandler | ((...args: any[]) => any), thisArg?: any): Disposable {
        let handlers = this._handlers[commandId];
        if (!handlers) {
            this._handlers[commandId] = handlers = [];
        }
        const handler = this.asHandler(handlerArg, thisArg);
        handlers.push(handler);
        return {
            dispose: () => {
                let idx = handlers.indexOf(handler);
                if (idx >= 0) {
                    handlers.splice(idx, 1);
                }
            }
        }
    }

    protected asHandler(handler: ((...args: any[]) => any) | CommandHandler, thisArg?: any): CommandHandler {
        if (typeof handler === 'function') {
            return {
                isEnabled: () => true,
                execute: handler.bind(thisArg)
            }
        }
        return handler;
    }

    executeCommand<T>(command: string, ...args: any[]): Promise<T | undefined> {
        const handler = this.getActiveHandler(command, ...args);
        if (handler) {
            return Promise.resolve(handler.execute(...args))
        }
        return Promise.resolve(undefined);
    }

    getActiveHandler(commandId: string, ...args: any[]): CommandHandler | undefined {
        const handlers = this._handlers[commandId];
        if (handlers) {
            for (let handler of handlers) {
                if (handler.isEnabled(...args)) {
                    return handler;
                }
            }
        }
        return undefined;
    }

    get commands(): Command[] {
        let commands: Command[] = []
        for (let id of this.commandIds) {
            let cmd = this.getCommand(id);
            if (cmd) {
                commands.push(cmd);
            }
        }
        return commands;
    }

    getCommand(id: string): Command | undefined {
        return this._commands[id];
    }

    get commandIds(): string[] {
        return Object.keys(this._commands);
    }
}

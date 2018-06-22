/********************************************************************************
 * Copyright (C) 2017 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { injectable, inject } from 'inversify';
import { MessageService } from '@theia/core/lib/common';
import { MessageActionItem, MessageType } from 'vscode-base-languageclient/lib/protocol';
import { Window, OutputChannel } from 'vscode-base-languageclient/lib/services';
import { OutputChannelManager } from '@theia/output/lib/common/output-channel';

@injectable()
export class WindowImpl implements Window {
    constructor(
        @inject(MessageService) protected readonly messageService: MessageService,
        @inject(OutputChannelManager) protected readonly outputChannelManager: OutputChannelManager) {
    }

    showMessage<T extends MessageActionItem>(type: MessageType, message: string, ...actions: T[]): Thenable<T | undefined> {
        const originalActions = new Map((actions || []).map(action => [action.title, action] as [string, T]));
        const actionTitles = (actions || []).map(action => action.title);
        const mapActionType: (result: string | undefined) => (T | undefined) = result => {
            if (!!result) {
                return originalActions.get(result);
            }
            return undefined;
        };
        if (type === MessageType.Error) {
            return this.messageService.error(message, ...actionTitles).then(mapActionType);
        }
        if (type === MessageType.Warning) {
            return this.messageService.warn(message, ...actionTitles).then(mapActionType);
        }
        if (type === MessageType.Info) {
            return this.messageService.info(message, ...actionTitles).then(mapActionType);
        }
        if (type === MessageType.Log) {
            return this.messageService.log(message, ...actionTitles).then(mapActionType);
        }
        return Promise.resolve(undefined);
    }

    createOutputChannel(name: string): OutputChannel {
        const outputChannel = this.outputChannelManager.getChannel(name);
        return {
            append: outputChannel.append.bind(outputChannel),
            appendLine: outputChannel.appendLine.bind(outputChannel),
            show: function (preserveFocus?: boolean): void {
                // no-op
            }
        };
    }
}

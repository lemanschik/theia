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

import { Extension, ResolvedExtension } from '../common/extension-manager';
import { Message } from '@phosphor/messaging/lib';
import { VirtualWidget, VirtualRenderer, DISABLED_CLASS } from '@theia/core/lib/browser';
import { h } from '@phosphor/virtualdom/lib';

export class ExtensionDetailWidget extends VirtualWidget {

    constructor(
        protected readonly resolvedExtension: ResolvedExtension
    ) {
        super();
        this.addClass('theia-extension-detail');
        this.node.tabIndex = 0;
        this.toDispose.push(resolvedExtension);
        this.toDispose.push(resolvedExtension.onDidChange(change => {
            if (change.name === this.resolvedExtension.name) {
                this.update();
            }
        }));
        this.update();
    }

    onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
        this.update();
    }

    protected onUpdateRequest(msg: Message): void {
        super.onUpdateRequest(msg);

        const el = document.getElementById(this.id + 'Doc');
        if (el !== null) {
            el.innerHTML = this.resolvedExtension.documentation;
        }
    }

    protected render(): h.Child {
        const r = this.resolvedExtension;

        const name = h.h2({ className: 'extensionName' }, r.name);
        const extversion = h.div({ className: 'extensionVersion' }, r.version);
        const author = h.div({ className: 'extensionAuthor' }, r.author);
        const titleInfo = h.div({ className: 'extensionSubtitle' }, author, extversion);
        const titleContainer = h.div({ className: 'extensionTitleContainer' },
            name, titleInfo);

        const description = h.div({ className: 'extensionDescription' }, r.description);

        const buttonContainer = this.createButtonContainer();

        const headerContainer = h.div({
            className: this.createExtensionClassName()
        }, titleContainer, description, buttonContainer);

        const documentation = h.div({ className: 'extensionDocumentation', id: this.id + 'Doc' }, '');
        const docContainer = h.div({ className: 'extensionDocContainer flexcontainer' }, documentation);

        return [headerContainer, docContainer];
    }

    protected createExtensionClassName(): string {
        const classNames = ['extensionHeaderContainer'];
        if (this.resolvedExtension.dependent) {
            classNames.push(DISABLED_CLASS);
        }
        return classNames.join(' ');
    }

    protected createButtonContainer(): h.Child {
        if (this.resolvedExtension.dependent) {
            return 'installed via ' + this.resolvedExtension.dependent;
        }
        const buttonRow = h.div({ className: 'extensionButtonRow' },
            VirtualRenderer.flatten(this.createButtons(this.resolvedExtension)));
        return h.div({ className: 'extensionButtonContainer' }, buttonRow);
    }

    protected createButtons(extension: Extension): h.Child[] {
        const buttonArr = [];
        let btnLabel = 'Install';
        if (extension.installed) {
            btnLabel = 'Uninstall';
        }

        const faEl = h.i({ className: 'fa fa-spinner fa-pulse fa-fw' });
        const content = extension.busy ? faEl : btnLabel;

        buttonArr.push(h.div({
            className: 'theia-button extensionButton' +
                (extension.busy ? ' working' : '') + ' ' +
                (extension.installed && !extension.busy ? ' installed' : '') + ' ' +
                (extension.outdated && !extension.busy ? ' outdated' : ''),
            onclick: event => {
                if (!extension.busy) {
                    if (extension.installed) {
                        extension.uninstall();
                    } else {
                        extension.install();
                    }
                    event.stopPropagation();
                }
            }
        }, content));

        if (extension.outdated) {
            buttonArr.push(h.div({
                className: (extension.busy ? ' working' : '') + ' ' + 'theia-button extensionButton' + (extension.outdated && !extension.busy ? ' outdated' : ''),
                onclick: event => {
                    if (!extension.busy) {
                        extension.update();
                    }
                }
            }, extension.busy ? faEl : 'Update'));
        }
        return buttonArr;
    }

}

// *****************************************************************************
// Copyright (C) 2020 TypeFox and others.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import '../../src/browser/style/index.css';

import { ContainerModule } from 'inversify';
import {
    WidgetFactory, bindViewContribution, FrontendApplicationContribution, ViewContainerIdentifier, OpenHandler, WidgetManager, WebSocketConnectionProvider,
    WidgetStatusBarContribution,
    noopWidgetStatusBarContribution
} from '@theia/core/lib/browser';
import { VSXExtensionsViewContainer } from './vsx-extensions-view-container.js';
import { VSXExtensionsContribution } from './vsx-extensions-contribution.js';
import { VSXExtensionsSearchBar } from './vsx-extensions-search-bar.js';
import { VSXExtensionsModel } from './vsx-extensions-model.js';
import { ColorContribution } from '@theia/core/lib/browser/color-application-contribution';
import { VSXExtensionsWidget, VSXExtensionsWidgetOptions } from './vsx-extensions-widget.js';
import { VSXExtensionFactory, VSXExtension, VSXExtensionOptions } from './vsx-extension.js';
import { VSXExtensionEditor } from './vsx-extension-editor.js';
import { VSXExtensionEditorManager } from './vsx-extension-editor-manager.js';
import { VSXExtensionsSourceOptions } from './vsx-extensions-source.js';
import { VSXExtensionsSearchModel } from './vsx-extensions-search-model.js';
import { bindExtensionPreferences } from './recommended-extensions/recommended-extensions-preference-contribution.js';
import { bindPreferenceProviderOverrides } from './recommended-extensions/preference-provider-overrides.js';
import { bindVsxExtensionsPreferences } from './vsx-extensions-preferences.js';
import { VSXEnvironment, VSX_ENVIRONMENT_PATH } from '../common/vsx-environment.js';
import { LanguageQuickPickService } from '@theia/core/lib/browser/i18n/language-quick-pick-service';
import { VSXLanguageQuickPickService } from './vsx-language-quick-pick-service.js';
import { VsxExtensionArgumentProcessor } from './vsx-extension-argument-processor.js';
import { ArgumentProcessorContribution } from '@theia/plugin-ext/lib/main/browser/command-registry-main';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(VSXEnvironment)
        .toDynamicValue(ctx => WebSocketConnectionProvider.createProxy(ctx.container, VSX_ENVIRONMENT_PATH))
        .inSingletonScope();
    bind(VSXExtension).toSelf();
    bind(VSXExtensionFactory).toFactory(ctx => (option: VSXExtensionOptions) => {
        const child = ctx.container.createChild();
        child.bind(VSXExtensionOptions).toConstantValue(option);
        return child.get(VSXExtension);
    });
    bind(VSXExtensionsModel).toSelf().inSingletonScope();

    bind(VSXExtensionEditor).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VSXExtensionEditor.ID,
        createWidget: async (options: VSXExtensionOptions) => {
            const extension = await ctx.container.get(VSXExtensionsModel).resolve(options.id);
            const child = ctx.container.createChild();
            child.bind(VSXExtension).toConstantValue(extension);
            return child.get(VSXExtensionEditor);
        }
    })).inSingletonScope();
    bind(VSXExtensionEditorManager).toSelf().inSingletonScope();
    bind(OpenHandler).toService(VSXExtensionEditorManager);
    bind(WidgetStatusBarContribution).toConstantValue(noopWidgetStatusBarContribution(VSXExtensionEditor));

    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: VSXExtensionsWidget.ID,
        createWidget: async (options: VSXExtensionsWidgetOptions) => VSXExtensionsWidget.createWidget(container, options)
    })).inSingletonScope();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VSXExtensionsViewContainer.ID,
        createWidget: async () => {
            const child = ctx.container.createChild();
            child.bind(ViewContainerIdentifier).toConstantValue({
                id: VSXExtensionsViewContainer.ID,
                progressLocationId: 'extensions'
            });
            child.bind(VSXExtensionsViewContainer).toSelf();
            child.bind(VSXExtensionsSearchBar).toSelf().inSingletonScope();
            const viewContainer = child.get(VSXExtensionsViewContainer);
            const widgetManager = child.get(WidgetManager);
            for (const id of [
                VSXExtensionsSourceOptions.SEARCH_RESULT,
                VSXExtensionsSourceOptions.RECOMMENDED,
                VSXExtensionsSourceOptions.INSTALLED,
                VSXExtensionsSourceOptions.BUILT_IN,
            ]) {
                const widget = await widgetManager.getOrCreateWidget(VSXExtensionsWidget.ID, { id });
                viewContainer.addWidget(widget, {
                    initiallyCollapsed: id === VSXExtensionsSourceOptions.BUILT_IN
                });
            }
            return viewContainer;
        }
    })).inSingletonScope();

    bind(VSXExtensionsSearchModel).toSelf().inSingletonScope();

    rebind(LanguageQuickPickService).to(VSXLanguageQuickPickService).inSingletonScope();

    bindViewContribution(bind, VSXExtensionsContribution);
    bind(FrontendApplicationContribution).toService(VSXExtensionsContribution);
    bind(ColorContribution).toService(VSXExtensionsContribution);

    bindExtensionPreferences(bind);
    bindPreferenceProviderOverrides(bind, unbind);
    bindVsxExtensionsPreferences(bind);

    bind(VsxExtensionArgumentProcessor).toSelf().inSingletonScope();
    bind(ArgumentProcessorContribution).toService(VsxExtensionArgumentProcessor);
});

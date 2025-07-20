// *****************************************************************************
// Copyright (C) 2024 EclipseSource GmbH.
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
import { ChatAgent, DefaultChatAgentId, FallbackChatAgentId } from '@theia/ai-chat/lib/common';
import { Agent, AIVariableContribution, bindToolProvider } from '@theia/ai-core/lib/common';
import { ArchitectAgent } from './architect-agent.js';
import { CoderAgent } from './coder-agent.js';
import { SummarizeSessionCommandContribution } from './summarize-session-command-contribution.js';
import { FileContentFunction, FileDiagnosticProvider, GetWorkspaceDirectoryStructure, GetWorkspaceFileList, WorkspaceFunctionScope } from './workspace-functions.js';
import { WorkspaceSearchProvider } from './workspace-search-provider.js';
import {
    FrontendApplicationContribution,
    PreferenceContribution,
    WidgetFactory,
    bindViewContribution,
    RemoteConnectionProvider,
    ServiceConnectionProvider
} from '@theia/core/lib/browser';
import { TaskListProvider, TaskRunnerProvider } from './workspace-task-provider.js';
import { WorkspacePreferencesSchema } from './workspace-preferences.js';
import {
    ClearFileChanges,
    GetProposedFileState,
    ReplaceContentInFileFunctionHelper,
    SuggestFileReplacements,
    SimpleSuggestFileReplacements,
    SuggestFileContent,
    WriteFileContent,
    WriteFileReplacements,
    SimpleWriteFileReplacements
} from './file-changeset-functions.js';
import { OrchestratorChatAgent, OrchestratorChatAgentId } from '../common/orchestrator-chat-agent.js';
import { UniversalChatAgent, UniversalChatAgentId } from '../common/universal-chat-agent.js';
import { AppTesterChatAgent } from './app-tester-chat-agent.js';
import { CommandChatAgent } from '../common/command-chat-agents.js';
import { ListChatContext, ResolveChatContext, AddFileToChatContext } from './context-functions.js';
import { AIAgentConfigurationWidget } from './ai-configuration/agent-configuration-widget.js';
import { AIConfigurationSelectionService } from './ai-configuration/ai-configuration-service.js';
import { AIAgentConfigurationViewContribution } from './ai-configuration/ai-configuration-view-contribution.js';
import { AIConfigurationContainerWidget } from './ai-configuration/ai-configuration-widget.js';
import { AIVariableConfigurationWidget } from './ai-configuration/variable-configuration-widget.js';
import { ContextFilesVariableContribution } from '../common/context-files-variable.js';
import { AIToolsConfigurationWidget } from './ai-configuration/tools-configuration-widget.js';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { AiConfigurationPreferences } from './ai-configuration/ai-configuration-preferences.js';
import { TemplatePreferenceContribution } from './template-preference-contribution.js';
import { AIMCPConfigurationWidget } from './ai-configuration/mcp-configuration-widget.js';
import { ChatWelcomeMessageProvider } from '@theia/ai-chat-ui/lib/browser/chat-tree-view';
import { IdeChatWelcomeMessageProvider } from './ide-chat-welcome-message-provider.js';
import { AITokenUsageConfigurationWidget } from './ai-configuration/token-usage-configuration-widget.js';
import { TaskContextSummaryVariableContribution } from './task-background-summary-variable.js';
import { TaskContextFileStorageService } from './task-context-file-storage-service.js';
import { TaskContextStorageService } from '@theia/ai-chat/lib/browser/task-context-service';
import { CommandContribution } from '@theia/core';
import { AIPromptFragmentsConfigurationWidget } from './ai-configuration/prompt-fragments-configuration-widget.js';
import { BrowserAutomation, browserAutomationPath } from '../common/browser-automation-protocol.js';
import { CloseBrowserProvider, IsBrowserRunningProvider, LaunchBrowserProvider, QueryDomProvider } from './app-tester-chat-functions.js';

export default new ContainerModule((bind, _unbind, _isBound, rebind) => {
    bind(PreferenceContribution).toConstantValue({ schema: WorkspacePreferencesSchema });

    bind(ArchitectAgent).toSelf().inSingletonScope();
    bind(Agent).toService(ArchitectAgent);
    bind(ChatAgent).toService(ArchitectAgent);

    bind(CoderAgent).toSelf().inSingletonScope();
    bind(Agent).toService(CoderAgent);
    bind(ChatAgent).toService(CoderAgent);

    bind(OrchestratorChatAgent).toSelf().inSingletonScope();
    bind(Agent).toService(OrchestratorChatAgent);
    bind(ChatAgent).toService(OrchestratorChatAgent);

    bind(UniversalChatAgent).toSelf().inSingletonScope();
    bind(Agent).toService(UniversalChatAgent);
    bind(ChatAgent).toService(UniversalChatAgent);

    bind(AppTesterChatAgent).toSelf().inSingletonScope();
    bind(Agent).toService(AppTesterChatAgent);
    bind(ChatAgent).toService(AppTesterChatAgent);
    bind(BrowserAutomation).toDynamicValue(ctx => {
        const provider = ctx.container.get<ServiceConnectionProvider>(RemoteConnectionProvider);
        return provider.createProxy<BrowserAutomation>(browserAutomationPath);
    }).inSingletonScope();

    bind(CommandChatAgent).toSelf().inSingletonScope();
    bind(Agent).toService(CommandChatAgent);
    bind(ChatAgent).toService(CommandChatAgent);

    bind(DefaultChatAgentId).toConstantValue({ id: OrchestratorChatAgentId });
    bind(FallbackChatAgentId).toConstantValue({ id: UniversalChatAgentId });

    bind(ChatWelcomeMessageProvider).to(IdeChatWelcomeMessageProvider);

    bindToolProvider(GetWorkspaceFileList, bind);
    bindToolProvider(FileContentFunction, bind);
    bindToolProvider(GetWorkspaceDirectoryStructure, bind);
    bindToolProvider(FileDiagnosticProvider, bind);
    bind(WorkspaceFunctionScope).toSelf().inSingletonScope();
    bindToolProvider(WorkspaceSearchProvider, bind);

    bindToolProvider(SuggestFileContent, bind);
    bindToolProvider(WriteFileContent, bind);
    bindToolProvider(TaskListProvider, bind);
    bindToolProvider(TaskRunnerProvider, bind);
    bind(ReplaceContentInFileFunctionHelper).toSelf().inSingletonScope();
    bindToolProvider(SuggestFileReplacements, bind);
    bindToolProvider(WriteFileReplacements, bind);
    bindToolProvider(ListChatContext, bind);
    bindToolProvider(ResolveChatContext, bind);
    bind(AIConfigurationSelectionService).toSelf().inSingletonScope();
    bind(AIConfigurationContainerWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: AIConfigurationContainerWidget.ID,
            createWidget: () => ctx.container.get(AIConfigurationContainerWidget)
        }))
        .inSingletonScope();

    bindToolProvider(LaunchBrowserProvider, bind);
    bindToolProvider(CloseBrowserProvider, bind);
    bindToolProvider(IsBrowserRunningProvider, bind);
    bindToolProvider(QueryDomProvider, bind);

    bindViewContribution(bind, AIAgentConfigurationViewContribution);
    bind(TabBarToolbarContribution).toService(AIAgentConfigurationViewContribution);

    bind(AIVariableConfigurationWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: AIVariableConfigurationWidget.ID,
            createWidget: () => ctx.container.get(AIVariableConfigurationWidget)
        }))
        .inSingletonScope();

    bind(AIAgentConfigurationWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: AIAgentConfigurationWidget.ID,
            createWidget: () => ctx.container.get(AIAgentConfigurationWidget)
        }))
        .inSingletonScope();

    bindToolProvider(SimpleSuggestFileReplacements, bind);
    bindToolProvider(SimpleWriteFileReplacements, bind);
    bindToolProvider(ClearFileChanges, bind);
    bindToolProvider(GetProposedFileState, bind);
    bindToolProvider(AddFileToChatContext, bind);

    bind(AIToolsConfigurationWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: AIToolsConfigurationWidget.ID,
            createWidget: () => ctx.container.get(AIToolsConfigurationWidget)
        }))
        .inSingletonScope();

    bind(AIVariableContribution).to(ContextFilesVariableContribution).inSingletonScope();
    bind(PreferenceContribution).toConstantValue({ schema: AiConfigurationPreferences });

    bind(FrontendApplicationContribution).to(TemplatePreferenceContribution);

    bind(AIMCPConfigurationWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: AIMCPConfigurationWidget.ID,
            createWidget: () => ctx.container.get(AIMCPConfigurationWidget)
        }))
        .inSingletonScope();
    // Register the token usage configuration widget
    bind(AITokenUsageConfigurationWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: AITokenUsageConfigurationWidget.ID,
            createWidget: () => ctx.container.get(AITokenUsageConfigurationWidget)
        }))
        .inSingletonScope();

    bind(TaskContextSummaryVariableContribution).toSelf().inSingletonScope();
    bind(AIVariableContribution).toService(TaskContextSummaryVariableContribution);
    bind(TaskContextFileStorageService).toSelf().inSingletonScope();
    rebind(TaskContextStorageService).toService(TaskContextFileStorageService);

    bind(CommandContribution).to(SummarizeSessionCommandContribution);
    bind(AIPromptFragmentsConfigurationWidget).toSelf();
    bind(WidgetFactory)
        .toDynamicValue(ctx => ({
            id: AIPromptFragmentsConfigurationWidget.ID,
            createWidget: () => ctx.container.get(AIPromptFragmentsConfigurationWidget)
        }))
        .inSingletonScope();
});

/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { ContainerModule, interfaces } from "inversify";
import { ConnectionHandler, JsonRpcConnectionHandler } from '@theia/core';
import { CliContribution } from '@theia/core/lib/node';
import { ExtensionServer, ExtensionClient, extensionPath } from "../common/extension-protocol";
import { ExtensionKeywords, NodeExtensionServer } from './node-extension-server';
import { ApplicationProject, ApplicationProjectOptions } from './application-project';
import { NpmClient, NpmClientOptions } from './npm-client';
import { ApplicationProjectArgs, ApplicationProjectCliContribution } from './application-project-cli';

export const extensionKeyword = "theia-extension";

export function bindNodeExtensionServer(bind: interfaces.Bind, args?: ApplicationProjectArgs): void {
    if (args) {
        bind(NpmClientOptions).toConstantValue(args);
        bind(ApplicationProjectOptions).toConstantValue(args);
    } else {
        bind(ApplicationProjectCliContribution).toSelf().inSingletonScope();
        bind(CliContribution).toDynamicValue(ctx => ctx.container.get(ApplicationProjectCliContribution)).inSingletonScope();
        bind(NpmClientOptions).toDynamicValue(ctx =>
            ctx.container.get(ApplicationProjectCliContribution).args
        ).inSingletonScope();
        bind(ApplicationProjectOptions).toDynamicValue(ctx =>
            ctx.container.get(ApplicationProjectCliContribution).args
        ).inSingletonScope();
    }
    bind(NpmClient).toSelf().inSingletonScope();
    bind(ApplicationProject).toSelf().inSingletonScope();

    bind(ExtensionKeywords).toConstantValue([extensionKeyword]);
    bind(NodeExtensionServer).toSelf().inSingletonScope();
    bind(ExtensionServer).toDynamicValue(ctx =>
        ctx.container.get(NodeExtensionServer)
    ).inSingletonScope();
}

export default new ContainerModule(bind => {
    bindNodeExtensionServer(bind);

    const clients = new Set<ExtensionClient>();
    const dispatchingClient: ExtensionClient = {
        onDidChange: change => clients.forEach(client => client.onDidChange(change)),
        onDidStopInstallation: result => clients.forEach(client => client.onDidStopInstallation(result)),
        onWillStartInstallation: param => clients.forEach(client => client.onWillStartInstallation(param))
    };
    bind(ConnectionHandler).toDynamicValue(ctx => {
        const server = ctx.container.get<ExtensionServer>(ExtensionServer);
        server.setClient(dispatchingClient);
        return new JsonRpcConnectionHandler<ExtensionClient>(extensionPath, client => {
            clients.add(client);
            client.onDidCloseConnection(() => {
                clients.delete(client);
            });
            return server;
        });
    }).inSingletonScope();
});

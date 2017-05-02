/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as http from 'http';
import { ContainerModule, injectable, multiInject } from "inversify";
import { ExpressContribution } from '../../application/node';
import { openSocket, toIWebSocket } from '../../messaging/node';
import { WebSocketMessageReader, WebSocketMessageWriter, ConnectionHandler, JsonRpcProxyFactory } from "../../messaging/common";
import { createConnection } from "vscode-ws-jsonrpc/lib/server";
import { LanguageContribution } from "./language-contribution";
import { LANGUAGES_PATH, LanguagesService, LanguageIdentifier } from "../common";

export const nodeLanguagesModule = new ContainerModule(bind => {
    bind(ExpressContribution).to(LanguagesExpressContribution);
    bind(LanguagesService).to(LanguagesServiceImpl).inSingletonScope();
    bind(ConnectionHandler).toDynamicValue(ctx => {
        const languagesService = ctx.container.get(LanguagesService);
        return new JsonRpcProxyFactory<LanguagesService>(LANGUAGES_PATH, languagesService);
    });
});

@injectable()
export class LanguagesExpressContribution implements ExpressContribution {

    constructor(
        @multiInject(LanguageContribution) protected readonly contributors: LanguageContribution[]
    ) {
    }

    onStart(server: http.Server): void {
        for (const contribution of this.contributors) {
            const path = LanguageIdentifier.create(contribution.description).path;
            openSocket({
                server,
                path
            }, s => {
                const socket = toIWebSocket(s)
                const reader = new WebSocketMessageReader(socket);
                const writer = new WebSocketMessageWriter(socket);
                const connection = createConnection(reader, writer, () => socket.dispose());
                contribution.listen(connection);
            });
        }
    }

}

@injectable()
export class LanguagesServiceImpl implements LanguagesService {

    constructor(
        @multiInject(LanguageContribution) protected readonly contributors: LanguageContribution[]
    ) { }

    getLanguages(): Promise<LanguageIdentifier[]> {
        return Promise.resolve(
            this.contributors.map(contribution =>
                LanguageIdentifier.create(contribution.description)
            )
        )
    }

}

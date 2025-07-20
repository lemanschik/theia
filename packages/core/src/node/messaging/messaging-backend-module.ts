// *****************************************************************************
// Copyright (C) 2017 TypeFox and others.
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

import { ContainerModule } from 'inversify';
import { ConnectionHandler, RpcConnectionHandler, bindContributionProvider } from '../../common/index.js';
// import { BackendApplicationContribution } from '../backend-application';
import { DefaultMessagingService, MessagingContainer } from './default-messaging-service.js';
import { ConnectionContainerModule } from './connection-container-module.js';
import { MessagingService } from './messaging-service.js';
import { MessagingListener, MessagingListenerContribution } from './messaging-listeners.js';
import { FrontendConnectionService } from './frontend-connection-service.js';
import { BackendApplicationContribution } from '../backend-application.js';
import { connectionCloseServicePath } from '../../common/messaging/connection-management.js';
import { WebsocketFrontendConnectionService } from './websocket-frontend-connection-service.js';
import { WebsocketEndpoint } from './websocket-endpoint.js';

export const messagingBackendModule = new ContainerModule(bind => {
    bindContributionProvider(bind, ConnectionContainerModule);
    bindContributionProvider(bind, MessagingService.Contribution);
    bind(DefaultMessagingService).toSelf().inSingletonScope();
    bind(MessagingService.Identifier).toService(DefaultMessagingService);
    bind(BackendApplicationContribution).toService(DefaultMessagingService);
    bind(MessagingContainer).toDynamicValue(({ container }) => container).inSingletonScope();
    bind(WebsocketEndpoint).toSelf().inSingletonScope();
    bind(BackendApplicationContribution).toService(WebsocketEndpoint);
    bind(WebsocketFrontendConnectionService).toSelf().inSingletonScope();
    bind(FrontendConnectionService).toService(WebsocketFrontendConnectionService);
    bind(MessagingListener).toSelf().inSingletonScope();
    bindContributionProvider(bind, MessagingListenerContribution);

    bind(ConnectionHandler).toDynamicValue(context => {
        const connectionService = context.container.get<WebsocketFrontendConnectionService>(FrontendConnectionService);
        return new RpcConnectionHandler<object>(connectionCloseServicePath, () => ({
            markForClose: (channelId: string) => {
                connectionService.markForClose(channelId);
            }
        }));
    }).inSingletonScope();
});

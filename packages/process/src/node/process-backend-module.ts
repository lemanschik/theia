/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { ContainerModule, Container } from 'inversify';
import { RawProcess, RawProcessOptions, RawProcessFactory } from './raw-process';
import { TerminalProcess, TerminalProcessOptions, TerminalProcessFactory } from './terminal-process';
import { ProcessManager } from "./process-manager";
import { ILogger } from '@theia/core/lib/common';

export default new ContainerModule(bind => {
    bind(RawProcess).toSelf().inTransientScope();
    bind(ProcessManager).toSelf().inSingletonScope();
    bind(RawProcessFactory).toFactory(ctx =>
        (options: RawProcessOptions) => {
            const child = new Container({ defaultScope: 'Singleton' });
            child.parent = ctx.container;

            const logger = ctx.container.get<ILogger>(ILogger);
            const loggerChild = logger.child({ 'module': 'process' });
            child.bind(RawProcessOptions).toConstantValue(options);
            child.bind(ILogger).toConstantValue(loggerChild);
            return child.get(RawProcess);
        }
    );

    bind(TerminalProcess).toSelf().inTransientScope();
    bind(TerminalProcessFactory).toFactory(ctx =>
        (options: TerminalProcessOptions) => {
            const child = new Container({ defaultScope: 'Singleton' });
            child.parent = ctx.container;

            const logger = ctx.container.get<ILogger>(ILogger);
            const loggerChild = logger.child({ 'module': 'process' });
            child.bind(TerminalProcessOptions).toConstantValue(options);
            child.bind(ILogger).toConstantValue(loggerChild);
            return child.get(TerminalProcess);
        }
    );
});

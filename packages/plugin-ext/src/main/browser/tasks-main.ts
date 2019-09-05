/********************************************************************************
 * Copyright (C) 2018 Red Hat, Inc. and others.
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

import {
    TasksMain,
    MAIN_RPC_CONTEXT,
    TaskExecutionDto,
    TasksExt,
    TaskDto
} from '../../common/plugin-api-rpc';
import { RPCProtocol } from '../../common/rpc-protocol';
import { DisposableCollection } from '@theia/core';
import { TaskProviderRegistry, TaskResolverRegistry, TaskProvider, TaskResolver } from '@theia/task/lib/browser/task-contribution';
import { interfaces } from 'inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { TaskInfo, TaskExitedEvent, TaskConfiguration } from '@theia/task/lib/common/task-protocol';
import { TaskWatcher } from '@theia/task/lib/common/task-watcher';
import { TaskService } from '@theia/task/lib/browser/task-service';
import { TaskDefinitionRegistry } from '@theia/task/lib/browser';

export class TasksMainImpl implements TasksMain {
    private workspaceRootUri: string | undefined = undefined;

    private readonly proxy: TasksExt;
    private readonly disposables = new Map<number, monaco.IDisposable>();
    private readonly taskProviderRegistry: TaskProviderRegistry;
    private readonly taskResolverRegistry: TaskResolverRegistry;
    private readonly taskWatcher: TaskWatcher;
    private readonly taskService: TaskService;
    private readonly workspaceService: WorkspaceService;
    private readonly taskDefinitionRegistry: TaskDefinitionRegistry;

    constructor(rpc: RPCProtocol, container: interfaces.Container, ) {
        this.proxy = rpc.getProxy(MAIN_RPC_CONTEXT.TASKS_EXT);
        this.taskProviderRegistry = container.get(TaskProviderRegistry);
        this.taskResolverRegistry = container.get(TaskResolverRegistry);
        this.workspaceService = container.get(WorkspaceService);
        this.taskWatcher = container.get(TaskWatcher);
        this.taskService = container.get(TaskService);
        this.taskDefinitionRegistry = container.get(TaskDefinitionRegistry);

        this.workspaceService.roots.then(roots => {
            const root = roots[0];
            if (root) {
                this.workspaceRootUri = root.uri;
            }
        });

        this.taskWatcher.onTaskCreated((event: TaskInfo) => {
            if (event.ctx === this.workspaceRootUri) {
                this.proxy.$onDidStartTask({
                    id: event.taskId,
                    task: event.config
                });
            }
        });

        this.taskWatcher.onTaskExit((event: TaskExitedEvent) => {
            if (event.ctx === this.workspaceRootUri) {
                this.proxy.$onDidEndTask(event.taskId);
            }
        });

        this.taskWatcher.onDidStartTaskProcess((event: TaskInfo) => {
            if (event.ctx === this.workspaceRootUri && event.processId !== undefined) {
                this.proxy.$onDidStartTaskProcess(event.processId, {
                    id: event.taskId,
                    task: event.config
                });
            }
        });

        this.taskWatcher.onDidEndTaskProcess((event: TaskExitedEvent) => {
            if (event.ctx === this.workspaceRootUri && event.code !== undefined) {
                this.proxy.$onDidEndTaskProcess(event.code, event.taskId);
            }
        });
    }

    $registerTaskProvider(handle: number, type: string): void {
        const taskProvider = this.createTaskProvider(handle);
        const taskResolver = this.createTaskResolver(handle);

        const disposable = new DisposableCollection();
        disposable.push(this.taskProviderRegistry.register(type, taskProvider, handle));
        disposable.push(this.taskResolverRegistry.register(type, taskResolver));
        this.disposables.set(handle, disposable);
    }

    async $fetchTasks(taskVersion: string | undefined, taskType: string | undefined): Promise<TaskDto[]> {
        if (taskVersion && !taskVersion.startsWith('2.')) { // Theia does not support 1.x or earlier task versions
            return [];
        }

        let found: TaskConfiguration[] = [];
        const tasks = [...(await this.taskService.getConfiguredTasks()), ...(await this.taskService.getProvidedTasks())];
        if (taskType) {
            found = tasks.filter(t => {
                if (!!this.taskDefinitionRegistry.getDefinition(t)) {
                    return t._source === taskType;
                }
                return t.type === taskType;
            });
        } else {
            found = tasks;
        }

        const filtered: TaskConfiguration[] = [];
        found.forEach((taskConfig, index) => {
            const rest = found.slice(index + 1);
            const isDuplicate = rest.some(restTask => this.taskDefinitionRegistry.compareTasks(taskConfig, restTask));
            if (!isDuplicate) {
                filtered.push(taskConfig);
            }
        });
        return filtered.map(taskConfig => {
            const dto: TaskDto = {
                type: taskConfig.type,
                label: taskConfig.label
            };
            const { _scope, _source, ...properties } = taskConfig;
            dto.scope = _scope;
            dto.source = _source;
            for (const key in properties) {
                if (properties.hasOwnProperty(key)) {
                    dto[key] = properties[key];
                }
            }
            return dto;
        });
    }

    async $executeTask(taskDto: TaskDto): Promise<TaskExecutionDto | undefined> {
        const taskConfig = this.toTaskConfiguration(taskDto);
        const taskInfo = await this.taskService.runTask(taskConfig);
        if (taskInfo) {
            return {
                id: taskInfo.taskId,
                task: taskInfo.config
            };
        }
    }

    $unregister(handle: number): void {
        const disposable = this.disposables.get(handle);
        if (disposable) {
            disposable.dispose();
            this.disposables.delete(handle);
        }
    }

    async $taskExecutions(): Promise<{
        id: number;
        task: TaskConfiguration;
    }[]> {
        const runningTasks = await this.taskService.getRunningTasks();
        return runningTasks.map(taskInfo => ({
            id: taskInfo.taskId,
            task: taskInfo.config
        }));
    }

    $terminateTask(id: number): void {
        this.taskService.kill(id);
    }

    protected createTaskProvider(handle: number): TaskProvider {
        return {
            provideTasks: () =>
                this.proxy.$provideTasks(handle).then(v =>
                    v!.map(taskDto =>
                        this.toTaskConfiguration(taskDto)
                    )
                )
        };
    }

    protected createTaskResolver(handle: number): TaskResolver {
        return {
            resolveTask: taskConfig =>
                this.proxy.$resolveTask(handle, taskConfig).then(v =>
                    this.toTaskConfiguration(v!)
                )
        };
    }

    protected toTaskConfiguration(taskDto: TaskDto): TaskConfiguration {
        return Object.assign(taskDto, {
            _source: taskDto.source || 'plugin',
            _scope: taskDto.scope
        });
    }
}

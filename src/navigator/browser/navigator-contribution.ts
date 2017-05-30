/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { injectable, inject } from "inversify";
import { SelectionService } from "../../application/common";
import { FrontendApplicationContribution, FrontendApplication } from "../../application/browser";
import { FileSystem } from "../../filesystem/common";
import { DirNode } from "./navigator-tree";
import { FileNavigatorWidget } from "./navigator-widget";

@injectable()
export class FileNavigatorContribution implements FrontendApplicationContribution {

    protected readonly onReady: Promise<void>;

    constructor(
        @inject(FileSystem) protected readonly fileSystem: FileSystem,
        @inject(SelectionService) protected readonly selectionService: SelectionService,
        @inject(FileNavigatorWidget) protected readonly fileNavigator: FileNavigatorWidget
    ) {
        this.fileNavigator.getModel().onSelectionChanged(selection =>
            this.selectionService.selection = selection
        );
        this.onReady = this.fileSystem.getWorkspaceRoot().then(fileStat => {
            this.fileNavigator.getModel().root = DirNode.createRoot(fileStat);
        });
    }

    onStart(app: FrontendApplication): void {
        this.onReady.then(() =>
            app.shell.addToLeftArea(this.fileNavigator)
        );
    }

}

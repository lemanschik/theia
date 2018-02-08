/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { MonacoToProtocolConverter, ProtocolToMonacoConverter } from 'monaco-languageclient';
import URI from '@theia/core/lib/common/uri';
import { Disposable, DisposableCollection } from '@theia/core/lib/common';
import { Dimension } from '@theia/editor/lib/browser';
import { MonacoEditorModel } from './monaco-editor-model';
import { MonacoEditor } from './monaco-editor';

import IStandaloneDiffEditor = monaco.editor.IStandaloneDiffEditor;
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor;
import IDiffEditorConstructionOptions = monaco.editor.IDiffEditorConstructionOptions;
import IEditorOverrideServices = monaco.editor.IEditorOverrideServices;

export namespace MonacoDiffEditor {
    export interface IOptions extends MonacoEditor.ICommonOptions, IDiffEditorConstructionOptions {
    }
}

export class MonacoDiffEditor extends MonacoEditor {
    protected _diffEditor: IStandaloneDiffEditor;

    constructor(
        readonly uri: URI,
        readonly node: HTMLElement,
        readonly originalModel: MonacoEditorModel,
        readonly modifiedModel: MonacoEditorModel,
        protected readonly m2p: MonacoToProtocolConverter,
        protected readonly p2m: ProtocolToMonacoConverter,
        options?: MonacoDiffEditor.IOptions,
        override?: IEditorOverrideServices,
    ) {
        super(uri, modifiedModel, node, m2p, p2m, options, override);
        this.documents.add(originalModel);
        const original = originalModel.textEditorModel;
        const modified = modifiedModel.textEditorModel;
        this._diffEditor.setModel({ original, modified });
    }

    get diffEditor(): IStandaloneDiffEditor {
        return this._diffEditor;
    }

    protected create(options?: IDiffEditorConstructionOptions, override?: monaco.editor.IEditorOverrideServices): Disposable {
        this._diffEditor = monaco.editor.createDiffEditor(this.node, {
            ...options,
            fixedOverflowWidgets: true
        });
        this.editor = this._diffEditor.getModifiedEditor();
        return this._diffEditor;
    }

    protected addOnDidFocusHandler(codeEditor: IStandaloneCodeEditor) {
        // increase the z-index for the focussed element hierarchy within the dockpanel
        this.toDispose.push(codeEditor.onDidFocusEditor(() => {
            const z = '1';
            // already increased? -> do nothing
            if (this._diffEditor.getDomNode().style.zIndex === z) {
                return;
            }
            const toDisposeOnBlur = new DisposableCollection();
            this.editor = codeEditor;
            this.increaseZIndex(this._diffEditor.getDomNode(), z, toDisposeOnBlur);
            toDisposeOnBlur.push(codeEditor.onDidBlurEditor(() =>
                toDisposeOnBlur.dispose()
            ));
        }));
    }

    protected resize(dimension: Dimension | null): void {
        if (this.node) {
            const layoutSize = this.computeLayoutSize(this.node, dimension);
            this._diffEditor.layout(layoutSize);
        }
    }

    isActionSupported(id: string): boolean {
        const action = this._diffEditor.getActions().find(a => a.id === id);
        return !!action && action.isSupported() && super.isActionSupported(id);
    }
}

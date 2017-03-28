import { SelectionService } from '../../application/common/selection-service';
import {ElementExt} from "@phosphor/domutils";
import {Widget} from "@phosphor/widgets";
import {Message} from "@phosphor/messaging";
import {DisposableCollection} from "../../application/common";

import IEditorConstructionOptions = monaco.editor.IEditorConstructionOptions
import IEditorOverrideServices = monaco.editor.IEditorOverrideServices
import IStandaloneCodeEditor = monaco.editor.IStandaloneCodeEditor
import IDimension = monaco.editor.IDimension
import IBoxSizing = ElementExt.IBoxSizing
import IEditorReference = monaco.editor.IEditorReference

export namespace EditorWidget {
    export interface IOptions extends IEditorConstructionOptions {
        /**
         * Whether an editor should be auto resized on a content change.
         *
         * #### Fixme
         * remove when https://github.com/Microsoft/monaco-editor/issues/103 is resolved
         */
        autoSizing?: boolean
        /**
         * A minimal height of an editor.
         *
         * #### Fixme
         * remove when https://github.com/Microsoft/monaco-editor/issues/103 is resolved
         */
        minHeight?: number
    }
}

export class EditorWidget extends Widget implements EventListenerObject, IEditorReference {


    protected readonly autoSizing: boolean
    protected readonly minHeight: number
    protected readonly editor: IStandaloneCodeEditor
    protected readonly toDispose = new DisposableCollection()

    protected _needsRefresh = true
    protected _needsResize = false
    protected _resizing = -1

    constructor(options?: EditorWidget.IOptions, override?: IEditorOverrideServices, selectionService?: SelectionService) {
        super()
        this.autoSizing = options && options.autoSizing !== undefined ? options.autoSizing : false
        this.minHeight = options && options.minHeight !== undefined ? options.minHeight : -1
        this.toDispose.push(this.editor = monaco.editor.create(this.node, {
            ...options,
            fixedOverflowWidgets: true
        }, override))
        this.toDispose.push(this.editor.onDidChangeConfiguration(e => this.refresh()))
        this.toDispose.push(this.editor.onDidChangeModel(e => this.refresh()))
        this.toDispose.push(this.editor.onDidChangeModelContent(() => this.refresh()))
        if (selectionService) {
            this.toDispose.push(this.editor.onDidChangeCursorSelection((event) => {
                selectionService.selection = event
            }));
        }

        // increase the z-index for the focussed element hierarchy within the dockpanel
        this.editor.onDidFocusEditor(
            () => {
                const z = '1'
                // already increased? -> do nothing
                if (this.editor.getDomNode().style.zIndex === z) {
                    return;
                }
                const disposables = new DisposableCollection()
                this.increaseZIndex(this.editor.getDomNode(), z, disposables)
                disposables.push(this.editor.onDidBlurEditor(() => {
                    disposables.dispose()
                }))
            }
        )
    }

    protected increaseZIndex(element: HTMLElement, z: string, disposables: DisposableCollection) {
        let parent = element.parentElement
        if (parent && !element.classList.contains('p-DockPanel')) {
            const oldIndex = element.style.zIndex;
            disposables.push({
                dispose() {
                    element.style.zIndex = oldIndex;
                }
            })
            element.style.zIndex = z;
            this.increaseZIndex(parent, z, disposables)
        }
    }

    dispose() {
        if (this.isDisposed) {
            return
        }
        clearTimeout(this._resizing)
        super.dispose()
        this.editor.dispose()
    }

    getControl() {
        return this.editor;
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg)
        this.editor.focus()
    }

    protected onCloseRequest(msg: Message): void {
        super.onCloseRequest(msg)
        this.dispose()
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg)
        this.node.addEventListener('focus', this, true)
        if (!this.isVisible) {
            this._needsRefresh = true
            return
        }
        this.refresh()
        this._needsRefresh = false
        console.log("onAfterAttach")
    }

    protected onBeforeDetach(msg: Message): void {
        this.node.removeEventListener('focus', this, true)
    }

    protected onAfterShow(msg: Message): void {
        if (this._needsRefresh) {
            this.refresh()
            this._needsRefresh = false
        }
    }

    protected onResize(msg: Widget.ResizeMessage): void {
        if (msg.width < 0 || msg.height < 0) {
            if (this._resizing === -1) {
                this.resize(null)
                this._resizing = window.setTimeout(() => {
                    if (this._needsResize) {
                        this.resize(null)
                        this._needsResize = false
                    }
                    this._resizing = -1
                }, 500)
            } else {
                this._needsResize = true
            }
        } else {
            this.resize(msg)
        }
        this._needsRefresh = true
    }

    handleEvent(event: Event): void {
        if (event.type === 'focus') {
            if (this._needsRefresh) {
                this.refresh()
                this._needsRefresh = false
            }
        }
    }

    protected refresh(): void {
        if (this.autoSizing) {
            this.resize(null)
        }
    }

    protected resize(dimension: IDimension | null): void {
        if (this.node) {
            const layoutSize = this.computeLayoutSize(this.node, dimension)
            this.editor.layout(layoutSize)
        }
    }

    protected computeLayoutSize(hostNode: HTMLElement, dimension: monaco.editor.IDimension | null): monaco.editor.IDimension {
        if (dimension && dimension.width >= 0 && dimension.height >= 0) {
            return dimension
        }
        const boxSizing = ElementExt.boxSizing(hostNode)

        const width = (!dimension || dimension.width < 0) ?
            this.getWidth(hostNode, boxSizing) :
            dimension.width

        const height = (!dimension || dimension.height < 0) ?
            this.getHeight(hostNode, boxSizing) :
            dimension.height

        return {width, height}
    }

    protected getWidth(hostNode: HTMLElement, boxSizing: IBoxSizing): number {
        return hostNode.offsetWidth - boxSizing.horizontalSum
    }

    protected getHeight(hostNode: HTMLElement, boxSizing: IBoxSizing): number {
        if (!this.autoSizing) {
            return hostNode.offsetHeight - boxSizing.verticalSum
        }
        const configuration = this.editor.getConfiguration()

        const lineHeight = configuration.lineHeight
        const lineCount = this.editor.getModel().getLineCount()
        const contentHeight = lineHeight * lineCount

        const horizontalScrollbarHeight = configuration.layoutInfo.horizontalScrollbarHeight

        const editorHeight = contentHeight + horizontalScrollbarHeight
        if (this.minHeight < 0) {
            return editorHeight
        }
        const defaultHeight = lineHeight * this.minHeight + horizontalScrollbarHeight
        return Math.max(defaultHeight, editorHeight)
    }

    isActionSupported(id: string): boolean {
        const action = this.editor.getAction(id)
        return !!action && action.isSupported()
    }

    runAction(id: string): monaco.Promise<void> {
        const action = this.editor.getAction(id)
        if (action && action.isSupported()) {
            return action.run()
        }
        return monaco.Promise.as(undefined)
    }

}

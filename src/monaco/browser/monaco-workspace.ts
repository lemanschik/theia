import { ProtocolToMonacoConverter } from 'monaco-languageclient/lib';
import { injectable, inject, decorate } from "inversify";
import { MonacoWorkspace as BaseMonacoWorkspace, MonacoToProtocolConverter, testGlob } from "monaco-languageclient";
import { DisposableCollection } from "../../application/common";
import { FileChangeType, FileSystem, FileSystemWatcher } from '../../filesystem/common';
import * as lang from "../../languages/common";
import * as protocol from "../../languages/common";
import { TextModelResolverService, WillSaveModelEvent } from '../../editor/browser/model-resolver-service';
import { Emitter, Event, TextDocument, TextDocumentWillSaveEvent, TextEdit } from "../../languages/common";

decorate(injectable(), BaseMonacoWorkspace);
decorate(inject(MonacoToProtocolConverter), BaseMonacoWorkspace, 0);

@injectable()
export class MonacoWorkspace extends BaseMonacoWorkspace implements protocol.Workspace {
    readonly synchronization = {
        didSave: true,
        willSave: true,
        willSaveWaitUntil: true
    };

    protected resolveReady: () => void;
    readonly ready = new Promise<void>(resolve => {
        this.resolveReady = resolve;
    });
    protected readonly onWillSaveTextDocumentEmitter = new Emitter<TextDocumentWillSaveEvent>();
    protected readonly onDidSaveTextDocumentEmitter = new Emitter<TextDocument>();

    constructor(
        @inject(FileSystem) protected readonly fileSystem: FileSystem,
        @inject(FileSystemWatcher) protected readonly fileSystemWatcher: FileSystemWatcher,
        @inject(TextModelResolverService) protected readonly textModelResolverService: TextModelResolverService,
        @inject(MonacoToProtocolConverter) protected readonly m2p: MonacoToProtocolConverter,
        @inject(ProtocolToMonacoConverter) protected readonly p2m: ProtocolToMonacoConverter
    ) {
        super(m2p);
        fileSystem.getWorkspaceRoot().then(rootStat => {
            this._rootUri = rootStat.uri;
            this.resolveReady();
        });
        textModelResolverService.onDidSaveModel(model =>
            this.onDidSaveModel(model)
        );
        textModelResolverService.onWillSaveModel(event =>
            this.onWillSaveModel(event)
        )
    }

    get onWillSaveTextDocument(): Event<TextDocumentWillSaveEvent> {
        return this.onWillSaveTextDocumentEmitter.event;
    }

    protected onWillSaveModel(event: WillSaveModelEvent): void {
        const { model, reason } = event;
        const textDocument = this.documents.get(model.uri.toString());
        if (textDocument) {
            this.onWillSaveTextDocumentEmitter.fire({
                textDocument,
                reason,
                waitUntil: thenable => {
                    const timeout = new Promise<TextEdit[]>(resolve =>
                        setTimeout(() => resolve([]), 2000)
                    );
                    event.waitUntil(
                        Promise.race([thenable, timeout]).then(edits =>
                            this.p2m.asTextEdits(edits)
                        )
                    )
                }
            });
        }
    }

    get onDidSaveTextDocument(): Event<TextDocument> {
        return this.onDidSaveTextDocumentEmitter.event;
    }

    protected onDidSaveModel(model: monaco.editor.IModel): void {
        const document = this.documents.get(model.uri.toString());
        if (document) {
            this.onDidSaveTextDocumentEmitter.fire(document);
        }
    }

    createFileSystemWatcher(globPattern: string, ignoreCreateEvents?: boolean, ignoreChangeEvents?: boolean, ignoreDeleteEvents?: boolean): protocol.FileSystemWatcher {
        const disposables = new DisposableCollection()
        const onFileEventEmitter = new protocol.Emitter<protocol.FileEvent>()
        disposables.push(onFileEventEmitter);
        disposables.push(this.fileSystemWatcher.onFileChanges(event => {
            for (const change of event.changes) {
                const result: [lang.FileChangeType, boolean | undefined] =
                    change.type === FileChangeType.ADDED ? [lang.FileChangeType.Created, ignoreCreateEvents] :
                        change.type === FileChangeType.UPDATED ? [lang.FileChangeType.Changed, ignoreChangeEvents] :
                            [lang.FileChangeType.Deleted, ignoreDeleteEvents];

                const type = result[0];
                const ignoreEvents = result[1];
                const uri = change.uri;
                if (ignoreEvents === undefined && ignoreEvents === false && testGlob(globPattern, uri)) {
                    onFileEventEmitter.fire({ uri, type });
                }
            }
        }));
        const onFileEvent = onFileEventEmitter.event;
        return {
            onFileEvent,
            dispose: () => disposables.dispose()
        };
    }

}

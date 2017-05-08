/*
 * Copyright (C) 2017 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { RequestType } from 'vscode-jsonrpc';
import { TextDocumentIdentifier } from "../../languages/common";

export namespace ClassFileContentsRequest {
    export const type = new RequestType<TextDocumentIdentifier, string | undefined, void, void>('java/classFileContents');
}
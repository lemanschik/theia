/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import { interfaces } from "inversify";
import {
    createPreferenceProxy,
    PreferenceProxy,
    PreferenceService,
} from '@theia/preferences/lib/common';

export const EditorConfigSchema = {
    "$schema": "http://json-schema.org/draft-04/schema#",
    "title": "Editor configuration Scheme",
    "type": "object",
    "properties": {
        "editor.tabSize": {
            "type": "number",
            "minimum": 1,
            "description": "Configure the tab size in the monaco editor"
        },
        "editor.lineNumbers": {
            "enum": [
                "on",
                "off"
            ],
            "description": "Control the rendering of line numbers"

        },
        "editor.renderWhitespace": {
            "enum": [
                "none",
                "boundary",
                "all"
            ],
            "description": "Control the rendering of whitespaces in the editor"
        }
    }
}

export interface EditorConfiguration {
    'editor.tabSize': number,
    'editor.lineNumbers': 'on' | 'off'
    'editor.renderWhitespace': 'none' | 'boundary' | 'all'
}

export const defaultEditorConfiguration: EditorConfiguration = {
    'editor.tabSize': 4,
    'editor.lineNumbers': 'on',
    'editor.renderWhitespace': 'none'
}

export const EditorPreferences = Symbol('EditorPreferences');
export type EditorPreferences = PreferenceProxy<EditorConfiguration>;

export function createEditorPreferences(preferences: PreferenceService): EditorPreferences {
    return createPreferenceProxy(preferences, defaultEditorConfiguration);
}

export function bindEditorPreferences(bind: interfaces.Bind): void {
    bind(EditorPreferences).toDynamicValue(ctx => {
        const preferences = ctx.container.get(PreferenceService);
        return createEditorPreferences(preferences);
    });
}
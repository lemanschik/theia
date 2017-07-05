/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as chai from 'chai';
import * as fs from 'fs-extra';
import * as temp from 'temp';
import URI from '../../application/common/uri';
import { FileUri } from '../../application/node/file-uri';
import { FileSystemNode } from "../../filesystem/node/node-filesystem"
import { FileSystemWatcher, FileSystemWatcherClientListener } from '../../filesystem/common/filesystem-watcher'
import { ChokidarFileSystemWatcherServer } from '../../filesystem/node/chokidar-filesystem-watcher'
import { JsonPreferenceServer } from './json-preference-server'
import { Logger } from '../../application/common/logger'
import * as chaiAsPromised from "chai-as-promised";


const expect = chai.expect;
const track = temp.track();
const preferencePath = '.theia/prefs.json';

let prefServer: JsonPreferenceServer;
let fileWatcher: FileSystemWatcher;
let fileSystem: FileSystemNode;
let rootUri: URI;
let preferenceFileUri: URI;
const logger = new Proxy<Logger>({} as any, {
    get: (target, name) => () => {
        if (name.toString().startsWith('is')) {
            return Promise.resolve(false);
        }
        if (name.toString().startsWith('if')) {
            return new Promise(resolve => { });
        }
    }
});

before(() => {
    chai.should();
    chai.use(chaiAsPromised);
    chai.config.showDiff = true;
    chai.config.includeStack = true;

    rootUri = FileUri.create(track.mkdirSync());
    preferenceFileUri = rootUri.resolve(preferencePath);
    fs.mkdirSync(FileUri.fsPath(rootUri.resolve('.theia')));

    fs.writeFileSync(FileUri.fsPath(preferenceFileUri), '{ "showLineNumbers": false }');


    fileSystem = new FileSystemNode();
    fileWatcher = createFileSystemWatcher();
    prefServer = new JsonPreferenceServer(fileSystem, fileWatcher, logger, Promise.resolve(preferenceFileUri));
});

describe('json-preference-server', () => {

    after(() => {
        track.cleanupSync();
    });

    describe('01 #has preference', () => {

        it('should return true for the has preference', async () => {
            const actual = await prefServer.has("showLineNumbers");
            expect(actual).to.be.true;
        });

        it('should return false for the has preference', async () => {
            const actual = await prefServer.has("missingPreferenceKey");
            expect(actual).to.be.false;
        });

    });

    describe('02 #get preference', () => {

        it('should get the value for the preference', async () => {
            const actual = await prefServer.get("showLineNumbers");
            expect(actual).to.be.false;
        });

        it('should get no value for unknown preference', async () => {
            const actual = await prefServer.get("unknownPreference");
            expect(actual).to.be.undefined;
        });

    });

    describe('03 #register and wait for pref change', () => {

        it('should get notified of changed pref with the correct new/old values', async () => {

            // Register a simple client
            let promise: Promise<boolean> = new Promise<boolean>((done) => {
                prefServer.setClient({
                    onDidChangePreference(event) {
                        expect(event.newValue).to.be.equal(true);
                        expect(event.oldValue).to.be.equal(false);
                        done();
                    }
                })
            })


            // Make sure, it is `true` by default.
            const initialState = await prefServer.get("showLineNumbers");
            expect(initialState).to.be.false;

            // Modify the content.
            fs.writeFileSync(FileUri.fsPath(preferenceFileUri), '{ "showLineNumbers": true }');

            let { content } = await fileSystem.resolveContent(FileUri.fsPath(preferenceFileUri));
            expect(content).to.be.equal('{ "showLineNumbers": true }');

            return promise;

        }).timeout(20000)
    });
});

function createFileSystemWatcher(): FileSystemWatcher {
    const listener = new FileSystemWatcherClientListener();
    const server = new ChokidarFileSystemWatcherServer(logger);
    server.setClient(listener);
    return new FileSystemWatcher(server, listener);
}
/*
 * Copyright (C) 2017 Ericsson and others.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */
import { enableJSDOM } from '../browser/test/jsdom';

let disableJSDOM = enableJSDOM();

import { Container, injectable, inject, ContainerModule } from 'inversify';
import { bindContributionProvider } from '../common/contribution-provider';
import { ILogger } from '../common/logger';
import {
    KeybindingRegistry, KeybindingContext, KeybindingContextRegistry,
    Keybinding, KeybindingContribution, KeybindingScope
} from './keybinding';
import { KeyCode, Key, Modifier, KeySequence } from './keys';
import { CommandRegistry, CommandService, CommandContribution, Command } from '../common/command';
import { LabelParser } from './label-parser';
import { MockLogger } from '../common/test/mock-logger';
import { StatusBar, StatusBarImpl } from './status-bar/status-bar';
import * as os from '../common/os';
import * as chai from 'chai';
import * as sinon from 'sinon';

disableJSDOM();

/* tslint:disable:no-unused-expression */

const expect = chai.expect;
chai.config.showDiff = true;
chai.config.includeStack = true;

let keybindingRegistry: KeybindingRegistry;
let commandRegistry: CommandRegistry;
let testContainer: Container;
let stub: sinon.SinonStub;

before(async () => {
    testContainer = new Container();
    const module = new ContainerModule((bind, unbind, isBound, rebind) => {

        /* Mock logger binding*/
        bind(ILogger).to(MockLogger);

        bind(KeybindingContextRegistry).toSelf();
        bindContributionProvider(bind, KeybindingContext);

        bind(CommandRegistry).toSelf().inSingletonScope();
        bindContributionProvider(bind, CommandContribution);

        bind(KeybindingRegistry).toSelf();
        bindContributionProvider(bind, KeybindingContribution);

        bind(TestContribution).toSelf().inSingletonScope();
        [CommandContribution, KeybindingContribution].forEach(serviceIdentifier =>
            bind(serviceIdentifier).toDynamicValue(ctx => ctx.container.get(TestContribution)).inSingletonScope()
        );

        bind(TestContext).toSelf().inSingletonScope();
        bind(KeybindingContext).toDynamicValue(context => context.container.get(TestContext)).inSingletonScope();

        bind(StatusBarImpl).toSelf().inSingletonScope();
        bind(StatusBar).toDynamicValue(ctx => ctx.container.get(StatusBarImpl)).inSingletonScope();
        bind(CommandService).toDynamicValue(context => context.container.get(CommandRegistry));
        bind(LabelParser).toSelf().inSingletonScope();

    });

    testContainer.load(module);

    commandRegistry = testContainer.get(CommandRegistry);
    commandRegistry.onStart();

});

describe('keybindings', () => {
    before(() => {
        disableJSDOM = enableJSDOM();
    });

    after(() => {
        disableJSDOM();
    });

    beforeEach(() => {
        keybindingRegistry = testContainer.get<KeybindingRegistry>(KeybindingRegistry);
        keybindingRegistry.onStart();
        stub = sinon.stub(os, 'isOSX').value(false);
    });

    afterEach(() => {
        stub.restore();
    });

    it("should register the default keybindings", () => {
        const keybinding = keybindingRegistry.getKeybindingsForCommand('test.command');
        expect(keybinding).is.not.undefined;

        const keybinding2 = keybindingRegistry.getKeybindingsForCommand('undefined.command');
        expect(keybinding2.length).is.equal(0);
    });

    it("should set a keymap", () => {
        const keybindings: Keybinding[] = [{
            command: "test.command",
            keybinding: "ctrl+c"
        }];

        keybindingRegistry.setKeymap(KeybindingScope.USER, keybindings);

        const bindings = keybindingRegistry.getKeybindingsForCommand('test.command');
        if (bindings) {
            const keyCode = KeyCode.parse(bindings[0].keybinding);
            expect(keyCode.key).to.be.equal(Key.KEY_C);
            expect(keyCode.ctrl).to.be.true;
        }

    });

    it("should reset to default in case of invalid keybinding", () => {
        const keybindings: Keybinding[] = [{
            command: "test.command",
            keybinding: "ctrl+invalid"
        }];

        keybindingRegistry.setKeymap(KeybindingScope.USER, keybindings);

        const bindings = keybindingRegistry.getKeybindingsForCommand('test.command');
        if (bindings) {
            const keyCode = KeyCode.parse(bindings[0].keybinding);
            expect(keyCode.key).to.be.equal(Key.KEY_A);
            expect(keyCode.ctrl).to.be.true;
        }
    });

    it("should remove all keybindings from a command that has multiple keybindings", () => {
        const keybindings: Keybinding[] = [{
            command: "test.command2",
            keybinding: "F3"
        }];

        keybindingRegistry.setKeymap(KeybindingScope.USER, keybindings);

        const bindings = keybindingRegistry.getKeybindingsForCommand('test.command2');
        if (bindings) {
            expect(bindings.length).to.be.equal(2);
            const keyCode = KeyCode.parse(bindings[0].keybinding);
            expect(keyCode.key).to.be.equal(Key.F1);
            expect(keyCode.ctrl).to.be.true;
        }
    });

    it("should register a correct keybinding, then default back to the original for a wrong one after", () => {
        let keybindings: Keybinding[] = [{
            command: "test.command",
            keybinding: "ctrl+c"
        }];
        // Get default binding
        const keystroke = keybindingRegistry.getKeybindingsForCommand('test.command');

        // Set correct new binding
        keybindingRegistry.setKeymap(KeybindingScope.USER, keybindings);
        const bindings = keybindingRegistry.getKeybindingsForCommand('test.command');
        if (bindings) {
            const keyCode = KeyCode.parse(bindings[0].keybinding);
            expect(keyCode.key).to.be.equal(Key.KEY_C);
            expect(keyCode.ctrl).to.be.true;
        }

        // Set invalid binding
        keybindings = [{
            command: "test.command",
            keybinding: "ControlLeft+Invalid"
        }];
        keybindingRegistry.setKeymap(KeybindingScope.USER, keybindings);
        const defaultBindings = keybindingRegistry.getKeybindingsForCommand('test.command');
        if (defaultBindings) {
            if (keystroke) {
                const keyCode = KeyCode.parse(defaultBindings[0].keybinding);
                const keyStrokeCode = KeyCode.parse(keystroke[0].keybinding);
                expect(keyCode.key).to.be.equal(keyStrokeCode.key);
            }
        }
    });

    it("should only return the more specific keybindings when a keystroke is entered", () => {
        const keybindingsUser: Keybinding[] = [{
            command: "test.command",
            keybinding: "ctrl+b"
        }];

        keybindingRegistry.setKeymap(KeybindingScope.USER, keybindingsUser);

        const keybindingsSpecific: Keybinding[] = [{
            command: "test.command",
            keybinding: "ctrl+c"
        }];

        const validKeyCode = KeyCode.createKeyCode({ first: Key.KEY_C, modifiers: [Modifier.M1] });

        keybindingRegistry.setKeymap(KeybindingScope.WORKSPACE, keybindingsSpecific);

        let bindings = keybindingRegistry.getKeybindingsForKeySequence([KeyCode.createKeyCode({ first: Key.KEY_A, modifiers: [Modifier.M1] })]).full;
        expect(bindings).to.be.empty;

        bindings = keybindingRegistry.getKeybindingsForKeySequence([KeyCode.createKeyCode({ first: Key.KEY_B, modifiers: [Modifier.M1] })]).full;
        expect(bindings).to.be.empty;

        bindings = keybindingRegistry.getKeybindingsForKeySequence([KeyCode.createKeyCode({ first: Key.KEY_C, modifiers: [Modifier.M1] })]).full;
        const keyCode = KeyCode.parse(bindings[0].keybinding);
        expect(keyCode.key).to.be.equal(validKeyCode.key);
    });

    it("should return partial keybinding matches", () => {
        const keybindingsUser: Keybinding[] = [{
            command: "test.command",
            keybinding: "ctrlcmd+x t"
        }];

        keybindingRegistry.setKeymap(KeybindingScope.USER, keybindingsUser);

        const validKeyCodes = [];
        validKeyCodes.push(KeyCode.createKeyCode({ first: Key.KEY_C, modifiers: [Modifier.M1] }));
        validKeyCodes.push(KeyCode.createKeyCode({ first: Key.KEY_T }));

        const bindings = keybindingRegistry.getKeybindingsForKeySequence(KeySequence.parse("ctrlcmd+x"));
        expect(bindings.partial.length > 0);
    });

    it("should not register a shadowing keybinding", () => {
        const validKeyBinding = "ctrlcmd+b a";
        const command = "test.command-shadow";
        const keybindingShadowing: Keybinding[] = [
            {
                command,
                keybinding: validKeyBinding
            },
            {
                command,
                keybinding: "ctrlcmd+b"
            }
        ];

        keybindingRegistry.registerKeybindings(...keybindingShadowing);

        const bindings = keybindingRegistry.getKeybindingsForCommand(command);
        expect(bindings.length).to.be.equal(1);
        expect(bindings[0].keybinding).to.be.equal(validKeyBinding);
    });
});

describe("keys api", () => {
    before(() => {
        disableJSDOM = enableJSDOM();
    });

    after(() => {
        disableJSDOM();
    });

    it("should parse a string to a KeyCode correctly", () => {

        const keycode = KeyCode.parse("ctrl+b");
        expect(keycode.ctrl).to.be.true;
        expect(keycode.key).is.equal(Key.KEY_B);

        // Invalid keystroke string
        expect(() => KeyCode.parse("ctl+b")).to.throw("Unrecognized key in ctl+b");

    });

    it("should parse a string containing special modifiers to a KeyCode correctly", () => {
        const stub = sinon.stub(os, 'isOSX').value(false);

        const keycode = KeyCode.parse("ctrl+b");
        expect(keycode.ctrl).to.be.true;
        expect(keycode.key).is.equal(Key.KEY_B);

        const keycodeOption = KeyCode.parse("option+b");
        expect(keycodeOption.alt).to.be.true;
        expect(keycodeOption.key).is.equal(Key.KEY_B);

        expect(() => KeyCode.parse("cmd+b")).to.throw("Can't parse keybinding cmd+b meta is for OSX only");

        const keycodeCtrlOrCommand = KeyCode.parse("ctrlcmd+b");
        expect(keycodeCtrlOrCommand.meta).to.be.false;
        expect(keycodeCtrlOrCommand.ctrl).to.be.true;
        expect(keycodeCtrlOrCommand.key).is.equal(Key.KEY_B);

        stub.restore();
    });

    it("should parse a string containing special modifiers to a KeyCode correctly (macOS)", () => {
        KeyCode.resetKeyBindings();
        stub = sinon.stub(os, 'isOSX').value(true);
        const keycode = KeyCode.parse("ctrl+b");
        expect(keycode.ctrl).to.be.true;
        expect(keycode.key).is.equal(Key.KEY_B);

        const keycodeOption = KeyCode.parse("option+b");
        expect(keycodeOption.alt).to.be.true;
        expect(keycodeOption.key).is.equal(Key.KEY_B);

        const keycodeCommand = KeyCode.parse("cmd+b");
        expect(keycodeCommand.meta).to.be.true;
        expect(keycodeCommand.key).is.equal(Key.KEY_B);

        const keycodeCtrlOrCommand = KeyCode.parse("ctrlcmd+b");
        expect(keycodeCtrlOrCommand.meta).to.be.true;
        expect(keycodeCtrlOrCommand.ctrl).to.be.false;
        expect(keycodeCtrlOrCommand.key).is.equal(Key.KEY_B);

        stub.restore();
    });

    it("it should seralize a keycode properly with BACKQUOTE + M1", () => {
        stub = sinon.stub(os, 'isOSX').value(true);
        let keyCode = KeyCode.createKeyCode({ first: Key.BACKQUOTE, modifiers: [Modifier.M1] });
        let keyCodeString = keyCode.toString();
        expect(keyCodeString).to.be.equal("meta+`");
        let parsedKeyCode = KeyCode.parse(keyCodeString);
        expect(KeyCode.equals(parsedKeyCode, keyCode)).to.be.true;

        stub = sinon.stub(os, 'isOSX').value(false);
        keyCode = KeyCode.createKeyCode({ first: Key.BACKQUOTE, modifiers: [Modifier.M1] });
        keyCodeString = keyCode.toString();
        expect(keyCodeString).to.be.equal("ctrl+`");
        parsedKeyCode = KeyCode.parse(keyCodeString);
        expect(KeyCode.equals(parsedKeyCode, keyCode)).to.be.true;
    });

    it("it should seralize a keycode properly with a + M2 + M3", () => {
        const keyCode = KeyCode.createKeyCode({ first: Key.KEY_A, modifiers: [Modifier.M2, Modifier.M3] });
        const keyCodeString = keyCode.toString();
        expect(keyCodeString).to.be.equal("shift+alt+a");
        const parsedKeyCode = KeyCode.parse(keyCodeString);
        expect(KeyCode.equals(parsedKeyCode, keyCode)).to.be.true;
    });

    it("it should seralize a keycode properly with a + M4", () => {
        stub = sinon.stub(os, 'isOSX').value(true);
        const keyCode = KeyCode.createKeyCode({ first: Key.KEY_A, modifiers: [Modifier.M4] });
        const keyCodeString = keyCode.toString();
        expect(keyCodeString).to.be.equal("ctrl+a");
        const parsedKeyCode = KeyCode.parse(keyCodeString);
        expect(KeyCode.equals(parsedKeyCode, keyCode)).to.be.true;
    });

    it("it should parse a multi keycode keybinding", () => {
        const validKeyCodes = [];
        validKeyCodes.push(KeyCode.createKeyCode({ first: Key.KEY_A, modifiers: [Modifier.M1] }));
        validKeyCodes.push(KeyCode.createKeyCode({ first: Key.KEY_C, modifiers: [Modifier.M1, Modifier.M2] }));

        const parsedKeyCodes = KeySequence.parse("ctrlcmd+a ctrlcmd+shift+c");
        expect(parsedKeyCodes).to.deep.equal(validKeyCodes);
    });

    it("it should parse a multi keycode keybinding with no modifiers", () => {
        const validKeyCodes = [];
        validKeyCodes.push(KeyCode.createKeyCode({ first: Key.KEY_A, modifiers: [Modifier.M1] }));
        validKeyCodes.push(KeyCode.createKeyCode({ first: Key.KEY_C }));

        const parsedKeyCodes = KeySequence.parse("ctrlcmd+a c");
        expect(parsedKeyCodes).to.deep.equal(validKeyCodes);
    });

    it("it should compare keysequences properly", () => {
        let a = KeySequence.parse("ctrlcmd+a");
        let b = KeySequence.parse("ctrlcmd+a t");

        expect(KeySequence.compare(a, b)).to.be.equal(KeySequence.CompareResult.PARTIAL);

        a = KeySequence.parse("ctrlcmd+a t");
        b = KeySequence.parse("ctrlcmd+a");

        expect(KeySequence.compare(a, b)).to.be.equal(KeySequence.CompareResult.SHADOW);

        a = KeySequence.parse("ctrlcmd+a t");
        b = KeySequence.parse("ctrlcmd+a b c");
        expect(KeySequence.compare(a, b)).to.be.equal(KeySequence.CompareResult.NONE);

        a = KeySequence.parse("ctrlcmd+a t");
        b = KeySequence.parse("ctrlcmd+a a");
        expect(KeySequence.compare(a, b)).to.be.equal(KeySequence.CompareResult.NONE);

        a = KeySequence.parse("ctrlcmd+a t");
        b = KeySequence.parse("ctrlcmd+a t");
        expect(KeySequence.compare(a, b)).to.be.equal(KeySequence.CompareResult.FULL);

        a = KeySequence.parse("ctrlcmd+a t b");
        b = KeySequence.parse("ctrlcmd+a t b");
        expect(KeySequence.compare(a, b)).to.be.equal(KeySequence.CompareResult.FULL);
    });

    it("it should be a modifier only", () => {

        const keyCode = KeyCode.createKeyCode({ modifiers: [Modifier.M1] });
        expect(keyCode).to.be.deep.equal(KeyCode.createKeyCode({ modifiers: [Modifier.M1] }));
        expect(keyCode.isModifierOnly()).to.be.true;
    });

    it("it should be multiple modifiers only", () => {

        const keyCode = KeyCode.createKeyCode({ modifiers: [Modifier.M1, Modifier.M3] });
        expect(keyCode).to.be.deep.equal(KeyCode.createKeyCode({ modifiers: [Modifier.M1, Modifier.M3] }));
        expect(keyCode.isModifierOnly()).to.be.true;
    });
});

const TEST_COMMAND: Command = {
    id: 'test.command'
};

const TEST_COMMAND2: Command = {
    id: 'test.command2'
};

const TEST_COMMAND_SHADOW: Command = {
    id: 'test.command-shadow'
};

@injectable()
export class TestContribution implements CommandContribution, KeybindingContribution {

    constructor( @inject(KeybindingContextRegistry) protected readonly contextRegistry: KeybindingContextRegistry) {
    }

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(TEST_COMMAND);
        commands.registerCommand(TEST_COMMAND2);
        commands.registerCommand(TEST_COMMAND_SHADOW);
    }

    registerContexts() {
        this.contextRegistry.registerContext(
            {
                id: 'testContext',
                isEnabled(arg?: Keybinding): boolean {
                    return true;
                }
            },
            {
                id: 'testContext',
                isEnabled(arg?: Keybinding): boolean {
                    return true;
                }
            },
        );
    }
    registerKeybindings(keybindings: KeybindingRegistry): void {
        [{
            command: TEST_COMMAND.id,
            context: 'testContext',
            keybinding: 'ctrl+a'
        },
        {
            command: TEST_COMMAND2.id,
            context: 'testContext',
            keybinding: 'ctrl+f1'
        },
        {
            command: TEST_COMMAND2.id,
            context: 'testContext',
            keybinding: 'ctrl+f2'
        },
        ].forEach(binding => {
            keybindings.registerKeybinding(binding);
        });
    }

}

@injectable()
export class TestContext implements KeybindingContext {

    constructor() { }

    id = 'testContext';

    isEnabled(arg?: Keybinding) {
        return true;
    }
}

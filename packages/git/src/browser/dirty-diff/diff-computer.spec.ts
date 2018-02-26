/*
 * Copyright (C) 2018 TypeFox and others.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 */

import * as chai from 'chai';
import { expect } from 'chai';
chai.use(require('chai-string'));

import { DiffComputer, DirtyDiff } from './diff-computer';

let diffComputer: DiffComputer;

before(() => {
    diffComputer = new DiffComputer();
});

// tslint:disable:no-unused-expression

describe("dirty-diff-computer", () => {

    it("remove single line", () => {
        const dirtyDiff = computeDirtyDiff(
            [
                "FIRST",
                "SECOND TO-BE-REMOVED",
                "THIRD"
            ],
            [
                "FIRST",
                "THIRD"
            ],
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            added: [],
            modified: [],
            removed: [0],
        });
    });

    [1, 2, 3, 20].forEach(lines => {
        it(`remove ${formatLines(lines)} at the end`, () => {
            const dirtyDiff = computeDirtyDiff(
                sequenceOfN(2)
                    .concat(sequenceOfN(lines, () => "TO-BE-REMOVED")),
                sequenceOfN(2),
            );
            expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
                modified: [],
                removed: [1],
                added: [],
            });
        });
    });

    it("remove all lines", () => {
        const dirtyDiff = computeDirtyDiff(
            sequenceOfN(10, () => "TO-BE-REMOVED"),
            [""]
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            added: [],
            modified: [],
            removed: [0],
        });
    });

    [1, 2, 3, 20].forEach(lines => {
        it(`remove ${formatLines(lines)} at the beginning`, () => {
            const dirtyDiff = computeDirtyDiff(
                sequenceOfN(lines, () => "TO-BE-REMOVED")
                    .concat(sequenceOfN(2)),
                sequenceOfN(2),
            );
            expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
                modified: [],
                removed: [0],
                added: [],
            });
        });
    });

    [1, 2, 3, 20].forEach(lines => {
        it(`add ${formatLines(lines)}`, () => {
            const previous = sequenceOfN(3);
            const modified = insertIntoArray(previous, 2, ...sequenceOfN(lines, () => "ADDED LINE"));
            const dirtyDiff = computeDirtyDiff(previous, modified);
            expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
                modified: [],
                removed: [],
                added: [{ start: 2, end: 2 + lines - 1 }],
            });
        });
    });

    [1, 2, 3, 20].forEach(lines => {
        it(`add ${formatLines(lines)} at the beginning`, () => {
            const dirtyDiff = computeDirtyDiff(
                sequenceOfN(2),
                sequenceOfN(lines, () => "ADDED LINE")
                    .concat(sequenceOfN(2))
            );
            expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
                modified: [],
                removed: [],
                added: [{ start: 0, end: lines - 1 }],
            });
        });
    });

    it("add lines to empty file", () => {
        const numberOfLines = 3;
        const dirtyDiff = computeDirtyDiff(
            [""],
            sequenceOfN(numberOfLines, () => "ADDED LINE")
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            modified: [],
            removed: [],
            added: [{ start: 0, end: numberOfLines - 1 }],
        });
    });

    it("add empty lines", () => {
        const dirtyDiff = computeDirtyDiff(
            [
                "1",
                "2"
            ],
            [
                "1",
                "",
                "",
                "2"
            ]
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            modified: [],
            removed: [],
            added: [{ start: 1, end: 2 }],
        });
    });

    it("add empty line after single line", () => {
        const dirtyDiff = computeDirtyDiff(
            [
                "1"
            ],
            [
                "1",
                ""
            ]
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            modified: [],
            removed: [],
            added: [{ start: 1, end: 1 }],
        });
    });

    [1, 2, 3, 20].forEach(lines => {
        it(`add ${formatLines(lines)} (empty) at the end`, () => {
            const dirtyDiff = computeDirtyDiff(
                sequenceOfN(2),
                sequenceOfN(2)
                    .concat(new Array(lines).map(() => ""))
            );
            expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
                modified: [],
                removed: [],
                added: [{ start: 2, end: 1 + lines }],
            });
        });
    });

    it("add empty and non-empty lines", () => {
        const dirtyDiff = computeDirtyDiff(
            [
                "FIRST",
                "LAST"
            ],
            [
                "FIRST",
                "1. ADDED",
                "2. ADDED",
                "3. ADDED",
                "4. ADDED",
                "5. ADDED",
                "LAST"
            ]
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            modified: [],
            removed: [],
            added: [{ start: 1, end: 5 }],
        });
    });

    [1, 2, 3, 4, 5].forEach(lines => {
        it(`add ${formatLines(lines)} after single line`, () => {
            const dirtyDiff = computeDirtyDiff(
                ["0"],
                ["0"].concat(sequenceOfN(lines, () => "ADDED LINE"))
            );
            expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
                modified: [],
                removed: [],
                added: [{ start: 1, end: lines }],
            });
        });
    });

    it("modify single line", () => {
        const dirtyDiff = computeDirtyDiff(
            [
                "FIRST",
                "TO-BE-MODIFIED",
                "LAST"
            ],
            [
                "FIRST",
                "MODIFIED",
                "LAST"
            ]
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            removed: [],
            added: [],
            modified: [{ start: 1, end: 1 }],
        });
    });

    it("modify all lines", () => {
        const numberOfLines = 10;
        const dirtyDiff = computeDirtyDiff(
            sequenceOfN(numberOfLines, () => "TO-BE-MODIFIED"),
            sequenceOfN(numberOfLines, () => "MODIFIED")
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            removed: [],
            added: [],
            modified: [{ start: 0, end: numberOfLines - 1 }],
        });
    });

    it("modify lines at the end", () => {
        const dirtyDiff = computeDirtyDiff(
            [
                "1",
                "2",
                "3",
                "4"
            ],
            [
                "1",
                "2-changed",
                "3-changed"
            ]
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            removed: [],
            added: [],
            modified: [{ start: 1, end: 2 }],
        });
    });

    it("multiple diffs", () => {
        const dirtyDiff = computeDirtyDiff(
            [
                "TO-BE-CHANGED",
                "1",
                "2",
                "3",
                "TO-BE-REMOVED",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9"
            ],
            [
                "CHANGED",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "ADDED",
                ""
            ]
        );
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            removed: [3],
            added: [{ start: 10, end: 11 }],
            modified: [{ start: 0, end: 0 }],
        });
    });

    it("multiple additions", () => {
        const dirtyDiff = computeDirtyDiff(
            [
                "first line",
                "",
                "foo changed on master",
                "bar changed on master",
                "",
                "",
                "",
                "",
                "",
                "last line"
            ],
            [
                "first line",
                "",
                "foo changed on master",
                "bar changed on master",
                "",
                "NEW TEXT",
                "",
                "",
                "",
                "last line",
                "",
                ""
            ]);
        expect(dirtyDiff).to.be.deep.equal(<DirtyDiff>{
            removed: [11],
            added: [{ start: 5, end: 5 }, { start: 9, end: 9 }],
            modified: [],
        });
    });

});

function computeDirtyDiff(previous: string[], modified: string[]) {
    return diffComputer.computeDirtyDiff(previous, modified);
}

function sequenceOfN(n: number, mapFn: (index: number) => string = i => i.toString()): string[] {
    return Array.from(new Array(n).keys()).map((value, index) => mapFn(index));
}

function formatLines(n: number): string {
    return n + ' line' + (n > 1 ? 's' : '');
}

function insertIntoArray(target: string[], start: number, ...items: string[]): string[] {
    const copy = target.slice(0);
    copy.splice(start, 0, ...items);
    return copy;
}

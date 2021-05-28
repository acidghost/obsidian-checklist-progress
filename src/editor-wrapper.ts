// (c) Copyright 2021, obsidian-checklist-progress Authors.
//
// Licensed under the terms of the GNU GPL License version 3.

import { MarkdownView } from "obsidian"

export const CUSTOM_ORIGIN = "checklist-progress-origin";

export class EditorWrapper {
    private lines: string[];

    constructor(private ed: MarkdownView | CodeMirror.Editor) {
        if (this.ed instanceof MarkdownView) {
            this.lines = this.ed.getViewData().split(/\r?\n/);
        } else {
            this.lines = this.ed.getValue().split(/\r?\n/);
        }
    }

    get linesCount(): number {
        if (this.ed instanceof MarkdownView) {
            return this.lines.length;
        }
        return this.ed.lineCount();
    }

    get fileName(): string {
        if (this.ed instanceof MarkdownView) {
            return this.ed.file.name;
        }
        return "CodeMirror.Editor";
    }

    getLine(idx: number): string {
        if (this.ed instanceof MarkdownView) {
            return this.lines[idx];
        }
        return this.ed.getLine(idx);
    }

    forEach(cb: (line: string, idx: number) => void) {
        if (this.ed instanceof MarkdownView) {
            this.lines.forEach((l, i) => cb(l.trimEnd(), i));
        } else {
            // Make TypeScript happy...
            const ed = this.ed;
            this.ed.eachLine((l) => {
                cb(l.text.trimEnd(), ed.getLineNumber(l));
            });
        }
    }

    replace(idx: number, toReplace: string, replacement: string) {
        if (this.ed instanceof MarkdownView) {
            this.lines[idx] = this.lines[idx].replace(toReplace, replacement);
        } else {
            const oldLine = this.ed.getLine(idx);
            const r = oldLine.replace(toReplace, replacement);
            this.ed.replaceRange(r, { line: idx, ch: 0 },
                { line: idx, ch: oldLine.length }, CUSTOM_ORIGIN);
        }
    }

    save() {
        if (this.ed instanceof MarkdownView) {
            this.ed.setViewData(this.lines.join("\n"), false);
            this.ed.save();
        }
    }
}

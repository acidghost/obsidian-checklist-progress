// (c) Copyright 2021, obsidian-checklist-progress Authors.
//
// Licensed under the terms of the GNU GPL License version 3.

import { MarkdownView, Plugin } from "obsidian"

import { debug, info } from "./utils"
import { ChecklistProgressSettingsTab, DEFAULT_SETTINGS, ChecklistProgressSettings } from "./settings"
import { EditorWrapper, CUSTOM_ORIGIN } from "./editor-wrapper"

export default class ChecklistProgressPlugin extends Plugin {

    settings: ChecklistProgressSettings;
    private timeoutHandle: number | null = null;
    private cmEditors: CodeMirror.Editor[] = [];

    async onload() {
        info("loading plugin");

        await this.loadSettings();

        this.addSettingTab(new ChecklistProgressSettingsTab(this.app, this));

        this.addCommand({
            id: "todo-prog-update",
            name: "update",
            checkCallback: (checking: boolean): boolean | void => {
                const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (checking || !mdView) return !!mdView;
                this.updateProgress(mdView);
            }
        });

        if (this.settings.autoUpdateProgress) {
            this.registerOnChanges();
        }
    }

    async onunload() {
        info("unloading plugin");
        this.deregisterOnChanges();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        if (this.settings.autoUpdateProgress) {
            this.registerOnChanges();
        } else {
            this.deregisterOnChanges();
        }
    }

    private registerOnChanges() {
        this.registerCodeMirror((cm) => {
            debug("new CodeMirror", cm);
            this.cmEditors.push(cm);
            cm.on("changes", this.handleChanges);
        });
    }

    private deregisterOnChanges() {
        for (let cm of this.cmEditors) {
            cm.off("changes", this.handleChanges);
        }
    }

    private readonly handleChanges = (
        cm: CodeMirror.Editor,
        changes: CodeMirror.EditorChangeLinkedList[]
    ) => {
        for (let c of changes) {
            if (c.origin === CUSTOM_ORIGIN) {
                return false;
            }
        }
        if (this.timeoutHandle !== null)
            window.clearTimeout(this.timeoutHandle);
        this.timeoutHandle = window.setTimeout(() => {
            this.updateProgress(cm);
        }, 1000);
    }

    private updateProgress(ed: MarkdownView | CodeMirror.Editor) {
        const edW = new EditorWrapper(ed);
        info(`updating progress in ${edW.fileName}`);
        if (edW.linesCount < 2) return;

        let stack: ListProgress[] = [];

        const popReplace = (): ListProgress | undefined => {
            let p = stack.pop();
            if (!p || !p.type || p.count === 0) return p;
            let replacement = p.type === "perc" ?
                `${((p.checked / p.count) * 100).toFixed(0)}%` :
                `${p.checked}/${p.count}`;
            debug(`Replacing '${p.toReplace}' in '${edW.getLine(p.lineIdx)}' with '${replacement}'`)
            edW.replace(p.lineIdx, p.toReplace, `(${replacement})`);
            return p;
        };

        const increment = (checked: boolean) => {
            stack[stack.length - 1].count++;
            if (checked)
                stack[stack.length - 1].checked++;
        };

        let alreadyPushed = false;
        edW.forEach((line, i) => {
            if (line.length == 0) {
                debug("empty line");
                while (popReplace());
                return;
            }

            let m: RegExpMatchArray;
            let indent = 0;

            // Match list items
            if (m = line.match(/^(\s*)[\*\+\-] \[(x| )\] .+/)) {
                indent = m[1].length;
                const checked = m[2] === "x";
                debug(`list item (s=${stack.length}, i=${indent}, c=${checked})`, line);
                if (stack.length > 0) {
                    if (stack[stack.length - 1].indent > indent) {
                        // De-indenting list item
                        while (popReplace()?.indent > indent + 4);
                        increment(checked);
                    } else if (stack[stack.length - 1].indent < indent) {
                        // Indented list item
                        if (alreadyPushed) {
                            increment(checked);
                        } else {
                            stack.push({ indent, count: 1, checked: checked ? 1 : 0 });
                        }
                    } else {
                        // Same indentation
                        increment(checked);
                    }
                } else {
                    stack.push({ indent, count: 1, checked: checked ? 1 : 0 });
                }
            }
            alreadyPushed = false;

            let ty: ProcessingType;
            if (m = line.match(/\([0-9]*%\)/)) {
                ty = "perc";
            } else if (m = line.match(/\([0-9]*\/[0-9]*\)/)) {
                ty = "frac";
            }

            if (ty) {
                debug(`tracking next checklist '${ty}'`);
                stack.push({
                    indent: stack.length == 0 ? 0 : indent + 4,
                    lineIdx: i,
                    type: ty,
                    count: 0,
                    checked: 0,
                    toReplace: m[0]
                });
                alreadyPushed = true;
            }
        });

        while (popReplace());

        edW.save();
    }

}

type ProcessingType = "perc" | "frac";

interface ListProgress {
    indent: number
    count: number
    checked: number
    lineIdx?: number
    type?: ProcessingType
    toReplace?: string
}

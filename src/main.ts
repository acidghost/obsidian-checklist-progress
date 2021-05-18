// (c) Copyright 2021, obsidian-checklist-progress Authors.
//
// Licensed under the terms of the GNU GPL License version 3.

import { MarkdownView, Plugin } from "obsidian"

export default class MyPlugin extends Plugin {

    async onload() {
        info("loading plugin");

        this.addCommand({
            id: "todo-prog-update",
            name: "update",
            checkCallback: (checking: boolean): boolean | void => {
                const mdView = this.app.workspace.getActiveViewOfType(MarkdownView);
                if (checking || !mdView) return !!mdView;
                this.updateProgress(mdView);
            }
        });
    }

    updateProgress(mdv: MarkdownView) {
        info(`updating progress in ${mdv.file.name}`);
        const lines = mdv.getViewData().split("\n");
        if (lines.length < 2) return;

        let stack: ListProgress[] = [];

        const popReplace = (): ListProgress | undefined => {
            let p = stack.pop();
            if (!p || !p.type || p.count === 0) return p;
            let replacement = p.type === "perc" ?
                `${((p.checked / p.count) * 100).toFixed(0)}%` :
                `${p.checked}/${p.count}`;
            lines[p.lineIdx] = lines[p.lineIdx].replace(p.toReplace, `(${replacement})`);
            return p;
        };

        const increment = (checked: boolean) => {
            stack[stack.length - 1].count++;
            if (checked)
                stack[stack.length - 1].checked++;
        };

        let alreadyPushed = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line == "") {
                if (stack.length > 0)
                    while (popReplace());
                continue;
            }

            let m: RegExpMatchArray;
            let indent = 0;

            // Match list items
            if (m = line.match(/^(\s*)[\*\+\-] \[(x| )\] .+/)) {
                indent = m[1].length;
                const checked = m[2] === "x";
                debug(`list item (i=${indent}, c=${checked})`, line);
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
                            stack.push({ indent, count: 0, checked: 0 });
                        }
                    } else {
                        // Same indentation
                        increment(checked);
                    }
                } else {
                    stack.push({ indent, count: 0, checked: 0 });
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
        }

        while (popReplace());

        mdv.setViewData(lines.join("\n"), false);
        mdv.save();
    }

}

function debug(msg: string, ...args: any) { console.debug(`todo-prog: ${msg}`, ...args); }
function info(msg: string, ...args: any) { console.info(`todo-prog: ${msg}`, ...args); }

type ProcessingType = "perc" | "frac";

interface ListProgress {
    indent: number
    count: number
    checked: number
    lineIdx?: number
    type?: ProcessingType
    toReplace?: string
}

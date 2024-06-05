// (c) Copyright 2021, obsidian-checklist-progress Authors.
//
// Licensed under the terms of the GNU GPL License version 3.

import { EditorView, ViewPlugin } from '@codemirror/view';
import type { PluginValue } from '@codemirror/view';

import updateProgress from "./update-progress"

export default function() {
    return ViewPlugin.fromClass(Extension);
};

class Extension implements PluginValue {
    private readonly view: EditorView;

    constructor(view: EditorView) {
        this.view = view;

        this.handleClickEvent = this.handleClickEvent.bind(this);
        this.view.dom.addEventListener("click", this.handleClickEvent);
    }

    public destroy(): void {
        this.view.dom.removeEventListener("click", this.handleClickEvent);
    }

    private handleClickEvent(evt: MouseEvent): boolean {
        const { target } = evt;

        // Only handle checkbox clicks.
        if (!target || !(target instanceof HTMLInputElement) || target.type !== 'checkbox') {
            return false;
        }

        const { state } = this.view;
        const position = this.view.posAtDOM(target);
        const targetLine = state.doc.lineAt(position);

        let idx = 0;
        const lines = [];
        for (const line of state.doc.iterLines()) {
            lines.push({ txt: line, idx, target: targetLine.text == line });
            idx++;
        }

        const cs = updateProgress(lines);

        const tr = state.update({
            changes: cs.map(c => {
                const oldLine = state.doc.line(c.idx + 1);
                const r = oldLine.text.replace(c.toReplace, c.replacement);
                return { from: oldLine.from, to: oldLine.to, insert: r };
            })
        });

        this.view.dispatch(tr);

        return true;
    }
}

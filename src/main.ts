// (c) Copyright 2024, obsidian-checklist-progress Authors.
//
// Licensed under the terms of the GNU GPL License version 3.

import { Editor, Plugin } from "obsidian"
import { Extension } from "@codemirror/state"

import { info } from "./utils"
import { ChecklistProgressSettingsTab, DEFAULT_SETTINGS, ChecklistProgressSettings } from "./settings"
import newExtension from "./extension";
import updateProgress from "./update-progress";

export default class ChecklistProgressPlugin extends Plugin {

    settings: ChecklistProgressSettings;

    private extensions: Extension[] = [];

    async onload() {
        info("loading plugin");

        await this.loadSettings();

        this.addSettingTab(new ChecklistProgressSettingsTab(this.app, this));

        this.addCommand({
            id: "update",
            name: "update",
            editorCallback(ed: Editor) {
                let idx = 0;
                const lines = [];
                for (const line of ed.getValue().split(/\r?\n/)) {
                    lines.push({ txt: line, idx });
                    idx++;
                }
                for (const c of updateProgress(lines)) {
                    const oldLine = ed.getLine(c.idx);
                    const r = oldLine.replace(c.toReplace, c.replacement);
                    ed.replaceRange(r, { line: c.idx, ch: 0 },
                        { line: c.idx, ch: oldLine.length });
                }
            },
        });

        if (this.settings.autoUpdateProgress) {
            this.extensions = [newExtension()];
        }

        this.registerEditorExtension(this.extensions);
    }

    async onunload() {
        info("unloading plugin");
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        if (this.settings.autoUpdateProgress && this.extensions.length == 0) {
            this.extensions.push(newExtension());
            this.app.workspace.updateOptions();
        } else if (!this.settings.autoUpdateProgress && this.extensions.length > 0) {
            this.extensions.pop();
            this.app.workspace.updateOptions();
        }
    }

}

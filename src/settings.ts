// (c) Copyright 2024, obsidian-checklist-progress Authors.
//
// Licensed under the terms of the GNU GPL License version 3.

import { App, PluginSettingTab, Setting } from "obsidian"

import type ChecklistProgressPlugin from "./main"
import { debug } from "./utils";

export interface ChecklistProgressSettings {
    autoUpdateProgress: boolean
}

export const DEFAULT_SETTINGS: ChecklistProgressSettings = {
    autoUpdateProgress: false,
};

export class ChecklistProgressSettingsTab extends PluginSettingTab {
    constructor(app: App, private plugin: ChecklistProgressPlugin) {
        super(app, plugin);
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl)
            .setName("Auto-update progress")
            .setDesc("Automatically updates checklist progress \
                     in editor live preview on every checkbox click.")
            .addToggle((toggle) => toggle
                .setValue(this.plugin.settings.autoUpdateProgress)
                .onChange(async (value) => {
                    debug("auto-update setting", value);
                    this.plugin.settings.autoUpdateProgress = value;
                    await this.plugin.saveSettings();
                }));
    }
}

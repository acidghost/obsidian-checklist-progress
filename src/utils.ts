// (c) Copyright 2021, obsidian-checklist-progress Authors.
//
// Licensed under the terms of the GNU GPL License version 3.

// This is set in rollup.config.js
declare const PROD: boolean;

type LogLevel = number;
const LOG_DEBUG: LogLevel = 0;
const LOG_INFO: LogLevel = 1;

const LOG_PREFIX = "cl-progress";
const LOG_LEVEL: LogLevel = PROD ? LOG_INFO : LOG_DEBUG;
export function debug(msg: string, ...args: any) {
    if (LOG_LEVEL <= LOG_DEBUG) console.debug(`${LOG_PREFIX}: ${msg}`, ...args);
}
export function info(msg: string, ...args: any) {
    if (LOG_LEVEL <= LOG_INFO) console.info(`${LOG_PREFIX}: ${msg}`, ...args);
}

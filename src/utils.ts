// (c) Copyright 2024, obsidian-checklist-progress Authors.
//
// Licensed under the terms of the GNU GPL License version 3.

// This is set in esbuild.config.mjs
declare const PROD: boolean;

type LogLevel = number;
const LOG_DEBUG: LogLevel = 0;
const LOG_INFO: LogLevel = 1;

const LOG_PREFIX = "cl-progress";
const LOG_LEVEL: LogLevel = PROD ? LOG_INFO : LOG_DEBUG;
/* eslint-disable @typescript-eslint/no-explicit-any */
export function debug(msg: string, ...args: any) {
    if (LOG_LEVEL <= LOG_DEBUG) console.debug(`${LOG_PREFIX}: ${msg}`, ...args);
}
export function info(msg: string, ...args: any) {
    if (LOG_LEVEL <= LOG_INFO) console.info(`${LOG_PREFIX}: ${msg}`, ...args);
}
/* eslint-enable @typescript-eslint/no-explicit-any */

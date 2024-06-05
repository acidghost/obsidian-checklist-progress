// (c) Copyright 2021, obsidian-checklist-progress Authors.
//
// Licensed under the terms of the GNU GPL License version 3.

import { debug } from "./utils"

type ProcessingType = "perc" | "frac";

interface Line {
    txt: string
    idx: number
    // Is this line the target of a click event on the live preview checkbox?
    target?: boolean
}

interface Change {
    toReplace: string
    replacement: string
    idx: number
}

interface ListProgress {
    indent: number
    count: number
    checked: number
    idx?: number
    type?: ProcessingType
    rev?: boolean,
    toReplace?: string
}

export default function(lines: Line[]): Change[] {
    if (lines.length < 2) return [];

    const changes: Change[] = [];
    const stack: ListProgress[] = [];

    const popReplace = (): ListProgress | undefined => {
        const p = stack.pop();
        if (!p || !p.type || p.count === 0) return p;

        const num = p.rev ? (p.count - p.checked) : p.checked;
        let replacement = p.type === "perc" ?
            `${((num / p.count) * 100).toFixed(0)}%` :
            `${num}/${p.count}`;

        if (p.rev)
            replacement = "-" + replacement;
        replacement = "(" + replacement + ")";

        if (p.idx === undefined || p.toReplace === undefined)
            throw "line position should be set if type is set";

        changes.push({
            idx: p.idx,
            toReplace: p.toReplace,
            replacement,
        });

        return p;
    };

    const increment = (checked: boolean) => {
        stack[stack.length - 1].count++;
        if (checked)
            stack[stack.length - 1].checked++;
    };

    let alreadyPushed = false;
    lines.forEach(({ txt: line, idx, target: isTarget }) => {
        if (line.length == 0) {
            debug("empty line");
            while (popReplace());
            return;
        }

        let m: RegExpMatchArray | null = null;
        let indent = 0;

        /* eslint-disable no-cond-assign */

        // Match list items
        if (m = line.match(/^(\s*)[*+-] \[([-x ])\] .+/)) {
            indent = m[1].length;
            let checked = m[2] === "x" || m[2] === "-";
            if (isTarget)
                checked = !checked;
            debug(`list item (s=${stack.length}, i=${indent}, c=${checked})`, line);
            if (stack.length > 0) {
                if (stack[stack.length - 1].indent > indent) {
                    // De-indenting list item
                    // @ts-expect-error: undefined is fine
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

        let ty: ProcessingType | null = null;
        if (m = line.match(/\((-)?[0-9]*%\)/)) {
            ty = "perc";
        } else if (m = line.match(/\((-)?[0-9]*\/[0-9]*\)/)) {
            ty = "frac";
        }

        /* eslint-enable no-cond-assign */

        if (ty) {
            debug(`tracking next checklist '${ty}'`);
            if (m === null)
                throw "this should not happen...";
            stack.push({
                indent: stack.length == 0 ? 0 : indent + 4,
                idx,
                type: ty,
                rev: m.length > 1 && !!m[1],
                count: 0,
                checked: 0,
                toReplace: m[0]
            });
            alreadyPushed = true;
        }
    });

    while (popReplace());

    return changes;
}

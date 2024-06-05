# Obsidian Checklist Progress

Simple [Obsidian](https://obsidian.md) plugin to automatically update the progress in a list of
tasks. Given, for example, the following note:

```markdown
This is a list (/):
- [x] item one
- [ ] item two (%)
    - [ ] sub item one
    - [x] sub item two
- [x] item three
```

the command provided by this plugin will update it to

```markdown
This is a list (2/3):
- [x] item one
- [ ] item two (50%)
    - [ ] sub item one
    - [x] sub item two
- [x] item three
```

providing the fraction / percentage of completed tasks in a sub-list.

Besides using a command to trigger the update (which you can bind to a keyboard
shortcut), you can also enable auto-updating when toggling a checkbox in
Obsidian Live Preview mode.

Additionally, adding a minus before the fraction or percentage symbol will count
*unchecked* checkboxes. Example:

```markdown
This is a list (-/):
- [x] item one
- [ ] item two
- [x] item three
```

will be updated to

```markdown
This is a list (-1/3):
- [x] item one
- [ ] item two
- [x] item three
```

## Inspiration

This is supposed to mimic a similar feature from [Emacs's Org Mode](https://orgmode.org/manual/Checkboxes.html).

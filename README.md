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

providing the fraction / percentace of completed tasks in a sub-list.

This is supposed to mimic the similar feature from [Emacs's Org Mode](https://orgmode.org/).

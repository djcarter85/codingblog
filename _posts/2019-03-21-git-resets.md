---
title: Git Resets
summary: What happens when you do a reset in Git?
---

I had a conversation with a colleague today about the `git reset` command.

I realised that while I use `git reset --hard` reasonably regularly (e.g. in
order to move a branch when I've committed on the wrong one), I didn't know much
about the `--mixed` or `--soft` modes.

[The documentation on each of them](https://git-scm.com/docs/git-reset) is a
little vague, so I thought I'd just try them out and see what happens. I hope
this will serve as a useful reference.

Suppose I create a repository which looks as follows.

|Initial Commit|Commit A|Commit B|Staged|Unstaged|
|---|---|---|---|---|
|<i class="fas fa-plus-square"></i>  `A1.txt`<br/><i class="fas fa-plus-square"></i>  `A2.txt`<br/><i class="fas fa-plus-square"></i>  `B1.txt`<br/><i class="fas fa-plus-square"></i>  `B2.txt`<br/><i class="fas fa-plus-square"></i>  `C1.txt`<br/><i class="fas fa-plus-square"></i>  `C2.txt`<br/><i class="fas fa-plus-square"></i>  `D1.txt`<br/><i class="fas fa-plus-square"></i>  `D2.txt`|<i class="fas fa-minus-square"></i> `A1.txt`<br/><i class="fas fa-pen-square"></i>  `A2.txt`<br/><i class="fas fa-plus-square"></i> `A3.txt`|<i class="fas fa-minus-square"></i> `B1.txt`<br/><i class="fas fa-pen-square"></i> `B2.txt`<br/><i class="fas fa-plus-square"></i> `B3.txt`|<i class="fas fa-minus-square"></i> `C1.txt`<br/><i class="fas fa-pen-square"></i>  `C2.txt`<br/><i class="fas fa-plus-square"></i> `C3.txt`|<i class="fas fa-minus-square"></i> `D1.txt`<br/><i class="fas fa-pen-square"></i>  `D2.txt`<br/><i class="fas fa-plus-square"></i> `D3.txt`|

(Hopefully it's clear what I mean by each of these icons.)

Here's the result of performing different types of resets.

||Commit A|Commit B|Staged|Unstaged|
|---|---|---|---|---|
|Soft, commit B|<i class="fas fa-minus-square"></i> `A1.txt`<br/><i class="fas fa-pen-square"></i>  `A2.txt`<br/><i class="fas fa-plus-square"></i> `A3.txt`|<i class="fas fa-minus-square"></i> `B1.txt`<br/><i class="fas fa-pen-square"></i> `B2.txt`<br/><i class="fas fa-plus-square"></i> `B3.txt`|<i class="fas fa-minus-square"></i> `C1.txt`<br/><i class="fas fa-pen-square"></i>  `C2.txt`<br/><i class="fas fa-plus-square"></i> `C3.txt`|<i class="fas fa-minus-square"></i> `D1.txt`<br/><i class="fas fa-pen-square"></i>  `D2.txt`<br/><i class="fas fa-plus-square"></i> `D3.txt`|
|Mixed, commit B|<i class="fas fa-minus-square"></i> `A1.txt`<br/><i class="fas fa-pen-square"></i>  `A2.txt`<br/><i class="fas fa-plus-square"></i> `A3.txt`|<i class="fas fa-minus-square"></i> `B1.txt`<br/><i class="fas fa-pen-square"></i> `B2.txt`<br/><i class="fas fa-plus-square"></i> `B3.txt`||<i class="fas fa-minus-square"></i> `C1.txt`<br/><i class="fas fa-pen-square"></i>  `C2.txt`<br/><i class="fas fa-plus-square"></i> `C3.txt`<br/><i class="fas fa-minus-square"></i> `D1.txt`<br/><i class="fas fa-pen-square"></i>  `D2.txt`<br/><i class="fas fa-plus-square"></i> `D3.txt`|
|Hard, commit B|<i class="fas fa-minus-square"></i> `A1.txt`<br/><i class="fas fa-pen-square"></i>  `A2.txt`<br/><i class="fas fa-plus-square"></i> `A3.txt`|<i class="fas fa-minus-square"></i> `B1.txt`<br/><i class="fas fa-pen-square"></i> `B2.txt`<br/><i class="fas fa-plus-square"></i> `B3.txt`||<i class="fas fa-plus-square"></i> `D3.txt`|
|Soft, commit A|<i class="fas fa-minus-square"></i> `A1.txt`<br/><i class="fas fa-pen-square"></i>  `A2.txt`<br/><i class="fas fa-plus-square"></i> `A3.txt`|N/A|<i class="fas fa-minus-square"></i> `B1.txt`<br/><i class="fas fa-pen-square"></i> `B2.txt`<br/><i class="fas fa-plus-square"></i> `B3.txt`<br/><i class="fas fa-minus-square"></i> `C1.txt`<br/><i class="fas fa-pen-square"></i>  `C2.txt`<br/><i class="fas fa-plus-square"></i> `C3.txt`|<i class="fas fa-minus-square"></i> `D1.txt`<br/><i class="fas fa-pen-square"></i>  `D2.txt`<br/><i class="fas fa-plus-square"></i> `D3.txt`|
|Mixed, commit A|<i class="fas fa-minus-square"></i> `A1.txt`<br/><i class="fas fa-pen-square"></i>  `A2.txt`<br/><i class="fas fa-plus-square"></i> `A3.txt`|N/A||<i class="fas fa-minus-square"></i> `B1.txt`<br/><i class="fas fa-pen-square"></i> `B2.txt`<br/><i class="fas fa-plus-square"></i> `B3.txt`<br/><i class="fas fa-minus-square"></i> `C1.txt`<br/><i class="fas fa-pen-square"></i>  `C2.txt`<br/><i class="fas fa-plus-square"></i> `C3.txt`<br/><i class="fas fa-minus-square"></i> `D1.txt`<br/><i class="fas fa-pen-square"></i>  `D2.txt`<br/><i class="fas fa-plus-square"></i> `D3.txt`|
|Hard, commit A|<i class="fas fa-minus-square"></i> `A1.txt`<br/><i class="fas fa-pen-square"></i>  `A2.txt`<br/><i class="fas fa-plus-square"></i> `A3.txt`|N/A||<i class="fas fa-plus-square"></i> `D3.txt`|

The thing that surprised me most about this is what happens when you do a hard
reset. Because the index only contains tracked files, the unstaged addition of
`D3.txt` remains after the hard reset. Personally I think it would make more
sense for Git to remove this file, but that's not what happens!
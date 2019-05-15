---
title: When Git merges go rogue
summary: How do you resolve a merge conflict in Git?
---

Most of the time, merging in Git is pretty simple. The files changed on either side of the merge are different, or the lines that have been changed are far enough away from each other that it's obvious to what the result should be.

However, eventually all Git users come up against **merge conflicts**. This is when Git cannot automatically create the merge commit because the same line in the same file was changed in different ways since the last common commit between the two branches.

Here's the simplest Git history where this situation can arise.

![Git history](/assets/images/2019-05-05-when-git-merges-go-rogue/git-history.png)

Commits B1 and B2 change the same line in the same file. If you try to merge branch 2 into branch 1, you'll get a merge conflict.

Let's have a look at a couple of situations where this could happen, and then I'll explain the general principle before resolving the conflicts in the two examples.

## To-do list

I keep my to-do list in source control (don't ask me why).

It's a simple text file with a list of things I need to do, and the order doesn't matter (I live a very relaxed life with no deadlines).

##### Commit A
```
Shopping
Clean toilets
Write blog post
Email Dad
```

##### Commit B1
```
Shopping
Take bins out
Clean toilets
Write blog post
Email Dad
```

##### Commit B2
```
Shopping
Water plants
Clean toilets
Write blog post
Email Dad
```

Commit B1 adds "Take bins out" and commit B2 adds "Water plants", but crucially they're both added at the same line.

Conflict!

## Windows Forms app

I have a class in a Windows Forms application which helps me pop up messages to the user.

##### Commit A
```c#
public static class ErrorHelper
{
    public static void ShowErrorMessage(string errorMessage)
    {
        ShowMessage("Error: " + errorMessage);
    }

    private static void ShowMessage(string message)
    {
        System.Windows.Forms.MessageBox.Show(message);
    }
}
```

##### Commit B1
```c#
public static class ErrorHelper
{
    public static void ShowErrorMessage(string errorMessage)
    {
        ShowMessage($"Error: {errorMessage}");
    }

    private static void ShowMessage(string message)
    {
        System.Windows.Forms.MessageBox.Show(message);
    }
}
```

##### Commit B2
```c#
public static class ErrorHelper
{
    public static void ShowErrorMessage(string errorMessage)
    {
        ShowMessageBox("Error: " + errorMessage);
    }

    private static void ShowMessageBox(string message)
    {
        System.Windows.Forms.MessageBox.Show(message);
    }
}
```

Commit B1 refactors to use an interpolated string; commit B2 renames a method. Both changes are on line 5.

Conflict!

## How to resolve merge conflicts

When you make a change to a file, you know the **semantics** of the change; that is, **what the change meant**.

When you commit, Git records the **syntax** of the change; that is, **which lines were changed and how**.

This helps us to sketch out a plan for fixing merge conflicts. We need to work out, in the following order:

1. The syntax of the two changes
2. The semantics of the two changes
3. The desired semantics of the resultant change
4. The desired syntax of the resultant change

Git works with files that could **mean** anything: source code in any programming language, software documentation, legal documents, personal notes, and so on. Because of this, steps 2 and 3 require human intervention. What happens in step 2 will depend on what sort of document you are looking at; that is, what the document **means**.

Let's apply this to our two examples.

## To-do list

Applying the general principle:

<table>
  <thead>
    <tr>
      <th>Step</th>
      <th>Commit B1</th>
      <th>Commit B2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1. Syntax</td>
      <td>Add “Take bins out” at line 2</td>
      <td>Add “Water plants” at line 2</td>
    </tr>
    <tr>
      <td>2. Semantics</td>
      <td>Add “Take bins out” to the list</td>
      <td>Add “Water plants” to the list</td>
    </tr>
    <tr>
      <td>3. Resultant semantics</td>
      <td colspan="2">Add “Take bins out” and “Water plants” to the list</td>
    </tr>
    <tr>
      <td>4. Resultant syntax</td>
      <td colspan="2">Add “Take bins out” at line 2 and “Water plants” at line 3</td>
    </tr>
  </tbody>
</table>

The key here is that the order doesn't matter; the document means an unordered list of tasks.

Note that the resultant syntax change could have been to add the new tasks at any point in the file, because the order doesn't matter. It's usually normal to add the changes at the same line to keep the history looking neat.

##### Merge commit
```
Shopping
Take bins out
Water plants
Clean toilets
Write blog post
Email Dad
```

## Windows Forms app

Applying the general principle again:

<table>
  <thead>
    <tr>
      <th>Step</th>
      <th>Commit B1</th>
      <th>Commit B2</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1. Syntax</td>
      <td>Change line 5 to <code class="highlighter-rouge">ShowMessage($"Error: {errorMessage}");</code></td>
      <td>Change line 5 to <code class="highlighter-rouge">ShowMessageBox("Error: " + errorMessage);</code></td>
    </tr>
    <tr>
      <td>2. Semantics</td>
      <td>Refactor the string addition to a string interpolation</td>
      <td>Change the name of the called method</td>
    </tr>
    <tr>
      <td>3. Resultant semantics</td>
      <td colspan="2">Refactor the string addition to a string interpolation and change the name of the called method</td>
    </tr>
    <tr>
      <td>4. Resultant syntax</td>
      <td colspan="2">Change line 5 to <code class="highlighter-rouge">ShowMessageBox($"Error: {errorMessage}");</code></td>
    </tr>
  </tbody>
</table>

Because I know this is a C# source document, I am able to work out the meaning of each of the changes.

##### Merge commit
```c#
public static class ErrorHelper
{
    public static void ShowErrorMessage(string errorMessage)
    {
        ShowMessageBox($"Error: {errorMessage}");
    }

    private static void ShowMessageBox(string message)
    {
        System.Windows.Forms.MessageBox.Show(message);
    }
}
```

## Summary

Often you'll be able to see what the desired resultant change is pretty quickly, especially with a bit of experience. It's when you're dealing with a particularly complicated merge conflict that the steps I've outlined here can be especially useful.
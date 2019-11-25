---
title: Drag-and-drop in Windows Forms is as easy as 1-2-3 (and maybe 4)
summary: How to support drag-and-drop in Windows Forms.
---

Last week I was writing a Windows Forms application that needed to process data that had been dragged onto it.

This sent me down a (small) rabbit hole.
Supporting drag and drop was not quite as straightforward as I initially thought!

Here's how to do it, broken down into a few manageable steps.

## 1. Set `AllowDrop` to `true`

Set the `AllowDrop` property to `true` on the control which data can be dragged onto.
If you don't do this, then the events detailed below won't fire.

This may be the whole form, or perhaps a label saying "drop here".

## 2. Handle `DragEnter`

The `DragEnter` event fires when data is dragged over the control in question.
That is, the mouse enters the control's bounds while the left button is pressed and the user is dragging something.

This event uses `DragEventArgs`, which has the property `AllowedEffect`. This is a flags enum containing all the different "effects" ([Link, Copy, Move](https://docs.microsoft.com/en-us/dotnet/api/system.windows.forms.dragdropeffects?view=netframework-4.8)) allowed by the source of the drag.
For example, if you drag a file from Windows File Explorer, you're allowed to link or copy but not move.

In the event handler, you need to set the value of `DragEventArgs.Effect` to one of the allowed values. This does two things:

- Changes the cursor to provide a visual cue to the user that drag-and-drop is possible (the default is a "no entry" cursor to indicate that drag-and-drop is not supported). The exact cursor used depends on which value you choose.
- Sets up the `DragDrop` event to fire if/when the user releases the left mouse button (see below).

If you want to make a bigger visual change than just the cursor (e.g. change the appearance of the control), then you should also do that in the `DragEnter` event handler.

## 3. Handle `DragDrop`

The `DragDrop` event fires when the user releases the mouse to drop data onto the control.

The data that has been dragged can be found in `DragEventArgs.Data`.
This is an `IDataObject`, which contains the data in a number of "formats".
The exact formats used will depend on where the data was dragged from, so when developing there's a bit of trial and error to see which formats are appropriate for you to use.

Some helpful methods on `IDataObject`:

- `GetFormats()`: this returns a `string[]`, each item of which is the name of a format the data can be provided in.
- `GetData(string format)`: this returns the data in the specified format. Because this method returns `object`, you'll have to cast it before using it. If `format` is not recognised, it returns `null`.
- `GetDataPresent(string format)`: this returns a `bool` indicating whether the data is present in the specified format. This method could be used in the `DragEnter` event handler to determine whether to enable drag-and-drop at all.

As an example, one of the formats when dragging data from Windows File Explorer was `"FileName"`. If you call `GetData("FileName")` then you get a `string[]` containing the full paths of the files being dragged.

Once you have the data you want you can then do whatever you like.
For example, my application reads in the file, transforms it, and puts the result in a text box.

This event also uses `DragEventArgs`, and it uses the same instance as the one provided in `DragEnter`, meaning you can inspect the value you chose for `Effect` if you need to.

## 4. Handle `DragLeave` (maybe)

The `DragLeave` event fires when the mouse leave the bounds of the control and the user is still dragging the item.

Handling this event is only necessary if you need to tidy up from the `DragEnter` event; perhaps you need to reset some visuals to indicate that releasing the mouse won't complete the drag-and-drop operation.

## Example

The following example shows you how to accept files dragged from File Explorer.
It captures a file dragged onto `dragDropLabel` and displays the file contents in `outputTextBox`.

```c#
using System.Linq;
using System.Windows.Forms;

private void dragDropLabel_DragEnter(object sender, DragEventArgs e)
{
    if (e.AllowedEffect.HasFlag(DragDropEffects.Copy) &&
        e.Data.GetData("FileName") is string[] fileNames &&
        fileNames.Any())
    {
        e.Effect = DragDropEffects.Copy;
    }
}

private void dragDropLabel_DragDrop(object sender, DragEventArgs e)
{
    var fileNames = (string[])e.Data.GetData("FileName");
    var fileName = fileNames[0];

    this.outputTextBox.Text = File.ReadAllText(fileName);
}
```

## Appendix: exploring `DragEventArgs.Data`

While developing, the following snippet was useful for discovering what formats were supported by `DragEventArgs.Data` and exactly how the data looked.

```c#
foreach (var format in e.Data.GetFormats())
{
    var data = e.Data.GetData(format);

    string text;
    if (data is MemoryStream ms)
    {
        using (var sr = new StreamReader(ms))
        {
            text = sr.ReadToEnd();
        }
    }
    else
    {
        text = data?.ToString();
    }

    System.Diagnostics.Debug.WriteLine($"{format}:{text}");
}
```
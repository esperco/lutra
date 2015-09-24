/** This module contains all the widgets that are inserted directly
 *  after the messages of a thread. It is for parts of the UI that need
 *  to be integrated into the assistant's main flow.
 */

/// <reference path="../marten/ts/JQStore.ts" />

module Esper.InThreadControls {
  export function getContainer() {
    var jQ = $(".esper-in-thread-controls")
    if (jQ.length === 0) {
'''
<div #controls class="esper-in-thread-controls esper">
  <div class="esper-in-thread-control esper-compose-hashtags-container" />
  <div class="esper-in-thread-control esper-task-notes-container" />
  <div class="esper-in-thread-control esper-event-control-container" />
</div>
'''
      Gmail.threadMessages().after(controls);
      return controls;
    }
    // Already exists, use this
    return jQ;
  }

  // Stick all event controls in here -- DON'T APPEND THINGS IN HERE. Use
  // setEventControlContainer to empty out existing things first.
  export function getEventControlContainer() {
    return getContainer().find('.esper-event-control-container');
  }

  // Update the event control container -- this empties the container first
  // to prevent infinite appending of random event controls
  export function setEventControlContainer(view: JQuery) {
    return getEventControlContainer()
      .empty()
      .append(view);
  }

  // Stick the hash-tag / ask an exec thing in here -- DON'T APPEND THINGS IN
  // here. Use setHashTagContainer to empty out existing things first
  export function getHashTagContainer() {
    return getContainer().find('.esper-compose-hashtags-container');
  }

  // Update the hash tag container after emptying first
  export function setHashTagContainer(view: JQuery) {
    return getHashTagContainer()
      .empty()
      .append(view);
  }

  // Get the task notes container
  export function getTaskNotesContainer() {
    return getContainer().find('.esper-task-notes-container');
  }

  // Adds Task Notes UI, but only if it's not already present
  export function insertTaskNotes() {
    var elm = getTaskNotesContainer().filter(":empty");
    if (elm.length > 0) {
      elm.append(taskNotes());
    }
  }

  // Insert task notes
  CurrentThread.currentTeam.watch(function (team, valid) {
    if (valid && team.isSome()) {
      insertTaskNotes();
    } else {
      removeControls();
    }
  });

  // Remove any old instances of the controls:
  function removeControls () {
    $(".esper-in-thread-controls").remove();
  }

  // Return a specific after-control
  function update(view) {

  }

  // Reference to the current task note elements
  var taskNoteElms = {
    textarea: new JQStore(),
    status: new JQStore(),
    button: new JQStore()
  };

  // Watcher for whether we're in the middle of saving task notes
  var savingTaskNotes = new Watchable.C<boolean>(
    function() { return true; }, false
  );

  savingTaskNotes.watch(function(saving) {
    if (saving) {
      taskNoteElms.status.get().html("Saving &hellip;")
      taskNoteElms.button.get().prop("disabled", true);
    } else {
      taskNoteElms.status.get().html("");
    }
  });

  // The id for the notes watcher so that only one exists at a time.
  var notesWatcherId;

  function taskNotes() {
'''
<div #container class="esper esper-section">
  <div class="esper-section-header esper-clearfix esper-open">
    <span class="esper-bold" style="float:left">Task Notes</span>
  </div>
  <div #editorContainer class="esper-section-notes">
    <div #taskNotes rows=5 disabled
          placeholder="Leave some brief notes about the task here"
          class="esper-text-notes">
    </div>
  </div>
  <div class="esper-section-footer esper-clearfix">
    <div #toolbar class="toolbar-container">
      <span class="ql-format-group">
        <select title="Font" class="ql-font">
          <option value="sans-serif" selected>Sans Serif</option>
          <option value="serif">Serif</option>
          <option value="monospace">Monospace</option>
        </select>
        <select title="Size" class="ql-size">
          <option value="10px">Small</option>
          <option value="13px" selected>Normal</option>
          <option value="18px">Large</option>
          <option value="32px">Huge</option>
        </select>
      </span>
      <span class="ql-format-group">
        <span title="Bold" class="ql-format-button ql-bold"></span>
        <span class="ql-format-separator"></span>
        <span title="Italic" class="ql-format-button ql-italic"></span>
        <span class="ql-format-separator"></span>
        <span title="Underline" class="ql-format-button ql-underline"></span>
      </span>
      <span class="ql-format-group">
        <select title="Text Color" class="ql-color">
          <option value="rgb(0, 0, 0)" selected></option>
          <option value="rgb(230, 0, 0)"></option>
          <option value="rgb(255, 153, 0)"></option>
          <option value="rgb(255, 255, 0)"></option>
          <option value="rgb(0, 138, 0)"></option>
          <option value="rgb(0, 102, 204)"></option>
          <option value="rgb(153, 51, 255)"></option>
          <option value="rgb(255, 255, 255)"></option>
          <option value="rgb(250, 204, 204)"></option>
          <option value="rgb(255, 235, 204)"></option>
          <option value="rgb(255, 255, 204)"></option>
          <option value="rgb(204, 232, 204)"></option>
          <option value="rgb(204, 224, 245)"></option>
          <option value="rgb(235, 214, 255)"></option>
          <option value="rgb(187, 187, 187)"></option>
          <option value="rgb(240, 102, 102)"></option>
          <option value="rgb(255, 194, 102)"></option>
          <option value="rgb(255, 255, 102)"></option>
          <option value="rgb(102, 185, 102)"></option>
          <option value="rgb(102, 163, 224)"></option>
          <option value="rgb(194, 133, 255)"></option>
          <option value="rgb(136, 136, 136)"></option>
          <option value="rgb(161, 0, 0)"></option>
          <option value="rgb(178, 107, 0)"></option>
          <option value="rgb(178, 178, 0)"></option>
          <option value="rgb(0, 97, 0)"></option>
          <option value="rgb(0, 71, 178)"></option>
          <option value="rgb(107, 36, 178)"></option>
          <option value="rgb(68, 68, 68)"></option>
          <option value="rgb(92, 0, 0)"></option>
          <option value="rgb(102, 61, 0)"></option>
          <option value="rgb(102, 102, 0)"></option>
          <option value="rgb(0, 55, 0)"></option>
          <option value="rgb(0, 41, 102)"></option>
          <option value="rgb(61, 20, 102)"></option>
        </select>
        <span class="ql-format-separator"></span>
        <select title="Background Color" class="ql-background">
          <option value="rgb(0, 0, 0)"></option>
          <option value="rgb(230, 0, 0)"></option>
          <option value="rgb(255, 153, 0)"></option>
          <option value="rgb(255, 255, 0)"></option>
          <option value="rgb(0, 138, 0)"></option>
          <option value="rgb(0, 102, 204)"></option>
          <option value="rgb(153, 51, 255)"></option>
          <option value="rgb(255, 255, 255)" selected></option>
          <option value="rgb(250, 204, 204)"></option>
          <option value="rgb(255, 235, 204)"></option>
          <option value="rgb(255, 255, 204)"></option>
          <option value="rgb(204, 232, 204)"></option>
          <option value="rgb(204, 224, 245)"></option>
          <option value="rgb(235, 214, 255)"></option>
          <option value="rgb(187, 187, 187)"></option>
          <option value="rgb(240, 102, 102)"></option>
          <option value="rgb(255, 194, 102)"></option>
          <option value="rgb(255, 255, 102)"></option>
          <option value="rgb(102, 185, 102)"></option>
          <option value="rgb(102, 163, 224)"></option>
          <option value="rgb(194, 133, 255)"></option>
          <option value="rgb(136, 136, 136)"></option>
          <option value="rgb(161, 0, 0)"></option>
          <option value="rgb(178, 107, 0)"></option>
          <option value="rgb(178, 178, 0)"></option>
          <option value="rgb(0, 97, 0)"></option>
          <option value="rgb(0, 71, 178)"></option>
          <option value="rgb(107, 36, 178)"></option>
          <option value="rgb(68, 68, 68)"></option>
          <option value="rgb(92, 0, 0)"></option>
          <option value="rgb(102, 61, 0)"></option>
          <option value="rgb(102, 102, 0)"></option>
          <option value="rgb(0, 55, 0)"></option>
          <option value="rgb(0, 41, 102)"></option>
          <option value="rgb(61, 20, 102)"></option>
        </select>
        <span class="ql-format-separator"></span>
        <select title="Text Alignment" class="ql-align">
          <option value="left" selected></option>
          <option value="center"></option>
          <option value="right"></option>
          <option value="justify"></option>
        </select>
      </span>
      <span class="ql-format-group">
        <span title="Link" class="ql-format-button ql-link"></span>
        <span class="ql-format-separator"></span>
        <span title="Image" class="ql-format-button ql-image"></span>
        <span class="ql-format-separator"></span>
        <span title="List" class="ql-format-button ql-list"></span>
        <span class="ql-format-separator"></span>
        <button #saveTaskNotes disabled
        class="esper-btn esper-btn-primary esper-save-notes" >
        Save
        </button>
      </span>
    </div>
  </div>
  <span #saveStatus class="esper-save-status" />
</div>
'''
    taskNoteElms.button.set(saveTaskNotes);
    taskNoteElms.status.set(saveStatus);
    taskNoteElms.textarea.set(taskNotes);

    var editor = new quill(taskNotes.get(0), {
      modules: {
        'toolbar': {
          container: toolbar.get(0)
        },
        'link-tooltip': true,
        'image-tooltip': true
      },
      styles: false,
      theme: 'snow'
    });

    //notes is Old style plaintext notes
    //notesQuill is new rich text editor (Quilljs) style
    var notes = "";
    var notesQuill = "";

    notesWatcherId = CurrentThread.task.watch(function (task, valid, oldTask) {
      taskNotes.prop("disabled", false);
      if (savingTaskNotes.get()) {     // In the middle of saving, don't set
        return;
      }
      if (valid && task !== oldTask) {
        notes = task.task_notes || ""; // "" if task_notes is undefined
        notesQuill = task.task_notes_quill || "";
      } else {
        notes = "";
        notesQuill = "";
      }

      if (notesQuill !== "") {
        editor.setContents(JSON.parse(notesQuill));
      } else {
        editor.setText(notes);
      }
    }, notesWatcherId);

    editor.on('text-change', function(delta, source) {
      if (source === 'api') {
        return;
      }
      //console.log(JSON.stringify(editor.getContents()));
      taskNotesKeyup(notes);
    });

    enableHighlightToTaskNotes(editor, saveTaskNotes);

    function taskNotesKeyup(notes) {
      if (editor.getHTML() === notes || 
          JSON.stringify(editor.getContents()) === notesQuill) 
      {
        saveTaskNotes.prop("disabled", true);
      } else {
        saveTaskNotes.prop("disabled", false);
      }
    }

    saveTaskNotes.click(function() {
      CurrentThread.currentTeam.get().match({
        some : function (team) {
          savingTaskNotes.set(true);
          var notes = JSON.stringify(editor.getContents());
          var threadId = CurrentThread.threadId.get();
          CurrentThread.getTaskForThread()
            .done(function(task) {
              Api.setTaskNotesQuill(task.taskid, notes).done(function() {
                savingTaskNotes.set(false);
                saveTaskNotes.prop("disabled", true);
              });
            });
        },
        none : function () {
          return;
        }
      });
    });

    return container;
  }

  /* Pop up a button when selecting text inside Gmail messages,
   * which copies the selection into the task notes box when clicked.
   */
  function enableHighlightToTaskNotes(taskNotes : any,
                                      saveTaskNotes : JQuery) : void {
    var container = Gmail.threadContainer();
    var target = Gmail.messageTextSelector;

    container.off("mouseup", target);
    container.mousedown(function() {
      $(".esper-selection-action").remove();
    });
    /* We need to use on() here, because we want this action to occur even for
     * messages that are inserted into the DOM after we bind this handler,
     * like when the user expands out the thread.
     */
    container.on("mouseup", target, function(e) {
      function afterSelectionActuallyModified() {
        var selection = window.getSelection();
        if (selection && !selection.isCollapsed) {
          var text = selection.toString();
          var actionDiv = $("<div class='esper-selection-action'/>");
          actionDiv.css({
            left: e.pageX + 10,
            top: e.pageY + 10,
            position: "absolute"
          });
          var button = $("<button class='esper-btn esper-btn-primary'/>");
          button.text("Copy selection to task notes");
          button.click(function() {
            var curNotes = taskNotes.getHTML();
            var nl = "";
            if (curNotes === "<div><br></div>") { //ie. empty task notes
              taskNotes.setHTML(text);
            } else {
              taskNotes.setHTML(curNotes + text);
            }
            saveTaskNotes.prop("disabled", false);
            saveTaskNotes.trigger("click");
            actionDiv.remove();
          });
          actionDiv.append(button);
          $("body").append(actionDiv);
        }
      }
      /* Without this, window.getSelection() will still return the previous
       * selection if we click on the selected text.
       */
      window.setTimeout(afterSelectionActuallyModified, 1);
    });
  }
}

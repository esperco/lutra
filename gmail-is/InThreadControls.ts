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
<div #controls class="esper-in-thread-controls">
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

  // Adds Task Notes UI, replaces existing UI if any
  export function refreshTaskNotes() {
    return getTaskNotesContainer()
      .empty()
      .append(taskNotes());
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
<div #container class="esper-section">
  <div class="esper-section-header esper-clearfix esper-open">
    <span class="esper-bold" style="float:left">Task Notes</span>
  </div>
  <div class="esper-section-notes">
    <textarea #taskNotes rows=5 disabled
          placeholder="Leave some brief notes about the task here"
          class="esper-text-notes" >
        Loading &hellip;
    </textarea>
  </div>
  <div class="esper-section-footer esper-clearfix">
    <span #saveStatus class="esper-save-status" />
    <button #saveTaskNotes disabled
            class="esper-btn esper-btn-primary esper-save-notes">
      Save
    </button>
  </div>
</div>
'''
    taskNoteElms.button.set(saveTaskNotes);
    taskNoteElms.status.set(saveStatus);
    taskNoteElms.textarea.set(taskNotes);

    var notes = "";

    notesWatcherId = CurrentThread.task.watch(function (task, valid, oldTask) {
      taskNotes.prop("disabled", false);
      if (savingTaskNotes.get()) {     // In the middle of saving, don't set
        return;
      }
      if (valid && task !== oldTask) {
        notes = task.task_notes || ""; // "" if task_notes is undefined
      } else {
        notes = "";
      }
      taskNotes.val(notes);
    }, notesWatcherId);

    taskNotes.keyup(function() {
      taskNotesKeyup(notes);
    });

    enableHighlightToTaskNotes(taskNotes, saveTaskNotes);

    function taskNotesKeyup(notes) {
      if (taskNotes.val() === notes) {
        saveTaskNotes.prop("disabled", true);
      } else {
        saveTaskNotes.prop("disabled", false);
      }
    }

    saveTaskNotes.click(function() {
      CurrentThread.currentTeam.get().match({
        some : function (team) {
          savingTaskNotes.set(true);
          var notes = taskNotes.val();
          var threadId = CurrentThread.threadId.get();
          CurrentThread.getTaskForThread()
            .done(function(task) {
              Api.setTaskNotes(task.taskid, notes).done(function() {
                savingTaskNotes.set(false);
                saveTaskNotes.prop("disabled", true);
                taskNotes.keyup(function() {taskNotesKeyup(notes);});
              });
            });
        },
        none : function () {
          return;
        }
      });
    });

    var resizeTextarea = function(el) {
        var offset = el.offsetHeight - el.clientHeight;
        $(el).css('height', 'auto').css('height', el.scrollHeight + offset);
    };
    taskNotes.on('keyup input click', function() { resizeTextarea(this); });

    return container;
  }

  /* Pop up a button when selecting text inside Gmail messages,
   * which copies the selection into the task notes box when clicked.
   */
  function enableHighlightToTaskNotes(taskNotes : JQuery,
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
            var curNotes = taskNotes.val();
            var nl = "";
            if (curNotes.length > 0 && curNotes.slice(-1) !== "\n") nl = "\n";
            taskNotes.val(curNotes + nl + text);
            saveTaskNotes.prop("disabled", false);
            saveTaskNotes.trigger("click");
            actionDiv.remove();

            taskNotes.trigger('keyup');
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

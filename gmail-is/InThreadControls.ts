/** This module contains all the widgets that are inserted directly
 *  after the messages of a thread. It is for parts of the UI that need
 *  to be integrated into the assistant's main flow.
 */
module Esper.InThreadControls {
  export function getContainer() {
    var jQ = $(".esper-in-thread-controls")
    if (jQ.length === 0) {
'''
<div #controls class="esper-in-thread-controls">
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

  // Get the task notes container
  export function getTaskNotesContainer() {
    return getContainer().find('.esper-task-notes-container');
  }

  export function refreshTaskNotes() {
    return getTaskNotesContainer()
      .empty()
      .append(taskNotes());
  }

  CurrentThread.currentTeam.watch(function () {
    if (CurrentThread.currentTeam.isValid() &&
        CurrentThread.currentTeam.get().isSome()) {
      refreshTaskNotes();
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

  // The id for the notes watcher so that only one exists at a time.
  var notesWatcherId;

  function taskNotes() {
'''
<div #container class="esper-section">
  <div class="esper-section-header esper-clearfix esper-open">
    <span class="esper-bold" style="float:left">Task Notes</span>
  </div>
  <div class="esper-section-notes">
    <textarea #taskNotes rows=5
          placeholder="Leave some brief notes about the task here"
          class="esper-text-notes"/>
  </div>
  <div class="esper-section-footer esper-clearfix">
    <div #saveTaskNotes class="esper-save-notes esper-save-disabled">
      Save
    </div>
  </div>
</div>
'''
    var notes = "";

    notesWatcherId = CurrentThread.task.watch(function (task, valid, oldTask) {
      if (valid && task != oldTask) {
        notes = task.task_notes || ""; // "" if task.task_notes is undefined
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
        saveTaskNotes.addClass("esper-save-disabled");
        saveTaskNotes.removeClass("esper-save-enabled");
        saveTaskNotes.removeClass("esper-clickable");
      } else {
        saveTaskNotes.addClass("esper-clickable");
        saveTaskNotes.addClass("esper-save-enabled");
        saveTaskNotes.removeClass("esper-save-disabled");
      }
    }

    saveTaskNotes.click(function() {
      CurrentThread.currentTeam.get().match({
        some : function (team) {
          if (saveTaskNotes.hasClass("esper-save-enabled")) {
            var notes = taskNotes.val();
            var threadId = CurrentThread.threadId.get();
            Api.getTaskForThread(team.teamid, threadId, false, true)
              .done(function(task) {
                Api.setTaskNotes(task.taskid, notes).done(function() {
                  saveTaskNotes.addClass("esper-save-disabled");
                  saveTaskNotes.removeClass("esper-save-enabled");
                  saveTaskNotes.removeClass("esper-clickable");
                  taskNotes.keyup(function() {taskNotesKeyup(notes);});
                });
              });
          }
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
            saveTaskNotes.addClass("esper-save-enabled");
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

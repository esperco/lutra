/** This module contains all the widgets that are inserted directly
 *  after the messages of a thread. It is for parts of the UI that need
 *  to be integrated into the assistant's main flow.
 */
module Esper.InThreadControls {
  export function insertInThreadControls() {
'''
<div #controls class="esper-in-thread-controls">
</div>
'''
    controls.append(taskNotes());

    Gmail.threadMessages().after(controls);
  }

  function taskNotes() {
'''
<div #container class="esper-section">
  <div class="esper-section-header esper-clearfix esper-open">
    <span class="esper-bold" style="float:left">Task Notes</span>
  </div>
  <div class="esper-section-notes">
    <textarea #taskNotes rows=3
          maxlength=140
          placeholder="Leave some brief notes about the task here"
          class="esper-text-notes"/>
  </div>
  <div class="esper-section-footer esper-clearfix">
    <span #notesCharCount class="esper-char-count">140</span>
    <div #saveTaskNotes class="esper-save-notes esper-save-disabled">
      Save
    </div>
  </div>
</div>
'''
    var notes = "";

    CurrentThread.task.watch(function (task) {
      if (task) {
        notes = task.task_notes || ""; // "" if task.task_notes is undefined
      } else {
        notes = "";
      }

      taskNotes.val(notes);
      notesCharCount.text(140 - notes.length);
    });

    taskNotes.keyup(function() {
      taskNotesKeyUp(notes);
    });

    function taskNotesKeyUp(notes) {
      var left = 140 - taskNotes.val().length;
      notesCharCount.text(left);
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
          if ($(this).hasClass("esper-save-enabled")) {
            var notes = taskNotes.val();
            var threadId = CurrentThread.threadId.get();
            Api.getTaskForThread(team.teamid, threadId, false, true)
              .done(function(task) {
                Api.setTaskNotes(task.taskid, notes).done(function() {
                  saveTaskNotes.addClass("esper-save-disabled");
                  saveTaskNotes.removeClass("esper-save-enabled");
                  saveTaskNotes.removeClass("esper-clickable");
                  taskNotes.keyup(function() {taskNotesKeyUp(notes);});
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
/*
  Home page (task lists)
*/

var home = (function() {
  var mod = {};

  function taskTitleViewId(task) {
    return "tasktitle-" + task.tid;
  }

  function viewOfTaskTitle(task) {
    var view = $("<div class='task'/>",{id:taskTitleViewId(task)});
    var checkbox = $("<img class='task-checkbox'/>")
      .appendTo(view);
    svg.loadImg(checkbox, "/assets/img/checkbox.svg");
    checkbox.click(function() {
      if (checkbox.hasClass("checkbox-selected")) {
        checkbox.removeClass("checkbox-selected");
      }
      else {
        checkbox.addClass("checkbox-selected");
      }
    })
    var title = task.task_status
      ? task.task_status.task_title
      : null;
    if (title) {
      $("<a class='task-title' href='#!task/" + task.tid + "'/>")
        .text(title)
        .appendTo(view);
    }
    return view;
  }

  function listViewOfTask(task) {
    return "Scheduling" === variant.cons(task.task_data)
         ? $("#scheduling-tasks-tab-content")
         : $("#general-tasks-tab-content");
  }

  function taskCreated(task) {
    listViewOfTask(task).prepend(viewOfTaskTitle(task));
  }

  function taskModified(task) {
    var view_id = taskTitleViewId(task);

    // In case the task kind has changed, remove the task title from
    // all the other tabs.
    if ("Scheduling" === variant.cons(task.task_data)) {
      $("#general-tasks-tab-content #" + view_id).remove();
    } else {
      $("#scheduling-tasks-tab-content #" + view_id).remove();
    }

    var view = $("#" + view_id);
    if (view.length > 0) {
      view.replaceWith(viewOfTaskTitle(task));
    } else {
      taskCreated(task);
    }
  }

  function loadTasks() {
    $("#general-tasks-tab-content").children().remove();
    $("#scheduling-tasks-tab-content").children().remove();
    api.loadActiveTasks()
      .fail(status_.onError(404))
      .then(function(data) {
        list.iter(data.tasks, function(task) {
          listViewOfTask(task).append(viewOfTaskTitle(task));
        });
        task.onTaskCreated .observe("task-list", taskCreated);
        task.onTaskModified.observe("task-list", taskModified);
      });
  }

  function loadNavHeader() {
    $(".nav-header").each(function() {
      var view = $(this);
      view.children().remove();
      var circ = $("<div id='exec-circ-outline'></div>")
        .append("<div id='exec-circ'></div>")
        .appendTo(view);
      var initials;
      var exec = $("<div id='exec-name-div'></div>")
        .append($("<div id='assisting'>ASSISTING</div>"))
        .append($("<div id='exec-name' class='ellipsis'>Executive Name</div>"))
        .appendTo(view);
      var caretDiv = $("<div id='exec-caret'></div>")
        .appendTo(view);
      var caret = $("<img/>")
        .appendTo(caretDiv);
      svg.loadImg(caret, "/assets/img/caret.svg");
      $(".account-block").each(function() {
        if (! $(this).hasClass("hide"))
          $(this).addClass("hide");
      })
      view.click(function() {
        if (caretDiv.hasClass("account-nav-open")) {
          caretDiv.removeClass("account-nav-open");
          caretDiv.addClass("account-nav-closed");
          $(".account-block").each(function() {
            $(this).addClass("hide");
          })
        } else {
          caretDiv.removeClass("account-nav-closed");
          caretDiv.addClass("account-nav-open");
          $(".account-block").each(function() {
            $(this).removeClass("hide");
          })
        }
      })
    })
  }

  mod.load = function() {
    loadNavHeader();
    loadTasks();
    util.focus();
  };

  return mod;
}());

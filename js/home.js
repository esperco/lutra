/*
  Home page (task lists)
*/

var home = (function() {
  var mod = {};

  function activeTaskViewId(task) {
    return "active-" + task.tid;
  }
  function archiveTaskViewId(task) {
    return "archive-" + task.tid;
  }
  function allTaskViewId(task) {
    return "all-" + task.tid;
  }

  function viewofTaskRow(taskViewId, task) {
    var view = $("<div/>",{'class':'task clearfix', 'id':taskViewId(task)});

    var title = task.task_status
      ? task.task_status.task_title
      : null;

    var dragDiv = $("<div class='task-drag-div hide'></div>")
      .appendTo(view);
    var drag = $("<img class='drag'/>")
      .appendTo(dragDiv);
    svg.loadImg(drag, "/assets/img/drag.svg");

    var archiveDiv = $("<div class='archive-div'></div>")
      .appendTo(view);
    var archive = $("<img class='archive'/>")
      .appendTo(archiveDiv);
    svg.loadImg(archive, "/assets/img/x.svg");
    archiveDiv
      .tooltip({"title":"Archive"})
      .click(function() {
      });

    var taskDetails = $("<div class='task-details'></div>")
      .appendTo(view);

    if (title) {
      $("<div class='new-label new-label-task hide'>NEW</div>")
        .appendTo(taskDetails);
      $("<div class='updated updated-task hide'></div>")
        .appendTo(taskDetails);
      $("<a href='#!task/" + task.tid + "' class='task-title ellipsis'></a>")
        .text(title)
        .appendTo(taskDetails);
      $("<div class='task-status'/>").text(task.task_status_text)
        .appendTo(taskDetails);
      $("<div class='task-date hide'></div>")
        .append($("<span class='verb'>Created </span>"))
        .append($("<span>on </span>"))
        .append($("<span class='update-date'>May 30, 2014 at 12:55 pm</span>"))
        .append($("<span class='update-author'> by Christopher</span>"))
        .appendTo(taskDetails);

      // var exec = $("<div class='task-exec'></div>")
      //   .appendTo(view);
      // $("<div class='task-exec-circ-line'></div>")
      //   .append($("<div class='task-exec-circ unselectable'>JL</div>"))
      //   .appendTo(exec);
      // $("<div class='task-exec-name ellipsis'>Christopher W.</div>")
      //   .appendTo(exec);

      // var withDiv = $("<div class='with-div'></div>")
      //   .appendTo(view);
      // var withIcon = $("<img class='with'/>")
      //   .appendTo(withDiv);
      // svg.loadImg(withIcon, "/assets/img/with.svg");

      // var taskGuest = $("<div class='task-guest'></div>")
      //   .appendTo(view);
      // $("<div class='task-guest-circ-line'></div>")
      //   .append($("<div class='task-guest-circ unselectable'>CW</div>"))
      //   .appendTo(taskGuest);
      // $("<div class='task-guest-name ellipsis'>Christopher W.</div>")
      //   .appendTo(taskGuest);
    }

    return view;
  }

  function listViewOfTask(task) {
    return "Scheduling" === variant.cons(task.task_data)
         ? $("#scheduling-tasks-tab-content")
         : $("#general-tasks-tab-content");
  }

  function taskUpdated(task) {
    var view_id = activeTaskViewId(task);

    // In case the task kind has changed, remove the task title from
    // all the other tabs.
    if ("Scheduling" === variant.cons(task.task_data)) {
      $("#general-tasks-tab-content #" + view_id).remove();
    } else {
      $("#scheduling-tasks-tab-content #" + view_id).remove();
    }

    var view = $("#" + view_id);
    if (view.length > 0) {
      view.replaceWith(viewofTaskRow(activeTaskViewId, task));
    } else {
      listViewOfTask(task).prepend(viewofTaskRow(activeTaskViewId, task));
    }

    view = $("#" + allTaskViewId(task));
    if (view.length > 0) {
      view.replaceWith(viewofTaskRow(allTaskViewId, task));
    } else {
      $("#all-tasks-tab-content")
              .prepend(viewofTaskRow(allTaskViewId, task));
    }
  }

  function loadArchive() {
  if (false) { // not implemented yet
    var view = $("#archive-tasks-tab-content");
    view.children().remove();
    api.loadRecentTasks()
      .fail(status_.onError(404))
      .then(function(data) {
        list.iter(data.tasks, function(task) {
          view.append(viewofTaskRow(archiveTaskViewId, task));
        });
      });
  }
  }

  function loadTasks() {
    $("#general-tasks-tab-content").children().remove();
    $("#scheduling-tasks-tab-content").children().remove();
    api.loadActiveTasks()
      .fail(status_.onError(404))
      .then(function(data) {
        list.iter(data.tasks, function(task) {
          listViewOfTask(task).append(viewofTaskRow(activeTaskViewId, task));
        });
        task.onTaskCreated .observe("task-list", taskUpdated);
        task.onTaskModified.observe("task-list", taskUpdated);
      });
  }

  function loadAllTasks() {
    var view = $("#all-tasks-tab-content");
    view.children().remove();
    api.loadRecentTasks()
      .fail(status_.onError(404))
      .then(function(data) {
        list.iter(data.tasks, function(task) {
          view.append(viewofTaskRow(allTaskViewId, task));
        });
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
    loadAllTasks();
    loadTasks();
    loadArchive();
    $(".place-nav").click(places.load);
    util.focus();
  };

  return mod;
}());

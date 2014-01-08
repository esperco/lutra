/*
  Home page (task lists)
*/

var home = (function() {
  var mod = {};

  var tabSelector = show.create({
    "all-tasks":        {ids: ["all-tasks-tab-content"]},
    "scheduling-tasks": {ids: ["scheduling-tasks-tab-content"]}
  });

  function viewOfTaskTitle(task) {
    var view = $("<div class='task clearfix'></div>");
    var taskDetails = $("<div class='task-details'></div>")
      .appendTo(view);
    var title = task.task_status
      ? task.task_status.task_title
      : null;
    if (title) {
      $("<div class='new-label'>NEW</div>")
        .appendTo(taskDetails);
      $("<a href='#!task/" + task.tid + "' class='task-title'></a>")
        .text(title)
        .appendTo(taskDetails);
      $("<div class='task-status'>Status goes here.</div>")
        .appendTo(taskDetails);
    }

    var archiveDiv = $("<div class='archive-div'></div>")
      .appendTo(view);
    var archive = $("<img class='archive'/>")
      .appendTo(archiveDiv);
    svg.loadImg(archive, "/assets/img/x.svg");
    archiveDiv.tooltip({"title":"Archive","placement":"left"})
              .click(function() {
    });
    return view;
  }

  function viewOfTaskQueue(tasks) {
    var view = $("<div/>");
    var tasksView = $("<div/>", {id:"tasks-scheduling"});

    list.iter(tasks, function(task) {
      viewOfTaskTitle(task).appendTo(tasksView);
    });
    tasksView.appendTo(view);

    return view;
  }

  function taskCreated(task) {
    switch (variant.cons(task.task_data)) {
    case "Questions":
    case "Scheduling":
    default:
      // All tasks go to scheduling tab for now.
      $("#tasks-scheduling").append(viewOfTaskTitle(task));
      break;
    }
  }

  function loadSchedulingTasks() {
    var view = $("#scheduling-tasks-tab-content");
    view.children().remove();
    api.loadActiveTasks()
      .done(function(data) {
        viewOfTaskQueue(data.tasks)
          .appendTo(view);
        task.onTaskCreated.observe("scheduling-tab", taskCreated);
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
    tabSelector.hideAll();
    loadSchedulingTasks();
    tabSelector.show("scheduling-tasks");
    util.focus();
  };

  return mod;
}());

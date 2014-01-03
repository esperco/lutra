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
    var view = $("<div class='task'></div>");
    var checkbox = $("<img class='task-checkbox'/>")
      .appendTo(view);
    svg.loadImg(checkbox, "/assets/img/checkbox.svg");
    checkbox.click(function() {
      log("testing1");
      if (checkbox.hasClass("checkbox-selected")) {
        log("testing2");
        checkbox.removeClass("checkbox-selected");
      }
      else {
        log("testing3");
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

  function viewOfTaskQueue(tasks) {
    var view = $("<div/>");
    var tasksView = $("<div/>");

    list.iter(tasks, function(task) {
      viewOfTaskTitle(task).appendTo(tasksView);
    });
    tasksView.appendTo(view);

    return view;
  }

  function loadSchedulingTasks() {
    var view = $("#scheduling-tasks-tab-content");
    view.children().remove();
    api.loadActiveTasks()
      .done(function(data) {
        viewOfTaskQueue(data.tasks)
          .appendTo(view);
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
        // .append($("<div id='assisting'>ASSISTING</div>"))
        // .append($("<div id='exec-name'>Joe Lonsdale</div>"))
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

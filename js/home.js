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
    var title = task.task_status
      ? task.task_status.task_title
      : null;
    if (title) {
      $("<a class='tasktitle' href='#!task/" + task.tid + "'/>")
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

  mod.load = function() {
    tabSelector.hideAll();
    loadSchedulingTasks();
    tabSelector.show("scheduling-tasks");
  };

  return mod;
}());

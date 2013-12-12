/*
  Task-related functions.
  Meetings have their own module, "sched".
*/

var task = (function() {

  var mod = {};

  // task queue view
  function viewOfTaskQueue(tab, tasks) {
    var view = $("<div/>");
    var tasksView = $("<div/>");

    for (var i in tasks) {
      mod.viewOfTask(tab, tasks[i]).appendTo(tasksView);
    }
    tasksView.appendTo(view);

    return view;
  }

  // display task
  mod.viewOfTask = function(tab, task) {
    var view = $("<div class='task'></div>");
    var buttons = $("<div class='buttons rightbox'></div>");

    buttons.appendTo(view);

    var title = task.task_status
      ? task.task_status.task_title
      : null;
    if (title) {
      viewOfTaskTitle(title, task.tid)
        .appendTo(view);
    }

    return view;
  }

  function viewOfTaskTitle(title, tid) {
    var link = $("<a class='tasktitle' href='#!task/" + tid + "'/>")
      .text(title);
    return link;
  }

  function placeView(parent, view) {
    parent.children().remove();
    view.appendTo(parent);
  }

  mod.updateActiveTasksView = function(data) {
    var tabName = page.home.tab.activeTasks;
    placeView($("#" + tabName + "-tab-content"),
              viewOfTaskQueue(tabName, data.tasks));
  };

  var taskTypeSelector = show.create([
    "new-task",
    "sched-task",
    "gen-task"
  ]);

  function initTaskData() {
    if ($("#category-sched").is(":checked")) {
      return ["Scheduling", {}];
    }
    else if ($("#category-gen").is(":checked")) {
      return "General";
    }
  }

  /* At this stage we don't have a task ID yet */
  function loadNewTask() {
    var startTaskButton = $("#start-task");

    function isValidTitle(s) {
      return s.length > 0;
    }

    function initTaskTitle() {
      var input = $("#new-task-title");
      input.val("");
      util.afterTyping(input, $("#new-task-title"), function () {
        if (isValidTitle(input.val()))
          startTaskButton.removeClass("disabled");
      });
      input.focus();
    }

    function onClicked() {
      var kind = "Scheduling";
      if (kind !== "") {
        var title = $("#new-task-title").val();
        if (title.length > 0) {
          var task_data = initTaskData();
          var task = {
            task_status: {
              task_title: title,
              task_summary: ""
            },
            task_participants: {
              organized_by: login.data.team.team_organizers,
              organized_for: login.data.team.team_leaders
            },
            task_data: task_data
          };
          api.createTask(task)
            .done(function(task) {
              /* change URL */
              window.location.hash = "!task/" + task.tid;
            });
        };
      }
    }

    /* initialization */
    startTaskButton.addClass("disabled");
    initTaskTitle();

    startTaskButton
      .unbind('click')
      .click(onClicked);
    taskTypeSelector.show("new-task");
  }

  function loadGeneralTask(task) {
    var view = mod.viewOfTask("", task);
    placeView($("#gen-task"), view);
    taskTypeSelector.show("gen-task");
  }

  function loadSchedulingTask(task) {
    taskTypeSelector.hideAll();
    sched.loadTask(task);
    taskTypeSelector.show("sched-task");
  }

  /* Load task page */
  mod.load = function(optTid) {
    taskTypeSelector.hideAll();
    if (!optTid)
      loadNewTask();
    else {
      api.getTask(optTid)
        .done(function(task) {
          var data = task.task_data;
          switch (variant.cons(data)) {
          case "Questions":
            loadGeneralTask(task);
            break;
          case "Scheduling":
            loadSchedulingTask(task);
            break;
          default:
            log("Invalid task_data", data);
          }
          chat.loadTaskChats(task);
        })
    }
  }

  return mod;
}());

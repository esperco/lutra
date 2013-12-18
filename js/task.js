/*
  Task-related functions.
  Meetings have their own module, "sched".
*/

var task = (function() {

  var mod = {};

  // task queue view
  function viewOfTaskQueue(tasks) {
    var view = $("<div/>");
    var tasksView = $("<div/>");

    for (var i in tasks) {
      viewOfTaskTitle(tasks[i]).appendTo(tasksView);
    }
    tasksView.appendTo(view);

    return view;
  }

  // display task
  function viewOfTask(task) {
    var view = viewOfTaskTitle(task);
    return view;
  }

  function viewOfTaskTitle(task) {
    var view = $("<div class='task'></div>");
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

  function placeView(parent, view) {
    parent.children().remove();
    view.appendTo(parent);
  }

  mod.updateActiveTasksView = function(data) {
    var tabName = page.home.tab.activeTasks;
    placeView($("#" + tabName + "-tab-content"),
              viewOfTaskQueue(data.tasks));
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
      return "Questions";
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
        else
          startTaskButton.addClass("disabled");
      });
      input.focus();
    }

    function onClicked() {
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
            window.location.hash = "#!task/" + task.tid;
          });
      };
    }

    /* initialization */
    startTaskButton.addClass("disabled");
    initTaskTitle();

    startTaskButton
      .unbind('click')
      .click(onClicked);
    taskTypeSelector.show("new-task");
  }

  function loadTaskTitle(task) {
    var view = $("#task-title");
    view.children().remove();

    var title = task.task_status
      ? task.task_status.task_title
      : null;
    if (title) {
      view.text(task.task_status.task_title);
    }

    return view;
  }

  function loadGeneralTask(task) {
    var view = viewOfTask(task);
    placeView($("#gen-task"), view);
    taskTypeSelector.show("gen-task");
  }

  function loadSchedulingTask(task) {
    taskTypeSelector.hideAll();
    loadTaskTitle(task);
    sched.loadTask(task);
    taskTypeSelector.show("sched-task");
  }

  function loadTask(task) {
    loadTaskTitle(task);

    if ("Unread_by_organizer" === task.task_status.task_progress) {
      var task_kind = variant.cons(task.task_data);

      var general_task = JSON.parse(JSON.stringify(task)); // clone
      general_task.task_data = "Questions";
      placeView($("#gen-task"), viewOfTask(general_task));

      var scheduling_task = task;
      if ("Scheduling" !== task_kind) {
        scheduling_task.task_data = ["Scheduling", {}];
      }
      sched.loadTask(scheduling_task);

      var type_select = $("<select/>", {size:1});
      type_select.append($("<option>Scheduling</option>"));
      type_select.append($("<option>General</option>"));
      type_select.prop("selectedIndex", "Scheduling" === task_kind ? 0 : 1);

      function update_type() {
        switch (type_select.prop("selectedIndex")) {
        case 0:
          taskTypeSelector.show("sched-task");
          break;
        case 1:
          taskTypeSelector.show("gen-task");
          break;
        }
      }
      type_select.change(update_type);
      update_type();

      var select_place = $("#select-task-type");
      placeView(select_place, type_select);
      select_place.removeClass("hide");
    }
    else {
      $("#select-task-type").addClass("hide");
      switch (variant.cons(task.task_data)) {
      case "Questions":
        loadGeneralTask(task);
        break;
      case "Scheduling":
        loadSchedulingTask(task);
        break;
      default:
        log("Invalid task_data", task.task_data);
      }
    }
    chat.loadTaskChats(task);
  }

  /* Load task page */
  mod.load = function(optTid) {
    $("#main-navbar").addClass("hide");
    taskTypeSelector.hideAll();
    if (!optTid)
      loadNewTask();
    else {
      api.getTask(optTid)
        .done(loadTask);
    }
  }

  return mod;
}());

/*
  Task-related functions.
  Meetings have their own module, "sched".
*/

var task = (function() {

  var mod = {};

  // display task
  function viewOfGeneralTask(task) {
    function toggle_title() {
      switch (task.task_status.task_progress) {
      case "Unread_by_organizer": return "Start";
      case "Closed":              return "Reopen";
      default:                    return "Done";
      }
    }
    var status_button = $("<button/>").append(toggle_title());
    status_button.click(function() {
      switch (task.task_status.task_progress) {
      case "Unread_by_organizer":
      case "Closed":
        task.task_status.task_progress = "Coordinating";
        break;
      default:
        task.task_status.task_progress = "Closed";
        break;
      }
      status_button.text(toggle_title());
      mod.dont_change_task_type();
      api.postTask(task);
    });
    return status_button;
  }

  function placeView(parent, view) {
    parent.children().remove();
    view.appendTo(parent);
  }

  var taskTypeSelector = show.create({
    "new-task": {ids: ["new-task"]},
    "sched-task": {ids: ["sched-task"]},
    "gen-task": {ids: ["gen-task"]}
  });

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
      util.afterTyping(input, 500, function () {
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
    initTaskTitle();
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
    var view = viewOfGeneralTask(task);
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
      placeView($("#gen-task"), viewOfGeneralTask(general_task));

      var scheduling_task = task;
      if ("Scheduling" !== task_kind) {
        scheduling_task.task_data = ["Scheduling", {
          scheduling_stage: "Guest_list"
        }];
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

  mod.dont_change_task_type = function() {
    $("#select-task-type").addClass("hide");
  }

  /* Load task page */
  mod.load = function(optTid) {
    taskTypeSelector.hideAll();
    if (!optTid)
      loadNewTask();
    else {
      api.getTask(optTid)
        .done(loadTask);
    }
  }

  mod.init = function() {
    $("#new-task-btn").click(function () {
      window.location.hash = "!task";
    });
    $("#new-gen-task-btn").click(function () {
      $("#category-gen").prop("checked", true);
      window.location.hash = "!task";
    });
    $("#new-sched-task-btn").click(function () {
      $("#category-sched").prop("checked", true);
      window.location.hash = "!task";
    });
  }

  return mod;
}());

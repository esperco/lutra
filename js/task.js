/*
  Task-related functions.
  Meetings have their own module, "sched".
*/

var task = (function() {

  var mod = {};

  /* display task */
  function viewOfGeneralTask(task) {
    function toggleTitle() {
      switch (task.task_status.task_progress) {
      case "Unread_by_organizer": return "Start";
      case "Closed":              return "Reopen";
      default:                    return "Done";
      }
    }
    var statusButton = $("<button/>")
      .addClass("btn btn-default")
      .text(toggleTitle());
    statusButton.click(function() {
      switch (task.task_status.task_progress) {
      case "Unread_by_organizer":
      case "Closed":
        task.task_status.task_progress = "Coordinating";
        break;
      default:
        task.task_status.task_progress = "Closed";
        break;
      }
      statusButton.addClass("disabled");
      api.postTask(task)
        .done(function() {
          statusButton
            .text(toggleTitle())
            .removeClass("disabled");
        });
    });
    return statusButton;
  }

  function placeView(parent, view) {
    parent.children().remove();
    view.appendTo(parent);
  }

  var taskTypeSelector = show.create({
    "new-task": {ids: ["new-task"]},
    "sched-task": {ids: ["sched-task", "task-title"]},
    "gen-task": {ids: ["gen-task", "task-title"]}
  });

  function initTaskData() {
    if ($("#workflow-sched").is(":checked")) {
      return ["Scheduling", {}];
    }
    else if ($("#workflow-gen").is(":checked")) {
      return "Questions";
    }
  }

  function loadNewTask(task) {
    var startTaskButton = $("#start-task");
    var newTaskTitle = $("#new-task-title");

    function isValidTitle(s) {
      log("checking validity");
      return s.length > 0;
    }

    function updateUI() {
      if (isValidTitle(newTaskTitle.val())) {
        log("valid!");
        startTaskButton.removeClass("disabled");
      }
      else
        startTaskButton.addClass("disabled");
    }

    function loadWorkflowOptions() {
      var v = $("#workflow-options");
      v.children().remove();

      var sched = $("<div id='workflow-sched-temp' class='workflow-row'></div>")
        .appendTo(v);
      var radio = $("<img class='workflow-radio'/>")
        .appendTo(sched);
      svg.loadImg(radio, "/assets/img/radio.svg");
      var schedDetails = $("<div class='workflow-details'></div>")
        .appendTo(sched);
      var schedIcon = $("<img id='sched-workflow-icon'/>")
        .appendTo(schedDetails);
      svg.loadImg(schedIcon, "/assets/img/scheduling.svg");
      schedDetails.append("<span id='sched-workflow-text'>Scheduling</span>");
      schedDetails.append("<div>Arrange one-on-one and group meetings.</div>");

      var gen = $("<div id='workflow-gen-temp' class='workflow-row'></div>")
        .appendTo(v);
      var radio = $("<img class='workflow-radio'/>")
        .appendTo(gen);
      svg.loadImg(radio, "/assets/img/radio.svg");
      var genDetails = $("<div class='workflow-details'></div>")
        .appendTo(gen);
      var genIcon = $("<img id='gen-workflow-icon'/>")
        .appendTo(genDetails);
      svg.loadImg(genIcon, "/assets/img/general.svg");
      genDetails.append("<span id='gen-workflow-text'>General</span>");
      genDetails.append("<div>Do general stuff.</div>");
    }

    function initUI() {
      loadWorkflowOptions();
      if (util.isNotNull(task)) {
        newTaskTitle.val(task.task_status.task_title);
        switch (variant.cons(task.task_data)) {
        case "Questions":
          $("#workflow-gen").prop("checked", true);
          break;
        case "Scheduling":
          $("#workflow-sched").prop("checked", true);
          break;
        default:
          log("Invalid task_data", task.task_data);
        }
      } else {
        newTaskTitle.val("");
      }
      updateUI();
      util.afterTyping(newTaskTitle, 250, updateUI);
      util.changeFocus(newTaskTitle);
    }

    function onClicked() {
      var title = $("#new-task-title").val();
      if (title.length > 0) {
        if (task) {
          task.task_data = initTaskData();
          task.task_status.task_title = title;
          task.task_status.task_progress = "Coordinating";
          api.postTask(task)
            .done(function(task) {
              mp.track("Start task");
              observable.onTaskModified.notify(task);
              mod.loadTask(task);
            });
        }
        else {
          var task_data = initTaskData();
          var team = login.getTeam();
          task = {
            task_status: {
              task_title: title,
              task_summary: ""
            },
            task_participants: {
              organized_by: team.team_organizers,
              organized_for: team.team_leaders
            },
            task_data: task_data
          };
          api.createTask(task)
            .done(function(task) {
              mp.track("Start task");
              observable.onTaskCreated.notify(task);
              /* change URL */
              window.location.hash = "#!task/" + task.tid;
            });
        }
      }
    }

    /* initialization */
    initUI();

    startTaskButton
      .unbind('click')
      .click(onClicked);

    taskTypeSelector.show("new-task");
    util.focus();
  }

  function loadTaskTitle(task) {
    var view = $("#task-title");
    view.children().remove();
    view.text(task.task_status.task_title);

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

  /* Load task data */
  mod.loadTask = function(task) {
    loadTaskTitle(task);

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
    chat.loadTaskChats(task);
    util.focus();
  }

  /* Load task page from its task ID, if available */
  mod.load = function(optTid) {
    taskTypeSelector.hideAll();
    if (! util.isNotNull(optTid)) {
      loadNewTask(null);
      chat.clearTaskChats();
    } else {
      api.getTask(optTid)
        .done(function(ta) {
          var team = list.find(login.getTeams(), function(x) {
            return x.teamid === ta.task_teamid;
          });
          if (util.isNotNull(team)) {
            login.setTeam(team);
          }
          mod.loadTask(ta);
        });
    }
  }

  mod.init = function() {
    $("#new-task-btn-mobile").click(function () {
      window.location.hash = "!task";
    });
    $("#new-task-btn").click(function () {
      window.location.hash = "!task";
    });
    $("#new-gen-task-btn").click(function () {
      $("#workflow-gen").prop("checked", true);
      window.location.hash = "!task";
    });
    $("#new-sched-task-btn").click(function () {
      mp.track("New task from Web");
      $("#workflow-sched").prop("checked", true);
      window.location.hash = "!task";
    });
  }

  return mod;
}());

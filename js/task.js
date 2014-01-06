/*
  Task-related functions.
  Meetings have their own module, "sched".
*/

var task = (function() {

  var mod = {};

  /* extract all user IDs contained in the task; this is used to
     pre-fetch all the profiles. */
  mod.extractAllUids = function(ta) {
    var acc = [];

    var taskPar = ta.task_participants;
    acc = list.union(acc, taskPar.organized_by);
    acc = list.union(acc, taskPar.organized_for);

    list.iter(ta.task_chats, function(chat) {
      var uids = list.map(chat.chat_participants, function(x) {
        return x.par_uid;
      });
      acc = list.union(acc, uids);
    });

    return acc;
  }

  /*
    fetch the profiles of everyone involved in the task
    (deferred map from uid to profile)
  */
  mod.profilesOfEveryone = function(ta) {
    var par = ta.task_participants;
    var everyone = mod.extractAllUids(ta);
    return profile.mget(everyone)
      .then(function(a) {
        var b = {};
        list.iter(a, function(obsProf) {
          if (obsProf !== null) {
            b[obsProf.prof.profile_uid] = obsProf;
          }
        });
        return b;
      });
  };

  /* display task */
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
      return "General";
    }
  }

  /* At this stage we don't have a task ID yet */
  function loadNewTask(task) {
    var startTaskButton = $("#start-task");
    var newTaskTitle = $("#new-task-title");

    function isValidTitle(s) {
      return s.length > 0;
    }

    function updateUI() {
      if (isValidTitle(newTaskTitle.val()))
        startTaskButton.removeClass("disabled");
      else
        startTaskButton.addClass("disabled");
    }

    function initUI() {
      if (task) {
        newTaskTitle.val(task.task_status.task_title);
        switch (variant.cons(task.task_data)) {
        case "General":
          $("#category-gen").prop("checked", true);
          break;
        case "Scheduling":
          $("#category-sched").prop("checked", true);
          break;
        default:
          log("Invalid task_data", task.task_data);
        }
      } else {
        newTaskTitle.val("");
        $("#category-sched").prop("checked", true);
      }
      updateUI();
      util.afterTyping(newTaskTitle, 500, updateUI);
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
            .done(loadTask);
        }
        else {
          var task_data = initTaskData();
          task = {
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
      loadNewTask(task);
    }
    else {
      switch (variant.cons(task.task_data)) {
      case "General":
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
    util.focus();
  }

  /* Load task page */
  mod.load = function(optTid) {
    taskTypeSelector.hideAll();
    if (!optTid)
      loadNewTask(null);
    else {
      api.getTask(optTid)
        .done(loadTask);
    }
  }

  mod.init = function() {
    $("#new-task-btn-mobile").click(function () {
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

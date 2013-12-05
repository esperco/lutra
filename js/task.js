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

/*
    viewOfNewTaskButton(tab, tasksView)
      .appendTo(view);
*/

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

    
    var archiveButton =
      $("<button class='btn btn-default btn-primary'>Delete</button>");
    if (tab === page.home.tab.activeTasks) {
      archiveButton
        .click(function() {
          api.queueRemove(task)
            .done(function() { view.remove(); });
        });
      archiveButton.appendTo(buttons);
    }

    // var editButton = $("<button class='btn btn-default'>Edit</button>")
    //   .click(function() {
    //     editViewOfTask(tab, task, task.task_requests, {})
    //       .replaceAll(view);
    //   });
    // editButton.appendTo(buttons);

    buttons.appendTo(view);
    

    var title = task.task_status
      ? task.task_status.task_title
      : null;
    if (title) {
      viewOfTaskTitle(title, task.tid)
        .appendTo(view);
    }

    viewOfTaskRequests(task.task_requests)
      .appendTo(view);

    return view;
  }

  function viewOfTaskTitle(title, tid) {
    var view = $("<h4 class='tasktitle'/>");
    var link = $("<a href='#!task/" + tid + "'/>")
      .text(title)
      .appendTo(view);
    return view;
  }

  function viewOfTaskRequests(requests) {
    var view = $("<div/>");
    for (var i in requests) {
      var q = requests[i];
      function appendRequest(node) {
        node
          .addClass("request")
          .appendTo(view);
      }
      if (q.req_kind.toLowerCase() === "message") {
        appendRequest(viewOfMessageRequest (q.req_question.message_q));
      } else {
        appendRequest(viewOfSelectorRequest(q));
      }
      if (0 < q.req_comments.length) {
        viewOfComments(q.req_comments).appendTo(view);
      }
    }
    return view;
  }


  // edit task
  function editViewOfTask(tab, task, requests, reqEdits) {
    var view = $("<div class='task'/>");

    var title = task.task_status
      ? task.task_status.task_title
      : null;
    var titleView = editViewOfTaskTitle(title);
    if (task.task_status && task.task_status.task_title) {
      titleView.text(task.task_status.task_title);
    }
    titleView.appendTo(view);

    function remove() {
      view.remove();

      if (task.tid) {
        api.deleteTask(task.tid);
      }
    }
    function stopEdit() {
      mod.viewOfTask(tab, task)
        .replaceAll(view);
    }
    function save() {
      var hasRequests = false;
      for (var qid in reqEdits) {
        hasRequests = true;
        break;
      }
      if (hasRequests) {
        updateTaskRequests(task, titleView.val(), reqEdits);
        stopEdit();
      } else {
        remove();
      }
    }

    var buttons = $("<div class='buttons'/>");

    function updateTaskButtons(hasRequests) {
      if (! task.tid && ! hasRequests) {
        remove();
      }
      else {
        buttons.children().remove();
        if (hasRequests) {
          $("<button class='btn btn-default btn-primary'>Save</button>")
            .click(save)
            .appendTo(buttons);
        }
        $("<button class='btn btn-default'>Cancel</button>")
          .click(task.tid ? stopEdit : remove)
          .appendTo(buttons);
        if (!hasRequests) {
          $("<button class='btn btn-default btn-danger'>Delete Task</button>")
            .click(taskEdit.remove)
            .appendTo(buttons);
        }
      }
    }

    var taskEdit = {update:updateTaskButtons, remove:remove, reqEdits:reqEdits};

    appendEditViewsOfTaskRequests(view, task, requests, taskEdit);
    buttons.appendTo(view);

    return view;
  }

  function updateTaskRequests(task, titleEdit, reqEdits) {
    var qs = {};
    for (var i = task.task_requests.length; --i >=0;) {
      var q = task.task_requests[i];
      if (q.rid) {
        if (reqEdits[q.rid]) {
          qs[q.rid] = q;
        } else {
          task.task_requests.splice(i, 1);
          api.deleteRequest(q.rid);
        }
      }
    }

    var titleChanged = false;
    if (task.task_status) {
      titleChanged = task.task_status.task_title !== titleEdit;
      task.task_status.task_title = titleEdit;
    } else if (titleEdit && "" !== titleEdit) {
      titleChanged = true;
      task.task_status = {task_open:true, task_title:titleEdit};
    }

    var updated_requests = [];
    for (var qid in reqEdits) {
      var edit = reqEdits[qid];
      var changed = edit.updateRequest();
      var q = qs[qid];
      if (! q) {
        q = edit.makeRequest();
        task.task_requests.push(q);
        updated_requests.push(q);
      } else if (changed) {
        updated_requests.push(q);
      }
    }
    if (titleChanged || 0 < updated_requests.length) {
      if (task.tid) {
        api.postTask(task, updated_requests);
      } else {
        api.createTask(task, updated_requests);
      }
    }
  }

  function editViewOfTaskTitle(title) {
    var view = $("<textarea class='quiz'/>").attr("placeholder", "Subject");
    if (title) {
      view.text(title);
    }
    return view;
  }

  function appendEditViewsOfTaskRequests(taskView, task, requests, taskEdit) {
    var view = $("<div/>");

    function updateTaskRequestButtons() {
      var hasRequests = 0 < view.children(0).length;
      taskEdit.update(hasRequests);
    }

    function makeRequestView(qid, edit) {
      var deleteRequestButton =
        $("<button class='btn btn-default btn-danger'>Delete request</button>");

      taskEdit.reqEdits[qid] = edit;
      var requestView = edit.viewOfRequest(deleteRequestButton)
        .appendTo(view);

      deleteRequestButton
        .click(function() {
          delete taskEdit.reqEdits[qid];
          requestView.remove();
          updateTaskRequestButtons();
        });
    }

    for (var i in requests) {
      var q = requests[i];
      var edit = q.req_kind.toLowerCase() === "message"
        ? new EditMessageRequest(q.rid, q.req_question.message_q)
        : new EditChoicesRequest(q.rid, q.req_question.selector_q);
      makeRequestView(q.rid ? q.rid : idForNewRequest(), edit);
    }

    view.appendTo(taskView);
    updateTaskRequestButtons();

    var requestSelect = selectOfRequestKind();
    var addRequestButton =
      $("<button class='btn btn-default'>Create follow-up request</button>")
      .click(function() {
        var kind = requestSelect.val();
        var edit = "message" === kind
          ? new EditMessageRequest(null, {msg_text:""})
        : new EditChoicesRequest(null, newSelector("multiple" === kind));
        makeRequestView(idForNewRequest(), edit);
        updateTaskRequestButtons();
        edit.focus();
      });

    var bbox = $("<p class='buttons rightbox'/>");
    requestSelect.appendTo(bbox);
    addRequestButton.appendTo(bbox);
    bbox.appendTo(taskView);
  }


  // new task and request

/*
  function viewOfNewTaskButton(tab, tasksView) {
    var buttons = $("<div class='buttons'/>");

    var requestSelect = selectOfRequestKind();
    var newTaskButton = $("<button class='btn btn-default'>New Task</button>")
      .click(function() {
        var reqEdits = {};
        tasksView
          .prepend(viewOfNewTask(tab, requestSelect.val(), reqEdits));
        for (var qid in reqEdits) { // actually only one request in the new task
          reqEdits[qid].focus();
          break;
        }
      });

    requestSelect.appendTo(buttons);
    newTaskButton.appendTo(buttons);
    return buttons;
  }
*/


  function viewOfNewTask(tab, kind, reqEdits) {
    var q = "message" === kind
      ? makeRequest(null, "Message", {message_q:{msg_text:""}})
    : makeRequest(null, "Selector",{selector_q:newSelector("multiple" === kind)});
    var task = {
      task_requests:[],
      task_status:{task_open:true, task_title:null, task_summary:""},
      task_data:"Questions",
      task_participants:{
        organized_by : login.data.team.team_organizers,
        organized_for: login.data.team.team_leaders
      }
    };
    return editViewOfTask(tab, task, [q], reqEdits);
  }

  function newSelector(sel_multi) {
    return {sel_text:"", sel_choices:[], sel_default:[], sel_multi:sel_multi};
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

  var newTaskSelector = show.create(["new-task"]);

  var taskTypeSelector = show.create([
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
    taskTypeSelector.hideAll();

    function onClicked(kind) {
      if (kind !== "") {
        var title = $("#new-task-title").val();
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
            $("#basics").addClass("hide");
            $("#new-task-footer").addClass("hide");
            /* change URL */
            window.location.hash = "!task/" + task.tid;
          });
      }
    }

    $("#start-task").click(onClicked);

  //   var sel = select.create({
  //     options: [
  //       { label: "Select category" },
  //       { label: "Scheduling", value: "Scheduling", action: onSelected },
  //       { label: "General", value: "Questions", action: onSelected },
  //     ]
  //   });
  //   var container = $("#select-category");
  //   container.children().remove();
  //   sel.view.appendTo(container);

  //   newTaskSelector.show("new-task");
  }

  function loadQuestionsTask(task) {
    var view = mod.viewOfTask("", task);
    placeView($("#gen-task"), view);
    taskTypeSelector.show("gen-task");
  }

  function loadMeetingTask(task) {
    taskTypeSelector.hideAll();
    sched.loadTask(task);
    taskTypeSelector.show("sched-task");
  }

  /* Load task page */
  mod.load = function(optTid) {
    if (!optTid)
      loadNewTask();
    else {
      api.getTask(optTid)
        .done(function(task) {
          var data = task.task_data;
          switch (variant.cons(data)) {
          case "Questions":
            loadQuestionsTask(task);
            break;
          case "Scheduling":
            /* TODO check task progress, display appropriate view */
            loadMeetingTask(task);
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

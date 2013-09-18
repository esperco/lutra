// test accounts
var test_ea_uid  = "PkUaGeQstJ64Vwz__u01_w";
var test_vip_uid = "PkUumYKplkzjT5A__u02_w";
var test_teamid  = "PlI4tnhhrg3AyCm__a01_w";

function reportStatus(msg, kind) {
  var e = $("#status");
  e.text(msg);
  e.addClass("alert alert-" + kind);
  e.removeClass("hide");
}

// error status
function reportError(msg, statusCode) {
  reportStatus(msg + " (" + statusCode + ")", "error");
}

function reportSuccess(msg) {
  reportStatus(msg, "success");
}

function clearStatus() {
  $("#error").addClass("hide");
}

// task queue view
function viewOfTaskQueue(tasks) {
  var view = document.createElement("div");
  for (var i in tasks) {
    view.appendChild(viewOfTask(tasks[i].task));
  }
  view.appendChild(viewOfNewTaskButton(view));
  return view;
}

// display task
function viewOfTask(task) {
  var view = document.createElement("div");
  view.setAttribute("class", "task");

  var editButton = document.createElement("button");
  editButton.setAttribute("class", "btn");
  editButton.textContent = "Edit";
  editButton.onclick = function() {
    view.parentNode.replaceChild(editViewOfTask(task, task.task_requests, {}),
                                 view);
  }
  var buttons = document.createElement("div");
  buttons.setAttribute("class", "buttons rightbox");
  buttons.appendChild(editButton);
  view.appendChild(buttons);

  var summary = task.task_status
              ? task.task_status.task_summary
              : null;
  if (summary) {
    view.appendChild(viewOfTaskSummary(summary));
  }

  view.appendChild(viewOfTaskRequests(task.task_requests));

  return view;
}

function viewOfTaskSummary(summary) {
  var view = document.createElement("h4");
  view.setAttribute("class", "tasksummary");
  view.textContent = summary;
  return view;
}

function viewOfTaskRequests(requests) {
  var view = document.createElement("div");
  for (var i in requests) {
    var q = requests[i];
    function appendRequest(node) {
      node.setAttribute("class", "request");
      view.appendChild(node);
    }
    if (q.req_kind.toLowerCase() === "message") {
      appendRequest(viewOfMessageRequest (q.req_question.message_q));
    } else {
      appendRequest(viewOfSelectorRequest(q));
    }
    if (0 < q.req_comments.length) {
      view.appendChild(viewOfComments(q.req_comments));
    }
  }
  return view;
}

function viewOfMessageRequest(q) {
  var view = document.createElement("div");
  if ("" === q.msg_text) {
    view.setAttribute("class", "requesttitle unasked");
    view.textContent = "no message";
  } else {
    view.textContent = q.msg_text;
  }
  return view;
}

function viewOfSelectorRequest(q) {
  var view = document.createElement("div");

  var question = document.createElement("h5");
  question.textContent = q.req_question.selector_q.sel_text;
  if ("" === question.textContent) {
    question.setAttribute("class", "unasked");
    question.textContent = "no question";
  }
  else
    question.setAttribute("class", "requesttitle");
  view.appendChild(question);

  var a = 0 < q.req_responses.length
        ? q.req_responses[0].response.selector_r : null;
  if (a) {
    for (var i in a.sel_selected) {
      var choiceView = document.createElement("span");
      choiceView.setAttribute("class", "answer");
      choiceView.textContent = a.sel_selected[i];
      view.appendChild(choiceView);
    }
  } else {
    var unanswered = document.createElement("span");
    unanswered.setAttribute("class", "unanswered");
    unanswered.textContent = "no answer";
    view.appendChild(unanswered);
  }

  return view;
}

function viewOfComments(comments) {
  var view = document.createElement("div");
  view.setAttribute("class", "comments");

  var title = document.createElement("h6");
  title.textContent = "Comments";
  view.appendChild(title);

  for (var i in comments) {
    var a = comments[i];
    if ("string" === typeof a.comment_audio) {
      view.appendChild(viewOfAudioComment(a.comment_audio));
    }
    if ("string" === typeof a.comment_text) {
      view.appendChild(viewOfTextComment(a.comment_text));
    }
  }
  return view;
}

function viewOfTextComment(comment) {
  var view = document.createElement("div");
  view.setAttribute("class", "comment");
  view.textContent = comment;
  return view;
}

// test: http://www.w3schools.com/html/horse.mp3
// test: http://www.w3schools.com/html/horse.ogg
function viewOfAudioComment(audioLink) {
  var source = document.createElement("source");
  source.setAttribute("src", audioLink);
  //source.setAttribute("type", "audio/ogg");

  var player = document.createElement("audio");
  player.setAttribute("controls", "controls");
  player.textContent = "Your browser doesn't support the audio element.";
  player.appendChild(source);

  var view = document.createElement("div");
  view.setAttribute("class", "comment");
  view.appendChild(player);
  return view;
}

// edit task
function editViewOfTask(task, requests, reqEdits) {
  var view = document.createElement("div");
  view.setAttribute("class", "task");

  function remove() {
    view.parentNode.removeChild(view);

    for (var i in task.task_requests) {
      var q = task.task_requests[i];
      if (q.rid) {
        apiDeleteRequest(q.rid);
      }
    }
  }
  function stopEdit() {
    view.parentNode.replaceChild(viewOfTask(task), view);
  }
  function save() {
    updateTaskRequests(task, reqEdits);
    stopEdit();
  }

  var buttons = document.createElement("div");
  buttons.setAttribute("class", "buttons rightbox");

  function updateTaskButtons(hasRequests) {
    if (! task.tid && ! hasRequests) {
      remove();
    }
    else {
      while (buttons.firstChild) {
        buttons.removeChild(buttons.firstChild);
      }
      if (hasRequests) {
        var saveButton = document.createElement("button");
        saveButton.setAttribute("class", "btn");
        saveButton.textContent = "Save";
        saveButton.onclick = save;
        buttons.appendChild(saveButton);
      }
      var cancelButton = document.createElement("button");
      cancelButton.setAttribute("class", "btn");
      cancelButton.textContent = "Cancel";
      cancelButton.onclick = task.tid ? stopEdit : remove;
      buttons.appendChild(cancelButton);
    }
  }

  view.appendChild(buttons);
  var summary = task.task_status
              ? task.task_status.task_summary
              : null;
  if (summary) {
    view.appendChild(viewOfTaskSummary(summary));
  }

  var taskEdit = {update:updateTaskButtons, remove:remove, reqEdits:reqEdits};
  appendEditViewsOfTaskRequests(view, task, requests, taskEdit);

  return view;
}

function updateTaskRequests(task, reqEdits) {
  var qs = {};
  for (var i = task.task_requests.length; --i >=0;) {
    var q = task.task_requests[i];
    if (q.rid) {
      if (reqEdits[q.rid]) {
        qs[q.rid] = q;
      } else {
        task.task_requests.splice(i, 1);
        apiDeleteRequest(q.rid);
      }
    }
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
  if (0 < updated_requests.length) {
    if (task.tid) {
      apiPostTask(task, updated_requests);
    } else {
      apiCreateTask(task, updated_requests);
    }
  }
}

function appendEditViewsOfTaskRequests(taskView, task, requests, taskEdit) {
  var view = document.createElement("div");

  var deleteTaskButton = document.createElement("button");
  deleteTaskButton.setAttribute("class", "btn");
  deleteTaskButton.textContent = "Delete Task";
  deleteTaskButton.onclick = taskEdit.remove;

  function updateTaskRequestButtons() {
    var hasRequests = view.firstChild;

    taskEdit.update(hasRequests);

    if (hasRequests) {
      if (taskView === deleteTaskButton.parentNode) {
        taskView.removeChild(deleteTaskButton);
      }
    } else {
      if (taskView !== deleteTaskButton.parentNode) {
        taskView.insertBefore(deleteTaskButton, view);
      }
    }
  }

  function makeRequestView(qid, edit) {
    var deleteRequestButton = document.createElement("button");
    deleteRequestButton.setAttribute("class", "btn");
    deleteRequestButton.textContent = "Delete request";

    taskEdit.reqEdits[qid] = edit;
    var requestView = edit.viewOfRequest(deleteRequestButton);
    view.appendChild(requestView);

    deleteRequestButton.onclick = function() {
      delete taskEdit.reqEdits[qid];
      view.removeChild(requestView);
      updateTaskRequestButtons();
    }
  }

  for (var i in requests) {
    var q = requests[i];
    var edit = q.req_kind.toLowerCase() === "message"
             ? new EditMessageRequest(q.rid, q.req_question.message_q)
             : new EditChoicesRequest(q.rid, q.req_question.selector_q);
    makeRequestView(q.rid ? q.rid : idForNewRequest(), edit);
  }

  taskView.appendChild(view);
  updateTaskRequestButtons();

  var requestSelect = selectOfRequestKind();
  var addRequestButton = document.createElement("button");
  addRequestButton.setAttribute("class", "btn");
  addRequestButton.textContent = "Create follow-up request";

  addRequestButton.onclick = function() {
    var edit = 0 === requestSelect.selectedIndex
             ? new EditMessageRequest(null, {msg_text:""})
             : new EditChoicesRequest(null, newSelector(
                 2 === requestSelect.selectedIndex));
    makeRequestView(idForNewRequest(), edit);
    updateTaskRequestButtons();
    edit.focus();
  }

  var bbox = document.createElement("p");
  bbox.setAttribute("class", "buttons rightbox");
  bbox.appendChild(requestSelect);
  bbox.appendChild(addRequestButton);
  taskView.appendChild(bbox);
}

function selectOfRequestKind() {
  var select = document.createElement("select");
  select.size = 1;

  var kinds = ["message", "single choice", "multiple choices"];
  for (var i in kinds) {
    var option = document.createElement("option");
    option.setAttribute("value", kinds[i]);
    option.textContent = kinds[i];
    select.add(option);
  }
  select.selectedIndex = 1;

  return select;
}

function EditMessageRequest(qid, qmessage) {
  var quizView = document.createElement("textarea");
  quizView.setAttribute("class", "quiz");
  quizView.setAttribute("placeholder", "Enter your question or request");
  quizView.textContent = qmessage.msg_text;

  this.viewOfRequest = function(deleteRequestButton) {
    var view = document.createElement("div");
    view.setAttribute("class", "request buttons");
    view.appendChild(quizView);
    view.appendChild(deleteRequestButton);
    return view;
  }

  this.focus = function() {
    quizView.focus();
  }

  this.updateRequest = function() {
    var changed = qmessage.msg_text !== quizView.value;
    qmessage.msg_text = quizView.value;
    return changed;
  }

  this.makeRequest = function() {
    return makeRequest(qid, "Message", {message_q:qmessage});
  }
}

function EditChoicesRequest(qid, qsel) {
  var editStart, editStop;

  var inputViews = [];
  var labelViews = [];

  function viewOfSelLabel(forID, value) {
    var view = document.createElement("label");
    view.setAttribute("for", forID);
    view.textContent = value;
    view.onclick = function() {
      editStart(view);
      return false;
    }
    return view;
  }

  var qname = "sel-" + qid;
  function addChoice(choiceValue) {
    var index = inputViews.length;
    var choiceID = qname + "-" + index;

    var inp = document.createElement("input");
    inp.setAttribute("id", choiceID);
    inp.setAttribute("name", qname);
    inp.setAttribute("type", qsel.sel_multi ? "checkbox" : "radio");
    inp.checked = chosen(choiceValue, qsel.sel_default);

    inputViews.push(inp);
    labelViews.push(viewOfSelLabel(choiceID, choiceValue));

    return index;
  }

  for (var i in qsel.sel_choices) {
    addChoice(qsel.sel_choices[i].sel_label);
  }

  function viewOfChoice(index) {
    var view = document.createElement("span");
    view.setAttribute("class", "choice");
    view.appendChild(inputViews[index]);
    view.appendChild(labelViews[index]);
    return view;
  }

  var addChoiceButton = document.createElement("button");
  addChoiceButton.setAttribute("class", "btn");
  addChoiceButton.textContent = "New Choice";
  function editNewChoice() {
    var index = addChoice("");
    addChoiceButton.parentNode.insertBefore(viewOfChoice(index),
        addChoiceButton);
    editStart(labelViews[index]);
  }
  addChoiceButton.onclick = editNewChoice;

  var quizView = document.createElement("textarea");
  quizView.setAttribute("class", "quiz");
  quizView.setAttribute("placeholder", "Enter your question or request");
  quizView.textContent = qsel.sel_text;

  this.viewOfRequest = function(deleteRequestButton) {
    var view = document.createElement("div");
    view.setAttribute("class", "request");

    var qbox = document.createElement("div");
    qbox.setAttribute("class", "buttons");
    qbox.appendChild(quizView);
    qbox.appendChild(deleteRequestButton);
    view.appendChild(qbox);

    var choices = document.createElement("div");
    choices.setAttribute("class", "choices");
    for (var i in inputViews) {
      choices.appendChild(viewOfChoice(i));
    }
    choices.appendChild(addChoiceButton);
    view.appendChild(choices);

    return view;
  }

  this.focus = function() {
    if (0 >= inputViews.length) {
      editNewChoice();
    } else {
      quizView.focus();
    }
  }

  this.updateRequest = function() {
    editStop();

    var changed = qsel.sel_text !== quizView.value;
    qsel.sel_text = quizView.value;

    var old_choices = qsel.sel_choices;
    changed |= old_choices.length !== labelViews.length;
    qsel.sel_choices = [];
    for (var i in labelViews) {
      var value = labelViews[i].textContent;
      if (! changed) {
        changed = old_choices[i].sel_label !== value;
      }
      qsel.sel_choices.push({sel_label:value});
    }

    var old_default = qsel.sel_default;
    qsel.sel_default = [];
    for (var i in inputViews) {
      if (inputViews[i].checked) {
        var value = labelViews[i].textContent;
        changed |= old_default.length <= qsel.sel_default.length
                || old_default[qsel.sel_default.length] !== value;
        qsel.sel_default.push(value);
      }
    }
    changed |= old_default.length !== qsel.sel_default.length;

    return changed;
  }

  this.makeRequest = function() {
    return makeRequest(qid, "Selector", {selector_q:qsel});
  }

  function editViewOfSelLabel(label) {
    var view = document.createElement("input");
    view.setAttribute("type", "text");
    view.setAttribute("value", label.textContent);
    view.setAttribute("placeholder", "Enter a choice");
    view.onblur = function () {
      editStop();
      return true;
    }
    view.onkeypress = function(e) {
      var c = e.charCode || e.keyCode;
      if (13 === c) {
        editStop();
        return false;
      }
      return true;
    }
    return view;
  }

  var editInput, editLabel;
  editStop = function() {
    if (editInput) {
      var edit  = editInput;
      var label = editLabel;
      editInput = null;
      editLabel = null;

      if ("" === edit.value) {
        // Remove the choice.
        var choiceView = edit.parentNode;
        choiceView.parentNode.removeChild(choiceView);
        var pos = labelViews.indexOf(label);
        labelViews.splice(pos, 1);
        inputViews.splice(pos, 1);
      } else {
        label.textContent = edit.value;
        edit.parentNode.replaceChild(label, edit);
      }
    }
  }
  editStart = function(label) {
    var edit = editViewOfSelLabel(label);
    label.parentNode.replaceChild(edit, label);
    edit.focus();

    editInput = edit;
    editLabel = label;
  }
}

// new task and request
function viewOfNewTaskButton(queueView) {
  var buttons = document.createElement("div");
  buttons.setAttribute("class", "buttons rightbox");

  var requestSelect = selectOfRequestKind();
  var newTaskButton = document.createElement("button");
  newTaskButton.setAttribute("class", "btn");
  newTaskButton.textContent = "New Task";
  newTaskButton.onclick = function() {
    var reqEdits = {};
    queueView.insertBefore(viewOfNewTask(requestSelect.selectedIndex, reqEdits),
                           buttons);
    for (var qid in reqEdits) { // actually only one request in the new task
      reqEdits[qid].focus();
    }
  }

  buttons.appendChild(requestSelect);
  buttons.appendChild(newTaskButton);
  return buttons;
}

function viewOfNewTask(kind, reqEdits) {
  var q = 0 === kind
        ? makeRequest(null, "Message", {message_q:{msg_text:""}})
        : makeRequest(null, "Selector",{selector_q:newSelector(2 === kind)});
  var task = {task_requests:[],
              task_status:{task_open:true, task_summary:null},
              task_participants:{organized_by :[test_ea_uid],
                                 organized_for:[test_vip_uid]}};
  return editViewOfTask(task, [q], reqEdits);
}

function makeRequest(qid, kind, question) {
  return {rid:qid, req_kind:kind, req_question:question,
          req_status:{req_open:true, req_participants:[]},
          req_responses:[], req_comments:[]};
}

function newSelector(sel_multi) {
  return {sel_text:"", sel_choices:[], sel_default:[], sel_multi:sel_multi};
}

var iNewRequest = 0;
function idForNewRequest() {
  ++iNewRequest;
  return "q" + iNewRequest;
}

// utilities
function chosen(v, vs) {
  v = v.toLowerCase();
  for (var i in vs) {
    if (v === vs[i].toLowerCase()) {
      return true;
    }
  }
  return false;
}

function placeView(parent, view) {
  if (parent.firstChild) {
    parent.replaceChild(view, parent.firstChild);
  } else {
    parent.appendChild(view);
  }
}

// HTTP
function http(method, url, body, error, cont) {
  var http = new XMLHttpRequest();
  http.onreadystatechange = function() {
    if (http.readyState === 4) {
      var statusCode = http.status;
      if (200 <= statusCode && statusCode < 300) {
        clearStatus();
        cont(http);
      } else {
        reportError("Please try again later.", statusCode);
        error();
      }
    }
  }
  http.open(method, url, true);
  http.send(body);
}

function httpGET(url, cont) {
  http("GET", url, null, function(){}, cont);
}

function httpPOST(url, body, cont) {
  http("POST", url, body, start, cont);
}

function httpDELETE(url) {
  http("DELETE", url, null, start, function(http){});
}

// API
var api_q_prefix = "/api/q/" + test_ea_uid;

function apiLoadTaskQueue() {
  httpGET(api_q_prefix + "/queue", function(http) {
    var json = JSON.parse(http.responseText);
    placeView(document.getElementById("queue"),
              viewOfTaskQueue(json.queue_elements));
  });
}

function apiLoadTaskArchive() {
  httpGET(api_q_prefix + "/archive", function(http) {
    var json = JSON.parse(http.responseText);
    placeView(document.getElementById("archive"),
              viewOfTaskQueue(json.archive_elements));
  });
}

function apiDeleteRequest(qid) {
  httpDELETE(api_q_prefix + "/request/" + qid);
}

function apiCreateTask(task, updated_requests) {
  var updated_task = {task_status      : task.task_status,
                      task_participants: task.task_participants,
                      task_requests    : updated_requests};
  httpPOST(api_q_prefix + "/task/create/" + test_teamid,
           JSON.stringify(updated_task),
           function(http) {
    var json = JSON.parse(http.responseText);
    task.tid               = json.tid;
    task.task_teamid       = json.task_teamid;
    task.task_created      = json.task_created;
    task.task_lastmod      = json.task_lastmod;
    task.task_status       = json.task_status;
    task.task_participants = json.task_participants;
    task.task_requests     = json.task_requests;
  });
}

function apiPostTask(task, updated_requests) {
  var updated_task = {task_status      : task.task_status,
                      task_participants: task.task_participants,
                      task_requests    : updated_requests};
  httpPOST(api_q_prefix + "/task/" + task.tid,
           JSON.stringify(updated_task),
           function(http) {
    var json = JSON.parse(http.responseText);
    task.tid = json.tid;
    for (var i in json.rids) {
      updated_requests[i].rid = json.rids[i];
    }
  });
}

function showTaskQueue() {
  $("#archivetab").removeClass("active");
  $("#queuetab").addClass("active");
  $("#archive").addClass("hide");
  $("#queue").removeClass("hide");
}

function showTaskArchive() {
  $("#queuetab").removeClass("active");
  $("#archivetab").addClass("active");
  $("#queue").addClass("hide");
  $("#archive").removeClass("hide");
}

/* Different types of pages */

function pageHome() {
  apiLoadTaskQueue();
  apiLoadTaskArchive();
  showTaskQueue();
}

function pageTask(tid) {
}

/* URL-based dispatching */

function unsupportedPath(path) {
  alert("unsupported path: " + path);
}

/*
  A model path is given as an array where gaps are indicated by nulls.
  The subject path must have the same length as the model and must match
  the model except for the null positions, which are returned
  as an array of strings extracted from the subject path.

  matchPath(["", "x", null, "y", null], ["", "x", "123", "y", "abc"])
  -> ["123", "abc"]
*/
function matchPath(model, path) {
  var args = [];
  if (path.length !== model.length)
    return null;
  for (var i in model) {
    if (model[i] !== null) {
      if (model[i] !== path[i])
        return null;
    }
    else
      args.push(path[i]);
  }
  return args;
}

// Change URL and load matching page
function navigate(path) {
  var p = path.split('/');
  var args = [];
  if (matchPath(["", "app"], p)) {
    window.history.pushState({}, "Esper", path);
    pageHome();
  }
  else if (args = matchPath(["", "app", "task", null], p)) {
    var tid = args[0];
    window.history.pushState({}, "Esper task " + tid, path);
    pageTask(tid);
  }
  else {
    // Invalid path, redirect to home page
    window.history.pushState({}, "Esper", "/app");
    pageHome();
  }
}

function start() {
  navigate(window.location.pathname);
}

start();

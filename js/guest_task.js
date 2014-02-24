var guestTask = function() {
  var mod = {};

  mod.loadTask = function(ta) {
    var taskView = $("#task-content");
    taskView.append($("<p/>").text(ta.task_status.task_title));

    var participantListView = $("<ul/>");
    task.profilesOfEveryone(ta).done(function(profs) {
      list.iter(ta.task_participants.organized_for, function(uid) {
        var name = profile.fullName(profs[uid].prof);
        participantListView.append($("<li/>").text(name));
      });
    });
    taskView.append(participantListView);

    observable.onTaskModified.observe("guest-task", mod.loadTask);
  }

  return mod;
}();

/*
  Scheduling step 1
*/

var sched1 = (function() {
  var mod = {};

  function finalizeGuests() {
    task.task_status.task_progress = "Coordinating";
    api.postTask(task)
      .done(function(task) { sched.loadStep2(profs, task); });
  }

  function rowViewOfParticipant(chats, profs, task, uid) {
    var view = $("<div class='sched-step1-row'>");
    var chatHead = $("<div class='chat-head'>");
    var obsProf = profs[uid];
    var prof = obsProf.prof;
    var name = prof.full_name;
    var firstInitial = $("<p class='first-initial'>" + name.charAt(0).toUpperCase() + "</p>");

    firstInitial.appendTo(chatHead);
    chatHead.appendTo(view);

    $("<p class='guest-name'>" + name + "</p>")
      .appendTo(view);
  }

  mod.load = function(profs, task, view) {
    $("<h3>Confirm the guest list.</h3>")
      .appendTo(view);

    var chats = sched.chatsOfTask(task);
    var next = $(".sched-step1-next");

    var guestsContainer = $("<div class='guests-container'>")
    var guests = sched.getGuests(task);
    var numGuests = guests.length;
    list.iter(guests, function(uid) {
      var x =
        rowViewOfParticipant(chats, profs, task, uid);
      x.view
        .appendTo(guestsContainer);
      if (numGuests == 1)
        x.composeEmail();
    });

    guestsContainer.appendTo(view);

    next
      .unbind('click')
      .click(function() {
        finalizeGuests(profs, task, selected);
      });
  };

  return mod;
}());

var pusher = function() {
  var mod = {};

  var pusher;

  mod.start = function() {
    pusher = new Pusher('d9694497227b84d1f865');
    pusher.subscribe(login.me());
    pusher.bind('tasks', function(events) {
      list.iter(events, function(ev) {
        switch (variant.cons(ev)) {

        case "Task_created":
          var tid = ev[1].tid;
          if (tid) {
            api.getTask(tid).done(observable.onTaskCreated.notify);
          }
          break;

        case "Task_modified":
          var tid = ev[1].tid;
          if (tid) {
            api.getTask(tid).done(observable.onTaskModified.notify);
          }
          break;

        case "Task_ranked":
          var rank = ev[1];
          switch (variant.cons(rank)) {
          case "Task_rank_before":
            observable.onTaskRankedBefore.notify(rank[1][0], rank[1][1]);
            break;
          case "Task_rank_after":
            observable.onTaskRankedAfter.notify(rank[1][0], rank[1][1]);
            break;
          case "Task_rank_first":
            observable.onTaskRankedFirst.notify(rank[1]);
            break;
          case "Task_rank_last":
            observable.onTaskRankedLast.notify(rank[1]);
            break;
          case "Task_rank_archive":
            observable.onTaskArchived.notify(rank[1]);
            break;
          }
          break;

        case "Chat_posted":
          var rid = ev[1].rid;
          if (rid) {
            api.getChatItem(rid).done(function(chatItem) {
              observable.onChatPosting.notify(chatItem);
              observable.onChatPosted .notify(chatItem);
            });
          }
          break;
        }
      });
    });
  }

  mod.stop = function() {
    if (pusher) {
      pusher.disconnect();
      pusher = null;
    }
  }

  return mod;
}();

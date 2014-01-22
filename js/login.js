/*
  Login and team management
*/

var login = (function() {
  var mod = {};

  mod.initLoginInfo = function() {
    var stored = store.get("login");

    if (stored && stored.uid) // sanity check
      mod.data = stored;
    else
      store.remove("login");
    mod.updateView();
  };

  mod.setLoginInfo = function(stored) {
    if (!util.isDefined(stored.team) && util.isDefined(stored.teams[0]))
      stored.team = stored.teams[0];

    // Persistent storage never sent to the server
    store.set("login", stored);
    mod.data = stored;
    mod.updateView();
  };

  function saveLoginInfo() {
    var stored = mod.data;
    store.set("login", stored);
  }

  mod.clearLoginInfo = function() {
    store.remove("login");
    delete mod.data;
    $("#login-email").val("");
    $("#login-password").val("");
    mod.updateView();
  };

  /*
    Get API secret from the server, and more.
  */
  mod.login = function (email, password) {
    return api.login(email, password)
      .then(mod.setLoginInfo,
            status_.onError(400));
  };

  mod.logout = function () {
    mod.clearLoginInfo();
  };

  /*
    Set HTTP headers for authentication, assuming the user is logged in.

    The advantages over sending the api_secret as a cookie are:
    - the secret is not sent to the server
    - the signature expires, preventing replay attacks
    - all clients use the same mechanism
  */
  mod.setHttpHeaders = function(path) {
    return function(jqXHR) {
      if (mod.data) {
        var unixTime = Math.round(+new Date()/1000).toString();
        var signature = CryptoJS.SHA1(
          unixTime
            + ","
            + path
            + ","
            + mod.data.api_secret
        );
        jqXHR.setRequestHeader("Esper-Timestamp", unixTime);
        jqXHR.setRequestHeader("Esper-Path", path);
        jqXHR.setRequestHeader("Esper-Signature", signature);
      }
    }
  };

  var pusher;

  function pusher_start() {
    pusher = new Pusher('d9694497227b84d1f865');
    pusher.subscribe(mod.data.uid);
    pusher.bind('tasks', function(events) {
      list.iter(events, function(ev) {
        switch (variant.cons(ev)) {

        case "Task_created":
          var tid = ev[1].tid;
          if (tid) {
            api.getTask(tid).done(task.onTaskCreated.notify);
          }
          break;

        case "Task_modified":
          var tid = ev[1].tid;
          if (tid) {
            api.getTask(tid).done(task.onTaskModified.notify);
          }
          break;

        case "Task_ranked":
          var rank = ev[1];
          switch (variant.cons(rank)) {
          case "Task_rank_before":
            task.onTaskRankedBefore.notify(rank[1][0], rank[1][1]);
            break;
          case "Task_rank_after":
            task.onTaskRankedAfter.notify(rank[1][0], rank[1][1]);
            break;
          case "Task_rank_first":
            task.onTaskRankedFirst.notify(rank[1]);
            break;
          case "Task_rank_last":
            task.onTaskRankedLast.notify(rank[1]);
            break;
          case "Task_rank_archive":
            task.onTaskArchived.notify(rank[1]);
            break;
          }
          break;

        case "Chat_posted":
          var rid = ev[1].rid;
          if (rid) {
            api.getChatItem(rid).done(function(chatItem) {
              task.onChatPosting.notify(chatItem);
              task.onChatPosted .notify(chatItem);
            });
          }
          break;
        }
      });
    });
  }

  function pusher_stop() {
    if (pusher) {
      pusher.disconnect();
      pusher = null;
    }
  }

  mod.updateView = function() {
    if (mod.data && mod.data.email) {
      $("#logged-in-email").text(mod.data.email);
      $(".logged-out").addClass("hide");
      $(".logged-in").removeClass("hide");
      pusher_start();
    } else {
      $(".logged-in").addClass("hide");
      $(".logged-out").removeClass("hide");
      pusher_stop();
    }
  };

  /* Utilities */
  mod.me = function() {
    return mod.data.uid;
  };

  mod.getTeams = function() {
    return mod.data.teams;
  };

  mod.getTeam = function() {
    return mod.data.team;
  };

  mod.setTeam = function(team) {
    mod.data.team = team;
    saveLoginInfo();
  };

  mod.organizer = function() {
    return mod.getTeam().team_organizers[0];
  };

  mod.leader = function() {
    return mod.getTeam().team_leaders[0];
  };

  return mod;
})();

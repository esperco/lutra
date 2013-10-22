var page = (function() {

  var mod = {};

  mod.showTaskQueue = function() {
    $("#archivetab").removeClass("active");
    $("#queuetab").addClass("active");
    $("#archive").addClass("hide");
    $("#queue").removeClass("hide");
  };

  mod.showTaskArchive = function() {
    $("#queuetab").removeClass("active");
    $("#archivetab").addClass("active");
    $("#queue").addClass("hide");
    $("#archive").removeClass("hide");
  };

  /* Login screen */
  function showLogin(redirPath) {
    $("#login-button")
      .click(function() {
        var email = $("#login-email").val();
        var password = $("#login-password").val();
        if (email !== "" && password !== "") {
          login.login(email, password)
            .done(function() { route.nav.path(redirPath); });
        }
      });
    $("#login-page").removeClass("hide");
    $("#login-email").focus();
  }

  function showRespond(rid, asUid) {
    api.getTaskRequestFor(rid, asUid); // TODO call returns task from rid,
                                       // keeps only responses from this
                                       // participant
    $("#single-task").removeClass("hide");
  }

  function clear() {
    $("#login-page").addClass("hide");
    $("#tabbed-tasks-page").addClass("hide");
    $("#single-task-page").addClass("hide");
  }

  /* Different types of pages */

  mod.home = function() {
    clear();
    api.loadTaskQueue();
    api.loadTaskArchive();
    mod.showTaskQueue();
    $("#tabbed-tasks-page").removeClass("hide");
  }

  mod.login = function(redirPath) {
    clear();
    showLogin(redirPath);
  };

  mod.respond = function(rid, asUid) {
    clear();
    showRespond(rid, asUid);
  };

  return mod;
}());

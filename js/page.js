var page = (function() {

  var mod = {
    login: {},
    requestPassword: {},
    resetPassword: {},
    home: {},
    task: {},
    scheduling: {},
    respond: {}
  };
  var pageNames = [
    "login",
    "request-password",
    "reset-password",
    "home",
    "task",
    "scheduling",
    "respond"
  ];

  mod.home.tab = {
    activeTasks: "active-tasks"
  };

  var homeTabNames = [
    mod.home.tab.activeTasks
  ];

  function homeInitTabs() {
    for (var i in homeTabNames) {
      var tabName = homeTabNames[i];
      $("#" + tabName + "-tab-link")
        .unbind('click')
        .click(function() { homeShowTab(tabName); });
    }
  }

  function homeHideAllTabs() {
    for (var i in homeTabNames) {
      var tabName = homeTabNames[i];
      $("#" + tabName + "-tab").removeClass("active");
      $("#" + tabName + "-tab-content").addClass("hide");
    }
  };

  function homeShowTab(tabName) {
    $("#" + tabName + "-tab").addClass("active");
    $("#" + tabName + "-tab-content").removeClass("hide");
  };

  function homeReplaceTab(tabName) {
    homeHideAllTabs();
    homeShowTab(tabName);
  };

  /* Login screen */
  function prepareLogin(redirPath) {
    $("#login-button")
      .unbind('click')
      .click(function() {
        var email = $("#login-email").val();
        var password = $("#login-password").val();
        if (email !== "" && password !== "") {
          login.login(email, password)
            .done(function() {
              route.nav.path(redirPath);
            });
        }
        return false;
      });
  }

  function prepareRequestPassword(email0) {
    var input = $("#passreq-email");
    if (! email0)
      email0 = $("#login-email").val();

    input.val(email0);

    function submit() {
      var email = input.val();
      if (email !== "") {
        api.requestPassword(email)
          .done(function() {
            status.reportSuccess("Success. Check your email.");
          })
          .fail(function () {
            status.reportError("Oops, something went wrong.");
          });
      };
      return false;
    }

    $("#passreq-button")
      .unbind('click')
      .click(submit);
  }

  function prepareResetPassword(uid, token) {
    var input = $("#passreset-password");
    input.val("");

    function submit() {
      var password = input.val();
      if (password !== "") {
        api.resetPassword(uid, token, password)
          .done(function(x) {
            login.setLoginInfo(x);
            route.nav.path("");
          })
          .fail(function () {
            status.reportError("Oops, something went wrong.");
          });
      };
      return false;
    }

    $("#passreset-button")
      .unbind('click')
      .click(submit);
  }

  function showRespond(rid, asUid) {
    api.getTaskRequestFor(rid, asUid); // TODO call returns task from rid,
                                       // keeps only responses from this
                                       // participant
    $("#single-task").removeClass("hide");
  }

  function hideAll() {
    for (var i in pageNames) {
      var pageName = pageNames[i];
      $("#" + pageName + "-page").addClass("hide");
    }
  }

  function show(pageName) {
    $("#" + pageName + "-page").removeClass("hide");
  }

  function replace(pageName) {
    hideAll();
    show(pageName);
  }

  /* Load and render different types of pages */

  mod.home.load = function() {
    $("#main-navbar").removeClass("hide");
    hideAll();
    api.loadActiveTasks();
    homeReplaceTab("active-tasks");
    show("home");
  }

  mod.login.load = function(redirPath) {
    hideAll();
    prepareLogin(redirPath);
    show("login");
    $("#login-email").focus();
  };

  mod.requestPassword.load = function(email) {
    hideAll();
    prepareRequestPassword(email);
    show("request-password");
    $("#passreq-email").focus();
  };

  mod.resetPassword.load = function(uid, token) {
    hideAll();
    prepareResetPassword(uid, token);
    show("reset-password");
    $("#passreset-password").focus();
  };

  mod.task.load = function(optTid) {
    hideAll();
    task.load(optTid);
    show("task");
  };

  mod.respond.load = function(rid, asUid) {
    hideAll();
    showRespond(rid, asUid);
  };

  mod.init = function () {
    homeInitTabs();
  }

  return mod;
}());

var page = (function() {

  var mod = {};
  var pageNames = [
    "login",
    "home",
    "task",
    "scheduling",
    "respond"
  ];

  /* initialize subentry for each page, e.g. page.home */
  for (var i in pageNames) {
    mod[pageNames[i]] = {};
  }

  mod.home.tab = {
    schedulingTasks: "scheduling-tasks"
  };

  var homeTabNames = [
    mod.home.tab.schedulingTasks,
    mod.home.tab.generalTasks,
    mod.home.tab.archiveTasks
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
            .done(function() { route.nav.path(redirPath); });
        }
      });
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
    var today = new Date();
    var dd = today.getDate();
    log($("#scheduling-icon").text());
    $("#scheduling-icon").text(dd); /* Doesn't work */
    hideAll();
    api.loadActiveTasks();
    homeReplaceTab("scheduling-tasks");
    show("home");
  }

  mod.login.load = function(redirPath) {
    hideAll();
    prepareLogin(redirPath);
    show("login");
    $("#login-email").focus();
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

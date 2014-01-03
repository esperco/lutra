var page = (function() {

  var mod = {
    login: {},
    requestPassword: {},
    resetPassword: {},
    home: {},
    task: {},
    scheduling: {},
    respond: {},
    test: {}
  };

  /*
    Elements to be shown or hidden for each page are defined by the
    class (pageName + "-page").
    If an element must appear on multiple pages, it should receive
    all the classes, such as class="request-password-page reset-password-page".
  */
  var pageSelector = show.create({
    "login":            {classes:["login-page"]},
    "request-password": {classes:["request-password-page"]},
    "reset-password":   {classes:["reset-password-page"]},
    "home":             {classes:["home-page"]},
    "task":             {classes:["task-page"]},
    "scheduling":       {classes:["scheduling-page"]},
    "respond":          {classes:["respond-page"]},
    "test":             {classes:["test-page"]}
  });

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
    util.changeFocus($("#login-email"));
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

    util.changeFocus(input);
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
    util.changeFocus(input);
  }

  /* Load and render different types of pages */

  mod.home.load = function() {
    pageSelector.hideAll();
    home.load();
    pageSelector.show("home");
    display.updateHome();
    util.focus();
  };

  mod.test.load = function() {
    pageSelector.hideAll();
    $("#test-content").children().remove();
    pageSelector.show("test");
    test.load();
    util.focus();
  };

  mod.login.load = function(redirPath) {
    pageSelector.hideAll();
    prepareLogin(redirPath);
    pageSelector.show("login");
    util.focus();
  };

  mod.requestPassword.load = function(email) {
    pageSelector.hideAll();
    prepareRequestPassword(email);
    pageSelector.show("request-password");
    util.focus();
  };

  mod.resetPassword.load = function(uid, token) {
    pageSelector.hideAll();
    prepareResetPassword(uid, token);
    pageSelector.show("reset-password");
    util.focus();
  };

  mod.task.load = function(optTid) {
    pageSelector.hideAll();
    task.load(optTid);
    pageSelector.show("task");
    display.updateChat();
    util.focus();
  };

  mod.respond.load = function(rid, asUid) {
    pageSelector.hideAll();
  };

  return mod;
}());

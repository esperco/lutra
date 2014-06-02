var page = (function() {

  var mod = {
    login: {},
    requestPassword: {},
    resetPassword: {},
    emailVerify: {},
    home: {},
    settings: {},
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
    "email-verify":     {classes:["email-verify-page"]},
    "home":             {classes:["home-page"]},
    "login":            {classes:["login-page"]},
    "request-password": {classes:["request-password-page"]},
    "reset-password":   {classes:["reset-password-page"]},
    "respond":          {classes:["respond-page"]},
    "scheduling":       {classes:["scheduling-page"]},
    "settings":         {classes:["settings-page"]},
    "task":             {classes:["task-page"]},
    "test":             {classes:["test-page"]},
    "token":            {classes:["token-page"]}
  });

  function goto_page(k) {
    observable.onSchedulingStepChanging.notify();
    observable.onSchedulingStepChanging.stopObserve("step");

    pageSelector.show(k);
  }

  /* Login screen */

  function showLoginError(text) {
    $("#login-error-message")
      .text(text)
      .removeClass("hide")
      .addClass("fadeIn");
    $("#login-email")
      .val("")
      .focus()
      .addClass("login-error");
    $("#login-password")
      .val("")
      .addClass("login-error");
    setTimeout(function() {
      $("#login-email").removeClass("login-error");
      $("#login-password").removeClass("login-error");
    },1250);
  }

  function prepareLogin(redirPath) {
    document.title = "Esper - Sign in";
    $(".meeting-path").addClass("hide");
    $(".path-to").addClass("hide");
    $(".page-title").text("");
    $("#login-error-message")
      .removeClass("fadeIn")
      .addClass("hide");
    $("#login-email").val("");
    $("#login-password").val("");
    $("#login-button")
      .unbind('click')
      .click(function() {
        var email = $("#login-email").val();
        var password = $("#login-password").val();
        if (email !== "" && password !== "") {
          login.login(email, password)
            .done(function() {
              route.nav.path(redirPath);
            })
            .fail(showLoginError("The email or password you entered is incorrect."));
        } else {
          showLoginError("Please enter both an email address and a password.");
        }
        return false;
      });
    util.changeFocus($("#login-email"));
  }

  function showRequestMessage(success, input, text) {
    if (success) {
      $("#request-container").addClass("hide");
      $("#request-error-message").addClass("hide");
      $("#request-success-message")
        .text(text)
        .removeClass("hide")
        .addClass("fadeIn");
    } else {
      $("#request-error-message")
        .text(text)
        .removeClass("hide")
        .addClass("fadeIn");
      input
        .val("")
        .focus()
        .addClass("login-error");
      setTimeout(function() {
        input.removeClass("login-error");
      },1250);
    }
  }

  function prepareRequestPassword(email0) {
    $("#request-container").removeClass("hide");
    $("#request-error-message")
      .removeClass("fadeIn")
      .addClass("hide");
    $("#request-success-message")
      .removeClass("fadeIn")
      .addClass("hide");

    var request = $("#passreq-button");
    var input = $("#passreq-email");
    input.val("");
    if (! email0)
      email0 = $("#login-email").val();

    input.val(email0);

    function submit() {
      var email = input.val();
      api.requestPassword(email)
        .done(function() {
          showRequestMessage(true, input, "Check your email for a link to reset your password.");
        })
        .fail(function () {
          showRequestMessage(false, input, "We couldn't find an account with that email address.");
          updateRequestUI();
        });
      return false;
    }

    function isValidEmail(s) {
      return s.length > 0;
    }

    function updateRequestUI() {
      if (isValidEmail(input.val()))
        request.removeClass("disabled");
      else
        request.addClass("disabled");
    }

    request
      .unbind('click')
      .click(submit);

    updateRequestUI();
    util.changeFocus(input);
    util.afterTyping(input, 250, updateRequestUI);
  }

  function showResetError(text) {
    $("#reset-error-message")
      .text(text)
      .removeClass("hide")
      .addClass("fadeIn");
    $("#login-email")
      .val("")
      .focus()
      .addClass("login-error");
    $("#login-password")
      .val("")
      .addClass("login-error");
    setTimeout(function() {
      $("#login-email").removeClass("login-error");
      $("#login-password").removeClass("login-error");
    },1250);
  }

  function prepareResetPassword(uid, token) {
    var reset = $("#passreset-button");
    var input = $("#passreset-password");
    input.val("");


    function submit() {
      var password = input.val();
      api.resetPassword(uid, token, password)
        .done(function(x) {
          login.setLoginInfo(x);
          route.nav.path("");
        })
        .fail(function () {
          showResetError("Oops, something went wrong.");
          updateResetUI();
        });
      return false;
    }

    function isValidPassword(s) {
      return s.length > 0;
    }

    function updateResetUI() {
      if (isValidPassword(input.val()))
        reset.removeClass("disabled");
      else
        reset.addClass("disabled");
    }

    reset
      .unbind('click')
      .click(submit);

    updateResetUI();
    util.changeFocus(input);
    util.afterTyping(input, 250, updateResetUI);
  }

  function prepareEmailVerify(uid, email, token) {
    $("#verify-email-comment")
      .text("Press Confirm to verify the email address " + email);
    $("#verify-email-button")
      .click(function() {
        var json = { email_address: email };
        api.emailVerify(uid, json, token)
          .fail(status_.onErrors([401, 403]))
          .done(route.nav.home);
        return false;
      });
  }

  /* Load and render different types of pages */

  mod.home.load = function() {
    pageSelector.hideAll();
    home.load();
    goto_page("home");
    util.focus();
  };

  mod.settings.load = function() {
    pageSelector.hideAll();
    settings.load();
    goto_page("settings");
    display.updateSettings();
    util.focus();
  };

  mod.test.load = function() {
    pageSelector.hideAll();
    $("#test-content").children().remove();
    goto_page("test");
    test.load();
    util.focus();
  };

  mod.login.load = function(redirPath) {
    pageSelector.hideAll();
    prepareLogin(redirPath);
    goto_page("login");
    util.focus();
  };

  mod.requestPassword.load = function(email) {
    pageSelector.hideAll();
    prepareRequestPassword(email);
    goto_page("request-password");
    util.focus();
  };

  mod.resetPassword.load = function(uid, token) {
    pageSelector.hideAll();
    prepareResetPassword(uid, token);
    goto_page("reset-password");
    util.focus();
  };

  mod.emailVerify.load = function(uid, email, token) {
    pageSelector.hideAll();
    prepareEmailVerify(uid, email, token);
    goto_page("email-verify");
    util.focus();
  };

  mod.task.load = function(tid) {
    pageSelector.hideAll();
    goto_page("task");
    task.load(tid);
    util.focus();
  };

  mod.respond.load = function(rid, asUid) {
    pageSelector.hideAll();
  };

  return mod;
}());

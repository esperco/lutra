var page = (function() {

  var mod = {
    settings: {},
    close: {},
    test: {},
    preferences: {}
  };

  /*
    Elements to be shown or hidden for each page are defined by the
    class (pageName + "-page").
    If an element must appear on multiple pages, it should receive
    all the classes, such as class="request-password-page reset-password-page".
  */
  var pageSelector = show.create({
    "settings": {ids:["settings-page"]},
    "test": {ids:["test-page"]},
    "token": {ids:["token-page"]},
    "preferences": {ids:["preferences-page"]}
  });

  function showPage(k) {
    pageSelector.show(k);
  }


  /* Load and render different types of pages */

  mod.settings.load = function() {
    pageSelector.hideAll();
    showPage("settings");
    log("settings.load()");
    settings.load();
    util.focus();
  };

  mod.test.load = function() {
    pageSelector.hideAll();
    $("#test-content").children().remove();
    showPage("test");
    test.load();
    util.focus();
  };

  mod.preferences.load = function () {
    pageSelector.hideAll();
    showPage("preferences");
    log("Loaded executive preferences!");
    Esper.ExecutivePreferences.load();
    util.focus();
  };

  mod.hide = function() {
    pageSelector.hideAll();
  };

  return mod;
}());

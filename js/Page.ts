module Page {

  /*
    Elements to be shown or hidden for each page are defined by the
    class (pageName + "-page").
    If an element must appear on multiple pages, it should receive
    all the classes, such as class="request-password-page reset-password-page".
  */
  var pageSelector = Show.create({
    "settings": {ids:["settings-page"]},
    "team-settings": {ids:["team-settings-page"]},
    "test": {ids:["test-page"]},
    "token": {ids:["token-page"]},
    "preferences": {ids:["preferences-page"]}
  }, undefined);

  function showPage(k) {
    pageSelector.show(k);
  }


  /* Load and render different types of pages */

  export interface Loadable {
    load : () => void;
  }

  export var settings : Loadable = {
    load: function() {
      pageSelector.hideAll();
      showPage("settings");
      Log.p("settings.load()");
      Settings.load();
      Util.focus();
    }
  }

  export var teamSettings : Loadable = {
    load: function() {
      pageSelector.hideAll();
      showPage("team-settings");
      Log.p("teamSettings.load()");
      TeamSettings.load();
      Util.focus();
    }
  }

  export var test : Loadable = {
    load: function() {
      pageSelector.hideAll();
      $("#test-content").children().remove();
      showPage("test");
      Test.load();
      Util.focus();
    }
  }

  export var preferences : Loadable = {
    load: function() {
      pageSelector.hideAll();
      showPage("preferences");
      Log.p("Loaded executive preferences!");
      Esper.ExecutivePreferences.load();
      Util.focus();
    }
  }

  export function hide() {
    pageSelector.hideAll();
  };

}

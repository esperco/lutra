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
    load : (...args: any[]) => void;
  }

  export var settings : Loadable = {
    load: function() {
      pageSelector.hideAll();
      showPage("settings");
      Log.d("settings.load()");
      Settings.load();
      Util.focus();
    }
  }

  export var teamSettings : Loadable = {
    load: function(teamid) {
      pageSelector.hideAll();
      showPage("team-settings");
      Log.d("TeamSettings.load()", teamid);
      TeamSettings.load(teamid);
      Util.focus();
    }
  }

  export var onboarding : Loadable = {
    load: function(teamid) {
      pageSelector.hideAll();
      showPage("team-settings");
      Log.d("TeamSettings.load()", teamid);
      var onboarding = true;
      TeamSettings.load(teamid, onboarding);
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
      Log.d("Loaded executive preferences!");
      Esper.ExecutivePreferences.load();
      Util.focus();
    }
  }

  export function hide() {
    pageSelector.hideAll();
  };

}

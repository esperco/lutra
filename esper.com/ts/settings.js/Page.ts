module Esper.Page {

  /*
    Elements to be shown or hidden for each page are defined by the
    class (pageName + "-page").
    If an element must appear on multiple pages, it should receive
    all the classes, such as class="request-password-page reset-password-page".
  */
  var pageSelector = Show.create({
    "settings": {ids:["settings-page"]},
    "team-settings": {ids:["team-settings-page"]},
    "login": { ids: ["login-interface"] },
    "test": {ids:["test-page"]},
    "token": {ids:["token-page"]},
    "preferences": {ids:["preferences-page"]},
    "usage": {ids:["usage-page"]},
    "usage-period": {ids:["usage-period-page"]},
    "not-found": {ids:["not-found-page"]}
  }, undefined);

  function showPage(k) {
    $('#esper-loading').fadeOut(600);
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
      Analytics.page(Analytics.Page.Settings);
      Log.d("settings.load()");
      Settings.load();
      Util.focus();
    }
  }

  export var teamSettings : Loadable = {
    load: function(teamid, viewId?: TeamSettings.View) {
      pageSelector.hideAll();
      showPage("team-settings");
      Log.d("TeamSettings.load()", teamid);
      TeamSettings.load(teamid, viewId);
      Util.focus();
    }
  }

  export var notFound: Loadable = {
    load: function() {
      pageSelector.hideAll();
      showPage("not-found");
      Log.d("notFound.load()");
    }
  }

  export var plans : Loadable = {
    load: function(teamid) {
      pageSelector.hideAll();
      showPage("team-settings");
      Log.d("TeamSettings.load()", teamid);
      TeamSettings.load(teamid, TeamSettings.View.Plans);
      Util.focus();
    }
  }

  export var payment : Loadable = {
    load: function(teamid) {
      pageSelector.hideAll();
      showPage("team-settings");
      Log.d("TeamSettings.load()", teamid);
      TeamSettings.load(teamid, TeamSettings.View.Payment);
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

  export var token : Loadable = {
    load: function(token: string) {
      pageSelector.hideAll();
      $("#token-content").children().remove();
      showPage("token");
      Token.load(token);
      Util.focus();
    }
  }

  export function hide() {
    pageSelector.hideAll();
  };

}

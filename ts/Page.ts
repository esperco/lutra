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
    "onboarding": {ids:["onboarding-interface"]},
    "test": {ids:["test-page"]},
    "token": {ids:["token-page"]},
    "preferences": {ids:["preferences-page"]},
    "usage": {ids:["usage-page"]},
    "usage-period": {ids:["usage-period-page"]}
  }, undefined);

  function showPage(k, properties?: Object) {
    $('#init-loading').fadeOut(600);
    pageSelector.show(k);
    Analytics.page(k, properties);
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

  export var onboarding: Loadable = {
    load: function(step=0,
                   opts?: {fromLogin?: boolean, inviteCode?: string}) {
      pageSelector.hideAll();
      showPage("onboarding", {step: step, opts: opts});
      Log.d("Onboarding.load()");
      Onboarding.load(step, opts);
      Util.focus();
    }
  };

  export var plans : Loadable = {
    load: function(teamid) {
      pageSelector.hideAll();
      showPage("team-settings");
      Log.d("TeamSettings.load()", teamid);
      var onboarding = false;
      var plans = true;
      TeamSettings.load(teamid, onboarding, plans);
      Util.focus();
    }
  }

  export var payment : Loadable = {
    load: function(teamid) {
      pageSelector.hideAll();
      showPage("team-settings");
      Log.d("TeamSettings.load()", teamid);
      var onboarding = false;
      var plans = false;
      var payment = true;
      TeamSettings.load(teamid, onboarding, plans, payment);
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

  export var usagePeriod : Loadable = {
    load: function(teamid, periodStart) {
      pageSelector.hideAll();
      showPage("usage-period");
      UsagePeriod.load(teamid, parseInt(periodStart));
      Util.focus();
    }
  }

  export function hide() {
    pageSelector.hideAll();
  };

}

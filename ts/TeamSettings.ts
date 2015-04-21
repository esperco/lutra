/*
  Team settings page
*/

module TeamSettings {

  function toggleOverlay(overlay) {
    if (overlay.css("display") === "none")
      overlay.css("display", "inline-block");
    else
      overlay.css("display", "none");
  }

  function dismissOverlays() {
    $(".overlay-list").css("display", "none");
    $(".overlay-popover").css("display", "none");
    $(".overlay-popover input").val("");
    $(".overlay-popover .new-label-error").hide();
  }

  $(document).on('click', function(e) {
    if (!$(e.target).hasClass("click-safe"))
      dismissOverlays();
  });

  interface TabView {
    name: string;
    tab: JQuery;
    content: JQuery;
    shown: boolean; // whether the tab is shown to this user at all
  }

  var tabViews : TabView[];

  function switchTab(selected: number) {
    List.iter(tabViews, function(x, i) {
      x.tab
        .removeClass("active");
      x.content
        .addClass("hide")
        .removeClass("active");
    });
    var sel = tabViews[selected];
    sel.tab
      .addClass("active");
    sel.content
      .removeClass("hide")
      .addClass("active");
  };

  export function switchTabByName(name: string) {
    var sel;
    List.iter(tabViews, function(x, i) {
      if (x.name === name)
        sel = i;
    });
    if (sel === undefined)
      Log.e("Undefined tab " + name);
    else if (!tabViews[sel].shown)
      Log.e("Cannot switch to hidden tab " + name);
    else
      switchTab(sel);
  }

  function findLastShown(tabs: TabView[]): TabView {
    var lastShown = tabs[0];
    List.iter(tabs, function(x) {
      if (x.shown)
        lastShown = x;
    });
    return lastShown;
  }

  function makeTabView(name: string,
                       tab: JQuery,
                       content: JQuery,
                       shown: boolean):
  TabView {
    return {
      name: name,
      tab: tab,
      content: content,
      shown: shown
    };
  }

  function showTeamSettings(team : ApiT.Team, onboarding? : boolean) {
'''
<div #view>
  <div #tabsDiv style="padding-left:28px">
    <ul class="esper-tab-links">
      <li #tabAcc class="active"><a class="link first">Account</a></li>
      <li #tabCal><a class="link">Calendars</a></li>
      <li #tabPrf><a class="link">Preferences</a></li>
      <li #tabLab><a class="link">Labels</a></li>
      <li #tabUsg><a class="link">Usage</a></li>
      <li #tabAbt><a class="link">About</a></li>
    </ul>
  </div>
  <div class="esper-tab-content">
    <div #contentAcc class="tab-content active"/>
    <div #contentCal class="tab-content"/>
    <div #contentPrf class="tab-content"/>
    <div #contentLab class="tab-content"/>
    <div #contentUsg class="tab-content"/>
    <div #contentAbt class="tab-content"/>
  </div>
</div>
'''

    var tabViewAcc = makeTabView("acc", tabAcc, contentAcc, true);
    var tabViewCal = makeTabView("cal", tabCal, contentCal, true);
    var tabViewPrf = makeTabView("prf", tabPrf, contentPrf, true);
    var tabViewLab = makeTabView("lab", tabLab, contentLab, true);
    var tabViewUsg = makeTabView("usg", tabUsg, contentUsg, true);
    var tabViewAbt = makeTabView("abt", tabAbt, contentAbt, true);
    tabViews /* global */ = [
      tabViewAcc,
      tabViewCal,
      tabViewPrf,
      tabViewLab,
      tabViewUsg,
      tabViewAbt
    ];

    List.iter(tabViews, function(x: TabView, i) {
      x.tab.click(function() { switchTab(i); });
    });

    contentAcc.append(AccountTab.load(team));
    contentCal.append(CalendarsTab.load(team, onboarding));
    contentPrf.append(PreferencesTab.load(team, contentPrf));
    contentAbt.append(AboutTab.load(team, onboarding));

    if (onboarding) {
      // We'll guide the exec through each step
      tabsDiv.remove();
    }

    /* We don't have access to executive email accounts,
     * so executives don't need to configure label sync. */
    if (Login.isExecCustomer(team)) {
      tabViewLab.shown = false;
      tabLab.addClass("hide");
    } else {
      contentLab.append(LabelsTab.load(team));
    }

    if (! (Login.isEsperAssistant() || Login.isAdmin())) {
      tabViewUsg.shown = false;
      tabUsg.addClass("hide");
    } else {
      contentUsg.append(UsageTab.load(team));
    }

    var last = findLastShown(tabViews);
    last.tab.children() // the <a> element
      .addClass("last");

    return view;
  }

  function checkTeamStatus(profiles: ApiT.Profile[], statusContainer) {
    var error = false;
    List.iter(profiles, function(profile) {
      if (!profile.google_access) {
        error = true;
      }
    });
    if (error) {
      var warning = $("<img class='svg-block'/>")
        .appendTo(statusContainer);
      Svg.loadImg(warning, "/assets/img/warning.svg");
      statusContainer.tooltip();
    }
  }

  export function load(teamid : string, onboarding? : boolean) {
'''
<div #view class="settings-container">
  <div class="header clearfix">
    <span #signOut class="header-signout clickable">Sign out</span>
    <a #logoContainer href="#"
       class="img-container-left"/>
    <a href="#" #headerTitle class="header-title">Settings</a>
    <span #arrowContainer class="img-container-left"/>
    <div class="header-exec">
      <div #profilePic class="profile-pic"/>
      <span #teamName class="profile-name exec-profile-name"/>
    </div>
  </div>
  <div class="divider"/>
  <div #main class="clearfix"/>
  <div #footer/>
</div>
'''
    var root = $("#team-settings-page");
    root.children().remove();
    root.append(view);

    var logo = $("<img class='svg-block header-logo'/>")
      .appendTo(logoContainer);
    Svg.loadImg(logo, "/assets/img/logo.svg");

    var arrowEast = $("<img class='svg-block arrow-east'/>")
      .appendTo(arrowContainer);
    Svg.loadImg(arrowEast, "/assets/img/arrow-east.svg");

    var selectedTeam : ApiT.Team =
      List.find(Login.getTeams(), function(team : ApiT.Team) {
        return team.teamid === teamid;
      });

    Api.getProfile(selectedTeam.team_executive, selectedTeam.teamid)
      .done(function(exec) {
        document.title = exec.display_name + " - Team Settings";
        profilePic.css("background-image", "url('" + exec.image_url + "')");
        teamName.text(selectedTeam.team_name);
      });

    headerTitle.click(Page.settings.load);

    Api.getSubscriptionStatus(selectedTeam.teamid)
      .done(function(customer) {
        main.append(showTeamSettings(selectedTeam, onboarding));
        footer.append(Footer.load());
        if (onboarding) switchTabByName("cal");
      });

    signOut.click(function() {
      Login.clearLoginInfo();
      Signin.signin(function(){}, undefined, undefined, undefined);
      return false;
    });
  }

}

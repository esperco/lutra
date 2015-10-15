/*
  Team settings page
*/

module Esper.TeamSettings {

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
    id: View;
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

  export function switchTabById(id: View) {
    var sel;
    List.iter(tabViews, function(x, i) {
      if (x.id === id)
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

  function makeTabView(id: View,
                       tab: JQuery,
                       content: JQuery,
                       shown: boolean):
  TabView {
    return {
      id: id,
      tab: tab,
      content: content,
      shown: shown
    };
  }

  function showTeamSettings(team: ApiT.Team, viewId?: View) {
  '''
<div #view>
  <div #tabsDiv style="padding-left:28px">
    <ul class="esper-tab-links">
      <li #tabAcc class="active"><a class="link first">Account</a></li>
      <li #tabCal><a class="link">Calendars</a></li>
      <li #tabPrf><a class="link">Preferences</a></li>
      <li #tabWkf><a class="link">Workflows</a></li>
      <li #tabLab><a class="link">Labels</a></li>
      <li #tabTmp><a class="link">Templates</a></li>
    </ul>
  </div>
  <div #tab class="esper-tab-content">
    <div #contentAcc class="tab-content active"/>
    <div #contentCal class="tab-content"/>
    <div #contentPrf class="tab-content"/>
    <div #contentWkf class="tab-content"/>
    <div #contentLab class="tab-content"/>
    <div #contentTmp class="tab-content"/>
  </div>
</div>
'''

    var tabViewAcc = makeTabView(View.Account, tabAcc, contentAcc, true);
    var tabViewCal = makeTabView(View.Calendars, tabCal, contentCal, true);
    var tabViewPrf = makeTabView(View.Preferences, tabPrf, contentPrf, true);
    var tabViewWkf = makeTabView(View.Workflows, tabWkf, contentWkf, true);
    var tabViewLab = makeTabView(View.Labels, tabLab, contentLab, true);
    var tabViewTmp = makeTabView(View.Templates, tabTmp, contentTmp, true);
    tabViews /* global */ = [
      tabViewAcc,
      tabViewCal,
      tabViewPrf,
      tabViewWkf,
      tabViewLab,
      tabViewTmp,
    ];

    List.iter(tabViews, function(x: TabView, i) {
      x.tab.click(function() { switchTab(i); });
    });

    var plans = (viewId === View.Plans);
    var payment = (viewId === View.Payment);
    if (plans || payment) {
      delete viewId;
    }
    contentAcc.append(AccountTab.load(team, plans, payment));
    if (Login.isNylas()) {
      tabViewCal.shown = false;
      tabCal.remove();
      contentCal.remove();
    } else {
      contentCal.append(CalendarsTab.load(team));
    }
    contentPrf.append(PreferencesTab.load(team, contentPrf));
    contentWkf.append(WorkflowsTab.load(team, contentWkf));
    contentTmp.append(TemplateTab.load(team, contentTmp))

    /* We don't have access to executive email accounts,
     * so executives don't need to configure label sync. */
    if (Login.isExecCustomer(team)) {
      tabViewLab.shown = false;
      tabLab.remove();
      contentLab.remove();
    } else {
      contentLab.append(LabelsTab.load(team));
    }

    var last = findLastShown(tabViews);
    last.tab.children() // the <a> element
      .addClass("last");

    if (viewId) {
      switchTabById(viewId);
    }

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


  export enum View {
    Account,
    Plans,
    Payment,
    Calendars,
    Preferences,
    Workflows,
    Labels,
    Templates
  }

  export function load(teamid: string, viewId?: View) {
'''
<div #view class="settings-container">
  <div #headerDiv class="header clearfix">
    <span #signOut class="header-signout clickable">Sign out</span>
    <a #logoContainer href="#!"
       class="img-container-left"/>
    <a href="#" #headerTitle class="header-title">Settings</a>
    <span #arrowContainer class="img-container-left"/>
    <div class="header-exec">
      <div #profilePic class="profile-pic"/>
      <span #teamName class="profile-name exec-profile-name"/>
    </div>
  </div>
  <div #divideLine class="divider"/>
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
        document.title = "Sign Up | Esper"
        profilePic.css("background-image", "url('" + exec.image_url + "')");
        teamName.text(selectedTeam.team_name);
      });

    headerTitle.click(Page.settings.load);

    Api.getProfile(selectedTeam.team_executive, selectedTeam.teamid)
      .done(function(exec) {
        document.title = exec.display_name + " - Team Settings";
      });

    main.append(showTeamSettings(selectedTeam, viewId));
    footer.append(Footer.load());

    signOut.click(Login.logout);
  }

}

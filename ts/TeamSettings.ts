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

  export function switchTab(i) {
    var tab = $('.esper-tab-content .tab' + i);
    var link = $('.esper-tab-links .link' + i);
    tab.show().siblings().hide();
    if (link.hasClass("disabled"))
      $('.esper-tab-links .link').addClass("disabled");
    link.removeClass("disabled");
    link.parent('li').addClass('active').siblings().removeClass('active');
  };

  function showTeamSettings(team : ApiT.Team, onboarding? : boolean) {
'''
<div #view>
  <div #tabsDiv style="padding-left:28px">
    <ul class="esper-tab-links">
      <li class="active"><a #tab1 class="link link1 first">Account</a></li>
      <li><a #tab2 class="link link2">Calendars</a></li>
      <li><a #tab3 class="link link3">Preferences</a></li>
      <li><a #tab4 class="link link4 last">LabelSync</a></li>
    </ul>
  </div>
  <div class="esper-tab-content">
    <div #content1 class="tab tab1 active"/>
    <div #content2 class="tab tab2"/>
    <div #content3 class="tab tab3"/>
    <div #content4 class="tab tab4"/>
  </div>
</div>
'''

    tab1.click(function() { switchTab(1); });
    tab2.click(function() { switchTab(2); });
    tab3.click(function() { switchTab(3); });

    content1.append(AccountTab.load(team, onboarding));
    content2.append(CalendarsTab.load(team, onboarding));
    content3.append(PreferencesTab.load(team, onboarding, content3));

    if (onboarding) {
      // We'll guide the exec through each step
      tabsDiv.remove();
    }

    /* We don't have access to executive email accounts,
     * so executives don't need to configure label sync. */
    if (Login.isExecCustomer(team)) {
      tab4.remove();
      content4.remove();
      tab3.addClass("last");
    } else {
      tab4.click(function() { switchTab(4); });
      content4.append(LabelSyncTab.load(team));
    }

    return view;
  }

  function checkTeamStatus(profiles, statusContainer) {
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

    Api.getSubscriptionStatus(Login.me(), selectedTeam.teamid)
      .done(function(customer) {
        if (onboarding) {
          main.append(showTeamSettings(selectedTeam, onboarding));
          footer.append(Footer.load());
          var mem = customer.status;
          if (Login.data.missing_shared_calendar)
            switchTab(2);
          else if (mem === "Trialing" || mem === "Active")
            switchTab(3);
        } else {
          main.append(showTeamSettings(selectedTeam, onboarding));
          footer.append(Footer.load());
        }
      });

    signOut.click(function() {
      Login.clearLoginInfo();
      Signin.signin(function(){}, undefined, undefined, undefined);
      return false;
    });
  }

}

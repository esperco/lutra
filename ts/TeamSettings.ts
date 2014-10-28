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

  function showTeamSettings(team) {
'''
<div #view>
  <div style="padding-left:28px">
    <ul class="esper-tab-links">
      <li class="active"><a #tab1 id="tab1" class="link first">Account</a></li>
      <li><a #tab2 id="tab2" class="link">Preferences</a></li>
      <li><a #tab3 id="tab3" class="link">Calendars</a></li>
      <li><a #tab4 id="tab4" class="link last">LabelSync</a></li>
    </ul>
  </div>
  <div class="esper-tab-content">
    <div #content1 id="tab1" class="tab active"/>
    <div #content2 id="tab2" class="tab"/>
    <div #content3 id="tab3" class="tab"/>
    <div #content4 id="tab4" class="tab"/>
  </div>
</div>
'''

    tab1.click(function() { switchTab(tab1); });
    tab2.click(function() { switchTab(tab2); });
    tab3.click(function() { switchTab(tab3); });
    tab4.click(function() { switchTab(tab4); });

    function switchTab(tab) {
      var currentAttrValue = "#" + tab.attr("id");
      $('.esper-tab-content ' + currentAttrValue).show().siblings().hide();
      tab.parent('li').addClass('active').siblings().removeClass('active');
    };

    content1.append(AccountTab.load(team));
    content2.append(PreferencesTab.load(team));
    content3.append(CalendarsTab.load(team));
    content4.append(LabelSyncTab.load(team));

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

  export function load(teamid) {
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
      <span #execName class="profile-name exec-profile-name"/>
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
        execName.text(exec.display_name);
      });

    main.append(showTeamSettings(selectedTeam));

    footer.append(Footer.load());

    headerTitle.click(Page.settings.load);

    signOut.click(function() {
      Login.clearLoginInfo();
      Signin.signin(function(){}, undefined, undefined, undefined);
      return false;
    });
  }

}

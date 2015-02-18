/*
  Main settings page
*/

module Settings {

  export function resetOverlay(overlay) {
    if (overlay.view.hasClass("invite-popover")) {
      overlay.inviteEmail.show();
      overlay.invited.hide();
      overlay.addBtn
        .prop("disabled", true)
        .show();
      overlay.doneBtn
        .prop("disabled", true)
        .hide();
      overlay.cancelBtn.text("Cancel");
    } else if (overlay.view.hasClass("new-label-popover")) {
      overlay.newLabel.removeClass("disabled");
      overlay.error.hide();
      overlay.inlineSpinner.hide();
      overlay.save
        .prop("disabled", true)
        .show();
    }
    overlay.view.removeClass("reset");
  }

  export function togglePopover(overlay) {
    if (overlay.view.hasClass("reset"))
      resetOverlay(overlay);
    if (overlay.view.css("display") === "none") {
      overlay.view.css("display", "inline-block");
      if (overlay.view.hasClass("invite-popover"))
        overlay.inviteEmail.focus();
      else if (overlay.view.hasClass("new-label-popover"))
        overlay.newLabel.focus();
    } else {
      overlay.view.css("display", "none");
    }
  }

  export function toggleList(overlay) {
    if (overlay.css("display") === "none")
      overlay.css("display", "inline-block");
    else
      overlay.css("display", "none");
  }

  export function dismissOverlays() {
    $(".overlay-list").css("display", "none");
    $(".overlay-popover").css("display", "none");
    $(".overlay-popover").addClass("reset");
    $(".overlay-popover input").val("");
  }

  $(document).on('click', function(e) {
    if (!$(e.target).hasClass("click-safe"))
      dismissOverlays();
  });

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

  function viewOfTeam(team) {
'''
<div #view class="team-row clearfix">
  <div #cogContainer class="img-container-right"/>
  <div #statusContainer
       class="img-container-right team-status"
       data-toggle="tooltip"
       data-placement="left"
       title="Some team members may need to be reauthorized."/>
  <div #profPic class="profile-pic"/>
  <div #name class="profile-name"/>
  <div class="profile-email gray">
    Account: <span #email/>
  </div>
  <div #aliasSection class="profile-email gray">
    Aliases: <span #aliases/>
  </div>
  <div #addEmail class="profile-email link">Add another email address</div>
</div>
'''
    var cog = $("<img class='svg-block team-cog clickable'/>")
      .appendTo(cogContainer);
    Svg.loadImg(cog, "/assets/img/cog.svg");

    var members =
      List.union([team.team_executive], team.team_assistants, undefined);
    Deferred.join(List.map(members, function(uid) {
      return Api.getProfile(uid, team.teamid);
    }))
      .done(function(profiles) { checkTeamStatus(profiles, statusContainer); });

    aliasSection.hide();
    Api.getProfile(team.team_executive, team.teamid)
      .done(function(profile) {

        if (profile.image_url !== undefined)
          profPic.css("background-image", "url('" + profile.image_url + "')");
        name.text(team.team_name);
        email.text(profile.email);
        if (profile.other_emails.length > 0) {
          aliasSection.show();
          aliases.append(profile.other_emails[0]);
          List.iter(profile.other_emails.slice(1), function(e) {
            aliases.append(", " + e);
          });
        }

        var currentAliases = profile.other_emails;

        function addAnotherEmail() {
          // Replace the link with the input box and save button
          var newEmail = $("<input type='text' class='profile-email' size=20/>");
          var saveEmail = $("<button class='button-primary'>Save</button>");
          addEmail.remove();
          view.append(newEmail).append(" ").append(saveEmail);

          saveEmail.click(function() {
            var email = newEmail.val();
            // If given bad data, ignore it and put a red border on the input
            if (email.length === 0 || !Util.validateEmailAddress(email)) {
              newEmail.css("border", "medium solid red");
              return; // Ignore bad data
            }

            // Save the email to the server and update the current display
            currentAliases.push(email);
            var uniqEmails = {
              emails: List.union(currentAliases, [], undefined)
            };
            Api.putAccountEmails(team.teamid, profile.profile_uid, uniqEmails)
              .done(function() {
                if (aliases.is(":hidden")) {
                  aliasSection.show();
                  aliases.append(email);
                } else {
                  aliases.append(", " + email);
                }
                // Now remove the input/button and put the link back
                newEmail.remove();
                saveEmail.remove();
                view.append(addEmail.click(addAnotherEmail));
              });
          });
        }

        addEmail.click(addAnotherEmail);

    }); // end of Api.getProfile.done

    cogContainer.click(function() {
      location.hash = "#!team-settings/" + team.teamid;
    })

    return view;
  }

  function renderAdminSection() {
'''
<div #view style="margin-top:16px">
  <div class="esper-h2">New Team Invitation URL</div>
  <div class="generate-row clearfix">
    <button #button
            class="button-primary col-xs-3 generate">Generate</button>
    <input #url type="text" class="generate-input col-xs-9 disabled"
           onclick="this.select();"/>
  </div>
  <div>
    <a href="#" #clearSync class="danger-link">Log out of all Esper accounts</a>
  </div>
</div>
'''
    clearSync.click(function() {
      Login.clearAllLoginInfo();
      Signin.signin(function(){});
    });

    button.click(function() {
      Api.inviteCreateTeam()
        .done(function(x) {
          url
            .val(x.url)
            .removeClass("disabled")
            .select();
        });
    });

    return view;
  }

  var firstTime = true;

  export function load() {
'''
<div #view class="settings-container">
  <div class="header clearfix">
    <a #logoContainer href="#"
       class="img-container-left"/>
    <div class="header-title">Settings</div>
    <span #signOut class="header-signout clickable">Sign out</span>
  </div>
  <div class="divider"/>
  <div #install class="install clearfix">
    <div #closeContainer class="img-container-right close clickable"/>
    <div #chromeLogoContainer
         class="img-container-right chrome-logo-container animated fadeIn"/>
    <div class="esper-h1 install-h1 gray animated fadeInLeft">
      Bring your inbox and calendar closer together.
    </div>
    <div class="esper-h2 install-h2 animated fadeInLeft">
      <a href="https://chrome.google.com/webstore/detail/esper/jabkchbdomjjlbahjdjemnnghkakfcog"
         target="_blank">Install the Esper Chrome extension</a>
      <span #arrowContainer class="img-container-inline"/>
    </div>
  </div>
  <div #main class="clearfix">
    <div class="leftCol settings-section col-sm-6">
      <div class="esper-h1 settings-section-title">My Profile</div>
      <div class="clearfix" style="margin-top:16px">
        <div #profPic class="profile-pic"/>
        <div #myName class="profile-name"/>
        <div #myEmail class="profile-email gray"/>
      </div>
      <div class="toggle-advanced">
        <a #toggleAdvanced href="#" class="link">Show advanced</a>
      </div>
      <div #advanced class="profile-advanced">
        <div #uid/>
        <a #revoke
           href="#"
           class="danger-link">Deauthorize this account</a>
      </div>
      <div #adminSection class="admin hide">
        <div class="esper-h1 settings-section-title">Admin Tools</div>
        <div #adminBody/>
      </div>
    </div>
    <div class="rightCol settings-section col-sm-6">
      <div class="esper-h1 settings-section-title">Executive Teams</div>
      <div #execTeams class="team-list"/>
    </div>
  </div>
  <div #footer/>
</div>
'''
    var root = $("#settings-page");
    root.children().remove();
    root.append(view);
    document.title = "Settings - Esper";

    var logo = $("<img class='svg-block header-logo'/>")
      .appendTo(logoContainer);
    Svg.loadImg(logo, "/assets/img/logo.svg");

    var close = $("<img class='svg-block'/>")
      .appendTo(closeContainer);
    Svg.loadImg(close, "/assets/img/close.svg");

    var chrome = $("<img class='svg-block chrome-logo'/>")
      .appendTo(chromeLogoContainer);
    Svg.loadImg(chrome, "/assets/img/chrome.svg");

    var arrowEast = $("<img class='svg-block arrow-east'/>")
      .appendTo(arrowContainer);
    Svg.loadImg(arrowEast, "/assets/img/arrow-east.svg");

    Api.getMyProfile()
      .done(function(profile){
        if (profile.image_url !== undefined)
          profPic.css("background-image", "url('" + profile.image_url + "')");
        myName.text(profile.display_name);
        myEmail.text(Login.myEmail());
      });

    uid
      .append("<span>UID: </span>")
      .append("<span class='gray'>" + Login.me() + "</span>");

    var teams = Login.getTeams();
    if (teams.length === 1 && firstTime) {
      firstTime = false;
      var joinTeam = Login.data.missing_shared_calendar;
      if (Util.isString(joinTeam))
        // This is a new exec customer who needs to be onboarded
        location.hash = "#!join/" + joinTeam;
      else if (teams[0] !== null)
        location.hash = "#!team-settings/" + teams[0].teamid;
    } else {
      List.iter(teams, function(team) {
        execTeams.append(viewOfTeam(team));
      });
    }

    footer.append(Footer.load());

    signOut.click(function() {
      Login.clearLoginInfo();
      Signin.signin(function(){}, undefined, undefined, undefined);
      return false;
    });

    closeContainer.click(function() { install.slideUp(); });

    toggleAdvanced.click(function() {
      if (advanced.css("display") === "none") {
        advanced.slideDown("fast");
        toggleAdvanced.text("Hide advanced");
      } else {
        advanced.slideUp("fast");
        toggleAdvanced.text("Show advanced");
      }
    })

    revoke.click(function() {
      Api.postGoogleAuthRevoke()
        .done(function() {
          signOut.click();
        });
      return false;
    });

    Api.getGoogleAuthInfo(document.URL)
      .done(function(info) {
        if (info.has_token)
          revoke.removeClass("hide");
        else {
          window.location.assign(info.google_auth_url);
        }
      });

    if (Login.isAdmin()) {
      adminBody.append(renderAdminSection());
      adminSection.removeClass("hide");
    }
  }
}

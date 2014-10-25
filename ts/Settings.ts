/*
  Team settings page
*/

module Settings {

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

  // TODO Styling
  function makeCalendarSelectors(team, root) {
'''
<div #view>
  <div style="float: left; width: 40%">
    <div><b>All calendars:</b></div>
    <div style="font-size: 75%">(double-click to add)</div>
    <select #allCals multiple="multiple" size=5 />
  </div>
  <div>
    <div><b>Team calendars:</b></div>
    <div style="font-size: 75%">(double-click to remove)</div>
    <select #teamCals multiple="multiple" size=5 />
  </div>
  <br/>
  <div>
    <button #saveCals class="button-primary">Save Team Calendars</button>
  </div>
</div>
'''
    function removeOpt() {
      $(this).remove();
    }

    List.iter(team.team_calendars, function(cal) {
      var opt = $("<option class='esper-calendar-option'"
                  + "value='" + cal.google_cal_id + "'>"
                  + cal.calendar_title + "</option>");
      opt.dblclick(removeOpt)
         .data("timezone", cal.calendar_timezone)
         .appendTo(teamCals);
    });

    Api.getCalendarList().done(function(x) {
      List.iter(x.named_calendar_ids, function(cal) {
        var opt = $("<option class='esper-calendar-option'"
                    + "value='" + cal.google_cal_id + "'>"
                    + cal.calendar_title + "</option>");
        opt.appendTo(allCals)
           .data("timezone", cal.calendar_timezone)
           .dblclick(function() {
             $(this).clone()
                    .data("timezone", cal.calendar_timezone)
                    .off("dblclick")
                    .dblclick(removeOpt)
                    .appendTo(teamCals);
           });
      });

      saveCals.click(function() {
        var teamOpts = teamCals.find(".esper-calendar-option");
        var teamCalIDs = [];
        var calData = {};
        teamOpts.each(function(i) {
          var opt = $(teamOpts[i]);
          var calID = opt.val();
          teamCalIDs.push(calID);
          calData[calID] = {
            google_cal_id: calID,
            calendar_timezone: opt.data("timezone"),
            calendar_title: opt.text()
          };
        });
        // remove duplicates
        var uniqueCalIDs = List.union(teamCalIDs, [], undefined);
        var teamCalendars = List.map(uniqueCalIDs, function(calID) {
          return calData[calID];
        });
        Api.putTeamCalendars(team.teamid, { named_calendar_ids: teamCalendars })
          .done(function() { window.location.reload(); });
      });

      root.append(view);
    });
  }

  function makeAliasSection(team, root) {
'''
<div #view>
  <div style="float: left; width: 40%">
    <div style="width: 80%">
      <b>Email addresses for calendar invites and reminders:</b>
    </div>
    <select #teamAliases multiple size=3 style="width: 80%"/>
  </div>
  <div>
    <div><b>Add an email address:</b></div>
    <input #newAlias type="text"/>
    <button #saveAlias class="button-primary">Add</button>
  </div>
</div>
'''
    function setTeamEmails() {
      var teamOpts = teamAliases.find(".esper-email-alias");
      var teamEmails = [];
      teamOpts.each(function(i) {
        var opt = $(teamOpts[i]);
        teamEmails.push(opt.text());
      });
      // remove duplicates
      var uniqueEmails = List.union(teamEmails, [], undefined);
      Api.putTeamEmails(team.teamid, { emails: uniqueEmails })
        .done(function() { team.team_email_aliases = uniqueEmails; });
    }

    function removeOpt() {
      $(this).remove();
      setTeamEmails();
    }

    List.iter(team.team_email_aliases, function(email) {
      var opt = $("<option class='esper-email-alias'>"
                  + email + "</option>");
      opt.dblclick(removeOpt)
         .appendTo(teamAliases);
    });

    saveAlias.click(function() {
      var email = newAlias.val();
      if (email === "") return;
      newAlias.val("");
      $("<option class='esper-email-alias'>" + email + "</option>")
        .dblclick(removeOpt)
        .appendTo(teamAliases);
      setTeamEmails();
    });

    root.append(view);
  }

  function viewOfCalendarTab(team) {
'''
<div #view>
  <div class="esper-h1">Team Calendars</div>
  <div #description class="calendar-setting-description"/>
  <div #calendarSelector></div>
  <br/>
  <div #emailAliases></div>
</div>
'''
    description
      .text("Select the calendars to be used for this team.");

    makeCalendarSelectors(team, calendarSelector);
    makeAliasSection(team, emailAliases);

    return view;
  }

  function viewOfLabelRow(team, label, syncedLabelsList) {
'''
<li #row class="table-row labels-table clearfix">
  <div #labelText class="col-xs-5"/>
  <div #status class="col-xs-4">
    <div #dot class="sync-status-dot"/>
    <span #statusText class="gray"/>
  </div>
  <div class="col-xs-3 sync-action">
    <a #action href="#" class="link"/>
  </div>
</li>
'''
    labelText.text(label);

    function disable() {
      status.css("opacity", "0.5");
      action
        .css("opacity", "0.5")
        .css("pointer-events", "none");
    }

    function enable() {
      status.css("opacity", "1");
      action
        .css("opacity", "1")
        .css("pointer-events", "auto");
    }

    function showSyncing() {
      enable();
      dot.css("background", "#2bb673");
      statusText.text("Syncing");
      action.text("Stop syncing");
    }

    function showNotSyncing() {
      enable();
      dot.css("background", "#d9534f");
      statusText.text("Not syncing");
      action.text("Sync");
    }

    function toggleSync() {
      disable();
      Api.getSyncedLabels(team.teamid).done(function(syncedLabels) {
        if (List.mem(syncedLabels.labels, label)) {
          var index = syncedLabels.labels.indexOf(label);
          if (index != undefined) {
            syncedLabels.labels.splice(index, 1);
          }
          Api.putSyncedLabels(team.teamid, { labels: syncedLabels.labels })
            .done(function() { showNotSyncing(); });
        } else {
          syncedLabels.labels.push(label);
          Api.putSyncedLabels(team.teamid, { labels: syncedLabels.labels })
            .done(function() { showSyncing(); });
        }
      });
    }

    if (List.mem(syncedLabelsList, label))
      showSyncing();
    else
      showNotSyncing();

    action.click(toggleSync);

    return row;
  }

  function viewOfLabelSyncTab(team) {
'''
<div #view>
  <div class="exec-profile clearfix">
    <div #labelSyncContainer />
    <div #description class="label-sync-description"/>
  </div>
  <div class="table-header">Shared Labels</div>
  <ul #labels class="assistants-list">
    <div #tableSpinner class="spinner table-spinner"/>
    <div #tableEmpty
         class="table-empty">There are no shared labels across this team.</div>
  </ul>
  <div class="clearfix">
    <div #labelIconContainer class="img-container-left"/>
    <a #create disabled
       class="link popover-trigger click-safe"
       style="float:left">Create new shared label</a>
  </div>
  <div #newLabelPopover class="new-label-popover overlay-popover click-safe">
    <div class="overlay-popover-header click-safe">New shared label</div>
    <div class="overlay-popover-body click-safe">
      <input #newLabel class="new-label-input click-safe"
             autofocus placeholder="Untitled label"/>
      <div class="clearfix click-safe">
        <div #error class="new-label-error click-safe">
          This label already exists.</div>
        <button #cancel class="button-secondary label-btn">Cancel</button>
        <button #save class="button-primary label-btn click-safe"
                disabled>Save</button>
        <div #inlineSpinner class="spinner inline-spinner"/>
    </div>
  </div>
</div>
'''
    var labelSync = $("<img class='svg-block label-sync-icon'/>")
      .appendTo(labelSyncContainer);
    Svg.loadImg(labelSync, "/assets/img/LabelSync.svg");

    var labelIcon = $("<img class='svg-block label-icon'/>")
      .appendTo(labelIconContainer);
    Svg.loadImg(labelIcon, "/assets/img/new-label.svg");

    description
      .text("LabelSync lets you share email labels across your team. Below " +
        "are labels that currently appear in every team member's account.");

    tableSpinner.show();

    // local array for keyup function
    var sharedLabelsList;

    Api.getSharedLabels(team.teamid).done(function(sharedLabels) {
      Api.getSyncedLabels(team.teamid).done(function(syncedLabels) {
        sharedLabelsList = sharedLabels.labels;
        var allLabels =
          List.union(sharedLabels.labels, syncedLabels.labels, undefined);
        tableSpinner.hide();
        if (allLabels.length > 0) {
          labels.children().remove();
          allLabels.sort();
          List.iter(allLabels, function(label) {
            labels.append(viewOfLabelRow(team, label, syncedLabels.labels));
          });
        } else {
          tableEmpty.show();
        }
        create.click(function() {
          toggleOverlay(newLabelPopover);
          newLabel.focus();
        });
      });
    });

    newLabel.keyup(function() {
      Log.p(newLabel.val());
      if (newLabel.val() != "") {
        if (sharedLabelsList.indexOf(newLabel.val()) > -1) {
          save.attr("disabled", "true");
          error.css("display", "inline-block");
        } else {
          save.removeAttr("disabled");
          error.hide();
        }
      }
      else
        save.attr("disabled", "true");
    });

    save.click(function() {
      inlineSpinner.show();
      newLabel.addClass("disabled");
      save.attr("disabled", "true");
      var label = newLabel.val();
      Api.getSyncedLabels(team.teamid).done(function(syncedLabels) {
        sharedLabelsList.push(label);
        syncedLabels.labels.push(label);
        Api.putSyncedLabels(team.teamid, { labels: syncedLabels.labels })
          .done(function() {
            inlineSpinner.hide();
            toggleOverlay(newLabelPopover);
            newLabel
              .val("")
              .removeClass("disabled");
            tableEmpty.hide();
            var newRow = viewOfLabelRow(team, label, syncedLabels.labels);
            labels.prepend(newRow);
            newRow.addClass("purple-flash");
          });
      });
    });

    cancel.click(function() {
      toggleOverlay(newLabelPopover);
      newLabel.val("");
      error.hide();
    })

    return view;
  }

  function generateInviteURL(team: ApiT.Team,
                             role: string,
                             toEmail: string) {
    dismissOverlays();
    var invite = {
      from_uid: Login.me(),
      teamid: team.teamid,
      role: role,
      force_email: toEmail
    };
    Log.p("Invite:", invite);
    return Api.inviteJoinTeam(invite);
  }

  function composeInviteWithURL(url, emailTo) {
    var body =
      "Please click the link and sign in with your Google account:\n\n"
      + "  " + url;

    return GmailCompose.compose({
      to: emailTo,
      subject: "Join my team on Esper",
      body: body
    });
  }

  function renderInviteDialog(team) {
'''
<div #view class="member-row">
  <div class="clearfix">
    <div #emailContainer class="img-container-left"/>
    <div #invite class="invite-action clickable">
      <a class="link click-safe" style="float:left">Invite new team member</a>
      <span class="caret-south click-safe"/>
    </div>
  </div>

  <div #invitePopover class="overlay-popover click-safe">
    <div>
      Email:
      <input #emailInput
             class="new-label-input click-safe"
             autofocus placeholder="name@example.com"/>
    </div>
    <button #continueButton class="button-secondary click-safe">
      Continue
    </button>
    <ul #roleSelector class="hide invite-options">
      <li class="unselectable click-safe">Select a role:</li>
      <li><a #assistant href="#" target="_blank"
             class="click-safe">Assistant</a></li>
      <li><a #executive href="#" target="_blank"
             class="click-safe">Executive</a></li>
    </ul>
  </div>
</div>
'''
    var emailIcon = $("<img class='svg-block invite-icon'/>")
      .appendTo(emailContainer);
    Svg.loadImg(emailIcon, "/assets/img/email.svg");

    invite.click(function() { toggleOverlay(invitePopover); });

    continueButton
      .click(function() {
        var toEmail = emailInput.val();
        roleSelector.removeClass("hide");
        generateInviteURL(team, "Assistant", toEmail)
          .done(function(x) {
            assistant.attr("href", composeInviteWithURL(x.url, toEmail));
          });
        generateInviteURL(team, "Executive", toEmail)
          .done(function(x) {
            executive.attr("href", composeInviteWithURL(x.url, toEmail));
          });
        return false;
      });

    return view;
  }

  function displayAssistants(assistantsList, team, profiles) {
    List.iter(profiles, function(profile) {
'''
<li #row class="table-row assistants-table clearfix">
  <div class="col-xs-6">
    <div #name/>
    <div #email class="gray"/>
  </div>
  <div class="col-xs-1 assistant-row-status">
    <div #statusContainer
         data-toggle="tooltip"
         data-placement="right"
         title="Reauthorization required."/>
  </div>
  <div #actions class="col-xs-5 assistant-row-actions"/>
</li>
'''
      function refresh() {
        /*
          Reload the whole document.
          It could be improved but the team structure known by the login module
          would need to be refreshed.
        */
        location.reload(true);
      }

      var execUid = team.team_executive;
      var memberUid = profile.profile_uid;

      name.text(profile.display_name);
      email.text(profile.email);

      if (!profile.google_access) {
        var warning = $("<img class='svg-block'/>")
          .appendTo(statusContainer);
        Svg.loadImg(warning, "/assets/img/warning.svg");
        (<any> statusContainer).tooltip(); // FIXME
      }

(function(){ // a block scope, a block scope, my kingdom for a block scope!
      if (memberUid !== Login.me()
          && List.mem(team.team_assistants, memberUid)) {
'''
<span #removeSpan>
  <a #removeLink href="#" class="danger-link">Remove</a>
</span>
'''
        removeLink.appendTo(actions)
        removeLink.click(function() {
          Api.removeAssistant(team.teamid, memberUid)
            .done(function() { refresh(); });
        });

        actions.append($("<span class='text-divider'>|</span>"));
      } else {
        name
          .text("")
          .append($("<span>" + profile.display_name + "</span>"))
          .append($("<span class='semibold'> (Me)</span>"));
      }
})();

(function(){
      if (memberUid !== execUid) {
'''
<span #makeExecSpan>
  <a #makeExecLink href="#" class="link">Make Executive</a>
</span>
'''
        makeExecSpan.appendTo(actions);
        makeExecLink.click(function() {
          Api.setExecutive(team.teamid, memberUid)
            .done(function() { refresh(); });
        });
      }
})();

      assistantsList.append(row);
    });
  }

  function viewOfMembersTab(team) {
'''
<div #view>
  <div class="exec-profile clearfix">
    <div #profilePic class="profile-pic"/>
    <div style="height: 27px">
      <span #execName class="profile-name exec-profile-name"/>
      <span class="exec-label">EXECUTIVE</span>
      <span #execStatusContainer
       class="exec-status"
       data-toggle="tooltip"
       data-placement="right"
       title="Reauthorization required."/>
    </div>
    <div #execEmail class="profile-email gray"/>
  </div>
  <div class="table-header">Assistants</div>
  <ul #assistantsList class="assistants-list">
    <div #spinner class="spinner table-spinner"/>
    <div #tableEmpty
         class="table-empty">There are no assistants on this team.</div>
  </ul>
  <div #invitationRow/>
</div>
'''
    spinner.show();

    Api.getProfile(team.team_executive, team.teamid)
      .done(function(exec) {
        profilePic.css("background-image", "url('" + exec.image_url + "')");
        if (team.team_executive === Login.me()) {
          execName
            .append($("<span>" + exec.display_name + "</span>"))
            .append($("<span class='semibold'> (Me)</span>"));
        } else {
          execName.text(exec.display_name);
        }
        execEmail.text(exec.email);
        if (!exec.google_access) {
          var warning = $("<img class='svg-block'/>")
            .appendTo(execStatusContainer);
          Svg.loadImg(warning, "/assets/img/warning.svg");
          (<any> execStatusContainer).tooltip(); // FIXME
        }
      });

    Deferred.join(List.map(team.team_assistants, function(uid) {
      return Api.getProfile(uid, team.teamid);
    }))
      .done(function(profiles) {
        spinner.hide();
        if (profiles.length > 0)
          displayAssistants(assistantsList, team, profiles);
        else
          tableEmpty.show();
      });

    invitationRow.append(renderInviteDialog(team));

    return view;
  }

  function showTeamSettings(team) {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog team-settings">
    <div class="modal-content">
      <div style="text-align:center">
        <ul class="esper-tab-links">
          <li class="active"><a #tab1 href="#" id="tab1" class="first">
            <img #members class="svg-block esper-tab-icon"/>
            <span>Members</span>
          </a></li>
          <li><a #tab2 href="#" id="tab2">
            <img #labelSync class="svg-block esper-tab-icon"/>
            <span>LabelSync</span>
          </a></li>
          <li><a #tab3 href="#" id="tab3" class="last">
            <img #calendar class="svg-block esper-tab-icon"/>
            <span>Calendars</span>
          </a></li>
        </ul>
      </div>
      <div class="esper-tab-content">
        <div #content1 id="tab1" class="tab active"/>
        <div #content2 id="tab2" class="tab"/>
        <div #content3 id="tab3" class="tab"/>
      </div>
      <div class="modal-footer">
        <button #done class="button-primary">Done</button>
      </div>
    </div>
  </div>
</div>
'''

    tab1.click(function() { switchTab(tab1); });
    tab2.click(function() { switchTab(tab2); });
    tab3.click(function() { switchTab(tab3); });

    function switchTab(tab) {
      var currentAttrValue = "#" + tab.attr("id");
      $('.esper-tab-content ' + currentAttrValue).show().siblings().hide();
      tab.parent('li').addClass('active').siblings().removeClass('active');
    };

    content1.append(viewOfMembersTab(team));
    content2.append(viewOfLabelSyncTab(team));
    content3.append(viewOfCalendarTab(team));

    done.click(function() { (<any> modal).modal("hide") }); // FIXME

    (<any> modal).modal({}); // FIXME
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

  function viewOfTeam(team) {
'''
<div #view class="team-row clearfix">
  <div #cogContainer class="img-container-right"/>
  <div #statusContainer
       class="img-container-right team-status"
       data-toggle="tooltip"
       data-placement="left"
       title="Some team members may need to be reauthorized."/>
  <div #profilePic class="profile-pic"/>
  <div #name class="profile-name"/>
  <div #email class="profile-email gray"/>
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

    Api.getProfile(team.team_executive, team.teamid)
      .done(function(profile) {
        profilePic.css("background-image", "url('" + profile.image_url + "')");
        if (team.team_executive === Login.me()) {
          name
            .append($("<span>" + profile.display_name + "</span>"))
            .append($("<span class='semibold'> (Me)</span>"));
        } else {
          name.text(profile.display_name);
        }
        email.text(profile.email);
      });;

    cogContainer.click(function() { showTeamSettings(team); });

    return view;
  }

  function renderAdminSection() {
'''
<div #view style="margin-top:16px">
  <div class="esper-h2">New Team Invitation URL</div>
  <div class="generate-row clearfix">
    <button #button
            class="button-primary col-xs-3 generate">Generate</button>
    <input #url class="generate-input col-xs-9 disabled"
           onclick="this.select();"/>
  </div>
  <div>
    <a href="#" #clearSync class="danger-link">Log out of all Esper accounts</a>
  </div>
</div>
'''
    clearSync.click(function() {
      Login.clearAllLoginInfo();
      Signin.signin(function(){}, undefined, undefined);
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

  export function load() {
'''
<div #view class="settings-container">
  <div class="header clearfix">
    <a #logoContainer href="http://esper.com" target="_blank"
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
        <div #profilePic class="profile-pic"/>
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
      <div #teams class="team-list"/>
    </div>
  </div>
  <div class="footer clearfix">
    <ul class="col-xs-2">
      <li class="footer-header">Esper</li>
      <li><a href="https://chrome.google.com/webstore/detail/esper/jabkchbdomjjlbahjdjemnnghkakfcog"
             target="_blank" class="gray-link">Install</a></li>
      <li><a href="http://esper.com/team.html" target="_blank"
             class="gray-link">About us</a></li>
      <li><a href="http://blog.esper.com" target="_blank"
             class="gray-link">Blog</a></li>
      <li><a href="http://esper.com/jobs.html" target="_blank"
             class="gray-link">Jobs</a></li>
    </ul>
    <ul class="col-xs-2">
      <li class="footer-header">Support</li>
      <li><a href="http://esper.com/discover.html" target="_blank"
             class="gray-link">Getting started</a></li>
      <li><a href="http://esper.com/privacy-policy.html" target="_blank"
             class="gray-link">Privacy</a></li>
      <li><a href="http://esper.com/terms-of-use.html" target="_blank"
             class="gray-link">Terms</a></li>
      <li><a #contact href="#" class="gray-link">Contact us</a></li>
    </ul>
    <div class="col-xs-8">
      <a #wordMarkContainer href="http://esper.com" target="_blank"
         class="img-container-right"/>
    </div>
  </div>
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

    var wordMark = $("<img class='svg-block word-mark'/>")
      .appendTo(wordMarkContainer);
    Svg.loadImg(wordMark, "/assets/img/word-mark.svg");

    Api.getMyProfile()
      .done(function(profile){
        profilePic.css("background-image", "url('" + profile.image_url + "')");
        myName.text(profile.display_name);
        myEmail.text(Login.myEmail());
      });

    uid
      .append("<span>UID: </span>")
      .append("<span class='gray'>" + Login.me() + "</span>");

    List.iter(Login.getTeams(), function(team) {
      teams.append(viewOfTeam(team));
    });

    signOut.click(function() {
      Login.clearLoginInfo();
      Signin.signin(function(){}, undefined, undefined);
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

    contact.click(function() {
      GmailCompose.compose({ to: "team@esper.com" });
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

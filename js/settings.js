/*
  Team settings page
*/

var settings = (function() {
  var mod = {};

  function showLabelSettingsModal(team) {
'''
<div #modal
     class="modal fade" tabindex="-1"
     role="dialog">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header clearfix">
        <button #updateButton
                type="button" class="btn btn-primary"
                style="float:right" disabled>Update</button>
        <h3 #modalTitle
            class="modal-title">Team Settings</h3>
      </div>
      <div #body
           class="modal-body">
        <table>
          <thead>
            <tr>
              <td>Shared Labels</td>
              <td>Sync</td>
            </tr>
          </thead>
          <tbody #labels/>
        </table>
        <p #loading>Loading...</p>
      </div>
    </div>
  </div>
</div>
'''
    api.getSharedLabels(team.teamid).done(function(sharedLabels) {
      api.getSyncedLabels(team.teamid).done(function(syncedLabels) {
        loading.hide();

        var allLabels = list.union(sharedLabels.labels, syncedLabels.labels);
        allLabels.sort();
        list.iter(allLabels, function(label) {
          var checkbox = $("<input type='checkbox' class='labelSync'/>")
            .data("label", label);
          if (list.mem(syncedLabels.labels, label))
            checkbox.prop("checked", true);
          $("<tr><td>" + label + "</td><td>")
            .append(checkbox)
            .append("</td></tr>")
            .appendTo(labels);
        });

        var newLabelDiv = $("<div/>")
          .appendTo(body);
        var newLabelLink = $("<a href='#'>+ New shared label</a>")
          .appendTo(newLabelDiv);
        newLabelLink
          .click(function() {
            $("<div><input type='text' class='labelNew'/></div>")
              .prependTo(newLabelDiv);
          });
        updateButton.prop("disabled", false);
      });
    });

    updateButton.click(function() {
      var syncedLabels = [];
      $(".labelSync").each(function(i, x) {
        if ($(x).is(":checked"))
          syncedLabels.push($(x).data("label"));
      });
      $(".labelNew").each(function(i, x) {
        syncedLabels.push($(x).val());
      });
      api.putSyncedLabels(team.teamid, { labels: syncedLabels })
        .done(function() {
          modal.modal("hide");
        });
    });
    modal.modal({});
  }

  function setTeamCalendar(team, calId) {
    return api.setTeamCalendar(team.teamid, calId)
      .done(function() {
        log("Successfully set team calendar to " + calId);
      });
  }

  function makeCalendarSelector(team, root) {
    api.getCalendarList(login.me(), null)
      .done(function(x) {
        var cal = team.team_calendar;
        var calId =
          cal !== null && cal !== undefined ? cal.google_calendar_id : null;
        var options = [ { label: "Select calendar" } ];
        list.iter(x.items, function(calInfo) {
          options.push({ label: calInfo.summary, value: calInfo.id });
        });
        var sel = select.create({
          initialKey: calId,
          defaultAction: function(v) {
            calId = v;
            log("Selected calendar is: " + calId);
            if (util.isString(calId))
              setTeamCalendar(team, calId);
          },
          options: options
        });
        root.append(sel.view);
      });
  }

  function viewOfProfiles(execUid, profiles) {
'''
<div #table>
  <div class="row">
    <div class="col-md-3"></div>
    <div class="col-md-2">Role</div>
    <div class="col-md-3">Email</div>
    <div class="col-md-2">Google access</div>
    <div class="col-md-2"></div>
  </div>
</div>
'''
    list.iter(profiles, function(profile) {
'''
<div #row class="row">
  <div #name   class="col-md-3"></div>
  <div #role   class="col-md-2"></div>
  <div #email  class="col-md-3"></div>
  <div #google class="col-md-2"></div>
  <div class="col-md-2"><button #removeButton>Remove</button></div>
</div>
'''
      name.text(profile.display_name);
      role.text(execUid === profile.profile_uid ? "Executive" : " Assistant");
      email.text(profile.email);
      if (profile.google_access) {
        google.text("OK");
        google.attr("style", "color:green");
      }
      else {
        google.text("Sign-in needed");
        google.attr("style", "color:red");
      }
      removeButton.click(function() {
        log("TODO: remove user from team");
      });

      table.append(row);
    });
    return table;
  }

  function viewOfTeam(team) {
'''
<div #view>
  <div #executive></div>
  <div #assistants></div>
  <a #labelSettingsLink href="#">Label Sync Settings</a>
  <div>
    Team calendar: <span #calendarSelector></span>
  </div>
  <div #teamTableDiv/>
</div>
'''
    labelSettingsLink
      .click(function() { showLabelSettingsModal(team); });
    var members = list.union([team.team_executive], team.team_assistants);

    deferred.join(list.map(members, function(uid) {
      return api.getProfile(uid, team.teamid);
    }))
      .done(function(profiles) {
        viewOfProfiles(team.team_executive, profiles)
          .appendTo(teamTableDiv);
      });

    makeCalendarSelector(team, calendarSelector);

    return view;
  }

  function composeInviteForRole(role) {
    var invite = {
      from_uid: login.me(),
      teamid: login.getTeam().teamid,
      role: role
    };
    log("Invite:", invite);
    api.inviteJoinTeam(invite)
      .done(function(x) {
        var url = x.url;
        var body =
          "Please click the link and sign in with your Google account:\n\n"
          + "  " + url;

        gmailCompose.compose({
          subject: "Join my team on Esper",
          body: body
        });
      });
  }

  function renderInviteDialog() {
'''
<div #view>
  <div>Invite team members:</div>
  <div #roleSelector/>
</div>
'''
    var role;

    var sel = select.create({
      defaultAction: function(v) {
        role = v;
        log("Selected role is: " + role);
        if (util.isString(role))
          composeInviteForRole(role);
      },
      options: [
        { label: "Pick a role" },
        { label: "Executive", value: "Executive" },
        { label: "Assistant", value: "Assistant" }
      ]
    });

    sel.view.appendTo(roleSelector);

    return view;
  }

  mod.load = function() {
'''
<div #view>
  <div class="settings-block">
    <h1>Esper Settings</h1>
  </div>
  <div class="settings-block">
    Make sure you&apos;ve installed the
    <a href="https://chrome.google.com/webstore/detail/esper/jabkchbdomjjlbahjdjemnnghkakfcog"
       target="_blank">Esper extension</a>
    for Google Chrome browsers.
  </div>
  <div class="settings-block settings-block-gray">
    <h2>Profile</h2>
    <div #me/>
  </div>
  <div class="settings-block">
    <h2>Teams</h2>
    <div #teams/>
  </div>
  <div class="settings-block settings-block-gray">
    <h2>Account</h2>
    <div #logout class="hide">
      <a #logoutLink href="#!">Log out of Esper</a>
    </div>
    <div #revoke class="hide">
      <a href="#" #revokeLink>Revoke Esper&apos;s access
                              to my Google account</a>
    </div>
    <div>
      <a href="#" #clearSync>Log out all Esper accounts</a>
    </div>
  </div>
  <div class="settings-block">
    <h2>Invites</h2>
    <div #inviteSection class="settings-block"/>
  </div>
</div>
'''
    var root = $("#settings-page");
    root.children().remove();
    root.append(view);

    me
      .append("Logged into Esper as " + login.myEmail())
      .append(" (UID " + login.me() + ")");

    list.iter(login.getTeams(), function(team) {
      teams.append(viewOfTeam(team));
    });

    logoutLink.click(function() {
      login.clearLoginInfo();
      signin.signin(function(){});
      return false;
    });

    revokeLink.click(function() {
      api.postGoogleAuthRevoke()
        .done(function() {
          revoke.remove();
        });
      return false;
    });

    clearSync.click(function() {
      login.clearAllLoginInfo();
      signin.signin(function(){});
    });

    api.getGoogleAuthInfo(document.URL)
      .done(function(info) {
        logout.removeClass("hide");
        if (info.has_token)
          revoke.removeClass("hide");
        else {
          window.url = info.google_auth_url;
        }
      });

    inviteSection.append(renderInviteDialog());
  }

  return mod;
})();

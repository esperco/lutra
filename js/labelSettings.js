/*
  Team label sync settings page
*/

var labelSettings = (function() {
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

  function viewOfTeam(team) {
    var view = $("<div/>");
    var settingsURL = $("<a href='#'>Label Sync Settings</a>")
      .click(function() { showLabelSettingsModal(team) });
    api.getGoogleEmail(login.me(), team.team_executive, team.teamid)
      .done(function(execEmail) {
        var deferredAsstEmails = list.map(team.team_assistants, function(a) {
          return api.getGoogleEmail(login.me(), a, team.teamid);
        });
        deferred.join(deferredAsstEmails).done(function(asstAcctEmails) {
          var asstEmails = list.map(asstAcctEmails, function(e) {
            return e.email;
          });
          view
            .append("Executive: " + execEmail.email)
            .append("<br/>")
            .append("Assistants: " + asstEmails.join(", "))
            .append("<br/>")
            .append(settingsURL);
        });
      });
    return view;
  }

  mod.load = function() {
'''
<div #root>
  <div class="settings-block">
    <h1>Settings</h1>
  </div>
  <div class="settings-block-gray">
    <div class="settings-block">
      <h2>Profile</h2>
      <div #me/>
    </div>
  </div>
  <div class="settings-block">
    <h2>Teams</h2>
    <div #teams/>
  </div>
  <div class="settings-block-gray">
    <div class="settings-block">
      <h2>Account</h2>
      <div #logout class="hide">
        <a #logoutLink href="#!">Log out of Esper</a>
      </div>
      <div #revoke class="hide">
        <a href="#" #revokeLink>Revoke Esper&apos;s access to my Google account</a>
      </div>
      <div>
        <a href="#" #clearSync>Log out all Esper accounts</a>
      </div>
    </div>
  </div>
</div>
'''
    var view = $("#login-status");
    view.children().remove();
    view.append(root);

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

    view.removeClass("hide");
  }

  return mod;
})();

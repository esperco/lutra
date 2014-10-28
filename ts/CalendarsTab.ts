/*
  Team Settings - Calendars Tab
*/

module CalendarsTab {

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

  export function load(team) {
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

}

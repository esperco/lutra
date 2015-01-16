/*
  Team Settings - Calendars Tab
*/

module CalendarsTab {

  var calendarAcls = {}; // cache of API call results

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
      List.iter(x.calendars, function(cal) {
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
        Api.putTeamCalendars(team.teamid, { calendars: teamCalendars })
          .done(function() { window.location.reload(); });
      });

      root.append(view);
    });
  }

  function displayCalendarList(view, calendars) {
    view.children().remove();
    List.iter(calendars, function(cal) {
      if (cal.google_access_role !== "Owner") return;

      var row = $("<div class='esper-cal-row'/>");
      var checkbox = $("<input class='esper-cal-check' type='checkbox'/>");
      checkbox.data({
        calendarId: cal.google_cal_id,
        timezone: cal.calendar_timezone,
        title: cal.calendar_title
      });

      var cachedAcl = calendarAcls[cal.google_cal_id];
      var getAcl =
        cachedAcl === undefined ?
        Api.getCalendarShares(cal.google_cal_id) :
        Deferred.defer(cachedAcl);

      getAcl.done(function(acl) {
        calendarAcls[cal.google_cal_id] = acl;

        function isEsperAssistant(x) {
          var assistantEmail = $(".esper-assistant-email").val();
          return x.acl_email === assistantEmail;
        }

        var withEsper = List.find(acl.shared_emails, isEsperAssistant);
        if (withEsper !== null) {
          checkbox.prop("checked", true)
                  .data("aclId", withEsper.acl_id);
        }
        var title =
          $("<span class='esper-cal-title'>" + cal.calendar_title
            + "</span>");
        if (view.hasClass("esper-loading")) {
          view.text("");
          view.removeClass("esper-loading");
        }

        row.append(checkbox).append(" ").append(title)
           .appendTo(view);
      });
    });
  }

  function saveCalendarShares(team, view, share, onboarding) {
    var calls = [];
    var teamCals = [];
    view.find(".esper-cal-row").each(function() {
      var row = $(this);
      var checkbox = row.find(".esper-cal-check");
      var isChecked = checkbox.is(":checked");
      var calendarId = checkbox.data("calendarId");
      var assistantEmail = $(".esper-assistant-email").val();
      if (isChecked) {
        teamCals.push({
          google_cal_id: calendarId,
          calendar_timezone: checkbox.data("timezone"),
          calendar_title: checkbox.data("title")
        });
        calls.push(Api.putCalendarShare(calendarId, assistantEmail));
      } else {
        var aclId = checkbox.data("aclId");
        calls.push(Api.deleteCalendarShare(calendarId, aclId));
      }
    });
    share.text("Loading...").attr("disabled", "true");
    Deferred.join(calls).done(function() {
      Api.putTeamCalendars(team.teamid, { calendars: teamCals })
        .done(function() {
          if (onboarding) TeamSettings.switchTab(2);
          else window.location.reload();
        });
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

  export function load(team, onboarding?) {
'''
<div #view>
  <div #teamCalendars>
    <div class="esper-h1">Team Calendars</div>
    <div #description class="calendar-setting-description">
      Welcome to Esper! So we can start scheduling, please select
      which calendars to share with your Esper assistant.
    </div>
    <div>Assistant's email: <select #asst class="esper-assistant-email"/></div>
    <div #calendarView class="esper-loading">Loading...</div>
    <button #share class="button-primary">Share</button>
  </div>
  <br/>
  <div #calendarSelector/>
  <br/>
  <div #emailAliases/>
</div>
'''
    if (Login.me() !== team.team_executive) {
      teamCalendars.hide();
      makeCalendarSelectors(team, calendarSelector);
      makeAliasSection(team, emailAliases);
    } else {
      calendarSelector.hide();
      emailAliases.hide();
      List.iter(team.team_assistants, function(uid) {
        var tm =
          List.find(Login.data.team_members, function(x : ApiT.TeamMember) {
            return x.member_uid === uid;
          });
        if (tm !== null) {
          var opt = $("<option>" + tm.member_email + "</option>");
          if (tm.member_email === "assistant@esper.com")
            opt.prop("selected", true);
          opt.appendTo(asst);
        }
      });

      Api.getCalendarList().done(function(response) {
        function refreshList() {
          displayCalendarList(calendarView, response.calendars);
        }
        asst.change(refreshList);
        refreshList();
      });

      if (onboarding) {
        share.css("float", "right");
        share.text("Next Step");
      }

      share.click(function() {
        saveCalendarShares(team, calendarView, share, onboarding);
      });
    }

    return view;
  }

}

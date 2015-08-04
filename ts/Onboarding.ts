/*
  Onboarding page(s)
*/

/// <reference path="TeamSettings.ts"/>

module Onboarding {
  // Routes to a particular onboarding step
  export function goToStep(teamId: string, step: number) {
    Route.nav.path("#!join/" + teamId + "/" + step);
  }

  // Returns the root container object into which we insert onboarding stuff
  function rootElm(): JQuery {
    return $("#onboarding-interface");
  }

  // Interface for references from string names to jQuery wrapper
  interface IJQMap {
    [index: string]: JQuery;
  }

  // Loads the main wrapper UX for onboarding, returns a JQuery wrapper for
  // where step-specific content should go
  function loadContainer(): IJQMap {
'''
<div #view class="onboarding">
  <div class="container">
    <div class="progress">
      <div #progress class="progress-bar progress-bar-info" role="progressbar" /> 
    </div>
    <div #content class="onboarding-text" />
  </div>
</div>
'''
    var root = rootElm();
    root.children().remove();
    root.append(view);
    return {
      view: view,
      progress: progress,
      content: content
    };
  }

  let steps = [step0, step1, step2];

  export function load(teamId: string, step: number) {
    var refs = loadContainer();
    steps[step](teamId, refs);
  }

  // Takes a JQuery-wrapped submit button and makes it look "busy"
  function makeBusy(button: JQuery, text = "Saving ..."): void {
    button.text(text);
    button.prop("disabled", true);
  }

  /* Step 0 => Confirm executive name */
  function step0(teamId: string, refs: IJQMap): void {
    refs["progress"].width("33%");
'''
<form #form class="form">
  <div class="row">
    <div class="form-group col-md-offset-2 col-md-8">
      <label for="step0-name">
        Thanks for signing up for Esper! What's your name?
      </label>
      <input #name type="text" class="form-control" id="step0-name"
             placeholder="Your Name Here" />
    </div>
  </div>

  <div class="row">
    <div class="col-md-offset-2 col-md-8">
      <button #submit type="submit" class="btn btn-default">Save</button>
    </div>
  </div>
</form>
'''
    form.submit(function(e) {
      makeBusy(submit);

      // AJAX => change name, then load step 1
      Api.setTeamName(teamId, name.val())
        .then(function() {
          goToStep(teamId, 1);
        });

      // Prevent page reload
      return false;
    });

    let content = refs["content"];
    content.append(form);
    name.focus();
  }

  /* Step 1 => Share calendars */
  function step1(teamId: string, refs: IJQMap): void {
    refs["progress"].width("67%");
'''
<div #view>
  <div #description class="calendar-setting-description">
    Please select which calendars to share with your Esper assistant.
  </div>
  <div #calendarView class="esper-loading">Loading...</div>
  <button #share class="button-primary" style="margin-top: 10px">
    Share Calendars
  </button>
</div>
'''
    var team : ApiT.Team =
      List.find(Login.getTeams(), function(t : ApiT.Team) {
        return t.teamid === teamId;
      });

    Api.getCalendarList(teamId)
      .done(function(response) {
        CalendarsTab.displayCalendarList(calendarView, response.calendars);

        share.click(function() {
          let allCals = response.calendars;
          CalendarsTab.saveCalendarShares(team, calendarView, share, allCals)

            // Then create ghost calendar for EA
            .then(function() {
              if (team.team_name) {
                /* During onboarding, create a "ghost calendar" for the EA to
                   keep negative time (no scheduling), notes, etc. */
                var primary = List.find(allCals,
                  function(cal: ApiT.Calendar) {
                    return cal.is_primary;
                  });
                var tz = primary.calendar_timezone;
                if (tz === undefined) { tz = "America/Los_Angeles"; }
                /* Because we're onboarding, this team has an Esper assistant.
                   It should be the first (and only) assistant.
                   This may change in the future, and then we'd have to check.
                */
                var esperAsst = team.team_assistants[0];
                return Api.createTeamCalendar(esperAsst, team.teamid, tz,
                  team.team_name + " Ghost");
              }
            })

            // Then set subscription for new user to basic
            .then(function() {
              return Api.setSubscription(team.teamid, Plan.basic);
            })

            // Then redirect to next / final step
            .then(function() {
              goToStep(teamId, 2);
            });
        });
      });

    let content = refs["content"];
    content.append(view);
  }

  /* Step 2 => complete */
  function step2(teamId: string, refs: IJQMap): void {
    refs["progress"].width("100%");
'''
<div #view>
  <h2>Congratulations!</h2>
  <div>
    <p>You've signed up for your very own Esper Assistant.
      You can get started right away by contacting your assistant at 
      <b><a target="_blank" #mailToLink></a></b>.
    </p>
    <p>Click below to send the following email and set up a call:</p>
    <p style="margin-top:40px; cursor:pointer;">
      <a class="well" style="display:block" target="_blank" #mailMsgLink></a>
    </p>
  </div>
  <div align=right style="padding-top:20px; padding-bottom:40px;">
    <a href="faqs">
      <button class="button-primary">
        Learn more about Esper &nbsp;&nbsp;<i class="fa fa-arrow-right"></i>
      </button>
    </a>
  </div>
</div>
'''
    var team : ApiT.Team =
      List.find(Login.getTeams(), function(t : ApiT.Team) {
        return t.teamid === teamId;
      });
    var asstEmail = team.team_email_aliases[0];
    var asstName = asstEmail.split("@")[0];
    asstName = asstName.charAt(0).toUpperCase() + asstName.slice(1);
    var teamName = team.team_name;

    var emailText = `Hi ${asstName},\n\n` +
      `Great to meet you! I'm excited to have you as an assistant. ` +
      `I'd love to speak with you and learn more about what you can do for ` +
      `me. Can you help find a good time for a phone call that works for ` +
      `both of us?\n\n` +
      `Cheers,\n` +
      teamName;

    mailToLink.text(asstEmail);
    mailToLink.attr("href", "mailto:" + asstEmail);
    mailMsgLink.html(emailText.replace(/\n/g, "<br />"));
    mailMsgLink.attr("href", "mailto:" + asstEmail +
      "?subject=" + encodeURIComponent("Hello!") +
      "&body=" + encodeURIComponent(emailText));

    let content = refs["content"];
    content.append(view);
  }
}
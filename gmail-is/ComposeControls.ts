/** This module contains definitions for each specific button and
 *  control on the compose toolbar.
 *
 *  Each button is wrapped into a function which is passed into
 *  ComposeToolbar.registerControl
 */
module Esper.ComposeControls {

  var endOfTemplate =
    "Can you also provide the best number to reach you at in case of any " +
    "last-minute coordination? " +
    "<b>OR</b> " +
    "Is <b>xxx-xxx-xxxx</b> the best number to reach you at in case of any " +
    "last-minute coordination? " +
    "<b>[Choose 1 sentence]</b>";

  var singleEventTemplate =
    "Hi <b>GUEST</b>," +
    "<br/><br/>" +
    "Happy to help you and |exec| find a time. " +
    "Would |offer| work for you? " +
    "If not, please let me know some times that would work better for you. " +
    "I can send an invite once we confirm a time." +
    "<br/><br/>" +
    endOfTemplate;

  var multipleEventTemplate =
    "Hi <b>GUEST</b>," +
    "<br/><br/>" +
    "Happy to help you and |exec| find a time. " +
    "Would one of the following times work for you?" +
    "<br/><br/>" +
    "|offer|" +
    "<br/><br/>" +
    "If not, please let me know some times that would work better for you. " +
    "I can send an invite once we confirm a time." +
    "<br/><br/>" +
    endOfTemplate;

  function timeInGuestTimezone(time: string, zone: string) {
    // moment object in guest timezone
    var guestStart = zone ? (<any> moment)(time).tz(zone) : null;
    // guest time formatted like 3:45 pm
    var guestTime = guestStart ? guestStart.format("h:mm a") : null;
    // add guest timezone abbreviation, like EDT
    var forGuest =
      guestStart ?
      " / " + guestTime + " " + guestStart.zoneAbbr() :
      "";
    return forGuest;
  }

  /** Inserts the date of each linked event into the text box. */
  function insertButton(composeControls) {
'''
<div #insertButton title class="esper-composition-button">
  <object #insertIcon class="esper-svg esper-composition-button-icon"/>
  <div #numLinkedEvents class="esper-composition-badge"/>
</div>
'''

    insertIcon.attr("data", Init.esperRootUrl + "img/composition-insert.svg");

    insertButton.tooltip({
      show: { delay: 500, effect: "none" },
      hide: { effect: "none" },
      "position": { my: 'center bottom', at: 'center top-1' },
      "tooltipClass": "esper-top esper-tooltip"
    });

    insertButton.click(function (e) {
      CurrentThread.currentTeam.get().match({
        some : function (team) {
          var events = CurrentThread.linkedEvents.get();

          events.filter(function (e) {
            return new Date(e.event.end.local) > new Date(Date.now());
          });

          CurrentThread.taskPrefs.done(function(prefOpt) {
            var guestTz;
            prefOpt.match({
              some : function(tpref) { guestTz = tpref.guest_timezone; },
              none: function() { }
            });

            var entry = events.reduce(function (str, event) {
              var ev    = event.event;
              var start = new Date(ev.start.local);
              var end   = new Date(ev.end.local);
              var wday = XDate.fullWeekDay(start);
              var time = XDate.justStartTime(start);
              var tz    =
                (<any> moment).tz(ev.start.local,
                                  CurrentThread.eventTimezone(ev)).zoneAbbr();
              var forGuest = timeInGuestTimezone(ev.start.utc, guestTz);

              var br = str != "" ? "<br />" : ""; // no leading newline
              return str + br + wday + ", " + time + " " + tz + forGuest;
            }, "");

            composeControls.insertAtCaret(entry);
          });
        },
        none : function () {
          // TODO: Handle missing team more gracefully?
          window.alert("Cannot insert template: current team not detected.");
        }
      });
    });

    function updateEventsLabel() {
      var linkedEvents = CurrentThread.linkedEvents.get();

      numLinkedEvents.text(linkedEvents.length.toString());
 
      var tooltipText = "";
      switch (linkedEvents.length) {
      case 0:
        insertButton.addClass("esper-none");
        tooltipText = "No linked events to insert";
        break;
      case 1:
        tooltipText = "Insert 1 linked event";
        break;
      default:
        tooltipText = "Insert " + linkedEvents.length + " linked events";
        break;
      }

      insertButton.tooltip({
        "content": tooltipText,
        "tooltipClass": "esper-top esper-tooltip"
      });
    }

    updateEventsLabel();
    CurrentThread.linkedEvents.watch(updateEventsLabel);

    return Option.some(insertButton);
  }

  /** Inserts a canned response template into the text box. */
  function templateButton(composeControls) {
'''
<div #templateButton title class="esper-composition-button">
  <object #templateIcon class="esper-svg esper-composition-button-icon"/>
  <div #templateBadge class="esper-composition-badge">...</div>
</div>
'''

    templateIcon.attr("data", Init.esperRootUrl + "img/composition-insert.svg");

    templateButton.tooltip({
      show: { delay: 500, effect: "none" },
      hide: { effect: "none" },
      content: "Insert canned response template",
      "position": { my: 'center bottom', at: 'center top-1' },
      "tooltipClass": "esper-top esper-tooltip"
    });

    templateButton.click(function (e) {
      CurrentThread.currentTeam.get().match({
        some : function (team) {
          var events = CurrentThread.linkedEvents.get();

          events.filter(function (e) {
            return new Date(e.event.end.local) > new Date(Date.now());
          });

          CurrentThread.taskPrefs.done(function(prefOpt) {
            var guestTz;
            prefOpt.match({
              some : function(tpref) { guestTz = tpref.guest_timezone; },
              none: function() { }
            });

            var entry = events.reduce(function (str, event): string {
              var ev    = event.event;
              var start = new Date(ev.start.local);
              var end   = new Date(ev.end.local);
              var wday = XDate.fullWeekDay(start);
              var time = XDate.justStartTime(start);
              var tz    =
                (<any> moment).tz(ev.start.local,
                                  CurrentThread.eventTimezone(ev)).zoneAbbr();
              var forGuest = timeInGuestTimezone(ev.start.utc, guestTz);

              var loc;
              if (ev.location !== undefined) {
                loc = ev.location.address;
                if (ev.location.title !== "") {
                  loc = ev.location.title + " - " + loc;
                }
              } else {
                loc = "<b>LOCATION</b>";
              }

              var br = str != "" ? "<br />" : ""; // no leading newline
              return str + br + wday + ", " + time + " " +
                     tz + forGuest + " at " + loc;
            }, "");

            var template =
              events.length > 1 ?
              multipleEventTemplate.slice(0) :
              singleEventTemplate.slice(0); // using slice to copy string

            var execName = team.team_name.replace(/ .*$/, "");
            if (entry === "") entry = "<b>ADD EVENT DETAILS</b>";
            var filledTemplate =
              template.replace("|offer|", entry)
              .replace("|exec|", execName);
            composeControls.insertAtCaret(filledTemplate);
          });
        },
        none : function () {
          // TODO: Handle more gracefully?
          window.alert("Cannot insert template: current team not detected.");
        }
      });
    });

    return Option.some(templateButton);
  }

  /** Creates and links a new event to the current task. */
  function createButton(composeControls) {
'''
<div #createButton title class="esper-composition-button">
  <object #createIcon class="esper-svg esper-composition-button-icon"/>
</div>
'''
    createIcon.attr("data", Init.esperRootUrl + "img/composition-create.svg");

    createButton.tooltip({
      show: { delay: 500, effect: "none" },
      hide: { effect: "none" },
      "content": "Create linked events",
      "position": { my: 'center bottom', at: 'center top-1' },
      "tooltipClass": "esper-top esper-tooltip"
    });

    createButton.click(function() {
      if (CurrentThread.threadId.isValid() &&
          CurrentThread.task.isValid()) {
        CalPicker.createInline(CurrentThread.task.get(),
                               CurrentThread.threadId.get());
      }
    });

    return Option.some(createButton);
  }

  /** */
  function askExecButton(composeControls) {
    var exec = CurrentThread.getCurrentExecutive();
    return exec.match({
      some : function (executive) {
'''
<div #askButton title class="esper-composition-button">
  <object #askIcon class="esper-svg esper-composition-button-icon"/>
</div>
'''
        askIcon.attr("data", Init.esperRootUrl + "img/info.svg");

        askButton.tooltip({
          show: { delay: 500, effect: "none" },
          hide: { effect: "none" },
          "content": "Ask question with choices on phone app",
          "position": { my: 'center bottom', at: 'center top-1' },
          "tooltipClass": "esper-top esper-tooltip"
        });

        askButton.click(function() {
          Gmail.threadContainer().append(ComposeHashtags.view(composeControls));
        });

        return Option.some(askButton);
      },
      none : function () {
        return Option.none();
      }
    });
  }

  export function init() {
    ComposeToolbar.registerControl(insertButton);
    ComposeToolbar.registerControl(templateButton);
    ComposeToolbar.registerControl(createButton);
    ComposeToolbar.registerControl(askExecButton);
  }

  $(init);
}

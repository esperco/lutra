/** This module contains definitions for each specific button and
 *  control on the compose toolbar.
 *
 *  Each button is wrapped into a function which is passed into
 *  ComposeToolbar.registerControl
 */
module Esper.ComposeControls {

  var singleEventTemplate =
    "Hi <b>GUEST</b>," +
    "<br/><br/>" +
    "Happy to help you and <b>EXECUTIVE</b> find a time. " +
    "Would |offer| work for you? " +
    "If not, please let me know some times that would work better for you. " +
    "I can send an invite once we confirm a time." +
    "<br/><br/>" +
    "Can you also provide the best number to reach you at in case of any " +
    "last-minute coordination? " +
    "<b>[Remove if we have their number.]</b>";

  var multipleEventTemplate =
    "Hi <b>GUEST</b>," +
    "<br/><br/>" +
    "Happy to help you and <b>EXECUTIVE</b> find a time. " +
    "Would one of the following times work for you?" +
    "<br/><br/>" +
    "|offer|" +
    "<br/><br/>" +
    "If not, please let me know some times that would work better for you. " +
    "I can send an invite once we confirm a time." +
    "<br/><br/>" +
    "Can you also provide the best number to reach you at in case of any " +
    "last-minute coordination? " +
    "<b>[Remove if we have their number.]</b>";

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
      if (CurrentThread.team.isValid()) {
        var team = CurrentThread.team.get();
        var events = CurrentThread.linkedEvents.get();

        events.filter(function (e) {
          return new Date(e.event.end.local) > new Date(Date.now());
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

          var br = str != "" ? "<br />" : ""; // no leading newline
          return str + br + wday + ", " + time + " " + tz;
        }, "");

        composeControls.insertAtCaret(entry);
      }
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

    return insertButton;
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
      if (CurrentThread.team.isValid()) {
        var team = CurrentThread.team.get();
        var events = CurrentThread.linkedEvents.get();

        events.filter(function (e) {
          return new Date(e.event.end.local) > new Date(Date.now());
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

          var br = str != "" ? "<br />" : ""; // no leading newline
          return str + br + wday + ", " + time + " " + tz +
            " at <b>LOCATION</b>";
        }, "");

        var template =
          events.length > 1 ?
          multipleEventTemplate.slice(0) :
          singleEventTemplate.slice(0); // using slice to copy string

        Profile.get(Login.myUid(), CurrentThread.team.get().teamid)
          .done(function(prof) {
            var eaName = prof.display_name;
            var filledTemplate = template.replace("|offer|", entry);
            composeControls.insertAtCaret(filledTemplate);
          });
      }
    });

    return templateButton;
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
          CurrentThread.task.isValid() &&
          CurrentThread.team.isValid()) {
        CalPicker.createModal(CurrentThread.team.get(),
                              CurrentThread.task.get(),
                              CurrentThread.threadId.get());
      }
    });

    return createButton;
  }

  export function init() {
    ComposeToolbar.registerControl(insertButton);
    ComposeToolbar.registerControl(templateButton);
    ComposeToolbar.registerControl(createButton);
  }

  $(init);
}

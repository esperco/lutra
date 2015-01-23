/** This module contains definitions for each specific button and
 *  control on the compose toolbar.
 *
 *  Each button is wrapped into a function which is passed into
 *  ComposeToolbar.registerControl
 */
module Esper.ComposeControls {

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

        composeControls.insertAtCaret("<br />");
        for (var i = 0; i < events.length; i++) {
          var ev = events[i].event;
          var start = new Date(ev.start.local);
          var end   = new Date(ev.end.local);
          var range = XDate.range(start, end);
          var tz =
            (<any> moment).tz(ev.start.local,
                              CurrentThread.eventTimezone(ev)).zoneAbbr();

          composeControls.insertAtCaret(
            XDate.fullWeekDay(start) + ", " + range + " " + tz + "<br />");
        }
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
    ComposeToolbar.registerControl(createButton);
  }

  $(init);
}

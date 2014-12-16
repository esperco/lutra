/** Manages all the tools and buttons that appear above the compose
 *  text box for each message. Note that a single page/thread can have
 *  *more than one* text box because you can be simultaneously
 *  drafting replies for more than one message at a time. This module
 *  automatically manages every instance of the composition tools on
 *  the page.
 *
 *  This module also contains some basic utilities for interacting
 *  with the text box, like inserting text at the caret. Any future
 *  interactions of this sort should also go through here.
 *
 *  Currently, this does not appear for brand-new messages, just
 *  replies to messages in a thread. This will probably change in the
 *  future.
 */
module Esper.ComposeToolbar {

  /** Returns the timezone of the given event. If the event isn't in
   *  one of the team's calendars, returns undefined.
   */
  function eventTimezone(team: ApiT.Team, ev: ApiT.CalendarEvent): string {
    var teamCal =
      List.find(team.team_calendars, function(c) {
        return c.google_cal_id === ev.google_cal_id;
    });
    if (teamCal === null) return undefined;
    else return teamCal.calendar_timezone;
  }

  /** Given a set of elements (anchors for each text box), attaches
   *  the composition controls and sets up the event handlers to each
   *  one.
   *
   *  To change the actual elements inserted, modify `esperToolbar()`. 
   *
   *  The event listeners, however, are configured here because they
   *  need a reference to the containing div. This should probably be
   *  factored out at some point.
   */
  function attachControls(anchor: JQuery) {
    anchor.each(function (i, divElt) {
      var div = $(divElt);

      // If we haven't added a menu to this one yet and it is not a
      // new compose interface.
      if (!Gmail.newCompose(div) && div.children().length === 1) {
        var controls = esperToolbar();
        div.prepend(controls.bar);
        div.height(86);

        var containing = Gmail.containingTable(div);
        containing.css("padding-bottom", 30);

        // Fix for overlapping menu; selection will be empty if this
        // is unnecessary
        var overlappingSpan = Gmail.mouseoverReplyToolbar(div);
        overlappingSpan.css("margin-top", 16);

        updateEventsLabel(controls);
        CurrentThread.linkedEvents.watch(function () {
          updateEventsLabel(controls)
        });

        controls.insertButton.click(function (e) {
          var team = CurrentThread.team.get();
          if (team !== null && team !== undefined) {
            var textField = Gmail.replyTextField(div);
            var events = CurrentThread.linkedEvents.get();
            textField.focus();

            insertAtCaret("<br />");
            for (var i = 0; i < events.length; i++) {
              var ev = events[i].event;
              var start = new Date(ev.start.local);
              var end   = new Date(ev.end.local);
              var range = XDate.range(start, end);
              var tz =
                (<any> moment).tz(ev.start.local,
                                  eventTimezone(team, ev)).zoneAbbr();

              if (Gmail.caretInField(textField)) {
                insertAtCaret(XDate.fullWeekDay(start) + ", " + range
                              + " " + tz + "<br />");
              }
            }
          }
        });

        controls.createButton.click(function() {
          var threadId = CurrentThread.threadId.get();
          var team = CurrentThread.team.get();
          if (threadId !== null && threadId !== undefined
              && team !== null && team !== undefined)
            CalPicker.createModal(team, threadId);
        });

        controls.confirmButton.click(function () {
          var team = CurrentThread.team.get();
          if (team !== null && team !== undefined) {
            var textField = Gmail.replyTextField(div);
            var events = CurrentThread.linkedEvents.get();
            var message = "Confirming the following events:<br />";

            textField.focus();

            for (var i = 0; i < events.length; i++) {
              var ev = events[i].event;
              var title = ev.title || "";
              var location = ev.location || "";

              var locationStr = location !== "" ? " at " + locationStr : "";
              message += title + locationStr + "<br />";
            }

            if (Gmail.caretInField(textField)) {
              insertAtCaret(message);
            }
          }

        });
      }
    });
  }

  /** Inserts the given HTML string at the caret of a contenteditable
   *  element.
   */
  function insertAtCaret(html) {
    var selection = window.getSelection()
    var range     = selection.getRangeAt(0);

    html = "<span>" + html + "</span>";

    range.deleteContents();

    var node = $(html)[0];
    range.insertNode(node);
  }

  /** Runs the given callback with the preferences of the current
   *  team.
   */
  function withPreferences(callback) {
    var team = CurrentThread.team.get();

    if (team) {
      Api.getPreferences(team.teamid).done(callback);
    } else {
      Log.d("No team detected. Not calling callback.");
    }
  }

  function updateEventsLabel(controls) {
    var linkedEvents = CurrentThread.linkedEvents.get();

    switch (linkedEvents.length) {
    case 0:
      controls.numLinkedEvents.text("0");
      controls.insertButton
        .addClass("esper-none")
        .tooltip({
          "content": "No linked events to insert",
          "tooltipClass": "esper-top esper-tooltip"
        });
      break;
    case 1:
      controls.numLinkedEvents.text("1");
      controls.insertButton
        .removeClass("esper-none")
        .tooltip({
          "content": "Insert 1 linked event",
          "tooltipClass": "esper-top esper-tooltip"
        });
      break;
    default:
      controls.numLinkedEvents.text(linkedEvents.length.toString());
      controls.insertButton
        .removeClass("esper-none")
        .tooltip({
          "content": "Insert " + linkedEvents.length + " linked events",
          "tooltipClass": "esper-top esper-tooltip"
        });
      break;
    }
  }

  /** Returns a _view that contains Esper-specific controls for the
   *  composition view. (Right now, the only controls are a button for
   *  inserting the times of linked events and a label with the number
   *  of linked events.)
   */
  function esperToolbar() {
'''
<div #bar class="esper-composition-toolbar esper-clearfix">
  <object #logo class="esper-composition-logo"/>
  <div class="esper-composition-vertical-divider"/>
  <div #insertButton title class="esper-composition-button">
    <object #insertIcon class="esper-svg esper-composition-button-icon"/>
    <div #numLinkedEvents class="esper-composition-badge"/>
  </div>
  <div #createButton title class="esper-composition-button">
    <object #createIcon class="esper-svg esper-composition-button-icon"/>
  </div>
  <div #confirmButton title class="esper-composition-button esper-exec-confirm">
    <span> Confirm </span>
  </div>
</div>
'''
    logo.attr("data", Init.esperRootUrl + "img/footer-logo.svg");
    insertIcon.attr("data", Init.esperRootUrl + "img/composition-insert.svg");
    createIcon.attr("data", Init.esperRootUrl + "img/composition-create.svg");

    insertButton.tooltip({
      show: { delay: 500, effect: "none" },
      hide: { effect: "none" },
      "position": { my: 'center bottom', at: 'center top-1' },
      "tooltipClass": "esper-top esper-tooltip"
    });

    createButton.tooltip({
      show: { delay: 500, effect: "none" },
      hide: { effect: "none" },
      "content": "Create linked events",
      "position": { my: 'center bottom', at: 'center top-1' },
      "tooltipClass": "esper-top esper-tooltip"
    });

    withPreferences(function (preferences) {
      if (preferences.general.send_exec_confirmation) {
        confirmButton.show();
      }
    });

    return _view;
  }

  /** Listens to the reply_forward event, which fires when somebody
   *  opens the textbox for replying to or forwarding a message in a
   *  thread and adds our controls to it.
   *
   */
  export function init() {
    esperGmail.on.reply_forward(function () {
      attachControls(Gmail.compositionToolbar());
    });
  }
}

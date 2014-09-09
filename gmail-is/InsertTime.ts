module Esper.InsertTime {

  /** Attaches the composition controls and sets up the event
   *  handlers.
   */
  function attachControls(anchor) {
    anchor.each(function (i, div) {
      div = $(div); // each gives us raw elements, not $ selections

      // If we haven't added a menu to this one yet.
      if (div.children().length === 1) {
        var controls = esperToolbar();
        div.prepend(controls.bar);
        div.height(70);

        updateEventsLabel(controls);
        CalTab.onEventsChanged(function () {
          updateEventsLabel(controls)
        });

        controls.insertButton.click(function (e) {
          var textField = Gmail.replyTextField(div);
          var threadId  = MsgView.currentThreadId;
          var team      = Login.myTeams()[0];

          var events = CalTab.currentEvents;

          for (var i = 0; i < events.length; i++) {
            var start = new Date(events[i].event.start.local);
            var end   = new Date(events[i].event.end.local);

            textField.html(textField.html() + "<br />start: " + start + "<br />end: " + end + "<br />");
          }
        });
      }
    });
  }

  function updateEventsLabel (controls) {
    switch (CalTab.currentEvents.length) {
    case 0:
      controls.eventsLabel.text("No linked events.");
      break;
    case 1:
      controls.eventsLabel.text("1 linked event.");
      break;
    default:
      controls.eventsLabel.text(CalTab.currentEvents.length + " linked events.");
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
<div #bar class="esper-composition-toolbar">
  <img #logo alt=""/>
  <span #eventsLabel> No linked events. </span>
  <button #insertButton>Insert</button>
</div>
'''
    logo.attr("src", Init.esperRootUrl + "img/icon16.png");

    return _view;
  }

  /** Listens to the reply_forward event, which fires when somebody
   *  opens the textbox for replying to or forwarding a message in a
   *  thread and adds our controls to it.
   *
   */
  export function init() {
    gmail.on.reply_forward(function () {
      attachControls(Gmail.compositionToolbar());
    });
  }
}
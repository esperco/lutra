module Esper.InsertTime {

  // TODO: .on('reply_forward') gets called when a thread is replied to

  /** Attaches the composition controls and sets up the event
   *  handlers.
   */
  function attachControls(anchor) {
    anchor.each(function (i, div) {
      // If we haven't added a menu to this one yet.
      if ($(div).children().length === 1) {
        var controls = esperToolbar();
        $(div).prepend(controls.bar);
        $(div).height(70);

        var threadId = MsgView.currentThreadId;
        var events   = [];
        var team     = Login.myTeams()[0];

        Api.getLinkedEvents(team.teamid, threadId).done(function (linkedEvents) {
          events = linkedEvents.linked_events;
        });

        controls.insertButton.click(function (e) {
          var textField = Gmail.replyTextField($(div));
          console.log("Text Field");
          console.log(textField.length);
          console.log(textField);

          for (var i = 0; i < events.length; i++) {
            var start = new Date(events[i].event.start.local);
            var end   = new Date(events[i].event.end.local);

            textField.html(textField.html() + "<br /><br />start: " + start + "<br />end: " + end);
          }
        });
      }
    });
  }

  /** Returns a _view that contains Esper-specific controls for the
   *  composition view. (Right now, the only controls are a button for
   *  inserting the times of linked events and a label with the number
   *  of linked events.)
   */
  function esperToolbar() {
'''
<div #bar class="esper-toolbar">
  <img #logo alt=""/>
  <span #eventsLabel> No linked events. </span>
  <button #insertButton>Insert</button>
</div>
'''
    logo.attr("src", Init.esperRootUrl + "img/footer-logo.png");

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
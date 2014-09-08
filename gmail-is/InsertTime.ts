module Esper.InsertTime {

  // TODO: .on('reply_forward') gets called when a thread is replied to

  /** Attaches the composition controls and sets up the event
   *  handlers.
   */
  function attachControls(anchor) {
    anchor.each(function (i, div) {
      // If we haven't added a menu to this one yet.
      if ($(div).children().length === 1) {
        console.log("Adding controls...");
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
          for (var i = 0; i < events.length; i++) {
            console.log(events[i].start, events[i].end);
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
      console.log("");
      console.log("On reply_forward fired! ");
      attachControls(Gmail.compositionToolbar());
    });
  }
}
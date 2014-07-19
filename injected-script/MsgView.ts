module MsgView {
  var currentThreadId : string;

  /* Find a good insertion point, on the right-hand side of the page. */
  function findAnchor() {
    var anchor = $("div[role=complementary].nH.adC");
    if (anchor.length !== 1) {
      Log.e("Cannot find anchor point for Esper controls");
      return $();
    }
    else
      return anchor;
  }

  function removeEsperRoot() {
    $("#esper").remove();
  }

  function insertEsperRoot() {
    removeEsperRoot();
    var anchor = findAnchor();
    var root = $("<div id='esper'/>");
    anchor.prepend(root);
    return root;
  }

  function renderEvent(e: ApiT.CalendarEvent) {
'''
<div #view class="esper-ev">
  <div class="esper-ev-date">
    <div #month class="esper-ev-month"></div>
    <div #day class="esper-ev-day"></div>
  </div>
  <div>
    <div #title class="esper-ev-title"></div>
    <div class="esper-ev-times">
      <span #start class="esper-ev-start"></span>
      &rarr;
      <span #end class="esper-ev-end"></span>
    </div>
  </div>
</div>
'''
    month.text("Jun"); // TODO
    day.text("31"); // TODO
    start.text("9:00am"); // TODO
    end.text("9:30am"); // TODO

    if (e.title !== undefined)
      title.text(e.title);
    else if (e.description !== undefined)
      title.text(e.description);

    return view;
  }

  function displayEventList(events, view) {
    view.count.text(events.length.toString());
    view.events.children().remove();
    events.forEach(function(e) {
      view.events.append(renderEvent(e));
    });
  }

  function afterTyping(elt: JQuery, delayMs: number, func) {
    var lastPressed = Date.now(); // date in milliseconds
    elt
      .unbind("keydown")
      .keydown(function() {
        var t1 = lastPressed;
        var t2 = Date.now();
        if (lastPressed >= t2)
          lastPressed = lastPressed + 1;
        else
          lastPressed = t2;
        var lastPressed0 = lastPressed;
        window.setTimeout(function() {
          if (lastPressed0 === lastPressed)
            func();
        }, delayMs);
      });
  }

  function setupSearch(view) {
    afterTyping(view.searchbox, 250, function() {
      Api.eventSearch(teamid, view.searchbox.text())
    });
  }

  function displayLinkedEvents(rootElement,
                               team: ApiT.Team,
                               linkedEvents: ApiT.ShowCalendarEvents) {
'''
<div #view>
  <div class="esper-title">Linked Events (<span #count></span>)</div>
  <input #searchbox
         type="text" class="esper-searchbox"
         placeholder="Search calendar, e.g. meeting, tennis, joe, ...">
  </input>
  <div #results>
  </div>
  <div #events>
  </div>
</div>
'''
    displayEventList(linkedEvents.events, _view);
    rootElement.append(view);
  }

  /* We do something if we detect a new msg ID. */
  function maybeUpdateView(maxRetries) {
    Log.d("maybeUpdateView("+maxRetries+")");
    var emailData = gmail.get.email_data();
    if (emailData !== undefined && emailData.first_email !== undefined) {
      var threadId = emailData.first_email;
      if (currentThreadId !== threadId) {
        currentThreadId = threadId;
        Log.d("Using new thread ID " + currentThreadId);
        var rootElement = insertEsperRoot();
        Login.myTeams().forEach(function(team) {
          Api.getLinkedEvents(team.teamid, currentThreadId)
            .done(function(linkedEvents) {
              displayLinkedEvents(rootElement, team, linkedEvents);
            });
        });
      }
    }
    else {
      /* retry every second, up to 10 times. */
      if (maxRetries > 0)
        setTimeout(maybeUpdateView, 1000, maxRetries - 1);
    }
  }

  function listen() {
    gmail.on.open_email(function(id, url, body) {
      Log.d("Opened email " + id, url, body);
      maybeUpdateView(10);
    });
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      alreadyInitialized = true;
      Log.d("MsgView.init()");
      listen();
      maybeUpdateView(10);
    }
  }
}

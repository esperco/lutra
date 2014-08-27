/*
  Google Calendar event view
*/
module Esper.CalEventView {
  var currentEventId : Types.FullEventId;

  function checkForNewEventId(callback: (x: Types.FullEventId) => void) {
    var oldEventId = currentEventId;
    currentEventId = Gcal.Event.extractFullEventId();
    if (currentEventId !== undefined
        && ! Gcal.Event.equal(currentEventId, oldEventId)) {
      callback(currentEventId);
    }
  }

  function listenForNewEventId(callback: (x: Types.FullEventId) => void) {
    Util.every(300, function() {
      checkForNewEventId(callback);
    });
  }

  /* Find a good insertion point, on the right-hand side
     of the "Add guests" column. */
  function findAnchor() {
    var anchor = $("div.ep-dp");
    if (anchor.length !== 1) {
      Log.e("Cannot find anchor point for the Esper event controls.");
      return $();
    }
    else
      return anchor;
  }

  function removeEsperRoot() {
    $("#esper-event-root").remove();
  }

  function insertEsperRoot() {
    removeEsperRoot();
    var anchor = findAnchor();
    var root = $("<div id='esper-event-root'/>");
    anchor.append(root);
    return root;
  }

  function renderLinkedThread(thread: ApiT.EmailThread): JQuery {
'''
<div #view>
  <b #subject></b>
  <span #snippet></span>
</div>
'''
    subject.text(thread.subject);
    snippet.html(thread.snippet);
    return view;
  }

  function renderActiveThread(thread: Types.GmailThread): JQuery {
'''
<div #view>
  <b #subject></b>
  <span #snippet></span>
</div>
'''
    subject.text(thread.subject);
    return view;
  }

  function renderEventControls(team: ApiT.Team,
                               fullEventId: Types.FullEventId) {
'''
<div #view>
  <div>
    <div>Linked threads</div>
    <div #linked/>
  </div>
  <div>
    <div>Recently visited threads</div>
    <div #linkable/>
  </div>
</div>
'''
    Api.getLinkedThreads(team.teamid, fullEventId.eventId)
      .done(function(linkedThrids) {
        var thrids = linkedThrids.linked_threads;
        Deferred.join(
          List.map(thrids, function(thrid) {
            return Api.getThreadDetails(thrid);
          })
        ).done(function(threads) {
          List.iter(threads, function(thread) {
            var threadView = renderLinkedThread(thread);
            linked.append(threadView);
          });

          function refreshLinkable() {
            linkable.children().remove();
            var account = Login.getAccount();
            var activeThreads = account.activeThreads;
            if (activeThreads !== undefined) {
              List.iter(activeThreads.threads, function(thread) {
                if (! List.exists(thrids, function(thrid) {
                  return thread.threadId === thrid;
                })) {
                  var threadView = renderActiveThread(thread);
                  linkable.append(threadView);
                }
              });
            }
          }

          refreshLinkable();
          Login.watchableAccount.watch(function(newAccount, newValidity,
                                                oldAccount, oldValidity) {
            refreshLinkable();
          });
        });
      });

    return view;
  }

  function updateView(fullEventId) {
    var rootElement = insertEsperRoot();
    /* For each team that uses this calendar */
    Login.myTeams().forEach(function(team) {
      if (team.team_calendar.google_calendar_id === fullEventId.calendarId) {
        rootElement.append(renderEventControls(team, fullEventId));
      }
    });
  }

  var alreadyInitialized = false;

  export function init() {
    if (! alreadyInitialized) {
      alreadyInitialized = true;
      listenForNewEventId(function(fullEventId) {
        Log.d("New current event ID:", fullEventId);
        ActiveEvents.handleNewActiveEvent(fullEventId);
        updateView(fullEventId);
      });
    }
  }
}

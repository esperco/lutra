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

  /* Find a good insertion point */
  function findAnchor() {
    /* Table row with header "Calendar" and dropdown for choosing calendar */
    var anchor = $("#\\:15\\.calendar-row");
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
    var root = $("<tr id='esper-event-root'/>");
    root.insertAfter(anchor);
    return root;
  }

  function makeGmailThreadUrl(threadId: string) {
    var url =
      "https://mail.google.com/mail/u/" + Gcal.getUserEmail()
      + "/#inbox/" + threadId;
    return url;
  }

  function renderLinkedThread(
    teamid,
    thread: ApiT.EmailThread,
    fullEventId: Types.FullEventId
  ): JQuery {
'''
<div #view
     class="esper-thread-row">
  <img #unlinkButton class="esper-clickable"
                     title="Click to unlink this conversation from the event"/>
  <a #threadView
     target="_blank"
     class="esper-message">
    <span #subject class="esper-subject"></span>
    <span #snippet class="esper-snippet"></span>
  </a>
</div>
'''
    unlinkButton.attr("src", Init.esperRootUrl + "img/linked.png");
    subject.text(thread.subject);
    snippet.html(thread.snippet);

    unlinkButton.click(function() {
      Api.unlinkEvent(teamid, thread.gmail_thrid, fullEventId.eventId)
        .done(function() {
          view.remove();
        });
    });

    var gmailUrl = makeGmailThreadUrl(thread.gmail_thrid);
    threadView.attr("href", gmailUrl);

    return view;
  }

  function renderActiveThread(
    teamid,
    thread: Types.GmailThread,
    fullEventId: Types.FullEventId): JQuery {
'''
<div #view
     class="esper-thread-row">
  <img #linkButton class="esper-clickable"
                   title="Click to link this conversation to the event"/>
  <a #threadView
     target="_blank"
     class="esper-message">
    <span #subject class="esper-subject"></span>
    <span #snippet class="esper-snippet"></span>
  </a>
</div>
'''
    linkButton.attr("src", Init.esperRootUrl + "img/unlinked.png");
    subject.text(thread.subject);

    linkButton.click(function() {
      Api.linkEventForMe(teamid, thread.threadId, fullEventId.eventId)
        .done(function() {
          updateView(fullEventId);
          Api.linkEventForTeam(teamid, thread.threadId, fullEventId.eventId);
        });
    });

    threadView.attr("href", makeGmailThreadUrl(thread.threadId));

    return view;
  }

  function renderTh(): JQuery {
'''
<th #th class="ep-dp-dt-th">
  <label>Email</label>
</th>
'''
    return th;
  }

  function renderEventControls(team: ApiT.Team,
                               fullEventId: Types.FullEventId) {
    var th = renderTh();

'''
<td #td class="ep-dp-dt-td">
  <div #linked/>
  <div #linkable/>
</td>
'''
    var teamid = team.teamid;
    Api.getLinkedThreads(teamid, fullEventId.eventId)
      .done(function(linkedThrids) {
        var thrids = linkedThrids.linked_threads;
        Deferred.join(
          List.map(thrids, function(thrid) {
            return Api.getThreadDetails(thrid);
          })
        ).done(function(threads) {
          List.iter(threads, function(thread) {
            var threadView = renderLinkedThread(teamid, thread, fullEventId);
            linked.append(threadView);
          });

          function refreshLinkable() {
            linkable.children().remove();
            var account = Login.getAccount();
            var activeThreads = account.activeThreads;
            if (activeThreads !== undefined) {
              List.iter(activeThreads.threads, function(v) {
                var thread = v.item;
                if (thread !== undefined) {
                  if (! List.exists(thrids, function(thrid) {
                    return thread.threadId === thrid;
                  })) {
                    var threadView =
                      renderActiveThread(teamid, thread, fullEventId);
                    linkable.append(threadView);
                  }
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

    return { th: th, td: td };
  }

  function updateView(fullEventId) {
    var rootElement = insertEsperRoot();
    /* For each team that uses this calendar */
    Login.myTeams().forEach(function(team) {
      if (team.team_calendar.google_calendar_id === fullEventId.calendarId) {
        var rowElements = renderEventControls(team, fullEventId);
        rootElement
          .append(rowElements.th)
          .append(rowElements.td);
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

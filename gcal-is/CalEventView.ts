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

  function removeEsperRoot() {
    $("#esper-event-root").remove();
  }

  function insertEsperRoot() {
    removeEsperRoot();
    var anchor = Gcal.Event.findAnchor();
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
    team,
    thread: ApiT.EmailThread,
    fullEventId: Types.FullEventId
  ): JQuery {
'''
<div #view
     class="esper-thread-row">
  <img #unlinkButton alt="Linked"
                     class="esper-clickable"
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

    var teamid = team.teamid;
    var threadId = thread.gmail_thrid;
    var eventId = fullEventId.eventId;
    unlinkButton.click(function() {
      Api.unlinkEvent(teamid, threadId, eventId)
        .done(function() {
          view.remove();
          Api.getEventDetails(teamid, fullEventId.calendarId,
                              team.team_calendars, eventId)
            .done(function(event) {
              mergeDescription(event);
              Log.d("Updated description textarea.");
            });
        });
    });

    var gmailUrl = makeGmailThreadUrl(thread.gmail_thrid);
    threadView.attr("href", gmailUrl);

    return view;
  }

  /*
    Keep the user-edited part of the description field (text area), and
    overwrite the bottom part below the marker with the new content
    from the server.
  */
  export function mergeDescriptionText(userDescription: string,
                                       serverDescription: string) {
    var delimiter = "=== Conversation ===";

    var split1 = userDescription.split(delimiter);
    var split2 = serverDescription.split(delimiter);
    var description = "";
    if (split1.length >= 1) {
      description += split1[0];
      if (description.length > 0
          && description[description.length-1] !== '\n')
        description += "\n";
    }
    if (split2.length >= 2) {
      description += delimiter;
      split2.shift();
      description += split2.join(delimiter);
    }
    return description;
  }

  export function testMergeDescriptionText() {
    console.assert(mergeDescriptionText("", "") === "");
    console.assert(mergeDescriptionText("bla", "") === "bla\n");
    console.assert(mergeDescriptionText("bla\n=== Conversation ===\nbe gone",
                                        "=== Conversation ===")
                   === "bla\n=== Conversation ===");
    console.assert(mergeDescriptionText("bla\n=== Conversation ===\nbe gone",
                                        "=== Conversation ===\nYo!")
                   === "bla\n=== Conversation ===\nYo!");
  }

  function mergeDescription(event: ApiT.CalendarEvent) {
    var userDescriptionElt = Gcal.Event.findDescriptionBox();
    var userDescription = userDescriptionElt.val();
    var serverDescription = event.description;
    if (userDescriptionElt.length === 1 && serverDescription !== undefined) {
      var description =
        mergeDescriptionText(userDescription, serverDescription);
      userDescriptionElt.val(description);
    }
  }

  function renderActiveThread(
    team,
    thread: Types.GmailThread,
    fullEventId: Types.FullEventId
  ): JQuery {
'''
<div #view
     class="esper-thread-row">
  <img #linkButton alt="Unlinked"
                   class="esper-clickable"
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

    var teamid = team.teamid;
    var threadId = thread.threadId;
    var calendarId = fullEventId.calendarId;
    var eventId = fullEventId.eventId;
    linkButton.click(function() {
      Api.linkEventForMe(teamid, threadId, eventId)
        .done(function() {
          updateView(fullEventId);
          Api.linkEventForTeam(teamid, threadId, eventId)
            .done(function() {
              Api.syncEvent(teamid, threadId, calendarId, eventId)
                .done(function() {
                  updateView(fullEventId);
                  Api.getEventDetails(teamid, calendarId,
                                      team.team_calendars, eventId)
                    .done(function(event) {
                      mergeDescription(event);
                      Log.d("Link and sync complete.");
                    });
                });
            });
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
        Promise.join(
          List.map(thrids, function(thrid) {
            return Api.getThreadDetails(thrid);
          })
        ).done(function(threads) {
          List.iter(threads, function(thread) {
            var threadView = renderLinkedThread(team, thread, fullEventId);
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
                      renderActiveThread(team, thread, fullEventId);
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
      if (List.mem(team.team_calendars, fullEventId.calendarId)) {
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

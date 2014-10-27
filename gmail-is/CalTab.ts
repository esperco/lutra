module Esper.CalTab {

  /* To refresh from outside, like in CalPicker */
  export var refreshLinkedEvents : () => void;
  export var currentCalTab : CalTabView;

  /** The events currently displayed as "linked" in the sidebar. */
  export var currentEvents : ApiT.EventWithSyncInfo[] = [];

  var currentEventsListeners = [];

  export var currentTask : ApiT.Task;

  export function onEventsChanged(callback) {
    currentEventsListeners.push(callback);
  }

  function updateEvents(newEvents) {
    currentEvents = newEvents;

    for (var i = 0; i < currentEventsListeners.length; i++) {
      currentEventsListeners[i]();
    }
  }

  function toggleList(container) {
    if (container.css("display") === "none") {
      container.slideDown("fast");
    } else {
      container.slideUp("fast");
    }
  }

  function obtainTaskForThread(teamid, threadId,
                               view: CalTabView) {
    if (currentTask !== undefined)
      return Promise.defer(currentTask);
    else {
      return Api.obtainTaskForThread(teamid, threadId)
        .then(function(task) {
          currentTask = task;
          view.taskCaption.text("Task:");
          view.taskName.text(task.task_title);
          return task;
        });
    }
  }

  export function linkEvent(e, team, threadId,
                            calTab: CalTabView,
                            profiles,
                            view: LinkOptionsView) {
    Api.linkEventForMe(team.teamid, threadId, e.google_event_id)
      .done(function() {
        // TODO Report something, handle failure, etc.
        view.link.hide();
        view.spinner.hide();
        view.linked.show();
        Api.linkEventForTeam(team.teamid, threadId, e.google_event_id)
          .done(function() {
            refreshEventLists(team, threadId, calTab, profiles);
            obtainTaskForThread(team.teamid, threadId,
                                calTab);
            Api.syncEvent(team.teamid, threadId,
                          e.google_cal_id, e.google_event_id);
          });
      });
  }

  function viewPersonInvolved(peopleInvolved, email, name) {
'''
<li #viewPerson>
  <input #checkPerson type="checkbox"/>
  <label #labelPerson/>
</li>
'''
    var forID = Util.randomString();
    checkPerson.attr("id",  forID);
    labelPerson.attr("for", forID);

    labelPerson.text(0 < name.length ? name + " <" + email + ">"
                                     : email);
    checkPerson.change(function() {
      if (undefined === peopleInvolved[email]) {
        peopleInvolved[email] = name;
      } else {
        delete peopleInvolved[email];
      }
    });
    return viewPerson;
  }

  function pubInviteView(team, e, threadid, calTab, profiles) {
'''
<div #pubInvite class="esper-section esper-pub">
  <div class="esper-section-header esper-clearfix open">
    Public Duplicate
  </div>
  <div class="esper-section-container">
    <p>Title: <input #pubTitle/></p>
    <p>Calendar: <select #pubCalendar/></p>
    <p>Location: <input #pubLocation/></p>
    <p>Description: <textarea #pubDescription rows=5 cols=28 /></p>
    <p>From: <select #fromSelect/></p>
    <p>Guests:</p>
    <ul #viewPeopleInvolved/>
    <p align="right">
      <button #discard>Discard</button><button #create>Create</button>
    </p>
  </div>
</div>
'''
    pubTitle.val(undefined === e.title ? "Untitled event" : e.title);
    if (undefined !== e.description) {
      pubDescription.val(e.description);
    }
    if (undefined !== e.location) {
      var loc = e.location.address;
      if (e.location.title !== "")
        loc = e.location.title + " - " + loc;
      pubLocation.val(loc);
    }

    var firstTeamCal = team.team_calendars[0];
    var publicCalId =
      firstTeamCal !== undefined ?
      firstTeamCal.google_cal_id :
      e.google_cal_id;
    List.iter(team.team_calendars, function(cal : ApiT.Calendar) {
      var opt = $("<option value='" + cal.google_cal_id + "'>"
                  + cal.calendar_title + "</option>");
      opt.appendTo(pubCalendar);
    });
    pubCalendar.change(function() {
      publicCalId = $(this).val();
    });

    var aliases = team.team_email_aliases;
    var fromEmail;
    if (aliases.length === 0) {
      fromEmail = Login.myEmail();
      $("<option>" + fromEmail + "</option>")
        .appendTo(fromSelect);
      fromSelect.prop("disabled", true);
    } else {
      fromEmail = aliases[0];
      List.iter(aliases, function(email : string) {
        $("<option>" + email + "</option>")
          .appendTo(fromSelect);
      });
    }
    fromSelect.change(function() {
      fromEmail = $(this).val();
    });

    var peopleInvolved = [];
    var emailData = esperGmail.get.email_data();
    if (emailData !== undefined && emailData.first_email !== undefined) {
      List.iter(emailData.people_involved, function(pair) {
        var v = viewPersonInvolved(peopleInvolved, pair[1], pair[0]);
        viewPeopleInvolved.append(v);
      });
    }

    create.click(function() {
      create.text("Creating...");
      create.prop("disabled", true);
      var guests = [];
      for (var email in peopleInvolved) {
        guests.push({email: email, display_name: peopleInvolved[email]});
      }
      var loc = {
        /* Right now we don't care about title because this is just text
           to be displayed in the Google Calendar location box... but in
           the future we may use it for typeahead or something. */
        title: "",
        address: pubLocation.val()
      };
      if (loc.address === "") loc = null;
      var ev = {
        google_cal_id: publicCalId,
        start:         e.start,
        end:           e.end,
        title:         pubTitle.val(),
        description:   pubDescription.val(),
        location:      loc,
        all_day:       e.all_day,
        guests:        guests,
      };
      Api.createLinkedEvent(team.teamid, ev, threadid)
        .done(function(created) {
          pubInvite.remove();
          Api.sendEventInvites(team.teamid, fromEmail, guests, created);
          refreshLinkedList(team, threadid, calTab, profiles);
        });
    });
    discard.click(function() {
      pubInvite.remove();
    });

    return pubInvite;
  }

  export interface LinkOptionsView {
    view: JQuery;
    link: JQuery;
    spinner: JQuery;
    linked: JQuery;
    check: JQuery;
  }

  function displayLinkOptions(e: ApiT.CalendarEvent,
                              linkedEvents: ApiT.EventWithSyncInfo[],
                              team,
                              threadId,
                              calTab: CalTabView,
                              profiles: ApiT.Profile[]) {
'''
<div #view>
  <div #link class="esper-link-event esper-clickable">Link to this event</div>
  <div #spinner/>
  <div #linked class="esper-linked">
    <object #check class="esper-svg"/>
    <span>Linked</span>
  </div>
</div>
'''
    check.attr("data", Init.esperRootUrl + "img/check.svg");

    var alreadyLinked = linkedEvents.filter(function(ev) {
      return ev.event.google_event_id === e.google_event_id;
    })

    if (alreadyLinked.length > 0) {
      link.hide();
      linked.show();
    } else {
      link.show();
      linked.hide();
    }

    link.click(function() {
      link
        .removeClass("esper-link-event")
        .addClass("esper-linked")
        .text("Linking...");
      linkEvent(e, team, threadId, calTab, profiles, _view);
    });

    return view;
  }

  function displayEventOptions(view,
                               ev: ApiT.EventWithSyncInfo,
                               linkedEvents: ApiT.EventWithSyncInfo[],
                               team: ApiT.Team,
                               threadId: string,
                               calTab: CalTabView,
                               profiles: ApiT.Profile[]) {
'''
<div #optionsView>
  <div #disclose class="esper-click-safe esper-dropdown-btn
                   esper-clickable esper-ev-disclose"/>
  <ul #dropdown class="esper-ul esper-ev-dropdown">
    <div class="esper-dropdown-section">
      <li #editEvent
          class="esper-li esper-disabled">
        Edit
      </li>
      <li #duplicateEvent
          class="esper-li">
        Duplicate
      </li>
      <li #unlinkEvent
          class="esper-li">
        Unlink
      </li>
      <li #deleteEvent
          class="esper-li esper-danger">
        Delete from calendar
      </li>
      <li #chooseThisEvent
          class="esper-li">
        Choose this event
      </li>
    </div>
    <div class="esper-click-safe esper-ul-divider"/>
    <div #syncOption class="esper-click-safe esper-dropdown-section">
      <li class="esper-click-safe esper-li esper-disabled esper-sync-option">
        <span class="esper-click-safe esper-sync-option-text">
          Description Sync
        </span>
        <object #info title class="esper-click-safe esper-info"/>
        <input #syncCheckbox
               type="checkbox"
               class="esper-click-safe esper-sync-checkbox"/>
        <div #spinner
             class="esper-click-safe esper-spinner esper-sync-spinner"/>
      </li>
      <li #teamSync
          class="esper-click-safe esper-li esper-disabled esper-sync-users"/>
      <li #syncNote
          class="esper-click-safe esper-li esper-disabled esper-sync-note"/>
    </div>
  </ul>
</div>
'''
    var e = ev.event;

    if (e.google_cal_url !== undefined) {
      editEvent
        .removeClass("esper-disabled")
        .click(function() {
          open(e.google_cal_url, "_blank");
        });
    }

    var infoContent = "Automatically synchronizes the event's " +
      "description with the contents of this email conversation.";
    info
      .attr("data", Init.esperRootUrl + "img/info.svg")
      .tooltip({
        show: { effect: "none" },
        hide: { effect: "none" },
        "content": infoContent,
        "position": { my: 'center bottom', at: 'center top-5' },
        "tooltipClass": "esper-top esper-sync-info"
      });

    syncCheckbox.change(function() {
      var apiCall;
      if(this.checked) apiCall = Api.syncEvent;
      else apiCall = Api.unsyncEvent;
      syncCheckbox.hide();
      spinner.show();
      apiCall(team.teamid, threadId, e.google_cal_id, e.google_event_id)
        .done(function() {
          spinner.hide();
          syncCheckbox.show();
          refreshLinkedList(team.teamid, threadId, calTab, profiles);
        });
    });

    var currentSynced = false;
    var syncedUsers = [];

    List.iter(profiles, function(prof) {
      var synced = List.exists(ev.synced_threads, function(x) {
        return x.esper_uid === prof.profile_uid;
      });
      if (synced && prof.profile_uid === Login.myUid()) {
        syncCheckbox.attr("checked", true);
        currentSynced = true;
        syncedUsers.unshift("You");
      } else if (synced) {
        syncedUsers.push(prof.display_name);
      }
    });

    var teamPhrase = "";
    if ((syncedUsers.length === 0) ||
        (syncedUsers.length === 1 && syncedUsers[0] === "You")) {
      teamPhrase = "No other team members are ";
      syncNote.hide();
    } else if (syncedUsers.length === 1) {
      teamPhrase = syncedUsers[0] + " is ";
    } else if (syncedUsers.length === 2) {
      teamPhrase = syncedUsers[0] + " and " + syncedUsers[1] + " are ";
    } else {
      for (var i = 0; i < syncedUsers.length; i++) {
        if (i < syncedUsers.length - 1)
          teamPhrase += syncedUsers[i] + ", ";
        else
          teamPhrase += "and " + syncedUsers[i] + " are ";
      }
    }
    teamSync.text(teamPhrase += " syncing messages with this event.");

    var notePhrase = "";
    if (!currentSynced && syncedUsers.length > 0) {
      notePhrase = "Turn on Description Sync to also include messages from " +
        "your version of this email conversation. Duplicate messages will be " +
        "automatically excluded.";
    } else if (syncedUsers.length > 1) {
      notePhrase = "Duplicate messages are automatically excluded.";
    }
    syncNote.text(notePhrase);

    disclose.click(function() {
      if (disclose.hasClass("open")) {
        Sidebar.dismissDropdowns();
      } else {
        Sidebar.dismissDropdowns();
        dropdown.toggle();
        disclose.addClass("open");
      }
    })

    duplicateEvent.click(function() {
      $(".esper-pub").remove();
      view.append(pubInviteView(team, e, threadId, calTab, profiles));
    });

    unlinkEvent.click(function() {
      view.addClass("esper-disabled");
      Api.unlinkEvent(team.teamid, threadId, e.google_event_id)
        .done(function() {
          refreshEventLists(team, threadId, calTab, profiles);
        });
    });

    deleteEvent.click(function() {
      view.addClass("esper-disabled");
      Api.deleteLinkedEvent(team.teamid, threadId, e.google_event_id)
        .done(function() {
          refreshEventLists(team, threadId, calTab, profiles);
        });
    });

    chooseThisEvent.click(function() {
      var msg = "Other linked events will be deleted. Are you sure?";
      if (window.confirm(msg)) { // TODO Style me
        var thisEventId = e.google_event_id;
        view.parent().find(".esper-ev").addClass("esper-disabled");
        var deleteCalls = List.map(linkedEvents, function(ev) {
          var otherEventId = ev.event.google_event_id;
          if (otherEventId !== thisEventId)
            return Api.deleteLinkedEvent(team.teamid, threadId, otherEventId);
          else
            return Promise.defer(void(0));
        });
        Promise.join(deleteCalls).done(function() {
          refreshEventLists(team, threadId, calTab, profiles);
        });
      }
    });

    return optionsView;
  }

  function renderEvent(linkedEvents: ApiT.EventWithSyncInfo[],
                       ev, recent, last, team: ApiT.Team,
                       threadId: string, calTab: CalTabView,
                       profiles: ApiT.Profile[]) {
'''
<div #view class="esper-ev">
  <div #date title class="esper-ev-date">
    <div #month class="esper-ev-month"/>
    <div #day class="esper-ev-day"/>
  </div>
  <div>
    <div class="esper-ev-title"><span #title/></div>
    <div #time class="esper-ev-times">
      <span #startTime class="esper-ev-start"/>
      &rarr;
      <span #endTime class="esper-ev-end"/>
    </div>
  </div>
</div>
'''
    var e = ev;

    if (recent) {
      view.append(displayLinkOptions(ev, linkedEvents, team,
                                     threadId, calTab, profiles));
    } else {
      e = ev.event;
      time.prepend(displayEventOptions(view, ev, linkedEvents, team,
                                       threadId, calTab, profiles));
    }

    var start = XDate.ofString(e.start.local);
    var end = XDate.ofString(e.end.local);

    month.text(XDate.month(start).toUpperCase());
    day.text(XDate.day(start).toString());
    startTime.text(XDate.timeOnly(start));
    endTime.text(XDate.timeOnly(end));

    if (e.title !== undefined)
      title.text(e.title);
    else
      title.text("Untitled event");

    if (e.google_cal_url !== undefined) {
      date
        .addClass("esper-clickable")
        .click(function() {
          open(e.google_cal_url, "_blank");
        })
        .tooltip({
          show: { delay: 500, effect: "none" },
          hide: { effect: "none" },
          "content": "Open in Google Calendar",
          "position": { my: 'center bottom', at: 'center top-1' },
          "tooltipClass": "top esper-tooltip"
        });
      title
        .addClass("esper-link-black")
        .click(function() {
          open(e.google_cal_url, "_blank");
        });
    }

    if (last)
      view.addClass("esper-last");

    return view;
  }

  function mergeActiveWithCreated(active: Types.Visited<Types.FullEventId>[],
                                  created: ApiT.CreatedCalendarEvent[]) {
    var createdTimed = List.map(created, function(e) {
      var time = XDate.ofString(e.creation_time).getTime() / 1000;
      var item = { calendarId: e.google_cal_id, eventId: e.google_event_id };
      return { id: e.google_event_id, item: item, lastVisited: time };
    });
    return Visited.merge(active, createdTimed, 5);
  }

  export function displayRecentsList(team, threadId,
                                     calTab: CalTabView,
                                     profiles,
                                     linkedEvents: ApiT.EventWithSyncInfo[]) {
'''
  <div #noEvents class="esper-no-events">No recently viewed events</div>
  <div #eventsList class="esper-events-list"/>
'''
    calTab.refreshRecents.addClass("esper-disabled");
    calTab.recentsList.children().remove();
    calTab.recentsSpinner.show();

    function renderNone() {
      calTab.recentsList.append(noEvents);
      calTab.recentsSpinner.hide();
      calTab.refreshRecents.removeClass("esper-disabled");
    }

    if (team === null || team === undefined) {
      renderNone();
      return;
    }
    var active = Login.getAccount().activeEvents;
    if (active === null || active === undefined) {
      renderNone();
      return;
    }
    var events = active.calendars;
    var activeEvents = [];
    List.iter(team.team_calendars, function(cal : ApiT.Calendar) {
      var eventsForCal = events[cal.google_cal_id];
      if (eventsForCal !== undefined)
        activeEvents = activeEvents.concat(eventsForCal);
    });
    if (activeEvents === []) {
      renderNone();
      return;
    }

    Api.getRecentlyCreatedEvents(team.teamid, team.team_calendars)
      .done(function(created) {
        var eventsForTeam: Types.Visited<Types.FullEventId>[] =
          mergeActiveWithCreated(activeEvents, created.created_events);

        var getEventCalls =
          List.filterMap(
            eventsForTeam,
            function(e) {
              var item = e.item; // compatibility check
              if (item !== undefined) {
                return Api.getEventDetails(team.teamid, item.calendarId,
                                           team.team_calendars, item.eventId);
              } else {
                renderNone();
                return;
              }
          });

        Promise.join(getEventCalls).done(function(activeEvents) {
          var i = 0;
          var last = false;
          var recent = true;
          activeEvents.forEach(function(response: ApiT.CalendarEventOpt) {
            var e = response.event_opt;
            if (e === undefined) return; // event is deleted aka cancelled
            if (i === activeEvents.length - 1)
              last = true;
            eventsList.append(renderEvent(linkedEvents, e, recent, last, team,
                                          threadId, calTab, profiles));
            i++;
          });
        calTab.recentsList.append(eventsList);
        calTab.recentsSpinner.hide();
        calTab.refreshRecents.removeClass("esper-disabled");
      });
    });
  }

  /* reuse the view created for the team, update list of linked events */
  export function displayLinkedList(team,
                                    threadId,
                                    calTab: CalTabView,
                                    profiles,
                                    linkedEvents: ApiT.EventWithSyncInfo[]) {
'''
  <div #noEvents class="esper-no-events">No linked events</div>
  <div #eventsList class="esper-events-list"/>
'''
    calTab.refreshLinked.addClass("esper-disabled");
    calTab.linkedList.children().remove();
    calTab.linkedSpinner.show();

    currentEvents = linkedEvents;
    updateEvents(linkedEvents);

    if (currentEvents.length === 0) {
      calTab.linkedList.append(noEvents);
    } else {
      var i = 0;
      var recent, last = false;
      currentEvents.forEach(function(e: ApiT.EventWithSyncInfo) {
        if (i === currentEvents.length - 1)
          last = true;
        eventsList.append(renderEvent(linkedEvents, e, recent, last, team,
                                      threadId, calTab, profiles));
        i++;
      });
      calTab.linkedList.append(eventsList);
    }
    calTab.linkedSpinner.hide();
    calTab.refreshLinked.removeClass("esper-disabled");
  }

  export function clearLinkedList(team, calTab: CalTabView) {
    displayLinkedList(team, "", calTab, [], []);
  }

  /* Refresh only linked events, fetching linked events from the server. */
  export function refreshLinkedList(team, threadId, calTab, profiles) {
    Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
      .done(function(linkedEvents) {
        displayLinkedList(team, threadId, calTab, profiles, linkedEvents);
      });
  }

  /* Refresh only recent events, fetching linked events from the server. */
  export function refreshRecentsList(team, threadId, calTab, profiles) {
    Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
      .done(function(linkedEvents) {
        displayRecentsList(team, threadId, calTab, profiles, linkedEvents);
      });
  }

  /* Refresh linked events and recent events, fetching linked events from
     the server. */
  export function refreshEventLists(team, threadId, calTab, profiles) {
    Api.getLinkedEvents(team.teamid, threadId, team.team_calendars)
      .done(function(linkedEvents) {
        displayLinkedList(team, threadId, calTab, profiles, linkedEvents);
        displayRecentsList(team, threadId, calTab, profiles, linkedEvents);
      });
  }

  // Search for matching tasks and display the results in a dropdown
  function displaySearchResults(taskName, dropdown,
                                team: ApiT.Team,
                                query,
                                profiles: ApiT.Profile[],
                                calTab: CalTabView) {
    var threadid = Sidebar.currentThreadId;
    var teamid = team.teamid;
    Api.searchTasks(teamid, query).done(function(response) {
      dropdown.find(".esper-li").remove();
      if (!(dropdown.hasClass("open"))) dropdown.toggle();
      List.iter(response.search_results, function(result) {
        var newTaskId = result.task_data.taskid;
        var title = result.task_data.task_title;
        $("<li class='esper-li'>" + title + "</li>")
          .appendTo(dropdown)
          .click(function() {
            var job =
              currentTask !== undefined ?
              Api.switchTaskForThread(teamid, threadid,
                                      currentTask.taskid, newTaskId)
              :
              Api.linkThreadToTask(teamid, threadid,
                                   newTaskId);

            job.done(function() {
              refreshLinkedList(team, threadid, calTab, profiles);
            });

            currentTask = result.task_data;
            taskName.val(title);
            Sidebar.dismissDropdowns();
          });
      });

      var changeNameLabel =
        currentTask !== undefined ?
          "Change task name to:"
        : "Create task named:";
      var changeName =
        $("<li class='esper-li'><i>" + changeNameLabel + "</i> "
          + query + "</li>");
      changeName
        .appendTo(dropdown)
        .click(function() {
          obtainTaskForThread(teamid, threadid, calTab)
            .done(function(task) {
              Api.setTaskTitle(currentTask.taskid, query);
              currentTask.task_title = query;
              taskName.val(query);
              Sidebar.dismissDropdowns();
            });
        });

      function addDeleteOption(task) {
'''
<li #li class="esper-li">
  <i>Delete this task</i>
</li>
'''
        li
          .appendTo(dropdown)
          .click(function() {
            Api.deleteTask(task.taskid)
              .done(function() {
                currentTask = undefined;
                calTab.taskCaption.text("Create task:");
                clearLinkedList(team, calTab);
                Sidebar.dismissDropdowns();
              });
          });
      }
      if (currentTask !== undefined)
        addDeleteOption(currentTask);

      dropdown.addClass("open");
    });
  }

  export interface CalTabView {
    taskCaption: JQuery;
    taskName: JQuery;
    taskSearch: JQuery;
    linkedEventsHeader: JQuery;
    showLinkedEvents: JQuery;
    refreshLinked: JQuery;
    refreshLinkedIcon: JQuery;
    linkActions: JQuery;
    createEventIcon: JQuery;
    createEventToggle: JQuery;
    linkEvent: JQuery;
    linkEventIcon: JQuery;
    createEvent: JQuery;
    linkedEventsContainer: JQuery;
    linkedSpinner: JQuery;
    linkedList: JQuery;
    recentEventsHeader: JQuery;
    showRecentEvents: JQuery;
    refreshRecents: JQuery;
    refreshRecentsIcon: JQuery;
    recentEventsContainer: JQuery;
    recentsSpinner: JQuery;
    recentsList: JQuery;
  }

  export function displayCalendarTab(tab1,
                                     team: ApiT.Team,
                                     autoTask: boolean,
                                     profiles: ApiT.Profile[],
                                     linkedEvents: ApiT.EventWithSyncInfo[]) {
'''
<div #view>
  <div class="esper-section">
    <span #taskCaption class="esper-bold"/>
    <input #taskName type="text" size="24"/>
    <ul #taskSearch
        class="esper-task-search-dropdown esper-dropdown-btn esper-ul">
      <div class="esper-dropdown-section"/>
    </ul>
  </div>
  <div class="esper-section">
    <div #linkedEventsHeader class="esper-section-header esper-clearfix open">
      <span #showLinkedEvents
            class="esper-link" style="float:right">Hide</span>
      <span class="esper-bold" style="float:left">Linked Events</span>
      <div #refreshLinked class="esper-refresh esper-clickable esper-disabled">
        <object #refreshLinkedIcon class="esper-svg-block"/>
      </div>
    </div>
    <div #linkActions class="esper-section-actions esper-clearfix">
      <div style="display:inline-block">
        <div class="esper-link-action">
          <object #createEventIcon class="esper-svg esper-link-action-icon"/>
          <div #createEventToggle
               class="esper-click-safe esper-dropdown-btn
                      esper-clickable esper-link-action-text">
            Create event
          </div>
        </div>
        <div class="esper-vertical-divider"/>
        <div #linkEvent class="esper-link-action">
          <object #linkEventIcon class="esper-svg esper-link-action-icon"/>
          <div class="esper-link-action-text">Link event</div>
        </div>
        <ul #createEvent class="esper-create-event-dropdown esper-ul">
          <div class="esper-dropdown-section"/>
        </ul>
      </div>
    </div>
    <div #linkedEventsContainer class="esper-section-container">
      <div #linkedSpinner class="esper-events-list-loading">
        <div class="esper-spinner esper-list-spinner"/>
      </div>
      <div #linkedList/>
    </div>
  </div>
  <div class="esper-section">
    <div #recentEventsHeader class="esper-section-header esper-clearfix open">
      <span #showRecentEvents
            class="esper-link" style="float:right">Hide</span>
      <span class="esper-bold" style="float:left">Recents</span>
      <div #refreshRecents
           class="esper-refresh esper-clickable esper-disabled">
        <object #refreshRecentsIcon class="esper-svg-block"/>
      </div>
    </div>
    <div #recentEventsContainer class="esper-section-container">
      <div #recentsSpinner class="esper-events-list-loading">
        <div class="esper-spinner esper-list-spinner"/>
      </div>
      <div #recentsList/>
    </div>
  </div>
</div>
'''
    var calTabView = currentCalTab = <CalTabView> _view;
    var threadId = Sidebar.currentThreadId;

    refreshLinkedIcon.attr("data", Init.esperRootUrl + "img/refresh.svg");
    refreshRecentsIcon.attr("data", Init.esperRootUrl + "img/refresh.svg");
    createEventIcon.attr("data", Init.esperRootUrl + "img/create.svg");
    linkEventIcon.attr("data", Init.esperRootUrl + "img/link.svg");

    displayLinkedList(team, threadId, calTabView, profiles, linkedEvents);
    displayRecentsList(team, threadId, calTabView, profiles, linkedEvents);

    var apiGetTask = autoTask ?
      Api.getAutoTaskForThread
      : Api.getTaskForThread;

    apiGetTask(team.teamid, threadId).done(function(task) {
      currentTask = task;
      var title = "";
      if (task !== undefined) {
        taskCaption.text("Task:");
        title = task.task_title;
      }
      else {
        taskCaption.text("Create task:");
        var thread = esperGmail.get.email_data();
        if (thread !== undefined && thread !== null)
          title = thread.subject;
      }
      taskName.val(title);
      Util.afterTyping(taskName, 250, function() {
        var query = taskName.val();
        if (query !== "")
          displaySearchResults(taskName, taskSearch, team, query,
                               profiles, calTabView);
      });
    });

    /* Set function to refresh from outside without passing any arguments  */
    refreshLinkedEvents = function() {
      refreshLinkedList(team, threadId, calTabView, profiles);
      if (linkedEventsContainer.css("display") === "none") {
        toggleList(linkedEventsContainer);
        showLinkedEvents.text("Hide");
      }
    };
    refreshLinked.click(refreshLinkedEvents);

    refreshRecents.click(function() {
      refreshRecentsList(team, threadId, calTabView, profiles);
      if (recentEventsContainer.css("display") === "none") {
        toggleList(recentEventsContainer);
        showRecentEvents.text("Hide");
      }
    });

    showLinkedEvents.click(function() {
      toggleList(linkedEventsContainer);
      if (this.innerHTML === "Hide")
        $(this).text("Show");
      else
        $(this).text("Hide");
    });

    showRecentEvents.click(function() {
      toggleList(recentEventsContainer);
      if (this.innerHTML === "Hide")
        $(this).text("Show");
      else
        $(this).text("Hide");
    });

    createEventToggle.click(function() {
      if (createEventToggle.hasClass("open")) {
        Sidebar.dismissDropdowns();
      } else {
        Sidebar.dismissDropdowns();
        createEvent.toggle();
        createEventToggle.addClass("open");
      }
    });

    List.iter(team.team_calendars, function(cal) {
      var li = $("<li class='esper-li'>" + cal.calendar_title + "</li>");
      li.click(function() {
        var newTab = window.open("");
        newTab.document.write("Creating new linked event, please wait...");
        Api.createEmptyLinkedEvent(team.teamid, cal, threadId)
          .done(function(e) {
            var eventId = e.google_event_id;
            if (eventId !== null && eventId !== undefined) {
              newTab.document.write(" done! Syncing thread to description...");
              Api.syncEvent(team.teamid, threadId, cal.google_cal_id, eventId)
                .done(function() {
                  refreshLinkedList(team, threadId, calTabView, profiles);
                  var url = e.google_cal_url;
                  if (url !== null && url !== undefined)
                    newTab.location.assign(url);
                });
            }
          });
      });
      li.appendTo(createEvent);
    });

    linkEvent.click(function() {
      CalSearch.openSearchModal(team, threadId, calTabView, profiles);
    });

    /* Reuse the same watcherId in order to overwrite the previous
       watcher for that same thread or any other thread,
       since at most one thread is displayed at once.
    */
    var watcherId = "CalTab-watcher";
    Login.watchableAccount.watch(function(newAccount, newValidity) {
      if (newValidity === true && threadId === Sidebar.currentThreadId) {
        Log.d("Refreshing recently viewed events");
        refreshRecentsList(team, threadId, calTabView, profiles);
      }
    }, watcherId);

    tab1.append(view);
  }

}

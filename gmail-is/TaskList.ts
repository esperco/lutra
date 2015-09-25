module Esper.TaskList {

  function renderThreads(threads: ApiT.EmailThread[],
                         closeTaskListLayer: () => void,
                         parent: JQuery) {
    List.iter(threads, function(thread) {
      var threadLink = $("<div class='esper-link esper-tl-thread'/>")
        .text(thread.subject)
        .attr("title", "Jump to this conversation");
      threadLink
        .click(function(e) {
          closeTaskListLayer();
          window.location.hash = "#all/" + thread.gmail_thrid;
          return false;
        })
        .appendTo(parent);
    });
  }

  export function renderEvent(team: ApiT.Team, e: ApiT.CalendarEvent) {
'''
<div #view class="esper-tl-event">
  <div #weekday class="esper-ev-weekday"/>
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
      <span #timezone class="esper-ev-tz"/>
    </div>
  </div>
</div>
'''
    var start = XDate.ofString(e.start.local);
    var end = XDate.ofString(e.end ? e.end.local : e.start.local);

    weekday.text(XDate.fullWeekDay(start));
    month.text(XDate.month(start).toUpperCase());
    day.text(XDate.day(start).toString());
    startTime.text(XDate.timeOnly(start));
    endTime.text(XDate.timeOnly(end));

    var calendar = List.find(team.team_calendars, function(cal) {
      return cal.google_cal_id === e.google_cal_id;
    });
    timezone.text(CalPicker.zoneAbbr(calendar.calendar_timezone));

    if (e.title !== undefined) {
      title.text(e.title);
    } else {
      title.text("Untitled event");
    }

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
          "tooltipClass": "esper-top esper-tooltip"
        });
      title
        .addClass("esper-link-black")
        .click(function() {
          open(e.google_cal_url, "_blank");
        });
    }

    return view;
  }

  function renderEvents(team: ApiT.Team,
                        events: ApiT.TaskEvent[],
                        parent: JQuery) {
    List.iter(events, function(event) {
      renderEvent(team, event.task_event)
        .appendTo(parent);
    });
  }

  function renderTaskNotes(notes: string,
                           parent: JQuery) {
    if (notes !== "" || notes !== undefined) {
      $("<p/>")
        .html(notes)
        .appendTo(parent);
    }
  }

  function getProgressLabel(team: ApiT.Team,
                            task: ApiT.Task) {
    switch (task.task_progress) {
    case "New":
      return team.team_label_new;
    case "In_progress":
      return team.team_label_in_progress;
    case "Pending":
      return team.team_label_pending;
    case "Done":
      return team.team_label_done;
    case "Canceled":
      return team.team_label_canceled;
    default:
      Log.e("Unknown task progress: " + task.task_progress);
      return "?";
    }
  }

  function getKnownLabels(team: ApiT.Team) {
    return [
      team.team_label_urgent,
      team.team_label_new,
      team.team_label_in_progress,
      team.team_label_done,
      team.team_label_canceled
    ];
  }

  function getTeamLabels(team: ApiT.Team) {
    return List.union(team.team_labels, getKnownLabels(team));
  }

  /* Labels shared by the team excluding those with a known meaning */
  function getUnknownTeamLabels(team: ApiT.Team) {
    return List.diff(team.team_labels, getKnownLabels(team));
  }

  function sortLabels(l: string[]) {
    return List.sortStrings(l);
  }

  function renderTask(team: ApiT.Team,
                      task: ApiT.Task,
                      closeTaskListLayer: () => void) {
'''
<div #view class="esper-tl-task">
  <div>
    <span #title class="esper-tl-task-title"></span>
    <span #urgent class="esper-tl-urgent"></span>
    <select #progress class="esper-tl-progress"/>
    <span #archiveButton
          class="esper-clickable esper-link-danger"
          title="Archive this task">
      Archive
    </span>
  </div>
  <div #otherTeamLabels></div>
  <div #linkedThreadContainer class="esper-tl-threads"></div>
  <div #linkedEventContainer class="esper-tl-events"></div>
  <div #taskNotesContainer class="esper-tl-task-notes"></div>
</div>
'''

    title.text(task.task_title);
    archiveButton.click(function() {
      Api.archiveTask(task.taskid);
      view.remove();
    });

    urgent.text(team.team_label_urgent);
    if (!task.task_urgent) {
      urgent.remove();
    }

    var progressChoices = [
      { label: team.team_label_new, value: "New" },
      { label: team.team_label_in_progress, value: "In_progress" },
      { label: team.team_label_pending, value: "Pending" },
      { label: team.team_label_done, value: "Done" },
      { label: team.team_label_canceled, value: "Canceled" }
    ];
    List.iter(progressChoices, function(choice) {
      $("<option value='" + choice.value + "'>" + choice.label + "</option>")
        .appendTo(progress);
    });
    progress.val(task.task_progress);
    progress.change(function() {
      var progressValue = $(this).val();
      Api.setTaskProgress(task.taskid, progressValue);
      task.task_progress = progressValue;
    });

    var shared = List.inter(task.task_labels, getUnknownTeamLabels(team));
    List.iter(sortLabels(shared), function(label: string) {
      $("<span>")
        .addClass("esper-tl-shared")
        .text(label)
        .attr("title", "Shared label, visible by the executive")
        .appendTo(otherTeamLabels);
      otherTeamLabels.append(" ");
    });

    renderThreads(task.task_threads, closeTaskListLayer, linkedThreadContainer);
    renderEvents(team, task.task_events, linkedEventContainer);
    renderTaskNotes(task.task_notes, taskNotesContainer);

    return view;
  }

  function isVisible(elt: JQuery,
                     container: JQuery) {
    /* Compute offset down from the top of the viewport */
    var eltTop = elt.offset().top;
    var containerBottom = container.offset().top + container.outerHeight();
    return (eltTop < containerBottom);
  }

  export function displayList(team: ApiT.Team,
                              parentContainer: JQuery,
                              closeTaskListLayer: () => void,
                              filter: (task: ApiT.Task) => boolean,
                              spinnerEl?: JQuery) {

'''
<div #listContainer class="esper-tl-list"></div>
'''
    parentContainer.append(listContainer);
    if (spinnerEl !== undefined) {
      spinnerEl.show();
    }

    var withEvents = true; // turning this off speeds things up
    var withThreads = true;
    var pageSize = 10;     // number of items to fetch at once
    var fetchAhead = 10;   // minimum number of hidden items

    function refillIfNeeded(triggerElt, url) {
      var done = false;
      return function() {
        if (!done) {
          if (isVisible(triggerElt, parentContainer)) {
            done = true;
            Api.getTaskPage(url).done(function(x) {
              appendPage(x, closeTaskListLayer);
            });
          }
        }
      }
    }

    function appendPage(x: ApiT.TaskList,
                        closeTaskListLayer: () => void) {
      /* Index of the element which, when visible, triggers the API call
         that fetches a new page. */
      var tasks = List.filter(x.tasks, filter);
      var scrollTrigger =
        Math.min(tasks.length - 1,
                 Math.max(0, tasks.length - fetchAhead));

      var nextUrl = x.next_page;
      if (tasks.length === 0 && nextUrl !== undefined) {
        /* This is a problematic case, in which the server returned
           an empty page but promises more results.
           We fetch the next page right away. */
        Api.getTaskPage(nextUrl).done(function(x) {
          appendPage(x, closeTaskListLayer);
        });
      }
      else {
        List.iter(tasks, function(task, i) {
          var elt = renderTask(team, task, closeTaskListLayer);
          elt.appendTo(listContainer);
          if (nextUrl !== undefined && i === scrollTrigger) {
            var lazyRefill = refillIfNeeded(elt, nextUrl);

            /* Next page may have to be displayed right way or will
               be triggered after some scrolling. */
            lazyRefill();
            parentContainer.off("scroll");
            parentContainer.scroll(lazyRefill);
          }
        });
        if (spinnerEl !== undefined && tasks.length !== 0) {
          spinnerEl.hide();
        }
      }
    }

    /* First page */
    Api.getTaskList(team.teamid, pageSize, withEvents, withThreads)
      .done(function(x) {
        appendPage(x, closeTaskListLayer);
      });
  }

}

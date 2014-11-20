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

  function renderEvent(e: ApiT.CalendarEvent) {
'''
<div #view class="esper-tl-event">
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

  function renderEvents(events: ApiT.TaskEvent[],
                        parent: JQuery) {
    List.iter(events, function(event) {
      renderEvent(event.task_event)
        .appendTo(parent);
    });
  }

  function getProgressLabel(team: ApiT.Team,
                            task: ApiT.Task) {
    switch (task.task_progress) {
    case "New":
      return team.team_label_new;
    case "In_progress":
      return team.team_label_in_progress;
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

  function renderTask(team: ApiT.Team,
                      task: ApiT.Task,
                      closeTaskListLayer: () => void) {
'''
<div #view class="esper-tl-task">
  <div>
    <span #title class="esper-tl-task-title"></span>
    <span #urgent class="esper-tl-urgent"></span>
    <span #progress class="esper-tl-progress"></span>
    <span #deleteButton
          class="esper-clickable esper-link-danger"
          title="Delete this task">
      Delete
    </span>
  </div>
  <div #otherTeamLabels></div>
  <div #privateLabels></div>
  <div #linkedThreadContainer class="esper-tl-threads"></div>
  <div #linkedEventContainer class="esper-tl-events"></div>
</div>
'''

    title.text(task.task_title);
    deleteButton.click(function() {
      Api.deleteTask(task.taskid);
      view.remove();
    });

    urgent.text(team.team_label_urgent);
    if (!task.task_urgent)
      urgent.remove();

    var progressLabel = getProgressLabel(team, task);
    progress.text(progressLabel);

    var shared = List.inter(task.task_labels, getUnknownTeamLabels(team));
    List.iter(shared, function(label: string) {
      $("<span>")
        .addClass("esper-tl-shared")
        .text(label)
        .attr("title", "Shared label, visible by the executive")
        .appendTo(otherTeamLabels)
    });

    var private_ = List.diff(task.task_labels, getTeamLabels(team));
    List.iter(private_, function(label: string) {
      $("<span>")
        .addClass("esper-tl-private")
        .text(label)
        .attr("title", "Private label, not visible by the executive")
        .appendTo(privateLabels)
    });

    renderThreads(task.task_threads, closeTaskListLayer, linkedThreadContainer);
    renderEvents(task.task_events, linkedEventContainer);

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
                              parent: JQuery,
                              closeTaskListLayer: () => void,
                              filter: (task: ApiT.Task) => boolean) {

'''
<div #container>
  <h1 #teamName class="esper-tl-head"></h1>
  <div #listContainer class="esper-tl-list"></div>
</div>
'''
    parent.children().remove();
    parent.append(container);

    teamName.text(team.team_name + " tasks");

    var withEvents = true; // turning this off speeds things up
    var withThreads = true;
    var pageSize = 10;     // number of items to fetch at once
    var fetchAhead = 10;   // minimum number of hidden items

    function refillIfNeeded(triggerElt, url) {
      var done = false;
      return function() {
        if (!done) {
          if (isVisible(triggerElt, container)) {
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
            container.off("scroll");
            container.scroll(lazyRefill);
          }
        });
      }
    }

    /* First page */
    Api.getTaskList(team.teamid, pageSize, withEvents, withThreads)
      .done(function(x) {
        appendPage(x, closeTaskListLayer);
      });
  }

  export function render(team: ApiT.Team,
                         parent: JQuery,
                         closeTaskListLayer: () => void) {
'''
<div #view class="esper-tl-task-list">
  <span #closeButton class="esper-tl-close esper-clickable">×</span>
  <span #all class="esper-link esper-tl-all">All</span>
  <span #urgent class="esper-link esper-tl-urgent"></span>
  <span #new_ class="esper-link esper-tl-progress"></span>
  <span #inProgress class="esper-link esper-tl-progress"></span>
  <span #done class="esper-link esper-tl-progress"></span>
  <span #canceled class="esper-link esper-tl-progress"></span>
  <div #list></div>
</div>
'''
    urgent.text(team.team_label_urgent);
    new_.text(team.team_label_new);
    inProgress.text(team.team_label_in_progress);
    done.text(team.team_label_done);
    canceled.text(team.team_label_canceled);

    view.click(function() {
      return false; // prevents click events from reaching the parent
    });
    closeButton.click(closeTaskListLayer);

    function displayFiltered(filter) {
      displayList(team, list, closeTaskListLayer, filter);
    }

    function bind(elt: JQuery,
                  filter: (task: ApiT.Task) => boolean) {
      elt.click(function() {
        displayFiltered(filter);
      });
    }

    bind(all, function(task) { return true; });
    bind(urgent, function(task) { return task.task_urgent; });

    function bindProgress(elt, progress) {
      bind(elt, function(task) { return task.task_progress === progress; });
    }

    bindProgress(new_, "New");
    bindProgress(inProgress, "In_progress");
    bindProgress(done, "Done");
    bindProgress(canceled, "Canceled");

    all.click();

    return view;
  }

}

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

  function renderTask(task: ApiT.Task,
                      closeTaskListLayer: () => void) {
'''
<div #view class="esper-tl-task">
  <div>
    <span #title class="esper-tl-task-title"></span>
    <span #urgent class="esper-tl-urgent">Urgent</span>
    <span #canceled class="esper-tl-canceled">Canceled</span>
    <span #deleteButton
          class="esper-clickable esper-link-danger"
          title="Delete this task">
      Delete
    </span>
  </div>
  <div #linkedThreadContainer class="esper-tl-threads"></div>
  <div #linkedEventContainer class="esper-tl-events"></div>
</div>
'''
    if (!task.task_urgent)
      urgent.remove();
    if (!task.task_canceled)
      canceled.remove();

    title.text(task.task_title);
    deleteButton.click(function() {
      Api.deleteTask(task.taskid);
      view.remove();
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
          var elt = renderTask(task, closeTaskListLayer);
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
  <span #urgent class="esper-link esper-tl-urgent">Urgent</span>
  <span #canceled class="esper-link esper-tl-canceled">Canceled</span>
  <div #list></div>
</div>
'''
    view.click(function() {
      return false; // prevents click events from reaching the parent
    });
    closeButton.click(closeTaskListLayer);

    function filterAll(task: ApiT.Task) { return true; }
    function filterUrgent(task: ApiT.Task) { return task.task_urgent; }
    function filterCanceled(task: ApiT.Task) { return task.task_canceled; }

    function filtered(filter) {
      displayList(team, list, closeTaskListLayer, filter);
    }

    all.click(function() {
      filtered(filterAll);
    });

    urgent.click(function() {
      filtered(filterUrgent);
    });

    canceled.click(function() {
      filtered(filterCanceled);
    });

    filtered(filterAll);

    return view;
  }

}

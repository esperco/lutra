module Esper.TaskList {

  function renderThreads(threads: ApiT.EmailThread[],
                         closeTaskListLayer: () => void,
                         ul: JQuery) {
    List.iter(threads, function(thread) {
      var threadLink =
        $("<li class='esper-link'/>").text(thread.subject);
      threadLink
        .click(function(e) {
          closeTaskListLayer();
          window.location.hash = "#all/" + thread.gmail_thrid;
          return false;
        })
        .appendTo(ul);
    });
  }

  function renderEvent(e: ApiT.CalendarEvent) {
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
<li #li>
  <div>
    <span #title class="esper-tl-task-title"></span>
    <button #deleteButton class="esper-clickable">Delete</button>
  </div>
  <div class="esper-bold">Threads</div>
  <ul #linkedThreadContainer class="esper-ul"></ul>
  <ul #linkedEventContainer class="esper-ul"></ul>
</li>
'''
    title.text(task.task_title);
    deleteButton.click(function() {
      Api.deleteTask(task.taskid);
      li.remove();
    });
    renderThreads(task.task_threads, closeTaskListLayer, linkedThreadContainer);
    renderEvents(task.task_events, linkedEventContainer);

    return li;
  }

  export function display(team: ApiT.Team,
                          parent: JQuery) {

'''
<div #container class="esper-tl-task-list">
  <h1 class="esper-tl-head">Tasks</h1>
  <button #closeButton class="esper-tl-close esper-clickable">Close</button>
  <ul #listContainer class="esper-ul"></ul>
</div>
'''
    parent.removeClass("esper-hide");

    function closeTaskListLayer() {
      parent.addClass("esper-hide");
    }

    container.click(function() {
      return false; // prevents click events from reaching the parent
    });

    parent.click(closeTaskListLayer);
    closeButton.click(closeTaskListLayer);

    var withEvents = true; // turning this off will speed things up
    var withThreads = true;
    Api.getTaskList(team.teamid, 1000, withEvents, withThreads)
      .done(function(x: ApiT.TaskList) {
        List.iter(x.tasks, function(task) {
          renderTask(task, closeTaskListLayer)
            .appendTo(listContainer);
        });
        /* TODO: paging, ideally with infinite scroll */
        parent.children().remove();
        parent.append(container);
      });
  }
}

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

  export function display(team: ApiT.Team,
                          parent: JQuery) {

'''
<div #container class="esper-tl-task-list">
  <h1 #teamName class="esper-tl-head"></h1>
  <span #closeButton class="esper-tl-close esper-clickable">×</span>
  <div #listContainer class="esper-tl-list"></div>
</div>
'''
    parent.children().remove();
    parent.removeClass("esper-hide");

    function closeTaskListLayer() {
      parent.addClass("esper-hide");
    }

    teamName.text(team.team_name + " tasks");

    container.click(function() {
      return false; // prevents click events from reaching the parent
    });

    parent.click(closeTaskListLayer);
    closeButton.click(closeTaskListLayer);

    var withEvents = true; // turning this off speeds things up
    var withThreads = true;
    Api.getTaskList(team.teamid, 100, withEvents, withThreads)
      .done(function(x: ApiT.TaskList) {
        List.iter(x.tasks, function(task) {
          renderTask(task, closeTaskListLayer)
            .appendTo(listContainer);
        });
        /* TODO: paging, ideally with infinite scroll */
        parent.append(container);
      });
  }
}

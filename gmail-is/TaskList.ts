module Esper.TaskList {

  function renderThreads(threads: ApiT.EmailThread[],
                         closeTaskListLayer: () => void,
                         parent: JQuery) {
    List.iter(threads, function(thread) {
      var threadLink =
        $("<li class='esper-link'/>").text(thread.subject);
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
  <span #title class="esper-tl-task-title"></span>
  <button #deleteButton>Delete</button>
  <div #linkedThreadContainer></div>
  <div #linkedEventContainer></div>
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
  <button #closeButton>Close</button>
  <ul #listContainer></ul>
</div>
'''
    function closeTaskListLayer() {
      container.addClass("esper-hide");
    }

    closeButton.click(closeTaskListLayer);

    Api.getTaskList(team.teamid, 1000, true, true)
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

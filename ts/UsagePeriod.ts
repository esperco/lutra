module UsagePeriod {
  interface MainView {
    view: JQuery;
    taskListContainer: JQuery;
    chargesContainer: JQuery;
    approveSection: JQuery;
    approvedSection: JQuery;
  }

  export function load(teamid: string, periodStart: number) {
'''mainView
<div #view>
  <div #taskListContainer></div>
  <div #chargesContainer></div>
  <div #approveSection class="hide"></div>
  <div #approvedSection class="hide"></div>
</div>
'''
    var root = $("#usage-period-page");
    root.children().remove();
    root.append(view);
    document.title = "Billing Period - Esper";

    Api.getUsageEdit(teamid, periodStart)
      .done(function(tu) {
        renderTaskUsage(mainView, tu);
        updateCharges(mainView, tu);
      });
  }

  function updateCharges(mainView: MainView,
                         tu: ApiT.TaskUsage) {
    if (tu.stripe_charge !== undefined) {
      mainView.approveSection.addClass("hide");
      mainView.approvedSection.removeClass("hide");
      mainView.approvedSection.text("Approved!");
    }
    else {
      mainView.approvedSection.addClass("hide");
      mainView.approveSection.removeClass("hide");
      Api.getUsageExtraCharge(tu.teamid,
                              Unixtime.ofRFC3339(tu.start),
                              tu.revision)
        .done(function(xch) {
'''
<div #view>
  <div>
    Extra charges due:
    <span #amount></span> USD
  </div>
  <div>
    <button #approve>Approve these charges</button>
  </div>
</div>
'''
          amount.text((xch.amount_due / 100).toString());
          mainView.approveSection.children().remove();
          mainView.approveSection.append(view);
          approve.click(function() {
            var startUnixtime = Unixtime.ofRFC3339(tu.start);
            Api.postUsageExtraCharge(tu.teamid,
                                     startUnixtime,
                                     tu.revision)
              .done(function() {
                load(tu.teamid, startUnixtime);
              });
          });
        });
    }
  }

  function save(mainView: MainView,
                tu: ApiT.TaskUsage) {
    Api.putUsageEdit(tu)
      .done(function(tu) {
        Log.d("Saved. New revision: " + tu.revision.toString());
        updateCharges(mainView, tu);
      });
  }

  function renderTaskUsage(mainView: MainView,
                           tu: ApiT.TaskUsage) {
    List.iter(tu.tasks, function(stu) {
      renderSingleTaskUsage(mainView.taskListContainer, mainView, tu, stu);
    });
  }

  function renderSingleTaskUsage(container: JQuery,
                                 mainView: MainView,
                                 tu: ApiT.TaskUsage,
                                 stu: ApiT.SingleTaskUsage) {

    var schedTimeBox = createTimeEditor(
      stu.auto_scheduling_time,
      stu.scheduling_time,
      function(x) { stu.scheduling_time = x; save(mainView, tu); }
    );

    var schedCountBox = createCountEditor(
      stu.auto_scheduling_tasks_created,
      stu.scheduling_tasks_created,
      function(x) { stu.scheduling_tasks_created = x; save(mainView, tu); }
    );

    var genericTimeBox = createTimeEditor(
      stu.auto_generic_time,
      stu.generic_time,
      function(x) { stu.generic_time = x; save(mainView, tu); }
    );

    var genericCountBox = createCountEditor(
      stu.auto_generic_tasks_created,
      stu.generic_tasks_created,
      function(x) { stu.generic_tasks_created = x; save(mainView, tu); }
    );

'''
<div #taskView>
  <div>{{stu.title}}</div>
  <div>
    Scheduling tasks time:
    <span>{ stu.auto_scheduling_time.toString() }</span>
    {{schedTimeBox}}
    created:
    <span>{ stu.auto_scheduling_tasks_created.toString() }</span>
    {{schedCountBox}}
  </div>
  <div>
    Generic tasks time:
    <span>{ stu.auto_generic_time.toString() }</span>
    {{genericTimeBox}}
    created:
    <span>{ stu.auto_generic_tasks_created.toString() }</span>
    {{genericCountBox}}
  </div>
</div>
'''
    container.append(taskView);
  }

  function createPosIntEditor(orig: number,
                              init: number,
                              set: { (x: number): void }): JQuery {
'''
<input #box type="text"/>
'''
    box.val(init.toString());

    function checkInput() {
      var x = Util.intOfString(box.val());
      if (x >= 0 && isFinite(x)) {
        box.removeClass("invalid");
        if (x !== orig)
          box.addClass("modified");
        else
          box.removeClass("modified");
        return x;
      }
      else {
        box.removeClass("modified");
        box.addClass("invalid");
        return;
      }
    }

    Util.afterTyping(box, 300, function() {
      var x = checkInput();
      if (x !== undefined)
        set(x);
    });
    checkInput();
    return box;
  }

  /* Right now, the time editor is just the number of seconds. */
  var createTimeEditor = createPosIntEditor;
  var createCountEditor = createPosIntEditor;
}

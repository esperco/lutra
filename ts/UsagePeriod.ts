module UsagePeriod {
  interface MainView {
    view: JQuery;
    subStatusContainer: JQuery;
    periodSummary: JQuery;
    taskListContainer: JQuery;
    chargesContainer: JQuery;
    approveButtonSection: JQuery;
    approvedMsgSection: JQuery;
  }

  export function load(teamid: string, periodStart: number) {
'''mainView
<div #view>
  <div #periodSummary></div>
  <div #subStatusContainer></div>
  <div #taskListContainer></div>
  <div #chargesContainer></div>
  <div #approveButtonSection class="hide"></div>
  <div #approvedMsgSection class="hide"></div>
</div>
'''
    var root = $("#usage-period-page");
    root.children().remove();
    root.append(view);
    document.title = "Billing Period - Esper";

    Api.getSubscriptionStatusLong(teamid)
      .done(function(cusDetails) {
        updateSubStatusContainer(subStatusContainer, cusDetails);
      });

    Api.getUsageEdit(teamid, periodStart)
      .done(function(tu) {
        renderTaskUsage(mainView, tu);
        updateCharges(mainView, tu);
      });
  }

  function updateSubStatusContainer(subStatusContainer: JQuery,
                                    cusDetails: ApiT.CustomerDetails) {
    /* note this is the current customer status, not the start plan
       and end plan applicable to the billing period being reviewed. */
'''
<div #view>
  <div #unfinished></div>
  <div #noCard class="hide">
    No payment card on file. Please ask the customer needs to enter one.
  </div>
</div>
'''
    subStatusContainer.children().remove();

    if (cusDetails.cards.length === 0)
      noCard.removeClass("hide");

    subStatusContainer.append(view);
  }

  function updateCharges(mainView: MainView,
                         tu: ApiT.TaskUsage) {
    if (tu.charge_amount !== undefined) {
      mainView.approveButtonSection.addClass("hide");
      mainView.approvedMsgSection.removeClass("hide");
      mainView.approvedMsgSection.text(
        "Approved extra charge of "
          + (tu.charge_amount / 100).toString()
          + " USD."
      );
    }
    else {
      mainView.approvedMsgSection.addClass("hide");
      var endDate = new Date(tu.end);
      if (!Conf.prod || endDate.getTime() < Date.now()) {
        mainView.approveButtonSection.removeClass("hide");
        Api.getUsageExtraCharge(tu.teamid,
                                Unixtime.ofRFC3339(tu.start),
                                tu.revision)
          .done(function(xch) {
            mainView.approveButtonSection.children().remove();
            mainView.approveButtonSection.append(renderExtraCharge(tu, xch));
          });
      }
    }
  }

  function renderExtraCharge(tu: ApiT.TaskUsage,
                             xch: ApiT.ExtraCharge): JQuery {
    if (xch.unlimited_usage) {
'''option1
<div #view1>
Unlimited usage. Nothing to approve.
</div>
'''
      return view1;
    }
    else {
'''option2
<div #view2>
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
      approve.click(function() {
        var startUnixtime = Unixtime.ofRFC3339(tu.start);
        Api.postUsageExtraCharge(tu.teamid,
                                 startUnixtime,
                                 tu.revision)
          .done(function() {
            load(tu.teamid, startUnixtime);
          });
      });
      return view2;
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
    renderPeriodSummary(mainView, tu);
    List.iter(tu.tasks, function(stu) {
      renderSingleTaskUsage(mainView.taskListContainer, mainView, tu, stu);
    });
  }

  function renderPeriodSummary(mainView: MainView,
                               tu: ApiT.TaskUsage) {
'''
<div #view>
  Billing period
  <span #start></span>
  &mdash;
  <span #end></span>
  <span #ongoing></span>
</div>
'''
    var startDate = new Date(tu.start);
    var endDate = new Date(tu.end);

    start.text(startDate.toString());
    end.text(endDate.toString());

    if (Date.now() < endDate.getTime())
      ongoing.text("(ongoing period)");

    mainView.periodSummary.children().remove();
    mainView.periodSummary.append(view);
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

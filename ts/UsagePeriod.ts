module Esper.UsagePeriod {
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
'''
<div #view class="settings-container">
  <div class="header clearfix">
    <span #signOut class="header-signout clickable">Sign out</span>
    <a #logoContainer href="#"
       class="img-container-left"/>
    <a href="#!" #headerSettings class="header-title">Settings</a>
    <span #arrowContainer1 class="img-container-left"/>
    <div class="header-exec">
      <div #profilePic class="profile-pic"/>
      <a #teamName class="profile-name exec-profile-name"/>
    </div>
    <span #arrowContainer2 class="img-container-left"/>
    <div class="header-title2">Usage</div>
  </div>
  <div class="divider"/>
  <div #main class="clearfix"/>
  <div #footer/>
</div>
'''
    var root = $("#usage-period-page");
    root.children().remove();
    root.append(view);

    var logo = $("<img class='svg-block header-logo'/>")
      .appendTo(logoContainer);
    Svg.loadImg(logo, "/assets/img/logo.svg");

    var arrowEast1 = $("<img class='svg-block arrow-east'/>")
      .appendTo(arrowContainer1);
    Svg.loadImg(arrowEast1, "/assets/img/arrow-east.svg");

    var arrowEast2 = $("<img class='svg-block arrow-east'/>")
      .appendTo(arrowContainer2);
    Svg.loadImg(arrowEast2, "/assets/img/arrow-east.svg");

    var selectedTeam : ApiT.Team =
      List.find(Login.getTeams(), function(team : ApiT.Team) {
        return team.teamid === teamid;
      });

    Api.getProfile(selectedTeam.team_executive, selectedTeam.teamid)
      .done(function(exec) {
        document.title = exec.display_name + " - Usage";
        profilePic.css("background-image", "url('" + exec.image_url + "')");
        teamName.text(selectedTeam.team_name);
      });

    teamName.attr("href", "#!team-settings/" + teamid);

    loadContent(teamid, periodStart)
      .done(function(content) {
        main.append(content);
        footer.append(Footer.load());
      });

    signOut.click(Login.logout);
  }

  export function loadContent(teamid: string, periodStart: number):
  JQueryPromise<JQuery> {
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
    document.title = "Billing Period - Esper";

    Api.getSubscriptionStatusLong(teamid)
      .done(function(cusDetails) {
        updateSubStatusContainer(subStatusContainer, cusDetails);
      });

    return Api.getUsageEdit(teamid, periodStart)
      .then(function(tu) {
        renderTaskUsage(mainView, tu);
        updateCharges(mainView, tu);
        return view;
      });
  }

  function updateSubStatusContainer(subStatusContainer: JQuery,
                                    cusDetails: ApiT.CustomerDetails) {
    /* note this is the current customer status, not the start plan
       and end plan applicable to the billing period being reviewed. */
'''
<div #view>
  <p #noCard class="hide">
    No payment card on file. Please ask the customer to enter one
    if anything is due.
  </p>
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
  <div>Stripe receipt statement: <span #description/></div>
  <div>
    <button #approve>Approve these charges</button>
  </div>
</div>
'''
      amount.text((xch.amount_due / 100).toString());
      description.text(xch.description);
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
  <h2>Billing period
    <span #start></span>
    &ndash;
    <span #end></span>
    <span #ongoing></span>
  </h2>
</div>
'''
    var startDate = new Date(tu.start);
    var endDate = new Date(tu.end);

    start.text(XDate.dateOnly(startDate));
    end.text(XDate.dateOnly(endDate));

    if (Date.now() < endDate.getTime())
      ongoing.text("(ongoing)");

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

    var tipScheduling = tooltip(
      "Applies if this task was about setting up a meeting"
    );

    var tipGeneric = tooltip(
      "Applies if this task wasn't about setting up a meeting"
    );

    var tipSchedTime = tooltip(
      "Time spent on this scheduling task during the billing period. " +
      "It is determined automatically based on the activity of the " +
      "assistants using the Esper extension for Gmail. " +
      "If a significant amount of time is spent working on the task " +
      "outside of Gmail, it should be added manually in the input box."
    );

    var tipGenericTime = tooltip(
      "Time spent on this generic task during the billing period. " +
      "It is determined automatically based on the activity of the " +
      "assistants using the Esper extension for Gmail. " +
      "If a significant amount of time is spent working on the task " +
      "outside of Gmail, it should be added manually in the input box."
    );

    var tipSchedCount = tooltip(
      "Count 1 if the task is a scheduling task AND was started " +
      "during this billing period. If multiple meetings were organized " +
      "under the same email thread, count 1 for each meeting."
    );

    var tipGenericCount = tooltip(
      "Count 1 if the task is a generic task AND was started " +
      "during this billing period. If multiple tasks were performed " +
      "under the same email thread, count 1 for each actual task."
    );

'''
<div #taskView>
  <h3>{stu.title}</h3>
  <div class="row">
    <div class="col-md-2">
      Scheduling {{tipScheduling}}
    </div>
    <div class="col-md-2">
      time spent {{tipSchedTime}}
    </div>
    <div class="col-md-1">
      <span>{ formatTime(stu.auto_scheduling_time) } (auto)</span>
    </div>
    <div class="col-md-2">
      {{schedTimeBox}} (edited)
    </div>
    <div class="col-md-1">

    </div>
    <div class="col-md-2">
      number of tasks created {{tipSchedCount}}
    </div>
    <div class="col-md-1">
      <span>{ stu.auto_scheduling_tasks_created.toString() } (auto)</span>
    </div>
    <div class="col-md-1">
      {{schedCountBox}} (edited)
    </div>
  </div>

  <div class="row">
    <div class="col-md-2">
      Generic {{tipGeneric}}
    </div>
    <div class="col-md-2">
      time spent {{tipGenericTime}}
    </div>
    <div class="col-md-1">
      <span>{ formatTime(stu.auto_generic_time) } (auto)</span>
    </div>
    <div class="col-md-2">
      {{genericTimeBox}} (edited)
    </div>
    <div class="col-md-1">

    </div>
    <div class="col-md-2">
      number of tasks created {{tipGenericCount}}
    </div>
    <div class="col-md-1">
      <span>{ stu.auto_generic_tasks_created.toString() } (auto)</span>
    </div>
    <div class="col-md-1">
      {{genericCountBox}} (edited)
    </div>
  </div>
</div>
'''
    container.append(taskView);
  }

  function pad2(x: number): string {
    var s = x.toString();
    return s.length === 1 ? "0" + s : s;
  }

  function formatSec(x: number) {
    return pad2(x % 60);
  }

  function formatMin(x: number) {
    return Math.floor(x / 60).toString();
  }

  function formatTime(x: number) {
    return formatMin(x) + ":" + formatSec(x);
  }

  function createPosIntEditor(orig: number,
                              init: number,
                              class_: string,
                              set: { (x: number): void }): JQuery {
'''
<input #box class="usage-box" type="text"/>
'''
    box.val(init.toString());
    box.addClass(class_);

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

    /* Increase/decrease values using keyboard arrows. */
    box.keydown(function(event) {
      var key = event.which;
      var n = Util.intOfString(box.val());
      if (key === 38 /* up arrow */) {
        if (n >= 0)
          box.val((n + 1).toString());
      } else if (key === 40 /* down arrow */) {
        if (n >= 0)
          box.val(Math.max(0, n - 1).toString());
      }
    });

    Util.afterTyping(box, 300, function() {
      var x = checkInput();
      if (x !== undefined)
        set(x);
    });
    checkInput();
    return box;
  }

  function createMinSecEditor(orig: number,
                              init: number,
                              set: { (x: number): void }):
  JQuery {

'''
<div #container class="usage-box-time">
  <input #boxMin class="usage-box usage-minute-box" type="text"/> :
  <input #boxSec class="usage-box usage-second-box" type="text"/>
</div>
'''

    function fillBoxes(time: number) {
      boxMin.val(formatMin(time));
      boxSec.val(formatSec(time));
    }

    function readBoxes() {
      return (Util.intOfString(boxMin.val()) * 60
              + Util.intOfString(boxSec.val()));
    }

    function validate(x: number) {
      return (x >= 0 && isFinite(x));
    }

    function changeHandler(x: number) {
      if (validate(x)) {
        container.removeClass("invalid");
        if (x !== orig)
          container.addClass("modified");
        else
          container.removeClass("modified");

        set(x);
        fillBoxes(x);
      }
      else {
        container.removeClass("modified");
        container.addClass("invalid");
      }
    }

    /* Total number of seconds */
    var t = new Esper.Watchable.C<number>(function(x) { return true; },
                                          init);
    t.watch(changeHandler);
    fillBoxes(init);

    function update() {
      t.set(readBoxes());
    }

    /* Increase/decrease values using keyboard arrows. */
    function listenToArrows(box: JQuery) {
      box.keydown(function(event) {
        var key = event.which;
        var n = Util.intOfString(box.val());
        if (key === 38 /* up arrow */) {
          if (n >= 0) {
            box.val((n + 1).toString());
            update();
          }
        } else if (key === 40 /* down arrow */) {
          if (n >= 0) {
            box.val(Math.max(0, n - 1).toString());
            update();
          }
        }
      });
    }

    listenToArrows(boxMin);
    listenToArrows(boxSec);

    Util.afterTyping(boxMin, 300, function() {
      update();
    });
    Util.afterTyping(boxSec, 300, function() {
      update();
    });

    return container;
  }

  function createTimeEditor(orig: number,
                            init: number,
                            set: { (x: number): void }): JQuery {
    return createMinSecEditor(orig, init, set);
  }

  function createCountEditor(orig: number,
                             init: number,
                             set: { (x: number): void }): JQuery {
    return createPosIntEditor(orig, init, "usage-count-box", set);
  }

  function tooltip(title: string):
  JQuery {
'''
<div #container
  data-toggle="tooltip"
  data-placement="top"
  class="img-container-inline"/>
'''
    container.attr("title", title);
    var infoIcon = $("<img class='svg-block info-icon'/>")
      .appendTo(container);
    Svg.loadImg(infoIcon, "/assets/img/info.svg");

    container.tooltip();

    return container;
  }
}

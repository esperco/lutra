module Usage {
  export function load(teamid: string) {
'''
<div #view>
  <div #listContainer></div>
</div>
'''
    var root = $("#usage-page");
    root.children().remove();
    root.append(view);
    document.title = "Monthly Usage - Esper";

    Api.getPeriodList(teamid)
      .done(function(x: ApiT.TaskUsageList) {
        renderBillingPeriods(teamid, listContainer, x.items);
      });
  }

  function renderBillingPeriods(teamid: string,
                                listContainer: JQuery,
                                listData: ApiT.TaskUsage[]) {
  }
}

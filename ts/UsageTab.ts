module UsageTab {
  export function load(team: ApiT.Team): JQuery {
'''
<div #view>
  <h3>Billing periods</h3>
  <div #listContainer></div>
</div>
'''
    var teamid = team.teamid;
    Api.getPeriodList(teamid)
      .done(function(x: ApiT.TaskUsageList) {
        renderBillingPeriods(teamid, listContainer, x.items);
      });
    return view;
  }

  function renderBillingPeriods(teamid: string,
                                listContainer: JQuery,
                                l: ApiT.TaskUsage[]) {
    List.iter(l, function(tu) {
'''
<div #item>
  <span #status_></span>
  <a #link>
    <span #start></span>
    &ndash;
    <span #end></span>
  </a>
</div>
'''
      var startDate = new Date(tu.start);
      var endDate = new Date(tu.end);

      if (tu.frozen || tu.unlimited_usage)
        status_.text("✓");
      else if (Date.now() < endDate.getTime())
        status_.text("★");
      else
        status_.text("?");

      var url = "#!usage-period/" + teamid
        + "/" + Unixtime.ofDate(startDate).toString();
      link.attr("href", url);

      start.text(XDate.dateOnly(startDate));
      end.text(XDate.dateOnly(endDate));

      listContainer.append(item);
    });
  }
}

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
                                l: ApiT.TaskUsage[]) {
    List.iter(l, function(tu) {
'''
<div #item>
  <a #link>
    <span #start></span>
    &mdash;
    <span #end></span>
  </a>
</div>
'''
      var startDate = new Date(tu.start);
      var endDate = new Date(tu.end);

      var url = "#!usage-period/" + teamid
        + "/" + Unixtime.ofDate(startDate).toString()
        + "/" + tu.revision.toString();
      link.attr("href", url);

      start.text(startDate.toString());
      end.text(endDate.toString());

      listContainer.append(item);
    });
  }
}

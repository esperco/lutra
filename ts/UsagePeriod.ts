module UsagePeriod {
  export function load(teamid: string, periodStart: string) {
'''
<div #view>
</div>
'''
    var root = $("#usage-page");
    root.children().remove();
    root.append(view);
    document.title = "Billing Period - Esper";
  }
}

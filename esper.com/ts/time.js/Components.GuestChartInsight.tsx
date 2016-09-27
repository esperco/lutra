/*
  Report insight for labels
*/

/// <reference path="./Components.ChartInsight.tsx" />

module Esper.Components {
  export class GuestChartInsight extends GroupChartInsight {
    getGroupBy() { return Charting.GroupByGuest; }

    /*
      This is a bar chart with labels on the side. So don't need to summarize
      too much.
    */
    render() {
      return this.getResult().match({
        none: () => null,
        some: (s) => {
          let noGuests = s.group.all.totalUnique === s.group.none.totalUnique;
          return <div>
            { noGuests ? <p>{ Text.ChartNoGuests }</p> : null }
          </div>;
        }
      });
    }
  }
}

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Layout.tsx" />
/// <reference path="./Charts.tsx" />
/// <reference path="./Colors.ts" />

module Esper.Charts {
  type CalGrouping = GroupsByPeriod<{}>[];

  /*
    Base class for chart with calendar comparison
  */
  export abstract class CalendarCompChart extends DefaultEventChart {
    protected groupings: CalGrouping;
    protected sortedCalIds: string[];
    protected cals: ApiT.GenericCalendar[];

    sync() {
      super.sync();
      this.groupings = this.getGroupsByPeriod(

        // Wrapping function
        (e) => Option.some({
          event: e
        }),

        // Group by calendar id
        (w) => [w.event.calendar_id]
      );

      this.sortedCalIds = this.sortByForCurrentPeriod(
        this.groupings, (w) => -w.adjustedDuration
      );

      this.cals = _.map(this.params.cals,
        (c) => Calendars.get(c.teamId, c.calId)
      );
    }

    getTotals() {
      return _.map(this.groupings, (d) => ({
        period: d.period,
        duration: d.totalAdjusted,
        count: d.totalCount
      }));
    }

    onSeriesClick(events: Events2.TeamEvent[]) {
      Layout.renderModal(Containers.eventListModal(events));
      return false;
    }

    getCalendarName(calId: string) {
      var cal = _.find(this.cals || [], (c) => c.id === calId);
      if (cal) {
        return cal.title;
      }
      return calId;
    }
  }
}

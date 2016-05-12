/*
  Base class for comparing two calendars
*/

/// <reference path="./Charts.tsx" />

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
        (w) => [w.event.calendarId]
      );

      this.sortedCalIds = this.sortByForCurrentPeriod(
        this.groupings, (w) => -w.adjustedDuration
      );

      this.cals = Option.flatten(_.map(this.params.cals,
        (c) => Stores.Calendars.get(c.teamId, c.calId)
      ));
    }

    getTotals() {
      return _.map(this.groupings, (d) => ({
        period: d.period,
        duration: d.totalAdjusted,
        count: d.totalCount
      }));
    }

    onSeriesClick(events: Stores.Events.TeamEvent[]) {
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

/*
  Charts gruoped by calendar
*/

/// <reference path="./Components.Chart.tsx" />
/// <reference path="./Components.EventGrid.tsx" />

module Esper.Components {

  interface ExtraProps {
    calendars: ApiT.GenericCalendar[];
  }

  abstract class CalendarChart extends DefaultGroupingChart<ExtraProps> {
    getDisplayName = (calId: string) => {
      var cal = _.find(this.props.calendars, (c) => c.id === calId);
      return cal ? cal.title : "";
    }
  }

  export class CalendarHoursChart extends CalendarChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      var keys = Charting.sortOptGroupKeys(groups);
      var series = Charting.eventSeries(groups, {
        colorFn: Colors.getColorForCal,
        displayName: this.getDisplayName,
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        { this.props.simplified ? null : <TotalsBar periodTotals={groups} /> }
        <AbsoluteChart
          orientation="horizontal"
          series={series}
          simplified={this.props.simplified}
          categories={keys}
          yAxis={`${Text.ChartCalendars} (${Text.ChartHoursUnit})`}
        />
      </div>;
    }
  }


  export class CalendarPercentChart extends CalendarChart {
    renderMain(groups: Charting.PeriodOptGroup[]) {
      var keys = Charting.sortOptGroupKeys(groups);
      var series = Charting.eventGroupSeries(groups, {
        colorFn: Colors.getColorForCal,
        displayName: this.getDisplayName,
        sortedKeys: keys,
        yFn: EventStats.toHours
      });

      return <div className="chart-content">
        { this.props.simplified ? null : <TotalsBar periodTotals={groups} /> }
        <PercentageChart
          series={series}
          simplified={this.props.simplified}
          yAxis={`${Text.ChartCalendars} (${Text.ChartPercentUnit})`}
        />
      </div>;
    }
  }


  export class CalendarEventGrid extends EventGrid<ExtraProps> {
    colorFn(groups: Option.T<string[]>) {
      return this.toCal(groups).match({
        none: () => Colors.lightGray,
        some: (cal) => Colors.getColorForCal(cal.id)
      });
    }

    categoryFn(groups: Option.T<string[]>) {
      return this.toCal(groups).match({
        none: () => "",
        some: (cal) => cal.title
      });
    }

    toCal(groups: Option.T<string[]>) {
      return groups.flatMap((g) => {
        var cal = _.find(this.props.calendars, (c) => c.id === g[0]);
        return cal ? Option.some(cal) : Option.none<ApiT.GenericCalendar>();
      });
    }
  }
}

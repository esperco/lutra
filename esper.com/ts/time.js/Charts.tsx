/*
  Abstractions for managing different chart types
*/

/// <reference path="../lib/Model.StoreOne.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Components.IntervalRangeSelector.tsx" />
/// <reference path="./TimeStats.ts" />

module Esper.Charts {

  export interface ChartParams {
    windowStart: Date;
    windowEnd: Date;

    // Selected team-calendar combos
    calendars: Calendars.CalSelection[];

    // Additional field to make static interval explicit (if applicable)
    interval?: TimeStats.Interval;

    // Applicable to labeled charts only
    selectedLabels?: string[];
  }

  export abstract class Chart {
    // Static properties about this chart type
    static displayName: string;

    // These are used to configure period selector, with defaults
    protected usesIntervals: boolean = false;
    protected dateLimit: moment.MomentInput = TimeStats.MAX_TIME;
    protected dateLimitForInterval:
      (interval: TimeStats.Interval) => moment.MomentInput =
      TimeStats.dateLimitForInterval;
    protected minDate: BootstrapDaterangepicker.DateType = TimeStats.MIN_DATE;
    protected maxDate: BootstrapDaterangepicker.DateType = TimeStats.MAX_DATE;

    constructor(public params: ChartParams) { }

    // Triggers async call to update chart data
    abstract async(): void;

    // Returns any error retrieved while loading, if applicable
    // Else returns null.
    abstract getError(): Error;

    // Returns true if loading data. Called after getError
    abstract isBusy(): boolean;

    // Returns true if there is no data -- results in message to user
    // Called after getError
    abstract noData(): boolean;

    // Render function is called with a renderWithData context and can access
    // tracked stores
    abstract renderChart(): React.ReactElement<any>;

    // Render additional selector in left column (if any) to refine chart
    // data (like label selectors). Must handle lack of store data safely.
    abstract renderSelectors(): React.ReactElement<any>;

    // Default period selector
    renderPeriodSelector(updateFn: (req: TimeStats.RequestPeriod) => void) {
      return <Components.IntervalRangeSelector
        selected={this.params}
        updateFn={updateFn}
        showIntervals={this.usesIntervals}
        dateLimit={this.dateLimit}
        dateLimitForInterval={this.dateLimitForInterval}
        minDate={this.minDate}
        maxDate={this.maxDate}
      />;
    }

    // Message to show when busy
    noDataMsg(): JSX.Element {
      return <span>No data found</span>;
    }
  }
}

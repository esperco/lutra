/*
  Abstractions for managing different chart types
*/

/// <reference path="../lib/Model.StoreOne.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Components.IntervalRangeSelector.tsx" />
/// <reference path="./Actions.tsx" />
/// <reference path="./TimeStats.ts" />

module Esper.Charts {

  export interface ChartJSON extends Actions.EventFilterJSON {
    chartParams?: {};
  }

  export abstract class Chart<T extends ChartJSON> {
    public params: T;

    // Constructor must accept either subtype or generic ChartJSON object
    constructor(params?: T|ChartJSON) {
      this.params = this.cleanParams(params || {});
    }

    // Params is derived from user query -- don't trust, verify. Also convert
    // ChartJSON to T if applicable
    cleanParams(params: T|ChartJSON): T {
      var cleaned = Actions.cleanEventFilterJSON(params) as T;
      cleaned.chartParams = cleaned.chartParams || {};
      return cleaned;
    }

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
    renderPeriodSelector() {
      var selected: TimeStats.RequestPeriod = {
        windowStart: new Date(this.params.start),
        windowEnd: new Date(this.params.end)
      };

      return <Components.IntervalRangeSelector
        selected={selected}
        updateFn={(req) => this.updatePeriod(req)}
        dateLimit={TimeStats.MAX_TIME}
        minDate={TimeStats.MIN_DATE}
        maxDate={TimeStats.MAX_DATE}
      />;
    }

    updatePeriod(req: TimeStats.RequestPeriod) {
      this.updateRoute({
        props: this.extendCurrentProps({
          start: req.windowStart.getTime(),
          end: req.windowEnd.getTime()
        })
      });
    }

    // Message to show when busy
    noDataMsg(): JSX.Element {
      return <span>No data found</span>;
    }


    /* Helpers for Chart Actions */

    updateRoute({props, opts}: {props?: T; opts?: Route.nav.Opts;}) {
      Route.nav.query(props, opts || {})
    }

    extendCurrentProps(newParams: T|ChartJSON): T {
      return _.extend({}, this.params, newParams) as T;
    }
  }
}

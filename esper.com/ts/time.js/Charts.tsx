/*
  Abstractions for managing different chart types
*/

/// <reference path="../lib/Model.StoreOne.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Components.LabelSelector.tsx" />
/// <reference path="./AutoStats.ts" />

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
    static usesIntervals: boolean;

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
  }

  /*
    Base class for auto-charts (using daily stats API)
  */
  // export abstract class AutoChart extends Chart {
  //   static usesLabels = false;
  //   static usesIntervals = false;

  //   async() {
  //     var p = this.params;
  //     AutoStats.async(p.windowStart, p.windowEnd, p.calendars);
  //   }
  // }
}

/*
  Base class for charting selectors -- similar to a chart components, except
  that is stores the intermediate calculation state so that event changes
  don't cause checkboxes to disappear, etc.
*/
module Esper.Components {
  interface Props {
    // Data is a list because
    data: {
      id: number|string;
      calculation: EventStats.CalculationBase;
      events: Stores.Events.TeamEvent[];
      fetching: boolean;
      error: boolean;
    }[]
  }

  interface State {
    results: {
      id: number|string;
      grouping: Option.T<EventStats.OptGrouping>;
    }
  }



}

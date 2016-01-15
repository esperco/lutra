/*
  Displays login info or link to login via Otter
*/

/// <reference path="../common/Analytics.Web.ts" />
/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Api.ts" />
/// <reference path="../lib/Components.Modal.tsx" />
/// <reference path="./Esper.ts" />

module Esper.Components {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class ChartTypeModal extends Component<{}, {}> {
    render() {
      return <Modal title="Chart Type Options" icon="fa-bar-chart"
                    showFooter={true}>
        <div>
          <h4><strong>Total Duration Over Time</strong></h4>
          <p>This bar chart shows the total number of hours allocated to each
          category over fixed intervals of time -- e.g. how many hours do
          you spend on Sales Meetings each week?</p>
        </div>

        <div>
          <h4><strong>Percentage Allocation</strong></h4>
          <p>This pie chart shows percentages for how you allocate time
          between different categories -- e.g. what percentage of your time
          was spent on Sales Meetings between November 1 and December 1?</p>
          <p>If an event was assigned multiple labels, the time for that
          event is divided evenly between each <i>visible</i> label for the
          purpose of calculating percentages.</p>
        </div>

        <div>
          <h4><strong>Want Something Else?</strong></h4>
          <p>Esper is in beta, and we've currently limited the time
          period and types of charts you can get online. If you have a
          something specific you want charted or analyzed,{" "}
          <a href="https://twitter.com/esper_co">tweet us a request!</a></p>
          <div id="tweet-button" />
        </div>
      </Modal>;
    }

    componentDidMount() {
      Analytics.track(Analytics.Trackable.OpenTimeStatsChartTypeModal);
      if (Esper.twttr) {
        twttr.widgets.createHashtagButton("Esper", $("#tweet-button").get(0),
          { text: "Show me how I'm spending my time @esper_co",
            size: "large" });
        twttr.events.bind('click', (ev) =>
          Analytics.track(Analytics.Trackable.ClickTimeStatsTweetButton)
        );
      }
    }
  }
}

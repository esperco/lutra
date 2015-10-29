/// <reference path="../marten/ts/ReactHelpers.ts" />

/// <reference path="./Components.Chart.tsx" />
module Esper.Views {

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  export class Index extends Component<{}, {}> {
    render() {
      var data = {
        labels: ["January", "February", "March", "April", "May", "June", "July"],
        datasets: [
            {
                label: "My First dataset",
                fillColor: "rgba(220,220,220,0.5)",
                strokeColor: "rgba(220,220,220,0.8)",
                highlightFill: "rgba(220,220,220,0.75)",
                highlightStroke: "rgba(220,220,220,1)",
                data: [65, 59, 80, 81, 56, 55, 40]
            },
            {
                label: "My Second dataset",
                fillColor: "rgba(151,187,205,0.5)",
                strokeColor: "rgba(151,187,205,0.8)",
                highlightFill: "rgba(151,187,205,0.75)",
                highlightStroke: "rgba(151,187,205,1)",
                data: [28, 48, 40, 19, 86, 27, 90]
            }
        ]
      };

      return <div className="container">
        <Components.BarChart width={2} height={1}
          units="minutes" verticalLabel="Time (Minutes)" data={data} />
      </div>;
    }
  }
}


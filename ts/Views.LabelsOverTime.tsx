/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/Model.StoreOne.ts" />
/// <reference path="./Components.CalSelector.tsx" />

/*
  Page for seeing label stats over time
*/
module Esper.Views {
  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  // Store for currently selected team and calendar
  var selectStore = new Model.StoreOne<Components.CalSelection>();

  export class LabelsOverTime extends Component<{}, {}> {
    render() {
      return <div id="labels-over-time-page" className="container">
        <div className="row">
          <div className="col-sm-3">
            <Components.CalSelector store={selectStore} />
          </div>
        </div>
      </div>;
    }
  }
}


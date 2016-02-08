/*
  Onboarding steps
*/

/// <reference path="../lib/Analytics.ts" />
/// <reference path="./Onboarding.ts" />
/// <reference path="./Route.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  export class GifModal extends Component<{
    onHidden?: () => void;
  }, {}> {
    render() {
      return (<Modal title="Getting Started" icon="fa-question-circle"
                     onHidden={this.props.onHidden}
                     showFooter={true}>
        <div className="well">
          Click on events in the calendar and then add labels via the sidebar.
          You can label multiple events at the same time by holding down
          Shift when selecting events. See stats on what's been labeled by
          clicking {" "}<span className="symbol-quote">Charts</span>{" "}
          in the menu bar up top. Data for newly labeled events may take some
          time to show up.
        </div>
        <a href="img/TimeStats.gif" target="_blank">
          <img src="img/TimeStats.gif"
               style={{width: "100%", height: "auto"}} />
        </a>
      </Modal>);
    }

    componentDidMount() {
      Analytics.track(Analytics.Trackable.OpenTimeStatsGifModal);
    }

    hideModal() {
      this.jQuery().modal('hide');
    }
  }
}

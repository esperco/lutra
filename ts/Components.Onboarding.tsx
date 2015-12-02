/*
  Onboarding steps
*/

/// <reference path="../marten/ts/Analytics.ts" />
/// <reference path="./Components.CalAdd.tsx" />
/// <reference path="./Components.LabelAdd.tsx" />
/// <reference path="./Route.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  export class OnboardingCalModal extends Component<{}, {}> {
    render() {
      var info = Login.InfoStore.val();
      return <Modal title="Connect Calendars to Esper"
                    icon="fa-calendar-check-o">
        <div className="well">
          Welcome! Esper Time lets you label your calendar
          events and analyze how you spend your time. To get started, please
          select which calendar(s) you'd like to use with Esper Time.

          If the calendar you’re looking for doesn’t appear in this list,
          {" "}{ (info as any).is_nylas || info.platform === "Nylas" ?
            <span>
              ask the calendar owner to share it with the Exchange or Office
              365 account you logged in with.
            </span> :
            <span>
              ask the calendar owner to {" "}
              <a href="https://support.google.com/calendar/answer/37082?hl=en">
              share it with the Google account you logged in with</a>.
            </span>
          }
        </div>
        <CalAdd onDone={this.goToLabelModal.bind(this)}/>
      </Modal>;
    }

    componentDidMount() {
      Analytics.track(Analytics.Trackable.OpenTimeStatsAddCalendarsModal);
    }

    goToLabelModal() {
      this.jQuery().modal('hide');
      this.jQuery().on('hidden.bs.modal', () => {
        Layout.renderModal(<OnboardingLabelModal />);
      });
    }
  }

  export class OnboardingLabelModal extends Component<{}, {}> {
    render() {
      return <Modal title="Set Up Labels" icon="fa-tags">
        <div className="well">
          Create some labels to categorize your events. You
          can always add more later.
        </div>
        <LabelAdd onDone={this.hideModal.bind(this)}/>
      </Modal>;
    }

    componentDidMount() {
      Analytics.track(Analytics.Trackable.OpenTimeStatsAddLabelsModal);
    }

    hideModal() {
      this.jQuery().modal('hide');
      this.jQuery().on('hidden.bs.modal', function() {
        Layout.renderModal(<GifModal />);
      });
      Route.nav.path("calendar-labeling");
    }
  }

  export class GifModal extends Component<{}, {}> {
    render() {
      return (<Modal title="Getting Started" icon="fa-question-circle"
                     showFooter={true}>
        <div className="well">
          Click on events in the calendar and then add labels via the sidebar.
          You can label multiple events at the same time by holding down
          Shift when selecting events. See stats on what's been labeled by
          clicking 'Charts' in the upper left. Data for newly labeled events
          may take some time to show up.
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

/*
  Onboarding steps
*/

/// <reference path="../marten/ts/Analytics.ts" />
/// <reference path="./Components.CalAdd.tsx" />
/// <reference path="./Components.LabelAdd.tsx" />
/// <reference path="./Onboarding.ts" />
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
          clicking {" "}<span className="symbol-quote">Charts</span>{" "}
          in the upper left. Data for newly labeled events may take some time
          to show up.
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


  ///////

  interface OnboardingHeaderProps {
    icon?: string;        // FontAwesome icon
    title: string;        // Visible in title row

    // Used as content for a modal
    children?: JSX.Element[];
  }

  class OnboardingHeader extends Component<OnboardingHeaderProps, {}> {
    renderWithData() {
      var step = Onboarding.current();
      var disabledNext = !Onboarding.canGoToNext();

      return <div className="onboarding-header">
        <div className="nav">
          <h2 className="onboarding-title">
            { this.props.icon ?
              <i className={"fa fa-fw " + this.props.icon} /> :
              null
            }{" "}
            {this.props.title}
          </h2>{" "}
          { this.props.children ?
            <a onClick={this.openModal.bind(this)}>
              <i className="fa fa-fw fa-question-circle" />
            </a> : null
          }
          <div className="pull-right">
            <div className="btn-group">
              { step > 0 ?
                <button type="button" className="btn navbar-btn btn-default"
                        onClick={Onboarding.prev}>
                  <i className="fa fa-fw fa-angle-left" />
                </button> : null
              }
              <button type="button" className="btn navbar-btn btn-default"
                      onClick={Onboarding.next} disabled={disabledNext}>
                <i className="fa fa-fw fa-angle-right" />
              </button>
            </div>
          </div>
        </div>
        { this.renderProgress() }
      </div>
    }

    componentDidMount() {
      this.openModal();
    }

    componentDidUpdate(prevProps: OnboardingHeaderProps) {
      if (prevProps.title !== this.props.title) {
        this.openModal();
      }
    }

    renderProgress() {
      var total = Onboarding.paths.length;
      var current = Onboarding.current() + 1;
      var progress = Math.floor((current / total) * 100);
      return <div className="progress skinny">
        <div className="progress-bar" style={{width: progress + "%"}} />
      </div>;
    }

    openModal() {
      if (this.props.children) {
        Layout.renderModal(<Modal title={this.props.title}
            icon="fa-question-circle" showFooter={true}>
          {this.props.children}
        </Modal>);
      }
    }
  }

  /*
    Use functions rather component classes to spit out new headers because
    we want to reuse our OnboardingHeader component instance (which helps
    animate the progress bar)
  */

  export function onboardingStartHeader() {
    return <OnboardingHeader title="Let's Get Started!" icon="fa-rocket" />;
  }

  export function onboardingAddCalsHeader() {
    return <OnboardingHeader title="Add a Calendar to Continue"
      icon="fa-calendar-check-o" />;
  }

  export function onboardingAddLabelsHeader() {
    return <OnboardingHeader title="Add at Least 2 Labels to Continue"
      icon="fa-tags" />;
  }

  export function onboardingLabelEventsHeader() {
    var info = Login.InfoStore.val();

    return <OnboardingHeader title="Label an Event to Continue"
        icon="fa-th-list">
      <p>
        Awesome. You're all set to start labeling events. To label an event,
        first click on an event in the calendar below to select it. You can
        select multiple events by holding down the Shift key. Once selected,
        you can apply labels to those events by selecting them in the left
        sidebar.
      </p>
      <p>
        Apply some labels and then click the
        {" "}<span className="symbol-quote">
          <i className="fa fa-fw fa-angle-right" />
        </span>{" "}button
        in the upper right to continue.
      </p>
      <p>
        Don't see any events? Try adding some in {" "}{
          info.platform === "Nylas" ?
          <span>Microsoft Outlook</span> :
          <span>Google Calendar</span>
        }{" "} and clicking the
        {" "}<span className="symbol-quote">
          <i className="fa fa-fw fa-refresh" />
        </span>{" "}button in
        the upper right.
      </p>
    </OnboardingHeader>;
  }

  export function onboardingChartsHeader() {
    return <OnboardingHeader title="Chart Your Data" icon="fa-bar-chart">
      <p>
        Fantastic. As you label events, you can view charts that show how
        time is being spent. We're currently only showing data for the last
        5 days, weeks, and months, but if you need data for a custom time
        period, feel free to let us know by clicking the {" "}
        <span className="symbol-quote">Other?</span>{" "} button in
        the upper right.
      </p>
      <p>
        It may take a few minutes for charts to update with data from newly
        labeled events. Click the
        {" "}<span className="symbol-quote">
          <i className="fa fa-fw fa-refresh" />
        </span>{" "}button in
        the upper right to refresh.
      </p>
      <p>
        That's it! Click the
        {" "}<span className="symbol-quote">
          <i className="fa fa-fw fa-angle-right" />
        </span>{" "}button
        in the upper right to conclude this tutorial and go back to labeling.
      </p>
    </OnboardingHeader>;
  }
}

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


  ///////

  interface StringFn { (): string; }
  interface OnboardingHeaderProps {
    icon?: string;                // FontAwesome icon
    title: string|StringFn;       // Visible in title row
    modalTitle?: string;          // Optional alternate title for modal,
                                  // defaults to title

    // Used as content for a modal
    children?: JSX.Element[];
  }

  class OnboardingHeader extends Component<OnboardingHeaderProps, {}> {
    renderWithData() {
      var step = Onboarding.current();
      var nextText = "Next";
      if (step === 0) {
        nextText = "Get Started";
      } else if (step >= Onboarding.paths.length - 1) {
        nextText = "Start Trial";
      }

      var disabledNext = !Onboarding.canGoToNext();

      return <div className="onboarding-header-wrapper">
        <div className="onboarding-header container">
          <div className="nav">
            <h2 className="onboarding-title">
              { this.props.icon ?
                <i className={"fa fa-fw " + this.props.icon} /> :
                null
              }{" "}
              { this.getTitle() }
            </h2>{" "}
            { this.props.children ?
              <a onClick={this.openModal.bind(this)}>
                <i className="fa fa-fw fa-question-circle" />
              </a> : null
            }
            <div className="pull-right">
              <button type="button" className="btn navbar-btn btn-default"
                  onClick={this.skip.bind(this)}>
                Skip
              </button>{" "}
              <div className="btn-group">
                { step > 0 ?
                  <button type="button" className="btn navbar-btn btn-default"
                          onClick={Onboarding.prev}>
                    <i className="fa fa-angle-left" />
                    {" "}Back
                  </button> : null
                }
                <button type="button" className={
                      "btn navbar-btn " + (disabledNext ?
                      "btn-default" : "btn-success onboarding-highlight")
                    } onClick={Onboarding.next} disabled={disabledNext}>
                  { nextText }{" "}
                  <i className="fa fa-angle-right" />
                </button>
              </div>
            </div>
          </div>
        { this.renderProgress() }
        </div>
      </div>
    }

    getTitle() {
      if (typeof(this.props.title) === "string") {
        return this.props.title as string;
      } else {
        return (this.props.title as StringFn)();
      }
    }

    componentDidMount() {
      this._currentPath = Route.current;
      this.openModal();
    }

    // Track the current path (used in update below)
    _currentPath: string;

    componentDidUpdate(prevProps: OnboardingHeaderProps) {
      // Open modal when path changes only
      if (this._currentPath !== Route.current) {
        this._currentPath = Route.current;
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
        Layout.renderModal(<Modal
            title={this.props.modalTitle || this.getTitle()}
            icon="fa-question-circle" showFooter={true}>
          {this.props.children}
        </Modal>);
      }
    }

    skip() {
      Analytics.track(Analytics.Trackable.SkipTimeStatsOnboarding);
      Onboarding.skip();
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

    // Put title in function to have it reactively update
    function title() {
      var labelsRequired = Onboarding.labelsRequired();
      if (labelsRequired > 0) {
        return "Label " + eventStr(labelsRequired) + " to Continue";
      }
      return "Click Next to Continue";
    }

    function eventStr(num: number) {
      if (num === 1) {
        return "1 Event";
      } else {
        return num + " Events";
      }
    }

    var modalTitle = "Label " + eventStr(Onboarding.LABELS_REQUIRED) +
                     " to Continue";

    return <OnboardingHeader title={title} modalTitle={modalTitle}
            icon="fa-th-list">
      <p>
        Click on an event in your calendar and select a label from the list
        on the left. You can select multiple events by hold down the Shift
        key.
      </p>
      <p>
        Once you've added labels to
        {" " + eventStr(Onboarding.LABELS_REQUIRED) + " "}
        click {" "}<span className="symbol-quote">
          Next{" "}<i className="fa fa-fw fa-angle-right" />
        </span>{" "}to continue.
      </p>
      <p className="esper-de-em">
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
    return <OnboardingHeader title="Fantastic! Chart Your Data"
            icon="fa-bar-chart">
      <p>
        Once you've labeled your events you can see how you're spending your
        time in the charts section. Right now you can only see the last 5 days,
        weeks, and months.
      </p>
      <p>
        You can request custom reports and time periods by clicking the {" "}
        <span className="symbol-quote">Other?</span>{" "} button in
        the upper right.
      </p>
      <p>
        That's it! Click
        {" "}<span className="symbol-quote">
          Start Trial <i className="fa fa-fw fa-angle-right" />
        </span>{" "}
        to begin your 30 day trial.
      </p>
    </OnboardingHeader>;
  }
}

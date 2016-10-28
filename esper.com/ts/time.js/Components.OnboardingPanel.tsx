/*
  Base component for onboarding panel
*/
module Esper.Components {

  interface Props {
    heading: JSX.Element|JSX.Element[]|string;
    subheading?: JSX.Element|JSX.Element[]|string;
    progress: number; // 0 - 1
    busy?: boolean;
    disableNext?: boolean;
    backPath?: string;
    nextText?: string;
    onNext: () => void;
    onSkip?: () => void;
    children?: JSX.Element[];
  }

  interface State {

  }

  export class OnboardingPanel extends ReactHelpers.Component<Props, State> {
    render() {
      return <div className="onboarding">
        <div className="panel panel-default">
          <div className="panel-heading">
            <h4 className="description-header">
              { this.props.backPath ?
                <a className="action back-action" href={this.props.backPath}>
                  <i className="fa fa-fw fa-left fa-arrow-circle-left" />
                </a> : null
              }
              { this.props.heading }
            </h4>
            {
              this.props.subheading ?
              <div className="description">
                { this.props.subheading }
              </div> : null
            }
          </div>
          <div className="panel-body">
            { this.props.children }
          </div>
          <ProgressBar width={this.props.progress} skinny={true} />
          <div className="panel-footer clearfix">
            { this.props.busy ? <div className="esper-spinner" /> : null }
            <div className="pull-right">
              <button className="btn btn-default"
                      onClick={() => this.skip()}
                      disabled={this.props.busy}>
                Skip
              </button>
              <button className="btn btn-primary"
                      onClick={() => this.props.onNext()}
                      disabled={this.props.busy || this.props.disableNext}>
                { this.props.nextText || "Next" }
              </button>
            </div>
          </div>
        </div>
      </div>;
    }

    skip() {
      this.props.onSkip ?
        this.props.onSkip() :
        Actions.Teams.createDefaultTeam()
          .then(() => Route.nav.home())
    }
  }

}

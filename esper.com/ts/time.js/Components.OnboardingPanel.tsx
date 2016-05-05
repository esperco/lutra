/*
  Base component for onboarding panes
*/
module Esper.Components {

  interface Props {
    heading: JSX.Element|JSX.Element[]|string;
    progress: number; // 0 - 1
    backPath?: string;
    children?: JSX.Element[];
  }

  interface State {

  }

  export class OnboardingPanel extends ReactHelpers.Component<Props, State> {
    render() {
      return <div className="container"><div className="row">
        <div className="col-sm-offset-2 col-sm-8">
          <div className="panel panel-default onboarding-panel">
            <div className="panel-heading">
              { this.props.backPath ?
                <a className="action" href={this.props.backPath}>
                  <i className="fa fa-fw fa-arrow-circle-left" />
                </a> : null
              }
              { this.props.heading }
            </div>
            <div className="panel-body">
              { this.props.children }
            </div>
            <div className="progress skinny">
              <div className="progress-bar" role="progressbar"
                style={{
                  width: Util.roundStr(this.props.progress * 100) + "%"
                }}>
              </div>
            </div>
            <div className="panel-footer">
              Footer
            </div>
          </div>
        </div>



      </div></div>;
    }
  }

}

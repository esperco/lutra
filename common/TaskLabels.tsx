/*
  Component for updating labels for a given task -- used in both Gcal and
  Gmail sidebars
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../common/Teams.ts" />
/// <reference path="./Api.ts" />

module Esper.TaskLabels {
  // Sort of annoying but needed to make namespaced React work with JSX
  var React = Esper.React;

  // Shorten references to React Component class
  var Component = ReactHelpers.Component;

  interface LabelListProps {
    team: ApiT.Team;   // Used to determine which labels to show

    // Used to determine which labels are checked -- can pass a NewTask
    // object to show stub labels
    task?: ApiT.Task|ApiT.NewTask;

    busy?: boolean;    // If true, show busy indicator

    // Callback to handle label changes
    handleChange: (labels: string[]) => void;
  }

  export class LabelList extends Component<LabelListProps, {}> {
    render() {
      var labelElms = _.map(
        this.props.team.team_labels,
        this.renderLabel.bind(this));

      return (<div className="esper-bs">
        <div>
          { labelElms && labelElms.length ? labelElms :
            <div className="esper-no-labels">No Labels Found</div> }
        </div>
        <div className="esper-subsection-footer">
          {
            this.props.busy ?
            <span>Saving &hellip;</span> :
            <a href={Conf.Api.url}>
              <i className="fa fa-fw fa-cog"></i>
              {" "} Configure Labels
            </a>
          }
        </div>
      </div>);
    }

    renderLabel(name: string, index: number) {
      var checked = (this.props.task &&
                     _.contains(this.props.task.task_labels, name));
      var id = this.getId(index.toString());
      return (<div className="checkbox" key={index.toString() + "-" + name}>
        <label htmlFor={id}>
          <input id={id} type="checkbox" className="checkbox"
            checked={checked} value={name}
            onChange={this.onLabelClick.bind(this) } />
          {" "} {name}
        </label>
      </div>);
    }

    // Gets a list of labels based on what's checked
    getLabels(): string[] {
      return $.map(this.find("input:checked"), function(elm) {
        return $(elm).val();
      });
    }

    protected onLabelClick(e) {
      this.props.handleChange(this.getLabels());
    }
  }
}
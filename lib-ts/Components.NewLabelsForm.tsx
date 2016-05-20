/*
  A form for creating a new labels during onboarding
*/

/// <reference path="./Actions.Teams.ts" />
/// <reference path="./ReactHelpers.ts" />

module Esper.Components {
  const DEFAULT_MIN_LABEL_COUNT = 3;

  interface Props {
    team: ApiT.Team;
  }

  interface State {
    labels: {
      id: string; // Temporary id React can use to identify component
      display: string; // Display version of label
    }[];
    hasError?: boolean;
  }

  export class NewLabelsForm extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      var labels = _.map(props.team.team_labels, (l) => ({
        id: Util.randomString(),
        display: l
      }));

      var additionalLabels = Math.max(
        DEFAULT_MIN_LABEL_COUNT - labels.length, 1);
      _.times(additionalLabels, () => labels.push({
        id: Util.randomString(),
        display: ""
      }));

      this.state = {
        labels: labels
      };
    }

    render() {
      return <div className="form-set esper-new-labels">
        {
          this.state.hasError ?
          <div className="alert alert-danger">
            { Text.LabelRequired }
          </div> : null
        }
        { _.map(this.state.labels, (l) =>
          <div key={l.id} className="form-group">
            <span className="label-icon">
              <i className="fa fa-fw fa-tag" />
            </span>
            <span className="action rm-action" onClick={() => this.onRm(l.id)}>
              <i className="fa fa-fw fa-close" />
            </span>
            <div className="label-input-container">
              <input name={"label-" + l.id}
                type="text" className="form-control"
                value={l.display}
                onChange={(e) => this.onLabelChange(l.id, e)}
                placeholder="New Goal" />
            </div>
          </div>
        )}
        <div className="add-label-div clearfix">
          <span className="action pull-right" onClick={() => this.onAdd()}>
            <i className="fa fa-fw fa-plus" />{" "}
            Add Goal
          </span>
        </div>
      </div>;
    }

    onLabelChange(id: string, event: React.FormEvent) {
      this.mutateState((state) => {
        state.hasError = false;

        var label = _.find(state.labels, (l) => l.id === id);
        label.display = (event.target as HTMLInputElement).value || "";

        var last = _.last(state.labels);
        if (!last || !!last.display) {
          state.labels.push({
            id: Util.randomString(),
            display: ""
          });
        }
      });
    }

    onAdd() {
      this.mutateState((state) => {
        state.labels.push({
          id: Util.randomString(),
          display: ""
        });
      })
    }

    onRm(id: string) {
      this.mutateState((state) => {
        _.remove(state.labels, (l) => l.id === id);
      });
    }

    // Ref the component and call this to get values, updates state if invalid
    validate(): Option.T<string[]> {
      var labels = _.map(this.state.labels, (l) => l.display);
      labels = _.filter(labels);
      if (labels.length) {
        return Option.some(labels)
      }
      this.mutateState((s) => s.hasError = true);
      return Option.none<string[]>();
    }
  }
}

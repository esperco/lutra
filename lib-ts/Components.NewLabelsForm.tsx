/*
  A form for creating a new labels during onboarding
*/

/// <reference path="./Actions.Teams.ts" />
/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Text.tsx" />

module Esper.Components {
  const DEFAULT_MIN_LABEL_COUNT = 3;

  interface LabelProfile {
    name: string;
    labels: string[];
  }

  interface Props {
    team: ApiT.Team;
    profiles?: LabelProfile[];
    onProfileSelect?: (p: LabelProfile) => void;
  }

  interface State {
    showProfiles?: boolean;
    labels: {
      id: string;      // Temporary id React can use to identify component
      display: string; // Display version of label
    }[];
    hasError?: boolean;
  }

  export class NewLabelsForm extends ReactHelpers.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      var labels = _.map(props.team.team_api.team_labels, (l) => ({
        id: Util.randomString(),
        display: l.original
      }));
      labels = this.addMinLabels(labels);

      this.state = {
        labels: labels,
        showProfiles: _.isEmpty(props.team.team_api.team_labels) &&
                      !_.isEmpty(props.profiles)
      };
    }

    addMinLabels(labels: { id: string; display: string }[]) {
      var additionalLabels = Math.max(
        DEFAULT_MIN_LABEL_COUNT - labels.length, 1);

      var ret = _.clone(labels);
      _.times(additionalLabels, () => ret.push({
        id: Util.randomString(),
        display: ""
      }));

      return ret;
    }

    render() {
      return <div className="form-set esper-new-labels">
        {
          this.state.hasError ?
          <div className="alert alert-danger">
            { Text.LabelRequired }
          </div> : null
        }
        {
          this.state.showProfiles ?
          this.renderProfileSelector() :
          this.renderLabelInterface()
        }
      </div>;
    }

    renderProfileSelector() {
      return [
        <div key="alert" className="alert alert-info">
          { Text.LabelProfileDescription }
        </div>,
        <ProfileSelector key="selector"
          profiles={this.props.profiles}
          onSelect={(profile) => this.selectProfile(profile)} />
      ];
    }

    selectProfile(profile: LabelProfile) {
      this.mutateState((state) => {
        state.labels = this.addMinLabels(
          _.map(profile.labels, (l) => ({
            id: Util.randomString(),
            display: l
          }))
        );
        state.showProfiles = false;
      });

      if (this.props.onProfileSelect) {
        this.props.onProfileSelect(profile);
      }
    }

    renderLabelInterface() {
      return <div>
        { _.isEmpty(this.props.team.team_api.team_labels) ?
            <div className="esper-section">
              <a className="btn btn-default form-control"
                   onClick={() => this.mutateState((s) => s.showProfiles = true)}>
                  <i className="fa fa-fw fa-arrow-circle-left" />
                  {" "}{ Text.LabelProfileBackBtn }
              </a>
          </div> : null }
        { _.map(this.state.labels, (l) =>
            <div key={"label-" + l.id} className="esper-section">
              <span className="label-icon">
                <i className="fa fa-fw fa-tag" />
              </span>
              <span className="action rm-action"
                    onClick={() => this.onRm(l.id)}>
                <i className="fa fa-fw fa-close" />
              </span>
              <div className="label-input-container">
                <input name={"label-" + l.id}
                  type="text" className="form-control"
                  value={l.display}
                  onChange={(e) => this.onLabelChange(l.id, e)}
                  placeholder={ _.capitalize(Text.NewLabel) } />
              </div>
            </div>
        )}

        <div key="add-label"
             className="add-label-div esper-panel-section clearfix">
          <span className="action pull-right"
                onClick={() => this.onAdd()}>
            <i className="fa fa-fw fa-plus" />{" "}
            { _.capitalize(Text.AddLabel) }
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


  function ProfileSelector({profiles, onSelect} : {
    profiles: LabelProfile[];
    onSelect: (profile: LabelProfile) => void;
  }) {
    return <div className="profile-selector">
      { _.map(profiles, (p) =>
        <div key={p.name} className="profile-selection">
          <button className="btn btn-default" onClick={() => onSelect(p)}>
            <i className="fa fa-fw fa-tags" />{" "}
            {p.name}
          </button>
        </div>
      ) }
    </div>;
  }
}

/*
  Component for adding and sharing new calendars
*/

/// <reference path="../marten/ts/ReactHelpers.ts" />
/// <reference path="../marten/ts/Queue.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Calendars.ts" />
/// <reference path="./Components.Modal.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface LabelAddProps {
    disableDone?: boolean;
    doneText?: string;
    onDone?: () => void;
    suggestedLabels?: string[]
  }

  interface LabelAddState {
    selectedTeamId?: string;
  }

  export class LabelAdd extends Component<LabelAddProps, LabelAddState> {
    _input: React.Component<any, any>;

    constructor(props: LabelAddProps) {
      super(props);

      // Init state = team of selected calendar, else first team (if any)
      var selectedTeamId: string;
      var selection = Calendars.selectStore.val();
      if (selection && selection.teamId) {
        selectedTeamId = selection.teamId;
      } else {
        selectedTeamId = Teams.first() && Teams.first().teamid
      }
      this.state = {
        selectedTeamId: selectedTeamId
      };
    }

    renderWithData() {
      var labels = this.getLabels();
      return <div>
        { this.renderTeamSelector() }
        { this.renderSuggestedLabels() }
        { this.renderLabelInput() }
        {
          labels.length ?
          <div className="list-group">
            { _.map(labels, this.renderLabel.bind(this)) }
          </div> :
          (
            this.hasSuggested() ? null :
            <div className="esper-no-content">
              No Labels Added Yet
            </div>
          )
        }
        { this.renderFooter() }
      </div>;
    }

    getLabels() {
      var team = Teams.get(this.state.selectedTeamId);
      return (team && team.team_labels) || [];
    }

    renderSuggestedLabels() {
      if (this.hasSuggested()) {
        return <div className="esper-panel-section clearfix">
          <label>Need Some Ideas?</label>
          <div>
            { _.map(this.props.suggestedLabels, (labelName) =>
              <div className="col-sm-4 suggested-label" key={labelName}>
                <button onClick={() => this.toggleSuggestedLabel(labelName)}
                  className={"btn " + (_.contains(this.getLabels(), labelName) ?
                  "btn-success" : "btn-default"
                )}>
                  {labelName}
                </button>
              </div>
            )}
          </div>
        </div>
      }
    }

    toggleSuggestedLabel(label: string) {
      if (_.contains(this.getLabels(), label)) {
        Teams.rmLabels(this.state.selectedTeamId, label);
      } else {
        Teams.addLabels(this.state.selectedTeamId, label);
      }
    }

    hasSuggested() {
      return this.props.suggestedLabels && this.props.suggestedLabels.length;
    }

    renderLabel(label: string) {
      if (this.hasSuggested() && _.contains(this.props.suggestedLabels, label))
      {
        return; // Only render if not suggested
      }

      return <div className="list-group-item one-line" key={label}>
        <i className="fa fa-fw fa-tag" />
        {" "}{label}{" "}
        <a className="pull-right text-danger"
           onClick={(e) => this.onClickRmLabel(e, label)}>
          <i className="fa fa-fw fa-close list-group-item-text" />
        </a>
      </div>;
    }

    renderLabelInput() {
      return <div className="form-group">
        <label htmlFor={this.getId("new-labels")}>
          { this.hasSuggested() ?
            "Or Use Your Own" :
            "New Labels" }
          {" "} (Separate by Commas)
        </label>
        <div className="input-group">
          <input type="text" className="form-control esper-modal-focus"
                 id={this.getId("new-labels")} ref={(c) => this._input = c}
                 onKeyDown={this.inputKeydown.bind(this)}
                 placeholder={"Q1 Sales Goal, Positive Meeting, Negative Meeting"} />
          <span className="input-group-btn">
            <button className="btn btn-default" type="button"
                    onClick={this.submitInput.bind(this)}>
              <i className="fa fa-fw fa-plus" />{" "}Add
            </button>
          </span>
        </div>
      </div>;
    }

    submitInput() {
      var input = $(React.findDOMNode(this._input));
      if (input.val().trim()) {
        Teams.addLabels(this.state.selectedTeamId, input.val());
      }
      input.val("");
      input.focus();
    }

    // Catch enter key on input -- use jQuery to actual examine value
    inputKeydown(e: KeyboardEvent) {
      if (e.keyCode === 13) {
        e.preventDefault();
        this.submitInput();
      }
    }

    onClickRmLabel(e: React.SyntheticEvent, label: string) {
      e.preventDefault();
      Teams.rmLabels(this.state.selectedTeamId, label);
    }

    renderTeamSelector() {
      var allTeamIds = Teams.allIds() || [];
      var loginInfo = Login.InfoStore.val();
      var isNylas = loginInfo.platform === "Nylas";
      if (allTeamIds.length > 1) {
        return <div className="form-group">
          <label htmlFor={this.getId("team-select")} className="control-label">
            { isNylas ? "Calendar Owner" : "Executive Team" }
          </label>
          <select className="form-control"
                  value={this.state.selectedTeamId}
                  onChange={this.changeTeam.bind(this)}>
            {_.map(allTeamIds, (_id) => {
              var t = Teams.get(_id);
              if (t) {
                return <option key={_id} value={_id}>{t.team_name}</option>;
              }
            })}
          </select>
        </div>;
      }
    }

    changeTeam(event: Event) {
      var target = event.target as HTMLOptionElement;
      this.setState({selectedTeamId: target.value})
    }

    renderFooter() {
      var dataStatus = Teams.dataStatus(this.state.selectedTeamId);
      var busy = dataStatus === Model.DataStatus.INFLIGHT;

      // Don't render footer if no done option and we don't need to show
      // busy indicator
      if (!this.props.onDone && !busy) {
        return;
      }

      return <div className="clearfix modal-footer">
        { busy ?
          <div>
            <div className="esper-spinner" />
            <span className="esper-footer-text">
              Saving &hellip;
            </span>
          </div> :
          <button className="btn btn-secondary"
                  disabled={this.props.disableDone}
                  onClick={this.handleDone.bind(this)}>
            {this.props.doneText || "Done"}
          </button>
        }
      </div>;
    }

    handleDone() {
      this.submitInput();
      this.props.onDone();
    }
  }

  // Used to track the next pending label update for an id in a queue
  var nextUpdates: {
    [index: string]: string[]
  } = {};


  export class LabelAddModal extends Component<{}, {}> {
    render() {
      return <Modal title="Edit Event Labels" icon="fa-tags">
        <LabelAdd onDone={this.hideModal.bind(this)}/>
      </Modal>;
    }

    hideModal() {
      this.jQuery().modal('hide');
    }

    componentDidMount() {
      Analytics.track(Analytics.Trackable.OpenTimeStatsAddLabelsModal);
    }
  }
}

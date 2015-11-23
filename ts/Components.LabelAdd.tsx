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
    onDone: () => void;
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
      return <div>
        { this.renderTeamSelector() }
        { this.renderLabelInput() }
        <div className="list-group">
          { _.map(this.getLabels(), this.renderLabel.bind(this)) }
        </div>
        { this.renderFooter() }
      </div>;
    }

    getLabels() {
      var team = Teams.get(this.state.selectedTeamId);
      return team.team_labels || [];
    }

    renderLabel(label: string) {
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
          New Labels (Separate by Commas)
        </label>
        <div className="input-group">
          <input type="text" className="form-control esper-modal-focus"
                 id={this.getId("new-labels")} ref={(c) => this._input = c}
                 onKeyDown={this.inputKeydown.bind(this)}
                 placeholder={"Sharks With Laser Beams, Mr. Bigglesworth, " +
                              "Cloning Miniature Versions of Myself"} />
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

    // Catch enter key on input -- other jQuery to actual examine value
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
      var allTeams = Teams.all();
      if (allTeams && allTeams.length > 1) {
        return <div className="form-group">
          <select className="form-control"
                  value={this.state.selectedTeamId}
                  onChange={this.changeTeam.bind(this)}>
            {_.map(allTeams, (t) =>
              <option key={t.teamid} value={t.teamid}>{t.team_name}</option>
            )}
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

      return <div className="clearfix modal-footer">
        { busy ?
          <div>
            <div className="esper-spinner" />
            <span className="esper-footer-text">
              Saving &hellip;
            </span>
          </div> :
          <button className="btn btn-secondary" onClick={this.props.onDone}>
            Done
          </button>
        }
      </div>;
    }
  }

  // Used to track the next pending label update for an id in a queue
  var nextUpdates: {
    [index: string]: string[]
  } = {};


  export class LabelAddModal extends Component<{}, {}> {
    render() {
      return <Modal title="Edit Event Labels">
        <LabelAdd onDone={this.hideModal.bind(this)}/>
      </Modal>;
    }

    hideModal() {
      this.jQuery().modal('hide');
    }
  }
}

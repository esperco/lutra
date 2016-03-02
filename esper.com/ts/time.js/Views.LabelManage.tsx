/*
  Component for adding and sharing new calendars
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Components.ErrorMsg.tsx" />
/// <reference path="../lib/Components.Modal.tsx" />
/// <reference path="../lib/Option.ts" />
/// <reference path="../lib/Queue.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./BatchLabelChange.ts" />
/// <reference path="./Teams.ts" />
/// <reference path="./Calendars.ts" />

module Esper.Views {
  var Component = ReactHelpers.Component;

  interface LabelManageProps {
    disableDone?: boolean;
    doneText?: string;
    onDone?: () => void;
  }

  interface LabelManageState {
    selectedTeamId?: string;

    // Show edit interface or remove prompt for a given label
    editLabel?: string;
    rmLabelPrompt?: string;
  }

  function getTeamId() {
    var selection = Option.cast(Calendars.SelectStore.val());
    return selection.match({
      none: Teams.firstId,
      some: (s) => s.teamId || Teams.firstId()
    });
  }

  export class LabelManage
    extends Component<LabelManageProps, LabelManageState>
  {
    _editInput: HTMLInputElement;

    constructor(props: LabelManageProps) {
      super(props);
      this.state = {
        selectedTeamId: getTeamId()
      };
    }

    renderWithData() {
      var teamStatus = Teams.dataStatus(this.state.selectedTeamId);
      var changeStatus = BatchLabelChange.getStatus(this.state.selectedTeamId);
      if (teamStatus === Model.DataStatus.FETCH_ERROR ||
          teamStatus === Model.DataStatus.PUSH_ERROR ||
          changeStatus === Model.DataStatus.FETCH_ERROR ||
          changeStatus === Model.DataStatus.PUSH_ERROR)
      {
        return <Components.ErrorMsg />;
      }

      var labels = this.getLabels();
      return <div>
        { this.renderTeamSelector() }
        {
          !labels.length ? null :
          <div className="alert alert-info">
              <i className="fa fa-fw fa-pencil" />{" "}Rename a label across
              all events.<br />
              <i className="fa fa-fw fa-archive" />{" "}Archive a label to
              remove it from this list but keep displaying it in charts.<br />
              <i className="fa fa-fw fa-trash" />{" "}Delete a label to
              permanently remove it from all charts and events.
          </div>
        }
        {
          labels.length ?
          <div className="list-group">
            { _.map(labels, this.renderLabel.bind(this)) }
          </div> :
          (
            <div className="esper-no-content">
              No Labels Found
            </div>
          )
        }
        { this.renderFooter() }
      </div>;
    }

    getLabels() {
      var team = Teams.get(this.state.selectedTeamId);
      var ret = (team && team.team_labels) || [];
      return Labels.sortLabelStrs(ret);
    }

    renderLabel(label: string) {
      var rmLabel = this.state.rmLabelPrompt &&
                    this.state.rmLabelPrompt.toLowerCase();
      if (label.toLowerCase() === rmLabel) {
        return <div className="list-group-item" key={label}>
          <div className="form-group">
            Are you sure you want to remove the
            {" "}<strong>{label}</strong>{" "}
            label from all events? This cannot be undone.
          </div>
          <div className="row">
            <div className="col-xs-6">
              <button className="btn btn-default form-control" type="button"
                      onClick={this.resetState.bind(this)}>
                Cancel
              </button>
            </div>
            <div className="col-xs-6">
              <button className="btn btn-danger form-control" type="button"
                      onClick={() => this.rmLabel(label)}>
                Remove
              </button>
            </div>
          </div>
        </div>;
      }

      var editLabel = this.state.editLabel &&
                      this.state.editLabel.toLowerCase();
      if (label.toLowerCase() === editLabel) {
        label = this.fmtLabelInput(label);
        return <div className="list-group-item one-line" key={label}>
          <div className="form-group">
            <input ref={ (c) => this._editInput = c }
                   onKeyDown={this.editInputKeydown.bind(this)}
                   className="form-control" defaultValue={label}/>
          </div>
          <div className="row">
            <div className="col-xs-6">
              <button className="btn btn-default form-control" type="button"
                      onClick={this.resetState.bind(this)}>
                Cancel
              </button>
            </div>
            <div className="col-xs-6">
              <button className="btn btn-primary form-control" type="button"
                      onClick={this.submitEditInput.bind(this)}>
                Save
              </button>
            </div>
          </div>
        </div>;
      }

      return <div className="list-group-item one-line" key={label}>
        <i className="fa fa-fw fa-tag" />
        {" "}{label}{" "}
        <span>
          <a className="pull-right text-danger" title="Delete"
             onClick={(e) => this.promptRmFor(label)}>
            <i className="fa fa-fw fa-trash list-group-item-text" />
          </a>
          <a className="pull-right text-info" title="Archive"
             onClick={(e) => this.archive(label)}>
            <i className="fa fa-fw fa-archive list-group-item-text" />
          </a>
          <a className="pull-right text-info" title="Edit"
             onClick={(e) => this.showEditFor(label)}>
            <i className="fa fa-fw fa-pencil list-group-item-text" />
          </a>
        </span>
      </div>;
    }

    resetState() {
      this.setState({
        selectedTeamId: this.state.selectedTeamId,
        editLabel: null,
        rmLabelPrompt: null
      });
    }

    archive(label: string) {
      this.resetState();
      Teams.rmLabels(this.state.selectedTeamId, this.fmtLabelInput(label));
    }

    // Clean label input before submission
    fmtLabelInput(label: string) {
      label = label.trim();
      if (label.indexOf(",") > -1) label = "\"" + label + "\"";
      return label;
    }

    promptRmFor(label: string) {
      this.setState({
        selectedTeamId: this.state.selectedTeamId,
        editLabel: null,
        rmLabelPrompt: label
      });
    }

    rmLabel(label: string) {
      this.archive(label);
      BatchLabelChange.remove(this.state.selectedTeamId, label);
    }

    showEditFor(label: string) {
      this.setState({
        selectedTeamId: this.state.selectedTeamId,
        editLabel: label,
        rmLabelPrompt: null
      });
    }

    // Catch enter key on input -- use jQuery to actual examine value
    editInputKeydown(e: KeyboardEvent) {
      if (e.keyCode === 13) {
        e.preventDefault();
        this.submitEditInput();
      }
    }

    submitEditInput() {
      var input = $(this._editInput);
      var val = input.val().trim();
      var orig = this.fmtLabelInput(this.state.editLabel);
      if (val && val !== orig) {
        Teams.addRmLabels(this.state.selectedTeamId, val, orig);
        BatchLabelChange.rename(this.state.selectedTeamId, orig, val, true);
      }
      this.resetState();
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

    componentDidUpdate(prevProps: LabelManageProps, prevState: LabelManageState) {
      if (this.state.editLabel &&
          this.state.editLabel !== prevState.editLabel &&
          this._editInput) {
        $(this._editInput).select();
      }
    }

    renderFooter() {
      var dataStatus = Teams.dataStatus(this.state.selectedTeamId);
      var changeStatus = BatchLabelChange.getStatus(this.state.selectedTeamId);
      var busy = (dataStatus === Model.DataStatus.INFLIGHT ||
                  changeStatus === Model.DataStatus.INFLIGHT);

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
                  onClick={this.props.onDone}>
            {this.props.doneText || "Close"}
          </button>
        }
      </div>;
    }
  }


  export class LabelManageModal extends Component<{
    onHidden?: () => void;
  }, {}> {
    render() {
      return <Components.Modal title="Edit Event Labels" icon="fa-tags"
                    onHidden={this.props.onHidden}>
        <LabelManage onDone={this.hideModal.bind(this)} />
      </Components.Modal>;
    }

    hideModal() {
      this.jQuery().modal('hide');
    }

    componentDidMount() {
      Analytics.track(Analytics.Trackable.OpenTimeStatsAddLabelsModal);
    }
  }
}
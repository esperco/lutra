/*
  Component for adding and sharing new calendars
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Actions.Teams.ts" />
/// <reference path="../lib/Components.ErrorMsg.tsx" />
/// <reference path="../lib/Components.Modal.tsx" />
/// <reference path="../lib/Components.SelectMenu.tsx" />
/// <reference path="../lib/Option.ts" />
/// <reference path="../lib/Queue.ts" />
/// <reference path="../lib/Stores.Teams.ts" />
/// <reference path="./Esper.ts" />
/// <reference path="./BatchLabelChange.ts" />
/// <reference path="./Components.LabelEditor2.tsx" />
/// <reference path="./Calendars.ts" />

module Esper.Views {
  var Component = ReactHelpers.Component;

  export class LabelManage extends Component<{
    teamId: string;
  }, {}> {
    renderWithData() {
      return <div className="container"><div className="row">
        <div className="col-sm-offset-2 col-sm-8">
          <div className="panel panel-default">
            <div className="panel-body">
              <LabelManageBase
                teamId={this.props.teamId}
                onDone={() => Route.nav.path("/list")}
              />
            </div>
          </div>
        </div>
      </div></div>;
    }
  }


  /////

  interface LabelManageProps {
    teamId: string;
    disableDone?: boolean;
    doneText?: string;
    onDone?: () => void;
  }

  interface LabelManageState {
    // Show edit interface or remove prompt for a given label
    editLabel?: string;
    rmLabelPrompt?: string;
    labelFilter?: string;
  }

  class LabelManageBase extends Component<LabelManageProps, LabelManageState>
  {
    _editInput: HTMLInputElement;

    constructor(props: LabelManageProps) {
      super(props);
      this.state = {};
    }

    renderWithData() {
      var teamStatus = Stores.Teams.status(this.props.teamId).match({
        none: () => Model.DataStatus.FETCH_ERROR,
        some: (d) => d
      });
      var changeStatus = BatchLabelChange.getStatus(this.props.teamId);
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
        { this.renderLabelInput() }
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
      var team = Stores.Teams.get(this.props.teamId);
      var ret = team.match({
        none: (): string[] => [],
        some: (t) => t.team_labels
      });
      return Labels.sortLabelStrs(ret);
    }

    renderLabelInput() {
      return <Components.LabelInput
        onSubmit={(val) => {
          Actions.Teams.addLabel(this.props.teamId, val);
          this.setState({ labelFilter: null })
          return "";
        }}
        onChange={(val) => {
          this.setState({ labelFilter: val });
        }} />;
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

      if (this.state.labelFilter &&
          ! _.includes(label.toLowerCase(),
                       this.state.labelFilter.toLowerCase())) {
        return null;
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
        editLabel: null,
        rmLabelPrompt: null
      });
    }

    archive(label: string) {
      this.resetState();
      Actions.Teams.rmLabel(this.props.teamId, label);
    }

    promptRmFor(label: string) {
      this.setState({
        editLabel: null,
        rmLabelPrompt: label
      });
    }

    rmLabel(label: string) {
      this.archive(label);
      BatchLabelChange.remove(this.props.teamId, label);
    }

    showEditFor(label: string) {
      this.setState({
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
      var orig = this.state.editLabel.trim();
      if (val && val !== orig) {
        Actions.Teams.renameLabel(this.props.teamId, orig, val);
        BatchLabelChange.rename(this.props.teamId, orig, val);
      }
      this.resetState();
    }

    renderTeamSelector() {
      var teamOptions = _.map(Stores.Teams.all(), (t) => ({
        val: t.teamid,
        display: t.team_name
      }));
      var loginInfo = Login.InfoStore.val();
      var isNylas = loginInfo.platform === "Nylas";
      if (teamOptions.length > 1) {
        return <div className="form-group">
          <label htmlFor={this.getId("team-select")} className="control-label">
            { isNylas ? "Calendar Owner" : "Executive Team" }
          </label>
          <Components.SelectMenu
            id={this.getId("team-select")}
            options={teamOptions}
            onChange={(id) => this.changeTeam(id)}
            selected={this.props.teamId}
          />
        </div>;
      }
    }

    changeTeam(id: string) {
      Route.nav.path("/labels/" + id);
    }

    componentDidUpdate(prevProps: LabelManageProps, prevState: LabelManageState) {
      if (this.state.editLabel &&
          this.state.editLabel !== prevState.editLabel &&
          this._editInput) {
        $(this._editInput).select();
      }
    }

    renderFooter() {
      var dataStatus = Stores.Teams.status(this.props.teamId).match({
        none: () => Model2.DataStatus.FETCH_ERROR,
        some: (d) => d
      });
      var changeStatus = BatchLabelChange.getStatus(this.props.teamId);
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
}

/*
  Label settings for a given team
*/

/// <reference path="./Views.TeamSettings.tsx" />

module Esper.Views {

  export class LabelSettings extends TeamSettings {
    pathFn = Paths.Manage.Team.labels;

    renderMain(team: ApiT.Team) {
      return <div className="panel panel-default">
        <div className="panel-body">
          <LabelManager team={team} />
        </div>
      </div>;
    }
  }


  /* Label manager component used in above view */

  interface Props {
    team: ApiT.Team;
  }

  interface State {
    // Show edit interface or remove prompt for a given label
    editLabel?: string;
    rmLabelPrompt?: string;
    labelFilter?: string;
  }

  class LabelManager extends ReactHelpers.Component<Props, State> {
    _editInput: HTMLInputElement;

    constructor(props: Props) {
      super(props);
      this.state = {};
    }

    render() {
      var labels = this.getLabels();
      return <div>
        { this.renderLabelInput() }
        {
          !labels.length ? null :
          <div className="alert alert-info">
              <i className="fa fa-fw fa-pencil" />{" "}
                { Text.LabelRenameDescription }<br />
              <i className="fa fa-fw fa-archive" />{" "}
                { Text.LabelArchiveDescription }<br />
              <i className="fa fa-fw fa-trash" />{" "}
                { Text.LabelDeleteDescription }
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
      </div>;
    }

    getLabels() {
      return Labels.sortLabelStrs(this.props.team.team_labels);
    }

    renderLabelInput() {
      return <div className="form-group">
        <label htmlFor={this.getId("new-labels")}>
          {Text.FindAddLabels}
        </label>
        <div className="input-group">
          <div className={this.state.labelFilter ? "esper-has-right-icon" : ""}>
            <input type="text"
                   className="form-control"
                   id={this.getId("new-labels")}
                   onKeyDown={this.inputKeydown.bind(this)}
                   onChange={(e) => this.onChange(e)}
                   value={this.state.labelFilter || ""}
                   placeholder="Ex: Q1 Sales Goal"
            />
            {
              this.state.labelFilter ?
              <span className="esper-clear-action esper-right-icon"
                    onClick={() => this.resetState()}>
                <i className="fa fa-fw fa-times" />
              </span> :
              <span />
            }
          </div>
          <span className="input-group-btn">
            <button className="btn btn-default" type="button"
                    onClick={this.addLabel.bind(this)}>
              <i className="fa fa-fw fa-plus" />
            </button>
          </span>
        </div>
      </div>;
    }

    // Catch enter / up / down keys
    inputKeydown(e: KeyboardEvent) {
      var val = (e.target as HTMLInputElement).value;
      if (e.keyCode === 13) {         // Enter
        e.preventDefault();
        this.addLabel();
      } else if (e.keyCode === 27) {  // ESC
        e.preventDefault();
        this.resetState();
      }
    }

    onChange(e: React.FormEvent) {
      var val = (e.target as HTMLInputElement).value;
      this.setState({ labelFilter: val })
    }

    addLabel() {
      var val = this.state.labelFilter;
      if (val) {
        Actions.Teams.addLabel(this.props.team.teamid, val);
        this.resetState();
      }
    }

    renderLabel(label: string) {
      var rmLabel = this.state.rmLabelPrompt &&
                    this.state.rmLabelPrompt.toLowerCase();
      if (label.toLowerCase() === rmLabel) {
        return <div className="list-group-item" key={label}>
          <div className="form-group">
            Are you sure you want to remove the
            {" "}<strong>{label}</strong>{" "}
            {Text.Label.toLowerCase()} from all events? This cannot be undone.
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
        labelFilter: null,
        editLabel: null,
        rmLabelPrompt: null
      });
    }

    archive(label: string) {
      this.resetState();
      Actions.Teams.rmLabel(this.props.team.teamid, label);
    }

    promptRmFor(label: string) {
      this.setState({
        editLabel: null,
        rmLabelPrompt: label
      });
    }

    rmLabel(label: string) {
      this.archive(label);
      Actions.BatchLabels.remove(this.props.team.teamid, label);
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
        Actions.Teams.renameLabel(this.props.team.teamid, orig, val);
        Actions.BatchLabels.rename(this.props.team.teamid, orig, val);
      }
      this.resetState();
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
      if (this.state.editLabel &&
          this.state.editLabel !== prevState.editLabel &&
          this._editInput) {
        $(this._editInput).select();
      }
    }
  }
}






/*
  Abstract class to handle labelling
*/

module Esper.Components {
  /* Label manager component used in above view */

  interface Props {
    getLabelInfos: () => ApiT.LabelInfo[];
    addLabel: (label: Types.LabelBase) => any;
    archiveFn: (label: Types.LabelBase) => any;
    removeLabel: (label: Types.LabelBase) => any;
    renameLabel: (orig: Types.LabelBase, val: Types.LabelBase) => any;
    setLabelColor: (oldInfo: ApiT.LabelInfo, newColor: string) => any;
    addPermission: boolean;
  }

  interface State {
    // Show edit interface or remove prompt for a given label
    editLabel?: ApiT.LabelInfo;
    rmLabelPrompt?: string;
    labelFilter?: string;
  }

  export class LabelManager extends ReactHelpers.Component<Props, State> {
    _editInput: HTMLInputElement;

    constructor(props: Props) {
      super(props);
      this.state = {};
    }

    render() {
      var labels = this.props.getLabelInfos();
      return <div>
        { this.renderLabelInput() }
        {
          labels.length && this.props.addPermission ?
          <div className="alert alert-info">
              <i className="fa fa-fw fa-pencil" />{" "}
                { Text.LabelRenameDescription }<br />
              <i className="fa fa-fw fa-archive" />{" "}
                { Text.LabelArchiveDescription }<br />
              <i className="fa fa-fw fa-trash" />{" "}
                { Text.LabelDeleteDescription }
          </div> :
          null
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

    renderLabelInput() {
      return <div className="form-group">
        <label htmlFor={this.getId("new-labels")}>
          {this.props.addPermission ? Text.FindAddLabels : Text.FindLabels}
        </label>
        <div className={this.props.addPermission ? "input-group" : ""}>
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
          { this.props.addPermission ?
            <span className="input-group-btn">
              <button className="btn btn-default" type="button"
                      onClick={this.addLabel.bind(this)}>
                <i className="fa fa-fw fa-plus" />
              </button>
            </span> :
            <span />
          }
        </div>
      </div>;
    }

    // Catch enter / up / down keys
    inputKeydown(e: KeyboardEvent) {
      var val = (e.target as HTMLInputElement).value;
      if (e.keyCode === 13 && this.props.addPermission) { // Enter
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
        let norm = Labels.getNorm(val);
        this.props.addLabel({
          id: norm,
          displayAs: val,
          color: Colors.getNewColorForLabel()
        });
        this.resetState();
      }
    }

    renderLabel(label: ApiT.LabelInfo) {
      var rmLabel = this.state.rmLabelPrompt &&
                    this.state.rmLabelPrompt.toLowerCase();
      if (label.original.toLowerCase() === rmLabel) {
        return <div className="list-group-item" key={label.original}>
          <div className="form-group">
            Are you sure you want to remove the
            {" "}<strong>{label.original}</strong>{" "}
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
                      this.state.editLabel.original.toLowerCase();
      if (label.original.toLowerCase() === editLabel) {
        return <div className="list-group-item one-line" key={label.original}>
          <div className="form-group">
            <input ref={ (c) => this._editInput = c }
                   onKeyDown={this.editInputKeydown.bind(this)}
                   className="form-control" defaultValue={label.original}/>
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
          ! _.includes(label.original.toLowerCase(),
                       this.state.labelFilter.toLowerCase())) {
        return null;
      }

      return <div className="list-group-item one-line" key={label.original}>
        <i className="fa fa-fw fa-tag" />
        {" "}{label.original}{" "}
        { this.props.addPermission ?
          <span>
            <a className="pull-right text-danger" title="Delete"
               onClick={(e) => this.promptRmFor(label.original)}>
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
            <Dropdown className="pull-right label-color-dropdown">
              <span className="label-color-box dropdown-toggle"
                    style={{background: label.color || "#FFFFFF"}} />
              <ColorGrid className="dropdown-menu color-grid"
                         onClick={this.props.setLabelColor}
                         oldInfo={label}>
              </ColorGrid>
            </Dropdown>
          </span> : null
        }
      </div>;
    }

    resetState() {
      this.setState({
        labelFilter: null,
        editLabel: null,
        rmLabelPrompt: null
      });
    }

    archive(labelInfo: ApiT.LabelInfo) {
      var label = {
        id: labelInfo.normalized,
        displayAs: labelInfo.original,
        color: labelInfo.color
      };
      this.resetState();
      this.props.archiveFn(label);
    }

    promptRmFor(label: string) {
      this.setState({
        editLabel: null,
        rmLabelPrompt: label
      });
    }

    rmLabel(labelInfo: ApiT.LabelInfo) {
      var label = {
        id: labelInfo.normalized,
        displayAs: labelInfo.original,
        color: labelInfo.color
      };
      this.props.removeLabel(label);
    }

    showEditFor(labelInfo: ApiT.LabelInfo) {
      this.setState({
        editLabel: labelInfo,
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
      var orig = this.state.editLabel;
      if (val && val !== orig.original.trim()) {
        this.props.renameLabel({
          id: orig.normalized,
          displayAs: orig.original,
          color: orig.color
        }, {
          id: Labels.getNorm(val),
          displayAs: val,
          color: orig.color
        });
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

  function ColorGrid({className, oldInfo, onClick}: {
    className?: string,
    oldInfo: ApiT.LabelInfo,
    onClick: (oldInfo: ApiT.LabelInfo, newColor: string) => any
  }) {
    return <div className={className}>
      { Colors.presets.map((color) => {
          return <div className={classNames("color-cell", {
                        selected: oldInfo.color == color
                      })} key={color}
                      onClick={(e) => onClick(oldInfo, color)}
                      style={{background: color}}>
          </div>;
        })
      }
    </div>;
  }
}

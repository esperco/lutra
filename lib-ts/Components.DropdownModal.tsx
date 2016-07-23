/*
  A Bootstrap dropdown that also works as a modal on smaller screens.
  This component is incompatible with Bootstrap's dropdown JS, so make sure it
  isn't included in vendor file.

  Usage:

    <Components.DropdownModal>
      <button className="btn btn-default dropdown-toggle" type="button"
              id="dropdownMenu1">
        Dropdown
        <span className="caret"></span>
      </button>
      <ul className="dropdown-menu">
        <li><a>Action</a></li>
        <li><a>Another action</a></li>
        <li><a>Something else here</a></li>
        <li role="separator" className="divider"></li>
        <li><a>Separated link</a></li>
      </ul>
    </Components.DropdownModal>

  First child should be the trigger element. Second child should be the
  dropdown menu or modal. The "dropdown-menu" class will be replaced with the
  "dropdown-modal-menu" class. All other elements are disregarded.
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Components.Modal.tsx" />
/// <reference path="./Components.Dropdown.tsx" />
/// <reference path="./Layout.tsx" />

module Esper.Components {
  export class DropdownModal extends ReactHelpers.Component<{
    children?: JSX.Element[];
    className?: string;
    disabled?: boolean;
    keepOpen?: boolean;
    onOpen?: () => void;
  }, {}> {

    _dropdown: Dropdown;
    _modalId: number;
    _hiddenXs: HTMLElement;

    render() {
      var children = React.Children.toArray(this.props.children);

      var toggleIndex = _.findIndex(children,
        (p) => ReactHelpers.hasClass(p, "dropdown-toggle")
      );
      Log.assert(toggleIndex >= 0, "No dropdown trigger found");
      var originalToggle = children[toggleIndex] as React.ReactElement<any>;

      var menuIndex = _.findIndex(children,
        (p) => ReactHelpers.hasClass(p, "dropdown-menu")
      );
      Log.assert(menuIndex >= 0, "No dropdown menu found");
      var originalMenu = children[menuIndex];

      var modalElm = <Modal showFooter={this.props.keepOpen}>
        <div className="dropdown-modal-menu"
             onClick={() => this.props.keepOpen || this.close()}>
          { originalMenu }
        </div>
      </Modal>;
      if (this._modalId) {
        Layout.updateModal(modalElm, this._modalId);
      }

      var xsChildren = _.clone(children);
      xsChildren[toggleIndex] = React.cloneElement(originalToggle, {
        key: "xs-toggle",
        onClick: () => this._modalId = Layout.renderModal(modalElm)
      });
      xsChildren[menuIndex] = null;

      return <div>
        <Dropdown ref={(c) => this._dropdown = c}
          className={classNames("hidden-xs", "dropdown", this.props.className)}
          keepOpen={this.props.keepOpen}
          onOpen={this.props.onOpen}
          disabled={this.props.disabled}
        >
          { this.props.children }
        </Dropdown>

        <div className={"hidden-sm hidden-md hidden-lg " +
                        (this.props.className || "")}>
          { xsChildren }
          <span /> {/* Extra span so CSS behaves like Dropdown */}
        </div>
      </div>;
    }

    close() {
      if (this._modalId) {
        Layout.closeModal(this._modalId);
      }
      if (this._dropdown) {
        this._dropdown.close();
      }
    }
  }
}

/*
  A Bootstrap dropdown that also works as a modal on smaller screens.
  This component is incompatible with Bootstrap's dropdown JS, so make sure it
  isn't included in vendor file.

  Usage:

    <Components.DropdownModal>
      <button className="btn btn-default dropdown-toggle" type="button"
              id="dropdownMenu1">
        Dropdown
        <span class="caret"></span>
      </button>
      <ul className="dropdown-menu">
        <li><a>Action</a></li>
        <li><a>Another action</a></li>
        <li><a>Something else here</a></li>
        <li role="separator" class="divider"></li>
        <li><a>Separated link</a></li>
      </ul>
    </Components.DropdownModal>

  First child should be the trigger element. Second child should be the
  dropdown menu or modal. The "dropdown-menu" class will be replaced with the
  "dropdown-modal-menu" class. All other elements are disregarded.
*/

/// <reference path="../lib/ReactHelpers.ts" />
/// <reference path="../lib/Components.Modal.tsx" />
/// <reference path="./Components.Dropdown.tsx" />
/// <reference path="./Layout.tsx" />

module Esper.Components {
  export class DropdownModal extends ReactHelpers.Component<{
    children?: JSX.Element[];
    className?: string;
    keepOpen?: boolean;
  }, {}> {

    _dropdown: Dropdown;
    _modal: Modal;
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

      var modalElm = <Modal ref={(c) => this._modal = c}
          showFooter={this.props.keepOpen}>
        <div className="dropdown-modal-menu"
             onClick={() => this.props.keepOpen || this.close()}>
          { originalMenu }
        </div>
      </Modal>;
      if (this._modal && this._modal._mounted) {
        Layout.updateModal(modalElm);
      }

      var xsChildren = _.clone(children);
      xsChildren[toggleIndex] = React.cloneElement(originalToggle, {
        key: "xs-toggle",
        onClick: () => Layout.renderModal(modalElm)
      });
      xsChildren[menuIndex] = null;

      return <div>
        <Dropdown ref={(c) => this._dropdown = c} className={
          "hidden-xs dropdown " + (this.props.className || "")
        } keepOpen={this.props.keepOpen}>
          { this.props.children }
        </Dropdown>

        <div className={"hidden-sm hidden-md hidden-lg " +
                        (this.props.className || "")}>
          { xsChildren }
        </div>
      </div>;
    }

    close() {
      if (this._modal && this._modal._mounted) {
        Layout.closeModal();
      }
      if (this._dropdown) {
        this._dropdown.close();
      }
    }
  }
}
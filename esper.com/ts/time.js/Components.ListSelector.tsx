/*
  Component for selecting (multiple) things in a list. Supports grouping
  by a category, badges, and custom icons.
*/

/// <reference path="../lib/ReactHelpers.ts" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface ListSelectorProps {
    groups: Group[];
    selectedIds: SelectedIds[]; // Id of list choice

    selectOption?: ListSelectOptions;
    selectedIcon?: string;    // Font-awesome icon
    unselectedIcon?: string;  // Font-awesome icon

    // Classes
    listClasses?: string;
    itemClasses?: string;
    headerClasses?: string;
    dividerClasses?: string;
    selectedItemClasses?: string;

    updateFn: (selectedIds: SelectedIds[]) => void;
  }

  export enum ListSelectOptions {
    SINGLE_SELECT,  // Select exactly one item
    MULTI_SELECT,   // Select 0 - many items
    SINGLE_SELECT_PER_GROUP  // Select exactly one item per group
  }

  // Group of choies
  interface Group {
    id: string;
    displayAs?: string|JSX.Element;
    choices: ListChoice[];
  }

  // Single item in list
  interface ListChoice {
    id: string;
    displayAs: string|JSX.Element;
    badgeText?: string;
    badgeColor?: string;
  }

  // Selection -- if using groups, groupIds are included
  interface SelectedIds {
    id: string;
    groupId: string;
  }

  export class ListSelector extends Component<ListSelectorProps, {}>
  {
    render() {
      return <div>
        { _.map(this.props.groups, this.renderGroup.bind(this)) }
      </div>;
    }

    renderGroup(group: Group, count: number) {
      return <div key={group.id}>
        {
          group.displayAs ?
          <div className={ this.props.headerClasses || "esper-subheader"}>
            {group.displayAs}
          </div> : null
        }
        <div className={this.props.listClasses || "list-group"}>{
          _.map(group.choices, (opts) => {
            var selectedIcon = this.props.selectedIcon ||
              (opts.badgeColor ? "fa-check-square" : "fa-check-square-o");
            var unselectedIcon = this.props.unselectedIcon ||
              (opts.badgeColor ? "fa-square" : "fa-square-o");
            var iconStyle = ((): {color?: string} => {
              if (opts.badgeColor) {
                return { color: opts.badgeColor };
              }
              return {};
            })();


            var selected = this.isSelected(group.id, opts.id);

            var badge: JSX.Element;
            if (opts.badgeText) {
              var badgeStyle = (selected && opts.badgeColor) ? {
                background: opts.badgeColor
              } : {};
              badge = <span className="badge" style={badgeStyle}>
                {opts.badgeText}
              </span>;
            }
            var clickHandler = () => {
              this.handleClick(group.id, opts.id, !selected);
            };
            var itemClasses =
              (this.props.itemClasses || "list-group-item one-line") + " " +
              (selected ? this.props.selectedItemClasses || "" : "");

            return <a onClick={clickHandler} key={group.id + " " + opts.id}
              className={itemClasses}>
              {badge}
              <i style={iconStyle} className={"fa fa-fw " +
                (selected ? selectedIcon : unselectedIcon)} />
              {" "}{opts.displayAs}
            </a>
          })
        }</div>
        {
          count + 1 < this.props.groups.length ?
          <div className={this.props.dividerClasses || ""} /> : null
        }
      </div>;
    }

    handleClick(groupId: string, id: string, newChecked: boolean) {
      var opt = this.props.selectOption;
      if (opt === ListSelectOptions.SINGLE_SELECT || _.isUndefined(opt)) {
        this.props.updateFn([{
          groupId: groupId,
          id: id
        }]);
      }

      else {
        var selected = _.clone(this.props.selectedIds);
        if (opt === ListSelectOptions.SINGLE_SELECT_PER_GROUP) {
          _.remove(selected, (s) => s.groupId === groupId);
        }

        else { // Multi-select
          _.remove(selected,
            (s) => s.groupId === groupId && s.id === id
          );
        }

        if (newChecked) {
          selected.push({
            groupId: groupId,
            id: id
          });
        }
        this.props.updateFn(selected);
      }
    }

    isSelected(groupId: string, id: string) {
      return !!_.find(this.props.selectedIds,
        (s) => s.groupId === groupId && s.id === id
      );
    }
  }
}

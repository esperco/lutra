/*
  Component for selecting (multiple) things in a list. Supports grouping
  by a category, badges, and custom icons.
*/

/// <reference path="./ReactHelpers.ts" />
/// <reference path="./Components.Badge.tsx" />

module Esper.Components {
  var Component = ReactHelpers.Component;

  interface ListSelectorBaseProps {
    selectOption?: ListSelectOptions;
    selectedIcon?: string;    // Font-awesome icon
    unselectedIcon?: string;  // Font-awesome icon

    className?: string;
    listClasses?: string;
    itemClasses?: string;
    headerClasses?: string;
    selectedItemClasses?: string;
  }

  interface ListSelectorProps extends ListSelectorBaseProps {
    groups: Group[];
    selectedIds: SelectedIds[]; // Id of list choice
    updateFn: (selectedIds: SelectedIds[]) => void;
  }

  export enum ListSelectOptions {
    SINGLE_SELECT,  // Select exactly one item
    MULTI_SELECT,   // Select 0 - many items
    SINGLE_SELECT_PER_GROUP,  // Select exactly one item per group
    MULTI_SELECT_ONE_GROUP    // Select multiple but only in one group
  }

  // Group of choies
  interface Group {
    id: string;
    displayAs?: string|JSX.Element;
    choices: ListChoice[];
  }

  // Single item in list
  export interface ListChoice {
    id: string;
    displayAs: string|JSX.Element;
    badgeText?: string;
    badgeHoverText?: string;
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
      return <div className={this.props.className}>
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

            var badge = opts.badgeText ? <Components.Badge
              text={opts.badgeText}
              hoverText={opts.badgeHoverText}
              color={selected && opts.badgeColor}
            /> : null;

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

        else if (opt === ListSelectOptions.MULTI_SELECT_ONE_GROUP) {
          _.remove(selected,
            (s) => s.groupId !== groupId || s.id === id
          );
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
        (s) => (s.groupId || "") === groupId && s.id === id
      );
    }
  }


  /* Variant of the above, with no groups */

  interface ListSelectorSimpleProps extends ListSelectorBaseProps {
    choices: ListChoice[];
    selectedIds: string[]; // Subset of chocies

    updateFn: (ids: string[]) => void;
  }

  export function ListSelectorSimple(props: ListSelectorSimpleProps) {
    var selectedIds = _.map(props.selectedIds, (s) => ({
      groupId: "",
      id: s
    }));

    // Ignore groupId here
    var updateFn =
      (ids: SelectedIds[]) => props.updateFn(_.map(ids, (i) => i.id))

    return <ListSelector
      groups={[{
        id: "",
        choices: props.choices
      }]}
      selectedIds={selectedIds}
      updateFn={updateFn}

      selectOption={props.selectOption}
      selectedIcon={props.selectedIcon}
      unselectedIcon={props.unselectedIcon}

      className={props.className}
      listClasses={props.listClasses}
      itemClasses={props.itemClasses}
      headerClasses={props.headerClasses}
      selectedItemClasses={props.selectedItemClasses}
    />;
  }
}

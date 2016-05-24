/*
  Group List page
*/

module Esper.Views {

  export class GroupList extends ReactHelpers.Component<{}, {}> {
    renderWithData() {
      return <Components.SidebarWithToggle>
        <label className="esper-header">
          { Text.TeamExecs }
        </label>
      </Components.SidebarWithToggle>;
    }
  }
}
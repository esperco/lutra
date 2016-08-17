/*
  Group List page
*/

module Esper.Views {

  export class GroupList extends ReactHelpers.Component<{}, {}> {
    renderWithData() {
      return <Components.Sidebar className="esper-shade">
        <label className="esper-header">
          Groups
        </label>
      </Components.Sidebar>;
    }
  }
}

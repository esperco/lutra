/*
  New Group page
*/

module Esper.Views {
  interface Props extends Types.SettingsPageProps {}

  // TODO
  export class NewCustomer extends ReactHelpers.Component<Props, {}> {
    renderWithData() {
      return <Views.Settings {...this.props}>
        New Customer Page
      </Views.Settings>;
    }
  }
}

module Esper.Actions.Personal {
  export function deactivate() {
    Api.deactivate();
    Login.goToLogout("deactivate");
  }
}

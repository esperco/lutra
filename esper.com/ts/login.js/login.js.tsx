/// <reference path="../common/Layout.tsx" />
/// <reference path="../common/Login.Oauth.ts" />
/// <reference path="./Components.Login.tsx" />

module Esper {
  export function init() {
    Layout.render(<div id="esper-login-container">
      <Components.LoginPrompt
        showGoogle={true}
        showExchange={true}
        showNylas={true}>
        <div className="alert alert-info text-center">
          Esper uses data from your calendar and other sources to provide you
          insight into how you spend your time. Please login with your calendar
          provider to continue.
        </div>
      </Components.LoginPrompt>
    </div>);
  }
}

Esper.init();

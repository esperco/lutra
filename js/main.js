function main() {
  route.setup();
  login.initLoginInfo();
  if (!login.data)
    route.nav.login();
}

$(document).ready(main);

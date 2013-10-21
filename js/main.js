function main() {
  log("test -1");
  route.setup();
  log("test 0");
  login.initLoginInfo();
  log("test 1");
  if (!login.data)
    route.login();
}

$(document).ready(main);

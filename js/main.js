function main() {
  login.initLoginInfo();
  route.setup();
  api.getProfile("abc");
}

$(document).ready(main);

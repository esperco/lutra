module Main {

  function main() {
    Svg.init();
    Login.initLoginInfo();
    Route.setup();
    Status.init();
    Pay.init();
    (<any> $("[data-toggle='tooltip']")).tooltip(); // FIXME
  }

  $(document).ready(main);

}

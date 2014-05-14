var email = (function() {
  var mod = {};

  var localpartRegexp = /([^@]*)/;
  var domainRegexp = /[^@]*@([^@]*)/;

  /* "abc.def@example.com" -> "abc.def"
     always returns a string if the input is a string */
  mod.localpart = function(addr) {
    return localpartRegexp.exec(addr)[1];
  };

  /* "abc.def@example.com" -> "example.com"
     returns a string only when the input contains an '@' */
  mod.domain = function(addr) {
    return domainRegexp.exec(addr)[1];
  };

  /* requires a period in the domain but otherwise all standard addresses
     should pass */
  var validationRegexp = /[^@]+@[^@]+\.[^@]+/;
  mod.validate = function(addr) {
    return validationRegexp.test(addr);
  };

  mod.tests = [
    test.expect(null, mod.validate, "ab-cd.eF_gh@example-2.com", true),
    test.expect(null, mod.validate, "a@a.a", true),
    test.expect(null, mod.validate, "A@a.a", true),
    test.expect(null, mod.validate, "@a.a", false),
    test.expect(null, mod.validate, "a@a.", false),
    test.expect(null, mod.validate, "a@a", false),
    test.expect(null, mod.validate, "a", false),
    test.expect(null, mod.validate, "", false),
    test.expect(null, mod.validate, "a+b@c.com", true)
  ];

  return mod;
}());

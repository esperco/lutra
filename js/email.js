var email = (function() {
  var mod = {};

  var localpartRegex = /([^@]*)/;
  var domainRegex = /[^@]*@([^]*)/;

  /* "abc.def@example.com" -> "abc.def"
     always returns a string if the input is a string */
  mod.localpart = function(addr) {
    return localpartRegex.exec(addr)[1];
  };

  /* "abc.def@example.com" -> "example.com"
     returns a string only when the input contains an '@' */
  mod.domain = function(addr) {
    return domainRegex.exec(addr)[1];
  };

  return mod;
}());

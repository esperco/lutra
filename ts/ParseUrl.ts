/*
  URL parsing
*/

module Esper.ParseUrl {

  export function parse(url) {
    var x = document.createElement('a');
    x.href = url;
    return {
      /* http://example.com:3000/path/to?q=test#foo */
      scheme: x.protocol.replace(/:$/, ""),      // "http"
      host_port: x.host,                         // "example.com:3000"
      host: x.hostname,                          // "example.com"
      port: x.port,                              // "3000"
      path: "/" + x.pathname.replace(/^\//, ""), // "/path/to"
      query: x.search.replace(/^\?/, ""),        // "q=test"
      fragment: x.hash.replace(/^#/, "")         // "foo"
    };
  };

  function appendIfNotEmpty(s1, separator, s2) {
    if (s2.length > 0)
      return s1 + separator + s2;
    else
      return s1;
  }

  export function toRelative(x) {
    var s = x.path;
    s = appendIfNotEmpty(s, "?", x.query);
    s = appendIfNotEmpty(s, "#", x.fragment);
    return s;
  };

}

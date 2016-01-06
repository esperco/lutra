/*
 * Replace all SVG images with inline SVG
 */

module Esper.Svg {

  var access = {
    get: function(k) {
      return $.ajax({
        url: k,
        type: "GET",
        dataType: "text"
      });
    }
  };

  var svgCache = Cache.create(300, 30, access);

  export function loadImg(img, url) {
    return svgCache.getCached(url)
      .then(function(data) {
        if (!data)
          Log.d("bad result for svgCache.getCached("+ url +"):", data);
        var svgRoot = $(data)
          .attr("id", img.attr("id"))
          .attr("src", url)
          .attr("class", img.attr("class"));
        img.replaceWith(svgRoot);
        return svgRoot;
      });
  };

  export function init() {
    $('img.svg').each(function(){
      var elt = $(this);
      var url = elt.attr('src');
      loadImg(elt, url);
    });
  };

}

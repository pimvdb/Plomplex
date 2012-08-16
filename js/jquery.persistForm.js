(function($) {
  var prefix = "persistForm\xff";

  $.fn.persistForm = function(action) {
    return this.each(function() {
      $(this).find(":input").each(function() {
        var dataKey = $(this).data("key");
        if(!dataKey) {
          return;
        }
        var key = prefix + dataKey;

        if(action === "save") {
          var value = $(this).xVal();
          localStorage[key] = JSON.stringify(value);
        } else if(action === "load" && key in localStorage) {
          try {
            var value = JSON.parse(localStorage[key]);
            $(this).xVal(value);
          } catch(e) {}
        }
      });
    });
  };
})(jQuery);

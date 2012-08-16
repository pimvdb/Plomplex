(function($) {
  var zeroPad = function(number) {
    var str = String(number);
    return str.length === 1 ? "0" + str : str;
  };

  var numberGet = function(elem) {
    return +elem.value;
  };

  var dateGet = function(elem) {
    return new Date(elem.value);
  };

  var dateSet = function(elem, value) {
    var date = new Date(value);

    return elem.value = [
      date.getFullYear(),
      zeroPad(date.getMonth() + 1),
      zeroPad(date.getDate())
    ].join("-");
  };

  var checkedGet = function(elem) {
    return elem.checked;
  };

  var checkedSet = function(elem, value) {
    if(typeof value === "boolean") {
      elem.checked = value;
      return true;
    }
  };

  var rgb = ["r", "g", "b"];
  var forEachColor = function(func) {
    rgb.forEach(func);
  };

  $.fn.extend({
    xVal: function(val) {
      if(arguments.length === 0) {
        var elem = this[0];
        if(!elem) {
          return undefined;
        }
        var hook = hooks[elem.type] || hooks[elem.nodeName.toLowerCase()];
        return hook && hook.get ? hook.get(elem) : $.fn.val.apply(this, arguments);
      }

      return this.each(function() {
        var hook = hooks[$(this).attr("type")] || hooks[this.nodeName.toLowerCase()];
        if(!hook || !hook.set || !hook.set(this, val)) {
          $(this).val(val);
        }
      });
    },

    radioValue: function(name, value) {
      if(arguments.length === 1) {
        return this.eq(0).find(":radio:checked").filter(function() {
          return this.name === name;
        }).prop("value");
      }

      return this.each(function() {
        $(this).find(":radio").filter(function() {
          return this.name === name && this.value === value;
        }).prop("checked", true);
      });
    }
  });

  $.attrFn.xVal = true;

  var hooks = {
    checkbox: {
      get: checkedGet,
      set: checkedSet
    },

    radio: {
      get: checkedGet,
      set: checkedSet
    },

    progress: {
      get: numberGet,
      set: function(elem, value) {
        if(value === null) {
          return $(elem).removeAttr("value");
        }
      }
    },

    number: {
      get: numberGet
    },

    range: {
      get: numberGet
    },

    date: {
      get: dateGet,
      set: dateSet
    },

    color: {
      get: function(elem) {
        var obj = {};
        forEachColor(function(color, i) {
          var start = i * 2 + 1;
          obj[color] = parseInt(elem.value.slice(start, start + 2), 16);
        });
        return obj;
      },
      set: function(elem, value) {
        if(typeof value === "object") {
          var str = "#";
          forEachColor(function(color) {
            str += zeroPad(value[color].toString(16));
          });
          return elem.value = str;
        }
      }
    }
  };
})(jQuery);

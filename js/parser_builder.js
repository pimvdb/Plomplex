self.build = function(left, tail, op) {
  for(var i = 0; i < tail.length; i++) {
    left = {
      operator: op || tail[i][0] || "*",
      left: left,
      right: tail[i][2]
    };
  }

  return left;
};

var constants = (function(constants) {
  for(var key in constants) {
    constants[key] = "newComplex(%, 0)".printf(constants[key]);
  }
  return constants;
})({
  e:  e,
  pi: pi
});

parser.parse = (function(parse) {
  var recurse = function(item, funcs) {
    if("operator" in item) {
      var funcName = item.operator;
      var leftParam = recurse(item.left, funcs);
      var rightParam = recurse(item.right, funcs);

      return "_['%'](%, %)".printf(funcName, leftParam, rightParam);

    } else if("func" in item) {
      var name = item.func;
      var params = item.params.map(function(v) {
        return recurse(v, funcs);
      });

      return "_['%'](%)".printf(realUnaries[name] || name, params);

    } else if("real" in item) {
      return "newComplex(%, 0)".printf(item.real);

    } else if("variable" in item) {
      return item.variable;

    } else if("constant" in item) {
      return constants[item.constant];

    } else if("imaginary" in item) {
      return "newComplex(0, 1)";

    } else if("loop" in item) {
      item = item.loop;
      var key = Math.random();
      funcs[key] = makeFunction("z", item.variable.variable,
                     recurse(item.func, funcs));

      var from = makeFunction(recurse(item.from, funcs))();
      var to = makeFunction(recurse(item.to, funcs))();

      return "_['%'](z, %, %, %)".printf(item.type, key, from.re, to.re);

    }

    throw "Unreachable code reached.";
  };

  return function(str) {
    var funcs = {};
    var res = recurse(parse(str), funcs);

    return {
      str: res,
      funcs: funcs
    };
  };
})(parser.parse);

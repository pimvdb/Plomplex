(function() {
  var sin   = Math.sin;
  var cos   = Math.cos;
  var tan   = Math.tan;
  var atan  = Math.atan;
  var atan2 = Math.atan2;
  var asin  = Math.asin;
  var exp   = Math.exp;
  var ln    = Math.log;
  var sqrt  = Math.sqrt;
  var sinh  = function(x) { return (exp(x) - exp(-x)) / 2; };
  var cosh  = function(x) { return (exp(x) + exp(-x)) / 2; };
  var fact  = function(n) {
    var r = n;
    while(--n > 0) r *= n;
    return r;
  };

  self._ = {
    "+": function(z, p) {
      return newComplex(z.re + p.re,
                        z.im + p.im);
    },

    "-": function(z, p) {
      return newComplex(z.re - p.re,
                        z.im - p.im);
    },

    "*": function(z, p) {
      var a = z.re,  b = z.im;
      var c = p.re,  d = p.im;

      return newComplex(a * c - b * d,
                        b * c + a * d);
    },

    "/": function(z, p) {
      var a = z.re,  b = z.im;
      var c = p.re,  d = p.im;
      var n = c * c + d * d;

      return newComplex((a * c + b * d) / n,
                        (b * c - a * d) / n);
    },

    "^": function(z, p, branch) {
      if(z.re === 0 && z.im === 0) {
        return newComplex(0, 0);
      }

      var r = _["*"](p, _.ln(z, branch)),
          s = exp(r.re);

      return newComplex(s * cos(r.im),
                        s * sin(r.im));
    },

    sqrt: function(z, branch) {
      return _["^"](z, half, branch);
    },

    root: function(n, z, branch) {
      return _["^"](z, _["/"](one, n), branch);
    },

    // * atan with custom correction is much faster than atan2
    // * normalize -0
    "arg_-pi_pi": function(z) {
      var phi = atan(z.im / (z.re === 0 ? 0 : z.re));
      return z.re >= 0
               ? phi
               : z.im >= 0
                   ? phi + pi
                   : phi - pi;
    },

    "arg_0_2pi": function(z) {
      var phi = atan(z.im / (z.re === 0 ? 0 : z.re));
      return z.re >= 0
               ? z.im >= 0
                   ? phi
                   : phi + pi2
               : phi + pi;
    },

    "|": function(z) {
      return sqrt(z.re * z.re + z.im * z.im);
    },

    ln: function(z, branch) {
      var arg = _["arg_-pi_pi"](z) + pi2 * (branch ? branch.re : 0);
      var modulus = _["|"](z);

      return newComplex(ln(modulus), arg);
    },

    sin: function(z) {
      var a = z.re,  b = z.im;

      return newComplex(sin(a) * cosh(b),
                        cos(a) * sinh(b));
    },

    cos: function(z) {
      var a = z.re,  b = z.im;

      return newComplex( cos(a) * cosh(b),
                        -sin(a) * sinh(b));
    },

    sinh: function(z) {
      var a = z.re,  b = z.im;

      return newComplex(sinh(a) * cos(b),
                        cosh(a) * sin(b));
    },

    cosh: function(z) {
      var a = z.re,  b = z.im;

      return newComplex(cosh(a) * cos(b),
                        sinh(a) * sin(b));
    },

    floor: function(z) {
      return newComplex(Math.floor(z.re), 0);
    },

    ceil: function(z) {
      return newComplex(Math.ceil(z.re), 0);
    },

    round: function(z) {
      return newComplex(Math.round(z.re), 0);
    },

    conj: function(z) {
      return newComplex(z.re, -z.im);
    },

    negate: function(z) {
      return newComplex(-z.re, -z.im);
    },

    "if": function(x, a, b) { return x ? a : b; },
    "!":  function(x) { return !x; },
    "&&": function(a, b) { return a && b; },
    "||": function(a, b) { return a || b; },
    "<":  function(a, b) { return a.re <   b.re; },
    ">":  function(a, b) { return a.re >   b.re; },
    "<=": function(a, b) { return a.re <=  b.re; },
    ">=": function(a, b) { return a.re >=  b.re; },
    "==": function(a, b) { return a.re === b.re; },
    "!=": function(a, b) { return a.re !== b.re; }
  };

  var sumProduct = {
    sum: {
      func: _["+"],
      initial: newComplex(0, 0)
    },
    product: {
      func: _["*"],
      initial: newComplex(1, 0)
    }
  };

  Object.keys(sumProduct).forEach(function(type) {
    var func = sumProduct[type].func;
    var initial = sumProduct[type].initial;

    _[type] = function(z, key, a, b) {
      var f = self._funcs[key];
      var res = initial;

      for(var i = a; i <= b; i++) {
        res = func(res, f(z, newComplex(i, 0)));
      }

      return res;
    };
  });

  var realAsComplex = {
    arg: _["arg_-pi_pi"],
    "|": _["|"],
    re: function(z) { return z.re; },
    im: function(z) { return z.im; },
    atan2: function(y, x) { return atan2(y.re, x.re); },
    fact: function(z) { return fact(z.re); }
  };

  self.realUnaries = {};

  Object.keys(realAsComplex).forEach(function(key) {
    var func = realAsComplex[key];
    realUnaries[key] = key + "C";

    _[key + "C"] = function() {
      return newComplex(func.apply(this, arguments), 0);
    };
  });

  var shortcuts = {
    tan:   "sin(z) / cos(z)",

    asin:  "-i * ln(i*z + sqrt(1 - z^2))",
    acos:  "pi/2 - asin(z)",
    atan:  "0.5i * ln((1 - i*z) / (1 + i*z))",

    csc:   "1 / sin(z)",
    sec:   "1 / cos(z)",
    cot:   "cos(z) / sin(z)",

    acsc:  "asin(1/z)",
    asec:  "acos(1/z)",
    acot:  "atan(1/z)",

    sinh:  "-i * sin(i*z)",
    cosh:  "cos(i*z)",
    tanh:  "sinh(z) / cosh(z)",

    asinh: "ln(z + sqrt(z^2 + 1))",
    acosh: "ln(z + sqrt(z+1) * sqrt(z-1))",
    atanh: "0.5(ln(1+z) - ln(1-z))",

    csch:  "1 / sinh(z)",
    sech:  "1 / cosh(z)",
    coth:  "cosh(z) / sinh(z)",

    acsch: "asinh(1/z)",
    asech: "acosh(1/z)",
    acoth: "atanh(1/z)"
  };

  for(var key in shortcuts) {
    _[key] = makeFunction("z", "n", parser.parse(shortcuts[key]).str);
  }

  var synonyms = {
    arcsin:  "asin",
    arccos:  "acos",
    arctan:  "atan",
    arcsec:  "asec",
    arccsc:  "acsc",
    arccot:  "acot",
    arcsinh: "asinh",
    arccosh: "acosh",
    arctanh: "atanh",
    arcsech: "asech",
    arccsch: "acsch",
    arccoth: "acoth"
  };

  for(var key in synonyms) {
    _[key] = _[synonyms[key]];
  }

                         // |z|, arg(z)
  newComplex.fromPolar = function(r, p) {
    return newComplex(r * cos(p), r * sin(p));
  };

})();

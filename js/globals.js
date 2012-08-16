self.pi   = Math.PI;
self.e    = Math.E;
self.pi2  = pi * 2;
self.piD2 = pi / 2;
self.piD3 = pi / 3;

self.newComplex = function(re, im) {
  return {
    re: re,
    im: im
  };
};

self.zero = newComplex(0, 0);
self.half = newComplex(0.5, 0);
self.one = newComplex(1, 0);

self.makeFunction = function() {
  var last = arguments[arguments.length - 1];
  arguments[arguments.length - 1] = "return (%);".printf(last);
  Array.prototype.unshift.call(arguments, null);
  return new (Function.prototype.bind.apply(Function, arguments));
};

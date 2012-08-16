Object.defineProperty(String.prototype, "printf", {
  enumerable: false,
  writable: false,
  configurable: false,
  value: function() {
    var args = arguments;
    var i = 0;
    return this.replace(/%/g, function() {
      return args[i++];
    });
  }
});

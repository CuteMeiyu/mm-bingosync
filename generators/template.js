(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD环境
        define([], factory);
    } else if (typeof module === 'object' && typeof exports !== 'undefined') {
        // CommonJS环境
        module.exports = factory();
    } else {
        // 浏览器全局环境
        root.RankedGenerator = factory();
    }
}(this, function() {
    var Generator = {};
    return Generator;
}));
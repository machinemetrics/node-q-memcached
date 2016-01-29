var Memcached = require('memcached'),
    Q = require('q');


module.exports = function (options) {
  if(!options.hosts) throw new Error('Must specify hosts. Try new Memcached({ hosts: [\'host1\', \'host2\'] });');
  
  var api = {},
  mc = api.memcached = new Memcached(options.hosts, options.config);

  mc.on('failure', function (details) {
    var msg = details.server + ' went down due to: ' + details.messages.join('');
    throw new Error(msg);
  });

  ['flush'].forEach(function(m) {
    api[m] = function() {
      var deferred = Q.defer();
      mc[m](deferred.makeNodeResolver());
      return deferred.promise;
    };
  });

  ['set', 'add', 'replace'].forEach(function (m) {
    api[m] = function (key, value, expire) {
      if (typeof expire !== 'number') {
        expire = 0;
      }
      var deferred = Q.defer();
      mc[m](key, value, expire, deferred.makeNodeResolver());
      return deferred.promise;
    };
  });

  ['append', 'prepend', 'incr', 'decr'].forEach(function (m) {
    api[m] = function (key, value) {
      var deferred = Q.defer();
      mc[m](key, value, deferred.makeNodeResolver());
      return deferred.promise;
    };
  });

  ['get', 'gets', 'delete'].forEach(function (m) {
    api[m] = function (key) {
      var deferred = Q.defer();
      mc[m](key, deferred.makeNodeResolver());
      return deferred.promise;
    };
  });

  module.exports = function () { return api; };
  return api;
};

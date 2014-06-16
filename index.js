'use strict';

var Memcached = require('memcached'),
    q = require('q');

function deferFactory(options) {
    var logger = options.logger,
        deferred = q.defer();
    return {
        promise: deferred.promise,
        callback: function (err, data) {
            if (err) {
                logger.error(err);
            }
            if (data) {
                deferred.resolve(data);
            } else {
                deferred.reject();
            }
        }
    };
}

module.exports = function (options) {
    options = options || {};
    options.logger = options.logger || console;

    var hosts = options.hosts,
        logger = options.logger,
        api = {},
        mc = api.memcached = new Memcached(hosts, options);

    mc.on('failure', function (details) {
        logger.error(details.server + ' went down due to: ' +
            details.messages.join(''));
    });

    ['set', 'add', 'replace'].forEach(function (m) {
        api[m] = function (key, value, expire) {
            if (typeof expire !== 'number') {
                expire = 0;
            }
            var deferred = deferFactory({logger: logger});
            mc[m](key, value, expire, deferred.callback);
            return deferred.promise;
        };
    });

    ['append', 'prepend', 'incr', 'decr'].forEach(function (m) {
        api[m] = function (key, value) {
            var deferred = deferFactory({logger: logger});
            mc[m](key, value, deferred.callback);
            return deferred.promise;
        };
    });

    ['get', 'gets', 'delete'].forEach(function (m) {
        api[m] = function (key) {
            var deferred = deferFactory({logger: logger});
            mc[m](key, deferred.callback);
            return deferred.promise;
        };
    });

    module.exports = function () { return api; };
    return api;
};
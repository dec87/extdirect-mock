var ExtDirectMock = function() {
    var debug = null;
    var fakeServer = null;
    var mockUrl = /mock\-direct/;
    return {
        init: function(config) {
            debug = !!config.debug;
            fakeServer = sinon.fakeServer.create({
                autoRespond: true
            });
            fakeServer.xhr.useFilters = true;
            fakeServer.xhr.addFilter(function (method, url) {
            	return !url.match(mockUrl);
            });
            fakeServer.respondWith('POST', mockUrl, function (request) {
                var params = JSON.parse(request.requestBody);
                var genereResultFunction = config.responseData[params.action][params.method] || function() {};
                var result = genereResultFunction.apply(this, params.data || []);

                if(debug) {
                    console.log('EXT.DIRECT REQUEST: ', params);
                    console.log('EXT.DIRECT RESPONSE: ', result);
                }

                request.respond(200, {
                    'Content-Type': 'application/json'
                }, JSON.stringify({
                    type: 'rpc',
                    tid: params.tid,
                    action: params.action,
                    method: params.method,
                    result: result

                }));
            });

            var actions = {};
            for(var action in config.responseData) {
                for(var method in config.responseData[action]) {
                    var len = (config.responseData[action][method]).length;
                    var methodConfig = {
                        name: method,
                        len: len
                    }
                    if(actions.hasOwnProperty(action)) {
                        actions[action].push(methodConfig);
                    } else {
                        actions[action] = [methodConfig];
                    }

                }
            }

            Ext.direct.Manager.addProvider({
                type: 'remoting',
                url: '/mock-direct',
                actions: actions,
                timeout: 1000,
                enableBuffer: false,
                namespace: config.namespace || "Mock.api"

            });
        },
        restore: function() {
            fakeServer.restore();
        }
    }
}

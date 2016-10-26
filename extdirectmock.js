var ExtDirectMock = function() {
    var debug = null;
    var fakeServer = null;
    var mockUrl = /mock\-direct/;
    var filteredUrlArray = [];
    return {
        init: function(config) {
            debug = !!config.debug;
            fakeServer = sinon.fakeServer.create({
                autoRespond: true
            });
            fakeServer.xhr.useFilters = true;
            fakeServer.xhr.addFilter(function (method, url) {
                return !(filteredUrlArray.filter(function(filteredUrl) {
                    return url.match(filteredUrl) !== null;
                }).length > 0 || url.match(mockUrl) !== null);
            });
            fakeServer.respondWith('POST', mockUrl, function (request) {
                var params = JSON.parse(request.requestBody);
                var genereResultFunction = config.responseData[params.action][params.method] || function() {};
                var result = genereResultFunction.apply(this, params.data || []);
                var response = {
                    tid: params.tid,
                    action: params.action,
                    method: params.method,
		    type: 'rpc'
                }

		if(typeof result.type !== 'undefined') {
		    response.type =  result.type;
		    response.message = result.message || '';
		    response.where = result.where || '';
		
		    delete result.type;
		    delete result.message;
		    delete result.where;
		}
		
		response.result = result;
		
		if(debug) {
                    console.log('EXT.DIRECT REQUEST: ', params);
                    console.log('EXT.DIRECT RESPONSE: ', response);
                }

                request.respond(200, {
                    'Content-Type': 'application/json'
                }, JSON.stringify(response));
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
        },
        respondWith: function() {
            if(arguments.length === 2) {
                url = arguments[0];
            }
            if(arguments.length === 3) {
                url = arguments[1];
            }
            filteredUrlArray.push(url);
            fakeServer.respondWith.apply(fakeServer, arguments);
        }
    }
}

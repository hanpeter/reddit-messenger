App.service('StorageService', ['$q', function ($q) {
        var isLoaded = false,
            config = {
                refreshInterval: 30,
                checkInterval: 5,
                messageCount: 100,
                winWidth: 800,
                winHeight: 600
            }

        _.extend(this, {
            loadConfigs: function () {
                var deferred = $q.defer();

                if (isLoaded) {
                    deferred.resolve(config);
                }
                else {
                    chrome.storage.sync.get(_.keys(config), function (data) {
                        if (chrome.runtime.lastError) {
                            deferred.reject(chrome.runtime.lastError);
                        }
                        else {
                            _.extend(config, data);
                            isLoaded = true;
                            deferred.resolve(config);
                        }
                    });
                }

                return deferred.promise;
            },
            saveConfigs: function (newConfig) {
                var deferred = $q.defer();

                _.extend(config, newConfig);
                chrome.storage.sync.set(config, function () {
                    if (chrome.runtime.lastError) {
                        deferred.reject(chrome.runtime.lastError);
                    }
                    else {
                        isLoaded = false;
                        deferred.resolve.apply(deferred, arguments);
                    }
                });

                return deferred.promise;
            },
            clearConfigs: function () {
                var deferred = $q.defer();

                chrome.storage.sync.clear(function () {
                    if (chrome.runtime.lastError) {
                        deferred.reject(chrome.runtime.lastError);
                    }
                    else {
                        isLoaded = false;
                        deferred.resolve.apply(deferred, arguments);
                    }
                });

                return deferred.promise;
            }
        });
    }]);
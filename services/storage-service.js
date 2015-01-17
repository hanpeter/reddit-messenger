App.service('StorageService', function () {
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
                var promise = $.Deferred();

                if (isLoaded) {
                    promise.resolve(config);
                }
                else {
                    chrome.storage.sync.get(_.keys(config), function (data) {
                        if (chrome.runtime.lastError) {
                            promise.reject(chrome.runtime.lastError);
                        }
                        else {
                            _.extend(config, data);
                            isLoaded = true;
                            promise.resolve(config);
                        }
                    });
                }

                return promise;
            },
            saveConfigs: function (newConfig) {
                var promise = $.Deferred();

                _.extend(config, newConfig);
                chrome.storage.sync.set(config, function () {
                    if (chrome.runtime.lastError) {
                        promise.reject(chrome.runtime.lastError);
                    }
                    else {
                        isLoaded = false;
                        promise.resolve.apply(promise, arguments);
                    }
                });

                return promise;
            },
            clearConfigs: function () {
                var promise = $.Deferred();

                chrome.storage.sync.clear(function () {
                    if (chrome.runtime.lastError) {
                        promise.reject(chrome.runtime.lastError);
                    }
                    else {
                        isLoaded = false;
                        promise.resolve.apply(promise, arguments);
                    }
                });

                return promise;
            }
        });
    });
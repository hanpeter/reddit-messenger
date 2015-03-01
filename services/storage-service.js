App.service('StorageService', ['$q', function ($q) {
        var config = {
                option: {
                    unread: {
                        isEnabled: true,
                        interval: 5
                    },
                    refresh: {
                        isEnabled: true,
                        interval: 30,
                        messageCount: 100
                    }
                },
                winWidth: 800,
                winHeight: 600
            };
        var loadingDeferred = null;

        _.extend(this, {
            loadConfigs: function () {
                if (!loadingDeferred) {
                    loadingDeferred = $q.defer();

                    chrome.storage.sync.get(_.keys(config), function (data) {
                        console.log(data);
                        if (chrome.runtime.lastError) {
                            loadingDeferred.reject(chrome.runtime.lastError);
                            loadingDeferred = null;
                        }
                        else {
                            _.extend(config, data);

                            // Handle old style config
                            if (!!data.refreshInterval) {
                                config.option.refresh.isEnabled = data.refreshInterval > 0;
                                config.option.refresh.interval = data.refreshInterval || 30;
                                delete config.refreshInterval;
                            }
                            if (!!data.messageCount) {
                                config.option.refresh.messageCount = data.messageCount || 100;
                                delete config.messageCount;
                            }
                            if (!!data.checkInterval) {
                                config.option.unread.isEnabled = data.checkInterval > 0;
                                config.option.unread.interval = data.checkInterval || 5;
                                delete config.checkInterval;
                            }

                            loadingDeferred.resolve(config);
                        }
                    });
                }

                return loadingDeferred.promise;
            },
            saveConfigs: function (newConfig) {
                var deferred = $q.defer();

                _.extend(config, newConfig);
                chrome.storage.sync.set(config, function () {
                    if (chrome.runtime.lastError) {
                        deferred.reject(chrome.runtime.lastError);
                    }
                    else {
                        loadingDeferred = null;
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
                        loadingDeferred = null;
                        deferred.resolve.apply(deferred, arguments);
                    }
                });

                return deferred.promise;
            }
        });
    }]);
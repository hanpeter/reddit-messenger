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
                    },
                    notification: {
                        isContinuous: true,
                        interval: 15,
                        snooze: 300
                    }
                },
                winWidth: 800,
                winHeight: 600
            };
        var loadingDeferred = null;

        _.extend(this, {
            loadConfigs: function () {
                var deferred = $q.defer();

                chrome.storage.sync.get(_.keys(config), function (data) {
                    if (chrome.runtime.lastError) {
                        deferred.reject(chrome.runtime.lastError);
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

                        deferred.resolve(config);
                    }
                });

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
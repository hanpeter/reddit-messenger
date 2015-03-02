App.service('NotificationService', ['$timeout', '$q', '$sce', 'StorageService', function ($timeout, $q, $sce, StorageService) {
    var me = this;
    var notificationIDs = [];
    var displayedMessages = [];
    var notificationRefreshTime = moment();
    var notificationTemplate = {
            type: 'basic',
            iconUrl: '/assets/icon_128.png',
            isClickable: true
        };
    var notificationAudio = new Audio('/assets/notification.mp3');

    chrome.notifications.onClicked.addListener(function (nID) {
        StorageService.loadConfigs()
            .then(function (config) {
                notificationRefreshTime = moment().add(config.option.notification.snooze, 's');
            });
    });

    function createNotification(msg) {
        var deferred = $q.defer();
        var config = _.extend(notificationTemplate, {
                title: 'Unread message from ' + msg.author,
                message: msg.bodyText
            });

        chrome.notifications.create(msg.id, config, function (notificationID) {
            deferred.resolve(notificationID);
        });

        return deferred.promise;
    }

    function updateNotification(msg) {
        var promise = $q.when();

        if (notificationIDs.indexOf(msg.id) >= 0) {
            promise = promise.then(function () {
                return me.clear(msg.id);
            });
        }

        return promise.then(function () {
            return createNotification(msg);
        });
    }

    function timeout() {
        var deferred = $q.defer();

        $timeout(function () {
            deferred.resolve();
        });

        return deferred.promise;
    }

    _.extend(me, {
        clear: function (notificationID) {
            var deferred = $q.defer();

            if (notificationIDs.indexOf(notificationID) >= 0) {
                chrome.notifications.clear(notificationID, function (wasCleared) {
                    if (wasCleared) {
                        deferred.resolve();

                        var index = notificationIDs.indexOf(notificationID);
                        notificationIDs.splice(index, 1);
                    }
                    else {
                        deferred.reject();
                    }
                });
            }
            else {
                deferred.resolve();
            }

            return deferred.promise;
        },
        update: function (msgs) {
            if (moment().diff(notificationRefreshTime, 'seconds') >= 0) {
                timeout()
                    .then(StorageService.loadConfigs)
                    .then(function (c) {
                        var newMsgs = _.filter(msgs, function (msg) { return displayedMessages.indexOf(msg.id) < 0; });

                        $q.all(
                            _.map(newMsgs, function (msg) { return updateNotification(msg); })
                        ).then(function (ids) {
                            if (ids.length > 0) {
                                notificationAudio.play();

                                if (c.option.notification.isContinuous) {
                                    notificationRefreshTime = moment().add(c.option.notification.interval, 's');
                                }
                            }

                            notificationIDs = _.uniq(notificationIDs.concat(ids));
                        });

                        if (!c.option.notification.isContinuous) {
                            displayedMessages = _.pluck(msgs, 'id');
                        }
                    });
            }
        }
    });
}]);
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

    function clearNotificaton(notificationID) {
        var deferred = $q.defer();

        chrome.notifications.clear(notificationID, function (wasCleared) {
            if (wasCleared) {
                deferred.resolve();
            }
            else {
                deferred.reject();
            }
        });

        return deferred.promise;
    }

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
                return clearNotificaton(msg.id);
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
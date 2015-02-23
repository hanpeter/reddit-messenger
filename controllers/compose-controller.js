App.controller('ComposeController', ['$scope', '$q', 'RedditService', 'ThreadFactoryService', function ($scope, $q, RedditService, ThreadFactoryService) {
    function resetCaptcha() {
        $scope.captchaSrc = null;
        return RedditService.getCaptcha().then(function (data) {
            var deferred = $q.defer();

            $scope.captchaIden = data.iden;
            $scope.captchaSrc = data.imgSrc;

            deferred.resolve();

            return deferred.promise;
        });
    }

    function reset() {
        $scope.to = '';
        $scope.subject = '';
        $scope.message = '';
        $scope.captcha = '';
        $scope.hasCaptchaError = false;

        resetCaptcha().then(function () {
            $scope.isSending = false;
        });
    }

    _.extend($scope, {
        to: '',
        subject: '',
        message: '',
        captchaSrc: null,
        captcha: '',
        captchaIden: null,
        isSending: false,
        hasCaptchaError: false,
        compose: function () {
            $scope.isSending = true;

            if (!to || !subject || !message || !captcha) {
                $scope.isSending = false;
                return;
            }

            var config = {
                captcha: $scope.captcha,
                iden: $scope.captchaIden,
                subject: $scope.subject,
                text: $scope.message,
                to: $scope.to
            };
            RedditService.postNewMessage(config)
                .then(ThreadFactoryService.updateThreads(),
                function (postData) {
                    return RedditService.getCaptcha(postData.iden).then(function (captchaData) {
                        $scope.captchaIden = captchaData.iden;
                        $scope.captchaSrc = captchaData.imgSrc;
                        $scope.captcha = '';

                        $scope.isSending = false;
                        $scope.hasCaptchaError = true;

                        return $q.reject();
                    });
                }).
                then(reset);
        }
    });

    $scope.$watch('isComposing', function (value) {
        if (!value) {
            return;
        }

        reset();
    });
}]);
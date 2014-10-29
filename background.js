chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('index.html', {
        innerBounds: {
            width: 800,
            height: 500
        },
        frame: {
            type: 'chrome'
        }
    });
});
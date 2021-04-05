chrome.browserAction.onClicked.addListener(() => chrome.tabs.create({
  url: 'data/popup/index.html'
}));

const check = () => navigator.permissions.query({
  name: 'microphone'
}).then(r => {
  if (r.state === 'granted') {
    chrome.storage.local.get({
      mode: 'popup'
    }, prefs => {
      chrome.browserAction.setPopup({
        popup: prefs.mode === 'popup' ? 'data/popup/index.html?mode=popup' : ''
      });
    });
  }
});
chrome.runtime.onStartup.addListener(check);
chrome.runtime.onInstalled.addListener(check);
chrome.runtime.onMessage.addListener(request => {
  if (request.method === 'check') {
    check();
  }
});
chrome.storage.onChanged.addListener(prefs => {
  if (prefs.mode) {
    check();
  }
});

{
  const once = () => chrome.storage.local.get({
    mode: 'popup'
  }, prefs => {
    chrome.contextMenus.create({
      title: 'Open in Popup',
      id: 'popup',
      contexts: ['browser_action'],
      type: 'radio',
      checked: prefs.mode === 'popup'
    });
    chrome.contextMenus.create({
      title: 'Open in Tab',
      id: 'tab',
      contexts: ['browser_action'],
      type: 'radio',
      checked: prefs.mode === 'tab'
    });
  });
  chrome.runtime.onStartup.addListener(once);
  chrome.runtime.onInstalled.addListener(once);
  chrome.contextMenus.onClicked.addListener(info => chrome.storage.local.set({
    mode: info.menuItemId
  }));
}

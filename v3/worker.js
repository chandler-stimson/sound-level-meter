chrome.action.onClicked.addListener(() => chrome.tabs.create({
  url: 'data/popup/index.html'
}));

const check = () => navigator.permissions.query({
  name: 'microphone'
}).then(r => {
  if (r.state === 'granted') {
    chrome.storage.local.get({
      mode: 'popup'
    }, prefs => {
      chrome.action.setPopup({
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
      contexts: ['action'],
      type: 'radio',
      checked: prefs.mode === 'popup'
    });
    chrome.contextMenus.create({
      title: 'Open in Tab',
      id: 'tab',
      contexts: ['action'],
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

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}

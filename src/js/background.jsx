/* eslint-disable no-undef */
const greeting = "Hello human!";
let db;
const session = false;
const helper = require("./background_helpers.jsx");
const dbstores = require("./dbstores.jsx");

function generalListeners() {
    chrome.runtime.onUpdateAvailable.addListener(function(details) {
        chrome.browserAction.setBadgeText({ text: "!" });
        chrome.runtime.reload();
    });
    chrome.runtime.onInstalled.addListener(function(details) {
        console.log("onInstalled", details.reason);
        if (details.reason == "update") {
            let desc = "";
            db.looked.toArray(function(arr) {
                for (var i = 0; i < arr.length; i++) {
                    desc += _.join(arr[i].postDesc, " ") + " " + _.join(arr[i].origDesc, " ") + " ";
                }
            }).then(function() {
                var origLen = desc.split(" ").length;
                chrome.storage.local.get("alchemy", function(res) {
                    res.alchemy.dataLength = origLen;
                    chrome.storage.local.set(res);
                });
            });

            db.typed.toArray(function(arr) {
                return _(arr).map("content").join(" ");
            }).then(function(typed) {
                var origLen = typed.split(" ").length;
                chrome.storage.local.get("personality", function(res) {
                    res.personality.dataLength = origLen;
                    chrome.storage.local.set(res);
                });
            });
        }
    });
    chrome.runtime.onMessage.addListener(function(req, sender, sendRes) {
        switch (req.type) {
        case "contentLoaded":
            console.log("[>>] " + sender.tab.url + "\t" + sender.tab.status);
            if (parseInt(req.data[0]) == 1) {
                setTimestamp("start", req.type);
            }
            // FIX proper escaping of url
            db.pages.add({ url: sender.tab.url, timestamp: helper.now(), inSession: req.data[0] });
            break;
        case "blur":
            setTimestamp("stop", req.type);
            break;
        case "focus":
            setTimestamp("start", req.type);
            break;
        case "closeWindow":
            setTimestamp("stop", req.type);
            break;
        case "profilePic":
            chrome.storage.local.set({
                "dsUser": {
                    profilePic: {
                        dataUri: req.data[0],
                        rawImg: req.data[1]
                    },
                    profileLink: req.data[2],
                    userName: req.data[3]
                }
            });
            break;
        case "backup":
            helper.backup(db);
            break;
        case "pred-backup":
            helper.backup();
            break;
        case "import":
            if (req.data.dataselfie != undefined) {
                helper.import(db, req.data.dataselfie, sender.tab.id);
            } else {
                helper.importError(sender.tab.id);
            }
            break;
        case "delete":
            helper.resetDB(db, initDB, sender.tab.id);
            chrome.storage.local.clear(initOptions);
            break;
        case "saveLooked":
            db.looked.add(req.data);
            break;
        case "saveClicked":
            db.clicked.add(req.data);
            break;
        case "saveTyped":
            db.typed.add(req.data);
            break;
        }
        return true;
    });
    var lastWebReq = 0;
    chrome.webRequest.onCompleted.addListener(function(info) {
        var dif = info.timeStamp - lastWebReq;
        // limit the number of notifications sent to content
        if (dif > 1500 || lastWebReq == 0) {
            helper.sendToContent(info.tabId);
            console.log("%c[>>] new webRequest", helper.clog.fb);
        }
        lastWebReq = info.timeStamp;
    }, {
        urls: ["https://www.facebook.com/*", "http://www.facebook.com/*", "http://www.torre.bio/*","https://www.torre.bio/*"],
        types: ["image"]
    });
    // STATUS BAR [keyword in manifest.json] + tab
    chrome.omnibox.onInputEntered.addListener(function(text) {
        switch (text) {
        case "reset db":
            helper.resetDB(db, initDB);
            break;
        case "delete db":
            helper.resetDB(db);
            break;
        case "init db":
            initDB(true);
            break;
        case "ds":
            chrome.tabs.create({ url: chrome.runtime.getURL("views/me.html") });
            break;
        }
    });
}

function saveTimestamp(now, status, event) {
    db.transaction("rw", db.timespent, function() {
        db.timespent.toCollection().last(function(last) {
            if (status == "start" && last == undefined) {
                db.timespent.add({ start: now });
            } else if (status == "start" && last.stop != undefined) {
                db.timespent.add({ start: now });
            } else if (status == "stop" && last.stop == undefined) {
                db.timespent.update(last.id, { stop: now });
            }
        });
    });
}

function setTimestamp(status, event) {
    if (session == true && status == "stop") {
        session = false;
        console.log("%c----- [sessions][>>]\t" + status + "\t" + event, helper.clog.fb);
    } else if (session == false && status == "start") {
        session = true;
        console.log("%c+++++ [sessions][>>]\t" + status + "\t" + event, helper.clog.fb);
    }
    helper.setBrowserActionIcon(status);
    saveTimestamp(moment().format(), status, event);
}

function initDB(notify) {
    // if db already exists, dexie only opens
    db = new Dexie("OwOLocalDB");
    db.version(1).stores(dbstores);
    db.open().catch(function(err) {
        console.log("%c[DB][<<] error", helper.clog.magenta);
        console.error(err.stack || err);
        alert("There has been an error. Database was not initiated.");
    }).finally(function() {
        console.log("%c[DB][<<] opened", helper.clog.magenta);
        // FIX might not need
        if (notify != false) {
            console.log("Database was initiated.");
        }
    });
}

function initOptions() {
    chrome.storage.local.get(null, function(res) {
        if (res.optionsMinLookedDuration == undefined) {
            chrome.storage.local.set({
                "optionsMinLookedDuration": 5
            });
            console.log("%cDefault [options][<<] set.", helper.clog.grey);
        } else {
            console.log("%c[Options][<<] already exist.", helper.clog.grey);
        }
    });
}

function storagePrep() {
    initDB(false);
    db.timespent.toArray().then(function(rows) {
        if (rows.length > 0) {
            helper.checkCrash(db, db.timespent);
        } else {
            console.log("%c[DB][<<] timespent is empty.", helper.clog.magenta);
        }
    });
}

function init() {
    console.log("%c" + greeting, helper.clog.lime);
    storagePrep();
    initOptions();
    generalListeners();
    helper.setBrowserActionIcon(session);
    if (devMode) { helper.getPermissions(); }
}

init();

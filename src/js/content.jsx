import tracer from "trace-redirect";

require("./libs/jquery.scrollstop.min.jsx");

window.sec = 0;
window.lookedFocused = false;
window.windowFocused = true;
window.overlayFocused = false;
window.minLookedDuration = 3;
const torreusername = function(){
    let tempvar = async function(){
        let temp = await tracer("https://torre.bio/_a/your-bio");
        return temp;
    };
    let texttemp = tempvar.split("/");
    return texttemp[(textemp.length - 1)];
};

let torreprofiles1degree = [];
let torreprofiles2degree = [];
let torreprofiles3degree = [];

let helper = require("./content_helpers.jsx");
let torreurl = "https://torre.bio/api/people/"+torreusername+"/connections";
let looked = require("./content_looked.jsx");
let typed = require("./content_typed.jsx");
let throttle = require("throttle-debounce/throttle");
let kickoff = {
    getProfilesList: function () {
        let request = new XMLHttpRequest();
        request.open("GET", torreurl);
        request.responseType = "json";
        request.send();

        request.onload = function() {
            let torrejson = request.response;
            for (var i = 0; i < torrejson.length; i++){
                let tempobj = JSON.parse(torrejson[i]);
                if (tempobj.degrees == 1){
                    torreprofiles1degree.push(tempobj);
                }
                if (tempobj.degrees == 2){
                    torreprofiles2degree.push(tempobj);
                }
                if (tempobj.degrees == 3){
                    torreprofiles3degree.push(tempobj);
                }
            }

            for (var i = 0; i < torreprofiles1degree; i++){
                let request = new XMLHttpRequest();
                let torreurl = "https://torre.bio/api/bios/" + torreprofiles1degree.person.publicId;
                request.open("GET", torreurl);
                request.responseType = "json";
                request.send();

                torreprofiles1degree.person["profiles"] = JSON.parse(request.response).person.links;
                for (var i = 0; i < torreprofiles1degree.person.profiles.length; i++){
                    if (torreprofiles1degree.person.profiles[i].name == "facebook"){
                        torreprofiles1degree.person["facebook"].push(torreprofiles1degree.person.profiles[i]);
                    }
                }
            }

            for (var i = 0; i < torreprofiles2degree; i++){
                let request = new XMLHttpRequest();
                let torreurl = "https://torre.bio/api/bios/" + torreprofiles2degree.person.publicId;
                request.open("GET", torreurl);
                request.responseType = "json";
                request.send();

                torreprofiles2degree.person["profiles"] = JSON.parse(request.response).person.links;
                for (var i = 0; i < torreprofiles1degree.person.profiles.length; i++){
                    if (torreprofiles2degree.person.profiles[i].name == "facebook"){
                        torreprofiles2degree.person["facebook"].push(torreprofiles2degree.person.profiles[i]);
                    }
                }
            }

            for (var i = 0; i < torreprofiles3degree; i++){
                let request = new XMLHttpRequest();
                let torreurl = "https://torre.bio/api/bios/" + torreprofiles3degree.person.publicId;
                request.open("GET", torreurl);
                request.responseType = "json";
                request.send();

                torreprofiles3degree.person["profiles"] = JSON.parse(request.response).person.links;
                for (var i = 0; i < torreprofiles1degree.person.profiles.length; i++){
                    if (torreprofiles3degree.person.profiles[i].name == "facebook"){
                        torreprofiles3degree.person["facebook"].push(torreprofiles3degree.person.profiles[i]);
                    }
                }
            }
        };
    },
    addClock: function() {
        $("body").append("<div id=owly_canvas><canvas id=\"canvas\"></canvas><div class=\"copy\"><h1 id=\"name\">OwO</h1></div></div>" + "<div id=\"clock\"><span id=\"clocksec\">" + 0 + "</span></div><script></script><script src=\"./libs/owly/owo.js\"></script>");
            
    },
    saveProfilePic: function(info) {
        var profileLink = info[0].href;
        var profilePic = info.find("img")[0].src;
        var userName = info[0].text;
        helper.convertImg(profilePic, function(dataUri, rawImg) {
            helper.sendToBg("profilePic", [dataUri, rawImg, profileLink, userName]);
        });
    },
    listeners: function() {
        var _window = $(window);
        window.onblur = function() {
            window.windowFocused = false; // replaced window.global
            looked.logic.lookedFocusedFalse();
            looked.logic.logLooked(looked.logic.cachedObj, window.sec); // replaced window.global
            helper.sendToBg("blur", []);
        };
        window.onbeforeunload = function() {
            helper.sendToBg("closeWindow", []);
            if (window.windowFocused == true) { // replaced window.global
                chrome.storage.local.set({
                    "closeWindow": {
                        "timestamp": helper.now()
                    }
                });
                looked.logic.logLooked(looked.logic.cachedObj, window.sec); // replaced window.global
            }
        };
        window.onfocus = function() {
            window.windowFocused = true; // replaced window.global
            looked.checkPhotoOverlay(200, function() {
                looked.postsInView();
            });
            helper.sendToBg("focus", []);
        };
        $.event.special.scrollstop.latency = 800;
        _window.on("scrollstop", throttle(2000, function() {
            if (window.windowFocused) { // replaced window.global
                console.log("scrollstop check posts");
                looked.postsInView();
            }
        }));
        var prevScrollPos = 0;
        _window.on("scroll", throttle(2000, function() {
            var curPos = _window.scrollTop(),
                dif = Math.abs(curPos - prevScrollPos);
            if (dif > 800) {
                // scrolling a lot = stopped looking at the current post
                looked.logic.logLooked(looked.logic.cachedObj, window.sec); // replaced window.global
            }
            prevScrollPos = curPos;
        }));
        chrome.runtime.onMessage.addListener(function(req, sen, res) {
            if (req.webRequest) {
                looked.updateNewsFeed();
            }
        });
    }
};
let clicked = {
    init: function() {
        $("body").click(function(e) {
            var el = $(e.target);
            // check like or external link
            if (e.target.tagName.toLowerCase() == "a") {
                var url = $(el.parents("._3ccb")[0]).find("a._5pcq").attr("href"),
                    postsNum = looked.getPagePosts().length;
                    // url is undefined if it's in overlay
                    // postsNum, so only for newsfeed
                if (el.attr("data-testid") == "fb-ufi-likelink" && url != undefined && postsNum > 0) {
                    console.log("clicked " + url);
                    helper.sendToBg("saveClicked", {
                        type: "like",
                        url: url,
                        timestamp: helper.now()
                    });
                } else if (e.target.className.toLowerCase() == "_52c6" && postsNum > 0) { // external link
                    var url = el[0].href;
                    helper.sendToBg("saveClicked", {
                        type: "external",
                        url: url,
                        timestamp: helper.now()
                    });
                    console.log("clicked " + url);
                } else { // clicked to other location e.g user or image
                    console.log("clicked something not recorded");
                    looked.checkPhotoOverlay(1500);
                    looked.checkLocChanged();
                }
            } else if (el.parents("#pagelet_bluebar")) {
                var bluebar = $("#pagelet_bluebar");
                var fbSearchbar = bluebar.find("input[aria-expanded=true]");
                if (fbSearchbar.length > 0 || e.target.className.indexOf("f_click") > -1) {
                    looked.logic.lookedFocusedFalse();
                    looked.logic.logLooked(looked.logic.cachedObj, window.sec); // replaced window.global
                }
                looked.checkLocChanged();
            } else {
                // clicked somewhere else
                looked.checkPhotoOverlay(1500);
                looked.checkLocChanged();
            }
        });
    }
};

var start = function() {
    console.log("\n\n\n\n\nYay! Content page document.readyState: ", document.readyState);
    looked.getMinLookedDuration();
    // this class can change anytime
    // and could easily be the reason why tracking will stop working
    var info = $("#pagelet_bluebar a._2s25").has("img");
    if (info.length > 0) {
        // this is the beginning, bg only starts tracking
        // if profle img / logged in
        helper.sendToBg("contentLoaded", [1]); // session true
        console.log("Tracking on this page.");
        kickoff.listeners();
        kickoff.addClock();
        kickoff.saveProfilePic(info);
        looked.init();
        clicked.init();
        typed.init();
    } else {
        helper.sendToBg("contentLoaded", [0]); // session false
        console.log("Boo! No tracking on this page. Only activity in your newsfeed are tracked.");
    }
};

start();
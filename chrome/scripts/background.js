/*
 * Copyright (C) 2012, OpenGroove, Inc. All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 
 *  1. Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *  2. Redistributions in binary form must reproduce the above
 *     copyright notice, this list of conditions and the following
 *     disclaimer in the documentation and/or other materials provided
 *     with the distribution.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
 * COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING,
 * BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
 * LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

(function(fulmo) {

fulmo.imageParams = [];

chrome.extension.onRequest.addListener(
    function(req, sender, sendResponse) {
        var canvas = document.getElementById('cv');
        var ctx = canvas.getContext('2d');
        var result = {};
	switch (req.command) {
	case 'getScreen':
            chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(url){
                var img = new Image();
                img.src = url;
                img.onload = function() {
                    canvas.width = 400;
                    ctx.drawImage(img, 0, 0);
                    window.open(canvas.toDataURL());
                    result = {url: url};
                };
            });
	    break;
        case 'putDocumentPart':
            chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(url){
                var img = new Image();
                img.src = url;
                img.onload = function() {
                    if (req.pos[0] == 0 &&  req.pos[1] == 0) {
                        ctx.drawImage(img, req.pos[0], req.pos[1]);
                    } else {
                        if (req.pos[0] == 0 &&  req.pos[1] != 0) {
                            ctx.drawImage(img, 0, req.margin, req.pos[2], req.pos[3] - req.margin, 
					  req.pos[0], req.pos[1] + req.margin, req.pos[2], req.pos[3] - req.margin);
                        } else if (req.pos[0] != 0 &&  req.pos[1] == 0) {
                            ctx.drawImage(img, req.margin, 0, req.pos[2] - req.margin, req.pos[3], 
					  req.pos[0] + req.margin, req.pos[1], req.pos[2] - req.margin, req.pos[3]);
                        } else {
                            ctx.drawImage(img, req.margin, req.margin, req.pos[2] - req.margin, req.pos[3] - req.margin, 
					  req.pos[0] + req.margin, req.pos[1] + req.margin, req.pos[2] - req.margin, req.pos[3] - req.margin);
                        }
                    }
                    sendResponse({});
                };
            });
	    break;
        case 'putWindowPart':
            chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(url){
                var img = new Image();
                img.src = url;
                img.onload = function() {
                    ctx.drawImage(img, req.pos[0], req.pos[1], req.pos[2], req.pos[3], 0, 0, req.pos[2], req.pos[3]);
                    sendResponse({});
                };
            });
	    break;
        case 'setCanvasSize':
            canvas.width = req.width;
            canvas.height = req.height;
            sendResponse({});
	    break;
        case 'getCanvas':
            sendResponse({url: canvas.toDataURL()});
	    break;
        case 'openMainWindow':
            fulmo.imageParams = req.params;
            window.open('main.html', '_blank', 'resizable,centerscreen,scrollbars,width=600,height=800');
            sendResponse({});
	    break;
        case 'openEditor':
            fulmo.imageParams = req.params;
            chrome.windows.getCurrent(function(w){
                window.open('editor.html', '_blank', 'resizable,centerscreen,scrollbars,width=' + w.width + ',height=' + w.height);
                sendResponse({});
            })
	    break;
        case 'openSettingWindow':
            window.open('settings.html');
            sendResponse({});
	    break;
        case 'loadSetting':
            sendResponse({data:JSON.stringify(fulmo.settingsManager.load())});
	    break;
        case 'setupContextMenu':
            setupContextMenu(req.params);
	    break;
	case 'documentCapture':
	case 'windowCapture':
        case 'selectArea':
	    chrome.tabs.getSelected(null, function(tab) {
		chrome.tabs.sendRequest(tab.id, {command: req.command}, function(response) {
		    if (chrome.runtime.lastError != null) {
			alert(chrome.i18n.getMessage("fulmo_cannot_capture_from_this_page"));
		    }
		});
	    });
	    break;
	}
    }
);

function setupContextMenu(params) {
    var actions = [
        { // 0
            title: 'fulmo_name',
        },
        { // 1
            title: 'fulmo_action_all_send',
            command: 'documentCapture'
        },
        { // 2
            title: 'fulmo_action_view_send',
            command: 'windowCapture'
        },
        { // 3
            title: 'fulmo_action_parts_send',
            command: 'selectArea'
        },
        { // 4
            title: 'fulmo_action_no_image_send',
            command: 'withoutImage'
        }
    ];
    function create(parent, num) {
        prop = {
            title: chrome.i18n.getMessage(actions[num].title),
            contexts: ['all'],
            onclick: function() {
                chrome.tabs.getSelected(null, function(tab) {
                    chrome.tabs.sendRequest(tab.id, {command: actions[num].command}, function(response) {});
                });
            }
        }
        if (parent) {
            prop.parentId = parent;
        } else {
            prop.title = chrome.i18n.getMessage(actions[0].title) + ' - ' + prop.title;
        }
        chrome.contextMenus.create(prop);
    }

    chrome.contextMenus.removeAll(function() {
        if (params.length == 0) return;
        if (params.length == 1) {
            create(null, params[0]);
        } else {
            root = chrome.contextMenus.create({"title": chrome.i18n.getMessage(actions[0].title), "contexts":["all"] });
            for (var i = 0; i < params.length; i++) {
                create(root, params[i]);
            }
        }
    });
}

setupContextMenu(fulmo.settingsManager.load().contextMenu);

})(fulmo);

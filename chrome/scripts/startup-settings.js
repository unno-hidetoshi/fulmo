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

var settingInterfaceImplementation = {
    listValue: function(selectId) {
        return $('#' + selectId).val();
    },
    addListItem: function(selectId, text, value) {
        var li = $('<option>').val(value).text('\xa0\xa0\xa0\xa0' + text);
        $('#' + selectId).append(li);
        return li[0];
    },
    selectListItemByValue: function(id, value) {
        $('#'+ id).val(value);
    },
    setCurrentListITemLabel: function(id, label) {
        $('#' + id + ' option:selected').text('\xa0\xa0\xa0\xa0' + label);
    },
    currentListItem: function(id) {
        var sel = $('#' + id + ' option:selected');
        if (!sel.length) return null;
        return sel[0];
    },
    getString: function(tag) {
        try {
            return chrome.i18n.getMessage(tag);
        }
        catch (e) {
            if (window.console && console.log)
                console.log([e, tag]);
            return tag;
        }
    },
    getFormattedString: function(tag, prm) {
        try {
            return $.formatString(chrome.i18n.getMessage(tag), prm);
        }
        catch (e) {
            if (window.console && console.log)
                console.log([e, tag, prm]);
            return tag;
        }
    },
    setDefaultIcon: function(settings) {
        var defaultId = settings.defaultAccountId;
        for (var i in settings.accounts) {
            var val = settings.accounts[i].id;
            var label = settings.accounts[i].name;
            if (val == defaultId) label = '\u2713' + label;
            else label = '\xa0\xa0\xa0\xa0' + label;
            $('#screenshot-sender-account-list option[value=' + val + ']').text(label);
        }
    },
    disableButton: function(id, disabled) {
        $('#' + id).button(disabled ? "disable" : "enable");
    },
    testConfirm: function(params, okFunc, cancelFunc) {
        if (params.account.userId.length) {
            $('#screenshot-sender-account-test-id').val(params.account.userId);
            $('#screenshot-sender-account-test-id').attr('disabled', true);
        } else {
            $('#screenshot-sender-account-test-id').val('');
            $('#screenshot-sender-account-test-id').attr('disabled', false);
        }
        if (params.account.password.length) {
            $('#screenshot-sender-account-test-password').val(params.account.password);
            $('#screenshot-sender-account-test-password').attr('disabled', true);
        } else {
            $('#screenshot-sender-account-test-password').val('');
            $('#screenshot-sender-account-test-id').attr('disabled', false);
        }
        $('#screenshot-sender-account-test-dialog').dialog('option', 'buttons',[
            {
                text: chrome.i18n.getMessage('fulmo_general_button_ok'),
                click: function() {
                    params.goLogin = true;
                    params.account.userId = $('#screenshot-sender-account-test-id').val();
                    params.account.password = $('#screenshot-sender-account-test-password').val();
                    $(this).dialog("close");
                    okFunc();
                }
            },
            {
                text: chrome.i18n.getMessage('fulmo_general_button_cancel'),
                click: function() {
                     $(this).dialog("close");
                     cancelFunc();
                }
            }
        ]);
        $('#screenshot-sender-account-test-dialog').dialog('open');
    },
    testStart: function() {
        $('#screenshot-sender-account-test-button').css('display', 'none');
        $('#screenshot-sender-account-test-progressbar-wrapper').css('display', 'block');
    },
    testEnd: function() {
        $('#screenshot-sender-account-test-button').css('display', 'inline');
        $('#screenshot-sender-account-test-progressbar-wrapper').css('display', 'none');
    },
    closeWindow: function() {
        window.close();
    },
    setContextMenuStatus: function(params) {
        for (var i = 0; i < params.length; i++) {
            $('#screenshot-sender-context-menu-list option[value='+ params[i] + ']').attr('selected', 'selected');
        }
    },
    getContextMenuStatus: function() {
        var out = [];
        $('#screenshot-sender-context-menu-list option').each(function() {
            if ($(this).attr('selected'))  out.push($(this).val());
        });
        return out;
    },
    setupContextMenu: function(params) {
        chrome.extension.sendRequest({command: "setupContextMenu", params: params}, function(response) {});
    },
    setupBtsMenu: function() {
        var drivers = fulmo.bts_drivers;
        var length = drivers.length;
        for (var i = 0; i < length; i++) {
            var driver = drivers[i];
            var opt = $('<option>').val(driver.name).text(driver.label);
            $('#screenshot-sender-account-site-type').append(opt);
        }
    }
};

$(function() {
    var settings = new fulmo.Settings(settingInterfaceImplementation);
    var _dirty = false;

    $.each({'#screenshot-sender-account-add-button': 'addAccount',
            '#screenshot-sender-account-copy-button': 'copyAccount',
            '#screenshot-sender-account-delete-button': 'deleteAccount',
            '#screenshot-sender-account-set-default-button': 'setDefaultAccount'},
    function(idx, val) {
        var listener = settings[val];
        $(idx).click(function() {
            _dirty = true;
            listener.call(settings);
        });
    });

    $('#screenshot-sender-account-test-button').click(settings.goTest);

    $('#screenshot-sender-account-list').change(settings.onSelectAccount);
    $('#screenshot-sender-account-name').change(function() {
        _dirty = true;
        settings.onChange();
        settings.onChangeName();
    });

    $.each({'#screenshot-sender-account-name': 'keyup',
            '#screenshot-sender-account-name': 'paste',
            '#screenshot-sender-account-name': 'cut'}, function(idx, val)
    {
        $(idx).bind(val, function() {
            _dirty = true;
            settings.onChangeName();
        });
    });

    $(['#screenshot-sender-account-url',
       '#screenshot-sender-account-site-type',
       '#screenshot-sender-account-auth-type',
       '#screenshot-sender-account-user-id',
       '#screenshot-sender-account-password'].join(', ')).change(function()
    {
        _dirty = true;
        settings.onChange();
    });
    $('#screenshot-sender-context-menu-list').change(function() { _dirty = true });

    $('#screenshot-sender-ok').click(function() {
        _dirty = false;
        settings.ok();
    });
    $('#screenshot-sender-cancel').click(settings.cancel);

    $('.i18n').each(function() {
        $(this).text(chrome.i18n.getMessage($(this).text()));
    });
    $('.i18n-title').each(function() {
        var title = $(this).attr('title');
        $(this).attr('title', chrome.i18n.getMessage(title));
    });
//    $('#tabs').tabs();
    $('button').button();
    $('#screenshot-sender-account-test-progressbar').progressbar({
        value: 0
    });
    var value = 0;
    setInterval(function() {
        if (value == 100) value = 0;
        value += 2;
        $( "#screenshot-sender-account-test-progressbar" ).progressbar("value", value);
    }, 30);
    $('#screenshot-sender-account-test-dialog').dialog({
        autoOpen: false,
        modal: true,
        width: 320
    });

    settings.init();

    var beforeunload = false;
    $(window).bind('beforeunload', function(ev) {
        if (_dirty && beforeunload === false) {
            beforeunload = true;
            setTimeout(function() { beforeunload = false }, 100);
            return ' ';
        }
    });
});

})(fulmo);

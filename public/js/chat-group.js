$(function () {
    var username;

    var currentMessageType = '';
    /**
     *
     * @param message
     * @param type
     */
    var showMessage = function (message, type) {
        $('.alert-message-wrapper .message').html(message);

        $('.alert-message-wrapper').removeClass(currentMessageType);
        currentMessageType = 'alert-' + (type == 'error' ? 'danger' : 'success');
        $('.alert-message-wrapper').addClass(currentMessageType).show();

        $(".alert").animate({opacity: 1.0}, 10000).fadeOut("slow");
    };

    /**
     * Hide message
     */
    var hideMessage = function () {
        $('.alert-message-wrapper').hide();
    };

    $('.alert-message-wrapper button.close').on('click', function () {
        hideMessage();
    });

    /**
     * @param btn
     */
    var disableButton = function (btn) {
        btn.attr('disabled', true);
    };

    /**
     * @param btn
     */
    var enableButton = function (btn) {
        btn.removeAttr('disabled');
    };

    /**
     *
     * @param cname
     * @param cvalue
     * @param exdays
     */
    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires = "expires="+d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }

    /**
     *
     * @param cname
     * @returns {string}
     */
    function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
        }
        return "";
    }

    var saveAuthData = function() {
        var expireDays = 14;    // days
        setCookie("apiKey", $('#api_key').val(), expireDays);
        setCookie("apiSecret", $('#api_secret').val(), expireDays);
        setCookie("username", $('#username').val(), expireDays);
        setCookie("password", $('#password').val(), expireDays);
    };

    var fillAuthData = function() {
        $('#api_key').val(getCookie("apiKey"));
        $('#api_secret').val(getCookie("apiSecret"));
        $('#username').val(getCookie("username"));
        $('#password').val(getCookie("password"));
    };

    /**
     * Function that loads all Kandy contacts and appends to DOM
     * @returns {boolean}
     */
    var loadGroups = function() {
        $('.owner-group-wrapper, .other-group-wrapper').html('');
        $.ajax({
                dataType: 'json',
                data: {userAccessToken: sessionStorage['user_access_token']},
                url: 'getGroups',
                type: 'GET'
            })
            .done(function (data) {
                if (data.message != 'success') {
                    showMessage('Failed on load group', 'error');
                } else {
                    var groups = data.result.groups;
                    groups.forEach(function(group) {
                        appendGroup(group);
                    });
                }
            })
            .fail(function () {
                showMessage('Sorry, there was an error with your request!', 'error');
            })
            .always(function () {
            });
        return false;
    };

    /**
     * Append group to list group
     * @param group
     * @param prepend
     */
    var appendGroup = function(group, prepend) {

        if (prepend == undefined) {
            prepend = false;
        }

        var owner = group.owners[0];
        var ownerFullId = owner.full_user_id;
        var isOwner = false;
        if (ownerFullId.indexOf(getCookie("username") + '@') === 0) {
            isOwner = true;
        }

        var groupWrapper = $('<div class="group-'+ group.group_id +' group-item-wrapper" data-name="' + group.group_name + '" data-id="' + group.group_id + '">');
        var groupItem = $('<div class="group-item">');
        var groupInfoWrapper = $('<div class="clearfix group-info-wrapper"><div class="group-info-name">' + group.group_name + ' <span class="label label-warning gc-unread-label" style="display: none"></span></div></div>');

        groupInfoWrapper.append('<button type="button" class="close gc-expand-btn"><span class="glyphicon glyphicon-chevron-right"></span></button>');
        if (isOwner) {
            groupInfoWrapper.append('<button type="button" title="Delete group" class="close gc-delete-btn"><span class="glyphicon glyphicon-remove"></span></button>');
            groupInfoWrapper.append('<button type="button" title="Add member" class="close gc-add-member-btn"><span class="glyphicon glyphicon-plus"></span></button>');
            groupInfoWrapper.append('<div class="pull-right gc-add-member-wrapper" style="display: none"><input type="text" class="gc-add-member-input" placeholder="member id"><button type="button" class="close gc-add-member-submit-btn"><span class="glyphicon glyphicon-ok"></span></button></div>');
        } else {
            groupInfoWrapper.append('<button type="button" title="Leave group" class="close gc-leave-group-btn"><span class="glyphicon glyphicon-log-out"></span></button>');
        }

        groupItem.append(groupInfoWrapper);

        var groupMemberWrapper = $('<div class="group-item-member-wrapper hide">');

        var owners = group.owners;
        owners.forEach(function(ownerMember) {
            var memberWrapper = $('<div class="group-item-member group-item-member-owner"><i class="glyphicon glyphicon-user"></i> </div>');
            memberWrapper.append(ownerMember.full_user_id);
            groupMemberWrapper.append(memberWrapper);
        });

        var members = group.members;
        members.forEach(function(member) {
            var memberWrapper = $('<div class="group-item-member group-item-member-other" data-member-id="'+ member.full_user_id +'"><i class="glyphicon glyphicon-user"></i> </div>');
            memberWrapper.append(member.full_user_id);

            if (isOwner) {
                memberWrapper.append('<button type="button" title="Remove member" class="close gc-remove-member-btn" data-id="' + member.full_user_id + '"><span class="glyphicon glyphicon-remove"></span></button>');
            }

            groupMemberWrapper.append(memberWrapper);
        });

        groupItem.append(groupMemberWrapper);
        groupWrapper.html(groupItem);

        var groupWrapperParent;
        if (isOwner) {
            groupWrapperParent = $('.owner-group-wrapper');
        } else {
            groupWrapperParent = $('.other-group-wrapper');
        }

        var oldElement = groupWrapperParent.find('.group-' + group.group_id);
        if (oldElement.length > 0) {
            oldElement.replaceWith(groupWrapper);
        } else {
            if (prepend) {
                groupWrapperParent.prepend(groupWrapper);
            } else {
                groupWrapperParent.append(groupWrapper);
            }
        }
    };

    /**
     * Event click login button
     */
    $('#login-btn').on('click', function () {
        var me = $(this);
        var apiKey = $('#api_key').val();
        var userId = $('#username').val();
        var password = $('#password').val();
        disableButton(me);

        $.ajax({
            dataType: 'json',
            data: {apiKey: apiKey, userId: userId, password: password},
            url: 'getUserAccessToken',
            type: 'GET'
        })
            .done(function (data) {
                if (data.message != 'success') {
                    showMessage('Login failed! Please check your login credentials.', 'error');
                } else {
                    onLoginSuccess(userId, data.result.user_access_token);
                }
            })
            .fail(function () {
                showMessage('Sorry, there was an error with your request!', 'error');
            })
            .always(function () {
                enableButton(me);
            });
        return false;
    });

    /**
     *
     * @param userId
     * @param userAccessToken
     */
    var onLoginSuccess = function (userId, userAccessToken, reload) {
        if (reload == undefined || reload != true) {
            reload = false;
        }

        sessionStorage['user_access_token'] = userAccessToken;
        sessionStorage['user_id'] = userId;

        if (reload === false) {
            saveAuthData();
        }
        // UI
        $('#login-form').addClass('hidden');
        $('#login-form')[0].reset();
        $('#logged-in').removeClass('hidden');
        $('.username').text(userId);
        $('.tab-sms-chat-wrapper').show();

        username = userId;

        hideMessage();

        loadGroups();

        // Checks every 5 seconds for incoming messages
        setInterval(receiveMessages, 5000);
    };

    /**
     * Format date time
     * @param d
     * @returns {string}
     */
    function formatDate (d){
        var month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        var date = d.getDay() + " " + month[d.getMonth()] + ", " +  d.getFullYear();
        var time = d.toLocaleTimeString().toLowerCase();
        return (date + " at " + time);
    }(new Date());

    /**
     * Delete group ui
     * @param groupId
     */
    var deleteGroupUI = function(groupId) {
        var groupWrapper = $('.group-' + groupId);
        groupWrapper.remove();
        var currentChatWith = $('.gc-chat-with-label').attr('data-id');
        if (currentChatWith == groupId) {
            $('.gc-chat-with-label').addClass('hide').attr('data-id', '');
        }
        $('.gc-chat-with-header').hide();
        // Remove message wrapper
        $('.gc-message-' + groupId).remove();
    };

    /**
     * Get group by Id
     * @param groupId
     */
    var getGroupById = function(groupId) {
        $.ajax({
            dataType: 'json',
            data: {userAccessToken: sessionStorage['user_access_token'], id: groupId},
            url: 'getGroupById',
            type: 'GET'
        })
            .done(function (data) {
                if (data.message == 'success') {
                    appendGroup(data.result, true);
                } else {
                    showMessage(data.message);
                    return false;
                }
            })
            .fail(function () {
                showMessage('Sorry, there was an error with your request!', 'error');
            })
            .always(function () {
            });
    };

    /**
     *
     * @param username
     * @param message
     * @param dateTime
     * @param otherUser
     * @param groupId
     */
    var appendMessage = function(username, message, dateTime, groupId, otherUser) {
        var chatWrapperCls = 'chat-user-wrapper';

        var userNameDisplay = '<i class="glyphicon glyphicon-user"></i>' + username;

        var otherUserElement = '';
        if (otherUser !== undefined && otherUser != '') {
            chatWrapperCls = 'chat-other-user-wrapper';
            otherUserElement = ' data-user-id="' + otherUser + '"';
            // Select user from message return
            $('#chat-contacts').val(otherUser);
        }

        var $username = $('<h5 class="chat-username"' + otherUserElement + ' title="' + dateTime + '">').html(userNameDisplay);
        var $message = $('<p>').text(message);
        var $chatItem = $('<div class="col-md-12 chat-content"><div class="popover bottom"><div class="arrow"></div><div class="popover-content"></div></div></div>');

        var $chatWrapper = $('<div class="row chat-message-wrapper ' + chatWrapperCls + '">');
        $chatItem.find('.popover-content').append($message);
        $chatWrapper.append($username, $chatItem);

        var $groupWrapper = $('.gc-message-' + groupId);
        if ($groupWrapper.length === 0) {
            $groupWrapper = $('<div class="gc-message-wrapper gc-message-'+ groupId +'" style="display:none">');
            $groupWrapper.append($chatWrapper);
            $('#chat-messages').append($groupWrapper);
        } else {
            $groupWrapper.append($chatWrapper);
        }
        // Show notify
        if (!$('.gc-message-' + groupId).is(':visible')) {
            var currentNotify = $('.group-' + groupId).find('.gc-unread-label');
            var currentMsg = currentNotify.text();
            if (currentMsg == '' || parseInt(currentMsg) == 0) {
                currentNotify.text(1);
            } else {
                currentNotify.text(parseInt(currentMsg) + 1);
            }
            currentNotify.show('fast');
        }

        $("body, html").animate({ scrollTop: $("#send-btn").offset().top}, 0); // 40 ms
        $('#chat-messages').animate({ scrollTop: $("#chat-messages")[0].scrollHeight}, 0); // 40 ms
    };

    /**
     *
     * @param message
     */
    var groupChatUpdate = function(message) {
        var groupWrapper = $('.group-' + message.group_id);
        groupWrapper.find('.group-info-wrapper').text(message.group_name);
    };

    /**
     * Function to receive messages from other Kandy users
     * @returns {boolean}
     */
    var receiveMessages = function() {
        $.ajax({
            dataType: 'json',
            data: {userAccessToken: sessionStorage['user_access_token']},
            url: 'getMessages',
            type: 'GET'
        })
            .done(function (data) {
                if (data.message == 'success') {
                    var messages = data.result.messages;
                    if (messages.length > 0) {
                        messages.forEach(function (msg) {

                            if (msg.messageType == 'groupChat' && msg.contentType === 'text' && msg.message.mimeType == 'text/plain') {
                                appendMessage(msg.sender.user_id, msg.message.text, formatDate(new Date(msg.timestamp)), msg.group_id, msg.sender.full_user_id);
                            } else if (msg.messageType == 'chatGroupUpdate') {
                                groupChatUpdate(msg);
                            } else if (msg.messageType == 'chatGroupDelete') {
                                deleteGroupUI(msg.group_id);
                            } else if (msg.messageType == 'chatGroupInvite') {
                                var newGroup = getGroupById(msg.group_id);

                                console.log(newGroup);
                                if (newGroup) {
                                    appendGroup(newGroup);
                                }
                            } else if (msg.messageType == 'chatGroupLeave') {
                                var leaver = msg.leaver;
                                var memberWrapper = $('.group-' + msg.group_id).find('.group-item-member-other[data-member-id="' + leaver + '"]');
                                if (memberWrapper.length !== 0) {
                                    memberWrapper.remove();
                                }
                            } else {
                                // When the recieved messageType is not chat, display message type
                                console.log('received ' + msg.messageType + ': ');
                            }
                        });
                    }
                }
            })
            .fail(function () {
                showMessage('Sorry, there was an error with your request!', 'error');
            })
            .always(function () {
            });
        return false;
    };

    // Handle refresh page
    if (sessionStorage['user_access_token'] != undefined) {
        onLoginSuccess(sessionStorage['user_id'], sessionStorage['user_access_token'], true);
    }

    $('#logout-btn').on('click', function () {
        onLogoutSuccess();
    });

    var onLogoutSuccess = function () {
        sessionStorage.removeItem('user_access_token');
        sessionStorage.removeItem('user_id');
        // UI
        $('#login-form').removeClass('hidden');
        $('#logged-in').addClass('hidden');
        $('.username').text('');
        $('.chat-contact-wrapper').html('');
        $('#chat-messages').html('');
        $('.tab-sms-chat-wrapper').hide();
        hideMessage();

        fillAuthData();
    };

    $('#send-btn').on('click', function () {
        var me = $(this);
        var to = $('.gc-chat-with-label').attr('data-id');
        var message = $('#group_message').val();
        if (to == '' || to == undefined) {
            showMessage('Please select a destination.', 'error');
            return false;
        }
        if (message == '') {
            showMessage('Please input fields marked (*).', 'error');
            return false;
        }

        disableButton(me);
        $.ajax({
                dataType: 'json',
                data: {userAccessToken: sessionStorage['user_access_token'], to: to, text: message},
                url: 'sendGroupIm'
            })
            .done(function (data) {
                if (data.message != 'success') {
                    showMessage(data.message, 'error');
                } else {
                    $('#group_message').val('');
                    var d = formatDate(new Date());
                    appendMessage(username, message, d, to);
                }
            })
            .fail(function () {
                alert('Sorry, there was an error with your request!');
            })
            .always(function () {
                enableButton(me);
            });
        return false;
    });

    $('.gc-expand-btn').live('click', function(){
        var icon = $(this).find('.glyphicon');
        if (icon.hasClass('glyphicon-chevron-down')) {
            icon.addClass('glyphicon-chevron-right').removeClass('glyphicon-chevron-down');
        } else {
            $('.gc-expand-btn .glyphicon').addClass('glyphicon-chevron-right').removeClass('glyphicon-chevron-down');
            icon.addClass('glyphicon-chevron-down').removeClass('glyphicon-chevron-right');
        }

        var memberWrapper = $(this).closest('.group-item').find('.group-item-member-wrapper');
        if (!memberWrapper.hasClass('hide')) {
            memberWrapper.addClass('hide');
        } else {
            $('.group-item-member-wrapper').addClass('hide');
            memberWrapper.removeClass('hide');
        }
    });

    $('#login-form input').on('keypress', function(e){
        if (e.which == 13) {
            $('#login-btn').trigger('click');
        }
    });

    $('#group_message').on('keypress', function(e){
        if (e.which == 13) {
            $('#send-btn').trigger('click');
        }
    });

    $('#group-name-input').on('keypress', function(e){
        if (e.which == 13) {
            $('#create-group-save-btn').trigger('click');
        }
    });

    $('.gc-add-member-input').live('keypress', function(e){
        if (e.which == 13) {
            $(this).closest('.gc-add-member-wrapper').find('.gc-add-member-submit-btn').trigger('click');
        }
    });

    $('.chat-other-user-wrapper .chat-username').live('click', function(){
        $('#chat-contacts').val($(this).attr('data-user-id'));
    });

    $('#create-group-btn').live('click', function () {
        $('.create-group-wrapper').toggle();
    });

    $('#create-group-save-btn').on('click', function() {
        var me = $(this);
        disableButton(me);

        var groupName = $('#group-name-input').val();
        $.ajax({
            dataType: 'json',
            data: {userAccessToken: sessionStorage['user_access_token'], name: groupName},
            url: 'createGroup',
            type: 'GET'
        })
            .done(function (data) {
                if (data.message == 'success') {
                    $('#group-name-input').val('');
                    $('.create-group-wrapper').hide();
                    appendGroup(data.result, true);
                } else {
                    showMessage(data.message, 'error');
                    return false;
                }
            })
            .fail(function () {
                showMessage('Sorry, there was an error with your request!', 'error');
            })
            .always(function () {
                enableButton(me);
            });
        return false;
    });

    $('.gc-delete-btn').live('click', function(){
        if (!confirm('Are you sure want to delete this group?')) {
            return false;
        }

        var me = $(this);
        var groupElement = me.closest('.group-item-wrapper');
        var groupId = groupElement.attr('data-id');

        $.ajax({
                dataType: 'json',
                data: {userAccessToken: sessionStorage['user_access_token'], id: groupId},
                url: 'deleteGroup',
                type: 'GET'
            })
            .done(function (data) {
                if (data.message == 'success') {
                    deleteGroupUI(groupId);
                } else {
                    showMessage('Fail. Cannot delete.', 'error')
                }
            })
            .fail(function () {
                showMessage('Sorry, there was an error with your request!', 'error');
            })
            .always(function () {
                enableButton(me);
            });
        return false;
    });

    $('.group-info-name').live('click', function(){
        $('.group-info-name').removeClass('active');
        $(this).addClass('active');

        var groupWrapper = $(this).closest('.group-item-wrapper');
        var groupId = groupWrapper.attr('data-id');
        var groupName = groupWrapper.attr('data-name');

        $('.gc-chat-with-label').attr('data-id', groupId).removeClass('hide');
        $('.gc-chat-with-label span').text(groupName);

        var groupMsgWrapper = $('.gc-message-' + groupId);
        if (groupMsgWrapper.length === 0) {
            var groupMsgWrapperNew = $('<div class="gc-message-wrapper gc-message-' + groupId + '">');
            $('#chat-messages').append(groupMsgWrapperNew);
        }

        // Hide all others
        $('.gc-message-wrapper').hide();
        // Show target chat
        $('.gc-message-' + groupId).show();
        // Hide notify and reset value
        $('.group-' + groupId).find('.gc-unread-label').text(0).hide();
        $('.gc-chat-with-header span').text(groupName);
        $('.gc-chat-with-header').show();

        // Scroll to bottom the panel
        $('#group_message').focus();
        $("body, html").animate({ scrollTop: $("#send-btn").offset().top}, 0); // 40 ms
        $('#chat-messages').animate({ scrollTop: $("#chat-messages")[0].scrollHeight}, 0); // 40 ms
    });

    $('.gc-leave-group-btn').live('click', function(){
        if (!confirm('Are you sure want to leave this group?')) {
            return false;
        }

        var me = $(this);
        var groupElement = me.closest('.group-item-wrapper');
        var groupId = groupElement.attr('data-id');

        $.ajax({
            dataType: 'json',
            data: {userAccessToken: sessionStorage['user_access_token'], id: groupId},
            url: 'leaveGroup',
            type: 'GET'
        })
            .done(function (data) {
                if (data.message == 'success') {
                    deleteGroupUI(groupId);
                } else {
                    showMessage(data.message, 'error')
                }
            })
            .fail(function () {
                showMessage('Sorry, there was an error with your request!', 'error');
            })
            .always(function () {
            });
        return false;
    });

    $('.gc-add-member-btn').live('click', function(){
        var addMemberWrapper = $(this).closest('.group-info-wrapper').find('.gc-add-member-wrapper');
        if (addMemberWrapper.is(':visible')) {
            addMemberWrapper.hide('fast');
        } else {
            addMemberWrapper.show('fast');
            addMemberWrapper.find('.gc-add-member-input').focus();
        }
    });

    $('.gc-add-member-submit-btn').live('click', function () {
        var me = $(this);
        var currentGroup = me.closest('.group-item-wrapper');
        var groupId = currentGroup.attr('data-id');
        var memberId = currentGroup.find('.gc-add-member-input').val();
        if (memberId == '') {
            showMessage('Member id cannot be blank.', 'error');
            return false;
        }
        var members = [];
        members.push(memberId);
        console.log(JSON.stringify(members));
        $.ajax({
            dataType: 'json',
            data: {userAccessToken: sessionStorage['user_access_token'], id: groupId, members: JSON.stringify(members)},
            url: 'addGroupMembers',
            type: 'GET'
        })
            .done(function (data) {
                if (data.message == 'success') {
                    appendGroup(data.result);
                } else {
                    showMessage(data.message, 'error')
                }
            })
            .fail(function () {
                showMessage('Sorry, there was an error with your request!', 'error');
            })
            .always(function () {
            });
        return false;
    });

    $('.gc-remove-member-btn').live('click', function(){
        if (!confirm('Are you sure want to delete remove this member?')) {
            return false;
        }

        var me = $(this);
        var currentGroup = me.closest('.group-item-wrapper');
        var groupId = currentGroup.attr('data-id');
        var memberId = me.attr('data-id');
        $.ajax({
            dataType: 'json',
            data: {userAccessToken: sessionStorage['user_access_token'], id: groupId, members: [memberId]},
            url: 'removeGroupMembers',
            type: 'GET'
        })
            .done(function (data) {
                if (data.message == 'success') {
                    me.closest('.group-item-member').remove();
                } else {
                    showMessage(data.message, 'error')
                }
            })
            .fail(function () {
                showMessage('Sorry, there was an error with your request!', 'error');
            })
            .always(function () {
            });
        return false;
    });

    fillAuthData();
});
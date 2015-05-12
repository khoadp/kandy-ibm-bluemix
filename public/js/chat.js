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
        var expireDays = 14;
        setCookie("apiKey", $('#api_key').val(), expireDays);
        setCookie("username", $('#username').val(), expireDays);
        setCookie("password", $('#password').val(), expireDays);
    };

    var fillAuthData = function() {
        $('#api_key').val(getCookie("apiKey"));
        $('#username').val(getCookie("username"));
        $('#password').val(getCookie("password"));
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
     *
     * @param username
     * @param message
     * @param dateTime
     * @param otherUser
     */
    var appendMessage = function(username, message, dateTime, otherUser) {
        var chatWrapperCls = 'chat-user-wrapper';
        if (otherUser === true) {
            chatWrapperCls = 'chat-other-user-wrapper';
        }

        var userNameDisplay;
        userNameDisplay = '<i class="glyphicon glyphicon-user"></i>' + username;

        var $username = $('<h5 class="chat-username" title="' + dateTime + '">').html(userNameDisplay);
        var $message = $('<p>').text(message);
        var $chatItem = $('<div class="col-md-12 chat-content"><div class="popover bottom"><div class="arrow"></div><div class="popover-content"></div></div></div>');

        var $chatWrapper = $('<div class="row chat-message-wrapper ' + chatWrapperCls + '">');
        $chatItem.find('.popover-content').append($message);
        $chatWrapper.append($username, $chatItem);
        $('#chat-messages').append($chatWrapper);

        // Scroll to bottom the panel
        $("body, html").animate({ scrollTop: $("#send-btn").offset().top}, 0); // 40 ms
        $("#chat-messages").animate({ scrollTop: $("#chat-messages")[0].scrollHeight}, 0); // 40 ms
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

                            if (msg.messageType == 'chat' && msg.contentType === 'text' && msg.message.mimeType == 'text/plain') {
                                $('#sms_message').val('');
                                appendMessage(msg.sender.user_id, msg.message.text, formatDate(new Date(msg.timestamp)), true);
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
        $('#chat-contacts').html('');
        $('.tab-sms-chat-wrapper').hide();
        hideMessage();

        fillAuthData();
    };

    $('#send-btn').on('click', function () {
        var me = $(this);
        var to = $('#chat-contacts').val();
        var message = $('#sms_message').val();
        if (to == '' || message == '') {
            showMessage('Please input fields marked (*).', 'error');
            return false;
        }
        disableButton(me);
        $.ajax({
                dataType: 'json',
                data: {userAccessToken: sessionStorage['user_access_token'], to: to, text: message},
                url: 'message',
                type: 'GET'
            })
            .done(function (data) {
                if (data.message != 'success') {
                    showMessage('Failed to send message! Please try again.', 'error');
                } else {
                    $('#sms_message').val('');
                    var d = formatDate(new Date());
                    appendMessage(username, message, d);
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

    $(document).ready(function(){
        fillAuthData();

        $('#login-form input').on('keypress', function(e){
            if (e.which == 13) {
                $('#login-btn').trigger('click');
            }
        });
    });
});
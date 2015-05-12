$(function () {
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
        hideMessage();
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
        $('.tab-sms-chat-wrapper').hide();
        hideMessage();

        fillAuthData();
    };

    $('#send-btn').on('click', function () {
        var me = $(this);
        var from = $('#sms_from').val();
        var to = $('#sms_to').val();
        var message = $('#sms_message').val();
        if (to == '' || message == '') {
            showMessage('Please input fields marked (*).', 'error');
            return false;
        }
        disableButton(me);
        $.ajax({
            dataType: 'json',
            data: {userAccessToken: sessionStorage['user_access_token'], from: from, to: to, text: message},
            url: 'sms',
            type: 'GET'
        })
            .done(function (data) {
                if (data.message != 'success') {
                    showMessage('Failed to send message! Please try again.', 'error');
                } else {
                    showMessage('The message has been sent!', 'success');
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

        // Enter submit login form
        $('#login-form input').on('keypress', function(e){
            if (e.which == 13) {
                $('#login-btn').trigger('click');
            }
        });
    });
});
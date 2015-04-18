var Client = (function () {
  
  var host, userName, sessionId;

  //start socket
  function startSocket() {
    host = window.location.host;
    socket = io.connect(host);

    socket.on('connect', function() {
      sessionId = socket.socket.sessionid;
    });
    
    socket.on('update', function (data) {
      var msg = $.parseJSON(data);
      var ele = document.createElement('div');
      $(ele).addClass('msg').html(
        '<div class="msg-icon" user-id="' + msg.id + '"></div>'
        + '<div class="msg-body">'
        + '<h3 class="msg-header"><span class="msg-speaker">' + msg.name 
        + '</span>  ' + msg.time + '</h3><p class="msg-content">' 
        + msg.text + '</div>'
      );
      if (msg.id == sessionId) {
        $(ele).addClass('msg-own');
        $(ele).find('.msg-header').text('我' + '  ' + msg.time);
        $(ele).append('<div class="clear"></div>');
      } else {
        $(ele).children('.msg-icon').on('click', function () {
          var self = $(this);
          var id = self.attr('user-id');
          if (id == 'server') {
            return false;
          } else {
            var name = self.siblings('.msg-body').find('.msg-speaker').text();
            startWhisper(id, name);
          }
        });
      }
      $(ele).appendTo('.msg-container');
      $('html,body').animate({
        scrollTop: $(ele).offset().top
      }, 1000);
    });

    socket.on('count', function (data) {
      $('.info-people-num').text(data);
    });

    socket.on('whisper', function (data) {
      var msg = $.parseJSON(data);
      $('.whisper-sender').removeClass('whisper-show');
      $('.whisper-reciever').addClass('whisper-show');
      $('.whisper-source').attr('user-id', msg.sourceId).text(msg.sourceName);
      $('.whisper-content').text(msg.text);
    });
  }

  // handle cookie
  function getCookie () {
    return document.cookie.substr(5);
  }

  function setCookie (value) {
    var d = new Date();
    d.setTime(d.getTime() + (1 * 24 * 60 * 60 * 1000));
    document.cookie = "user=" + value + ";expires=" + d.toGMTString();
  }

  window.clearCookie = function (value) {
    var date = new Date();
    date.setYear(1970);
    document.cookie = "user=" + value + ";expires=" + date.toGMTString();
  }

  // draw the qrcode based on the host
  function drawQrcode () {
    var qrcode = new QRCode("qrcode", {
        text: 'http://' + host,
        colorDark : "#000",
        colorLight : "#fff"
    });
  }

  // handle scroll
  function scrollHandler () {
    var former = 0;
    $(window).on('scroll', function () {
      var current = $(window).scrollTop();
      if (current < 50) {
        $('#info').removeClass('info-hidden');
      } else if (current < former) {
        $('#info').addClass('info-hidden');
      } else {
        $('#info').removeClass('info-hidden');
      }
      former = current;
    });
  }

  function submitMsg(){
    var input = $('#input').val();
    if (input != '') {
      var data = {
        id : sessionId,
        name : userName,
        text : input,
        time : Tool.getFormattedTime()
      }
      socket.emit('update', JSON.stringify(data));
      $('#input').val('');
    }
  }

  function startWhisper (id, name) {
    $('.whisper-reciever').removeClass('whisper-show');
    $('.whisper-target').attr('user-id', id).text(name);
    $('.whisper-sender').addClass('whisper-show');
  }

  function sendWhisper () {
    target = $('.whisper-target').attr('user-id');
    var data = {
      sourceId : sessionId,
      targetId : target,
      sourceName : userName,
      targetName : $('.whisper-target').text(),
      text : $('.whisper-input').val()
    }
    socket.emit('whisper', JSON.stringify(data));
    $('.whisper-input').val('');
    $('.whisper-target').attr('user-id', '').text('');
    $('.whisper-sender').removeClass('whisper-show');
  }

  function cancelWhisper () {
    $('.whisper-input').val('');
    $('.whisper-target').attr('user-id', '').text('');
    $('.whisper-sender').removeClass('whisper-show');
  }

  function ignoreWhisper () {
    $('.whisper-content').text('');
    $('.whisper-source').attr('user-id', '').text('');
    $('.whisper-reciever').removeClass('whisper-show');
  }

  // Dom events
  // onload
  $(document).on('ready', function () {
    if (getCookie() == '') {
      $('#login').show();
    } else {
      userName = getCookie();
      $('#main').show();
      startSocket();
      drawQrcode();
      scrollHandler();
    }
  });

  // whisper
  $('.whisper-cancel').on('click', cancelWhisper);
  $('.whisper-submit').on('click', sendWhisper);
  $('.whisper-ignore').on('click', ignoreWhisper);
  $('.whisper-reply').on('click', function () {
    var source = $(this).parent().find('.whisper-source');
    var id = source.attr('user-id');
    var name = source.text();
    startWhisper(id, name);
  });

  // main
  $('.form-submit').on('click', submitMsg);
  $('.form-input').on('focus', function () {
    $('.form').addClass('form-focus');
  });
  $('.form-input').on('blur', function () {
    $('.form').removeClass('form-focus');
  });

  // login
  $('#login-submit').on('click', function () {
    var val = $('#login-name').val();
    if (val == '') {
      $('#login-name').attr('placeholder', '你还没写名字哦!');
      return false;
    } else {
      userName = val;
      setCookie(userName);
    }
    $('#login').fadeOut(500);
    $('#main').fadeIn(500, function() {
      startSocket();
      drawQrcode();
      scrollHandler();
    });
  });

  return {

  }

})();
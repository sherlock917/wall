var Host = (function(){

  // node modules
  var os = require('os');
  var exec = require('child_process').exec;

  // my modules
  var server = require('../controller/server');

  // get ip address and draw a qrcode
  function drawAddress () {
    var ipInstruct ='';
    if (os.platform() != 'win32') {
      ipInstruct = 'ifconfig';
    } else {
      ipInstruct = 'ipconfig';
    }
    exec(ipInstruct, function (error, stdout, stderr) {
      if (error) {
        console.log(error);
      } else {
        if (stdout.match(/(192.168.[0-9]*.[0-9]*)/)) {
          var url = 'http://' + stdout.match(/(192.168.[0-9]*.[0-9]*)/).pop() + ':3000';
          new QRCode(document.getElementById("qrcode"), url);
          console.log(url);
        }
      }
    });
  }

  function startServer () {
    var connectcb = function (clients) {
      $('#stats-clients').text(clients.length);
    }
    var updatecb = function (data, extra) {
      var msg = $.parseJSON(data);
      var dom = '<section class="timeline-item">' + 
                  '<div class="timeline-tail">' + 
                    '<div class="timeline-node"></div>' + 
                  '</div>' +
                  '<div class="timeline-content">' +
                    '<p class="timeline-header">' +
                      '<span class="timeline-author">' + msg.name + '</span>&nbsp;&nbsp;' +
                      '<span class="timeline-timestamp">' + msg.time + '</span>' +
                    '</p>' +
                    '<p class="timeline-text">' + msg.text + '</p>' +
                  '</div>' +
                '</section>';
      $(dom).appendTo('#main');
      domCallback();
      statUpdate(extra);
    }
    server.start(connectcb, updatecb);
  }

  function domCallback () {
    var items = $('.timeline-item');
    var length = items.length;
    var last = items[length - 1];
    var marginTop = parseInt($(last).css('margin-top').substring(-2));
    var curHeight = $('.timeline-background').height();
    var curMargin = parseInt($('.timeline-end').css('margin-top').substring(-2));
    var incHeight = $(last).height() + marginTop;
    $('.timeline-background').height(curHeight + incHeight);
    $('.timeline-end').css('margin-top', curMargin + incHeight + 'px');
    $('#main').animate({
      scrollTop: curHeight + incHeight
    }, 1500);
  }

  function statUpdate (data) {
    $('#stats-msgCount').text(data);
  }

  // dom thingy
  $(document).on('ready', function () {
    drawAddress();
    startServer();
  });

  return {

  }

})();
function heat() {
	$('.start').hide();
	$('.route').hide();
	$('.finish').hide();
	$('.list').show();
	$('#kntdr').attr('class', 'short');
	setTimeout(function() {	
    $('#blur').addClass('notice-shown');
    $('.notice').fadeIn(200);
  }, 500);
};

$('.notice button').click(function() {
	$('.notice').fadeOut(200);
	$('#blur').removeClass('notice-shown');
});

function start(routeKind) {
	$('.list').hide();
	$('.start').show();
	window.routeKind = routeKind;
	$('.start').addClass(routeKind);
};

function route() {
	$('.start').hide();
	$('.route').show();
	$('.route').addClass(routeKind);
	$('#kntdr').attr('class', 'long');
  startTimer();
};

function finish() {
	$('.route').hide();
	$('.finish').show();
	$('.finish').addClass(routeKind);
};

function stop() {
	$('.finish').hide;
	$('.route').hide;
	$('.start').hide;
	heat();
};

$(document).ready(heat());

$('.start').click(route);
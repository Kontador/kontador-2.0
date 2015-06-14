var routeKind;

function heat() {
	$('.start').hide();
	$('.route').hide();
	$('.finish').hide();
	$('.list').show();
	$('#kntdr').attr('class', 'short');
	$('#blur').addClass('notice-shown');
	$('.notice').show();
};

$('.notice button').click(function() {
	$('.notice').fadeOut(100, 'swing');
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
$(function() {

  $('#flash-message').delay(7000).fadeOut(5000);

  Home.init();

  NProgress.set(0.3);

});


var Home = App.Home = {
  init: function() {
    var This = Home;
    var Trick = App.Trick;
    This.renderAllTricks();
  },
  renderAllTricks: function() {

    var blockHome = $('#home-page');

    if(blockHome.length > 0) {
      $.Mustache
        .load(App.Mustache.directory + "/tricks.mustache")
        .fail(function () {
          console.log('Failed to load templates from <code>' + Trick.mustacheTemplateDir + '</code>');
        })
        .done(function () {
          Home.getAllTrick('.block-tricks', '.pagination');
        });
    }
  },
  getAllTrick: function(el, elp){
    var blockEl = $(el);
    var paginatorEl = $(elp);
    var page = blockEl.data('page') || 0;
    $.ajax({
      url: App.API_BaseUrl + '/trick',
      method: 'GET',
      cache: false,
      data: {
        page: page
      },
      dataType: "JSON",
      beforeSend: function( xhr ) {
      }
    })
    .done(function(res) {

      var currentPage = page > 0 ? page : 1;
      var list_tricks = res.data.tricks;
      var tricks_count = res.data.tricks_count;
      var pageCount = Math.ceil(parseInt(tricks_count)/15);

      App.Trick.renderTrick(el, list_tricks);
      App.Trick.renderPageBar(elp, currentPage, pageCount);

    })
    .fail (function(jqXHR, textStatus) {
      Notifier.show('there is something wrong to load catalogue, please try again', 'err');
    });
  }
};

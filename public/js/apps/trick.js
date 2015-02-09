"use strict";

$(function() {

  Trick.init();
});

var Trick = App.Trick = {
  init: function() {
    var This = Trick;
    This.mustacheTemplateDir = App.Mustache.directory + "/tricks.mustache";
    This.createNewTrick();
    This.importBookmark();
    This.tricksByUser();
  },
  tricksByUser: function() {
    var blockUserTrick = '.block-tricks-user';
    var trickPage = '#pagination';
    var ulPageBar = '.pagination';

    if($(blockUserTrick).length > 0) {
      $.Mustache
        .load(Trick.mustacheTemplateDir)
        .fail(function () {
          console.log('Failed to load templates from <code>' + Trick.mustacheTemplateDir + '</code>');
        })
        .done(function () {
          Trick.getTrickByUser(blockUserTrick, ulPageBar);
        });
    }
  },
  getTrickByUser: function(el, elp) {
    var block = $(el);

    var user_id = block.data('id');
    var username = block.data('username');
    var page = block.data('page');
    $.ajax({
      url: App.API_BaseUrl + '/trick/tricks-user',
      method: 'GET',
      cache: false,
      data: {
        user_id: user_id,
        page: page
      },
      dataType: "json",
      beforeSend: function( xhr ) {
      }
    })
    .done(function(res) {
      var list_tricks = res.data.tricks;
      var tricks_count = res.data.tricks_count;
      var origin_url = block.data('url');

      App.Paginator.currentPage = page > 0 ? page : 1;
      var pageCount = Math.ceil(parseInt(tricks_count)/12);

      App.Paginator.pageCount = pageCount;

      if($('.profile-card').length > 0) {
        $('.profile-card').find('.tricks-count').html(tricks_count);
      }

      if(_.size(list_tricks) > 0) {
        $.jStorage.set('tricks-by-'+ username, res, {TTL : 600000}); // set localStorange to 10 Minutes
      }

      Trick.renderTrick(el, list_tricks, origin_url);
      Trick.renderPageBar(elp, App.Paginator.currentPage, App.Paginator.pageCount, origin_url);
    })
    .fail (function(jqXHR, textStatus) {
      console.error(jqXHR.responseJSON.message)
    });
  },
  renderTrick: function(el, list_tricks, origin_url) {

    var render = render || $(el);

    render.html('');

    _.each(list_tricks, function(trick) {

      if (trick.user.photo_profile === undefined) {
        trick.user.photo_profile = 'https://gravatar.com/avatar/' + md5(trick.user.email) + '?s=200&d=retro';
      }

      if (trick.user._id === App.User.session._id) {
        trick.is_mine = true;
      }

      if(!_.isArray(trick.tags)) {
        trick.tags = trick.tags.split(/\s*,\s*/);
      }

      if(~trick.title.indexOf('unity3d')) {
        trick.origin_url = '/unity3d';
      }

      delete trick.user.email;
      trick.preUrl = origin_url;

      render.append($.Mustache.render('trickItem', trick));
    });

    var container = document.querySelector(el);
    var msnry;
    // initialize Masonry after all images have loaded
    imagesLoaded( container, function() {
      msnry = new Masonry( container );
    });

  },
  renderPageBar: function(elp, currentPage, pageCount, origin_url) {

    var paginatorEl = $(elp);
    if(paginatorEl){
      var options = {
        currentPage: currentPage,
        totalPages: pageCount,
        numberOfPages: 5
      };
      var pagehtml="";
      //just only one page
      if(options.totalPages <= 1) {
        pagehtml="";
      }
      //more than one page
      if(options.totalPages > 1) {
        if(options.currentPage > 1) {
          pagehtml+= '<li><a href="' + origin_url + (options.currentPage-1) + '">上一页</a></li>';
        }
        for(var i=0;i<options.totalPages;i++){
          if(i>=(options.currentPage-3) && i<(options.currentPage+3)){
            if(i==options.currentPage-1){
              pagehtml+= '<li class="active"><a href="' + origin_url + (i+1) +'">' + (i+1) + '</a></li>';
            }else{
              pagehtml+= '<li><a href="' + origin_url + (i+1) + '">' + (i+1) + '</a></li>';
            }

          }
        }
        if(options.currentPage<options.totalPages){
          pagehtml+= '<li><a href="' + origin_url + (options.currentPage+1) + '">下一页</a></li>';
        }
      }
      $(".pagination").html(pagehtml);
    }
  },
  createNewTrick: function() {

    var formNewTrick = $('form.new-trick');

    formNewTrick.submit(function(e) {
      e.preventDefault();
    })
    .validate({
      rules: {
        title: {
          required: true
        },
        origin_url: {
          required: true
        },
        tags : {
          required: true
        }
      },
      submitHandler : function(form){
        var data = {
          title : formNewTrick.find("input#title").val(),
          origin_url : formNewTrick.find("input#origin_url").val(),
          description : formNewTrick.find("textarea#desc").val(),
          tags : $("input#tags").tagsinput('items'),
          '_csrf': $('input[name="_csrf"]').val()
        };

        $.ajax({
          url      : App.API_BaseUrl + '/trick/create',
          type     : 'POST',
          dataType : "json",
          data     : data
        })
        .fail(function(res) {
          Notifier.show(res.responseJSON.message, 'err');
        })
        .done(function(res) {
          Notifier.show("剧场成功注册！");

          formNewTrick.find('input[type=text]').val('');
          formNewTrick.find('textarea').val('');

          // setTimeout(function() {
          //   window.location.href = App.BaseUrl + '/' + App.User.session.username+ '/tricks'
          // }, 5000);
        })
        .always(function(res) {
          console.log(res);
        });
      }
    });
  }, // end of createNewTrick
  importBookmark: function() {
    if($('#fileupload').length > 0) {
      var prgressBar = Trick.progressBarDOM();
      $('footer').after(prgressBar);
      $('#fileupload').fileupload({
        url: App.API_BaseUrl + '/trick/import',
        dataType: 'json',
        error: function(res, data) {
          $('#progress').fadeOut();
          Notifier.show('Error ' + res.status + ' : ' + res.responseJSON.message, 'err');
        },
        done: function (e, data) {
          var res = data.result;

          setTimeout(function(){
            $('#progress').fadeOut();
          }, 3000);
        },
        progressall: function (e, data) {
          $('#progress').fadeIn();
          var progress = parseInt(data.loaded / data.total * 100, 10);
          $('#progress .progress-bar').css( 'width', progress + '%');
        }
      }).prop('disabled', !$.support.fileInput).parent().addClass($.support.fileInput ? undefined : 'disabled');
    }
  },
  progressBarDOM : function() {
    return '<div id="progress" class="progress progress-xs progress-striped"><div data-toggle="tooltip" class="progress-bar bg-info lter"></div></div>';
  }
};

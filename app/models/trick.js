var phantom = require('phantom-render-stream');
var fs = require('fs');
var config = require('../config/config');
//var screenshot = phantom();
var screenShot = phantom(config.phantomConf);
var sharp = require('sharp');
var utils = require(config.root + '/app/helper/utils');
var crypto = require('crypto');
var request = require('request');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var CreateUpdatedAt = require('mongoose-timestamp');
var slug = require('mongoose-slug');
var mongooseTypes = require("mongoose-types");

//option: "url" or "email"
mongooseTypes.loadTypes(mongoose, "url");

var Trick = new Schema({
  title: {
    type: String,
    required: true,
    index: {
      unique: true
    }
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  tags: [
    { type: String }
  ],
  description: {
    type: String
  },
  origin_url: {
    type: mongoose.SchemaTypes.Url,
    index: {
      unique: true
    }
  },
  screenshot: {
    type: String
  },
  view_counts: {
    type: Number,
    default: 0
  },
  click_counts: {
    type: Number,
    default: 0
  },
  favorite_counts: {
    type: Number,
    default: 0
  },
  is_active: {
    type: Boolean,
    default: true
  }
});

Trick.plugin(slug('title'));
Trick.plugin(CreateUpdatedAt);

Trick.methods = {

  /**
   * screenShoot Url
   *
   * @param {String} url
   * @param {Function} cb
   * @api private
   */

  screenShoot: function (res, url, cb) {

    if (!url || !url.length) return this.save(cb);

    var self = this;

    this.validate(function (err) {

      if (err) return cb(err);

      var opts = {
        format: 'png',
        width: 760,
        height: 576
      };

      var makeSalt = Math.round((new Date().valueOf() * Math.random())) + '';

      var hasFileName = crypto.createHmac('sha1', makeSalt).update(url).digest('hex');

      self.screenshot = hasFileName + '.' + opts.format;

      var location_screenshoot = config.root + '/public/screenshot/tmp/' + hasFileName + '.' + opts.format;
      var location_final = config.root + '/public/screenshot/' + hasFileName + '.' + opts.format;

      var outputStream = fs.createWriteStream(location_screenshoot);

      screenShot(url).pipe(outputStream);

      self.save(function (err, doc) {

        if (err) {
          var errPrint = {};

          if (err.code == 11000) {
            errPrint.message = '剧场' + self.title + '或者' + self.origin_url + '展示地址已经存在';
            errPrint.status = 409;
          } else {
            errPrint = err;
            errPrint.status = 409;
          }

          errPrint.errors = err.errors;

          return utils.responses(res, 409, errPrint);

        } else {

          outputStream.on('open', function () {
            console.log('Screenshoot the url is progress');
            // return utils.responses(res, 206, {message: 'Screenshoot the url is progress', status: 206});
          });

          outputStream.on('end', function () {
            console.log("EOF");
          });

          outputStream.on('error', function (err) {
            console.log("Error screenshot the url");
            // err.message = "Error screenshot the url"
            // return utils.responses(res, 500, err);
            // outputStream.end();
          });

          outputStream.on('finish', function () {
            console.log("screenshot the url just finish");
            sharp(location_screenshoot).resize(282, 250).toFile(location_final, function(err) {
              if (err) {
                throw err;
              } else {
                console.log("screenshot resize image just finish");
              }
            });
          });
          return utils.responses(res, 200, doc);
        }
      });
    });
  },

  /**
   * screenShootBatch
   *
   * @param {String} url
   * @param {Function} cb
   * @api private
   */
  screenShootBatch: function (url, cb) {

    if (!url || !url.length) return this.save(cb);

    var self = this;

    this.validate(function (err) {

      if (err) return cb(err);

      var opts = {
        format: 'png',
        width: 760,
        height: 576
      };

      var makeSalt = Math.round((new Date().valueOf() * Math.random())) + '';

      var hasFileName = crypto.createHmac('sha1', makeSalt).update(url).digest('hex');

      self.screenshot = hasFileName + '.' + opts.format;

      var location_screenshoot = config.root + '/public/screenshot/tmp/' + hasFileName + '.' + opts.format;
      var location_final = config.root + '/public/screenshot/' + hasFileName + '.' + opts.format;

      var outputStream = fs.createWriteStream(location_screenshoot);

      screenShot(url).pipe(outputStream);

      self.save(function (err, doc) {

        if (err) {
          var errPrint = {};

          if (err.code == 11000) {
            errPrint.message = '剧场' + self.title + '或者' + self.origin_url + '展示地址已经存在';
            errPrint.status = 409;
          } else {
            errPrint = err;
            errPrint.status = 409;
          }

          errPrint.errors = err.errors;
          console.log(errPrint.message);

        } else {

          outputStream.on('open', function () {
            console.log('Screenshoot the url is progress');
            // return utils.responses(res, 206, {message: 'Screenshoot the url is progress', status: 206});
          });

          outputStream.on('end', function () {
            console.log("EOF");
          });

          outputStream.on('error', function (err) {
            console.log("Error screenshot the url");
            // err.message = "Error screenshot the url"
            // return utils.responses(res, 500, err);
            // outputStream.end();
          });

          outputStream.on('finish', function () {
            console.log("screenshot the url just finish");
            sharp(location_screenshoot).resize(282, 250).toFile(location_final, function(err) {
              if (err) {
                throw err;
              } else {
                console.log("screenshot resize image just finish");
              }
            });
          });
        }
      });
    });
  }
};

Trick.statics = {
  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  load: function (id, cb) {
    this.findOne({ _id: id }).exec(cb);
  },

  /**
   * List articles
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (options, cb) {
    var criteria = options.criteria || {};

    this.find(criteria).populate('user', 'username photo_profile').sort({'createdAt': -1}) // sort by date
    .limit(options.perPage).skip(options.perPage * options.page).exec(cb);
  }
};

module.exports = mongoose.model('Trick', Trick);

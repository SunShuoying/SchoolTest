/**
 * Created by sunsh on 3/22/2017.
 */


var mongodb = require('./db');
var crypto = require('crypto');
var async = require('async');
function regUser(user) {
    this.name = user.name;
    this.sex = user.sex;
    this.experience = user.experience;
    this.underMajor = user.underMajor;
    this.underDate = user.underDate;
    this.underClass = user.underClass;
    this.underStudentID = user.underStudentID;
    this.masterMajor = user.masterMajor;
    this.masterDate = user.masterDate;
    this.masterClass = user.masterClass;
    this.masterStudentID = user.masterStudentID;
    this.doctorMajor = user.doctorMajor;
    this.doctorDate = user.doctorDate;
    this.doctorClass = user.doctorClass;
    this.doctorStudentID = user.doctorStudentID;
    this.postMajor = user.postMajor;
    this.postDate = user.postDate;
    this.postClass = user.postClass;
    this.postStudentID = user.postStudentID;
    this.country = user.country;
    this.city = user.city;
    this.company = user.company;
    this.position = user.position;
    this.telephone = user.telephone;
    this.email = user.email;
    this.xiaoHui = user.xiaoHui;
    this.xPosition = user.xPosition;
    this.password = user.password;
    //this.email = user.email;
};
module.exports = regUser;
regUser.prototype.save = function(callback) {
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
    var user = {
        name: this.name,
        sex: this.sex,
        experience:{},
        country: this.country,
        city: this.city,
        company: this.company,
        position: this.position,
        telephone: this.telephone,
        xiaoHui: this.xiaoHui,
        xPosition: this.xPosition,
        password: this.password,
        email: this.email,
       // head: head
    };
    var exp = ["undergraduate","master","doctor","postdoctor"];
    var va = [[this.underMajor ,this.underDate ,this.underClass ,this.underStudentID],
              [this.masterMajor,this.masterDate,this.masterClass,this.underStudentID],
              [this.doctorMajor,this.doctorDate,this.doctorClass,this.underStudentID],
              [this.postMajor  ,this.postDate  ,this.postClass  ,this.postStudentID]];
    if(exp[0] in this.experience){
        user.experience.exp[0] = {

        };
    }

    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('regUsers', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.insert(user, {
                safe: true
            }, function (err, user) {
                cb(err, user);
            });
        }
    ], function (err, user) {
        mongodb.close();
        err ? callback(err) : callback(null, user[0]);
    });

};
regUser.get = function(name, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('users', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.findOne({
                name: name
            }, function (err, user) {
                cb(err, user);
            });
        }
    ], function (err, user) {
        mongodb.close();
        err ? callback(err) : callback(null, user);
    });
};

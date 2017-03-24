/**
 * Created by sunsh on 3/24/2017.
 */
/**
 * Created by sunsh on 3/22/2017.
 */


var mongodb = require('./db');
var crypto = require('crypto');
var async = require('async');
function FormalUser(user) {
    this.user = user;

};
module.exports = FormalUser;
FormalUser.prototype.save = function(callback) {

    var user = this.user;
    /*
     var exp = ["undergraduate","master","doctor","postdoctor"];
     var unObj = {
     experience:"undergraduate",
     major:this.underMajor,
     date:this.underDate,
     class:this.underClass,
     studentId:this.underStudentID
     };
     var maObj = {
     experience:"master",
     major:this.masterMajor,
     date:this.masterDate,
     class:this.masterClass,
     studentId:this.masterStudentID
     };
     var doObj = {
     experience:"doctor",
     major:this.doctorMajor,
     date:this.doctorDate,
     class:this.doctorClass,
     studentId:this.doctorStudentID
     };
     var poObj = {
     experience:"postdoctor",
     major:this.postMajor,
     date:this.postDate,
     class:this.postClass,
     studentId:this.postStudentID
     };
     var ar = [unObj,maObj,doObj,poObj];

     for(var i = 0;i<4;i++){
     if(this.experience.indexOf(exp[i]) != -1){
     user.experience.push(ar[i]);
     }
     }
     */
    /*
     if(this.experience.indexOf("undergraduate") != -1){
     user.experience.undergraduate = unObj;
     }
     if(this.experience.indexOf("master") != -1){
     user.experience.master = maObj;
     }
     if(this.experience.indexOf("doctor") != -1){
     user.experience.doctor = doObj;
     }
     if(this.experience.indexOf("postdoctor") != -1){
     user.experience.postdoctor = poObj;
     }
     */
    console.log(user);

    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('formalUsers', function (err, collection) {
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
FormalUser.get = function(email, callback) {
    async.waterfall([
        function (cb) {
            mongodb.open(function (err, db) {
                cb(err, db);
            });
        },
        function (db, cb) {
            db.collection('formalUsers', function (err, collection) {
                cb(err, collection);
            });
        },
        function (collection, cb) {
            collection.findOne({
                email: email
            }, function (err, user) {

                cb(err, user);
            });
        }
    ], function (err, user) {
        mongodb.close();
        err ? callback(err) : callback(null, user);
    });
};

FormalUser.getTen = function ( page, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('formalUsers', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};

            //使用count返回特定查询的文档数total
            collection.count(query, function(err, total) {
                //根据query对象查询,并跳过前（page-1）*10 个结果，返回之后的10个结果
                collection.find(query, {
                    skip:(page-1)*10,
                    limit:10
                }).sort({
                    time:-1
                }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    //解析markdown为html

                    console.log("overcome"+total);
                    console.log("docs :"+docs);
                    callback(null, docs, total);//成功！以数组形式查询结果
                });
            });
        });
    });
};



//remove FormalUser
FormalUser.remove = function(email, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //posts
        db.collection('formalUsers', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //
            collection.findOne({
                "email": email
            }, function (err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                //删除转载来的文章所在的文档
                console.log("find ok");
                collection.remove({
                    "email": email
                }, {
                    w: 1
                }, function (err) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    console.log("remove ok");
                    callback(null);
                });
            });
        });
    });
};
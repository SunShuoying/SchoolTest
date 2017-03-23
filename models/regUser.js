/**
 * Created by sunsh on 3/22/2017.
 */


var mongodb = require('./db');
var crypto = require('crypto');
var async = require('async');
function RegUser(user) {
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
module.exports = RegUser;
RegUser.prototype.save = function(callback) {
    var date = new Date();
    //存储各种时间格式
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(this.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
    var user = {
        time:time,
        name: this.name,
        sex: this.sex,
        experience:[],
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
RegUser.get = function(email, callback) {
    console.log("begin");
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
            collection.findOne({
                email: email
            }, function (err, user) {

                cb(err, user);
            });
        }
    ], function (err, user) {
        mongodb.close();
        console.log(user);
        err ? callback(err) : callback(null, user);
    });
};

RegUser.getTen = function ( page, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('regUsers', function(err, collection) {
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



//remove regUser
RegUser.remove = function(email, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //posts
        db.collection('regUsers', function (err, collection) {
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
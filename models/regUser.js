/**
 * Created by sunsh on 3/22/2017.
 */


var mongodb = require('./db');
var crypto = require('crypto');
var async = require('async');
function RegUser(user) {
    this.name = user.name;
    this.sex = user.sex;
    //this.experience = user.experience;
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
    this.experience = [];
    for(var i = 0;i<user.experience.length;i++){
        this.experience[i] = user.experience[i];
    }
};
module.exports = RegUser;
RegUser.prototype.save = function(callback) {
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
    if (!this.experience.indexOf) {
        this.experience.prototype.indexOf = function (obj) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] == obj) {
                    return i;
                }
            }
            return -1;
        }
    }
    for(var i = 0;i<4;i++){
        if(this.experience.indexOf(exp[i]) != -1){
            user.experience.exp[i] = {
                major:va[i][0],
                date:va[i][1],
                class:va[i][2],
                studentID:va[i][3]
            };
        }


    }
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
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    console.log("overcome"+total);
                    callback(null, docs, total);//成功！以数组形式查询结果
                });
            });
        });
    });
};



//remove regUser
RegUser.remove = function(name, email, telephone, callback) {
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
                "name": name,
                "email": email,
                "telephone": telephone
            }, function (err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                //删除转载来的文章所在的文档
                collection.remove({
                    "name": name,
                    "email": email,
                    "telephone": telephone
                }, {
                    w: 1
                }, function (err) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    callback(null);
                });
            });
        });
    });
};
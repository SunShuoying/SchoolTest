/**
 * Created by sunsh on 3/25/2017.
 */
/**
 * Created by sun on 2015/11/19.
 */
var mongodb = require('./db')
markdown = require('markdown').markdown;


function Activity(title, tags, content, actTime) {
    this.title = title;
    this.tags = tags;
    this.content = content;
    this.actTime = actTime;
}
module.exports = Activity;

//存储一篇文章及其相关信息
Activity.prototype.save = function(callback) {
    var date = new Date();
    //存储各种时间格式
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + "-" + (date.getMonth() + 1),
        day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
        minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    }
    //要存入数据库的文档
    var activity = {
        postTime: time,
        actTime:this.actTime,
        title: this.title,
        tags:this.tags,
        content: this.content,
        enters: [],
        signs:[],
    };
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('activities', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //将文档插入posts集合
            collection.insert(activity, {
                safe: true
            },function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);//失败！返回err
                }
                callback(null);//返回err为null

            });
        });
    });
};
//读取文章及其相关消息
Activity.getTen = function ( page, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('activities', function(err, collection) {
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
                    postTime:-1
                }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    //解析markdown为html

                    docs.forEach(function (doc) {
                        if(doc.content != null)
                            doc.content = markdown.toHTML(doc.content);
                        else
                            console.log("content is null");
                    });
                    callback(null, docs, total);//成功！以数组形式查询结果
                });
            });
        });
    });
};

Activity.getOne = function( minute, title, callback){
    //打开数据库
    mongodb.open(function (err,db) {
        if (err) {
            return callback(err);

        }
        //读取posts集合
        db.collection('activities' , function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);

            }
            //根据用户名、发表日期及文章名进行查询
            collection.findOne({
                "postTime.minute": minute,
                "title": title
            },function(err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
               // console.log(doc.content);
                if(doc != null)
                    doc.content = markdown.toHTML(doc.content);
                callback(null, doc);//返回查询的一篇文章
            });
        });
    });
};


Activity.edit = function(minute, title, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('activities',function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名、发表日期及文章名进行查询
            collection.findOne({
                "postTime.minute": minute,
                "title": title
            },function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);//返回查询的一篇文章（markdown格式）
            });
        });
    });
};


Activity.update = function(minute,title,newEdit, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('activities', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);

            }
            //更新文章内容
            collection.update({
                "postTime.minute":minute,
                "title":title
            },{
                $set: newEdit
            },function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};


//删除一篇文章
Activity.remove = function(minute, title, callback) {
//打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
//读取 posts 集合
        db.collection('activities', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
//查询要删除的文档
            collection.findOne({
                "postTime.minute": minute,
                "title": title
            }, function (err, doc) {
                if (err) {
                    mongodb.close();
                    return callback(err);
                }
                collection.remove({
                    "postTime.minute": minute,
                    "title": title
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


//返回所有文章存档信息
Activity.getArchive = function(callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('activities', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //返回只包含name、time、title属性的文档组成的存档数组
            collection.find({}, {
                "postTime":1,
                "actTime":1,
                "title":1
            }).sort({
                postTime:-1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};


Activity.getTags = function(callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('activities', function (err, collection){
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //distinct用来找出给定键的所有不同值
            collection.distinct("tags",function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};


Activity.getTag = function(tag, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('activities', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
//查询所有 tags 数组内包含 tag 的文档
//并返回只含有 name、time、title 组成的数组

            collection.find({
                "tags": tag
            }, {
                "postTime": 1,
                "actTime": 1,
                "title": 1
            }).sort({
                postTime: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};


Activity.search = function(keyword, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('activities', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp("^.*" + keyword + ".*$", "i");
            collection.find({
                "title": pattern
            }, {
                "postTime": 1,
                "actTime": 1,
                "title": 1
            }).sort({
                postTime: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};
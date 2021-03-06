
/*
 * GET home page.
 */

/*exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};*/
var  crypto = require('crypto'),
     fs = require('fs'),
     User = require('../models/user.js'),
     Post = require('../models/post.js'),
     RegUser = require('../models/regUser.js'),
     FormalUser = require('../models/formalUser.js'),
       Activity = require('../models/activity.js'),
     Comment = require('../models/comment.js');
var exphbs = require('express3-handlebars');
var querystring = require('querystring');
var http = require('http');


module.exports=function(app) {
    /*app.get('/',function (req,res){
     res.render('index',{title:'Express'});
     });*/


    app.get('/', function (req, res) {
        //判断是否是第一页，并把请求的页数转换成number类型
        var page = req.query.p?parseInt(req.query.p):1;
        //查询并返回第page页的10篇文章
        Activity.getTen( page ,function (err, activities, total) {
            if (err) {
                activities = [];
            }

            res.render('newIndex', {
                title: 'new主页',
                activities: activities,
                page :page,
                isFirstPage:(page-1)==0,
                isLastPage: ((page-1)*10+activities.length)==total,
                user:req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        res.render('reg', {
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()

        });
    });

    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {
        for(var i in req.body){
            console.log(i+":"+req.body[i]);
        }
        console.log(req.body.experience[0]+":"+typeof req.body.experience);
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newRegUser = new RegUser({
            name: req.body.name,
            sex: req.body.sex,
            experience:req.body.experience,
            underMajor:req.body.underMajor,
            underDate:req.body.underDate,
            underClass:req.body.underClass,
            underStudentID:req.body.underStudentID,
            masterMajor:req.body.masterMajor,
            masterDate:req.body.masterDate,
            masterClass:req.body.masterClass,
            masterStudentID:req.body.masterStudentID,
            doctorMajor:req.body.doctorMajor,
            doctorDate:req.body.doctorDate,
            doctorClass:req.body.doctorClass,
            doctorStudentID:req.body.doctorStudentID,
            postMajor:req.body.postMajor,
            postDate:req.body.postDate,
            postClass:req.body.postClass,
            postStudentID:req.body.postStudentID,
            country: req.body.country,
            city: req.body.city,
            company: req.body.company,
            position: req.body.position,
            telephone: req.body.telephone,
            xiaoHui: req.body.xiaoHui,
            xPosition: req.body.xPosition,
            password: password,
            email: req.body.email
        });
        console.log("get");
        FormalUser.get(newRegUser.email,function (err,user) {
            if (user) {
                req.flash('error', '此邮箱已存在!');
                console.log("此邮箱已存在");
                return res.redirect('/reg');//返回注册页
            }
            RegUser.get(newRegUser.email, function (err, user) {
                if (user) {
                    req.flash('error', '此邮箱已申请!');
                    console.log("此邮箱已申请");
                    return res.redirect('/reg');//返回注册页
                }
                //如果不存在则新增用户

                //verifyUser(newUser);
                newRegUser.save(function (err, user) {
                    if (err) {
                        req.flash('error', err);
                        console.log("error");
                        return res.redirect('/reg');//注册失败返回主册页
                    }
                    //req.session.user = user;//用户信息存入 session
                    req.flash('success', '注册申请成功，等待审核通过短信或者邮箱通知!');
                    console.log("success");
                    res.redirect('/');//注册成功后返回主页
                });
            });
        });
    });

    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res) {
        res.render('login', {
            title: '登录',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()});
    });

    app.get('/activity/:minute/:title', checkLogin);
    app.get('/activity/:minute/:title',function (req,res) {

        if(req.session.user){
            Activity.getOne(req.params.minute,req.params.title,function (err,activity) {
                if(err){
                    req.flash('error', '网络错误请重试!');
                    return res.redirect('back');
                }
                var isEnter = 'false';
                var enters = activity.enters;
                for(var i = 0;i<enters.length;i++){
                    if(enters[i].email == req.session.user.email){
                        isEnter = 'true';
                        break;
                    }
                }

                var isSign = 'false';
                var signs = activity.signs;
                for(var i = 0;i<signs.length;i++){
                    if(signs[i].email == req.session.user.email){
                        isSign = 'true';
                        break;
                    }
                }

                res.render('activity',{
                    title:'活动报名/签到页面',
                    isEnter:isEnter,
                    isSign : isSign,
                    activity:activity,
                    user:req.session.user,
                    success:req.flash('success').toString(),
                    error:req.flash('error').toString()
                })
            });
        }
    });

    //show enters
    app.get('/activity/:minute/:title/enterState',function (req,res) {
       Activity.getOne(req.params.minute,req.params.title,function (err,activity) {
           if(err){
               req.flash('error','出现异常，请重试！');
               return res.redirect('back');
           }
            res.render('enterState',{
                title: '发表',
                enters:activity.enters,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
           });
       }) ;
    });

    //show signs
    app.get('/activity/:minute/:title/signState',function (req,res) {
        Activity.getOne(req.params.minute,req.params.title,function (err,activity) {
            if(err){
                req.flash('error','出现异常，请重试！');
                return res.redirect('back');
            }

            res.render('signState',{
                title: '发表',
                signs:activity.signs,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        }) ;
    });

    //申请报名
    app.get('/enter/:minute/:title',function (req,res) {
        var url = 'back';
       Activity.getOne(req.params.minute,req.params.title,function (err,activity) {
         if(err){
             req.flash('error', '错误请重试!');
             return res.redirect(url);
         }
           var newEdit = {
             enters:activity.enters
           };
         //create update object;
           var user = req.session.user;
           var enterUser = {
               name:user.name,
               sex:user.sex,
               experience:user.experience[0],
               telephone:user.telephone,
               email:user.email
           };
           newEdit.enters.push(enterUser);
           Activity.update(req.params.minute, req.params.title,newEdit, function (err) {
               if(err){
                   req.flash('error', '网络错误请重试!');
                   return res.redirect(url);
               }
               req.flash('success', '报名成功!');
               res.redirect(url);
           });
       });
    });

    //签到
    app.post('/activity/:minute/:title',function (req,res) {
       var signCode = req.body.signCode;
       var currentUser = req.session.user;
       console.log(signCode);
       var url = 'back';
       Activity.getOne(req.params.minute,req.params.title,function (err,activity) {
           if(err){
               req.flash('error','签到未成功，请重试！');
               return res.redirect(url);
           }

           if(signCode != activity.signCode){
               req.flash('error','签到码错误，请检查签到码！');
               return res.redirect(url);
           }
           var newEdit = {
               signs:activity.signs
           };
           //create update object;
           var user = req.session.user;
           var signUser = {
               name:user.name,
               sex:user.sex,
               experience:user.experience[0],
               telephone:user.telephone,
               email:user.email
           };
           newEdit.signs.push(signUser);
           Activity.update(req.params.minute,req.params.title,newEdit,function (err) {
               if(err){
                   req.flash('error','签到未成功，请重试！');
                   return res.redirect(url);
               }
               req.flash('success','签到成功！');
               res.redirect('back');
           })
       });
    });

    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
//生成密码的 md5 值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
//检查用户是否存在
        FormalUser.get(req.body.email, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在!');
                return res.redirect('/login');//用户不存在则跳转到登录页
            }
//检查密码是否一致
            if (user.password != password) {
                req.flash('error', '密码错误!');
                return res.redirect('/login');//密码错误则跳转到登录页
            }
//用户名密码都匹配后，将用户信息存入 session
            req.session.user = user;
            req.flash('success', '登陆成功!');
            res.redirect('/');//登陆成功后跳转到主页
        });
    });


    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {

        res.render('post', {
            title: '发表',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()

        });
    });


    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        var currentUser = req.session.user,
            tags = [req.body.tag1, req.body.tag2, req.body.tag3],
            newActivity = new Activity(req.body.title,  tags, req.body.content, req.body.actTime,req.body.signCode);
        newActivity.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功！');
            res.redirect('/');//发布成功跳转到主页
        });
    });

    app.get('/person',function (req,res) {
        var currentUser = req.session.user;
        res.render('person', {
            title:"个人信息",
            currentUser:currentUser,
            user: currentUser,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });

    app.get('/person/edit',function (req,res) {
        var user = req.session.user,
            experienceSum = user.experience.length,
            exp=[];
        for(var i = 0;i<experienceSum;i++){
            exp[i] = user.experience[i];
        }
        for(var i = experienceSum;i<4;i++){
            exp[i] = {
                experience:"",
                major:"",
                date:"",
                class:"",
                studentId:""
            }
        }
        console.log(experienceSum);
        res.render('personEdit', {
            title: '修改个人信息',
            sum:experienceSum,
            exp1:exp[0],
            exp2:exp[1],
            exp3:exp[2],
            exp4:exp[3],
            user: user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/person/edit',function (req,res) {
        var currentUser = req.session.user;
        var newEditUser = {
            name: req.body.name,
            sex: req.body.sex,
            experience:[],
            country: req.body.country,
            city: req.body.city,
            company: req.body.company,
            position: req.body.position,
            telephone: req.body.telephone,
            xiaoHui: req.body.xiaoHui,
            xPosition: req.body.xPosition,
        };
        var exp = ["undergraduate","master","doctor","postdoctor"];
        var unObj = {
            experience:"undergraduate",
            major:req.body.underMajor,
            date:req.body.underDate,
            class:req.body.underClass,
            studentId:req.body.underStudentID
        };
        var maObj = {
            experience:"master",
            major:req.body.masterMajor,
            date:req.body.masterDate,
            class:req.body.masterClass,
            studentId:req.body.masterStudentID
        };
        var doObj = {
            experience:"doctor",
            major:req.body.doctorMajor,
            date:req.body.doctorDate,
            class:req.body.doctorClass,
            studentId:req.body.doctorStudentID
        };
        var poObj = {
            experience:"postdoctor",
            major:req.body.postMajor,
            date:req.body.postDate,
            class:req.body.postClass,
            studentId:req.body.postStudentID
        };
        var ar = [unObj,maObj,doObj,poObj];

        for(var i = 0;i<4;i++){
            if(req.body.experience.indexOf(exp[i]) != -1){
                newEditUser.experience.push(ar[i]);
            }
        }
        for(var i in currentUser){
            if(newEditUser[i] == currentUser[i]){
                delete newEditUser[i];
                //console.log(i+"new:"+newEditUser[i]+"user:"+currentUser[i]);
            }
            if(i == "experience" && newEditUser[i].toString() == currentUser[i].toString()){
                delete newEditUser[i];
            }
            if(i == "activities" && newEditUser[i].toString() == currentUser[i].toString()){
                delete newEditUser[i];
            }

        }
        var isEmpty = true;
        for(var i in newEditUser){
            isEmpty = false;
            console.log(i+":"+newEditUser[i]);
        }
        if(newEditUser == false){
            FormalUser.update(currentUser.email,newEditUser,function (err) {
                if(err){
                    req.flash('error', err);
                    return res.redirect('/person/edit');//出错，返回
                }
                FormalUser.get(currentUser.email,function (err,user) {
                    if(err){
                        req.flash('error', err);
                        return res.redirect('/person/edit');
                    }
                    req.session.user = user;
                    req.flash('success', '修改成功！');
                    res.redirect('/person');
                });
            });
        }
        else {
            req.flash('success', '修改成功！');
            res.redirect('/person');
        }


    });

    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功!');
        res.redirect('/');//登出成功后跳转到主页
    });


    app.get('/upload', checkLogin);
    app.get('/upload', function (req, res) {
        res.render('upload', {
            title: '文件上传',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });


    app.post('/upload', checkLogin);
    app.post('/upload', function (req, res) {
        for (var i in req.files) {
            if (req.files[i].size == 0) {
                //使用同步方式删除一个文件
                fs.unlinkSync(req.files[i].path);
                console.log('Successfully removed an empty file!');
            } else {
                var target_path = './public/images/' + req.files[i].name;
                //使用同步方式重命名一个文件
                fs.renameSync(req.files[i].path, target_path);
                console.log('Successfully rename a files!');

            }
        }
        req.flash('success', '文件上传成功！');
        res.redirect('/upload');
    });


    app.get('/archive', function (req, res) {
        Post.getArchive(function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('archive', {
                title:'存档查看',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString(),
                helpers: {
                    showYear: function(index, options) {
                        if ((index == 0) || (posts[index].time.year != posts[index - 1].time.year))
                        {
                            return options.fn(this);
                        }
                    }
                }
            });
        });
    });

    app.get('/verify', function (req, res) {
        //判断是否是第一页，并把请求的页数转换成number类型
        console.log("verify");
        var page = req.query.p?parseInt(req.query.p):1;
        //查询并返回第page页的10篇文章
        console.log("page"+page);
        RegUser.getTen( page ,function (err, regUsers, total) {
            if (err) {
                posts = [];
                console.log("error");
            }
          //console.log("enter");
            console.log("regUser"+typeof regUsers);
            res.render('verify', {
                title: '验证用户',
                regUsers: regUsers,
                page :page,
                isFirstPage:(page-1)==0,
                isLastPage: ((page-1)*10+regUsers.length)==total,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString(),

            });
        });
    });

    app.get('/tags', function (req, res) {
        Post.getTags(function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags', {
                title: '标签',
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });


    app.get('/tags/:tag', function (req, res) {
        Post.getTag(req.params.tag, function (err, posts) {
            if (err) {
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('tag', {
                title: 'TAG:' + req.params.tag,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/search', function (req, res) {
        Post.search(req.query.keyword, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('search', {
                title:"SEARCH:" + req.query.keyword,
                posts:posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });


    app.get('/u/:name', function (req, res) {
        var page = req.query.p?parseInt(req.query.p):1;

        //检查用户是否存在
        User.get(req.params.name, function (err, user) {


        if (!user) {
            req.flash('error', '用户不存在！');
            return res.redirect('/');//用户不存在则跳转主页

        }
        //查询并返回该用户的所有文章
        Post.getTen(user.name,page, function (err, posts, total) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('user', {
                title: user.name,
                posts: posts,
                page:page,
                isFirstPage:(page-1)==0,
                isLastPage: ((page - 1) *10 + posts.length) == total,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
});


    app.get('/u/:name/:day/:title', function (req, res) {
        Post.getOne(req.params.name, req.params.day, req.params.title, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('article', {
                title: req.params.title,
                post :post,
                user: req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });

    app.get('/reg/:email', function (req, res) {
        RegUser.get(req.params.email, function (err, regUser) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('reguser', {
                title:req.params.email,
                regUser:regUser,
                user: req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });

    app.get('/reg/:email/edit',function (req,res) {
        RegUser.get(req.params.email,function (err,regUser) {
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            var user = regUser,
                experienceSum = user.experience.length,
                exp=[];
            for(var i = 0;i<experienceSum;i++){
                exp[i] = user.experience[i];
            }
            for(var i = experienceSum;i<4;i++){
                exp[i] = {
                    experience:"",
                    major:"",
                    date:"",
                    class:"",
                    studentId:""
                }
            }
            res.render('reguseredit',{
                title:'修改用户信息',
                regUser:regUser,
                sum:experienceSum,
                exp1:exp[0],
                exp2:exp[1],
                exp3:exp[2],
                exp4:exp[3],
                user: req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        })
    });

    app.post('/reg/:email/edit',function (req,res) {
        var url = '/reg/'+req.params.email+'/edit';
        RegUser.get(req.params.email,function (err,regUser) {
            if(err){
                req.flash('error',err);

                return res.redirect(url);
            }
            var currentUser = regUser;
            var newEditUser = {
                name: req.body.name,
                sex: req.body.sex,
                experience:[],
                country: req.body.country,
                city: req.body.city,
                company: req.body.company,
                position: req.body.position,
                telephone: req.body.telephone,
                xiaoHui: req.body.xiaoHui,
                xPosition: req.body.xPosition,
            };
            var exp = ["undergraduate","master","doctor","postdoctor"];
            var unObj = {
                experience:"undergraduate",
                major:req.body.underMajor,
                date:req.body.underDate,
                class:req.body.underClass,
                studentId:req.body.underStudentID
            };
            var maObj = {
                experience:"master",
                major:req.body.masterMajor,
                date:req.body.masterDate,
                class:req.body.masterClass,
                studentId:req.body.masterStudentID
            };
            var doObj = {
                experience:"doctor",
                major:req.body.doctorMajor,
                date:req.body.doctorDate,
                class:req.body.doctorClass,
                studentId:req.body.doctorStudentID
            };
            var poObj = {
                experience:"postdoctor",
                major:req.body.postMajor,
                date:req.body.postDate,
                class:req.body.postClass,
                studentId:req.body.postStudentID
            };
            var ar = [unObj,maObj,doObj,poObj];

            for(var i = 0;i<4;i++){
                if(req.body.experience.indexOf(exp[i]) != -1){
                    newEditUser.experience.push(ar[i]);
                }
            }
            for(var i in currentUser){
                if(newEditUser[i] == currentUser[i]){
                    delete newEditUser[i];
                    //console.log(i+"new:"+newEditUser[i]+"user:"+currentUser[i]);
                }
                if(i == "experience" && newEditUser[i].length == currentUser[i].length ){
                    var isChange = false;
                    for(var j = 0;j<newEditUser[i].length;j++){
                        for(var k in newEditUser[i][j]){
                            if(newEditUser[i][j][k] != currentUser[i][j][k]){
                                isChange = true;
                                j=4;
                                break;
                            }
                        }
                    }
                    if(!isChange){
                        delete newEditUser[i];
                    }
                }
            }
            var isEmpty = true;
            for(var i in newEditUser){
                isEmpty = false;
                console.log(i+":"+newEditUser[i]);
            }
            if(isEmpty == false){
                RegUser.update(req.params.email,newEditUser,function (err) {
                    if(err){
                        req.flash('error',err);
                        console.log(err);
                        return res.redirect(url);
                    }
                    req.flash('success','修改成功！');
                    res.redirect('/reg/'+req.params.email);
                });
            }
            else {
                req.flash('success','您未作修改！');
                res.redirect('/reg/'+req.params.email);
            }

        });
    });

    app.post('/u/:name/:day/:title', function (req, res) {
        var date = new Date(),
            time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + "" +date.getHours() + ":" + (date.getMinutes()<10?'0' + date.getMinutes():date.getMinutes());
        var md5 = crypto.createHash('md5'),
            email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
            head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
        var comment = {
            name: req.body.name,
            head: head,
            email: req.body.email,
            website: req.body.website,
            time : time,
            content : req.body.content
        };
        var newComment = new Comment(req.params.name, req.params.day, req.params.title,comment);
        newComment.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '留言成功！');
            res.redirect('back');
        });
    });

    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.edit(currentUser.name, req.params.day, req.params.title, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            res.render('edit', {
                title: '编辑',
                post:post,
                user:req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/activity/:minute/:title/edit',function (req,res) {
       Activity.edit(req.params.minute,req.params.title,function (err,activity) {
           if(err){
               req.flash('error', err);
               return res.redirect('back');
           }
           res.render('activityEdit',{
               title:"活动修改",
               activity:activity,
               user:req.session.user,
               success: req.flash('success').toString(),
               error: req.flash('error').toString()
           })
       });
    });


    app.get('/regRemove/:email',function (req,res) {
        RegUser.remove(req.params.email,function (err) {
            if (err) {
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','删除成功！');
            res.redirect('/verify');
        });
    });

    app.get('/activityRemove/:minute/:title',function (req,res) {
       Activity.remove(req.params.minute,req.params.title,function (err) {
           if(err){
               req.flash('error',err);
               return res.redirect('back');
           }
           req.flash('success','删除成功！');
           res.redirect('/');
       }) ;
    });

    app.get('/regAdd/:email',function (req,res) {
        RegUser.get(req.params.email,function (err,user) {
            if (err) {
                req.flash('error',err);
                return res.redirect('back');
            }
            var newFormalUser = new FormalUser(user);

            newFormalUser.save(function (err, user) {
                if (err) {
                    req.flash('error', err);
                    console.log("error");
                    return res.redirect('/reg');//注册失败返回主册页
                }
                RegUser.remove(req.params.email,function (err) {
                    if (err) {
                        req.flash('error',err);
                        return res.redirect('back');
                    }
                    req.flash('success','添加成功！');
                    res.redirect('/verify');
                });

            });
        });
    });

    app.post('/edit/:name/:day/:title',checkLogin);
    app.post('/edit/:name/:day/:title',function (req, res) {
        var currentUser = req.session.user;
        Post.update(currentUser.name, req.params.day, req.params.title, req.body.post, function (err) {
            var url = '/u/' + req.params.name +'/' + req.params.day + '/' +  req.params.title;
            if (err) {
                req.flash('error', err);
                return res.redirect(url);//出错，返回文章

            }
            req.flash('success', '修改成功');
            res.redirect(url);//成功！返回文章页
        });
    });

    app.post('/activity/:minute/:title/edit',function (req,res) {
        var newEdit = {
            signCode:req.body.signCode,
            actTime:req.body.actTime,
            content:req.body.content
        };
        var url = 'back';
        console.log(url);
       Activity.update(req.params.minute,req.params.title,newEdit,function (err) {
            if(err){
                req.flash('error', "修改失败！");
                return res.redirect(url);
            }
           req.flash('success', "修改成功！");
           res.redirect('../');
       });
    });

    app.get('/remove/:name/:day/:title', checkLogin);
    app.get('/remove/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.day, req.params.title, function (err) {
            if (err) {
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','删除成功！');
            res.redirect('/');
        });
    });



    app.get('/reprint/:name/:day/:title', checkLogin);
    app.get('/reprint/:name/:day/:title', function (req, res) {
        Post.edit(req.params.name, req.params.day, req.params.title, function (err, post)
        {
            if (err) {
                req.flash('error', err);
                return res.redirect(back);
            }
            var currentUser = req.session.user,
                reprint_from = {name: post.name, day: post.time.day, title: post.title},
                reprint_to = {name: currentUser.name, head: currentUser.head};
            Post.reprint(reprint_from, reprint_to, function (err, post) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('back');
                }
                req.flash('success', '转载成功!');
                var url = '/u/' + post.name + '/' + post.time.day + '/' + post.title;
//跳转到转载后的文章页面
                res.redirect(url);

            });
        });
    });

    /*
    app.use(function (req, res) {
        res.render("404");
    });
    */

    function checkLogin(req,res,next) {
      //  console.log(req.session.user);
        if (!req.session.user) {
            req.flash('error','未登录！');
            res.redirect('/login');
        }
        next();
    }
    function checkNotLogin(req,res,next) {
        if (req.session.user) {
            req.flash('error','已登录！');
            res.redirect('back');
        }
        next();
    }


};
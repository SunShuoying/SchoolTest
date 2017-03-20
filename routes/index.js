
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
    Comment = require('../models/comment.js');
var exphbs = require('express3-handlebars');
var querystring = require('querystring');
var http = require('http');

var url;
var sigt;
var sigu;
var cookies = '';
var cookie = '';

module.exports=function(app) {
    /*app.get('/',function (req,res){
     res.render('index',{title:'Express'});
     });*/


    app.get('/', function (req, res) {
        //判断是否是第一页，并把请求的页数转换成number类型
        var page = req.query.p?parseInt(req.query.p):1;
        //查询并返回第page页的10篇文章
        Post.getTen(null, page ,function (err, posts, total) {
            if (err) {
                posts = [];
            }

            res.render('index', {
                title: '主页',
                posts: posts,
                page :page,
                isFirstPage:(page-1)==0,
                isLastPage: ((page-1)*10+posts.length)==total,
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
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];
//检验用户两次输入的密码是否一致
        if (password_re != password) {
            req.flash('error', '两次输入的密码不一致!');
            return res.redirect('/reg');//返回注册页
        }
//生成密码的 md5 值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
        var newUser = new User({
            name: req.body.name,

            password: password,
            email: req.body.email
        });
//检查用户名是否已经存在
        User.get(newUser.name, function (err, user) {
            if (user) {
                req.flash('error', '用户已存在!');
                return res.redirect('/reg');//返回注册页
            }
//如果不存在则新增用户
            newUser.save(function (err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');//注册失败返回主册页
                }
                req.session.user = user;//用户信息存入 session
                req.flash('success', '注册成功!');
                res.redirect('/');//注册成功后返回主页
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


    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
//生成密码的 md5 值
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('hex');
//检查用户是否存在
        User.get(req.body.name, function (err, user) {
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
            post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
        post.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功！');
            res.redirect('/');//发布成功跳转到主页
        });
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
                title:'存档',
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



    app.get('/links', function (req, res) {
        res.render('links', {
            title:'友情链接',
            user:req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
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


    app.get('/chats',function (req, res1) {
        var header={};
        var filedata = '';

        var options1 = {
            hostname: 'wpa.qq.com',
            port: 80,
            path:'/msgrd?v=3&uin=2472740498&site=qq&menu=yes',
            method: 'GET',
            rejectUnauthorized:false,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36',
                'Connection': 'keep-alive'
            }
        };
        var req1 = http.request(options1, function(res) {
            console.log('STATUS: ' + res.statusCode);
            header=JSON.stringify(res.headers);
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                filedata += chunk;
            });
            res.on('end',function() {
                console.log('No more data in response.');
                var reg = /tencentSeries\s*=\s*("|')([^"]+?)\1/g;
                var tencentSeries = reg.exec(filedata)[2];
                console.log(tencentSeries);
                sigt = tencentSeries.replace(/^\S+sigT=/g, "").replace(/&\S+$/g, "");
                var str = sigt.substr(0, sigt.indexOf('s'));
                sigt = str.substring(0,str.length - 6);
                sigu = tencentSeries.replace(/^\S+sigU=/g, "").replace(/&\S+$/g, "");
                console.log("sigt:"+sigt);
                console.log("sigu:"+sigu);
                url="/widget/wpa/chat.html?tuin=2472740498&sigT="+sigt+"&sigU="+sigu;
                res1.redirect('/chats2');
               // res1.redirect('http://connect.qq.com/widget/wpa/chat.html?tuin=2472740498&sigT='+sigt+"&sigU="+sigu);
                //var data0='';
               /* fs.writeFile('e:/blog/views/qq.html', data0, function (err) {
                    if (!err) {
                        console.log('Wrote data0 to qq.ejs');
                    } else {
                        throw err;
                    }
                });
*/
            });
        });

        req1.on('error', function(e) {
            console.log('problem with request: ' + e.message);
        });
//        req1.write({});
        req1.end();

    });

    app.get('/chats2',function (req, res1) {
        var header = {};

        //    var sigt='1fbc805af2d1d88f764e707955d921a25bcd35c6ed4bedcb2ed5c0bed140e4bf0790bd3b5fd2156cd8359c71c6119397';
        //   var sigu='2613fc2c0ef7457f3a1d8f588ec0aa8e283550b0e8677aba9840ded3c6e4671ffc03fad25ca4c4dd';
        var user = querystring.stringify({
            'u': '2183573656',
            'p': '18232577982'

        });

        var options1 = {
            hostname: 'ui.ptlogin2.qq.com',
            port: 80,
            path: '/cgi-bin/login?appid=716027604&style=12&dummy=1&s_url=http%3A%2F%2Fconnect.qq.com%2Fwidget%2Fwpa%2Fchat.html%3Ftuin%3D2472740498%26sigT%3D' + sigt + '%26sigU%3D' + sigu,
            method: 'GET',
            rejectUnauthorized: false,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36',
                'Connection': 'keep-alive',
                //'Cookie': cookie,
                'Content-Length': user.length
            }
        };

        var req1 = http.request(options1, function (res) {
            console.log('STATUS: ' + res.statusCode);
            header = JSON.stringify(res.headers);
            console.log('HEADERS: ' + header);
//console.log('WEBFORMS: ' + JSON.stringify(res.WebForms));
            cookie = (JSON.parse(header)['set-cookie']);
            console.log(cookie);
            console.log('-------------------------------');
            for (x in cookie) {
                cookies += (cookie[x]).split(";")[0] + '; ';
                //console.log(cookies);
                //cookies=cookie[0]
            }
            cookies = cookies.substring(0, cookies.length - 2);
            console.log(cookies);
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log('BODY:' + chunk);
              /*  fs.appendFile('file.js', chunk, function (err) {

                    if (!err) {
                        console.log('Wrote data to file.txt');
                    } else {
                        throw err;
                    }
                });*/


            });
            res.on('end', function () {
                console.log('No more data in response.');
                res1.redirect('/chats3');
            })
        });

        req1.on('error', function (e) {
            console.log('problem with request: ' + e.message);
        });

        req1.write(user);
//req1.write(hello);
        req1.end();
    });
    app.get('/chats3',function (req, res1) {
        var header={};
        var hello = querystring.stringify({
            'u' : '2183573656',
            'p' : '18232577982'
        });
        var options2 = {
            hostname: 'connect.qq.com',
            port: 80,
            path:url,
            method: 'GET',
            rejectUnauthorized:false,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36',
                'Connection': 'keep-alive',
                //'Cookie': 'ptui_loginuin=1404563299; pt2gguin=o1404563299; uin=o1404563299; skey=@DyVWF8E5a; ptisp=edu; RK=T9vO0DXGey; ptcz=ffd4352d2b5fe2f4a2ec272ee7bdf2a79d29c33a5230ddaf79fc7ef7a8b3121b'
                'Cookie':cookies

            }
        };
        var req2 = http.request(options2, function(res) {
            console.log('STATUS: ' + res.statusCode);
            header=JSON.stringify(res.headers);
            console.log('HEADERS: ' + header);
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
console.log('BODY:'+chunk);
             /* fs.appendFile('e:/blog/views/qq.html', chunk, function (err) {
                    if (!err) {
                        console.log('Wrote chunk to file.txt');
                    } else {
                        throw err;
                    }
                });*/


            });
            res.on('end',function() {
                console.log('No more data in response.');
               // res1.render('qq', {});
               res1.redirect('/chatting');
               //res1.redirect('http://connect.qq.com/widget/wpa/chat.html?tuin=2472740498&sigT='+sigt+"&sigU="+sigu);
               // res1.redirect('/chats3');
            })
        });
        req2.on('error', function(e) {
            console.log('problem with request: ' + e.message);
        });
        req2.write(hello);
        req2.end();
    });


    app.get('/chatting',function(req,res){
        res.render("qq",{
            className:"className",
            nick:"nick",
            time:"time",
            msg:"kuaijiyihao"

        });

    })

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


    app.use(function (req, res) {
        res.render("404");
    });


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
var express = require('express');
var router = express.Router();
const conn = require('../db/db');
const svgCaptcha = require('svg-captcha');
const sms_util = require('../util/sms_util');
const md5 = require('blueimp-md5');

let user = {};

/* 用户相关 */

//一次性图形验证码
router.get('/captcha', (req, res) => {
  let captcha = svgCaptcha.create({
    color: true,
    noise: 2,
    ignoreChars: 'Ooli',
    size: 4
  });
  //存储
  req.session.captcha = captcha.text.toLocaleLowerCase();
  //返回
  res.type('svg');
  res.send(captcha.data);
});

//获取短信验证码
router.get('/send_code', (req, res) => {
  let phone = req.query.phone;
  let code = sms_util.randomCode(6);
  // sms_util.sendCode(phone, code, function (success) {
  //     if (success) {
  //         user.phone = code;
  //         res.json({ success_code: 200, data: code })
  //     } else {
  //         res.json({ err_code: 0, data: '验证码获取失败' })
  //     }
  // })

  //成功
  user[phone] = code;
  res.json({ success_code: 200, data: code })

  //失败
  /* setTimeout(() => {
      res.json({ err_code: 0, data: '验证码获取失败' })
  }, 2000); */
});

//手机登录登录
router.post('/login_code', (req, res) => {
  const phone = req.body.phone;
  const code = req.body.code;
  let sql = 'SELECT * FROM user_info WHERE user_phone = ? LIMIT 1';
  let data = conn.query(sql, [phone], (error, results, fields) => {
    if (error) throw error;
    if (results.length) { //已存在
      results = JSON.parse(JSON.stringify(results))
      req.session.userId = results[0].id;
      res.json({
        success_code: 200,
        data: {
          id: req.session.userId,
          user_name: results[0]['user_name'],
          user_phone: results[0]['user_phone']
        }
      })
    } else { //新用户(用户名是phone)
      let addSql = 'INSERT INTO user_info(user_name, user_phone) VALUES (?, ?)';
      conn.query(addSql, [phone, phone], (err, results) => {
        if (err) throw error;
        results = JSON.parse(JSON.stringigy(results));
        let sql = 'SELECT * FROM user_info WHERE id = ? LIMIT 1';
        conn.query(sql, [results.insertId], (err, results) => {
          req.session.usrId = results.insertId;
          results = JSON.parse(JSON.stringigy(results));
          res.json({
            success_code: 200, data: {
              id: req.session.usrId,
              user_name: results[0]['user_name'],
              user_phone: results[0]['user_phone']
            }
          })
        })
      })
    }
  })
});

//有户名密码登录
router.post('/login_pwd', (req, res) => {
  const user_name = req.body.name;
  const user_pwd = md5(req.body.pwd);
  const captcha = req.body.captcha.toLocaleLowerCase();

  if (captcha !== req.session.captcha) {
    res.json({
      err_code: 0,
      data: '图形验证码错误'
    })
    return;
  }
  delete req.session.captcha;
  let sql = 'SELECT * FROM user_info WHERE user_name = ? LIMIT 1';
  let data = conn.query(sql, [user_name], (error, results, fields) => {
    if (error) throw error;
    if (results.length) { //已存在
      results = JSON.parse(JSON.stringify(results))
      if (results[0].user_pwd !== user_pwd) {
        res.json({
          err_code: 0,
          data: '密码不正确'
        })
      } else {
        req.session.userId = results[0].id;
        res.json({
          success_code: 200,
          data: {
            id: req.session.usrId,
            user_name: results[0]['user_name'],
            user_phone: results[0]['user_phone']
          }
        })
      }
    } else { //新用户
      let addSql = 'INSERT INTO user_info(`user_name`,`user_pwd`) VALUES(?,?)';
      conn.query(addSql, [user_name, user_pwd], (err, results) => {
        if (err) throw err;
        results = JSON.parse(JSON.stringify(results));
        let sql = 'SELECT * FROM user_info WHERE id = ? LIMIT 1';
        conn.query(sql, [results.insertId], (err, results) => {
          results = JSON.parse(JSON.stringify(results));
          if (err) {
            res.json({
              err_code: 0,
              data: '请求失败'
            })
          } else {
            req.session.userId = results[0].id;
            res.json({
              success_code: 200, data: {
                id: results[0].id,
                user_name: results[0]['user_name'],
                user_phone: results[0]['user_phone']
              }
            })
          }
        })
      })
    }
  })
  console.log(req.session);
});

//根据用户id获取用户信息
router.get('/user_info', (req, res) => {
  let userId = req.session.userId;
  let sql = 'SELECT `id`,`user_name`,`user_phone`,`user_sex`,`user_address`,`user_birthday`,`user_sign` FROM user_info WHERE id = ? LIMIT 1';
  conn.query(sql, [userId], (err, results) => {
    results = JSON.parse(JSON.stringify(results));
    if (err) {
      res.json({
        err_code: 0,
        data: '请求失败'
      })
    } else {
      if (results.length) {
        res.json({
          success_code: 200, data: results[0]
        })
      } else {
        delete req.session.userId;
        res.json({
          err_code: 1,
          data: '请登录'
        })
      }
    }
  })
});


//登出
router.get('/logout', (req, res) => {
  delete req.session.userId;
  res.json({
    success_code: 200,
    data: '退出成功'
  })
});

//修改用户信息
router.post('/change_user_info', (req, res) => {
  let id = req.body.user_id;
  let user_sex = req.body.user_sex || '';
  let user_address = req.body.user_address || '';
  let user_birthday = req.body.user_birthday || '';
  let user_sign = req.body.user_sign || '';

  if (!id) {
    res.json({
      err_code: 3,
      data: '修改用户信息失败'
    })
  } else {
    let sql = 'UPDATE user_info SET user_sex=?, user_address=?, user_birthday=?, user_sign=? WHERE id=' + id;
    conn.query(sql, [user_sex, user_address, user_birthday, user_sign], (err, results) => {
      if (err) {
        res.json({
          err_code: 0,
          data: '请求失败'
        })
      } else {
        res.json({
          success_code: 200, data: '修改信息成功'
        })
      }
    })
  }
});



module.exports = router;

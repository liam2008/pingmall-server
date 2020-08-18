const express = require('express');
const router = express.Router();
const conn = require('../db/db');
const sqlUtils = require('../util/sql');
const { log } = require('debug');

/**
 * 获取首页轮播图
 */
router.get('/homecasual', (req, res) => {
    // const data = require('../data/homecasual');
    let sql = 'SELECT * FROM homecasual';
    let data = conn.query(sql, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                data: '请求失败'
            })
        } else {
            res.json({
                success_code: 200,
                data: results
            })
        }
    })
    // res.json({success_code: 200, data: data})
});


/**
 * 获取首页导航
 */
router.get('/homenav', (req, res) => {
    /*
    let sqlStr = 'select * from homenav';
     conn.query(sqlStr, (err, results) => {
         if (err) return res.json({err_code: 1, data: '资料不存在', affextedRows: 0})
         res.json({success_code: 200, data: results, affextedRows: results.affextedRows})
     })
     */
    const data = require('../data/homenav');
    res.json({ success_code: 200, data: data });
});

/**
 * 获取首页商品列表
 */
router.get('/homeshoplist', (req, res) => {
    /*
   let sqlStr = 'select * from homeshoplist';
    conn.query(sqlStr, (err, results) => {
        if (err) return res.json({err_code: 1, data: '资料不存在', affextedRows: 0})
        res.json({success_code: 200, data: results, affextedRows: results.affextedRows})
    })
    */
    setTimeout(function () {
        const data = require('../data/shopList');
        res.json({ success_code: 200, data })
    }, 300);
});

/**
 * 获取推荐商品列表
 */
router.get('/recommendshoplist', (req, res) => {
    let curpage = req.query.page || 1;
    let pageSize = req.query.pageSize || 20;

    let sql = `SELECT * FROM recommend LIMIT ${(curpage - 1) * pageSize},${pageSize}`;

    let data = conn.query(sql, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                data: '请求失败'
            })
        } else {
            setTimeout(() => {
                res.json({
                    success_code: 200,
                    data: results
                })
            }, 500);
        }
    })
});

/**
 * 获取推荐商品列表拼单用户
 */
router.get('/recommenduser', (req, res) => {
    setTimeout(function () {
        const data = require('../data/recommend_users');
        res.json({ success_code: 200, data })
    }, 10);
});

/**
 * 获取搜索分类列表
 */
router.get('/searchgoods', (req, res) => {
    setTimeout(function () {
        const data = require('../data/search');
        res.json({ success_code: 200, data })
    }, 10);
});

/* 购物车 */
//添加商品购物车
router.post('/add_shop_cart', (req, res) => {
    let user_id = req.body.user_id;
    if (!user_id) {
        res.json({
            err_code: 1,
            data: '请登录'
        })
    }
    let goods_id = req.body.goods_id;
    let goods_name = req.body.goods_name;
    let thumb_url = req.body.thumb_url;
    let price = req.body.price;
    let buy_count = 1;
    let is_pay = req.body.is_pay || 0;

    let sql = `SELECT * FROM user_cart WHERE user_id = ${user_id} AND  goods_id = ${goods_id}`;
    conn.query(sql, (error, results, fields) => {
        if (error) {
            res.json({
                err_code: 0,
                data: error
            })
        } else {
            results = JSON.parse(JSON.stringify(results))
            if (results[0]) {//存在
                buy_count = results[0]['buy_count'] + 1
                let addCountSql = `UPDATE user_cart SET buy_count=${buy_count} WHERE goods_id=${goods_id}`
                conn.query(addCountSql, (error, results, fields) => {
                    if (error) {
                        res.json({
                            err_code: 0,
                            data: error
                        })
                    } else {
                        res.json({
                            success_code: 200,
                            data: '购物车添加成功'
                        })
                    }
                })
            } else {
                let addCartSql = 'INSERT IGNORE INTO cart(`goods_id`, `goods_name`,`thumb_url`,`price`) VALUES (?,?,?,?)'
                let addUserCartSql = 'INSERT INTO user_cart(`user_id`, `goods_id`,`buy_count`,`is_pay`) SELECT ?,?,?,? FROM DUAL WHERE NOT EXISTS(SELECT * FROM user_cart WHERE user_id = ? AND goods_id = ?)'
                let cartParams = [goods_id, goods_name, thumb_url, price];
                let userCartParams = [user_id, goods_id, buy_count, is_pay, user_id, goods_id];
                sqlUtils.execTrans([
                    {
                        sql: addCartSql,
                        values: cartParams
                    },
                    {
                        sql: addUserCartSql,
                        values: userCartParams
                    }
                ]).then((result) => {
                    if (result.status === 0) {
                        res.json({
                            success_code: 200,
                            data: '购物车添加成功'
                        })
                    } else {
                        res.json({
                            err_code: 4,
                            data: '购物车购物车失败'
                        })
                    }
                });
            }
        }
    })
});

router.get('/user_cart_goods', (req, res) => {
    let user_id = req.session.userId;
    if (!user_id) {
        res.json({
            err_code: 1,
            data: '请登录'
        })
    } else {
        let sql = 'SELECT * FROM user_cart INNER JOIN cart ON (user_cart.goods_id = cart.goods_id) WHERE user_cart.user_id=' + user_id;

        let data = conn.query(sql, (error, results, fields) => {
            if (error) {
                res.json({
                    err_code: 0,
                    data: '请求失败'
                })
            } else {
                res.json({
                    success_code: 200,
                    data: results
                })
            }
        })
    }
});

module.exports = router;

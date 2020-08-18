const pool = require('../db/pool');
const { log } = require('debug');


//多个sql 执行 sql_list:[{sql:'xxx',values:[xxx]}]
let execTrans = async function (sql_list) {
    let status = 0
    let msg = ''
    return new Promise((resolve, reject) => {
        pool.getConnection(function (err, connection) {
            let results = [];
            if (err) {
                reject(err)
            } else {
                connection.beginTransaction()
                for (let one in sql_list) {
                    if (sql_list.hasOwnProperty(one)) {
                        let sql = sql_list[one].sql
                        let values = sql_list[one].values
                        console.log('sql: ', sql)
                        connection.query(sql, values, (err, res) => {
                            if (err) {
                                connection.rollback()
                                console.log('-------------------------Error, exec rollback-------------------------')
                                resolve({
                                    status: 2001,
                                    msg: err
                                })
                                console.log(err);
                            } else {
                                console.log('this sql success!',res)
                            }
                        })
                    }
                }
                connection.commit()
                console.log('exec commit!')
                connection.release()
            }
            resolve({
                status,
                msg,
                results
            })
        });
    })
}

module.exports = {
    execTrans
}
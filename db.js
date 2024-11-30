const { Pool } = require('pg')

const pool = new Pool(
    {
        host: 'db',
        port: 5432,
        user: 'user123',
        password: 'pass123',
        database: 'db123'
    }
)

module.exports = pool
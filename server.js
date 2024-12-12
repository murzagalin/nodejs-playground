const express = require('express')
const amqplib = require('amqplib');

const pool = require('./db')
const port = 3000

const amqpUrl = 'amqp://guest:guest@rabbitmq';
let connection;
let channel;
const exchange = 'user.signed_up';
const queue = 'user.sign_up_name';
const routingKey = 'sign_up_name';

(async () => {
    connection = await amqplib.connect(amqpUrl, 'heartbeat=60');
    channel = await connection.createChannel();
    
    await channel.assertExchange(exchange, 'direct', {durable: true});
    await channel.assertQueue(queue, {durable: true});
    await channel.bindQueue(queue, exchange, routingKey);
})();

const app = express()
app.use(express.json())

//routes
app.get('/', async (req, res) => {
    try {
        const data = await pool.query('SELECT * FROM schools')
        res.status(200).send(data.rows)
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.post('/', async (req, res) => {
    const { name, location } = req.body

    try {
        
        try {
            console.log('Saving to db');
            await pool.query('INSERT INTO schools(name, address) VALUES ($1, $2)', [name, location] )
            console.log('Publishing');
            const msg = {'id': Math.floor(Math.random() * 1000), 'name': name };
            await channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(msg)), {persistent: true});
            console.log('Message published');
        } catch(e) {
            console.error('Error in publishing message', e);
        } 

        res.status(200).send({
            message: "Successfuly added a child"
        })
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.get('/setup', async (req, res) => {
    try {
        await pool.query('CREATE TABLE schools( id SERIAL PRIMARY KEY, name VARCHAR(100), address VARCHAR(100) )')
        res.status(200).send({
            message: "Successfuly set the table up"
        })
    } catch (err) {
        console.log(err)
        res.sendStatus(500)
    }
})

app.listen(port, () => console.log(`Server started on port ${port}`))
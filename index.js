const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const port = process.env.PORT || 5000;



const app = express()

//Middleware>>>>
app.use(cors());
app.use(express.json());






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wtcs29q.mongodb.net/?retryWrites=true&w=majority`;
// console.log(uri);
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


  // Verifyjwt >>>>>>>>
  function verifyJWT(req, res, next){
    // console.log('token inside verifyJWT', req.headers.authorization);
    const authHeader = req.headers.authorization;
    if(!authHeader){
      return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
      if(err){
        return res.status(403).send({message: 'forbidden access'})
      }
      req.decoded = decoded;
      next();
    })

      
  }



async function run() {
  try{
    const categoryCollection = client.db('finalProjectDB').collection('categorys');

    const categoryItemCollection = client.db('finalProjectDB').collection('newItems');

    const bookingsCollection = client.db('finalProjectDB').collection('bookings');

    const usersCollection = client.db('finalProjectDB').collection('users');

    const productsCollection = client.db('finalProjectDB').collection('products');


    // NOTE: make sure you use verifyAdmin after verifyJWT
    const verifyAdmin = async (req, res, next) => {
      const query = {email: decodedEmail};
      const user  = await usersCollection.findOne(query);

      if(user?.role !== 'admin'){
        return res.status(403).send({message: 'forbidden access'})
      }
      next()
    }


    app.get('/category', async(req, res) => {
      const query = {}
      const category = await categoryCollection.find(query).toArray()
      res.send(category)
    })

    app.get('/bookings/:id', async(req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id)};
      const booking = await bookingsCollection.findOne(query);
      res.send(booking);
    })


    // Get booking data in booking collections >>>
    app.get('/bookings', verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;

      if(email !== decodedEmail){
        return res.status(403).send({message: 'forbidden access'});
      }

      const query = {email: email};
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    })

    //API SET FOR BOOKING COLLECTIONS>>>>>>>>>
    app.post('/bookings', async (req, res) => {
      const booking = req.body
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    })


    // User get operation >>
    app.get('/jwt', async(req, res) => {
      const email = req.query.email;
      const query = {email: email};
      const user = await usersCollection.findOne(query);
      if(user){
        const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'})
        return res.send({accessToken: token})
      }
      // console.log(user);
      res.status(403).send({accessToken: ''})
    })



    app.get('/users', async(req, res) => {
      const query = {};
      const users = await usersCollection.find(query).toArray();
      res.send(users);
    })



    //===================================
    // eta diye admin cheked kora hocche
    // er vabe chaile user delete o korte parbo
    //=====================================
    app.get('/users/admin/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email }
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === 'admin' });
    })


// seller checking
//==========================
    app.get('/users/seller/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email }
      const user = await usersCollection.findOne(query);
      res.send({ isSeller: user?.role === 'seller' });
    })








    //All user Collection code here>>>>
    app.post('/users', async(req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })






    // Admin set ++++++++++++
    app.put('/users/admin/:id', verifyJWT, async (req, res) => {
      
      const decodedEmail = req.decoded.email;
      const query = {email: decodedEmail};
      const user  = await usersCollection.findOne(query);

      if(user?.role !== 'admin'){
        return res.status(403).send({message: 'forbidden access'})
      }



      const id = req.params.id;
      const filter = { _id: ObjectId(id) }
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    });


    // special data load for category item =======
    app.get('/productSpecialty', async(req, res)=> {
      const query = {}
      const result = await categoryCollection.find(query).project({name: 1}).toArray()
      res.send(result);
    })


    app.get('/products/category/::id', async(req, res) => {
      const id = req.params.id;
      const query = { category_id: id}

      if(id === "05"){
        const quary = {}
        const course = await categoryItemCollection.find(quary).toArray();
        res.send(course);
      }
      else{
        const course = await categoryItemCollection.find(query).toArray();
        res.send(course);

      }


    })







    // Delete Products >>>>>>
    //==========================
    app.delete('/users/admin/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id)};
      const result = await usersCollection.deleteOne(filter);
      res.send(result)
    })

    // Delete Products >>>>>>
    //==========================   //chenge
    app.delete('/products/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id)};
      const result = await productsCollection.deleteOne(filter);
      res.send(result)
    })


                  //chenge
    app.get('/products', verifyJWT, async(req, res) => {
      const query = {};
      const products = await productsCollection.find(query).toArray();
      res.send(products)
    })
                         //chenge
    app.post('/products', verifyJWT, async(req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    })






    
    // Payment system code >>>>>
    //==============================
    app.post('/create-payment-intent', async (req, res) => {
      const booking = req.body;
      const price = booking.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: 'usd',
        amount: amount,
        "payment_method_types": [
          "card"
        ]
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });


    // app.post('/payments', async (req, res) => {
    //   const payment = req.body;
    //   const result = await paymentsCollection.insertOne(payment);
    //   const id = payment.bookingId
    //   const filter = { _id: ObjectId(id) }
    //   const updatedDoc = {
    //     $set: {
    //       paid: true,
    //       transactionId: payment.transactionId
    //     }
    //   }
    //   const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc)
    //   res.send(result);
    // })



  }
  finally{

  }
}


run().catch(console.log)





app.get('/', (req, res) => {
  res.send('final project server in running');
})

app.listen(port, () => {
  console.log(`final project running on port ${port}`)
})
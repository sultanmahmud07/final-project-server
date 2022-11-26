const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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




    app.get('/category', async(req, res) => {
      const query = {}
      const category = await categoryCollection.find(query).toArray()
      res.send(category)
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



    //========================================
    //I am trying to  User delete in database
    //=======================================
    app.put('/users/admin/:id', async(req, res) =>{
      const id =req.params.id;
      const query = { _id: ObjectId(id)}
      const result = await usersCollection.deleteOne(query);
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





    // app.get('/category/:id', async(req, res) => {
    //   const id = req.params.id;
    //   const query = { category_id: id}

    //   if(id === "05"){
    //     const quary = {}
    //     const course = await categoryItemCollection.find(quary).toArray();
    //     res.send(course);
    //   }
    //   else{
    //     const course = await categoryItemCollection.findOne(query);
    //     res.send(course);

    //   }


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
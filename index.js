const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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


async function run() {
  try{
    const categoryCollection = client.db('finalProjectDB').collection('categorys');

    const categoryItemCollection = client.db('finalProjectDB').collection('newItems');


    app.get('/category', async(req, res) => {
      const query = {}
      const category = await categoryCollection.find(query).toArray()
      res.send(category)
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
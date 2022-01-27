const express = require("express");
const mongodb = require("mongodb");
const cors = require("cors");
const path = require("path");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const ObjectId = require("mongodb").ObjectId;
const fileUpload = require("express-fileupload");
const upload = require("./utils/multer");
const cloudinary = require("./utils/cloudinary");
const fs = require("fs");
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const stripe = require('stripe')(process.env.STRIPE_SECRET)
//file upload start
// app.use(fileUpload());
//file upload end
const port = process.env.PORT || 3001;

//mongodb connection
const uri = process.env.MONGO_CONNECTION;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// for cors problem 


// app.use(express.static(path.join(__dirname, 'uploads')));

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    // Establish and verify connection
    // await client.db("admin").command({ ping: 1 });
    console.log("database connected successfully");
    const database = client.db("travel-blog");

    /* all  collection start*/
    const allUsersCollection = database.collection("user");
    const allBlogsCollection = database.collection("blog");
    
    //   all collection end
    //   receiving client info
    app.post("/register", async (req, res) => {
      const client = { ...req.body, role: "user" };
      console.log(client);
      const result = await allUsersCollection.insertOne(client);
      res.json(result);
    });



    // get all user api //
    app.get("/user", async (req, res) => {
      const cursor = allUsersCollection.find({});
      const user = await cursor.toArray();

      res.json(user);
    });
    // all blogs api 
        // GET Blog API
        app.get("/blogs", async (req, res) => {
          console.log(req.query);
          const cursor = allBlogsCollection.find({});
          const page = req.query.page;
          const size = parseInt(req.query.size);
          const count = await cursor.count();
          let blogs;
          if (page) {
            blogs = await cursor
              .skip(page * size)
              .limit(size)
              .toArray();
          } else {
            blogs = await cursor.toArray();
          }
    
          res.send({
            count,
            blogs,
          });
        });
    
        // POST API
        app.post("/blogs", async (req, res) => {
          const blogs = req.body;
          const result = await allBlogsCollection.insertOne(blogs);
          res.json(result);
        });
        app.get("/blogs/:id", async (req, res) => {
          const id = req.params.id;
          const query = { _id: ObjectId(id) };
          const singleBlogDetails = await allBlogsCollection.findOne(query);
          res.json(singleBlogDetails);
        });
 
  
    //                       get single advocate api                       //

    // file upload api start
    app.post("/addblog", upload.single("image"), async (req, res) => {
      const uploader = async (path) => await cloudinary.uploads(path, "images");
      const newPath = await uploader(req.file.path);
      fs.unlinkSync(req.file.path);
      console.log(req.body);
      const {name, title, description, price, location, category,travelarInfo} = req.body

     /*heroku login
heroku create
git push heroku main 
click heroku icon 
select your project 
-> settings
set env variable 
continue git push heroku main*/


      const blog = {
        name, title, description, price, location, category,travelarInfo,
        image: newPath.url,
       
      };
      const result = await allBlogsCollection.insertOne(blog);
      res.json(result);
    });
  
    // role update to make advocate
    app.put('/roleupdate/:id', async (req, res) => {
      const filter = { _id: ObjectId(req.params.id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          role: req.body.role
        },
      };
      const result = await advocatesCollection.updateOne(filter, updateDoc, options);
      const data = await allUsersCollection.updateOne(filter, updateDoc, options);
      // console.log(result, data)
      res.send(result);
    })
  
    app.patch("/updateappointmentstauts", async (req, res) => {

      const { id, status } = req.body;
      const filter = { _id: ObjectId(id) };
      const option = { upsert: false };
      const updateDoc = {
        $set: {
          status,
        },
      };
      const result = await allAppointmentCollection.updateOne(
        filter,
        updateDoc,
        option
      );
      res.json(result);

    });


    // admin 
    // make admin 
    app.put('/makeadmin/:email', async (req, res) => {
      const filter = { email: req.params.email };
      // console.log("put", filter)
      const options = { upsert: false };
      const updateDoc = {
        $set: {
          role: req.body.role
        },
      };
      const result = await allUsersCollection.updateOne(filter, updateDoc, options);
      res.send(result);
    });
    // check admin
    app.get('/checkadmin/:email', async (req, res) => {
      const result = await allUsersCollection.findOne({ email: req.params.email });
      let isAdmin = false
      if (result?.role == 'admin') {
        isAdmin = true
      }
      res.send({ admin: isAdmin });
    });
    // admin 


  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Welcome to travel blog server.......");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
/*update appointment status ei banan ta vul hoise */
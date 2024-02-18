const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { default: slugify } = require("slugify");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.lzichn4.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const UsersProfileCollection = client
      .db("HireMaster")
      .collection("UsersProfile");
    const ManagersProfileCollection = client
      .db("HireMaster")
      .collection("ManagersProfile");
    const jobCollection = client.db("HireMaster").collection("jobData");
    const appliedJobCollection = client
      .db("HireMaster")
      .collection("AppliedJob");
    const staticCollection = client.db("HireMaster").collection("JobPost");

    const hiringTalentCollection = client
      .db("HireMaster")
      .collection("HiringTalent");

    const userCollection = client.db("HireMaster").collection("Users");
    const UserPaymentCollection = client
      .db("HireMaster")
      .collection("Payments");
    const subscriberCollection = client
      .db("HireMaster")
      .collection("Subscribers");
    const newsCollection = client.db("HireMaster").collection("News");

    //  UserProfileCollection

    app.post("/userProfile", async (req, res) => {
      const feedbacks = req.body;
      const result = await UsersProfileCollection.insertOne(feedbacks);
      res.send(result);
    });

    app.get("/userProfile", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await UsersProfileCollection.find(query).toArray();
      res.send(result);
    });
    // app.get("/userProfile/:email", async (req, res) => {
    //   const email = req.params.email;
    //   const query = {
    //     email: email,
    //   };
    //   const result = await UsersProfileCollection.findOne(query);
    //   res.send(result);
    // });

    app.post("/jobpost", async (req, res) => {
      const job = req.body;
      const result = await jobCollection.insertOne(job);
      res.send(result);
    });
    app.get("/userProfile/:email", async (req, res) => {
      const email = req.params.email;
      const query = {
        email: email,
      };
      const result = await UsersProfileCollection.findOne(query);
      res.send(result);
    });

    // ---------Managers Profile Collection--------------
    app.post("/managerProfile", async (req, res) => {
      const newProfile = req.body;

      const existingProfile = await ManagersProfileCollection.findOne({
        email: newProfile.email,
      });

      if (existingProfile) {
        return res.send({
          message: "Already Exist, Update from profile.",
          insertedId: null,
        });
      }

      const result = await ManagersProfileCollection.insertOne(newProfile);
      res.status(201).json({ insertedId: result.insertedId });
    });

    app.get("/managerProfile", async (req, res) => {
      const result = await ManagersProfileCollection.find().toArray();
      res.send(result);
    });

    app.get("/managerProfile/:email", async (req, res) => {
      const email = req.params.email;
      const query = {
        email: email,
      };
      const result = await ManagersProfileCollection.findOne(query);
      res.send(result);
    });

    // ---------------Jobs Section-------------------
    app.post("/jobpost", async (req, res) => {
      const job = req.body;
      const result = await jobCollection.insertOne(job);
      res.send(result);
    });

    //Applied Jobs
    app.post("/users-appliedjobs", async (req, res) => {
      const appliedjobs = req.body;
      console.log(appliedjobs);
      const result = await appliedJobCollection.insertOne(appliedjobs);
      res.send(result);
    });
    // Show Applied Jobs
    app.get("/showapplied-jobs", async (req, res) => {
      const cursor = appliedJobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/singleappliedjobs/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const result = await appliedJobCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/jobpost", async (req, res) => {
      const cursor = jobCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    // app.get("/staticjobpost", async (req, res) => {
    //   const cursor = staticCollection.find();
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });
    app.get("/staticjobpost/:id", async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id),
      };
      const result = await staticCollection.findOne(query);
      res.send(result);
    });

    app.get("/staticjobpost/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { hiring_manager_email: email };
      const result = await staticCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/staticjobpost", async (req, res) => {
      const { job_title, job_time, salaryRange } = req.query;
      // console.log("Query parameters:", req.query);
      const filter = {};

      if (job_title) {
        filter.job_title = { $regex: new RegExp(job_title, "i") };
      }
      if (job_time && job_time.length > 0) {
        filter.job_time = { $in: job_time };
      }
      if (salaryRange) {
        const [minSalary, maxSalary] = salaryRange.split("-").map(Number);
        filter.salary = { $gte: minSalary, $lte: maxSalary };
      }
      // console.log("Applied filters:", filter);
      const cursor = staticCollection.find(filter);
      const result = await cursor.toArray();
      if (result.length === 0) {
        res.status(200).json({
          message:
            "No jobs found matching your criteria. Please try with different criteria.",
        });
      } else {
        res.send(result);
      }
    });

    app.patch("/UsersProfile/:id", async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          UniversityName: item.UniversityName,
        },
      };
      const result = await UsersProfileCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const isExist = await userCollection.findOne(query);
      if (isExist) {
        return res.send({ status: "user already exists" });
      }
      res.send(await userCollection.insertOne(user));
      // console.log(user);
    });

    app.post("/subscribers", async (req, res) => {
      const subscriber = req.body;
      const query = { email: subscriber.email };
      const isExist = await subscriberCollection.findOne(query);
      if (isExist) {
        return res.send({ status: "subscriber already exists" });
      }
      res.send(await subscriberCollection.insertOne(subscriber));
      // console.log(user);
    });

    //
    //
    //
    // tech news routes
    //
    app.post("/tech-news", async (req, res) => {
      const newsData = req.body;
      const slug = slugify(req.body.title);

      const isExisting = await newsCollection.findOne({ slug });
      if (isExisting) {
        return res.status(400).send({ error: "News title must be unique" });
      }
      newsData.slug = slug.toLowerCase();
      try {
        const result = await newsCollection.insertOne(newsData);
        res.json(result);
      } catch (error) {
        console.error("Error inserting news:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.get("/tech-news", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 2;
      const skip = (page - 1) * limit;
      const news = await newsCollection
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray();
      const totalNewsCount = await newsCollection.countDocuments();
      res.json({
        news,
        totalNewsCount,
        currentPage: page,
        itemsPerPage: limit,
      });
    });

    app.get("/tech-news/:slug", async (req, res) => {
      const slug = req.params.slug;
      // console.log(slug);
      try {
        const result = await newsCollection.findOne({ slug });
        if (result) {
          res.json(result);
        } else {
          res.status(404).send({ error: "News not found" });
        }
      } catch (error) {
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.delete("/tech-news/:slug", async (req, res) => {
      const slug = req.params.slug;
      try {
        const result = await newsCollection.findOneAndDelete({ slug });
        if (result) res.json(result);
        else {
          res.status(404).send({ error: "News not found" });
        }
      } catch (error) {
        console.error("Error inserting news:", error);
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.patch("/tech-news/:slug", async (req, res) => {
      const slug = req.params.slug;
      const newSlug = slugify(req.body.title);
      const newNews = req.body;
      newNews.slug = newSlug.toLowerCase();

      try {
        const result = await newsCollection.findOneAndUpdate(
          {
            slug,
          },
          { $set: newNews }
        );
        if (result) res.json(result);
        else {
          res.status(404).send({ error: "News not found" });
        }
      } catch (error) {
        res.status(500).send({ error: "Internal Server Error" });
      }
    });

    app.post("/hiring-talents", async (req, res) => {
      const hirer = req.body;
      // console.log(hirer);
      const result = await hiringTalentCollection.insertOne(hirer);
      res.send(result);
    });

    app.get("/subscribers", async (req, res) => {
      res.json(await subscriberCollection.find({}).toArray());
    });
    app.get("/hiring-talents", async (req, res) => {
      res.json(await hiringTalentCollection.find({}).toArray());
    });

    // ---------------------- Admin Dashboard ------------------------

    // pagination for user list

    app.get("/users/pagination", async (req, res) => {
      const query = req.query;
      const page = query.page;
      console.log(page);
      const pageNumber = parseInt(page);
      const perPage = 4;
      const skip = pageNumber * perPage;
      const users = userCollection.find().skip(skip).limit(perPage);
      const result = await users.toArray();
      const UsersCount = await userCollection.countDocuments();
      res.send({ result, UsersCount });
    });

    // Make Admin to User
    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const UpdatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, UpdatedDoc);
      res.send(result);
    });

    // remove admin
    app.patch("/users/remove-admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const UpdatedDoc = {
        $unset: {
          role: "",
        },
      };
      const result = await userCollection.updateOne(filter, UpdatedDoc);
      res.send(result);
    });

    // Delete Job Seeker
    app.delete("/users/JobSeeker/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // ------------------Stripe Payment--------------------

    //Payment Intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      console.log(amount);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const paymentResult = UserPaymentCollection.insertOne(payment);
      res.send(paymentResult);
    });

    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("HireMaster Server Running Successfully");
});

app.listen(port, () => {
  console.log(`HireMaster Server Running at Port ${port}`);
});

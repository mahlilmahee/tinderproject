const PORT = 8000;
require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const express = require("express");
const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());
const uri = `mongodb+srv://newuser:dfkjdofijekjfasdj@cluster0.ufugb.mongodb.net/?retryWrites=true&w=majority`;

app.get("/", (req, res) => {
  res.json("Hello to my app welcome you with a warm affection");
});

app.post("/signup", async (req, res) => {
  const client = new MongoClient(uri);

  const { email, password } = req.body;

  const generateuserId = uuidv4();
  const hashedpassword = await bcrypt.hash(password, 10);

  try {
    await client.connect();
    const database = client.db("tinderweb");
    const users = database.collection("users");

    const existingUser = await users.findOne({ email });

    if (existingUser) {
      return res.status(409).send("User already exists.plase login");
    }

    const sanitizedEmail = email.toLowerCase();

    const data = {
      user_id: generateuserId,
      email: email,
      hashed_password: hashedpassword,
    };
    const insertedUser = await users.insertOne(data);

    const token = jwt.sign(insertedUser, sanitizedEmail, {
      expiresIn: 60 * 24,
    });

    res.status(201).json({ token, userId: generateuserId, email });
  } catch (err) {
    console.log(err, "hrllo error");
  } finally {
    // await client.close();
  }
});

// express routing for login option

app.post("/login", async (req, res) => {
  const client = new MongoClient(uri);

  const { email, password } = req.body;
  try {
    const database = client.db("tinderweb");
    const users = database.collection("users");
    const user = await users.findOne({ email });
    const correctPassword = await bcrypt.compare(
      password,
      user.hashed_password
    );
    if (user && correctPassword) {
      const token = jwt.sign(user, email, {
        expiresIn: 24 * 60,
      });
      res.status(201).json({ token, email, userId: user.user_id });
    }
    res.status(401).json("Invalid Credentials");
  } catch (err) {
    console.log(err);
  } finally {
  }
});

// to update the new created account with data we are gonna write a update express routing here

app.put("/user", async (req, res) => {
  const client = new MongoClient(uri);
  // const id = req.body.user_id;
  const formData = req.body.formData;

  try {
    const database = client.db("tinderweb");
    const users = database.collection("users");

    const query = { user_id: formData.user_id };

    const updateDocument = {
      $set: {
        first_name: formData.first_name,
        dob_day: formData.dob_day,
        dob_month: formData.dob_month,
        dob_year: formData.dob_year,
        show_gender: formData.show_gender,
        gender_identity: formData.gender_identity,
        gender_interest: formData.gender_interest,
        url: formData.url,
        about: formData.about,
        matches: formData.matches,
      },
    };

    const insertedUser = await users.updateOne(query, updateDocument);
    //  console.log(insertedUser)
    res.json(insertedUser);
  } finally {
  }
});

// Get individual user
app.get("/user", async (req, res) => {
  const client = new MongoClient(uri);
  const userId = req.query.userId;

  try {
    // await client.connect()
    const database = client.db("tinderweb");
    const users = database.collection("users");

    const query = { user_id: userId };

    const user = await users.findOne(query);

    res.send(user);
  } finally {
    await client.close();
  }
});

// Update User with a match
app.put("/addmatch", async (req, res) => {
  const client = new MongoClient(uri);
  const { userId, matchedUserId } = req.body;

  try {
    // await client.connect()
    const database = client.db("tinderweb");
    const users = database.collection("users");

    const query = { user_id: userId };

    const updateDocument = {
      $push: { matches: { user_id: matchedUserId } },
    };
    const user = await users.updateOne(query, updateDocument);
    res.send(user);
  } finally {
    // await client.close()
  }
});
// now get the users full details according to their id from the matched arrays
app.get("/users", async (req, res) => {
  const client = new MongoClient(uri);
  const userIds = JSON.parse(req.query.userIds);

  try {
    const database = client.db("tinderweb");
    const users = database.collection("users");
    const pipeline = [
      {
        $match: {
          user_id: {
            $in: userIds,
          },
        },
      },
    ];
    const foundUsers = await users.aggregate(pipeline).toArray();

    res.send(foundUsers);
  } finally {
  }
});

// Get Messages by from_userId and to_userId
app.get("/messages", async (req, res) => {
  const client = new MongoClient(uri);
  const { userId, correspondingUserId } = req.query;

  try {
    // await client.connect()
    const database = client.db("tinderweb");
    const messages = database.collection("messeages");

    const query = {
      from_userid: userId,
      to_userid: correspondingUserId,
    };
    const foundMessages = await messages.find(query).toArray();
    res.send(foundMessages);
  } finally {
    // await client.close()
  }
});
// Get all the Gendered Users in the Database
app.get("/gendered-users", async (req, res) => {
  const client = new MongoClient(uri);
  const gender = req.query.gender;

  try {
    await client.connect();
    const database = client.db("tinderweb");
    const users = database.collection("users");
    const query = { gender_identity: { $eq: gender } };
    const foundUsers = await users.find(query).toArray();
    res.json(foundUsers);
  } finally {
    await client.close();
  }
});

// adding the real time messages into database lest have some fun
app.post("/message", async (req, res) => {
  const client = new MongoClient(uri);
  const message = req.body.messages;

  try {
    // await client.connect()
    const database = client.db("tinderweb");
    const messages = database.collection("messeages");

    const insertedMessage = await messages.insertOne(message);
    res.send(insertedMessage);
  } finally {
    await client.close();
  }
});

app.listen(PORT, () => console.log("server running on " + PORT));

import express from "express";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import AWS from "aws-sdk";
import cors from "cors";
import seedRouter from "./routes/seedRoutes.js";
import productRouter from "./routes/productRoutes.js";
import userRouter from "./routes/userRoutes.js";
import orderRouter from "./routes/orderRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";

// Load environment variables
dotenv.config();

// Set the AWS region globally
AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });

const getSecrets = async () => {
  const secretsManager = new AWS.SecretsManager();

  try {
    const secretValue = await secretsManager
      .getSecretValue({ SecretId: "documentDBCredsAmazona" }) // Replace with your secret name
      .promise();

    if (secretValue.SecretString) {
      return JSON.parse(secretValue.SecretString);
    } else {
      const buff = Buffer.from(secretValue.SecretBinary, "base64");
      return JSON.parse(buff.toString("ascii"));
    }
  } catch (error) {
    console.error("Error retrieving secrets from Secrets Manager:", error.message);
    throw error;
  }
};

const connectDB = async () => {
  try {
    const secrets = await getSecrets();
    const { DOCUMENTDB_USER, DOCUMENTDB_PASSWORD } = secrets;
    // const DOCUMENTDB_USER="mernamazona";
    // const DOCUMENTDB_PASSWORD="mernamazona";
    const uri = `mongodb://${DOCUMENTDB_USER}:${DOCUMENTDB_PASSWORD}@${process.env.DOCUMENTDB_URI}/?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`;

    const options = {
      tlsCAFile: "./global-bundle.pem",
    };

    console.log(`Connecting to DocumentDB at URI: ${process.env.DOCUMENTDB_URI}`);
    await mongoose.connect(uri, options);
    console.log("Connected to Amazon DocumentDB!");
  } catch (err) {
    console.error("Error connecting to Amazon DocumentDB:", err.message);
    process.exit(1);
  }
};

(async () => {
  await connectDB();

  const app = express();
  app.use(cors({
    origin: '*', // Replace '*' with specific frontend domain for stricter control
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization'
}));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (req, res) => {
    res.status(200).send("OK");
  });

  app.get("/api/keys/paypal", (req, res) => {
    res.send(process.env.PAYPAL_CLIENT_ID || "sb");
  });
  app.get("/api/keys/google", (req, res) => {
    res.send({ key: process.env.GOOGLE_API_KEY || "" });
  });

  app.use("/api/upload", uploadRouter);
  app.use("/api/seed", seedRouter);
  app.use("/api/products", productRouter);
  app.use("/api/users", userRouter);
  app.use("/api/orders", orderRouter);

  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, "/frontend/build")));
  app.get("*", (req, res) =>
    res.sendFile(path.join(__dirname, "/frontend/build/index.html"))
  );

  app.use((err, req, res, next) => {
    res.status(500).send({ message: err.message });
  });

  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
})();

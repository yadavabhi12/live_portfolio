// import { Pinecone } from "@pinecone-database/pinecone";

// import dotenv from "dotenv";
// dotenv.config();

// const pc = new Pinecone({
//   apiKey: process.env.PINECONE_API_KEY,
// });

// const index = pc.index("chat");

// async function deleteAllData() {
//   try {
//     await index.deleteAll({
//       namespace: "your-namespace", // change this
//     });

//     console.log("✅ All data deleted from namespace");
//   } catch (error) {
//     console.error("❌ Error deleting data:", error);
//   }
// }

// deleteAllData();
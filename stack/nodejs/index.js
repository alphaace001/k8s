const cluster = require("cluster");
const os = require("os");
const express = require("express");

if (cluster.isPrimary) {
  const numWorkers = os.availableParallelism?.() || os.cpus().length;
  console.log(`Primary ${process.pid} starting ${numWorkers} workers`);
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  const app = express();
  app.use(express.text());

  app.get("/", (req, res) => {
    res.json({ message: "Hello from Node.js!" });
  });

  app.post("/echo", (req, res) => {
    res.send(req.body);
  });

  app.get("/hey", (req, res) => {
    res.send("Heey there");
  });

  app.get("/compute", (req, res) => {
    function isPrime(n) {
      if (n < 2) return false;
      if (n < 4) return true;
      if (n % 2 === 0 || n % 3 === 0) return false;
      for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
      }
      return true;
    }
    let count = 0;
    for (let i = 2; i <= 50000; i++) {
      if (isPrime(i)) count++;
    }
    res.json({ primes_up_to_50000: count });
  });

  app.listen(3000, "0.0.0.0", () => {
    console.log(`Worker ${process.pid} listening on http://0.0.0.0:3000`);
  });
}

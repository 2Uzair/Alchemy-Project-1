const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { utf8ToBytes, toHex } = require("ethereum-cryptography/utils");

app.use(cors());
app.use(express.json());

const balances = {
  "7cde455607535f6da730": 100,
  "1bb66262df0ce3f3cf5a": 50,
  a9b43d78cc38f693c168: 75,
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {

  const { sender, recipient, amount, signature, senderPublicKey } = req.body;

  const uint8Pub = new Uint8Array(Object.keys(senderPublicKey).length);
  Object.values(senderPublicKey).forEach((value, i) => (uint8Pub[i] = value));

  const message = toHex(hashMessage(sender + "-" + amount + "-" + recipient));

  let parsedSign = JSON.parse(signature);
  parsedSign.r = BigInt(parsedSign.r);
  parsedSign.s = BigInt(parsedSign.s);

  const recovered = secp.secp256k1.verify(parsedSign, message, uint8Pub);

  if (!recovered) {
    res
      .status(400)
      .send({ message: "You are not the owner!" });
    return;
  }

  setInitialBalance(sender);
  setInitialBalance(recipient);

  if (balances[sender] < amount) {
    res.status(400).send({ message: "Not enough funds!" });
  } else {
    balances[sender] -= amount;
    balances[recipient] += amount;
    res.send({ balance: balances[sender] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}

const hashMessage = (message) => {
  const bytes = utf8ToBytes(message);
  return keccak256(bytes);
};
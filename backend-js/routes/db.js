import express from "express";
const router = express.Router();
import sqlite3 from "sqlite3";
const db = new sqlite3.Database("./transfers.db", (err) => {
  if (err) console.error(err);
  else console.log("Connected to db ✔️");
});
const backend_url = "http://localhost:3000";

function initDb() {
  console.log("initializing db");
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS transfers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          fromChain TEXT,
          toChain TEXT,
          fromAcc TEXT,
          toAcc TEXT,
          amount INT,
          initialFromAmount INT,
          initialToAmount INT,
          time DATE,
          status TEXT
          );`,
      (err) => {
        if (err) console.error(err);
        else console.log("Created table ✔️");
      }
    );
  });
}

initDb();

router.get("/", (req, res) => {
  return res.status(200).send({ message: "Hello from db!" });
});

router.post("/transfers", (req, res) => {
  const {
    fromChain,
    toChain,
    fromAcc,
    toAcc,
    amount,
    initialFromAmount,
    initialToAmount,
    time,
    status,
  } = req.body.transfer;
  const statement = db.prepare(`INSERT INTO transfers (
          fromChain,
          toChain,
          fromAcc,
          toAcc,
          amount,
          initialFromAmount,
          initialToAmount,
          time,
          status
          ) values (?,?,?,?,?,?,?,?,?)`);
  statement.run(
    fromChain,
    toChain,
    fromAcc,
    toAcc,
    amount,
    initialFromAmount,
    initialToAmount,
    time,
    status
  );
  statement.finalize((err) => {
    if (err) {
      console.error(err);
    } else {
      return res.status(200).send({ message: "Added" });
    }
  });
});

router.get("/oldestTransfers", (req, res) => {
  const transfers = db.all(
    `SELECT * FROM (SELECT * FROM transfers
         ORDER BY time) GROUP BY fromAcc
        `,
    [],
    (err, result) => {
      if (err) console.error(err);
      else {
        return res.status(200).send({ transfers: result });
      }
    }
  );
});

router.delete("/transfers/:id", (req, res) => {
  const { id } = req.params;
  const st = db.prepare("DELETE FROM transfers where id = ?");
  st.run(id);
  st.finalize((err) => {
    if (err) console.error(err);
    else
      return res.status(200).send({
        message: "Deleted",
      });
  });
});

router.get("/");

async function fetchSuiTokens(addr) {
  const resp = await fetch(`${backend_url}/sui/balance/${addr}`, {
    method: "GET",
  });
  if (resp.status === 200) {
    const { balance } = await resp.json();
    return Number(balance);
  }
  return undefined;
}

async function fetchEthTokens(pubKey) {
  const res = await fetch(`${backend_url}/eth/balanceOf/${pubKey}`, {
    method: "GET",
  });
  if (res.status === 200) {
    const balance = (await res.json()).balance;
    return Number(balance);
  }
  return undefined;
}

async function ethBurn(amount, fromAcc) {
  const resp = await fetch(`${backend_url}/eth/burn/${fromAcc}/${amount}`, {
    method: "GET",
  });
  if (resp.status === 200) return true;
  return false;
}

async function ethMint(amount, toAcc) {
  const resp = await fetch(`${backend_url}/eth/mint/${toAcc}/${amount}`, {
    method: "GET",
  });
  if (resp.status === 200) return true;
  return false;
}

async function suiBurn(amount) {}

async function suiMint(amount, toAcc) {
  const resp = await fetch(`${backend_url}/sui/mint/${toAcc}/${amount}`, {
    method: "GET",
  });
  if (resp.status === 200) return true;
  return false;
}

router.get("/processTransfers", async (req, res) => {
  getOldestTransfersAndDeleteNewer((transfers) => {
    processTransfers(transfers);
  });

  const processTransfers = async (transfers) => {
    for (const ts of transfers) {
      const currFromBalance =
        ts.fromChain === "eth"
          ? await fetchEthTokens(ts.fromAcc)
          : await fetchSuiTokens(ts.fromAcc);
      const currToBalance =
        ts.toChain === "eth"
          ? await fetchEthTokens(ts.toAcc)
          : await fetchSuiTokens(ts.toAcc);
      if (!currFromBalance || !currToBalance) continue;
      const intendedFromBalance = ts.initialFromAmount - ts.amount;
      const intendedToBalance = ts.initialToAmount + ts.amount;
      // db.run("BEGIN TRANSACTION");
      try {
        //WE HAVE TO BURN + MINT
        if (ts.initialFromAmount === currFromBalance) {
          console.log("we are here!");
          //BURN + MINT (ETH -> SUI)
          if (ts.fromChain === "eth") {
            let ok = await ethBurn(ts.amount, ts.fromAcc);
            if (!ok) throw new Error("Burning Eth tokens failed");
            ok = await suiMint(ts.amount, ts.toAcc);
            if (!ok) throw new Error("Minting Sui tokens failed");
            const st = db.prepare(
              `UPDATE transfers SET status = 'FINISHED' WHERE id = ?`
            );
            st.run(ts.id);
            st.finalize((err) => {
              if (err) console.error(err);
              else {
                // db.run("COMMIT");
              }
            });
          } // BURN + MINT (SUI -> ETH)
          else {
            //TODO:
            //   const ok = await suiBurn();
          }
        }
        //Transfer FAILED AFTER SUCCESFULLY BURNING => ONLY NEED TO DO MINT
        else if (
          ts.initialFromAmount === intendedFromBalance &&
          ts.initialToAmount === currToBalance
        ) {
          // MINT only (ETH -> SUI)
          if (ts.fromChain === "eth") {
            const ok = await suiMint(ts.amount, ts.toAcc);
            if (!ok) throw new Error("Minting Sui tokens failed");
            const st = db.prepare(
              `UPDATE transfers SET status = 'FINISHED' WHERE id = ?`
            );
            st.run(ts.id);
            st.finalize((err) => {
              if (err) console.error(err);
              else {
                db.run(`DELETE FROM transfers WHERE id = ${ts.id}`);
              }
            });
            // db.run("COMMIT");
          } //MINT only (SUI -> ETH)
          else {
            //TODO:
          }
        } else if (
          // DON'T HAVE TO DO ANYTHING, transfer is done
          ts.intendedFromBalance === currFromBalance &&
          ts.intendedToBalance === currToBalance
        ) {
          db.run(`DELETE FROM transfers WHERE id = ${ts.id}`);
        } else {
          db.run(`DELETE FROM transfers WHERE id = ${ts.id}`);
          throw Error(
            `Current Eth token value does not match transfer token value. ${
              ts.initialFromAmount
            } is not the same as ${currFromBalance}.
            Deleting ${JSON.stringify(ts)}.`
          );
        }
      } catch (e) {
        console.error(e);
        // db.run("ROLLBACK");
      }
    }
    return res.status(200).send({ message: "Processed" });
  };
});

function getOldestTransfersAndDeleteNewer(returnCallBack) {
  const transfers = db.all(
    `SELECT * FROM (SELECT * FROM transfers
                 ORDER BY time) GROUP BY fromAcc
                `,
    [],
    (err, queryResult) => {
      if (err) console.error(err);
      else {
        const resultIds = queryResult.map((r) => r.id);
        const resultIdsStr = JSON.stringify(resultIds);
        db.run(
          `DELETE FROM transfers WHERE id not in (${resultIdsStr.slice(
            1,
            resultIdsStr.length - 1
          )})`,
          (err) => {
            if (err) console.error(err);
            else {
              returnCallBack(queryResult);
              return;
            }
          }
        );
      }
    }
  );
}

router.get("/oldestTransfersAndDeleteNewer", (req, res) => {
  getOldestTransfersAndDeleteNewer((result) => {
    return res.status(200).send({ transfers: result });
  });
});

export default router;

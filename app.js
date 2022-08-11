const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
app.use(express.json());
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`Db Error : ${e.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();
const changingNames = (everyState) => {
  return {
    stateId: everyState.state_id,
    stateName: everyState.state_name,
    population: everyState.population,
  };
};
const changingDistrictName = (everyDistrict) => {
  return {
    districtId: everyDistrict.district_id,
    districtName: everyDistrict.district_name,
    stateId: everyDistrict.state_id,
    cases: everyDistrict.cases,
    cured: everyDistrict.cured,
    active: everyDistrict.cured,
    deaths: everyDistrict.deaths,
  };
};
app.get("/states/", async (request, response) => {
  const getQuery = `
    SELECT 
        *
    FROM 
        state`;
  const getResponse = await db.all(getQuery);
  response.send(getResponse.map((eachState) => changingNames(eachState)));
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const singleStateQuery = `
    SELECT *
    FROM state
    WHERE
        state_id=${stateId}`;
  const singleResponse = await db.get(singleStateQuery);
  response.send(changingNames(singleResponse));
});
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postQuery = `
    INSERT INTO 
        district(district_name,state_id,cases,cured,active,deaths)
    VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths})`;
  const postResponse = await db.run(postQuery);
  response.send("District Successfully Added");
});
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id=${districtId};`;
  const districtResponse = await db.get(getDistrictQuery);
  response.send(changingDistrictName(districtResponse));
});
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE FROM district
    WHERE district_id=${districtId}`;
  const deleteResponse = await db.run(deleteQuery);
  response.send("District Removed");
});
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const putQuery = `
    UPDATE district 
    SET district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
    WHERE 
        district_id = ${districtId};`;
  const putResponse = await db.run(putQuery);
  response.send("District Details Updated");
});
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const stateDetailsQuery = `
    SELECT
        SUM(cases),
        SUM(cured),
        SUM(active),
        SUM(deaths)
    FROM district
    WHERE state_id=${stateId};`;
  const stats = await db.get(stateDetailsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const finalQuery = `
    SELECT state_name
    FROM state NATURAL JOIN district
    WHERE district_id=${districtId}`;
  const finalResponse = await db.get(finalQuery);
  response.send({ stateName: finalResponse.state_name });
});
module.exports = app;

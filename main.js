const dbClient = require('./utils/db');

const waitConnection = async () => {
  let i = 0;
  while (i < 10) {
    if (dbClient.isAlive()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    i += 1;
  }
  throw new Error('Failed to connect to the database');
};

(async () => {
  console.log(dbClient.isAlive());
  await waitConnection();
  console.log(dbClient.isAlive());
  console.log(await dbClient.nbUsers());
  console.log(await dbClient.nbFiles());
})();

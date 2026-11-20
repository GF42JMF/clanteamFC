import {createClubServer} from './app.mjs';
const port=Number(process.env.PORT||3001);
createClubServer().listen(port,'0.0.0.0',()=>console.log(`Clan Team FC: http://127.0.0.1:${port}`));

const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const dbClient = require('../utils/db');
const sha1 = require('sha1');
const redisClient = require('../utils/redis');

class AuthController {
    static async getConnect(req, res) {
	try {
    

	    const authHeader = req.headers['authorization'];
	    if(!authHeader) {
		return res.status(401).json({ message: 'Authorization header missing'});
		
	    }
	    const base64Credentials = authHeader.split(' ')[1];
	    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
	    const [email, password] = credentials.split(':');
      //console.log(`User email is: ${email}`);
	    const user = await dbClient.db.collection('users').findOne ({ email });
	    if (!user) {
		return res.status(401).json({ message: "User doesn't exist" });

	    }
      
      if(user.sha1Password)
      {
        const sha1Password = sha1(password);
        if (sha1Password !== user.sha1Password) {
          return res.status(401).json({ message: 'Unauthorized: Incorrect password' });
        }
      }


	    const token = uuidv4();

	    const redisKey =  `auth_${token}`;
      const ttlInSeconds = 24 * 60 * 60; // 24 hours in seconds
      /*console.log(token);
      console.log(ttlInSeconds);
      console.log(user._id.toString());
      console.log(redisKey);
      */
	  redisClient.set(redisKey, ttlInSeconds.toString(), user._id.toString());
		return res.status(200).json({ message: `token: ${token}` });
		
      

	} catch(error)
	{

	    console.error('Error during auth', error);
	    return res.status(500).json({ message: 'Internal server error'});

	}

	
	}
	

    
    
}

module.exports  = AuthController;

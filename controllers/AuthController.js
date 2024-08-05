const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AuthController {
    static async getConnect(req, res) {
	try {
	console.log("Starting....");
	    const authHeader = req.headers['authorization'];
	    if(!authHeader) {
		return res.status(401).json({ message: 'Authorization header missing'});
		
	    }
	    const base64Credentials = authHeader.split(' ')[1];
	    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
	    const [email, password] = credentials.split(':');
	    const user = await dbClient.db.collection('users').findOne ({ email });
	    if (!user) {
		return res.status(401).json({ message: "Unauthorized" });

	    }
	    const passwordMatch = await bcrypt.compare(password, user.password);
	    if(!passwordMatch){
		return res.status(401).json({ message: "Unauthorized" });
	    }

	    const token = uuidv4();

	    const redisKey =  `auth_${token}`;

	    redisClient.set(redisKey, user._id.toString(), 'EX', 24*60*60, (err) => {
		if (err)
		{
		    console.error('Error storing token in Redis:', err);
          return res.status(500).json({ message: 'Internal server error' });
		}
		return res.status(200).json({ token: token });
	    });

	} catch(error)
	{

	    console.error('Error during auth', error);
	    return res.status(500).json({ message: 'Internal server error'});

	}

    	console.log("finished");
	
	}
	

    
    
}

module.exports  = AuthController;

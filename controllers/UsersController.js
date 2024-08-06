const {dbClient, ObjectId} = require('../utils/db');
const sha1 = require('sha1');
const redisClient = require('../utils/redis');


class UserController {
    static async postNew(req, res) {
	const {email , password } = req.body;

	if(!email)
	{
	    return res.status(400).json({ error: "Missing email" });
	}

	if (!password)
	{
	    return res.status(400).json( {error: "Missing password" });
	}

	// Check if user still exists

	const isExist = await dbClient.db.collection('users').findOne({ email });
	if (isExist)
	{
		return res.status(400).json({ error: "Already exist" });
	}

	const HashedPasswd = sha1(password);

	const newUser = {
	    email,
	    password: HashedPasswd,
	}

	await dbClient.db.collection('users').insertOne(newUser);

	return res.status(201).json({ id: newUser._id, email: newUser.email });
	
    }

  static async getMe(req, res)
  {
    try
    {
      const token = req.headers['x-token'];

      if(!token)
    {
      return res.status(401).json({error: "Unauthorized" });
    }

    const redisKey = `auth_${token}`;

      // Check if the token exists in Redis
      const userId = await redisClient.getAsync(redisKey);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // console.log('User ID retrieved from Redis:', userId);
      try
      {

        const userObjectId = new ObjectId(userId.toString());
        // console.log('objectId from mongo:', userObjectId);
        const user = await dbClient.db.collection('users').findOne({ _id: userObjectId });
        // console.log(user);
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

      

      if (!user) {
        return res.status(401).json({ message: 'Unauthorized: User not found' });
      }
      // return user data
      const userData = 
      {
        id: user._id.toString(),
        email: user.email
      }; 

      return res.status(200).json(userData);
    } catch(objectIdError)
    {
       
       console.error('Invalid ObjectId:', objectIdError);
       return res.status(400).json({ message: 'Invalid user ID format' });
    }

    } catch(error)
    { 
      console.error('Error retrieving user data:', error);
      return res.status(500).json({ message: 'Internal server error' });

    }


  }
}

module.exports = UserController;

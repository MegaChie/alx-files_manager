const dbClient = require('../utils/db');
const sha1 = require('sha1');

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
	    return res.status(400).json({ error: "User Already Exists." });
	}

	const HashedPasswd = sha1(password);

	const newUser = {
	    email,
	    password: HashedPasswd,
	}

	await dbClient.db.collection('users').insertOne(newUser);

	return res.status(201).json({ id: newUser._id, email: newUser.email });
	
    }
}

module.exports = UserController;

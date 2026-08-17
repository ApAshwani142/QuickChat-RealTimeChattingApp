import User from '../models/User.js'

async function getUsers(req, res) {
  const currentUserId = req.userId

  const users = await User.find({ _id: { $ne: currentUserId } })
    .select('_id username socketId')
    .lean()

  return res.json({
    users: users.map((u) => ({
      userId: u._id,
      username: u.username,
      isOnline: Boolean(u.socketId),
    })),
  })
}

export { getUsers }


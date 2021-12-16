var config = {}

config.endpoint = process.env.ENDPOINT;
config.key = process.env.KEY;

config.database = {
  id: 'symposium'
}

config.container = {
  id: 'users'
}

config.container2 = {
    id: 'questions'
}


config.dropbox = {client_id:process.env.CLIENT_ID, client_secret: process.env.CLIENT_SECRET};
module.exports = config

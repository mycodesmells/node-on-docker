# Creating application environment with docker-compose

You've already seen how easy and useful Docker can be. But in that previous post we assumed, that everything we need for our aplication to work resides on a single node. That is not the case in most of the applications you are (or will be) creating. The most common case is that you have two servers: one for the application itself, and one for database. Of yourse you can have many many more, but here we take a look on this minimalistic environment, which will give you the general idea how to go from here. For this we are going to use a handy tool called Docker Compose.

### What is docker-compose?

The idea behind docker-compose is incredibly simple: take few Dockerfiles, create the containers, make them talk to each other and provide a full, working environment with a pleasant, clean interface. There is little that you need to know on top of Docker itself to get started with Compose. First, let's start by installing the tool. The installation proces is quite easy and well documented on [the official page](https://docs.docker.com/compose/install/):

	$ curl -L https://github.com/docker/compose/releases/download/1.5.2/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
	$ chmod +x /usr/local/bin/docker-compose
	$ docker-compose  version
	docker-compose version 1.5.2, build 7240ff3
	...

### Use case: web application with database server

In our simple example, we would like to run a simple Node application that will connect with MongoDB server. I have locally installed Node in version 4.0.0 and MongoDB with 2.4.9, but those obviously are not the latest releases. We would like to test our app on the most recent ones, to make sure everything works just fine. Our app defines three endpoints:

- `/node` prints a version of Node that has been used to start the server
- `/mongo` prints a version of MongoDB database
- `/data` prints a set of data that is prepared to be inserted into the databse after its startup 

To get started with doing something actually useful in Compose, we need a configuration file, which most commonly is named `docker-compose.yml`. This is a YAML file, so that it is very simple and easy to read (it's often called human-readable JSON). The syntax of our file looks as follows:

	<container_name>:
		build: <path_to_Dockerfile>
		links:
			- <name_of_linked_container>
		environment:
			<env_var_name>: <env_var_value>
		ports:
			<host_port>: <container_port>

As far as naming the contaner, defining path to the Dockerfile and listing environmental variables is rather straightforward, the rest of parameters might not be as obvious. 

Let's start with port mapping in `ports` section. If your container need to communicate with the host machine, you can take one of two approaches: just define the port in `EXPOSE` section in Dockerfile and check the port to which it is mapped using `docker ps`, or define the host port manually. What is the advantage of doing it yourself? You might be developing some application that you are not going to run using Docker, but you only want to _dockerize_ database server. Then, when you start the DB, you don't want to check the port every time you start the DB and set appropriate value in your app's configuration, but rather have the port unchanged between DB restarts. This is very often used with both web application servers (to have easier access to test the app), and DB servers (to enter the database directly to see/change records).

Last, but certainly not least parameter in our template is `links`. By setting the link to `db_server` in `app_server` configuration section we allow the app server to reference it by `db_server` and its internal db port. For example, even if you are mapping MySQL's 3306 port to 13306 on th host machine, the application server can still use db_server:3306 as the link. If you don't need to access the machine from a host OS, you should stick with the links. If you do want the ability to enter, then you have a choice.

### Solution

At first glance you might think, that you are going to have two Docker images. In fact, we will be creating three. If you recall from the previous post, we stated that one Docker should have one, well-defined job it is doing. So that it is very common for database servers to mirror them with database_seed servers, which have only one job: populate the database with some data. This is exactly what we are doing:

**docker-compose.yml**:

	mongodb:
		build: mongo/.
		ports:
			- "37017:27017"

	mongo-seed:
		build: mongo-seed/.
		links:
			- mongodb

	node:
		build: node/.
		ports:
			- "13000:3000"
		links:
			- mongodb


**mongo/Dockerfile**:

	FROM mongo:3.2

**mongo-seed/Dockerfile**:

	FROM mongo:3.2

	COPY data.json /tmp/data.json

	CMD mongoimport --host mongodb --db nba --collection players --type json --file /tmp/data.json --jsonArray

**node/Dockerfile**:

	FROM node:5

	COPY app.js /tmp/app.js
	COPY package.json /tmp/package.json

	RUN cd /tmp && npm install

	CMD ["node", "/tmp/app.js"]

	EXPOSE 3000

If you look closely, you might be wondering what is the point of having `mongo/Dockerfile` configuration, if we are just using mongo:3.2 image from Docker Hub and not to anything specific. You are absolutely right, so we can remove this Docker file and make a slight change in docker-compose:

	mongodb:
		image: mongo:3.2
	...

That way we just define the name of a public image and start the container with it.

### Managing the environment

Building images:

	$ docker-compose build
	mongodb uses an image, skipping
	Building node
	...
	Successfully built dc05d103f292
	Building mongo-seed
	...
	Successfully built b3931068207

Starting the environment:

	$ docker-compose up -d // -d for starting in the background

Monitoring the processes:

	$ docker ps
	CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS                      NAMES
	519ed256d548        threenodes_node     "node /tmp/app.js"       3 minutes ago       Up 5 seconds        0.0.0.0:13000->3000/tcp    threenodes_node_1
	afb65c82732e        mongo:3.2           "/entrypoint.sh mongo"   3 minutes ago       Up 5 seconds        0.0.0.0:37017->27017/tcp   threenodes_mongodb_1

**Note** that we only have two containers running, because the _seed_ node did its job (insert the data) and exited. If you run the `docker ps` fast enough, you should be able to see it running:

	$ docker-compose up -d && docker ps
	Starting threenodes_mongodb_1
	Starting threenodes_node_1
	Starting threenodes_mongo-seed_1
	CONTAINER ID        IMAGE                   COMMAND                  CREATED             STATUS                  PORTS                      NAMES
	efeab76626f4        threenodes_mongo-seed   "/entrypoint.sh /bin/"   2 minutes ago       Up Less than a second   27017/tcp                  threenodes_mongo-seed_1
	519ed256d548        threenodes_node         "node /tmp/app.js"       3 minutes ago       Up Less than a second   0.0.0.0:13000->3000/tcp    threenodes_node_1
	afb65c82732e        mongo:3.2               "/entrypoint.sh mongo"   3 minutes ago       Up Less than a second   0.0.0.0:37017->27017/tcp   threenodes_mongodb_1

Stopping the environment:

	$ docker-compose kill

Deleting the processes:

	$ docker-compose rm -f // -f prevents Compose from asking for your confirmation

### Final result

	$ curl -w "\n" localhost:13000/node
	This app is using node version: v5.1.1

	$ curl -w "\n" localhost:13000/mongo
	This app is connected with MongoDB version 3.2.0-rc6

	$ curl -w "\n" localhost:13000/data // a little pretty-print of the output
	[{"_id":"5669e2c2f0a596f89a746ac5","name":"Steph Curry","position":"PG","team":"GSW"},
	{"_id":"5669e2c2f0a596f89a746ac6","name":"Kevin Durant","position":"SF","team":"SF"},
	{"_id":"5669e2c2f0a596f89a746ac7","name":"Drayomond Green","position":"PF","team":"GSW"},
	{"_id":"5669e2c2f0a596f89a746ac8","name":"Kobe Bryant","position":"SG","team":"LAL"},
	{"_id":"5669e2c2f0a596f89a746ac9","name":"Anthony Davis","position":"C","team":"NOH"}]

	$ mongo localhost:37017
	...
	connecting to: localhost:37017/test
	...
	> use nba
	switched to db nba
	> db.players.find()
	{ "_id" : ObjectId("5669e2c2f0a596f89a746ac5"), "name" : "Steph Curry", "position" : "PG", "team" : "GSW" }
	{ "_id" : ObjectId("5669e2c2f0a596f89a746ac6"), "name" : "Kevin Durant", "position" : "SF", "team" : "SF" }
	{ "_id" : ObjectId("5669e2c2f0a596f89a746ac7"), "name" : "Drayomond Green", "position" : "PF", "team" : "GSW" }
	{ "_id" : ObjectId("5669e2c2f0a596f89a746ac8"), "name" : "Kobe Bryant", "position" : "SG", "team" : "LAL" }
	{ "_id" : ObjectId("5669e2c2f0a596f89a746ac9"), "name" : "Anthony Davis", "position" : "C", "team" : "NOH" }
	> db.version()
	3.2.0-rc6

The source code of this example is also available on [GitHub](https://github.com/mycodesmells/node-on-docker).

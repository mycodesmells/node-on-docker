# Getting started with Docker

When you look at the development of an application, you can distinguish several different periods. You generally start with some analysis of the problem you want to solve, then you think about the way you want to do it. Then you go through the development itself, testing, deployment onto the support/service. We generally are focusing writing code, sometimes on writing and running tests. When it comes to the deployment, this should take so little time, right? So why is that this is what most of the developers are most afraid of? What would happen if some of your dependency fail? Well, with Docker you can have the whole environment running in order to see if the latest database version won't break your build.

# What is Docker?

We must start with explainint what Docker is, before diving into the simplest of examples of it. It is a solution for packaging your application and all of its dependencies in a way that can be transported between machines and run the same way in every place. The authors and the community compare Docker to the containers that are used when moving various types of goods on ships all over the world. Actually, they stick with the term _container_ when talking about running Docker images.

How does it work? Well, at a first glance, Docker containers are very similar in use as virtual machines. You need to have some configuration that contains information about the OS, installed applications and the way this entity will communicate with outside world. Now how it is different? First of all, it si soo lightweight! How come? When running a VM, you have a separate instance of OS running within your host. With Docker, you create an image that shares the kernel with your host, so that the container iself is running only the processes you want it to. Nothing unnecessary will happen now. The downside is quite obvious here - you cannot run Linux Docker container on Windows host, whereas you can using full-sized VM. But well, if you are not using Windows for your development, you are good to go. Let's see in practice how can you use Docker, shall we?

# The Example - Node application with whatever version

Imagine we have a Node application, that has been built with the good old 0.10.25 version. This is pretty old, but that's how it goes sometimes. Now if you follow the Nod community, you might know that the latest version released is already 5.2. You would be very naive to think that everything will run smoothly on both versions. Actually it might, but you can't be really 100% sure. This is a perfect place for you to use a Docker container. You can have the application run in various environments so that you can see how it behaves.

Our application will be a very simple HTTP server, which will respond ot any request with the Node version that is used to run the script:
 
    var http = require('http');
    
    var server = http.createServer(function(req, res){
        res.end("This app is using node version: " + process.version);
    });
    
    server.listen(3000);

We won't debate the differences between Node versions - we just want to see the response change.

# Docker elements - images and containers

First we need to explain basic Docker terms: images and containers. You may already know what those are, basing on what was written above. Long story short, images are the definitions of the environment we want to run: the OS, initialization scripts, main process that is being run. The contianer can be described as a single run of an image. A container to an image is like an instance to its class.

Let's start then with the installation of Docker:

    wget -qO- https://get.docker.com/ | sh
    
After that we should have a docker _deamon_ ready to use on our host machine:

    $ docker
    Usage: docker [OPTIONS] COMMAND [arg...]
    
    ...
    
    Run 'docker COMMAND --help' for more information on a command.

# Building your first image

Building every Docker image starts with a Dockerfile. This is the description of the image and everything that is going to happen within it. The most important rule is to build your images on top of existing ones. There is a huge images repository to look through, called [Docker Hub](https://hub.docker.com/). We will do just that: we'll build on top of the image provided by Node. Our first line of Dockerfile says:

    FROM node:5
    
This means, that Docker will look for the image called `node` and a specific version tagged as `5`. It will fetch it and apply everything we have defined below that to that image. In fact, the `node:5` image is build on top of another image and so on. Just like I explain above - reuse, reuse, reuse! Now, you'd expect the image provided by node to have the Node preinstalled, and it surely is. All we need to to is to copy our script onto the container:

    COPY app.js /tmp/app.js

and run it:

    CMD ["node", "/tmp/app.js"]
    
This seems to be all, but in fact it isn't. By default all the ports for docker container are not available to the host machine. We can define them when starting it up, but more convenient way is to define them in Dockerfile. This way instead of listing the ports manually, we'll just tell Docker to open all ports that we wanted to:

    EXPOSE 3000
    
**Note:** There are two ways you can run a command from Dockerfile: `RUN` and `CMD`. The difference lays in the idea, that a single container should have one, main process. For example, when building an image of the database, the DB should be the only thing running there. If you have a container running the web application, the app server shoule be the one. Now, the `RUN` should be used for all configuration and pre-run commands, such as all apt-get's calls etc. `CMD` defines the main process we want to be running. In our case - running our node application.

All we have left is to build the image. We will provide a name to it (by default it would be nameless which is quite annoying to work with). Don't worry if the first build takes a while - it will downoad the images and run the commands:

    $ docker build -t node-on-docker .

    ...

    Step 0 : FROM node:5
     ---> f4f9d485a905
    Step 1 : COPY app.js /tmp/app.js
     ---> Using cache
     ---> 161e02d04342
    Step 2 : CMD node /tmp/app.js
     ---> Using cache
     ---> 3253c411e335
    Step 3 : EXPOSE 3000
     ---> Using cache
     ---> b7353bbff149
    Successfully built b7353bbff149

You can see, that everyting defined in our Dockerfile is happening. The image is being downloaded, file is copied, server has started and the port is opened. The last line defines the ID of our image. Fortunately, you don't need to remember it, as we defined a name for it. Just need to list the images we have built:

    $ docker images
    REPOSITORY          TAG                 IMAGE ID            CREATED             VIRTUAL SIZE
    node-on-docker      latest              b7353bbff149        About an hour ago   641.8 MB
    node                5                   f4f9d485a905        2 days ago          641.8 MB

# Running the container

Before we start our application on Docker container, let's take a look on how our app behaves on the host machine:

    $ node app.js &
    $ curl localhost:3000
    This app is using node version: v0.10.25

Now, let's take a look on how to do the same using Docker:

    $ docker run -dP node-on-docker 
    dce912deacb39e424b539e6c8f17b8549ba99e072160ae8104dcd680d0002728
    
You can see how easy it is? We need to provide the name of the image and two flags: `d` stands for running the container in the background, and `P` stands for opening all ports defined in `EXPOSE` section in Dockerfile. The result of the command is the monstrous hash, which is the ID of our container. But don't worry, you still don't need to remember it, as you can also list all docker container currently running:

    $ docker ps
    CONTAINER ID        IMAGE                   COMMAND              CREATED              STATUS              PORTS                     NAMES
    dce912deacb3        node-on-docker:latest   "node /tmp/app.js"   About a minute ago   Up About a minute   0.0.0.0:32774->3000/tcp   kickass_lovelace    

There are a couple of thins you get from this output. First is the ID of the container, which comes in handy when you need to eg. stop it. The second one is the port mapping. You can see, that the container's 3000 port is available on 32774 of the host. You can test it:
    
    $ curl localhost:32774
    This app is using node version: v5.1.1 
  
As you can see, the single application can be now easily tested on various environments. 

The source code of this example is also available on [GitHub](https://github.com/mycodesmells/node-on-docker).
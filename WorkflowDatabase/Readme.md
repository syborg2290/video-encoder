### First, execute the bash inside the container

- docker exec -it workflow-db bash

### Now we can login. For the admin

- mongo -u mveroot -p 2020minivideoencoder!

### For the your_user you have to specify the db (with the --authenticationDatabase) otherwise you'll have an auth error

- mongo -u mveroot -p 2020minivideoencoder! --authenticationDatabase admin
- mongo -u mveroot -p 2020minivideoencoder! --authenticationDatabase workflow-db


### After that, you should switch to the right db with

- use workflow-db

- docker-compose up

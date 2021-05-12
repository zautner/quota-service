## ENV
    for this server to run, you must have dotenv files
    our env files are in 1password - search for quotas envs.
    copy the files under ./config.
    expected files names are:
    .test.env
    .prod.env
    .stage.env
    .preprod.env
## Test
    you must run docker for the tests.
    run docker file and then run the container.
    npm test ./test

    * DON'T FORGET TO ADD THE ENV FILE FOR TESTING

All tests are in the `test` folder.